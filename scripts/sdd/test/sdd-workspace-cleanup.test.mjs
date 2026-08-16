import assert from "node:assert/strict";
import test from "node:test";
import { executeWorkspaceCleanup, planWorkspaceCleanup } from "../sdd-workspace-cleanup.mjs";

const evidence = { selectedEntry: "complete-delivery", archiveVisible: true, issueClosed: true, projectDone: true };

test("cleanup plans only exact clean owned delivered resources", () => {
  const plan = planWorkspaceCleanup({ ...evidence, resources: [
    { entry: "complete-delivery", kind: "worktree", id: "wt", owned: true, deliveryCurrent: true, registered: true, clean: true, ownershipToken: "token" },
    { entry: "complete-delivery", kind: "branch", id: "feature/complete", owned: true, deliveryCurrent: true, ancestryMerged: true },
    { entry: "complete-delivery", kind: "worktree", id: "dirty", owned: true, deliveryCurrent: true, registered: true, clean: false, ownershipToken: "token" },
    { entry: "other", kind: "branch", id: "legacy", owned: true, deliveryCurrent: true, ancestryMerged: true }
  ] });
  assert.equal(plan.classification, "planned");
  assert.deepEqual(plan.resources.map((resource) => resource.classification), ["eligible", "eligible", "ineligible", "ineligible"]);
  assert.equal(plan.resources[1].actions[0].force, false);
});

test("cleanup requires final delivery evidence and permits forced local deletion only with exact proof", () => {
  assert.equal(planWorkspaceCleanup({ ...evidence, archiveVisible: false }).classification, "paused");
  const plan = planWorkspaceCleanup({ ...evidence, resources: [{ entry: "complete-delivery", kind: "branch", id: "squash", owned: true, deliveryCurrent: true, squashOrRebaseEvidence: true }] });
  assert.equal(plan.resources[0].actions[0].force, true);
  const result = executeWorkspaceCleanup(plan, { deleteLocalBranch: (id, { force }) => ({ committed: id === "squash" && force }) });
  assert.equal(result.classification, "completed");
});
