import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { RUN_CONTRACT_VERSION } from "../autonomous-sdd-run-contract.mjs";
import {
  admitRepositoryClaim, archiveEligibility, archiveTerminalRun, assertOwnershipGeneration,
  createRepositoryClaim, createTransitionAttempt, ensureStateLayout, publishImmutableRecord,
  reconcileTransitionAttempt, statePaths, takeOverRepositoryClaim, validateProviderCapabilities
} from "../autonomous-sdd-local-store.mjs";

const root = () => fs.mkdtempSync(path.join(os.tmpdir(), "autonomous-sdd-store-"));
const hash = (value) => value.repeat(64).slice(0, 64);
const provider = { schemaVersion: 1, id: "native-claim", generationFence: true, explicitTakeover: true, durableWrite: true, directoryMetadataDurability: true, platforms: { windows: "LockFileEx", posix: "advisory-lock" } };
const binding = { id: "native-claim", digest: hash("a") };
const summary = { workUnitId: "work-unit-001", ordinal: 1, approvedChangeId: "example-change", terminalStatus: "complete", terminalReason: "verified", startedAt: "2026-08-20T12:00:00.000Z", terminalAt: "2026-08-20T12:01:00.000Z", finalHead: "a".repeat(40), attemptCount: 1, correctionCount: 0, claimDisposition: "released", cleanupDisposition: "completed", childHistoryReference: "children/work-unit-001", childHistoryDigest: hash("b"), terminalSummaryDigest: hash("c") };
const parent = { kind: "parent-run", schemaVersion: RUN_CONTRACT_VERSION, parentRunId: "parent-run-001", approvedIntentDigest: hash("d"), deadline: "2026-08-20T16:00:00.000Z", historyBinding: binding, claimProviderBinding: binding, children: [summary] };
const workUnit = { kind: "work-unit", schemaVersion: RUN_CONTRACT_VERSION, workUnitId: "work-unit-001", parentRunId: "parent-run-001", ordinal: 1, approvedChangeId: "example-change", authorizationDigest: hash("e"), configurationDigest: hash("f"), lifecycleState: "complete", evidenceNamespace: "evidence-001", historyBinding: binding, claimProviderBinding: binding };
const claim = (generation = 1, state = "active") => createRepositoryClaim({ claimId: `claim-${generation}`, repositoryId: `r1-${hash("1")}`, workUnitId: "work-unit-001", owner: { host: "host", boot: "boot", pidStart: "pid" }, ownershipGeneration: generation, providerBinding: binding, state, recoveryEvidence: {} }).record;

test("provider capabilities reject weaker lock fallbacks", () => {
  assert.equal(validateProviderCapabilities(provider).valid, true);
  assert.equal(validateProviderCapabilities({ ...provider, platforms: { windows: "mkdir", posix: "advisory-lock" } }).valid, false);
});

test("immutable publication never replaces an existing record", () => {
  const directory = root();
  try {
    const result = publishImmutableRecord({ directory, name: "work-unit-001", record: workUnit, provider });
    assert.equal(result.valid, true);
    assert.equal(publishImmutableRecord({ directory, name: "work-unit-001", record: workUnit, provider }).reason, "immutable-record-already-exists");
    assert.equal(fs.readdirSync(directory).some((entry) => entry.endsWith(".tmp")), false);
  } finally { fs.rmSync(directory, { recursive: true, force: true }); }
});

test("claims reject conflict and require conclusive explicit takeover", () => {
  const current = claim();
  const next = claim(2);
  assert.equal(admitRepositoryClaim({ existingClaim: current, requestedClaim: next }).reason, "repository-mutation-claim-conflict");
  assert.equal(takeOverRepositoryClaim({ existingClaim: current, requestedClaim: next, proof: { operatorDirected: true, ownerAbsent: false, observedAt: "2026-08-20T12:02:00.000Z" } }).reason, "takeover-proof-inconclusive");
  assert.equal(takeOverRepositoryClaim({ existingClaim: current, requestedClaim: next, proof: { operatorDirected: true, ownerAbsent: true, observedAt: "2026-08-20T12:02:00.000Z" }, unresolvedAttempts: [{ state: "in-doubt" }] }).reason, "takeover-attempt-reconciliation-required");
  assert.equal(takeOverRepositoryClaim({ existingClaim: current, requestedClaim: next, proof: { operatorDirected: true, ownerAbsent: true, observedAt: "2026-08-20T12:02:00.000Z" } }).valid, true);
  assert.equal(assertOwnershipGeneration(next, 1).reason, "ownership-generation-stale");
});

test("attempt reconciliation retains a stable idempotency key", () => {
  const attempt = createTransitionAttempt({ attemptId: "attempt-001", workUnitId: "work-unit-001", idempotencyKey: "github-issue-1", preconditionDigest: hash("a"), targetDigest: hash("b"), ownershipGeneration: 1, receipt: {}, result: {} }).record;
  assert.equal(reconcileTransitionAttempt(attempt, { workUnitId: "work-unit-001", idempotencyKey: "github-issue-1", targetDigest: hash("b") }).classification, "reconcile-required");
  assert.equal(reconcileTransitionAttempt(attempt, { workUnitId: "work-unit-001", idempotencyKey: "other", targetDigest: hash("b") }).reason, "transition-attempt-conflict");
});

test("only a reconciled terminal bundle archives", () => {
  const stateHome = root();
  try {
    const input = { stateHome, readableName: "example-repository", repositoryId: `r1-${hash("1")}` };
    const layout = ensureStateLayout(input);
    const paths = statePaths(input);
    const active = path.join(paths.active, parent.parentRunId);
    fs.mkdirSync(active, { recursive: true });
    fs.writeFileSync(path.join(active, "manifest.json"), "{}\n");
    assert.equal(archiveEligibility({ claim: claim(), parentRun: parent, workUnit, terminalSummary: summary, attempts: [{ state: "in-doubt" }] }).reason, "archive-reconciliation-incomplete");
    const archived = archiveTerminalRun({ paths, parentRun: parent, workUnit, terminalSummary: summary, claim: claim(), attempts: [], now: "2026-08-20T12:03:00.000Z" });
    assert.equal(layout.valid, true);
    assert.equal(archived.valid, true);
    assert.equal(fs.existsSync(active), false);
    assert.equal(fs.existsSync(path.join(archived.archivePath, "archive-manifest.json")), true);
    assert.equal(fs.existsSync(archived.index.runIndex), true);
    assert.equal(JSON.parse(fs.readFileSync(archived.index.statusIndex, "utf8")).state, "archived");
  } finally { fs.rmSync(stateHome, { recursive: true, force: true }); }
});
