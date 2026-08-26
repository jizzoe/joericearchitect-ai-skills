import assert from "node:assert/strict";
import crypto from "node:crypto";
import test from "node:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  advanceControllerQueue,
  advanceControllerLifecyclePhase,
  advanceControllerRecord,
  appendControllerCleanupReceipt,
  attachBootstrapCleanupMigration,
  authorizationDigest,
  bindControllerIssueIntake,
  bindControllerAuthContext,
  bindControllerLifecycleDelivery,
  bindControllerResourceDelivery,
  createControllerRecord,
  evaluateControllerOperation,
  executeControllerLifecycleCleanup,
  executeBootstrapCleanupAttachment,
  inspectControllerRecord,
  persistControllerRecord,
  persistControllerCleanupReceipt,
  registerControllerIssueIntake,
  registerControllerAuthContext,
  registerControllerResource,
  registerControllerLifecycleResource,
  retainBootstrapCleanupResource,
  resolveControllerStateRoot,
  terminalizeV2Run
} from "../autonomous-sdd-controller.mjs";
import { legacyMigrationAuthorizationPayload } from "../sdd-workspace-cleanup.mjs";
import { inspectCheckpoint } from "../checkpoint.mjs";
import { checkAdapterDrift } from "../check-adapter-drift.mjs";
import { resolveSddDeliveryRequest } from "../resolve-sdd-delivery-request.mjs";
import { createIssueIntakeBinding } from "../issue-intake-binding.mjs";
import { createGithubAuthContextBinding, evaluateGithubAuthContextContrast } from "../github-cli-auth-context.mjs";
import { digestValue, RUN_CONTRACT_VERSION } from "../autonomous-sdd-run-contract.mjs";
import { createRepositoryClaim, ensureStateLayout, statePaths } from "../autonomous-sdd-local-store.mjs";

const started = "2026-08-13T12:00:00.000Z";
const authorization = resolveSddDeliveryRequest({ target: "complete-delivery", mode: "autonomous", qualityProfile: "production-rapid", authorizationProfile: "sdd-delivery", independentReviewPolicy: "strict-only", expiration: "12h" }, { goalStartedAt: started }).effectiveAuthorization;
const created = createControllerRecord({ authorization, repository: "owner/repository", runId: "controller-run-0001" });

const intakePayload = {
  repository: "owner/repository",
  title: "Complete delivery",
  body: "Human context\n\n<!-- sdd-managed:start -->\nOpenSpec change: `complete-delivery`\n<!-- sdd-managed:end -->",
  labels: ["sdd", "type:feature"],
  managedBlock: "<!-- sdd-managed:start -->\nOpenSpec change: `complete-delivery`\n<!-- sdd-managed:end -->"
};
const intakeBinding = createIssueIntakeBinding({ selectedEntry: "complete-delivery", payload: intakePayload, expiresAt: authorization.expiresAt }).binding;
const authContextBinding = createGithubAuthContextBinding({
  selectedEntry: "complete-delivery", operation: "issue-create-or-reuse", repository: "owner/repository",
  payloadDigest: intakeBinding.payloadDigest, expiresAt: authorization.expiresAt
}).binding;
const authContextEvidence = evaluateGithubAuthContextContrast({
  binding: authContextBinding,
  restrictedProbe: { commandKind: "github-api-user", contextType: "restricted", state: "success", account: "octocat", observedAt: started },
  observedAt: started
}).evidence;

const terminalProvider = { schemaVersion: 1, id: "native-claim", generationFence: true, explicitTakeover: true, durableWrite: true, directoryMetadataDurability: true, platforms: { windows: "LockFileEx", posix: "advisory-lock" } };
const terminalBinding = { id: terminalProvider.id, digest: digestValue(terminalProvider) };
const terminalHash = (value) => value.repeat(64).slice(0, 64);

function terminalizationFixture(stateHome, overrides = {}) {
  const repositoryId = `r1-${terminalHash("1")}`;
  const input = { stateHome, readableName: "example-repository", repositoryId };
  const paths = statePaths(input);
  ensureStateLayout(input);
  const parentRun = { kind: "parent-run", schemaVersion: RUN_CONTRACT_VERSION, parentRunId: "parent-run-001", approvedIntentDigest: terminalHash("a"), deadline: "2026-08-20T16:00:00.000Z", historyBinding: terminalBinding, claimProviderBinding: terminalBinding, children: [] };
  const workUnit = { kind: "work-unit", schemaVersion: RUN_CONTRACT_VERSION, workUnitId: "work-unit-001", parentRunId: parentRun.parentRunId, ordinal: 1, approvedChangeId: "example-change", authorizationDigest: terminalHash("b"), configurationSnapshot: { schemaVersion: 1, sources: [], values: {} }, configurationDigest: "ff0ec9a5e013e585c3fbc79c15a58470db800a93cd9a705f2c14db3f1e1520de", lifecycleState: "admitted", evidenceNamespace: "evidence-001", historyBinding: terminalBinding, claimProviderBinding: terminalBinding };
  const claim = createRepositoryClaim({ claimId: "claim-001", repositoryId, workUnitId: workUnit.workUnitId, owner: { host: "host", boot: "boot", pidStart: "pid" }, providerBinding: terminalBinding, acquiredAt: "2026-08-20T12:00:00.000Z", recoveryEvidence: {} }).record;
  const active = path.join(paths.active, parentRun.parentRunId);
  fs.mkdirSync(active, { recursive: true });
  for (const [name, record] of [["parent-run", parentRun], ["work-unit", workUnit], ["resource-claim", claim]]) fs.writeFileSync(path.join(active, `${name}.json`), `${JSON.stringify(record)}\n`);
  const terminalization = {
    schemaVersion: 1,
    parentRunId: parentRun.parentRunId,
    workUnitId: workUnit.workUnitId,
    claimId: claim.claimId,
    repositoryId,
    approvedChangeId: workUnit.approvedChangeId,
    provider: terminalProvider,
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
      childHistoryDigest: terminalHash("d")
    },
    ...overrides
  };
  return { paths, terminalization };
}

test("controller record starts at planning and resumes first incomplete phase", () => {
  assert.equal(created.valid, true);
  assert.deepEqual(inspectControllerRecord(created.record, { authorization, repository: "owner/repository", now: started }), { classification: "continue", reason: "controller-first-incomplete-phase", nextPhase: "propose" });
  const resumed = structuredClone(created.record);
  resumed.steps[0] = { id: "propose", status: "complete", evidence: { current: true } };
  resumed.steps[1] = { id: "planning-review", status: "complete", evidence: { current: true } };
  assert.equal(inspectControllerRecord(resumed, { authorization, repository: "owner/repository", now: started }).nextPhase, "apply");
});

test("controller consumes the canonical operation gate rather than helper-local policy", () => {
  const record = createControllerRecord({ authorization, repository: "owner/repository", runId: "controller-run-0099" }).record;
  const result = evaluateControllerOperation({ record, operation: "apply", stage: "planned", targetKind: "change", authorization, claimActive: true, evidenceCurrent: { applyEligibility: true, reviewReady: true }, now: started });
  assert.equal(result.allowed, true);
});

test("controller terminalizes one exact completed v2 bundle and preserves idempotent archive evidence", () => {
  const stateHome = fs.mkdtempSync(path.join(os.tmpdir(), "terminalize-v2-run-"));
  try {
    const { paths, terminalization } = terminalizationFixture(stateHome);
    const first = terminalizeV2Run({ readableRepositoryName: "example-repository", stateHome, terminalization, now: "2026-08-20T12:31:00.000Z" });
    assert.equal(first.valid, true);
    assert.equal(first.classification, "terminalized");
    assert.equal(fs.existsSync(path.join(paths.active, terminalization.parentRunId)), false);
    assert.equal(fs.existsSync(path.join(first.archivePath, "terminalization-receipt.json")), true);
    assert.equal(fs.existsSync(path.join(first.archivePath, "claim-release.json")), true);
    assert.equal(JSON.parse(fs.readFileSync(paths.index + "/repository-status.json", "utf8")).state, "archived");
    const repeated = terminalizeV2Run({ readableRepositoryName: "example-repository", stateHome, terminalization, now: "2026-08-20T12:32:00.000Z" });
    assert.equal(repeated.valid, true);
    assert.equal(repeated.classification, "already-terminalized");
    assert.equal(repeated.archivePath, first.archivePath);
  } finally { fs.rmSync(stateHome, { recursive: true, force: true }); }
});

test("controller terminalizes one exact pre-snapshot bootstrap record without rewriting it", () => {
  const stateHome = fs.mkdtempSync(path.join(os.tmpdir(), "terminalize-v2-bootstrap-"));
  try {
    const { paths, terminalization } = terminalizationFixture(stateHome);
    const workUnitPath = path.join(paths.active, terminalization.parentRunId, "work-unit.json");
    const bootstrapWorkUnit = JSON.parse(fs.readFileSync(workUnitPath, "utf8"));
    delete bootstrapWorkUnit.configurationSnapshot;
    bootstrapWorkUnit.configurationDigest = terminalHash("c");
    const original = `${JSON.stringify(bootstrapWorkUnit)}\n`;
    fs.writeFileSync(workUnitPath, original);
    assert.equal(terminalizeV2Run({ readableRepositoryName: "example-repository", stateHome, terminalization, now: "2026-08-20T12:31:00.000Z" }).reason, "terminalization-active-record-invalid");
    terminalization.bootstrapCompatibility = {
      schemaVersion: 1, parentRunId: terminalization.parentRunId, workUnitId: terminalization.workUnitId,
      claimId: terminalization.claimId, repositoryId: terminalization.repositoryId, approvedChangeId: terminalization.approvedChangeId,
      archiveHead: terminalization.completionEvidence.archive.deliveredHeadCommit, expiresAt: "2026-08-20T13:00:00.000Z",
      classification: "pre-configuration-snapshot-bootstrap"
    };
    assert.equal(terminalizeV2Run({ readableRepositoryName: "example-repository", stateHome, terminalization, now: "2026-08-20T12:31:00.000Z" }).reason, "terminalization-bootstrap-cleanup-attachment-incomplete");
    const attachment = {
      schemaVersion: 1,
      kind: "bootstrap-cleanup-attachment",
      binding: { ...terminalization.bootstrapCompatibility, repository: "owner/repository", classification: "pre-configuration-snapshot-bootstrap-cleanup", resources: [{ kind: "branch", id: "legacy-topic", role: "implementation", headCommit: "a".repeat(40), disposition: "migrate" }] },
      resources: [{
        entry: terminalization.approvedChangeId, repository: "owner/repository", kind: "branch", id: "legacy-topic", role: "implementation",
        registeredHeadCommit: "a".repeat(40), headCommit: "a".repeat(40), ownershipToken: "token", recoveryReference: "fixture", owned: true,
        registeredAt: "2026-08-20T12:20:00.000Z", deliveryCurrent: true,
        deliveryEvidence: { current: true, reference: "pr", headCommit: "a".repeat(40), deliveredHeadCommit: "d".repeat(40), mergedPullRequest: { merged: true, pullRequest: "1", topicHeadCommit: "a".repeat(40), finalHeadCommit: "d".repeat(40) } },
        squashOrRebaseEvidence: { merged: true, pullRequest: "1", topicHeadCommit: "a".repeat(40), finalHeadCommit: "d".repeat(40) }
      }],
      receipts: [{ kind: "branch", id: "legacy-topic", status: "completed", at: "2026-08-20T12:25:00.000Z" }], retainedResources: [], createdAt: "2026-08-20T12:20:00.000Z", updatedAt: "2026-08-20T12:25:00.000Z"
    };
    fs.writeFileSync(path.join(paths.active, terminalization.parentRunId, "bootstrap-cleanup-attachment.json"), `${JSON.stringify(attachment)}\n`);
    const result = terminalizeV2Run({ readableRepositoryName: "example-repository", stateHome, terminalization, now: "2026-08-20T12:31:00.000Z" });
    assert.equal(result.classification, "terminalized");
    assert.equal(fs.readFileSync(path.join(result.archivePath, "work-unit.json"), "utf8"), original);
    assert.match(JSON.parse(fs.readFileSync(path.join(result.archivePath, "terminalization-receipt.json"), "utf8")).terminalSummary.terminalReason, /delivered-and-archived/);
  } finally { fs.rmSync(stateHome, { recursive: true, force: true }); }
});

test("bootstrap cleanup attachment accepts only an exact signed migration and records exact retention without a new run or claim", () => {
  const stateHome = fs.mkdtempSync(path.join(os.tmpdir(), "bootstrap-cleanup-attachment-"));
  try {
    const { paths, terminalization } = terminalizationFixture(stateHome);
    const workUnitPath = path.join(paths.active, terminalization.parentRunId, "work-unit.json");
    const bootstrapWorkUnit = JSON.parse(fs.readFileSync(workUnitPath, "utf8"));
    delete bootstrapWorkUnit.configurationSnapshot;
    bootstrapWorkUnit.configurationDigest = terminalHash("c");
    const originalWorkUnit = `${JSON.stringify(bootstrapWorkUnit)}\n`;
    fs.writeFileSync(workUnitPath, originalWorkUnit);
    const binding = {
      schemaVersion: 1, parentRunId: terminalization.parentRunId, workUnitId: terminalization.workUnitId, claimId: terminalization.claimId,
      repositoryId: terminalization.repositoryId, repository: "owner/repository", approvedChangeId: terminalization.approvedChangeId,
      archiveHead: terminalization.completionEvidence.archive.deliveredHeadCommit, expiresAt: "2026-08-20T13:00:00.000Z",
      classification: "pre-configuration-snapshot-bootstrap-cleanup",
      resources: [
        { kind: "worktree", id: "/tmp/legacy-worktree", role: "implementation", headCommit: "a".repeat(40), disposition: "migrate" },
        { kind: "branch", id: "legacy-followup", role: "implementation", headCommit: "c".repeat(40), disposition: "migrate" },
        { kind: "branch", id: "unsafe-sync", role: "sync", headCommit: "b".repeat(40), disposition: "retain" }
      ]
    };
    const legacyResource = {
      kind: "worktree", id: "/tmp/legacy-worktree", role: "implementation", headCommit: "a".repeat(40), ownershipToken: "token", recoveryReference: "fixture",
      owned: true, deliveryCurrent: true, registered: true, clean: true, primary: false, locked: false,
      exists: true,
      deliveryEvidence: { current: true, reference: "pr-1", headCommit: "a".repeat(40), deliveredHeadCommit: "d".repeat(40), mergedPullRequest: { merged: true, pullRequest: "1", topicHeadCommit: "a".repeat(40), finalHeadCommit: "d".repeat(40) } }
    };
    const { entry, repository, registeredAt, migration: previousMigration, ...resourceBinding } = legacyResource;
    const keyPair = crypto.generateKeyPairSync("ed25519");
    const ownerAuthorization = { approved: true, owner: "owner", entry: terminalization.approvedChangeId, repository: "owner/repository", kind: "worktree", id: legacyResource.id, reviewedAt: "2026-08-20T12:25:00.000Z", reference: "owner-record", signatureAlgorithm: "ed25519", resourceBinding };
    ownerAuthorization.signature = crypto.sign(null, Buffer.from(JSON.stringify(legacyMigrationAuthorizationPayload(ownerAuthorization))), keyPair.privateKey).toString("base64");
    const migration = { legacyResource, inspectedResource: structuredClone(legacyResource), ownerAuthorization, trustedOwner: "owner", trustedOwnerPublicKey: keyPair.publicKey.export({ type: "spki", format: "pem" }) };
    const attached = attachBootstrapCleanupMigration({ readableRepositoryName: "example-repository", attachmentBinding: binding, migration, stateHome, now: "2026-08-20T12:30:00.000Z" });
    assert.ok(attached.valid, JSON.stringify(attached));
    assert.equal(attached.classification, "attached");
    assert.equal(fs.readFileSync(workUnitPath, "utf8"), originalWorkUnit);
    assert.equal(fs.existsSync(path.join(paths.active, "replacement-run")), false);
    const branchResource = { ...legacyResource, kind: "branch", id: "legacy-followup", headCommit: "c".repeat(40), referencedElsewhere: false, ancestryMerged: true,
      deliveryEvidence: { current: true, reference: "pr-2", headCommit: "c".repeat(40), deliveredHeadCommit: "d".repeat(40), mergedPullRequest: { merged: true, pullRequest: "2", topicHeadCommit: "c".repeat(40), finalHeadCommit: "d".repeat(40) } } };
    const { entry: branchEntry, repository: branchRepository, registeredAt: branchRegisteredAt, migration: branchPreviousMigration, ...branchBinding } = branchResource;
    const branchAuthorization = { ...ownerAuthorization, kind: "branch", id: branchResource.id, reviewedAt: "2026-08-20T12:30:00.000Z", resourceBinding: branchBinding };
    branchAuthorization.signature = crypto.sign(null, Buffer.from(JSON.stringify(legacyMigrationAuthorizationPayload(branchAuthorization))), keyPair.privateKey).toString("base64");
    const earlyBranchMigration = { legacyResource: branchResource, inspectedResource: structuredClone(branchResource), ownerAuthorization: branchAuthorization, trustedOwner: "owner", trustedOwnerPublicKey: keyPair.publicKey.export({ type: "spki", format: "pem" }) };
    assert.equal(attachBootstrapCleanupMigration({ readableRepositoryName: "example-repository", attachmentBinding: binding, migration: earlyBranchMigration, stateHome, now: "2026-08-20T12:30:15.000Z" }).reason, "bootstrap-cleanup-branch-dependency-incomplete");
    const cleanupContext = { archiveVisible: true, issueClosed: true, projectDone: true, deliveryEvidence: { current: true, reference: "archive-pr", headCommit: terminalization.completionEvidence.archive.deliveredHeadCommit } };
    const initiallyBlocked = executeBootstrapCleanupAttachment({
      readableRepositoryName: "example-repository", attachmentBinding: binding, stateHome, now: "2026-08-20T12:30:30.000Z",
      cleanupContext, operations: { inspectResource: (resource) => ({ ...resource, exists: true, clean: false }) }
    });
    assert.equal(initiallyBlocked.classification, "paused");
    const blockedAttachment = JSON.parse(fs.readFileSync(path.join(paths.active, terminalization.parentRunId, "bootstrap-cleanup-attachment.json"), "utf8"));
    assert.equal(blockedAttachment.receipts.at(-1).status, "blocked");
    const removals = [];
    const resumed = executeBootstrapCleanupAttachment({
      readableRepositoryName: "example-repository", attachmentBinding: binding, stateHome, now: "2026-08-20T12:30:45.000Z",
      cleanupContext, operations: { inspectResource: (resource) => ({ ...resource, exists: true }), removeWorktree: (id) => { removals.push(id); return { committed: true }; } }
    });
    assert.equal(resumed.classification, "completed");
    assert.deepEqual(removals, [legacyResource.id]);
    assert.equal(resumed.outcomes.at(-1).status, "completed");
    const freshBranchAuthorization = { ...branchAuthorization, reviewedAt: "2026-08-20T12:31:00.000Z" };
    freshBranchAuthorization.signature = crypto.sign(null, Buffer.from(JSON.stringify(legacyMigrationAuthorizationPayload(freshBranchAuthorization))), keyPair.privateKey).toString("base64");
    const freshBranchMigration = { ...earlyBranchMigration, ownerAuthorization: freshBranchAuthorization };
    assert.equal(attachBootstrapCleanupMigration({ readableRepositoryName: "example-repository", attachmentBinding: binding, migration: freshBranchMigration, stateHome, now: "2026-08-20T12:32:00.000Z" }).classification, "attached");
    const retained = retainBootstrapCleanupResource({ readableRepositoryName: "example-repository", attachmentBinding: binding, retention: { kind: "branch", id: "unsafe-sync", headCommit: "b".repeat(40), reason: "cleanup-branch-delivery-unproven" }, stateHome, now: "2026-08-20T12:33:00.000Z" });
    assert.ok(retained.valid, JSON.stringify(retained));
    assert.equal(retained.classification, "retained");
    const mismatch = attachBootstrapCleanupMigration({ readableRepositoryName: "example-repository", attachmentBinding: { ...binding, resources: [{ ...binding.resources[0], headCommit: "d".repeat(40) }, binding.resources[1], binding.resources[2]] }, migration, stateHome, now: "2026-08-20T12:34:00.000Z" });
    assert.equal(mismatch.reason, "bootstrap-cleanup-attachment-resource-unbound");
  } finally { fs.rmSync(stateHome, { recursive: true, force: true }); }
});

test("controller terminalization rejects mismatched completion evidence without changing active state", () => {
  const stateHome = fs.mkdtempSync(path.join(os.tmpdir(), "terminalize-v2-reject-"));
  try {
    const { paths, terminalization } = terminalizationFixture(stateHome, {
      completionEvidence: {
        current: true,
        implementation: { merged: true, reference: "implementation-pr", deliveredHeadCommit: "d".repeat(40) },
        sync: { merged: true, reference: "sync-pr", deliveredHeadCommit: "e".repeat(40) },
        archive: { merged: true, reference: "archive-pr", deliveredHeadCommit: "0".repeat(40) },
        issueClosed: true,
        projectDone: true,
        cleanupCompleted: true,
        observedAt: "2026-08-20T12:20:00.000Z"
      }
    });
    const result = terminalizeV2Run({ readableRepositoryName: "example-repository", stateHome, terminalization, now: "2026-08-20T12:31:00.000Z" });
    assert.equal(result.valid, false);
    assert.equal(result.classification, "paused");
    assert.equal(result.reason, "terminalization-terminal-evidence-invalid");
    assert.equal(fs.existsSync(path.join(paths.active, terminalization.parentRunId)), true);
    assert.equal(fs.existsSync(paths.archive), true);
    assert.equal(fs.readdirSync(paths.archive).length, 0);
  } finally { fs.rmSync(stateHome, { recursive: true, force: true }); }
});

test("controller terminalization refuses incomplete cleanup without changing active state", () => {
  const stateHome = fs.mkdtempSync(path.join(os.tmpdir(), "terminalize-v2-incomplete-cleanup-"));
  try {
    const { paths, terminalization } = terminalizationFixture(stateHome, {
      completionEvidence: {
        current: true,
        implementation: { merged: true, reference: "implementation-pr", deliveredHeadCommit: "d".repeat(40) },
        sync: { merged: true, reference: "sync-pr", deliveredHeadCommit: "e".repeat(40) },
        archive: { merged: true, reference: "archive-pr", deliveredHeadCommit: "f".repeat(40) },
        issueClosed: true,
        projectDone: true,
        cleanupCompleted: false,
        observedAt: "2026-08-20T12:20:00.000Z"
      }
    });
    const result = terminalizeV2Run({ readableRepositoryName: "example-repository", stateHome, terminalization, now: "2026-08-20T12:31:00.000Z" });
    assert.equal(result.valid, false);
    assert.equal(result.classification, "paused");
    assert.equal(result.reason, "terminalization-input-invalid");
    assert.equal(fs.existsSync(path.join(paths.active, terminalization.parentRunId)), true);
  } finally { fs.rmSync(stateHome, { recursive: true, force: true }); }
});

test("controller terminalization refuses stale delivery evidence without changing active state", () => {
  const stateHome = fs.mkdtempSync(path.join(os.tmpdir(), "terminalize-v2-stale-evidence-"));
  try {
    const { paths, terminalization } = terminalizationFixture(stateHome, {
      completionEvidence: {
        current: true,
        implementation: { merged: true, reference: "implementation-pr", deliveredHeadCommit: "d".repeat(40) },
        sync: { merged: true, reference: "sync-pr", deliveredHeadCommit: "e".repeat(40) },
        archive: { merged: true, reference: "archive-pr", deliveredHeadCommit: "f".repeat(40) },
        issueClosed: true,
        projectDone: true,
        cleanupCompleted: true,
        observedAt: "2026-08-20T10:00:00.000Z"
      }
    });
    const result = terminalizeV2Run({ readableRepositoryName: "example-repository", stateHome, terminalization, now: "2026-08-20T12:31:00.000Z" });
    assert.equal(result.valid, false);
    assert.equal(result.classification, "paused");
    assert.equal(result.reason, "terminalization-terminal-evidence-invalid");
    assert.equal(fs.existsSync(path.join(paths.active, terminalization.parentRunId)), true);
  } finally { fs.rmSync(stateHome, { recursive: true, force: true }); }
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

test("controller persists pending reviewed intake then binds exact issue evidence", () => {
  const registered = registerControllerIssueIntake(created.record, intakeBinding, { now: started });
  assert.equal(registered.valid, true);
  assert.equal(registered.intake.status, "pending");
  assert.equal(registered.intake.binding.payloadDigest, intakeBinding.payloadDigest);
  assert.equal(registerControllerIssueIntake(registered.record, intakeBinding, { now: started }).reason, "controller-issue-intake-registration-duplicate");
  assert.equal(registerControllerIssueIntake({ ...registered.record, issueIntakeRecords: [null] }, intakeBinding, { now: started }).reason, "controller-issue-intake-registration-invalid");
  assert.equal(bindControllerIssueIntake({ ...registered.record, issueIntakeRecords: [null] }, {
    payloadDigest: intakeBinding.payloadDigest,
    issue: { number: 126, url: "https://github.com/owner/repository/issues/126", state: "OPEN", labels: ["sdd"] },
    observedAt: started,
    reference: "malformed controller regression"
  }).reason, "controller-issue-intake-delivery-invalid");

  const delivered = bindControllerIssueIntake(registered.record, {
    payloadDigest: intakeBinding.payloadDigest,
    issue: { number: 126, url: "https://github.com/owner/repository/issues/126", state: "OPEN", labels: ["type:feature", "sdd"] },
    observedAt: "2026-08-13T12:05:00.000Z",
    reference: "issue #126 exact-title reconciliation"
  });
  assert.equal(delivered.valid, true);
  assert.equal(delivered.intake.status, "delivered");
  assert.equal(delivered.intake.evidence.payloadDigest, intakeBinding.payloadDigest);
  assert.equal(inspectControllerRecord(delivered.record, { authorization, repository: "owner/repository", now: started }).nextPhase, "propose");

  const conflicted = structuredClone(delivered.record);
  conflicted.issueIntakeRecords[0].binding.title = "changed";
  assert.equal(inspectControllerRecord(conflicted, { authorization, repository: "owner/repository", now: started }).reason, "controller-record-invalid");
});

test("controller persists exact non-secret auth-context evidence and rejects mismatches", () => {
  const registered = registerControllerAuthContext(created.record, authContextBinding, { now: started });
  assert.equal(registered.valid, true);
  assert.equal(registered.authContext.status, "pending");
  assert.equal(registered.authContext.binding.operation, "issue-create-or-reuse");
  const delivered = bindControllerAuthContext(registered.record, {
    bindingDigest: registered.authContext.bindingDigest,
    evidence: authContextEvidence
  });
  assert.equal(delivered.valid, true);
  assert.equal(delivered.authContext.status, "delivered");
  assert.equal(delivered.authContext.evidence.classification, "authenticated");
  assert.doesNotMatch(JSON.stringify(delivered.authContext), /stdout|stderr|token|secret/i);
  assert.equal(bindControllerAuthContext(registered.record, {
    bindingDigest: "b".repeat(64), evidence: authContextEvidence
  }).reason, "controller-auth-context-evidence-invalid");
  const forged = structuredClone(created.record);
  forged.authContextRecords = [{ ...registered.authContext, binding: { ...registered.authContext.binding, repository: "other/repository" } }];
  assert.equal(inspectControllerRecord(forged, { authorization, repository: "owner/repository", now: started }).reason, "controller-record-invalid");
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
  assert.equal(executeControllerLifecycleCleanup({ record: created.record }).reason, "controller-cleanup-resources-missing");
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

test("executable phase advancement persists only the first incomplete phase", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "controller-phase-"));
  try {
    fs.mkdirSync(path.join(root, ".git"));
    const runGit = () => ".git";
    assert.equal(persistControllerRecord({ repositoryPath: root, record: created.record, runGit }).valid, true);
    const advanced = advanceControllerLifecyclePhase({ repositoryPath: root, record: created.record, authorization, repository: "owner/repository", phase: "propose", evidence: { current: true, reference: "proposal" }, now: started, runGit });
    assert.equal(advanced.classification, "advanced");
    assert.equal(JSON.parse(fs.readFileSync(advanced.path, "utf8")).currentPhase, "planning-review");
    assert.equal(persistControllerRecord({ repositoryPath: root, record: advanced.record, expectedRecordDigest: "a".repeat(64), runGit }).reason, "controller-record-stale");
    const retried = advanceControllerLifecyclePhase({ repositoryPath: root, record: created.record, authorization, repository: "owner/repository", phase: "propose", evidence: { current: true, reference: "proposal" }, now: started, runGit });
    assert.equal(retried.classification, "already-advanced");
    const conflictingRetry = advanceControllerLifecyclePhase({ repositoryPath: root, record: created.record, authorization, repository: "owner/repository", phase: "propose", evidence: { current: true, reference: "different-proposal" }, now: started, runGit });
    assert.equal(conflictingRetry.reason, "controller-phase-advance-evidence-conflict");
    const skipped = advanceControllerLifecyclePhase({ repositoryPath: root, record: advanced.record, authorization, repository: "owner/repository", phase: "verify", evidence: { current: true, reference: "skip" }, now: started, runGit });
    assert.equal(skipped.valid, false);
    assert.equal(skipped.classification, "paused");
    const stale = { ...created.record, authorizationDigest: "f".repeat(64) };
    assert.equal(advanceControllerLifecyclePhase({ repositoryPath: root, record: stale, authorization, repository: "owner/repository", phase: "propose", evidence: { current: true, reference: "proposal" }, now: started, runGit }).reason, "controller-context-conflict");
    assert.equal(advanceControllerLifecyclePhase({ repositoryPath: root, record: created.record, authorization, repository: "owner/repository", phase: "propose", evidence: { current: true, reference: "proposal" }, now: authorization.expiresAt, runGit }).reason, "controller-context-expired");
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
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
    const absent = executeControllerLifecycleCleanup({ repositoryPath: root, record: delivered.record, cleanupContext, operations: { inspectResource: (resource) => ({ ...resource, exists: false }), removeWorktree: () => ({ committed: true }) }, runGit });
    assert.equal(absent.classification, "completed");
    assert.equal(absent.record.cleanupReceipts.at(-1).status, "already-completed");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("controller cleanup stages an attached worktree before its local branch", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "controller-staged-cleanup-"));
  try {
    fs.mkdirSync(path.join(root, ".git"));
    const runGit = () => ".git";
    const initial = createControllerRecord({ authorization, repository: "owner/repository", runId: "controller-run-0005" }).record;
    const branch = registerControllerLifecycleResource({ repositoryPath: root, record: initial, resource: { kind: "branch", id: "staged-branch", role: "implementation", registeredHeadCommit: "a".repeat(40), recoveryReference: "branch-recovery", ownershipToken: "branch-token" }, now: started, runGit });
    const worktree = registerControllerLifecycleResource({ repositoryPath: root, record: branch.record, resource: { kind: "worktree", id: "staged-worktree", role: "implementation", registeredHeadCommit: "a".repeat(40), recoveryReference: "worktree-recovery", ownershipToken: "worktree-token" }, now: started, runGit });
    const deliveredBranch = bindControllerLifecycleDelivery({ repositoryPath: root, record: worktree.record, kind: "branch", id: "staged-branch", deliveryEvidence: { current: true, reference: "pr-branch", headCommit: "a".repeat(40), deliveredHeadCommit: "b".repeat(40), mergedPullRequest: { merged: true, pullRequest: "5", topicHeadCommit: "a".repeat(40), finalHeadCommit: "b".repeat(40) } }, runGit });
    const delivered = bindControllerLifecycleDelivery({ repositoryPath: root, record: deliveredBranch.record, kind: "worktree", id: "staged-worktree", deliveryEvidence: { current: true, reference: "pr-worktree", headCommit: "a".repeat(40), deliveredHeadCommit: "b".repeat(40), mergedPullRequest: { merged: true, pullRequest: "5", topicHeadCommit: "a".repeat(40), finalHeadCommit: "b".repeat(40) } }, runGit });
    let removedWorktree = false;
    const operations = {
      inspectResource: (resource) => resource.kind === "worktree"
        ? { ...resource, exists: !removedWorktree, primary: false, locked: false, registered: true, clean: true, controllerCheckpointPresent: false }
        : { ...resource, exists: true, headCommit: resource.headCommit, referencedElsewhere: !removedWorktree, ancestryMerged: false },
      removeWorktree: () => { removedWorktree = true; return { committed: true }; },
      deleteLocalBranch: () => ({ committed: true })
    };
    const cleanup = executeControllerLifecycleCleanup({ repositoryPath: root, record: delivered.record, cleanupContext: { archiveVisible: true, issueClosed: true, projectDone: true, deliveryEvidence: { current: true, reference: "archive", headCommit: "b".repeat(40) } }, operations, now: "2026-08-13T12:30:00.000Z", runGit });
    assert.equal(cleanup.classification, "completed");
    assert.deepEqual(cleanup.outcomes.map((outcome) => outcome.resource.kind), ["worktree", "branch"]);
    assert.equal(cleanup.record.cleanupReceipts.at(-1).id, "staged-branch");
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
