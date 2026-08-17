import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  advanceControllerQueue,
  advanceControllerRecord,
  appendControllerCleanupReceipt,
  authorizationDigest,
  bindControllerLifecycleDelivery,
  bindControllerResourceDelivery,
  createControllerRecord,
  executeControllerLifecycleCleanup,
  inspectControllerRecord,
  persistControllerRecord,
  persistControllerCleanupReceipt,
  registerControllerResource,
  registerControllerLifecycleResource,
  resolveControllerStateRoot
} from "../autonomous-sdd-controller.mjs";
import { inspectCheckpoint } from "../checkpoint.mjs";
import { checkAdapterDrift } from "../check-adapter-drift.mjs";
import { resolveSddDeliveryRequest } from "../resolve-sdd-delivery-request.mjs";

const started = "2026-08-13T12:00:00.000Z";
const authorization = resolveSddDeliveryRequest({ target: "complete-delivery", mode: "autonomous", qualityProfile: "production-rapid", authorizationProfile: "sdd-delivery", independentReviewPolicy: "strict-only", expiration: "12h" }, { goalStartedAt: started }).effectiveAuthorization;
const created = createControllerRecord({ authorization, repository: "owner/repository", runId: "controller-run-0001" });

test("controller record starts at planning and resumes first incomplete phase", () => {
  assert.equal(created.valid, true);
  assert.deepEqual(inspectControllerRecord(created.record, { authorization, repository: "owner/repository", now: started }), { classification: "continue", reason: "controller-first-incomplete-phase", nextPhase: "propose" });
  const resumed = structuredClone(created.record);
  resumed.steps[0] = { id: "propose", status: "complete", evidence: { current: true } };
  resumed.steps[1] = { id: "planning-review", status: "complete", evidence: { current: true } };
  assert.equal(inspectControllerRecord(resumed, { authorization, repository: "owner/repository", now: started }).nextPhase, "apply");
});

test("controller rejects expired, stale, and conflicting context", () => {
  assert.equal(inspectControllerRecord(created.record, { authorization, repository: "other/repository", now: started }).reason, "controller-context-conflict");
  assert.equal(inspectControllerRecord(created.record, { authorization, repository: "owner/repository", now: "2026-08-14T01:00:00.000Z" }).reason, "controller-context-expired");
  const stale = structuredClone(created.record);
  stale.steps[0] = { id: "propose", status: "complete", evidence: { current: false } };
  assert.deepEqual(inspectControllerRecord(stale, { authorization, repository: "owner/repository", now: started }), { classification: "continue", reason: "controller-phase-stale", nextPhase: "propose" });
  const refreshed = advanceControllerRecord(stale, "propose", { current: true, reference: "fresh-proposal" });
  assert.equal(refreshed.valid, true);
  assert.equal(inspectControllerRecord(refreshed.record, { authorization, repository: "owner/repository", now: started }).nextPhase, "planning-review");
  const forgedSelection = structuredClone(created.record);
  forgedSelection.selectedEntry = "different-change";
  assert.equal(inspectControllerRecord(forgedSelection, { authorization, repository: "owner/repository", now: started }).reason, "controller-context-conflict");
  const differentTarget = structuredClone(authorization);
  differentTarget.target = { kind: "change", entries: ["different-change"] };
  assert.notEqual(authorizationDigest(authorization), authorizationDigest(differentTarget));
  const narrowedScope = structuredClone(authorization);
  narrowedScope.allowedMutations = ["different-operation"];
  assert.notEqual(authorizationDigest(authorization), authorizationDigest(narrowedScope));
  assert.equal(inspectControllerRecord({ ...created.record, schemaVersion: 1 }, { authorization, repository: "owner/repository", now: started }).reason, "controller-record-legacy");
});

test("every lifecycle entry resumes only the first incomplete controller phase", () => {
  const phases = ["propose", "planning-review", "apply", "verify", "delivery", "sync", "archive", "cleanup"];
  for (let index = 0; index < phases.length; index += 1) {
    const record = structuredClone(created.record);
    for (let completed = 0; completed < index; completed += 1) {
      record.steps[completed] = { id: phases[completed], status: "complete", evidence: { current: true } };
    }
    assert.equal(inspectControllerRecord(record, { authorization, repository: "owner/repository", now: started }).nextPhase, phases[index]);
  }
});

test("controller records and advances an explicit ordered-queue entry", () => {
  const queued = resolveSddDeliveryRequest({ target: ["complete-delivery", "next-delivery"], mode: "autonomous", qualityProfile: "production-rapid", authorizationProfile: "sdd-delivery", independentReviewPolicy: "strict-only", expiration: "12h" }, { goalStartedAt: started }).effectiveAuthorization;
  const record = createControllerRecord({ authorization: queued, repository: "owner/repository", runId: "controller-run-0002", selectedEntry: "next-delivery" }).record;
  assert.equal(record.selectedEntry, "next-delivery");
  const completed = structuredClone(record);
  completed.queueIndex = 0; completed.selectedEntry = "complete-delivery";
  completed.steps = completed.steps.map((step) => ({ ...step, status: "complete", evidence: { current: true } }));
  const registered = registerControllerResource(completed, {
    kind: "branch", id: "completed-entry-branch", role: "implementation", registeredHeadCommit: "a".repeat(40), recoveryReference: "completed-entry-recovery", ownershipToken: "completed-entry-token"
  }, { now: started });
  const delivered = bindControllerResourceDelivery(registered.record, {
    kind: "branch", id: "completed-entry-branch",
    deliveryEvidence: { current: true, reference: "pr-1", headCommit: "a".repeat(40), deliveredHeadCommit: "b".repeat(40), mergedPullRequest: { merged: true, pullRequest: "1", topicHeadCommit: "a".repeat(40), finalHeadCommit: "b".repeat(40) } }
  });
  const receipt = appendControllerCleanupReceipt(delivered.record, { kind: "branch", id: "completed-entry-branch", status: "completed" }, { now: started });
  const advanced = advanceControllerQueue(receipt.record, { now: "2026-08-13T12:30:00.000Z" });
  assert.equal(advanced.valid, true);
  assert.equal(advanced.record.selectedEntry, "next-delivery");
  assert.equal(advanced.record.steps[0].status, "pending");
  assert.deepEqual(advanced.record.resourceRecords, []);
  assert.deepEqual(advanced.record.cleanupReceipts, []);
  assert.equal(advanced.record.completedEntries[0].selectedEntry, "complete-delivery");
  assert.equal(inspectControllerRecord(advanced.record, { authorization: queued, repository: "owner/repository", now: started }).nextPhase, "propose");

  const emptyCompleted = structuredClone(record);
  emptyCompleted.queueIndex = 0; emptyCompleted.selectedEntry = "complete-delivery";
  emptyCompleted.steps = emptyCompleted.steps.map((step) => ({ ...step, status: "complete", evidence: { current: true } }));
  assert.equal(advanceControllerQueue(emptyCompleted, { now: "2026-08-13T12:30:00.000Z" }).reason, "controller-queue-advance-invalid");

  const pending = registerControllerResource(completed, {
    kind: "branch", id: "undelivered-entry-branch", role: "implementation", registeredHeadCommit: "c".repeat(40), recoveryReference: "undelivered-entry-recovery", ownershipToken: "undelivered-entry-token"
  }, { now: started });
  assert.equal(advanceControllerQueue(pending.record, { now: "2026-08-13T12:30:00.000Z" }).reason, "controller-queue-advance-invalid");
});

test("controller cannot complete cleanup without a registered terminal receipt", () => {
  const incomplete = structuredClone(created.record);
  incomplete.steps = incomplete.steps.map((step, index) => index < 7 ? { ...step, status: "complete", evidence: { current: true } } : step);
  assert.equal(advanceControllerRecord(incomplete, "cleanup", { current: true, reference: "cleanup" }).reason, "controller-cleanup-incomplete");
  incomplete.steps[7] = { ...incomplete.steps[7], status: "complete", evidence: { current: true } };
  assert.equal(inspectControllerRecord(incomplete, { authorization, repository: "owner/repository", now: started }).reason, "controller-cleanup-incomplete");

  const registered = registerControllerResource(created.record, { kind: "branch", id: "receipt-branch", role: "implementation", registeredHeadCommit: "a".repeat(40), recoveryReference: "receipt-recovery", ownershipToken: "receipt-token" }, { now: started });
  const delivered = bindControllerResourceDelivery(registered.record, { kind: "branch", id: "receipt-branch", deliveryEvidence: { current: true, reference: "pr-receipt", headCommit: "a".repeat(40), deliveredHeadCommit: "b".repeat(40), mergedPullRequest: { merged: true, pullRequest: "5", topicHeadCommit: "a".repeat(40), finalHeadCommit: "b".repeat(40) } } });
  const receipted = appendControllerCleanupReceipt(delivered.record, { kind: "branch", id: "receipt-branch", status: "completed" }, { now: "2026-08-13T12:30:00.000Z" }).record;
  receipted.steps = receipted.steps.map((step, index) => index < 7 ? { ...step, status: "complete", evidence: { current: true } } : step);
  const completed = advanceControllerRecord(receipted, "cleanup", { current: true, reference: "cleanup" });
  assert.equal(completed.valid, true);
  assert.equal(inspectControllerRecord(completed.record, { authorization, repository: "owner/repository", now: started }).classification, "complete");
});

test("controller persists only in the git common-directory state root and advances ordered current evidence", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "controller-record-"));
  try {
    fs.mkdirSync(path.join(root, ".git"));
    const runGit = () => ".git";
    const persisted = persistControllerRecord({ repositoryPath: root, record: created.record, runGit });
    assert.equal(persisted.valid, true);
    assert.deepEqual(JSON.parse(fs.readFileSync(persisted.path, "utf8")).steps, created.record.steps);
    assert.equal(fs.readdirSync(path.dirname(persisted.path)).some((entry) => entry.endsWith(".tmp")), false);
    assert.equal(persisted.path.startsWith(path.join(fs.realpathSync(root), ".git", "sdd-delivery-runs")), true);
    assert.equal(persistControllerRecord({ repositoryPath: root, record: { ...created.record, checkpointPath: "../escape.json" }, runGit }).reason, "controller-record-path-invalid");
    const outside = fs.mkdtempSync(path.join(os.tmpdir(), "controller-outside-"));
    fs.symlinkSync(outside, path.join(root, ".git", "sdd-delivery-runs", "linked"));
    assert.equal(persistControllerRecord({ repositoryPath: root, record: { ...created.record, checkpointPath: "linked/record.json" }, runGit }).reason, "controller-record-path-invalid");
    assert.equal(fs.existsSync(path.join(outside, "record.json")), false);
    const conflictingOnDisk = { ...created.record, runId: "controller-run-9999" };
    fs.writeFileSync(persisted.path, `${JSON.stringify(conflictingOnDisk)}\n`);
    assert.equal(persistControllerRecord({ repositoryPath: root, record: created.record, runGit }).reason, "controller-record-run-conflict");
    fs.rmSync(outside, { recursive: true, force: true });
    assert.equal(advanceControllerRecord(created.record, "planning-review", { current: true }).reason, "controller-phase-advance-out-of-order");
    const advanced = advanceControllerRecord(created.record, "propose", { current: true, reference: "proposal" });
    assert.equal(advanced.valid, true);
    assert.equal(advanced.record.currentPhase, "planning-review");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("controller registers independently delivered lifecycle resources and durable cleanup receipts", () => {
  const implementation = registerControllerResource(created.record, {
    kind: "worktree", id: "implementation-worktree", role: "implementation", registeredHeadCommit: "a".repeat(40), recoveryReference: "recovery-1", ownershipToken: "token-1"
  }, { now: started });
  assert.equal(implementation.valid, true);
  assert.equal(registerControllerResource(implementation.record, {
    kind: "worktree", id: "implementation-worktree", role: "implementation", registeredHeadCommit: "a".repeat(40), recoveryReference: "recovery-1"
  }, { now: started }).reason, "controller-resource-registration-duplicate");
  const delivered = bindControllerResourceDelivery(implementation.record, {
    kind: "worktree", id: "implementation-worktree",
    deliveryEvidence: {
      current: true, reference: "pr-1", headCommit: "a".repeat(40), deliveredHeadCommit: "b".repeat(40),
      mergedPullRequest: { merged: true, pullRequest: "1", topicHeadCommit: "a".repeat(40), finalHeadCommit: "b".repeat(40) }
    }
  });
  assert.equal(delivered.valid, true);
  const receipt = appendControllerCleanupReceipt(delivered.record, { kind: "worktree", id: "implementation-worktree", status: "started" }, { now: "2026-08-13T12:30:00.000Z" });
  assert.equal(receipt.valid, true);
  assert.equal(receipt.record.cleanupReceipts[0].recoveryReference, "recovery-1");
});

test("cleanup receipts persist outside the registered target worktree", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "controller-receipt-"));
  try {
    fs.mkdirSync(path.join(root, ".git"));
    const registered = registerControllerResource(created.record, {
      kind: "worktree", id: "target-worktree", role: "archive", registeredHeadCommit: "a".repeat(40), recoveryReference: "recovery-2", ownershipToken: "token-2"
    }, { now: started });
    const delivered = bindControllerResourceDelivery(registered.record, {
      kind: "worktree", id: "target-worktree",
      deliveryEvidence: { current: true, reference: "pr-2", headCommit: "a".repeat(40), deliveredHeadCommit: "b".repeat(40), mergedPullRequest: { merged: true, pullRequest: "2", topicHeadCommit: "a".repeat(40), finalHeadCommit: "b".repeat(40) } }
    });
    const persisted = persistControllerCleanupReceipt({ repositoryPath: root, record: delivered.record, receipt: { kind: "worktree", id: "target-worktree", status: "started" }, now: "2026-08-13T12:30:00.000Z", runGit: () => ".git" });
    assert.equal(persisted.valid, true);
    assert.equal(persisted.path.includes("target-worktree"), false);
    assert.equal(JSON.parse(fs.readFileSync(persisted.path, "utf8")).cleanupReceipts[0].status, "started");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("executable controller transitions persist lifecycle resources and cleanup receipts", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "controller-transition-"));
  try {
    fs.mkdirSync(path.join(root, ".git"));
    const runGit = () => ".git";
    const initial = createControllerRecord({ authorization, repository: "owner/repository", runId: "controller-run-0003" }).record;
    const registered = registerControllerLifecycleResource({ repositoryPath: root, record: initial, resource: { kind: "branch", id: "transition-branch", role: "implementation", registeredHeadCommit: "a".repeat(40), recoveryReference: "transition-recovery", ownershipToken: "transition-token" }, now: started, runGit });
    assert.equal(registered.valid, true);
    const delivered = bindControllerLifecycleDelivery({ repositoryPath: root, record: registered.record, kind: "branch", id: "transition-branch", deliveryEvidence: { current: true, reference: "pr-transition", headCommit: "b".repeat(40), deliveredHeadCommit: "c".repeat(40), mergedPullRequest: { merged: true, pullRequest: "3", topicHeadCommit: "b".repeat(40), finalHeadCommit: "c".repeat(40) } }, runGit });
    assert.equal(delivered.valid, true);
    const cleanup = executeControllerLifecycleCleanup({ repositoryPath: root, record: delivered.record, cleanupContext: { archiveVisible: true, issueClosed: true, projectDone: true, deliveryEvidence: { current: true, reference: "archive", headCommit: "c".repeat(40) } }, operations: { inspectResource: (resource) => ({ ...resource, exists: true }), deleteLocalBranch: () => ({ committed: true }) }, now: "2026-08-13T12:30:00.000Z", runGit });
    assert.equal(cleanup.classification, "completed");
    assert.equal(cleanup.record.cleanupReceipts.at(-1).status, "completed");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("controller cleanup plans from fresh worktree eligibility and refuses an ineligible audit", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "controller-worktree-cleanup-"));
  try {
    fs.mkdirSync(path.join(root, ".git"));
    const runGit = () => ".git";
    const initial = createControllerRecord({ authorization, repository: "owner/repository", runId: "controller-run-0004" }).record;
    const registered = registerControllerLifecycleResource({ repositoryPath: root, record: initial, resource: { kind: "worktree", id: "transition-worktree", role: "implementation", registeredHeadCommit: "a".repeat(40), recoveryReference: "worktree-recovery", ownershipToken: "worktree-token" }, now: started, runGit });
    const delivered = bindControllerLifecycleDelivery({ repositoryPath: root, record: registered.record, kind: "worktree", id: "transition-worktree", deliveryEvidence: { current: true, reference: "pr-worktree", headCommit: "b".repeat(40), deliveredHeadCommit: "c".repeat(40), mergedPullRequest: { merged: true, pullRequest: "4", topicHeadCommit: "b".repeat(40), finalHeadCommit: "c".repeat(40) } }, runGit });
    const cleanupContext = { archiveVisible: true, issueClosed: true, projectDone: true, deliveryEvidence: { current: true, reference: "archive", headCommit: "c".repeat(40) } };
    const eligible = (resource) => ({ ...resource, exists: true, primary: false, locked: false, registered: true, clean: true, controllerCheckpointPresent: false });
    const cleanup = executeControllerLifecycleCleanup({ repositoryPath: root, record: delivered.record, cleanupContext, operations: { inspectResource: eligible, removeWorktree: () => ({ committed: true }) }, now: "2026-08-13T12:30:00.000Z", runGit });
    assert.equal(cleanup.classification, "completed");
    assert.equal(cleanup.record.cleanupReceipts.at(-1).status, "completed");
    const refused = executeControllerLifecycleCleanup({ repositoryPath: root, record: delivered.record, cleanupContext, operations: { inspectResource: (resource) => ({ ...resource, exists: true }) }, runGit });
    assert.equal(refused.reason, "controller-cleanup-resource-ineligible");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("controller state root rejects an unavailable common Git directory", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "controller-state-"));
  try {
    assert.equal(resolveControllerStateRoot({ repositoryPath: root, runGit: () => "missing" }).reason, "controller-state-root-unavailable");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("checkpoint rejects malformed cleanup ownership records", () => {
  assert.equal(inspectCheckpoint({ selectedEntry: { name: "change", records: [], cleanupRecords: [{ entry: "other", kind: "branch", id: "feature", owned: true, deliveryCurrent: true }] }, steps: [] }).reason, "invalid-cleanup-record");
});

test("controller and cleanup adapters remain thin and point at canonical policy", () => {
  assert.deepEqual(checkAdapterDrift(process.cwd()), { valid: true, issues: [] });
});
