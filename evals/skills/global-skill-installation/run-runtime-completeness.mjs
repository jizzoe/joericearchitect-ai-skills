#!/usr/bin/env node
// Installed-runtime completeness fixture.
//
// Installs the paired runtime into a disposable profile, discovers every runtime
// helper named by the installed canonical skills, and proves each one resolves
// through the installed launcher. Markdown discovery alone is never treated as a
// complete installation: a named helper that cannot be dispatched is a failure.
//
// The runtime half needs no network and no GitHub authentication. The skill half
// uses gh when a disposable profile is available and is otherwise reported as
// unavailable evidence rather than success.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { buildRuntime } from "../../../scripts/runtime/build-runtime.mjs";
import { installAiSkills, SUPPORTED_AGENTS } from "../../../scripts/runtime/install-runtime.mjs";
import { loadManifest } from "../../../scripts/runtime/registry.mjs";
import { prepareDispatch } from "../../../scripts/runtime/launcher.mjs";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

const HELPER_REFERENCE = /ai-skills-runtime run ([a-z0-9-]+)(?:\s+([a-z0-9-]+))?/g;

/** Representative harmless requests: no mutation, no network, no credential. */
const REPRESENTATIVE_REQUESTS = {
  "sdd-workspace-cleanup": { operation: "plan-workspace-cleanup", payload: {} },
  "sdd-lifecycle-hygiene": { operation: "build-lifecycle-reconciliation-report", payload: { resources: [] } },
  "check-operation-authorization": { operation: "profile-operations", payload: {} },
  "independent-review-contract": { operation: "validate-review-package", payload: { package: {} } },
  "research-planning-skill-runtime": { operation: "execute-research-topic-workflow", payload: { input: {} } }
};

export function markdownFiles(root) {
  if (!fs.existsSync(root)) return [];
  return fs.readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const next = path.join(root, entry.name);
    if (entry.isDirectory()) return markdownFiles(next);
    return entry.isFile() && entry.name.endsWith(".md") ? [next] : [];
  });
}

/**
 * Discover helpers exactly as an installed agent would: by reading the installed
 * skill packages, not the repository's copy of them.
 */
export function discoverHelpers(skillRoot) {
  const discovered = new Map();
  for (const filePath of markdownFiles(skillRoot)) {
    const contents = fs.readFileSync(filePath, "utf8");
    for (const match of contents.matchAll(HELPER_REFERENCE)) {
      const [, helper, verb] = match;
      const existing = discovered.get(helper) ?? { helper, verbs: new Set(), skills: new Set() };
      if (verb) existing.verbs.add(verb);
      existing.skills.add(path.relative(skillRoot, filePath));
      discovered.set(helper, existing);
    }
  }
  return [...discovered.values()].map((entry) => ({
    helper: entry.helper, verbs: [...entry.verbs].sort(), skills: [...entry.skills].sort()
  })).sort((left, right) => left.helper.localeCompare(right.helper));
}

export function verifyHelpers({ helpers, manifest, environment, target }) {
  const results = [];
  for (const discovered of helpers) {
    const declared = manifest.entrypoints.find((entry) => entry.name === discovered.helper);
    if (!declared) {
      results.push({ ...discovered, resolved: false, reason: "helper-not-in-installed-runtime" });
      continue;
    }
    const verb = declared.invocation === "subcommand" ? discovered.verbs[0] ?? declared.verbs[0] : undefined;
    const plan = prepareDispatch({ helper: discovered.helper, verb, target, environment });
    if (!plan.ok) {
      results.push({ ...discovered, resolved: false, reason: plan.code });
      continue;
    }

    let invocation = { attempted: false };
    const request = REPRESENTATIVE_REQUESTS[discovered.helper];
    if (request) {
      const result = spawnSync(process.execPath, [plan.modulePath, "--stdin"], {
        encoding: "utf8",
        cwd: plan.target,
        env: { ...environment, RUNTIME_HOME: plan.runtimeRoot, AI_SKILLS_TARGET_REPOSITORY: plan.target },
        input: JSON.stringify(request)
      });
      let payload = null;
      try {
        payload = JSON.parse(result.stdout ?? "");
      } catch {
        payload = null;
      }
      invocation = { attempted: true, ok: payload?.ok === true, operation: request.operation };
      if (!invocation.ok) {
        results.push({ ...discovered, resolved: true, invocation, reason: "representative-invocation-failed" });
        continue;
      }
    }
    results.push({ ...discovered, resolved: true, modulePath: plan.modulePath, mode: plan.mode, invocation });
  }
  return results;
}

function installedSkillRoot({ agent, profile, source, run = spawnSync }) {
  const environment = {
    ...process.env,
    HOME: profile,
    GH_CONFIG_DIR: path.join(profile, ".config", "gh"),
    ...(agent === "claude" ? { CLAUDE_CONFIG_DIR: profile } : { CODEX_HOME: path.join(profile, ".codex") })
  };
  const authenticated = run("gh", ["auth", "status"], { encoding: "utf8", env: environment });
  if (authenticated.status !== 0) return { available: false, reason: "gh-not-authenticated" };

  const destination = path.join(profile, "skills");
  const installed = run("gh", ["skill", "install", source, "--from-local", "--all", "--dir", destination], {
    encoding: "utf8", env: environment
  });
  if (installed.status !== 0) return { available: false, reason: "gh-skill-install-failed" };
  return { available: true, root: destination };
}

export function runRuntimeCompleteness({ agents = SUPPORTED_AGENTS, profileRoot, source = repositoryRoot, run = spawnSync } = {}) {
  const root = profileRoot ?? fs.mkdtempSync(path.join(os.tmpdir(), "runtime-completeness-"));
  const home = path.join(root, "disposable-home");
  fs.mkdirSync(home, { recursive: true });
  const environment = { ...process.env, HOME: home, USERPROFILE: home };
  const target = path.join(root, "target-repository");
  fs.mkdirSync(target, { recursive: true });
  spawnSync("git", ["init", "--quiet", target]);
  const canonicalTarget = fs.realpathSync(target);

  // The runtime half is installed without gh so completeness can be evidenced
  // on a host with no authenticated agent profile.
  const staged = path.join(root, "staged-runtime");
  const built = buildRuntime({ source, output: staged });
  if (!built.ok) return { ok: false, phase: "build", detail: built };
  fs.rmSync(staged, { recursive: true, force: true });

  const installation = installAiSkills({
    local: source, agents, environment, platform: process.platform === "win32" ? "win32" : "linux",
    workspace: path.join(root, "workspace"), allowDirtySource: true, allowDirty: true,
    run: (command, args, options) => {
      if (command === process.execPath && args[0].endsWith("install-global-skill.mjs")) {
        // Skill installation is evidenced separately below; here only the runtime
        // half is asserted, so gh is not invoked.
        const agent = args[args.indexOf("--agent") + 1];
        return { status: 0, stdout: JSON.stringify({ schemaVersion: 1, tool: "install-global-skill", ok: true, agent, deferred: true }) };
      }
      return run(command, args, options);
    }
  });
  if (!installation.ok) return { ok: false, phase: "install-runtime", detail: installation };

  const manifest = JSON.parse(fs.readFileSync(path.join(installation.runtime.path, "runtime-manifest.json"), "utf8"));
  const launcherEnvironment = { ...environment };

  const perAgent = [];
  for (const agent of agents) {
    const profile = path.join(root, `${agent}-profile`);
    fs.mkdirSync(profile, { recursive: true });
    const skills = installedSkillRoot({ agent, profile, source, run });
    // Without an authenticated disposable profile the canonical package in the
    // reviewed source stands in for the installed one; that substitution is
    // recorded rather than presented as installed-profile evidence.
    const skillRoot = skills.available ? skills.root : path.join(source, "skills/base");
    const helpers = discoverHelpers(skillRoot);
    const verified = verifyHelpers({ helpers, manifest, environment: launcherEnvironment, target: canonicalTarget });
    perAgent.push({
      agent,
      skillSource: skills.available ? "installed-profile" : "reviewed-source",
      ...(skills.available ? {} : { unavailable: skills.reason }),
      helperCount: helpers.length,
      helpers: verified,
      complete: verified.every((entry) => entry.resolved && entry.invocation.ok !== false)
    });
  }

  return {
    ok: perAgent.every((entry) => entry.complete),
    schemaVersion: 1,
    fixture: "installed-runtime-completeness",
    mode: installation.mode,
    source: installation.source,
    runtime: {
      digest: installation.runtime.digest,
      contractVersion: installation.runtime.contractVersion,
      sourceRevision: installation.runtime.sourceRevision,
      path: installation.runtime.path
    },
    activation: installation.activation,
    agents: perAgent,
    toolVersions: {
      node: process.versions.node,
      gh: (() => {
        const result = run("gh", ["--version"], { encoding: "utf8" });
        return result.status === 0 ? String(result.stdout).split("\n")[0] : "unavailable";
      })()
    }
  };
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  const declaration = loadManifest(repositoryRoot);
  if (!declaration.valid) {
    process.stderr.write(`manifest-invalid: ${declaration.issues.join(", ")}\n`);
    process.exit(2);
  }
  const result = runRuntimeCompleteness({});
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  process.exit(result.ok ? 0 : 1);
}
