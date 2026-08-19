#!/usr/bin/env node
// ai-skills-runtime — the assistant-neutral launcher.
//
// Dispatches only manifest-declared helpers and verbs against an explicit
// absolute target repository. It validates the runtime's own integrity and the
// mechanical shape of the target, then hands off unchanged. It makes no
// authorization decision, injects no credentials, exposes no command that
// returns an importable module path, and never falls back to a script inside
// the target workspace.

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

import {
  BUILT_MANIFEST_FILENAME, findEntrypoint, nodeVersionSupported, REQUIRED_NODE_MAJOR,
  validateManifest, validateTargetRepository, verbDeclared
} from "./registry.mjs";
import {
  METADATA_SCHEMA_VERSION, RUNTIME_ROOT_ENVIRONMENT, activationState, appendInstalledHistory,
  previouslyActive, readActiveMetadata, runtimePaths, writeJsonAtomically
} from "./runtime-home.mjs";
import { TARGET_REPOSITORY_ENVIRONMENT } from "./workspace-io.mjs";
import { digestFiles } from "./build-runtime.mjs";

const text = (value) => typeof value === "string" && value.trim().length > 0;

export function unavailable(code, detail, extra = {}) {
  return { ok: false, classification: "unavailable", code, ...(detail === undefined ? {} : { detail }), ...extra };
}

/**
 * Resolution order: the operator environment override first, then installed
 * active metadata. Repository or skill content can never select a runtime,
 * because no other source is consulted.
 */
export function resolveRuntime({ environment = process.env, platform = process.platform } = {}) {
  const override = environment[RUNTIME_ROOT_ENVIRONMENT];
  if (text(override)) {
    if (!path.isAbsolute(override)) return unavailable("runtime-override-not-absolute", override);
    return { ok: true, mode: "dev", root: override, source: RUNTIME_ROOT_ENVIRONMENT };
  }
  const paths = runtimePaths(environment, platform);
  if (!paths.valid) return unavailable("runtime-home-unavailable", paths.reason);
  const active = readActiveMetadata(paths);
  if (!active) return unavailable("runtime-not-installed", paths.activePath, { recovery: "install or activate a runtime" });
  return { ok: true, mode: "installed", root: active.activePath, source: paths.activePath, active, paths };
}

export function loadBuiltManifest(root) {
  const manifestPath = path.join(root, BUILT_MANIFEST_FILENAME);
  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  } catch {
    return unavailable("runtime-manifest-unreadable", manifestPath);
  }
  const validated = validateManifest(manifest);
  if (!validated.valid) return unavailable("runtime-manifest-invalid", validated.issues);
  if (!manifest.files || typeof manifest.files !== "object" || !text(manifest.digest)) {
    return unavailable("runtime-manifest-incomplete", manifestPath);
  }
  return { ok: true, manifest };
}

/**
 * Content verification recomputes the staged digests rather than trusting the
 * recorded aggregate, so an edited or truncated runtime file is detected.
 */
export function verifyRuntimeContent(root, manifest) {
  const files = Object.keys(manifest.files);
  for (const relative of files) {
    if (!fs.existsSync(path.join(root, relative))) return unavailable("runtime-content-missing", relative);
  }
  const { aggregate } = digestFiles({ staging: root, files });
  if (aggregate !== manifest.digest) return unavailable("runtime-content-tampered", { expected: manifest.digest, actual: aggregate });
  return { ok: true, digest: aggregate };
}

export function checkContractVersion(manifest, requiredContractVersion) {
  if (requiredContractVersion === undefined) return { ok: true };
  const required = Number.parseInt(String(requiredContractVersion), 10);
  if (!Number.isInteger(required)) return unavailable("required-contract-version-invalid", requiredContractVersion);
  if (required !== manifest.contractVersion) {
    return unavailable("runtime-contract-version-mismatch", { required, active: manifest.contractVersion },
      { recovery: "run the paired installer so skills and runtime share one contract version" });
  }
  return { ok: true };
}

export function prepareDispatch({ helper, verb, target, requiredContractVersion, environment = process.env, platform = process.platform, verifyContent = true, nodeVersion = process.versions.node } = {}) {
  if (!nodeVersionSupported(nodeVersion)) {
    return unavailable("node-version-unsupported", { required: `>=${REQUIRED_NODE_MAJOR}`, active: nodeVersion });
  }
  const resolved = resolveRuntime({ environment, platform });
  if (!resolved.ok) return resolved;

  const loaded = loadBuiltManifest(resolved.root);
  if (!loaded.ok) return { ...loaded, mode: resolved.mode };
  const manifest = loaded.manifest;

  if (verifyContent) {
    const verified = verifyRuntimeContent(resolved.root, manifest);
    if (!verified.ok) return { ...verified, mode: resolved.mode };
  }

  const contract = checkContractVersion(manifest, requiredContractVersion);
  if (!contract.ok) return { ...contract, mode: resolved.mode };

  const entry = findEntrypoint(manifest, helper);
  if (!entry) {
    return unavailable("helper-not-declared", helper, { mode: resolved.mode, declared: manifest.entrypoints.map((item) => item.name).sort() });
  }
  if (entry.invocation === "subcommand") {
    if (!text(verb)) return unavailable("verb-required", helper, { mode: resolved.mode, verbs: entry.verbs });
    if (!verbDeclared(entry, verb)) return unavailable("verb-not-declared", { helper, verb }, { mode: resolved.mode, verbs: entry.verbs });
  } else if (text(verb)) {
    return unavailable("verb-not-supported", { helper, verb }, { mode: resolved.mode });
  }

  const validatedTarget = validateTargetRepository(target);
  if (!validatedTarget.valid) return unavailable(validatedTarget.reason, target, { mode: resolved.mode });

  return {
    ok: true,
    mode: resolved.mode,
    runtimeRoot: resolved.root,
    modulePath: path.join(resolved.root, entry.module),
    entrypoint: entry,
    target: validatedTarget.target,
    contractVersion: manifest.contractVersion,
    sourceRevision: manifest.sourceRevision,
    digest: manifest.digest
  };
}

export function dispatch(plan, passthroughArgs, { run = spawnSync, environment = process.env } = {}) {
  const args = [plan.modulePath];
  if (plan.entrypoint.invocation === "subcommand") args.push(plan.verb);
  args.push(...passthroughArgs);
  const result = run(process.execPath, args, {
    cwd: plan.target,
    env: {
      ...environment,
      RUNTIME_HOME: plan.runtimeRoot,
      [TARGET_REPOSITORY_ENVIRONMENT]: plan.target
    },
    stdio: "inherit"
  });
  return { ok: result.status === 0, status: result.status ?? 1, mode: plan.mode };
}

export function doctor({ environment = process.env, platform = process.platform, run = spawnSync, agents = ["claude", "codex"] } = {}) {
  const resolved = resolveRuntime({ environment, platform });
  const paths = runtimePaths(environment, platform);
  const record = {
    schemaVersion: METADATA_SCHEMA_VERSION,
    node: { version: process.versions.node, supported: nodeVersionSupported(), required: `>=${REQUIRED_NODE_MAJOR}` },
    mode: resolved.ok ? resolved.mode : null,
    runtime: null,
    activation: paths.valid ? activationState(paths, environment, platform) : { reason: paths.reason },
    agents: [],
    compatibility: []
  };
  if (!resolved.ok) return { ...record, ok: false, classification: "unavailable", code: resolved.code, detail: resolved.detail };

  const loaded = loadBuiltManifest(resolved.root);
  if (!loaded.ok) return { ...record, ok: false, classification: "unavailable", code: loaded.code, detail: loaded.detail };
  const verified = verifyRuntimeContent(resolved.root, loaded.manifest);
  record.runtime = {
    root: resolved.root,
    contractVersion: loaded.manifest.contractVersion,
    sourceRevision: loaded.manifest.sourceRevision,
    digest: loaded.manifest.digest,
    builtAt: loaded.manifest.builtAt,
    contentVerified: verified.ok === true,
    ...(verified.ok ? {} : { contentIssue: verified.code })
  };

  for (const agent of agents) {
    const listed = run("gh", ["skill", "list", "--agent", agent, "--json"], { encoding: "utf8" });
    if (listed.status !== 0) {
      record.agents.push({ agent, available: false, reason: "gh-skill-list-unavailable" });
      continue;
    }
    let skills = [];
    try {
      const parsed = JSON.parse(listed.stdout ?? "[]");
      skills = Array.isArray(parsed) ? parsed : parsed?.skills ?? [];
    } catch {
      record.agents.push({ agent, available: false, reason: "gh-skill-list-unparsable" });
      continue;
    }
    const revisions = [...new Set(skills.map((skill) => skill?.revision ?? skill?.pin ?? null).filter(Boolean))];
    record.agents.push({ agent, available: true, skillCount: skills.length, revisions });
  }

  // Revision skew across agents is informational; only a contract-version
  // mismatch is fail closed, and that is decided at dispatch.
  const revisions = new Set(record.agents.flatMap((agent) => agent.revisions ?? []));
  if (revisions.size > 1) {
    record.compatibility.push({ level: "info", code: "agent-revision-skew", detail: [...revisions].sort() });
  }
  if (record.runtime.sourceRevision && revisions.size > 0 && !revisions.has(record.runtime.sourceRevision)) {
    record.compatibility.push({ level: "info", code: "skill-runtime-revision-difference" });
  }
  if (!record.runtime.contentVerified) {
    record.compatibility.push({ level: "error", code: record.runtime.contentIssue ?? "runtime-content-unverified" });
  }
  const ok = record.node.supported && record.runtime.contentVerified;
  return { ...record, ok, classification: ok ? "available" : "unavailable" };
}

export function activatePrevious({ environment = process.env, platform = process.platform, now = new Date().toISOString() } = {}) {
  const paths = runtimePaths(environment, platform);
  if (!paths.valid) return unavailable("runtime-home-unavailable", paths.reason);
  const prior = previouslyActive(paths);
  if (!prior) return unavailable("no-retained-prior-runtime", paths.installedPath);
  if (!fs.existsSync(path.join(prior.path, BUILT_MANIFEST_FILENAME))) {
    return unavailable("retained-prior-runtime-missing", prior.path);
  }
  const loaded = loadBuiltManifest(prior.path);
  if (!loaded.ok) return loaded;
  const verified = verifyRuntimeContent(prior.path, loaded.manifest);
  if (!verified.ok) return verified;
  writeJsonAtomically(paths.activePath, {
    schemaVersion: METADATA_SCHEMA_VERSION,
    activePath: prior.path,
    digest: loaded.manifest.digest,
    contractVersion: loaded.manifest.contractVersion,
    sourceRevision: loaded.manifest.sourceRevision,
    activatedAt: now,
    mode: "installed"
  });
  appendInstalledHistory(paths, { ...prior, activatedAt: now, reason: "activate-previous" });
  return { ok: true, activated: prior.path, digest: loaded.manifest.digest, contractVersion: loaded.manifest.contractVersion };
}

export function parseLauncherArgs(argv) {
  const args = { passthrough: [], agents: undefined };
  const rest = [...argv];
  args.command = rest.shift();
  if (args.command === "run") {
    args.helper = rest.shift();
    if (text(rest[0]) && !rest[0].startsWith("-")) args.verb = rest.shift();
  }
  while (rest.length > 0) {
    const arg = rest.shift();
    if (arg === "--") { args.passthrough.push(...rest); break; }
    else if (arg === "--repository") args.repository = rest.shift();
    else if (arg === "--require-contract") args.requiredContractVersion = rest.shift();
    else if (arg === "--agent") (args.agents ??= []).push(rest.shift());
    else if (arg === "--previous") args.previous = true;
    else if (arg === "--json") args.json = true;
    else if (arg === "--help" || arg === "-h") args.help = true;
    else return { ok: false, code: "unexpected-argument", detail: arg };
  }
  return { ok: true, args };
}

const USAGE = [
  "usage:",
  "  ai-skills-runtime run <helper> [verb] --repository <absolute-path> [--require-contract <n>] [-- <helper args>]",
  "  ai-skills-runtime doctor [--agent claude] [--agent codex]",
  "  ai-skills-runtime activate --previous",
  "",
  "The launcher dispatches only manifest-declared helpers against an explicit",
  "absolute target repository. It makes no authorization decision and exposes no",
  "command that returns an importable module path."
].join("\n");

export function main(argv, { write = (line) => process.stdout.write(`${line}\n`), writeError = (line) => process.stderr.write(`${line}\n`) } = {}) {
  const parsed = parseLauncherArgs(argv);
  if (!parsed.ok) {
    writeError(USAGE);
    write(JSON.stringify(unavailable(parsed.code, parsed.detail), null, 2));
    return 2;
  }
  const args = parsed.args;
  if (args.help || !text(args.command)) {
    write(USAGE);
    return args.help ? 0 : 2;
  }
  if (args.command === "doctor") {
    const record = doctor({ ...(args.agents ? { agents: args.agents } : {}) });
    write(JSON.stringify(record, null, 2));
    return record.ok ? 0 : 1;
  }
  if (args.command === "activate") {
    if (!args.previous) {
      write(JSON.stringify(unavailable("activate-target-required", "only --previous is supported"), null, 2));
      return 2;
    }
    const result = activatePrevious();
    write(JSON.stringify(result, null, 2));
    return result.ok ? 0 : 1;
  }
  if (args.command !== "run") {
    write(JSON.stringify(unavailable("command-not-declared", args.command), null, 2));
    return 2;
  }
  const plan = prepareDispatch({
    helper: args.helper, verb: args.verb, target: args.repository,
    requiredContractVersion: args.requiredContractVersion
  });
  if (!plan.ok) {
    write(JSON.stringify(plan, null, 2));
    return 1;
  }
  const result = dispatch({ ...plan, verb: args.verb }, args.passthrough);
  return result.status;
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  process.exit(main(process.argv.slice(2)));
}
