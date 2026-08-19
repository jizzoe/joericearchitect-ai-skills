import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { execFileSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { buildRuntime } from "../build-runtime.mjs";
import {
  activatePrevious, checkContractVersion, dispatch, doctor, loadBuiltManifest, main,
  parseLauncherArgs, prepareDispatch, resolveRuntime, verifyRuntimeContent
} from "../launcher.mjs";
import { METADATA_SCHEMA_VERSION, runtimePaths, writeJsonAtomically, appendInstalledHistory } from "../runtime-home.mjs";
import { validateTargetRepository } from "../registry.mjs";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const temporaryDirectory = (prefix) => fs.mkdtempSync(path.join(os.tmpdir(), prefix));

/**
 * One built runtime is reused across the dispatch assertions: building is the
 * expensive step and the launcher contract under test is read-only over it.
 */
const runtimeRoot = path.join(temporaryDirectory("launcher-runtime-"), "runtime");
const build = buildRuntime({ source: repositoryRoot, output: runtimeRoot });
assert.equal(build.ok, true, `runtime build failed: ${JSON.stringify(build)}`);

/** A second synthetic target proves nothing product-specific is assumed. */
function syntheticTargetRepository(prefix = "synthetic-target-") {
  const root = fs.realpathSync(temporaryDirectory(prefix));
  execFileSync("git", ["init", "--quiet", root]);
  fs.writeFileSync(path.join(root, "README.md"), "# synthetic\n");
  return root;
}

const devEnvironment = (overrides = {}) => ({ ...process.env, AI_SKILLS_RUNTIME_ROOT: runtimeRoot, ...overrides });

test("a declared cli helper dispatches against an explicit target", () => {
  const target = syntheticTargetRepository();
  const plan = prepareDispatch({ helper: "check-operation-authorization", target, environment: devEnvironment() });
  assert.equal(plan.ok, true, JSON.stringify(plan));
  assert.equal(plan.mode, "dev");
  assert.equal(plan.target, target);
  assert.equal(plan.modulePath, path.join(runtimeRoot, "scripts/runtime/bin/check-operation-authorization.mjs"));

  // The helper receives the target and the runtime root, and nothing else is
  // inferred from the launcher's own location.
  const captured = [];
  dispatch({ ...plan }, ["--help"], { run: (...args) => { captured.push(args); return { status: 0 }; }, environment: {} });
  const [, , options] = captured[0];
  assert.equal(options.cwd, target);
  assert.equal(options.env.RUNTIME_HOME, runtimeRoot);
  assert.equal(options.env.AI_SKILLS_TARGET_REPOSITORY, target);
});

test("a declared subcommand helper dispatches with its verb", () => {
  const target = syntheticTargetRepository();
  const plan = prepareDispatch({
    helper: "platform-review-adapters", verb: "degraded-capability-ledger", target, environment: devEnvironment()
  });
  assert.equal(plan.ok, true, JSON.stringify(plan));
  const result = spawnSync(process.execPath, [plan.modulePath, "degraded-capability-ledger", "--stdin"], {
    input: "{}", encoding: "utf8", env: { ...process.env, RUNTIME_HOME: runtimeRoot }
  });
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.ok, true);
  assert.equal(payload.operation, "degraded-capability-ledger");
});

test("a former library-only helper answers a JSON request with a machine-readable result", () => {
  const plan = prepareDispatch({
    helper: "sdd-workspace-cleanup", target: syntheticTargetRepository(), environment: devEnvironment()
  });
  assert.equal(plan.ok, true);
  const result = spawnSync(process.execPath, [plan.modulePath, "--stdin"], {
    input: JSON.stringify({ operation: "plan-workspace-cleanup", payload: {} }), encoding: "utf8"
  });
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.ok, true);
  assert.equal(payload.result.classification, "paused");
});

test("the launcher exposes no command that returns an importable module path", () => {
  // Only run, doctor, and activate exist. A caller asking the launcher to
  // resolve or print a module path is refused rather than handed a path.
  for (const command of ["resolve", "path", "which", "module-path"]) {
    const output = [];
    const code = main([command], { write: (line) => output.push(line), writeError: () => {} });
    assert.equal(code, 2);
    const result = JSON.parse(output.join("\n"));
    assert.equal(result.code, "command-not-declared");
    assert.equal(result.classification, "unavailable");
    assert.doesNotMatch(output.join("\n"), /\.mjs/);
  }
});


test("an undeclared helper and an unregistered verb are refused", () => {
  const target = syntheticTargetRepository();
  const undeclared = prepareDispatch({ helper: "not-a-helper", target, environment: devEnvironment() });
  assert.equal(undeclared.code, "helper-not-declared");
  assert.equal(undeclared.classification, "unavailable");

  const unregistered = prepareDispatch({
    helper: "platform-review-adapters", verb: "not-a-verb", target, environment: devEnvironment()
  });
  assert.equal(unregistered.code, "verb-not-declared");

  const missingVerb = prepareDispatch({ helper: "platform-review-adapters", target, environment: devEnvironment() });
  assert.equal(missingVerb.code, "verb-required");

  const unsupportedVerb = prepareDispatch({
    helper: "check-operation-authorization", verb: "anything", target, environment: devEnvironment()
  });
  assert.equal(unsupportedVerb.code, "verb-not-supported");
});

test("structurally invalid targets are refused before dispatch", () => {
  const environment = devEnvironment();
  assert.equal(prepareDispatch({ helper: "check-operation-authorization", environment }).code, "target-repository-absent");
  assert.equal(prepareDispatch({ helper: "check-operation-authorization", target: "relative/path", environment }).code, "target-repository-not-absolute");
  assert.equal(prepareDispatch({ helper: "check-operation-authorization", target: "/does/not/exist", environment }).code, "target-repository-missing");

  // An existing directory that is not a Git work tree root is still refused.
  const plain = fs.realpathSync(temporaryDirectory("not-a-repo-"));
  assert.equal(prepareDispatch({ helper: "check-operation-authorization", target: plain, environment }).code, "target-repository-not-work-tree-root");

  // A symlink pointing at a valid repository does not become a valid target.
  const real = syntheticTargetRepository();
  const linkRoot = temporaryDirectory("symlink-target-");
  const link = path.join(linkRoot, "link");
  fs.symlinkSync(real, link);
  assert.equal(validateTargetRepository(link).valid, false);
});

test("the launcher makes no authorization decision for a structurally valid target", () => {
  // The target is a valid Git work tree the helper's own checks would refuse
  // to act on; the launcher still plans the dispatch and lets the helper decide.
  const target = syntheticTargetRepository("unauthorized-target-");
  const plan = prepareDispatch({ helper: "check-operation-authorization", target, environment: devEnvironment() });
  assert.equal(plan.ok, true);
  // The launcher planned the dispatch for a structurally valid target and
  // recorded no verdict of its own.
  assert.equal("allowed" in plan, false);
  assert.equal("classification" in plan, false);

  const refusal = spawnSync(process.execPath, [plan.modulePath, "--stdin"], {
    encoding: "utf8",
    cwd: target,
    env: { ...process.env, RUNTIME_HOME: runtimeRoot },
    input: JSON.stringify({
      operation: "check-operation-authorization",
      payload: { request: { profile: "research-read-only", operation: "write-design-brief", target: `workspace:${target}` } }
    })
  });
  const payload = JSON.parse(refusal.stdout);
  // The refusal is the helper's own authorization verdict.
  assert.equal(payload.ok, true);
  assert.equal(payload.result.allowed, false);
  assert.equal(payload.result.classification, "paused");
  assert.equal(payload.result.issues[0].code, "operation-not-in-profile");
});

test("an unsupported Node runtime is reported without dispatching", () => {
  const plan = prepareDispatch({
    helper: "check-operation-authorization", target: syntheticTargetRepository(),
    environment: devEnvironment(), nodeVersion: "18.20.4"
  });
  assert.equal(plan.ok, false);
  assert.equal(plan.classification, "unavailable");
  assert.equal(plan.code, "node-version-unsupported");
  assert.deepEqual(plan.detail, { required: ">=20", active: "18.20.4" });
});

test("a missing installed runtime is a classified pause, not a workspace fallback", () => {
  const home = temporaryDirectory("empty-home-");
  const resolved = resolveRuntime({ environment: { HOME: home, USERPROFILE: home }, platform: "linux" });
  assert.equal(resolved.code, "runtime-not-installed");
  assert.equal(resolved.classification, "unavailable");
});

test("a tampered runtime file is detected before dispatch", () => {
  const copy = path.join(temporaryDirectory("tampered-"), "runtime");
  fs.cpSync(runtimeRoot, copy, { recursive: true });
  const victim = path.join(copy, "scripts/sdd/check-operation-authorization.mjs");
  fs.writeFileSync(victim, `${fs.readFileSync(victim, "utf8")}\n// injected\n`);

  const plan = prepareDispatch({
    helper: "check-operation-authorization", target: syntheticTargetRepository(),
    environment: { ...process.env, AI_SKILLS_RUNTIME_ROOT: copy }
  });
  assert.equal(plan.code, "runtime-content-tampered");

  fs.rmSync(path.join(copy, "quality/openspec-artifact-rules.json"));
  const missing = verifyRuntimeContent(copy, loadBuiltManifest(copy).manifest);
  assert.equal(missing.code, "runtime-content-missing");
});

test("an unreadable or malformed runtime manifest is classified", () => {
  const empty = temporaryDirectory("no-manifest-");
  assert.equal(loadBuiltManifest(empty).code, "runtime-manifest-unreadable");

  const malformed = temporaryDirectory("bad-manifest-");
  fs.writeFileSync(path.join(malformed, "runtime-manifest.json"), JSON.stringify({ schemaVersion: 99 }));
  assert.equal(loadBuiltManifest(malformed).code, "runtime-manifest-invalid");
});

test("contract-version mismatch fails closed and a match dispatches", () => {
  const target = syntheticTargetRepository();
  const mismatch = prepareDispatch({
    helper: "check-operation-authorization", target, requiredContractVersion: 99, environment: devEnvironment()
  });
  assert.equal(mismatch.code, "runtime-contract-version-mismatch");
  assert.deepEqual(mismatch.detail, { required: 99, active: build.manifest.contractVersion });
  assert.match(mismatch.recovery, /paired installer/);

  const match = prepareDispatch({
    helper: "check-operation-authorization", target,
    requiredContractVersion: build.manifest.contractVersion, environment: devEnvironment()
  });
  assert.equal(match.ok, true);
  assert.equal(checkContractVersion(build.manifest, "not-a-number").code, "required-contract-version-invalid");
});

test("development mode is labelled on every launcher result", () => {
  const target = syntheticTargetRepository();
  const plan = prepareDispatch({ helper: "check-operation-authorization", target, environment: devEnvironment() });
  assert.equal(plan.mode, "dev");
  const refusal = prepareDispatch({ helper: "absent", target, environment: devEnvironment() });
  assert.equal(refusal.mode, "dev");
  const dispatched = dispatch({ ...plan }, [], { run: () => ({ status: 0 }), environment: {} });
  assert.equal(dispatched.mode, "dev");
});

test("repository content cannot select the runtime location", () => {
  // Only the operator environment override and installed metadata are consulted;
  // a relative override is refused rather than resolved against the workspace.
  const relative = resolveRuntime({ environment: { AI_SKILLS_RUNTIME_ROOT: "./inside-a-repo" } });
  assert.equal(relative.code, "runtime-override-not-absolute");
});

test("doctor reports revision skew as informational and content failure as an error", () => {
  const skewed = doctor({
    environment: devEnvironment(),
    run: (command, args) => {
      const agent = args[args.indexOf("--agent") + 1];
      return { status: 0, stdout: JSON.stringify([{ name: "example", revision: agent === "claude" ? "aaa" : "bbb" }]) };
    }
  });
  assert.equal(skewed.ok, true);
  assert.equal(skewed.mode, "dev");
  assert.equal(skewed.runtime.contentVerified, true);
  assert.equal(skewed.runtime.contractVersion, build.manifest.contractVersion);
  const skew = skewed.compatibility.find((item) => item.code === "agent-revision-skew");
  assert.equal(skew.level, "info");
  assert.deepEqual(skew.detail, ["aaa", "bbb"]);

  const unavailableAgent = doctor({ environment: devEnvironment(), run: () => ({ status: 1, stdout: "" }) });
  assert.equal(unavailableAgent.agents.every((agent) => agent.available === false), true);
  // An unavailable agent listing does not by itself fail the runtime check.
  assert.equal(unavailableAgent.ok, true);
});

test("doctor reports activation state without modifying PATH", () => {
  const home = fs.realpathSync(temporaryDirectory("doctor-home-"));
  const record = doctor({
    environment: { HOME: home, USERPROFILE: home, PATH: "/usr/bin", AI_SKILLS_RUNTIME_ROOT: runtimeRoot },
    platform: "linux",
    run: () => ({ status: 1, stdout: "" })
  });
  assert.equal(record.activation.onPath, false);
  assert.equal(record.activation.pathEntryToAdd, path.join(home, ".ai-skills/bin"));
  assert.equal(record.activation.launcherPresent, false);
  // Nothing was written anywhere in the home directory.
  assert.deepEqual(fs.readdirSync(home), []);
});

test("activation is atomic and rollback restores the retained prior runtime offline", () => {
  const home = fs.realpathSync(temporaryDirectory("activate-home-"));
  const environment = { HOME: home, USERPROFILE: home };
  const paths = runtimePaths(environment, "linux");

  const priorPath = paths.versionDirectory("prior00000000");
  fs.cpSync(runtimeRoot, priorPath, { recursive: true });
  const currentPath = paths.versionDirectory("current000000");
  fs.cpSync(runtimeRoot, currentPath, { recursive: true });

  const entryFor = (versionPath, digest) => ({
    digest, path: versionPath, contractVersion: build.manifest.contractVersion,
    sourceRevision: build.manifest.sourceRevision, builtAt: build.manifest.builtAt
  });
  appendInstalledHistory(paths, entryFor(priorPath, build.manifest.digest));
  appendInstalledHistory(paths, entryFor(currentPath, "current-digest"));
  writeJsonAtomically(paths.activePath, {
    schemaVersion: METADATA_SCHEMA_VERSION, activePath: currentPath, digest: "current-digest",
    contractVersion: build.manifest.contractVersion, activatedAt: new Date().toISOString(), mode: "installed"
  });

  const rolledBack = activatePrevious({ environment, platform: "linux" });
  assert.equal(rolledBack.ok, true, JSON.stringify(rolledBack));
  assert.equal(rolledBack.activated, priorPath);

  const active = JSON.parse(fs.readFileSync(paths.activePath, "utf8"));
  assert.equal(active.activePath, priorPath);
  assert.equal(active.digest, build.manifest.digest);
  // Ordering came from recorded history, and both versions are retained.
  assert.equal(fs.existsSync(currentPath), true);
  assert.equal(fs.existsSync(priorPath), true);
  const history = JSON.parse(fs.readFileSync(paths.installedPath, "utf8"));
  assert.equal(history.history.at(-1).reason, "activate-previous");
});

test("rollback without a retained prior runtime is classified, not silent", () => {
  const home = fs.realpathSync(temporaryDirectory("no-prior-home-"));
  const result = activatePrevious({ environment: { HOME: home, USERPROFILE: home }, platform: "linux" });
  assert.equal(result.code, "no-retained-prior-runtime");
});

test("launcher argument parsing keeps helper arguments separate", () => {
  const parsed = parseLauncherArgs(["run", "sdd-lifecycle-hygiene", "--repository", "/abs", "--require-contract", "1", "--", "--stdin"]);
  assert.equal(parsed.args.command, "run");
  assert.equal(parsed.args.helper, "sdd-lifecycle-hygiene");
  assert.equal(parsed.args.repository, "/abs");
  assert.equal(parsed.args.requiredContractVersion, "1");
  assert.deepEqual(parsed.args.passthrough, ["--stdin"]);

  const withVerb = parseLauncherArgs(["run", "platform-review-adapters", "probe-codex-review-adapter", "--repository", "/abs"]);
  assert.equal(withVerb.args.verb, "probe-codex-review-adapter");
  assert.equal(parseLauncherArgs(["run", "x", "--nope"]).ok, false);
});
