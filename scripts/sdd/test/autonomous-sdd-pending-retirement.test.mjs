import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { deriveRepositoryId } from "../autonomous-sdd-run-contract.mjs";
import { legacyRecordDigest } from "../autonomous-sdd-legacy-reconciliation.mjs";
import { inventoryLegacyRecords } from "../autonomous-sdd-legacy.mjs";
import { statePaths } from "../autonomous-sdd-local-store.mjs";
import { publishPendingRetirementReceipt, retireExpiredPendingController, validatePendingControllerBaseline } from "../autonomous-sdd-pending-retirement.mjs";

const phases = ["propose", "planning-review", "apply", "verify", "delivery", "sync", "archive", "cleanup"];
const canonicalRemote = "https://github.com/jizzoe/joericearchitect-ai-skills.git";
const repositoryId = deriveRepositoryId(canonicalRemote);
const readableRepositoryName = "joericearchitect-ai-skills";

function pendingControllerFixture(overrides = {}) {
  const authorizationDigest = "a".repeat(64);
  const runId = `controller-${authorizationDigest.slice(0, 32)}`;
  return {
    schemaVersion: 5,
    runId,
    authorizationDigest,
    selectedEntry: "add-typescript-quality-overlay",
    queueEntries: ["add-typescript-quality-overlay"],
    queueIndex: 0,
    repository: "jizzoe/joericearchitect-ai-skills",
    expiresAt: "2026-08-28T00:00:00.000Z",
    allowedLifecycleChain: [...phases],
    checkpointPath: `runs/${runId}/controller.json`,
    resourceRecords: [],
    issueIntakeRecords: [],
    authContextRecords: [],
    cleanupReceipts: [],
    completedEntries: [],
    currentPhase: "propose",
    steps: phases.map((id) => ({ id, status: "pending" })),
    v2Admission: {
      schemaVersion: 1,
      state: "pending",
      repositoryId,
      parentRunId: `parent-${authorizationDigest.slice(0, 32)}`,
      workUnitId: `workunit-${authorizationDigest.slice(0, 32)}`,
      claimId: `claim-${authorizationDigest.slice(0, 32)}`,
      providerBinding: { id: "provider", digest: "b".repeat(64) },
    preparedAt: "2026-08-27T00:00:00.000Z"
    },
    ...overrides
  };
}

function authorizationFixture(controller, reference, recordDigest) {
  return {
    schemaVersion: 1,
    approved: true,
    id: "retire-pending-1",
    scopeDigest: "c".repeat(64),
    repository: controller.repository,
    selectedEntry: controller.selectedEntry,
    expiresAt: "2026-08-30T23:59:59.000Z",
    pendingController: {
      reference,
      recordDigest,
      runId: controller.runId,
      authorizationDigest: controller.authorizationDigest,
      controllerExpiresAt: controller.expiresAt,
      repositoryId,
      parentRunId: controller.v2Admission.parentRunId,
      workUnitId: controller.v2Admission.workUnitId,
      claimId: controller.v2Admission.claimId,
      providerBinding: controller.v2Admission.providerBinding
    }
  };
}

test("pending-controller baseline accepts only an expired never-admitted non-progressed controller", () => {
  const controller = pendingControllerFixture();
  assert.equal(validatePendingControllerBaseline(controller).valid, true);
  assert.equal(validatePendingControllerBaseline({ ...controller, currentPhase: "apply" }).valid, false);
  assert.equal(validatePendingControllerBaseline({ ...controller, v2Admission: { ...controller.v2Admission, state: "admitted" } }).valid, false);
  assert.equal(validatePendingControllerBaseline({ ...controller, steps: phases.map((id) => ({ id, status: "complete" })) }).valid, false);
  assert.equal(validatePendingControllerBaseline({ ...controller, expiresAt: "2099-01-01T00:00:00.000Z" }).valid, false);
  assert.equal(validatePendingControllerBaseline({ ...controller, resourceRecords: [{ kind: "x", id: "y" }] }).valid, false);
});

test("retired pending controller is reclassified compatible-terminal by inventory", () => {
  const controller = pendingControllerFixture();
  const controllerContent = JSON.stringify(controller);
  const stateHome = fs.mkdtempSync(path.join(os.tmpdir(), "pending-retirement-test-"));
  const repositoryPath = fs.mkdtempSync(path.join(os.tmpdir(), "pending-retirement-repo-"));
  try {
    fs.mkdirSync(path.join(repositoryPath, ".git", "sdd-delivery-runs", "runs", controller.runId), { recursive: true });
    const reference = path.join(fs.realpathSync(repositoryPath), ".git", "sdd-delivery-runs", "runs", controller.runId, "controller.json");
    fs.writeFileSync(reference, controllerContent);
    const recordDigest = legacyRecordDigest(controllerContent);
    const authorization = authorizationFixture(controller, reference, recordDigest);
    const retired = retireExpiredPendingController({
      authorization, repositoryPath, stateHome,
      readableRepositoryName, repositoryId, canonicalRemote,
      runGit: () => ".git",
      now: "2026-08-30T00:00:00.000Z"
    });
    assert.equal(retired.valid, true, JSON.stringify(retired));
    assert.equal(retired.receipt.kind, "pending-controller-retirement-receipt");
    assert.equal(retired.receipt.recordDigest, recordDigest);
    const published = publishPendingRetirementReceipt({ receipt: retired.receipt, stateHome, readableRepositoryName, repositoryId });
    assert.equal(published.valid, true);
    assert.equal(published.classification, "retired");
    const again = publishPendingRetirementReceipt({ receipt: retired.receipt, stateHome, readableRepositoryName, repositoryId });
    assert.equal(again.classification, "already-retired");
    const inventory = inventoryLegacyRecords([{ reference, content: controllerContent }], { pendingRetirementReceipts: [retired.receipt], now: "2026-08-30T00:00:00.000Z" });
    assert.equal(inventory.valid, true);
    assert.equal(inventory.entries[0].classification, "compatible-terminal");
    assert.equal(inventory.entries[0].reason, "legacy-record-pending-retired");
    const blocked = inventoryLegacyRecords([{ reference, content: controllerContent }], { pendingRetirementReceipts: [], now: "2026-08-30T00:00:00.000Z" });
    assert.equal(blocked.entries[0].classification, "ambiguous");
  } finally {
    fs.rmSync(stateHome, { recursive: true, force: true });
    fs.rmSync(repositoryPath, { recursive: true, force: true });
  }
});

test("retirement fails closed for mismatched authority and every durable state conflict", () => {
  const controller = pendingControllerFixture();
  const controllerContent = JSON.stringify(controller);
  const repositoryPath = fs.mkdtempSync(path.join(os.tmpdir(), "pending-retirement-conflict-repo-"));
  const stateHome = fs.mkdtempSync(path.join(os.tmpdir(), "pending-retirement-conflict-state-"));
  try {
    fs.mkdirSync(path.join(repositoryPath, ".git", "sdd-delivery-runs", "runs", controller.runId), { recursive: true });
    const reference = path.join(fs.realpathSync(repositoryPath), ".git", "sdd-delivery-runs", "runs", controller.runId, "controller.json");
    fs.writeFileSync(reference, controllerContent);
    const recordDigest = legacyRecordDigest(controllerContent);
    const authorization = authorizationFixture(controller, reference, recordDigest);
    const invoke = (overrides = {}) => retireExpiredPendingController({
      authorization, repositoryPath, stateHome, readableRepositoryName, repositoryId, canonicalRemote,
      runGit: () => ".git", now: "2026-08-30T00:00:00.000Z", ...overrides
    });
    assert.equal(invoke({ authorization: { ...authorization, pendingController: { ...authorization.pendingController, recordDigest: "f".repeat(64) } } }).reason, "pending-retirement-authorization-mismatch");
    assert.equal(invoke({ authorization: { ...authorization, repository: "other/repository" } }).reason, "pending-retirement-authorization-mismatch");
    const paths = statePaths({ stateHome, readableName: readableRepositoryName, repositoryId });
    fs.mkdirSync(path.join(paths.active, controller.v2Admission.parentRunId), { recursive: true });
    assert.equal(invoke().reason, "pending-retirement-active-parent-present");
    fs.rmSync(path.join(paths.active, controller.v2Admission.parentRunId), { recursive: true, force: true });
    fs.mkdirSync(path.join(paths.archive, "2026", "08", "30", controller.v2Admission.parentRunId), { recursive: true });
    assert.equal(invoke().reason, "pending-retirement-archive-parent-present");
    fs.rmSync(path.join(paths.archive, "2026"), { recursive: true, force: true });
    fs.mkdirSync(path.join(paths.index, "runs"), { recursive: true });
    fs.writeFileSync(path.join(paths.index, "runs", `${controller.v2Admission.parentRunId}.json`), "{}\n");
    assert.equal(invoke().reason, "pending-retirement-projection-parent-present");
  } finally {
    fs.rmSync(repositoryPath, { recursive: true, force: true });
    fs.rmSync(stateHome, { recursive: true, force: true });
  }
});

test("receipt validation rejects forged, future, and changed checkpoint evidence", () => {
  const controller = pendingControllerFixture();
  const controllerContent = JSON.stringify(controller);
  const repositoryPath = fs.mkdtempSync(path.join(os.tmpdir(), "pending-retirement-receipt-repo-"));
  const stateHome = fs.mkdtempSync(path.join(os.tmpdir(), "pending-retirement-receipt-state-"));
  try {
    fs.mkdirSync(path.join(repositoryPath, ".git", "sdd-delivery-runs", "runs", controller.runId), { recursive: true });
    const reference = path.join(fs.realpathSync(repositoryPath), ".git", "sdd-delivery-runs", "runs", controller.runId, "controller.json");
    fs.writeFileSync(reference, controllerContent);
    const recordDigest = legacyRecordDigest(controllerContent);
    const authorization = authorizationFixture(controller, reference, recordDigest);
    const retired = retireExpiredPendingController({ authorization, repositoryPath, stateHome, readableRepositoryName, repositoryId, canonicalRemote, runGit: () => ".git", now: "2026-08-30T00:00:00.000Z" });
    assert.equal(retired.valid, true);
    const forged = { ...retired.receipt, runId: "controller-forged" };
    assert.equal(publishPendingRetirementReceipt({ receipt: forged, stateHome, readableRepositoryName, repositoryId }).reason, "pending-retirement-receipt-invalid");
    const changedController = `${controllerContent}\n`;
    assert.equal(inventoryLegacyRecords([{ reference, content: changedController }], { pendingRetirementReceipts: [retired.receipt], now: "2026-08-30T00:00:00.000Z" }).entries[0].classification, "ambiguous");
    assert.equal(inventoryLegacyRecords([{ reference, content: controllerContent }], { pendingRetirementReceipts: [{ ...retired.receipt, reconciledAt: "2099-01-01T00:00:00.000Z" }], now: "2026-08-30T00:00:00.000Z" }).entries[0].classification, "ambiguous");
  } finally {
    fs.rmSync(repositoryPath, { recursive: true, force: true });
    fs.rmSync(stateHome, { recursive: true, force: true });
  }
});
