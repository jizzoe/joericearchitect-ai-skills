import assert from "node:assert/strict";
import test from "node:test";
import { executeWorkspaceCleanup, planWorkspaceCleanup } from "../sdd-workspace-cleanup.mjs";

const head = "a".repeat(40);
const evidence = {
  selectedEntry: "complete-delivery", repository: "owner/repository", archiveVisible: true, issueClosed: true, projectDone: true,
  deliveryEvidence: { current: true, reference: "archive-pr-1", headCommit: head }
};
const resource = (values = {}) => ({
  entry: "complete-delivery", repository: "owner/repository", role: "change-workspace", id: "resource", owned: true,
  deliveryCurrent: true, headCommit: head, ownershipToken: "owned-token", recoveryReference: "cleanup-recovery-1",
  deliveryEvidence: { current: true, reference: "archive-pr-1", headCommit: head }, ...values
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
  const plan = planWorkspaceCleanup({ ...evidence, resources: [resource({ kind: "branch", id: "squash", squashOrRebaseEvidence: { merged: true, pullRequest: "42", finalHeadCommit: head } })] });
  assert.equal(plan.resources[0].actions[0].force, true);
  const result = executeWorkspaceCleanup(plan, { deleteLocalBranch: (id, { force }) => ({ committed: id === "squash" && force }), persistOutcome: () => ({ persisted: true }) });
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
    inspectResource: (item) => ({ exists: item.id !== "wt" }),
    removeWorktree: (id) => { calls.push(`worktree:${id}`); return { committed: true }; },
    deleteLocalBranch: (id) => { calls.push(`branch:${id}`); return { committed: true }; },
    persistOutcome: () => ({ persisted: true })
  });
  assert.equal(result.classification, "completed");
  assert.deepEqual(calls, ["branch:feature/complete"]);
  assert.deepEqual(result.outcomes.map((outcome) => outcome.status), ["already-completed", "completed"]);
});

test("cleanup will not mutate unless each action outcome can be persisted", () => {
  const plan = planWorkspaceCleanup({ ...evidence, resources: [resource({ kind: "branch", ancestryMerged: true })] });
  assert.equal(executeWorkspaceCleanup(plan, { deleteLocalBranch: () => ({ committed: true }) }).reason, "cleanup-outcome-persistence-missing");
  const result = executeWorkspaceCleanup(plan, {
    deleteLocalBranch: () => ({ committed: true }),
    persistOutcome: () => ({ persisted: false })
  });
  assert.equal(result.classification, "partial");
  assert.equal(result.outcomes[0].receipt, "outcome-persist-failed");
});
