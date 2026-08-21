import assert from "node:assert/strict";
import crypto from "node:crypto";
import test from "node:test";
import { executeWorkspaceCleanup, legacyMigrationAuthorizationPayload, migrateLegacyWorkspaceResource, planWorkspaceCleanup } from "../sdd-workspace-cleanup.mjs";

const head = "a".repeat(40);
const evidence = {
  selectedEntry: "complete-delivery", repository: "owner/repository", archiveVisible: true, issueClosed: true, projectDone: true,
  deliveryEvidence: { current: true, reference: "archive-pr-1", headCommit: head }
};
const resource = (values = {}) => ({
  entry: "complete-delivery", repository: "owner/repository", role: "change-workspace", id: "resource", owned: true,
  deliveryCurrent: true, headCommit: head, ownershipToken: "owned-token", recoveryReference: "cleanup-recovery-1", registeredAt: "2026-08-13T12:00:00.000Z",
  deliveryEvidence: { current: true, reference: "archive-pr-1", headCommit: head, deliveredHeadCommit: head, mergedPullRequest: { merged: true, pullRequest: "1", topicHeadCommit: head, finalHeadCommit: head } }, ...values
});

test("cleanup plans only exact clean owned delivered resources", () => {
  const plan = planWorkspaceCleanup({ ...evidence, resources: [
    resource({ kind: "worktree", id: "wt", registered: true, clean: true }),
    resource({ kind: "branch", id: "feature/complete", ancestryMerged: true }),
    resource({ kind: "worktree", id: "dirty", registered: true, clean: false }),
    resource({ entry: "other", kind: "branch", id: "legacy", ancestryMerged: true })
  ] });
  assert.equal(plan.classification, "planned");
  assert.deepEqual(plan.resources.map((resource) => resource.classification), ["eligible", "eligible", "ineligible", "ineligible"]);
  assert.equal(plan.resources[1].actions[0].force, false);
});

test("cleanup requires final delivery evidence and permits forced local deletion only with exact proof", () => {
  assert.equal(planWorkspaceCleanup({ ...evidence, archiveVisible: false }).classification, "paused");
  const plan = planWorkspaceCleanup({ ...evidence, resources: [resource({ kind: "branch", id: "squash", squashOrRebaseEvidence: { merged: true, pullRequest: "42", topicHeadCommit: head, finalHeadCommit: head } })] });
  assert.equal(plan.resources[0].actions[0].force, true);
  const result = executeWorkspaceCleanup(plan, { deleteLocalBranch: (id, { force }) => ({ committed: id === "squash" && force }), inspectResource: (item) => ({ ...item, exists: true }), persistOutcome: () => ({ persisted: true }) });
  assert.equal(result.classification, "completed");
});

test("cleanup rejects incomplete durable identity and only accepts exact squash evidence", () => {
  const missingRecovery = planWorkspaceCleanup({ ...evidence, resources: [resource({ kind: "branch", ancestryMerged: true, recoveryReference: "" })] });
  assert.equal(missingRecovery.resources[0].reason, "cleanup-resource-record-invalid");
  const booleanSquash = planWorkspaceCleanup({ ...evidence, resources: [resource({ kind: "branch", squashOrRebaseEvidence: true })] });
  assert.equal(booleanSquash.resources[0].reason, "cleanup-branch-delivery-unproven");
});

test("cleanup executes worktrees first and resumes from reread resource state", () => {
  const plan = planWorkspaceCleanup({ ...evidence, resources: [
    resource({ kind: "branch", id: "feature/complete", ancestryMerged: true }),
    resource({ kind: "worktree", id: "wt", registered: true, clean: true })
  ] });
  const calls = [];
  const result = executeWorkspaceCleanup(plan, {
    inspectResource: (item) => item.id === "wt" ? { exists: false } : { ...item, exists: true },
    removeWorktree: (id) => { calls.push(`worktree:${id}`); return { committed: true }; },
    deleteLocalBranch: (id) => { calls.push(`branch:${id}`); return { committed: true }; },
    persistOutcome: () => ({ persisted: true })
  });
  assert.equal(result.classification, "completed");
  assert.deepEqual(calls, ["branch:feature/complete"]);
  assert.deepEqual(result.outcomes.map((outcome) => outcome.status), ["already-completed", "completed"]);
});

test("cleanup treats migration-time existence as transient but blocks a real fresh mismatch", () => {
  const plan = planWorkspaceCleanup({ ...evidence, resources: [
    resource({ kind: "worktree", id: "migrated-worktree", registered: true, clean: true, exists: true })
  ] });
  const calls = [];
  const receipts = [];
  const completed = executeWorkspaceCleanup(plan, {
    inspectResource: (item) => ({ ...item, exists: true }),
    removeWorktree: (id) => { calls.push(id); return { committed: true }; },
    persistOutcome: (outcome) => { receipts.push(outcome.status); return { persisted: true }; }
  });
  assert.equal(completed.classification, "completed");
  assert.deepEqual(calls, ["migrated-worktree"]);
  assert.deepEqual(receipts, ["started", "completed"]);
  assert.deepEqual(completed.outcomes.map((outcome) => outcome.status), ["completed"]);

  const blocked = executeWorkspaceCleanup(plan, {
    inspectResource: (item) => ({ ...item, exists: true, clean: false }),
    removeWorktree: () => { throw new Error("must not remove mismatched resource"); },
    persistOutcome: () => ({ persisted: true })
  });
  assert.equal(blocked.classification, "partial");
  assert.equal(blocked.outcomes[0].receipt, "fresh-resource-mismatch");
});

test("cleanup will not mutate unless each action outcome can be persisted", () => {
  const plan = planWorkspaceCleanup({ ...evidence, resources: [resource({ kind: "branch", ancestryMerged: true })] });
  assert.equal(executeWorkspaceCleanup(plan, { deleteLocalBranch: () => ({ committed: true }) }).reason, "cleanup-fresh-inspection-or-persistence-missing");
  const result = executeWorkspaceCleanup(plan, {
    deleteLocalBranch: () => ({ committed: true }),
    inspectResource: (item) => ({ ...item, exists: true }),
    persistOutcome: () => ({ persisted: false })
  });
  assert.equal(result.classification, "partial");
  assert.equal(result.outcomes[0].receipt, "outcome-persist-failed");
});

test("cleanup rejects malformed resource delivery evidence and stale fresh inspection", () => {
  const staleEvidence = planWorkspaceCleanup({ ...evidence, resources: [resource({ kind: "branch", ancestryMerged: true, deliveryEvidence: { current: true, reference: "other-archive", headCommit: head, deliveredHeadCommit: head } })] });
  assert.equal(staleEvidence.resources[0].reason, "cleanup-resource-record-invalid");
  const plan = planWorkspaceCleanup({ ...evidence, resources: [resource({ kind: "branch", ancestryMerged: true })] });
  const result = executeWorkspaceCleanup(plan, {
    inspectResource: (item) => ({ ...item, exists: true, clean: false }),
    deleteLocalBranch: () => ({ committed: true }),
    persistOutcome: () => ({ persisted: true })
  });
  assert.equal(result.classification, "partial");
  assert.equal(result.outcomes[0].receipt, "fresh-resource-mismatch");
  const persisted = [];
  const durable = executeWorkspaceCleanup(plan, {
    inspectResource: (item) => ({ ...item, exists: true, clean: false }),
    deleteLocalBranch: () => ({ committed: true }),
    persistOutcome: (outcome) => { persisted.push(outcome.status); return { persisted: true }; }
  });
  assert.equal(durable.outcomes[0].status, "blocked");
  assert.deepEqual(persisted, ["blocked"]);
});

test("squash cleanup binds the topic head and distinct delivered head to one merged pull request", () => {
  const topicHead = "b".repeat(40);
  const deliveredHead = "c".repeat(40);
  const plan = planWorkspaceCleanup({
    ...evidence,
    deliveryEvidence: { current: true, reference: "archive-pr-99", headCommit: deliveredHead },
    resources: [resource({ kind: "branch", headCommit: topicHead, deliveryEvidence: { current: true, reference: "archive-pr-99", headCommit: topicHead, deliveredHeadCommit: deliveredHead, mergedPullRequest: { merged: true, pullRequest: "99", topicHeadCommit: topicHead, finalHeadCommit: deliveredHead } }, squashOrRebaseEvidence: { merged: true, pullRequest: "99", topicHeadCommit: topicHead, finalHeadCommit: deliveredHead } })]
  });
  assert.equal(plan.resources[0].actions[0].force, true);
});

test("cleanup evaluates separately squash-delivered lifecycle resources independently", () => {
  const implementationHead = "b".repeat(40);
  const syncHead = "c".repeat(40);
  const implementationDelivered = "d".repeat(40);
  const syncDelivered = "e".repeat(40);
  const plan = planWorkspaceCleanup({
    ...evidence,
    deliveryEvidence: { current: true, reference: "archive-pr", headCommit: "f".repeat(40) },
    resources: [
      resource({ kind: "branch", id: "implementation", headCommit: implementationHead, deliveryEvidence: { current: true, reference: "implementation-pr", headCommit: implementationHead, deliveredHeadCommit: implementationDelivered, mergedPullRequest: { merged: true, pullRequest: "11", topicHeadCommit: implementationHead, finalHeadCommit: implementationDelivered } }, squashOrRebaseEvidence: { merged: true, pullRequest: "11", topicHeadCommit: implementationHead, finalHeadCommit: implementationDelivered } }),
      resource({ kind: "branch", id: "sync", headCommit: syncHead, deliveryEvidence: { current: true, reference: "sync-pr", headCommit: syncHead, deliveredHeadCommit: syncDelivered, mergedPullRequest: { merged: true, pullRequest: "12", topicHeadCommit: syncHead, finalHeadCommit: syncDelivered } }, squashOrRebaseEvidence: { merged: true, pullRequest: "12", topicHeadCommit: syncHead, finalHeadCommit: syncDelivered } })
    ]
  });
  assert.deepEqual(plan.resources.map((item) => item.classification), ["eligible", "eligible"]);
});

test("cleanup retains a worktree whose controller checkpoint has no external terminal receipt", () => {
  const plan = planWorkspaceCleanup({ ...evidence, resources: [resource({ kind: "worktree", id: "checkpointed", registered: true, clean: true, controllerCheckpointPresent: true })] });
  assert.equal(plan.resources[0].reason, "cleanup-controller-checkpoint-retention-incomplete");
});

test("legacy migration requires exact owner authorization and fresh matching inspection", () => {
  const legacy = resource({ kind: "branch", id: "stranded", registeredAt: undefined });
  const rejected = migrateLegacyWorkspaceResource({ selectedEntry: "complete-delivery", repository: "owner/repository", legacyResource: legacy, inspectedResource: legacy, now: "2026-08-13T13:00:00.000Z" });
  assert.equal(rejected.reason, "cleanup-legacy-migration-authorization-invalid");
  const { entry, repository, registeredAt, migration, ...resourceBinding } = legacy;
  const ownerAuthorization = { approved: true, owner: "repository-owner", entry: "complete-delivery", repository: "owner/repository", kind: "branch", id: "stranded", reviewedAt: "2026-08-13T12:30:00.000Z", reference: "owner-record-1", resourceBinding };
  const keyPair = crypto.generateKeyPairSync("ed25519");
  ownerAuthorization.signatureAlgorithm = "ed25519";
  ownerAuthorization.signature = crypto.sign(null, Buffer.from(JSON.stringify(legacyMigrationAuthorizationPayload(ownerAuthorization))), keyPair.privateKey).toString("base64");
  const trusted = { trustedOwner: "repository-owner", trustedOwnerPublicKey: keyPair.publicKey.export({ type: "spki", format: "pem" }) };
  assert.equal(migrateLegacyWorkspaceResource({ selectedEntry: "complete-delivery", repository: "owner/repository", legacyResource: legacy, inspectedResource: structuredClone(legacy), now: "2026-08-13T13:00:00.000Z", ownerAuthorization: { ...ownerAuthorization, id: "other" }, ...trusted }).reason, "cleanup-legacy-migration-authorization-invalid");
  const differentlyBoundAuthorization = { ...ownerAuthorization, resourceBinding: { ...ownerAuthorization.resourceBinding, headCommit: "b".repeat(40) } };
  differentlyBoundAuthorization.signature = crypto.sign(null, Buffer.from(JSON.stringify(legacyMigrationAuthorizationPayload(differentlyBoundAuthorization))), keyPair.privateKey).toString("base64");
  assert.equal(migrateLegacyWorkspaceResource({ selectedEntry: "complete-delivery", repository: "owner/repository", legacyResource: legacy, inspectedResource: structuredClone(legacy), now: "2026-08-13T13:00:00.000Z", ownerAuthorization: differentlyBoundAuthorization, ...trusted }).reason, "cleanup-legacy-migration-authorization-invalid");
  assert.equal(migrateLegacyWorkspaceResource({ selectedEntry: "complete-delivery", repository: "owner/repository", legacyResource: legacy, inspectedResource: structuredClone(legacy), now: "2026-08-13T13:00:00.000Z", ownerAuthorization, trustedOwner: "other-owner", trustedOwnerPublicKey: trusted.trustedOwnerPublicKey }).reason, "cleanup-legacy-migration-authorization-invalid");
  const migrated = migrateLegacyWorkspaceResource({
    selectedEntry: "complete-delivery", repository: "owner/repository", legacyResource: legacy, inspectedResource: structuredClone(legacy), now: "2026-08-13T13:00:00.000Z",
    ownerAuthorization, ...trusted
  });
  assert.equal(migrated.valid, true);
  assert.equal(migrated.resource.migration.authorizationReference, "owner-record-1");
});
