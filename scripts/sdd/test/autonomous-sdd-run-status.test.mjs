import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { admitV2Run } from "../autonomous-sdd-admission.mjs";
import { cancelExpiredV2Run } from "../autonomous-sdd-controller.mjs";
import { withRepositoryMutationLock } from "../autonomous-sdd-local-store.mjs";
import { deriveRepositoryId } from "../autonomous-sdd-run-contract.mjs";
import {
  buildRunStatus, classifyRunStatus, classifyStopReason, discoverRuns,
  recommendResume, rebuildProjection, RUN_STATUS_CLASSIFICATIONS, RUN_STATUS_VERSION,
} from "../autonomous-sdd-run-status.mjs";
import { resolveSddDeliveryRequest } from "../resolve-sdd-delivery-request.mjs";

const root = () => fs.mkdtempSync(path.join(os.tmpdir(), "autonomous-sdd-run-status-"));
const now = "2026-08-20T12:00:00.000Z";
const authorization = resolveSddDeliveryRequest({ target: "status-run", mode: "autonomous", qualityProfile: "prototype-rapid", authorizationProfile: "sdd-delivery", reviewPolicy: "same-session-local", expiration: "4h" }, { goalStartedAt: now }).effectiveAuthorization;
const provider = { schemaVersion: 1, id: "native-claim", generationFence: true, explicitTakeover: true, durableWrite: true, directoryMetadataDurability: true, platforms: { windows: "LockFileEx", posix: "advisory-lock" } };
const historyBinding = { id: "local-history", digest: "a".repeat(64) };
const canonicalRemote = "git@github.com:owner/repository.git";
const repositoryId = deriveRepositoryId(canonicalRemote);
const fixture = (stateHome, overrides = {}) => ({ authorization, canonicalRemote, readableRepositoryName: "repository", historyBinding, provider, owner: { host: "fixture-host", boot: "fixture-boot", pidStart: "fixture-process" }, stateHome, parentRunId: "parent-run-001", workUnitId: "work-unit-001", claimId: "claim-001", now, ...overrides });

test("stop reasons map to exactly one classification bucket and unknown reasons are unclassified", () => {
  assert.equal(classifyStopReason("material-requirement"), "waiting-human");
  assert.equal(classifyStopReason("adapter-unavailable"), "retryable-infrastructure");
  assert.equal(classifyStopReason("evidence-not-current"), "quality-blocked");
  assert.equal(classifyStopReason("claim-provider-capability-invalid"), "configuration-discovery-gap");
  assert.equal(classifyStopReason("totally-unknown-reason"), null);
});

test("classification is deterministic and fail-closed across every durable state", () => {
  const activeClaim = { claimState: "active", deadline: "2026-08-20T16:00:00.000Z", now };
  assert.equal(classifyRunStatus({ ...activeClaim }).classification, "running");
  assert.equal(classifyRunStatus({ terminal: "terminalization", claimDisposition: "released", cleanupDisposition: "completed", now }).classification, "complete");
  assert.equal(classifyRunStatus({ terminal: "cancellation", claimDisposition: "released", cleanupDisposition: "cancelled", now }).classification, "complete");
  assert.equal(classifyRunStatus({ terminal: "terminalization", claimDisposition: "released", cleanupDisposition: "cancelled", now }).classification, "ambiguous-legacy-state");
  assert.equal(classifyRunStatus({ ...activeClaim, deadline: "2026-08-20T11:00:00.000Z" }).classification, "expired");
  assert.equal(classifyRunStatus({ ...activeClaim, stopReason: "material-requirement" }).classification, "waiting-human");
  assert.equal(classifyRunStatus({ ...activeClaim, stopReason: "adapter-unavailable" }).classification, "retryable-infrastructure");
  assert.equal(classifyRunStatus({ ...activeClaim, stopReason: "evidence-not-current" }).classification, "quality-blocked");
  assert.equal(classifyRunStatus({ ...activeClaim, stopReason: "claim-provider-capability-invalid" }).classification, "configuration-discovery-gap");
  assert.equal(classifyRunStatus({ claimState: null, now }).classification, "ambiguous-legacy-state");
  assert.equal(classifyRunStatus({ projectionFresh: false, now }).classification, "ambiguous-legacy-state");
  assert.ok(RUN_STATUS_CLASSIFICATIONS.includes(classifyRunStatus({ ...activeClaim }).classification));
});

test("discovery reads active and archived runs by canonical identity, not the current directory", () => {
  const stateHome = root();
  try {
    const admitted = admitV2Run(fixture(stateHome));
    assert.equal(admitted.valid, true, JSON.stringify(admitted));
    const active = discoverRuns({ stateHome, readableRepositoryName: "repository", repositoryId });
    assert.equal(active.valid, true);
    assert.deepEqual(active.runs.map((run) => run.location), ["active"]);
    assert.equal(active.runs[0].parentRunId, admitted.parentRun.parentRunId);

    const cancellation = {
      schemaVersion: 1,
      controllerRunId: `controller-${admitted.parentRun.approvedIntentDigest.slice(0, 32)}`,
      parentRunId: admitted.parentRun.parentRunId,
      workUnitId: admitted.workUnit.workUnitId,
      claimId: admitted.claim.claimId,
      repositoryId: admitted.repositoryId,
      approvedChangeId: admitted.workUnit.approvedChangeId,
      provider,
    };
    const cancelled = cancelExpiredV2Run({ readableRepositoryName: "repository", cancellation, stateHome, now: "2026-08-20T17:00:00.000Z" });
    assert.equal(cancelled.classification, "cancelled", JSON.stringify(cancelled));
    const archived = discoverRuns({ stateHome, readableRepositoryName: "repository", repositoryId });
    assert.equal(archived.valid, true);
    assert.equal(archived.runs.length, 1);
    assert.equal(archived.runs[0].location, "archived");
  } finally {
    fs.rmSync(stateHome, { recursive: true, force: true });
  }
});

test("buildRunStatus reports running for an active claim and complete for a retired run", () => {
  const stateHome = root();
  try {
    const admitted = admitV2Run(fixture(stateHome));
    assert.equal(admitted.valid, true, JSON.stringify(admitted));
    const running = buildRunStatus({ stateHome, readableRepositoryName: "repository", repositoryId, parentRunId: admitted.parentRun.parentRunId, now });
    assert.equal(running.valid, true, JSON.stringify(running));
    assert.equal(running.status.kind, "run-status");
    assert.equal(running.status.schemaVersion, RUN_STATUS_VERSION);
    assert.equal(running.status.classification, "running");
    assert.equal(running.status.claim.ownershipGeneration, 1);

    const cancellation = {
      schemaVersion: 1,
      controllerRunId: `controller-${admitted.parentRun.approvedIntentDigest.slice(0, 32)}`,
      parentRunId: admitted.parentRun.parentRunId,
      workUnitId: admitted.workUnit.workUnitId,
      claimId: admitted.claim.claimId,
      repositoryId: admitted.repositoryId,
      approvedChangeId: admitted.workUnit.approvedChangeId,
      provider,
    };
    const cancelled = cancelExpiredV2Run({ readableRepositoryName: "repository", cancellation, stateHome, now: "2026-08-20T17:00:00.000Z" });
    assert.equal(cancelled.classification, "cancelled", JSON.stringify(cancelled));
    const complete = buildRunStatus({ stateHome, readableRepositoryName: "repository", repositoryId, parentRunId: admitted.parentRun.parentRunId, now: "2026-08-20T17:00:00.000Z" });
    assert.equal(complete.valid, true, JSON.stringify(complete));
    assert.equal(complete.status.classification, "complete");

    const missing = buildRunStatus({ stateHome, readableRepositoryName: "repository", repositoryId, parentRunId: "parent-run-missing", now });
    assert.equal(missing.valid, false);
    assert.equal(missing.classification, "ambiguous-legacy-state");
  } finally {
    fs.rmSync(stateHome, { recursive: true, force: true });
  }
});

test("recommendResume returns safe-resume, no-op, or typed pause and rejects wrong identities", () => {
  const running = { kind: "run-status", schemaVersion: RUN_STATUS_VERSION, repositoryId, parentRunId: "parent-run-001", classification: "running", stopReason: "active-claim-in-progress" };
  assert.equal(recommendResume({ status: running, requestedRepositoryId: repositoryId, requestedParentRunId: "parent-run-001" }).recommendation, "safe-resume");
  assert.equal(recommendResume({ status: { ...running, classification: "complete", stopReason: "terminalized-and-clean" } }).recommendation, "no-op");
  assert.equal(recommendResume({ status: { ...running, classification: "expired", stopReason: "deadline-passed" } }).recommendation, "paused");
  assert.equal(recommendResume({ status: { ...running, classification: "waiting-human", stopReason: "material-requirement" } }).recommendation, "paused");
  assert.equal(recommendResume({ status: { ...running, classification: "retryable-infrastructure", stopReason: "adapter-unavailable" } }).recommendation, "safe-resume");
  assert.equal(recommendResume({ status: running, requestedRepositoryId: `r1-${"b".repeat(64)}` }).recommendation, "paused");
  assert.equal(recommendResume({ status: running, requestedParentRunId: "parent-run-other" }).reason, "wrong-run");
  assert.equal(recommendResume({ status: { ...running, schemaVersion: 99 } }).reason, "status-input-invalid");
});

test("rebuildProjection rebuilds the index from history without rewriting run records", () => {
  const stateHome = root();
  try {
    const admitted = admitV2Run(fixture(stateHome));
    assert.equal(admitted.valid, true, JSON.stringify(admitted));
    const historyBefore = fs.readFileSync(path.join(admitted.paths.active, admitted.parentRun.parentRunId, "parent-run.json"), "utf8");
    const rebuilt = rebuildProjection({ stateHome, readableRepositoryName: "repository", repositoryId, now });
    assert.equal(rebuilt.valid, true, JSON.stringify(rebuilt));
    assert.equal(rebuilt.rebuilt.length, 1);
    assert.equal(fs.readFileSync(path.join(admitted.paths.active, admitted.parentRun.parentRunId, "parent-run.json"), "utf8"), historyBefore);
    assert.ok(fs.existsSync(path.join(admitted.paths.index, "runs", `${admitted.parentRun.parentRunId}.json`)));
  } finally {
    fs.rmSync(stateHome, { recursive: true, force: true });
  }
});

test("projection rebuilding cannot cross the shared repository mutation lock", () => {
  const stateHome = root();
  try {
    const admitted = admitV2Run(fixture(stateHome));
    assert.equal(admitted.valid, true, JSON.stringify(admitted));
    const runIndex = path.join(admitted.paths.index, "runs", `${admitted.parentRun.parentRunId}.json`);
    fs.unlinkSync(runIndex);
    const contended = withRepositoryMutationLock({ stateHome, repositoryId }, () =>
      rebuildProjection({ stateHome, readableRepositoryName: "repository", repositoryId, now }));
    assert.equal(contended.reason, "repository-mutation-lock-unavailable");
    assert.equal(fs.existsSync(runIndex), false);
  } finally {
    fs.rmSync(stateHome, { recursive: true, force: true });
  }
});
