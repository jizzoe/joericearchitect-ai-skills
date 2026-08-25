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
import { resolveSddDeliveryRequest } from "../../sdd/resolve-sdd-delivery-request.mjs";

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

test("the staged controller initializes and resumes in real Git-common state without exposing its internal exclusion", () => {
  const startedAt = "2026-08-20T12:00:00.000Z";
  const authorization = resolveSddDeliveryRequest({
    target: "runtime-initializer-repair", mode: "autonomous", qualityProfile: "prototype-rapid",
    authorizationProfile: "sdd-delivery", reviewPolicy: "same-session-local", expiration: "4h"
  }, { goalStartedAt: startedAt }).effectiveAuthorization;
  const provider = {
    schemaVersion: 1, id: "native-claim", generationFence: true, explicitTakeover: true,
    durableWrite: true, directoryMetadataDurability: true,
    platforms: { windows: "LockFileEx", posix: "advisory-lock" }
  };
  const basePayload = (stateHome) => ({
    authorization, repository: "example/runtime-fixture", canonicalRemote: "git@github.com:example/runtime-fixture.git",
    readableRepositoryName: "runtime-fixture", historyBinding: { id: "local-history", digest: "a".repeat(64) },
    provider, owner: { host: "fixture-host", boot: "fixture-boot", pidStart: "fixture-process" },
    stateHome, now: startedAt
  });
  const invoke = (target, verb, payload) => {
    const plan = prepareDispatch({ helper: "autonomous-sdd-controller", verb, target, environment: devEnvironment() });
    assert.equal(plan.ok, true, JSON.stringify(plan));
    const result = spawnSync(process.execPath, [plan.modulePath, verb, "--stdin"], {
      input: JSON.stringify(payload), encoding: "utf8", cwd: target,
      env: { ...process.env, RUNTIME_HOME: runtimeRoot, AI_SKILLS_TARGET_REPOSITORY: target }
    });
    assert.equal(result.status, 0, result.stderr);
    return JSON.parse(result.stdout).result;
  };

  const target = syntheticTargetRepository("initializer-target-");
  const stateHome = temporaryDirectory("initializer-state-");
  fs.mkdirSync(path.join(target, "config"));
  fs.writeFileSync(path.join(target, "config", "ai-skills.json"), JSON.stringify({ runtime: { schemaVersion: 1, evidenceRoot: "evidence" } }));
  const initialized = invoke(target, "initialize-v2-delivery", basePayload(stateHome));
  assert.equal(initialized.valid, true, JSON.stringify(initialized));
  assert.equal(initialized.classification, "initialized");
  assert.equal(initialized.record.v2Admission.state, "admitted");
  assert.equal(initialized.record.v2Admission.parentRunId, initialized.admission.parentRun.parentRunId);
  assert.equal(initialized.record.v2Admission.workUnitId, initialized.admission.workUnit.workUnitId);
  assert.equal(initialized.record.v2Admission.claimId, initialized.admission.claim.claimId);
  const commonDirectory = execFileSync("git", ["-C", target, "rev-parse", "--git-common-dir"], { encoding: "utf8" }).trim();
  assert.equal(fs.existsSync(path.resolve(target, commonDirectory, "sdd-delivery-runs", initialized.record.checkpointPath)), true);
  const resumed = invoke(target, "initialize-v2-delivery", basePayload(stateHome));
  assert.equal(resumed.valid, true, JSON.stringify(resumed));
  assert.equal(resumed.classification, "resumed");
  assert.equal(resumed.record.runId, initialized.record.runId);

  const checkpoint = path.resolve(target, commonDirectory, "sdd-delivery-runs", initialized.record.checkpointPath);
  const completedController = structuredClone(initialized.record);
  completedController.currentPhase = null;
  completedController.steps = completedController.steps.map((step) => ({ ...step, status: "complete", evidence: { current: true, reference: step.id } }));
  fs.writeFileSync(checkpoint, `${JSON.stringify(completedController, null, 2)}\n`);
  const controllerBefore = fs.readFileSync(checkpoint, "utf8");
  const terminalized = invoke(target, "terminalize-v2-run", {
    readableRepositoryName: "runtime-fixture",
    terminalization: {
      schemaVersion: 1,
      parentRunId: initialized.admission.parentRun.parentRunId,
      workUnitId: initialized.admission.workUnit.workUnitId,
      claimId: initialized.admission.claim.claimId,
      repositoryId: initialized.admission.repositoryId,
      approvedChangeId: initialized.admission.workUnit.approvedChangeId,
      provider,
      completionEvidence: {
        current: true,
        implementation: { merged: true, reference: "implementation-pr", deliveredHeadCommit: "d".repeat(40) },
        sync: { merged: true, reference: "sync-pr", deliveredHeadCommit: "e".repeat(40) },
        archive: { merged: true, reference: "archive-pr", deliveredHeadCommit: "f".repeat(40) },
        issueClosed: true, projectDone: true, cleanupCompleted: true, observedAt: "2026-08-20T12:20:00.000Z"
      },
      terminal: {
        terminalStatus: "complete", terminalReason: "delivered-and-archived", terminalAt: "2026-08-20T12:30:00.000Z",
        finalHead: "f".repeat(40), attemptCount: 1, correctionCount: 0, cleanupDisposition: "completed",
        childHistoryReference: "external-delivery-evidence", childHistoryDigest: "d".repeat(64)
      }
    },
    stateHome,
    now: "2026-08-20T12:31:00.000Z"
  });
  assert.equal(terminalized.classification, "terminalized", JSON.stringify(terminalized));
  const archiveBefore = new Map(fs.readdirSync(terminalized.archivePath).map((name) => [name, fs.readFileSync(path.join(terminalized.archivePath, name), "utf8")]));
  const nextAuthorization = resolveSddDeliveryRequest({
    target: "runtime-after-terminal", mode: "autonomous", qualityProfile: "prototype-rapid",
    authorizationProfile: "sdd-delivery", reviewPolicy: "same-session-local", expiration: "4h"
  }, { goalStartedAt: startedAt }).effectiveAuthorization;
  const unmatchedController = path.resolve(target, commonDirectory, "sdd-delivery-runs", "runs", "unmatched", "controller.json");
  fs.mkdirSync(path.dirname(unmatchedController), { recursive: true });
  fs.writeFileSync(unmatchedController, `${JSON.stringify({ ...completedController, runId: "controller-unmatched-sibling" })}\n`);
  const unmatchedSibling = invoke(target, "initialize-v2-delivery", { ...basePayload(stateHome), authorization: nextAuthorization });
  assert.equal(unmatchedSibling.valid, false);
  assert.equal(unmatchedSibling.reason, "legacy-inventory-ambiguous");
  assert.deepEqual(fs.readdirSync(initialized.admission.paths.active), []);
  fs.rmSync(path.dirname(unmatchedController), { recursive: true });
  const afterTerminal = invoke(target, "initialize-v2-delivery", { ...basePayload(stateHome), authorization: nextAuthorization });
  assert.equal(afterTerminal.valid, true, JSON.stringify(afterTerminal));
  assert.equal(afterTerminal.classification, "initialized");
  assert.equal(fs.readFileSync(checkpoint, "utf8"), controllerBefore);
  for (const [name, content] of archiveBefore) assert.equal(fs.readFileSync(path.join(terminalized.archivePath, name), "utf8"), content);
  const afterTerminalRetry = invoke(target, "initialize-v2-delivery", { ...basePayload(stateHome), authorization: nextAuthorization });
  assert.equal(afterTerminalRetry.classification, "resumed");
  assert.equal(afterTerminalRetry.record.runId, afterTerminal.record.runId);

  const bypassTarget = syntheticTargetRepository("admission-bypass-target-");
  const bypassState = temporaryDirectory("admission-bypass-state-");
  fs.mkdirSync(path.join(bypassTarget, "config"));
  fs.writeFileSync(path.join(bypassTarget, "config", "ai-skills.json"), JSON.stringify({ runtime: { schemaVersion: 1, evidenceRoot: "evidence" } }));
  const activeController = path.join(bypassTarget, ".git", "sdd-delivery-runs", "runs", "legacy", "controller.json");
  fs.mkdirSync(path.dirname(activeController), { recursive: true });
  fs.writeFileSync(activeController, JSON.stringify({
    schemaVersion: 4, runId: "legacy-run", selectedEntry: "legacy-entry", repository: "example/runtime-fixture",
    currentPhase: "apply", steps: []
  }));
  const bypass = invoke(bypassTarget, "admit-v2-run", {
    ...basePayload(bypassState), legacyInventoryExclusions: [activeController]
  });
  assert.equal(bypass.valid, false);
  assert.equal(bypass.reason, "legacy-authority-active");
  assert.equal(fs.existsSync(path.join(bypassState, "repositories")), false);

  const ambiguousTarget = syntheticTargetRepository("initializer-ambiguous-target-");
  const ambiguousState = temporaryDirectory("initializer-ambiguous-state-");
  fs.mkdirSync(path.join(ambiguousTarget, "config"));
  fs.writeFileSync(path.join(ambiguousTarget, "config", "ai-skills.json"), JSON.stringify({ runtime: { schemaVersion: 1, evidenceRoot: "evidence" } }));
  const ambiguousController = path.join(ambiguousTarget, ".git", "sdd-delivery-runs", "runs", "unknown", "controller.json");
  fs.mkdirSync(path.dirname(ambiguousController), { recursive: true });
  fs.writeFileSync(ambiguousController, JSON.stringify({ schemaVersion: 99 }));
  const ambiguous = invoke(ambiguousTarget, "initialize-v2-delivery", basePayload(ambiguousState));
  assert.equal(ambiguous.valid, false);
  assert.equal(ambiguous.reason, "legacy-inventory-ambiguous");
  assert.equal(fs.existsSync(path.join(ambiguousState, "repositories")), false);
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
  assert.equal(prepareDispatch({ helper: "check-operation-authorization", target: path.join("relative", "path"), environment }).code, "target-repository-not-absolute");
  // Built from the platform's own temporary root: a POSIX-shaped literal is not
  // canonical on Windows and would fail the earlier canonicality check instead.
  const absentTarget = path.join(os.tmpdir(), "ai-skills-target-that-does-not-exist");
  assert.equal(prepareDispatch({ helper: "check-operation-authorization", target: absentTarget, environment }).code, "target-repository-missing");

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
      assert.equal(command, "gh");
      const agent = args[args.indexOf("--agent") + 1];
      assert.ok(["claude-code", "codex"].includes(agent), `unexpected gh agent id: ${agent}`);
      assert.match(args[args.indexOf("--json") + 1] ?? "", /version/);
      return { status: 0, stdout: JSON.stringify([{ skillName: "example", version: agent === "claude-code" ? "aaa" : "bbb", pinned: true }]) };
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
