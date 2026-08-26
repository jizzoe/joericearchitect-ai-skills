import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { admitV2Run, inspectV2Admission } from "../autonomous-sdd-admission.mjs";
import { advanceControllerQueue, advanceControllerRecord, cancelExpiredV2Run, initializeV2Delivery, inspectControllerRecord, registerControllerResource, terminalizeV2Run } from "../autonomous-sdd-controller.mjs";
import { decodeLegacyRecord, denyLegacyMutation, inventoryLegacyDirectory, inventoryLegacyRecords } from "../autonomous-sdd-legacy.mjs";
import { legacyRecordDigest, publishLegacyReconciliationReceipt, reconcileLegacyBootstrapRecord } from "../autonomous-sdd-legacy-reconciliation.mjs";
import { deriveRepositoryId, digestValue } from "../autonomous-sdd-run-contract.mjs";
import { resolveSddDeliveryRequest } from "../resolve-sdd-delivery-request.mjs";
import { resolveRuntimeConfiguration } from "../runtime-configuration.mjs";

const root = () => fs.mkdtempSync(path.join(os.tmpdir(), "autonomous-sdd-admission-"));
const now = "2026-08-20T12:00:00.000Z";
const authorization = resolveSddDeliveryRequest({ target: "v2-contract", mode: "autonomous", qualityProfile: "prototype-rapid", authorizationProfile: "sdd-delivery", reviewPolicy: "same-session-local", expiration: "4h" }, { goalStartedAt: now }).effectiveAuthorization;
const provider = { schemaVersion: 1, id: "native-claim", generationFence: true, explicitTakeover: true, durableWrite: true, directoryMetadataDurability: true, platforms: { windows: "LockFileEx", posix: "advisory-lock" } };
const historyBinding = { id: "local-history", digest: "a".repeat(64) };
const fixture = (stateHome, overrides = {}) => ({ authorization, canonicalRemote: "git@github.com:owner/repository.git", readableRepositoryName: "repository", historyBinding, provider, owner: { host: "fixture-host", boot: "fixture-boot", pidStart: "fixture-process" }, stateHome, parentRunId: "parent-run-001", workUnitId: "work-unit-001", claimId: "claim-001", now, ...overrides });
const terminalizationFor = (admitted) => ({
  schemaVersion: 1,
  parentRunId: admitted.parentRun.parentRunId,
  workUnitId: admitted.workUnit.workUnitId,
  claimId: admitted.claim.claimId,
  repositoryId: admitted.repositoryId,
  approvedChangeId: admitted.workUnit.approvedChangeId,
  provider,
  completionEvidence: {
    current: true,
    implementation: { merged: true, reference: "implementation-pr", deliveredHeadCommit: "d".repeat(40) },
    sync: { merged: true, reference: "sync-pr", deliveredHeadCommit: "e".repeat(40) },
    archive: { merged: true, reference: "archive-pr", deliveredHeadCommit: "f".repeat(40) },
    issueClosed: true,
    projectDone: true,
    cleanupCompleted: true,
    observedAt: "2026-08-20T12:20:00.000Z"
  },
  terminal: {
    terminalStatus: "complete",
    terminalReason: "delivered-and-archived",
    terminalAt: "2026-08-20T12:30:00.000Z",
    finalHead: "f".repeat(40),
    attemptCount: 1,
    correctionCount: 0,
    cleanupDisposition: "completed",
    childHistoryReference: "external-delivery-evidence",
    childHistoryDigest: "d".repeat(64)
  }
});

function terminalControllerArchiveFixture() {
  const stateHome = root();
  const repositoryPath = root();
  fs.mkdirSync(path.join(repositoryPath, ".git"));
  fs.mkdirSync(path.join(repositoryPath, "config"));
  fs.writeFileSync(path.join(repositoryPath, "config", "ai-skills.json"), JSON.stringify({ runtime: { schemaVersion: 1, evidenceRoot: "evidence" } }));
  const common = path.join(repositoryPath, ".git", "sdd-delivery-runs");
  const initialized = initializeV2Delivery({ ...fixture(stateHome), repository: "owner/repository", repositoryPath, legacyDirectory: common, runGit: () => ".git" });
  const controller = structuredClone(initialized.record);
  controller.currentPhase = null;
  controller.steps = controller.steps.map((step) => ({ ...step, status: "complete", evidence: { current: true } }));
  fs.writeFileSync(initialized.checkpointPath, `${JSON.stringify(controller, null, 2)}\n`);
  const terminalized = terminalizeV2Run({ readableRepositoryName: "repository", stateHome, terminalization: terminalizationFor(initialized.admission), now: "2026-08-20T12:31:00.000Z" });
  return { stateHome, repositoryPath, common, initialized, controller, terminalized };
}

test("legacy inventory is read-only, deterministic, and blocks dual authority", () => {
  const legacy = { schemaVersion: 4, runId: "legacy-run-001", selectedEntry: "v2-contract", repository: "owner/repository", currentPhase: "apply", steps: [] };
  assert.equal(decodeLegacyRecord(legacy).classification, "active-legacy");
  assert.equal(inventoryLegacyRecords([legacy]).classification, "active-legacy");
  assert.equal(inventoryLegacyRecords(["not-json"]).classification, "ambiguous");
  assert.equal(denyLegacyMutation().reason, "legacy-write-denied");
  const directory = root();
  try {
    const file = path.join(directory, "controller.json"); fs.writeFileSync(file, `${JSON.stringify(legacy)}\n`);
    const before = fs.readFileSync(file, "utf8");
    assert.equal(inventoryLegacyDirectory(directory).classification, "active-legacy");
    assert.equal(fs.readFileSync(file, "utf8"), before);
  } finally { fs.rmSync(directory, { recursive: true, force: true }); }
});

test("legacy directory inventory ignores non-controller JSON and keeps unknown controller schemas ambiguous", () => {
  const directory = root();
  try {
    const request = path.join(directory, "initializer-request.json");
    fs.writeFileSync(request, JSON.stringify({ authorization: { target: "v2-contract" } }));
    const requestBefore = fs.readFileSync(request, "utf8");
    assert.equal(inventoryLegacyDirectory(directory).classification, "compatible");
    assert.equal(fs.readFileSync(request, "utf8"), requestBefore);

    const candidate = path.join(directory, "runs", "unknown", "controller.json");
    fs.mkdirSync(path.dirname(candidate), { recursive: true });
    fs.writeFileSync(candidate, JSON.stringify({ schemaVersion: 99, runId: "unknown", selectedEntry: "v2-contract", repository: "owner/repository" }));
    const candidateBefore = fs.readFileSync(candidate, "utf8");
    const result = inventoryLegacyDirectory(directory);
    assert.equal(result.classification, "ambiguous");
    assert.equal(result.ambiguous[0].reason, "legacy-schema-unknown");
    const content = fs.readFileSync(candidate, "utf8");
    const callerAssertion = inventoryLegacyRecords([{ reference: candidate, content }], {
      verifiedTerminalV2Controllers: [{
        reference: candidate, recordDigest: legacyRecordDigest(content), runId: "unknown",
        selectedEntry: "v2-contract", repository: "owner/repository"
      }]
    });
    assert.equal(callerAssertion.classification, "ambiguous");
    assert.equal(fs.readFileSync(candidate, "utf8"), candidateBefore);
  } finally { fs.rmSync(directory, { recursive: true, force: true }); }
});

test("admission inventories an existing legacy checkpoint directory before writing v2 state", () => {
  const stateHome = root();
  const legacyHome = root();
  try {
    fs.mkdirSync(path.join(legacyHome, "runs", "legacy-run-001"), { recursive: true });
    fs.writeFileSync(path.join(legacyHome, "runs", "legacy-run-001", "controller.json"), JSON.stringify({ schemaVersion: 4, runId: "legacy-run-001", selectedEntry: "v2-contract", repository: "owner/repository", currentPhase: "apply" }));
    const result = admitV2Run(fixture(stateHome, { legacyDirectory: legacyHome }));
    assert.equal(result.reason, "legacy-authority-active");
    assert.equal(fs.existsSync(path.join(stateHome, "repositories")), false);
  } finally { fs.rmSync(stateHome, { recursive: true, force: true }); fs.rmSync(legacyHome, { recursive: true, force: true }); }
});

test("admission accepts only an exact terminal reconciliation receipt for an otherwise active legacy record", () => {
  const stateHome = root();
  const legacyHome = root();
  try {
    const legacy = { schemaVersion: 4, runId: "legacy-run-001", selectedEntry: "v2-contract", repository: "owner/repository", currentPhase: "apply", resourceRecords: [] };
    const content = `${JSON.stringify(legacy)}\n`;
    const reference = path.join(legacyHome, "runs", "legacy-run-001", "controller.json");
    fs.mkdirSync(path.dirname(reference), { recursive: true }); fs.writeFileSync(reference, content);
    const reconciliationAuthorization = { schemaVersion: 1, approved: true, id: "bootstrap-reconciliation", scopeDigest: "b".repeat(64), expiresAt: "2026-08-20T13:00:00.000Z", selectedEntry: "v2-contract", repository: "owner/repository", legacyRecords: [{ reference, recordDigest: legacyRecordDigest(content) }] };
    const evidence = { observedAt: now, issue: { state: "CLOSED", reference: "issue" }, implementation: { merged: true, reference: "implementation", topicHeadCommit: "1".repeat(40), deliveredHeadCommit: "2".repeat(40) }, sync: { merged: true, reference: "sync", topicHeadCommit: "3".repeat(40), deliveredHeadCommit: "4".repeat(40) }, archive: { merged: true, reference: "archive", topicHeadCommit: "5".repeat(40), deliveredHeadCommit: "6".repeat(40) }, cleanup: [] };
    const receipt = reconcileLegacyBootstrapRecord({ authorization: reconciliationAuthorization, legacy: { reference, content }, evidence, now });
    assert.equal(receipt.valid, true);
    assert.equal(publishLegacyReconciliationReceipt({ receipt: receipt.receipt, stateHome, readableRepositoryName: "repository", repositoryId: deriveRepositoryId("git@github.com:owner/repository.git") }).valid, true);
    assert.equal(admitV2Run(fixture(stateHome, { legacyDirectory: legacyHome })).classification, "admitted");
    assert.equal(fs.readFileSync(reference, "utf8"), content);
  } finally { fs.rmSync(stateHome, { recursive: true, force: true }); fs.rmSync(legacyHome, { recursive: true, force: true }); }
});

test("v2 admission persists an isolated parent, work unit, and generation-one claim before a phase", () => {
  const stateHome = root();
  try {
    const admitted = admitV2Run(fixture(stateHome));
    assert.equal(admitted.valid, true);
    assert.equal(admitted.classification, "admitted");
    assert.deepEqual(admitted.parentRun.children, []);
    assert.equal(admitted.workUnit.approvedChangeId, "v2-contract");
    assert.deepEqual(admitted.workUnit.configurationSnapshot, { schemaVersion: 1, sources: [], values: {} });
    assert.equal(admitted.workUnit.configurationDigest, digestValue(admitted.workUnit.configurationSnapshot));
    assert.equal(admitted.claim.ownershipGeneration, 1);
    assert.equal(admitted.operationContract.compactStage, "admitted");
    assert.equal(admitted.operationContract.agentTopology.topology, "multi-agent");
    assert.equal(fs.existsSync(path.join(admitted.paths.active, "parent-run-001", "parent-run.json")), true);
    assert.equal(fs.existsSync(path.join(admitted.paths.active, "parent-run-001", "operation-contract.json")), true);
    const providerBinding = { id: provider.id, digest: digestValue(provider) };
    assert.equal(inspectV2Admission({ stateHome, readableRepositoryName: "repository", repositoryId: admitted.repositoryId, authorization, providerBinding, now }).classification, "resumed");
    assert.equal(admitV2Run(fixture(stateHome)).classification, "resumed");
  } finally { fs.rmSync(stateHome, { recursive: true, force: true }); }
});

test("controller initialization persists exact pending context before admitting and resumes only its matching v2 run", () => {
  const stateHome = root();
  const repositoryPath = root();
  try {
    fs.mkdirSync(path.join(repositoryPath, ".git"));
    fs.mkdirSync(path.join(repositoryPath, "config"));
    fs.writeFileSync(path.join(repositoryPath, "config", "ai-skills.json"), JSON.stringify({ runtime: { schemaVersion: 1, evidenceRoot: "evidence" } }));
    const initialized = initializeV2Delivery({
      ...fixture(stateHome), repository: "owner/repository", repositoryPath,
      legacyDirectory: path.join(repositoryPath, ".git", "sdd-delivery-runs"), runGit: () => ".git"
    });
    assert.equal(initialized.valid, true, JSON.stringify(initialized));
    assert.equal(initialized.classification, "initialized");
    assert.equal(initialized.record.schemaVersion, 5);
    assert.equal(initialized.record.v2Admission.state, "admitted");
    assert.equal(initialized.record.v2Admission.parentRunId, initialized.admission.parentRun.parentRunId);
    assert.equal(initialized.record.v2Admission.workUnitId, initialized.admission.workUnit.workUnitId);
    assert.equal(initialized.record.v2Admission.claimId, initialized.admission.claim.claimId);
    assert.equal(inspectControllerRecord(initialized.record, { authorization, repository: "owner/repository", now }).nextPhase, "propose");
    assert.equal(fs.existsSync(initialized.checkpointPath), true);
    const resumed = initializeV2Delivery({
      ...fixture(stateHome), repository: "owner/repository", repositoryPath,
      legacyDirectory: path.join(repositoryPath, ".git", "sdd-delivery-runs"), runGit: () => ".git"
    });
    assert.equal(resumed.valid, true);
    assert.equal(resumed.classification, "resumed");
    assert.equal(resumed.record.v2Admission.parentRunId, initialized.record.v2Admission.parentRunId);
  } finally {
    fs.rmSync(stateHome, { recursive: true, force: true });
    fs.rmSync(repositoryPath, { recursive: true, force: true });
  }
});

test("installed initializer admits after a prior schema-5 controller has exact immutable terminal archive evidence", () => {
  const stateHome = root();
  const repositoryPath = root();
  const nextAuthorization = resolveSddDeliveryRequest({ target: "next-change", mode: "autonomous", qualityProfile: "prototype-rapid", authorizationProfile: "sdd-delivery", reviewPolicy: "same-session-local", expiration: "4h" }, { goalStartedAt: now }).effectiveAuthorization;
  try {
    fs.mkdirSync(path.join(repositoryPath, ".git"));
    fs.mkdirSync(path.join(repositoryPath, "config"));
    fs.writeFileSync(path.join(repositoryPath, "config", "ai-skills.json"), JSON.stringify({ runtime: { schemaVersion: 1, evidenceRoot: "evidence" } }));
    const common = path.join(repositoryPath, ".git", "sdd-delivery-runs");
    const first = initializeV2Delivery({
      ...fixture(stateHome), repository: "owner/repository", repositoryPath,
      legacyDirectory: common, runGit: () => ".git"
    });
    assert.equal(first.valid, true, JSON.stringify(first));
    const terminalController = structuredClone(first.record);
    terminalController.currentPhase = null;
    terminalController.steps = terminalController.steps.map((step) => ({ ...step, status: "complete", evidence: { current: true, reference: step.id } }));
    fs.writeFileSync(first.checkpointPath, `${JSON.stringify(terminalController, null, 2)}\n`);
    assert.equal(JSON.parse(fs.readFileSync(first.checkpointPath, "utf8")).currentPhase, null);
    const controllerBefore = fs.readFileSync(first.checkpointPath, "utf8");
    const terminalized = terminalizeV2Run({ readableRepositoryName: "repository", stateHome, terminalization: terminalizationFor(first.admission), now: "2026-08-20T12:31:00.000Z" });
    assert.equal(terminalized.classification, "terminalized", JSON.stringify(terminalized));
    assert.equal(JSON.parse(fs.readFileSync(first.checkpointPath, "utf8")).currentPhase, null);
    const archiveBefore = new Map(fs.readdirSync(terminalized.archivePath).map((name) => [name, fs.readFileSync(path.join(terminalized.archivePath, name), "utf8")]));

    const next = initializeV2Delivery({
      ...fixture(stateHome, { authorization: nextAuthorization }), repository: "owner/repository", repositoryPath,
      legacyDirectory: common, runGit: () => ".git"
    });
    assert.equal(next.valid, true, JSON.stringify(next));
    assert.equal(next.classification, "initialized");
    assert.notEqual(next.record.runId, terminalController.runId);
    const retried = initializeV2Delivery({
      ...fixture(stateHome, { authorization: nextAuthorization }), repository: "owner/repository", repositoryPath,
      legacyDirectory: common, runGit: () => ".git"
    });
    assert.equal(retried.classification, "resumed");
    assert.equal(retried.record.v2Admission.parentRunId, next.record.v2Admission.parentRunId);
    assert.equal(fs.readFileSync(first.checkpointPath, "utf8"), controllerBefore);
    for (const [name, content] of archiveBefore) assert.equal(fs.readFileSync(path.join(terminalized.archivePath, name), "utf8"), content);
  } finally {
    fs.rmSync(stateHome, { recursive: true, force: true });
    fs.rmSync(repositoryPath, { recursive: true, force: true });
  }
});

test("installed initializer admits after a prior schema-5 controller was cancelled and retired", () => {
  const stateHome = root();
  const repositoryPath = root();
  const nextAuthorization = resolveSddDeliveryRequest({ target: "next-change", mode: "autonomous", qualityProfile: "prototype-rapid", authorizationProfile: "sdd-delivery", reviewPolicy: "same-session-local", expiration: "4h" }, { goalStartedAt: now }).effectiveAuthorization;
  try {
    fs.mkdirSync(path.join(repositoryPath, ".git"));
    fs.mkdirSync(path.join(repositoryPath, "config"));
    fs.writeFileSync(path.join(repositoryPath, "config", "ai-skills.json"), JSON.stringify({ runtime: { schemaVersion: 1, evidenceRoot: "evidence" } }));
    const common = path.join(repositoryPath, ".git", "sdd-delivery-runs");
    const first = initializeV2Delivery({
      ...fixture(stateHome), repository: "owner/repository", repositoryPath,
      legacyDirectory: common, runGit: () => ".git"
    });
    assert.equal(first.valid, true, JSON.stringify(first));
    const cancellation = {
      schemaVersion: 1,
      controllerRunId: first.record.runId,
      parentRunId: first.admission.parentRun.parentRunId,
      workUnitId: first.admission.workUnit.workUnitId,
      claimId: first.admission.claim.claimId,
      repositoryId: first.admission.repositoryId,
      approvedChangeId: first.admission.workUnit.approvedChangeId,
      provider
    };
    const cancelled = cancelExpiredV2Run({ readableRepositoryName: "repository", cancellation, stateHome, now: "2026-08-20T17:00:00.000Z" });
    assert.equal(cancelled.classification, "cancelled", JSON.stringify(cancelled));
    const controllerBefore = fs.readFileSync(first.checkpointPath, "utf8");

    const next = initializeV2Delivery({
      ...fixture(stateHome, { authorization: nextAuthorization }), repository: "owner/repository", repositoryPath,
      legacyDirectory: common, runGit: () => ".git"
    });
    assert.equal(next.valid, true, JSON.stringify(next));
    assert.equal(next.classification, "initialized");
    assert.notEqual(next.record.runId, first.record.runId);
    assert.equal(fs.readFileSync(first.checkpointPath, "utf8"), controllerBefore);
  } finally {
    fs.rmSync(stateHome, { recursive: true, force: true });
    fs.rmSync(repositoryPath, { recursive: true, force: true });
  }
});

test("terminal-looking schema-5 controller remains ambiguous when immutable archive identity is mismatched", () => {
  const stateHome = root();
  const repositoryPath = root();
  const nextAuthorization = resolveSddDeliveryRequest({ target: "next-change", mode: "autonomous", qualityProfile: "prototype-rapid", authorizationProfile: "sdd-delivery", reviewPolicy: "same-session-local", expiration: "4h" }, { goalStartedAt: now }).effectiveAuthorization;
  try {
    fs.mkdirSync(path.join(repositoryPath, ".git"));
    fs.mkdirSync(path.join(repositoryPath, "config"));
    fs.writeFileSync(path.join(repositoryPath, "config", "ai-skills.json"), JSON.stringify({ runtime: { schemaVersion: 1, evidenceRoot: "evidence" } }));
    const common = path.join(repositoryPath, ".git", "sdd-delivery-runs");
    const first = initializeV2Delivery({ ...fixture(stateHome), repository: "owner/repository", repositoryPath, legacyDirectory: common, runGit: () => ".git" });
    const terminalController = structuredClone(first.record);
    terminalController.currentPhase = null;
    terminalController.steps = terminalController.steps.map((step) => ({ ...step, status: "complete", evidence: { current: true } }));
    fs.writeFileSync(first.checkpointPath, `${JSON.stringify(terminalController)}\n`);
    const terminalized = terminalizeV2Run({ readableRepositoryName: "repository", stateHome, terminalization: terminalizationFor(first.admission), now: "2026-08-20T12:31:00.000Z" });
    const receiptPath = path.join(terminalized.archivePath, "terminalization-receipt.json");
    const receipt = JSON.parse(fs.readFileSync(receiptPath, "utf8"));
    receipt.approvedChangeId = "different-change";
    fs.writeFileSync(receiptPath, `${JSON.stringify(receipt)}\n`);
    const result = initializeV2Delivery({ ...fixture(stateHome, { authorization: nextAuthorization }), repository: "owner/repository", repositoryPath, legacyDirectory: common, runGit: () => ".git" });
    assert.equal(result.reason, "legacy-inventory-ambiguous");
    const active = path.join(stateHome, "repositories", "repository--" + deriveRepositoryId("git@github.com:owner/repository.git").slice(3, 15), "active");
    assert.deepEqual(fs.readdirSync(active), []);
  } finally {
    fs.rmSync(stateHome, { recursive: true, force: true });
    fs.rmSync(repositoryPath, { recursive: true, force: true });
  }
});

test("terminal schema-5 compatibility fails closed for incomplete, escaped, duplicated, or conflicting evidence", () => {
  const nextAuthorization = resolveSddDeliveryRequest({ target: "next-change", mode: "autonomous", qualityProfile: "prototype-rapid", authorizationProfile: "sdd-delivery", reviewPolicy: "same-session-local", expiration: "4h" }, { goalStartedAt: now }).effectiveAuthorization;
  const cases = [
    ["active controller", ({ initialized }) => fs.writeFileSync(initialized.checkpointPath, `${JSON.stringify(initialized.record)}\n`)],
    ["pending controller", ({ initialized, controller }) => fs.writeFileSync(initialized.checkpointPath, `${JSON.stringify({ ...controller, v2Admission: { ...controller.v2Admission, state: "pending" } })}\n`)],
    ["missing release", ({ terminalized }) => fs.rmSync(path.join(terminalized.archivePath, "claim-release.json"))],
    ["malformed projection", ({ terminalized }) => fs.writeFileSync(path.join(terminalized.archivePath, "projection.json"), "not-json")],
    ["repository conflict", ({ initialized, controller }) => fs.writeFileSync(initialized.checkpointPath, `${JSON.stringify({ ...controller, repository: "other/repository" })}\n`)],
    ["authorization conflict", ({ initialized, controller }) => fs.writeFileSync(initialized.checkpointPath, `${JSON.stringify({ ...controller, authorizationDigest: "0".repeat(64) })}\n`)],
    ["provider conflict", ({ initialized, controller }) => fs.writeFileSync(initialized.checkpointPath, `${JSON.stringify({ ...controller, v2Admission: { ...controller.v2Admission, providerBinding: { ...controller.v2Admission.providerBinding, digest: "0".repeat(64) } } })}\n`)],
    ["identity conflict", ({ initialized, controller }) => fs.writeFileSync(initialized.checkpointPath, `${JSON.stringify({ ...controller, v2Admission: { ...controller.v2Admission, claimId: "different-claim" } })}\n`)],
    ["digest conflict", ({ terminalized }) => {
      const manifestPath = path.join(terminalized.archivePath, "archive-manifest.json");
      const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
      fs.writeFileSync(manifestPath, `${JSON.stringify({ ...manifest, projectionDigest: "0".repeat(64) })}\n`);
    }],
    ["duplicate archive", ({ terminalized }) => {
      const duplicate = path.join(path.dirname(path.dirname(terminalized.archivePath)), "21", path.basename(terminalized.archivePath));
      fs.mkdirSync(path.dirname(duplicate), { recursive: true });
      fs.cpSync(terminalized.archivePath, duplicate, { recursive: true });
    }],
    ["symlinked archive", ({ terminalized }) => {
      const real = `${terminalized.archivePath}-real`;
      fs.renameSync(terminalized.archivePath, real);
      fs.symlinkSync(real, terminalized.archivePath, "dir");
    }]
  ];
  for (const [name, mutate] of cases) {
    const setup = terminalControllerArchiveFixture();
    try {
      mutate(setup);
      const result = initializeV2Delivery({ ...fixture(setup.stateHome, { authorization: nextAuthorization }), repository: "owner/repository", repositoryPath: setup.repositoryPath, legacyDirectory: setup.common, runGit: () => ".git" });
      assert.equal(result.reason, "legacy-inventory-ambiguous", name);
      const active = path.join(setup.stateHome, "repositories", "repository--" + deriveRepositoryId("git@github.com:owner/repository.git").slice(3, 15), "active");
      assert.deepEqual(fs.readdirSync(active), [], name);
    } finally {
      fs.rmSync(setup.stateHome, { recursive: true, force: true });
      fs.rmSync(setup.repositoryPath, { recursive: true, force: true });
    }
  }
});

test("raw admission cannot use caller-selected exclusions to hide a legacy controller", () => {
  const stateHome = root();
  const legacyHome = root();
  try {
    const reference = path.join(legacyHome, "runs", "active", "controller.json");
    fs.mkdirSync(path.dirname(reference), { recursive: true });
    fs.writeFileSync(reference, JSON.stringify({ schemaVersion: 4, runId: "legacy-active", selectedEntry: "v2-contract", repository: "owner/repository", currentPhase: "apply", steps: [] }));
    const result = admitV2Run(fixture(stateHome, { legacyDirectory: legacyHome, legacyInventoryExclusions: [reference] }));
    assert.equal(result.reason, "legacy-authority-active");
    assert.equal(fs.existsSync(path.join(stateHome, "repositories")), false);
  } finally { fs.rmSync(stateHome, { recursive: true, force: true }); fs.rmSync(legacyHome, { recursive: true, force: true }); }
});

test("controller initialization preserves pending recovery context when admission cannot start and creates no active claim", () => {
  const stateHome = root();
  const repositoryPath = root();
  try {
    fs.mkdirSync(path.join(repositoryPath, ".git"));
    const result = initializeV2Delivery({
      ...fixture(stateHome), repository: "owner/repository", repositoryPath,
      runGit: () => ".git", admit: () => ({ valid: false, reason: "injected-admission-stop" })
    });
    assert.equal(result.valid, false);
    assert.equal(result.reason, "injected-admission-stop");
    assert.equal(fs.existsSync(path.join(stateHome, "repositories")), false);
    const checkpoint = path.join(repositoryPath, ".git", "sdd-delivery-runs", "runs", `controller-${digestValue(authorization).slice(0, 32)}`, "controller.json");
    const record = JSON.parse(fs.readFileSync(checkpoint, "utf8"));
    assert.equal(record.v2Admission.state, "pending");
    assert.equal(inspectControllerRecord(record, { authorization, repository: "owner/repository", now }).reason, "controller-initialization-pending");
    assert.equal(advanceControllerRecord(record, "propose", { current: true }).reason, "controller-phase-advance-invalid");
    assert.equal(advanceControllerQueue({
      ...record,
      queueEntries: [record.selectedEntry, "later-change"],
      queueIndex: 0,
      steps: record.steps.map((step) => ({ ...step, status: "complete", evidence: { current: true } }))
    }).reason, "controller-queue-advance-invalid");
    assert.equal(registerControllerResource(record, {
      kind: "branch", id: "repair/blocked", role: "implementation", registeredHeadCommit: "a".repeat(40), recoveryReference: "pending"
    }).reason, "controller-resource-registration-invalid");
  } finally {
    fs.rmSync(stateHome, { recursive: true, force: true });
    fs.rmSync(repositoryPath, { recursive: true, force: true });
  }
});

test("expired, active legacy, and immutable-conflict inputs preserve the existing admission", () => {
  const stateHome = root();
  try {
    const first = admitV2Run(fixture(stateHome));
    assert.equal(first.valid, true);
    assert.equal(admitV2Run(fixture(stateHome, { authorization: { ...authorization, expiresAt: now } })).reason, "v2-admission-authorization-invalid-or-expired");
    assert.equal(admitV2Run(fixture(root(), { legacyRecords: [{ schemaVersion: 4, runId: "legacy-run-001", selectedEntry: "v2-contract", repository: "owner/repository", currentPhase: "apply" }] })).reason, "legacy-authority-active");
    assert.equal(admitV2Run(fixture(stateHome, { authorization: { ...authorization, expiresAt: "2026-08-20T17:00:00.000Z" } })).reason, "v2-admission-immutable-conflict");
    assert.equal(admitV2Run(fixture(stateHome, { parentRunId: "parent-run-002", workUnitId: "work-unit-002", claimId: "claim-002" })).reason, "v2-admission-immutable-conflict");
    assert.equal(admitV2Run(fixture(stateHome, { canonicalRemote: "https://github.com/owner/changed-repository.git" })).reason, "repository-identity-conflict");
    assert.equal(fs.existsSync(path.join(first.paths.active, "parent-run-001", "parent-run.json")), true);
  } finally { fs.rmSync(stateHome, { recursive: true, force: true }); }
});

test("terminalization releases the completed claim, while a different later claim still blocks a third admission", () => {
  const stateHome = root();
  const nextAuthorization = resolveSddDeliveryRequest({ target: "next-change", mode: "autonomous", qualityProfile: "prototype-rapid", authorizationProfile: "sdd-delivery", reviewPolicy: "same-session-local", expiration: "4h" }, { goalStartedAt: now }).effectiveAuthorization;
  const otherAuthorization = resolveSddDeliveryRequest({ target: "other-change", mode: "autonomous", qualityProfile: "prototype-rapid", authorizationProfile: "sdd-delivery", reviewPolicy: "same-session-local", expiration: "4h" }, { goalStartedAt: now }).effectiveAuthorization;
  try {
    const first = admitV2Run(fixture(stateHome));
    const terminalized = terminalizeV2Run({ readableRepositoryName: "repository", stateHome, terminalization: terminalizationFor(first), now: "2026-08-20T12:31:00.000Z" });
    assert.equal(terminalized.classification, "terminalized");
    const next = admitV2Run(fixture(stateHome, {
      authorization: nextAuthorization,
      parentRunId: "next-parent-001",
      workUnitId: "next-work-unit-001",
      claimId: "next-claim-001"
    }));
    assert.equal(next.classification, "admitted");
    const blocked = admitV2Run(fixture(stateHome, {
      authorization: otherAuthorization,
      parentRunId: "other-parent-001",
      workUnitId: "other-work-unit-001",
      claimId: "other-claim-001"
    }));
    assert.equal(blocked.reason, "v2-admission-immutable-conflict");
  } finally { fs.rmSync(stateHome, { recursive: true, force: true }); }
});

test("the runtime exposes declared v2 initialization and refuses construction-only legacy verbs", () => {
  const module = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../runtime/bin/autonomous-sdd-controller.mjs");
  const refused = spawnSync(process.execPath, [module, "create-controller-record", "--stdin"], { encoding: "utf8", input: "{}" });
  assert.equal(refused.status, 2);
  assert.equal(JSON.parse(refused.stdout).error.code, "operation-not-declared");
  const source = fs.readFileSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../runtime/manifest.json"), "utf8");
  assert.match(source, /"initialize-v2-delivery"/);
  assert.match(source, /"admit-v2-run"/);
  assert.match(source, /"terminalize-v2-run"/);
  assert.match(source, /"advance-controller-lifecycle-phase"/);
  assert.match(source, /"retire-blocked-v2-run"/);
  assert.doesNotMatch(source, /"create-controller-record"|"advance-controller-record"/);
  const malformed = spawnSync(process.execPath, [module, "terminalize-v2-run", "--stdin"], { encoding: "utf8", input: "{}" });
  assert.equal(malformed.status, 0);
  assert.equal(JSON.parse(malformed.stdout).result.reason, "terminalization-input-invalid");
  const malformedInitializer = spawnSync(process.execPath, [module, "initialize-v2-delivery", "--stdin"], { encoding: "utf8", input: "{}" });
  assert.equal(malformedInitializer.status, 0);
  assert.equal(JSON.parse(malformedInitializer.stdout).result.reason, "controller-initialization-input-invalid");
});

test("both generated assistant adapters remain thin and delegate v2 initialization to canonical policy", () => {
  const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
  const canonical = fs.readFileSync(path.join(repository, "skills/base/autonomous-sdd-lifecycle/SKILL.md"), "utf8");
  assert.match(canonical, /initialize-v2-delivery/);
  assert.match(canonical, /reconcile-legacy-bootstrap-record/);
  for (const adapter of [".agents/skills/autonomous-sdd-lifecycle/SKILL.md", ".claude/skills/autonomous-sdd-lifecycle/SKILL.md"]) {
    const content = fs.readFileSync(path.join(repository, adapter), "utf8");
    assert.match(content, /canonical: \.\.\/\.\.\/\.\.\/skills\/base\/autonomous-sdd-lifecycle\/SKILL\.md/);
    assert.match(content, /must not duplicate/);
    assert.doesNotMatch(content, /create-controller-record|worktree-derived identity/);
  }
});

test("a second configured product uses only caller-provided identity and state", () => {
  const stateHome = root();
  try {
    const second = admitV2Run(fixture(stateHome, {
      canonicalRemote: "https://gitlab.com/another-organization/second-product.git",
      readableRepositoryName: "second-product",
      parentRunId: "second-parent-001",
      workUnitId: "second-work-unit-001",
      claimId: "second-claim-001"
    }));
    assert.equal(second.valid, true);
    assert.match(second.repositoryId, /^r1-[0-9a-f]{64}$/);
    assert.equal(second.canonicalRemoteIdentity, "gitlab.com/another-organization/second-product");
    const implementation = fs.readFileSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../autonomous-sdd-admission.mjs"), "utf8");
    assert.doesNotMatch(implementation, /owner\/repository|second-product|github\.com/);
  } finally { fs.rmSync(stateHome, { recursive: true, force: true }); }
});

test("runtime configuration is redacted, deterministic, and fails closed", () => {
  const valid = resolveRuntimeConfiguration({ product: { runtime: { schemaVersion: 1, evidenceRoot: "evidence", claimProvider: "native-claim" } } });
  assert.equal(valid.valid, true);
  assert.equal(resolveRuntimeConfiguration({ product: { runtime: { schemaVersion: 1, evidenceRoot: "../escape" } } }).reason, "runtime-configuration-unsafe-path");
  assert.equal(resolveRuntimeConfiguration({ product: { runtime: { schemaVersion: 1, evidenceRoot: "C:\\\\Users\\\\unsafe" } } }).reason, "runtime-configuration-unsafe-path");
  assert.equal(resolveRuntimeConfiguration({ product: { runtime: { schemaVersion: 1, token: "secret" } } }).reason, "runtime-configuration-invalid");
  assert.equal(resolveRuntimeConfiguration({ sealed: { claimProvider: "other" }, product: { runtime: { schemaVersion: 1, claimProvider: "native-claim" } } }).reason, "runtime-configuration-authority-conflict");
});

test("admission seals the configuration snapshot and never rereads it for a resumed run", () => {
  const stateHome = root();
  const repositoryPath = root();
  try {
    fs.mkdirSync(path.join(repositoryPath, "config"));
    fs.writeFileSync(path.join(repositoryPath, "config", "ai-skills.json"), JSON.stringify({ runtime: { schemaVersion: 1, evidenceRoot: "evidence" } }));
    const admitted = admitV2Run(fixture(stateHome, { repositoryPath }));
    assert.deepEqual(admitted.workUnit.configurationSnapshot, { schemaVersion: 1, sources: ["config/ai-skills.json:runtime"], values: { evidenceRoot: "evidence" } });
    fs.writeFileSync(path.join(repositoryPath, "config", "ai-skills.json"), JSON.stringify({ runtime: { schemaVersion: 1, evidenceRoot: "changed" } }));
    const resumed = admitV2Run(fixture(stateHome, { repositoryPath }));
    assert.equal(resumed.classification, "resumed");
    assert.deepEqual(resumed.workUnit.configurationSnapshot, admitted.workUnit.configurationSnapshot);
  } finally { fs.rmSync(stateHome, { recursive: true, force: true }); fs.rmSync(repositoryPath, { recursive: true, force: true }); }
});
