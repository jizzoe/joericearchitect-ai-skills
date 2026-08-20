#!/usr/bin/env node
// Paired skill and runtime installation.
//
// The Bash and PowerShell entrypoints own host path, process, and quoting
// mechanics only; this module owns build, activation, retention, and the
// machine-readable receipt, and delegates every gh invocation to the existing
// scripts/skills/install-global-skill.mjs utility.
//
// It never edits a shell startup file or PATH: activation state is reported.

import fs from "node:fs";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";

import { BUILT_MANIFEST_FILENAME, REQUIRED_NODE_MAJOR, isMainModule, nodeVersionSupported } from "./registry.mjs";
import { redactCredential } from "../skills/install-global-skill.mjs";
import { buildRuntime } from "./build-runtime.mjs";
import {
  METADATA_SCHEMA_VERSION, activationState, appendInstalledHistory, previouslyActive,
  readActiveMetadata, readInstalledHistory, runtimePaths, writeJsonAtomically
} from "./runtime-home.mjs";

export const RECEIPT_SCHEMA_VERSION = 1;
export const SUPPORTED_AGENTS = ["claude", "codex"];

const text = (value) => typeof value === "string" && value.trim().length > 0;
const commit = /^[0-9a-f]{40}$/;

function receipt(fields) {
  return { schemaVersion: RECEIPT_SCHEMA_VERSION, tool: "install-ai-skills", ...fields };
}

export function failure({ phase, code, detail, recovery, ...rest }) {
  return receipt({ ok: false, phase, code, ...(detail === undefined ? {} : { detail }), recovery: recovery ?? null, ...rest });
}

export function preflightNode(version = process.versions.node) {
  return nodeVersionSupported(version)
    ? { ok: true, version }
    : { ok: false, code: "node-version-unsupported", detail: { required: `>=${REQUIRED_NODE_MAJOR}`, active: version } };
}

/**
 * A remote source must name an exact tag or commit; an unpinned remote source is
 * refused rather than resolved to whatever the default branch holds.
 */
export function resolveSource({ local, remote, pin, allowDirty = false, git = execFileSync }) {
  if (text(local) && text(remote)) return { ok: false, code: "source-mode-ambiguous" };
  if (text(local)) {
    if (!path.isAbsolute(local)) return { ok: false, code: "local-source-not-absolute", detail: local };
    if (!fs.existsSync(path.join(local, "scripts/runtime/manifest.json"))) {
      return { ok: false, code: "local-source-not-a-runtime-checkout", detail: local };
    }
    let revision = null;
    let clean = false;
    try {
      revision = git("git", ["-C", local, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
      clean = git("git", ["-C", local, "status", "--porcelain"], { encoding: "utf8" }).trim().length === 0;
    } catch {
      return { ok: false, code: "local-source-revision-unavailable", detail: local };
    }
    if (!clean && !allowDirty) {
      return { ok: false, code: "local-source-unclean", detail: local, recovery: "commit the checkout or pass the documented development override" };
    }
    return { ok: true, kind: "local", reference: local, path: local, revision, clean };
  }
  if (text(remote)) {
    if (!text(pin)) return { ok: false, code: "remote-source-unpinned", recovery: "supply --pin <tag-or-commit>" };
    return { ok: true, kind: "remote", reference: remote, pin };
  }
  return { ok: false, code: "source-required", recovery: "supply --local <checkout> or --remote <owner/repo> --pin <ref>" };
}

/**
 * Obtain a temporary checkout at the exact pinned revision so the runtime and
 * the skills come from one resolved source revision.
 */
export function materializeRemoteSource(source, { workspace, run = spawnSync }) {
  const destination = path.join(workspace, "source");
  const cloned = run("gh", ["repo", "clone", source.reference, destination, "--", "--quiet"], { encoding: "utf8" });
  if (cloned.status !== 0) return { ok: false, code: "remote-source-unavailable", detail: source.reference };
  const checkedOut = run("git", ["-C", destination, "checkout", "--quiet", source.pin], { encoding: "utf8" });
  if (checkedOut.status !== 0) return { ok: false, code: "remote-pin-unresolvable", detail: source.pin };
  let revision = null;
  try {
    revision = execFileSync("git", ["-C", destination, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  } catch {
    return { ok: false, code: "remote-source-revision-unavailable", detail: source.pin };
  }
  return { ok: true, path: destination, revision };
}

export function launcherShim(platform, paths) {
  if (platform === "win32") {
    return [
      "@echo off",
      "setlocal",
      `for /f "usebackq delims=" %%i in (\`node -e "process.stdout.write(require(process.env.USERPROFILE+'\\\\.ai-skills\\\\runtime\\\\active.json').activePath)"\`) do set ACTIVE=%%i`,
      'if "%ACTIVE%"=="" (echo runtime-not-installed 1>&2 & exit /b 1)',
      'node "%ACTIVE%\\scripts\\runtime\\launcher.mjs" %*'
    ].join("\r\n") + "\r\n";
  }
  return [
    "#!/usr/bin/env sh",
    "# Resolves the active runtime on every invocation so activation and",
    "# rollback take effect without reinstalling this shim.",
    "set -e",
    `ACTIVE_METADATA="${paths.activePath}"`,
    'if [ ! -f "$ACTIVE_METADATA" ]; then echo "runtime-not-installed: $ACTIVE_METADATA" >&2; exit 1; fi',
    'ACTIVE="$(node -e \'process.stdout.write(JSON.parse(require("fs").readFileSync(process.argv[1],"utf8")).activePath)\' "$ACTIVE_METADATA")"',
    'exec node "$ACTIVE/scripts/runtime/launcher.mjs" "$@"'
  ].join("\n") + "\n";
}

/** GitHub CLI may print human advisory lines before the final JSON receipt. */
export function parseSkillInstallResult(stdout) {
  if (typeof stdout !== "string") return null;
  try { return JSON.parse(stdout); } catch { /* fall through to the final JSON object */ }
  for (let index = stdout.lastIndexOf("\n{"); index >= 0; index = stdout.lastIndexOf("\n{", index - 1)) {
    try { return JSON.parse(stdout.slice(index + 1)); } catch { /* try an earlier object boundary */ }
  }
  return null;
}

export function installSkills({ agents, source, force, dryRun, repositoryRoot, run = spawnSync }) {
  const results = [];
  for (const agent of agents) {
    const args = [
      path.join(repositoryRoot, "scripts/skills/install-global-skill.mjs"),
      ...(source.kind === "local" ? ["--local", source.path] : ["--remote", source.reference, "--pin", source.pin]),
      "--all", "--agent", agent, "--result"
    ];
    if (force) args.push("--force");
    if (dryRun) args.push("--dry-run");
    const result = run(process.execPath, args, { encoding: "utf8" });
    const parsed = parseSkillInstallResult(result.stdout ?? "");
    if (!parsed) return { ok: false, code: "skill-install-result-unreadable", detail: agent, results };
    results.push(parsed);
    if (!parsed.ok) return { ok: false, code: "skill-install-failed", detail: agent, results };
  }
  return { ok: true, results };
}

export function currentSkillPin({ agents, run = spawnSync }) {
  for (const agent of agents) {
    const listed = run("gh", ["skill", "list", "--agent", agent, "--json"], { encoding: "utf8" });
    if (listed.status !== 0) continue;
    try {
      const parsed = JSON.parse(listed.stdout ?? "[]");
      const skills = Array.isArray(parsed) ? parsed : parsed?.skills ?? [];
      const pin = skills.map((skill) => skill?.pin ?? skill?.revision).find(text);
      if (pin) return pin;
    } catch {
      // A listing this installer cannot parse simply yields no recorded pin.
    }
  }
  return null;
}

export function installAiSkills({
  local, remote, pin, agents = SUPPORTED_AGENTS, force = false, dryRun = false, allowDirty = false,
  environment = process.env, platform = process.platform, workspace, now = new Date().toISOString(),
  run = spawnSync, git = execFileSync, nodeVersion = process.versions.node
} = {}) {
  const node = preflightNode(nodeVersion);
  if (!node.ok) return failure({ phase: "preflight", code: node.code, detail: node.detail, recovery: "install Node 20 or newer" });

  const unsupported = agents.filter((agent) => !SUPPORTED_AGENTS.includes(agent));
  if (agents.length === 0 || unsupported.length > 0) {
    return failure({ phase: "preflight", code: "agent-not-supported", detail: unsupported, recovery: `select from ${SUPPORTED_AGENTS.join(", ")}` });
  }

  const paths = runtimePaths(environment, platform);
  if (!paths.valid) return failure({ phase: "preflight", code: "runtime-home-unavailable", detail: paths.reason });

  const source = resolveSource({ local, remote, pin, allowDirty, git });
  if (!source.ok) return failure({ phase: "source", code: source.code, detail: source.detail, recovery: source.recovery });

  const priorActive = readActiveMetadata(paths);
  const priorSkillPin = dryRun ? null : currentSkillPin({ agents, run });

  let sourcePath = source.path;
  let sourceRevision = source.revision ?? null;
  if (source.kind === "remote") {
    if (!text(workspace)) return failure({ phase: "source", code: "remote-workspace-required" });
    const materialized = materializeRemoteSource(source, { workspace, run });
    if (!materialized.ok) return failure({ phase: "source", code: materialized.code, detail: materialized.detail });
    sourcePath = materialized.path;
    sourceRevision = materialized.revision;
  }

  const base = {
    agents: [...agents],
    // A remote reference can carry an embedded credential, and this receipt is
    // retained as delivery evidence, so it is redacted before it is recorded.
    source: { kind: source.kind, reference: redactCredential(source.reference), revision: sourceRevision, pin: source.pin ?? null },
    overwriteIntent: force === true,
    dryRun: dryRun === true,
    priorSkillPin,
    paths: {
      base: paths.base, runtimeRoot: paths.runtimeRoot, binDirectory: paths.binDirectory,
      launcherPath: paths.launcherPath, activePath: paths.activePath, installedPath: paths.installedPath
    }
  };

  // The runtime is built and validated before any user-visible state changes, so
  // a failed build never disturbs the currently active runtime.
  const stagingOutput = path.join(workspace ?? paths.runtimeRoot, `staged-runtime-${process.pid}`);
  fs.rmSync(stagingOutput, { recursive: true, force: true });
  const built = buildRuntime({ source: sourcePath, output: stagingOutput, now, run, git });
  if (!built.ok) {
    return failure({
      phase: "build", code: built.code, detail: built.detail, ...base,
      recovery: "the previously active runtime remains active",
      runtime: priorActive ? { activeRetained: priorActive.activePath, digest: priorActive.digest } : null
    });
  }

  const identity = {
    contractVersion: built.manifest.contractVersion,
    sourceRevision: source.kind === "remote" && commit.test(sourceRevision ?? "") ? sourceRevision : built.manifest.sourceRevision,
    digest: built.manifest.digest,
    builtAt: built.manifest.builtAt
  };
  const versionPath = paths.versionDirectory(identity.digest);

  if (dryRun) {
    fs.rmSync(stagingOutput, { recursive: true, force: true });
    const skills = installSkills({ agents, source: { ...source, path: sourcePath }, force, dryRun, repositoryRoot: sourcePath, run });
    return receipt({
      ok: skills.ok, phase: "dry-run", mode: "installed", ...base,
      runtime: { ...identity, path: versionPath, priorPath: previouslyActive(paths)?.path ?? null },
      activation: activationState(paths, environment, platform),
      skills: skills.results,
      recovery: null,
      ...(skills.ok ? {} : { code: skills.code, detail: skills.detail })
    });
  }

  const skills = installSkills({ agents, source: { ...source, path: sourcePath }, force, dryRun, repositoryRoot: sourcePath, run });
  if (!skills.ok) {
    fs.rmSync(stagingOutput, { recursive: true, force: true });
    return failure({
      phase: "skills", code: skills.code, detail: skills.detail, ...base, skills: skills.results,
      recovery: "the previously active runtime remains active and no runtime was activated"
    });
  }

  try {
    if (fs.existsSync(versionPath)) {
      // The digest already names this content. Reuse it only when it carries a
      // manifest; an occupied directory without one is never activated, with or
      // without overwrite intent.
      if (!fs.existsSync(path.join(versionPath, BUILT_MANIFEST_FILENAME))) {
        fs.rmSync(stagingOutput, { recursive: true, force: true });
        return failure({
          phase: "activate", code: "runtime-version-directory-occupied", detail: versionPath, ...base,
          skills: skills.results,
          recovery: priorActive ? `previously active runtime retained at ${priorActive.activePath}` : "no runtime was activated"
        });
      }
      fs.rmSync(stagingOutput, { recursive: true, force: true });
    } else {
      fs.mkdirSync(path.dirname(versionPath), { recursive: true });
      // One rename promotes the validated staging directory: activation is
      // atomic and a partially written version is never observable.
      fs.renameSync(stagingOutput, versionPath);
    }

    fs.mkdirSync(paths.binDirectory, { recursive: true });
    fs.writeFileSync(paths.launcherPath, launcherShim(platform, paths), { mode: 0o755 });

    appendInstalledHistory(paths, { ...identity, path: versionPath, activatedAt: now, priorSkillPin, agents: [...agents] });
    writeJsonAtomically(paths.activePath, {
      schemaVersion: METADATA_SCHEMA_VERSION, activePath: versionPath, mode: "installed", activatedAt: now, ...identity
    });
  } catch (error) {
    fs.rmSync(stagingOutput, { recursive: true, force: true });
    return failure({
      phase: "activate", code: "runtime-activation-failed", detail: error?.message, ...base, skills: skills.results,
      recovery: priorActive ? `previously active runtime retained at ${priorActive.activePath}` : "no runtime was activated"
    });
  }

  const retained = readInstalledHistory(paths).history
    .map((entry) => entry.path)
    .filter((entry, index, all) => all.indexOf(entry) === index);

  return receipt({
    ok: true, phase: "complete", mode: "installed", ...base,
    runtime: { ...identity, path: versionPath, priorPath: priorActive?.activePath ?? null, retained },
    activation: activationState(paths, environment, platform),
    skills: skills.results,
    recovery: null
  });
}

export function parseArgs(argv) {
  const args = { agents: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--local") args.local = path.resolve(argv[++index]);
    else if (arg === "--remote") args.remote = argv[++index];
    else if (arg === "--pin") args.pin = argv[++index];
    else if (arg === "--agent") args.agents.push(argv[++index]);
    else if (arg === "--workspace") args.workspace = path.resolve(argv[++index]);
    else if (arg === "--force") args.force = true;
    else if (arg === "--dry-run") args.dryRun = true;
    else if (arg === "--allow-dirty-source") args.allowDirty = true;
    else if (arg === "--help" || arg === "-h") args.help = true;
    else throw new Error(`unexpected argument: ${arg}`);
  }
  if (args.agents.length === 0) args.agents = [...SUPPORTED_AGENTS];
  return args;
}

const USAGE = `usage: install-runtime.mjs (--local <checkout> | --remote <owner/repo> --pin <ref>)
                          [--agent claude] [--agent codex] [--force] [--dry-run]
                          [--allow-dirty-source] [--workspace <dir>]

Installs the selected canonical skill packages and the exact matching shared
runtime. Skill installation is delegated to scripts/skills/install-global-skill.mjs.
PATH is never modified; the receipt reports what activation requires.
`;

if (isMainModule(import.meta.url)) {
  try {
    const args = parseArgs(process.argv.slice(2));
    if (args.help) {
      process.stdout.write(USAGE);
      process.exit(0);
    }
    const result = installAiSkills(args);
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    process.exit(result.ok ? 0 : 1);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exit(2);
  }
}
