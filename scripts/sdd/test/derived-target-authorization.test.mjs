import assert from "node:assert/strict";
import test from "node:test";
import { checkOperationAuthorization } from "../check-operation-authorization.mjs";
import { inspectCheckpoint } from "../checkpoint.mjs";
import { immutableReviewManifest, prepareIndependentReview } from "../independent-review.mjs";

const authorization = {
  targets: ["workspace:reports"],
  allowedMutations: ["run-lifecycle-action", "read-source"],
  derivedTargets: { queue: ["first-change"], selectedEntry: "first-change", repository: "owner/repository" },
  publicSourceScopes: ["https://docs.example.test/"]
};
const runtime = { permittedOperations: ["run-lifecycle-action", "read-source"] };
const record = { entry: "first-change", kind: "pr", id: "42", repository: "owner/repository", baseBranch: "main", headCommit: "abc1234" };

test("allows only a current exact derived pull request", () => {
  const result = checkOperationAuthorization({ authorization, runtime, request: {
    profile: "sdd-delivery", operation: "run-lifecycle-action", lifecycleAction: "merge-pr", target: "pr:42", selectedEntry: "first-change", derivedRecord: record, headCommit: "abc1234", evidenceCurrent: true, recovery: "re-read PR and checkpoint"
  } });
  assert.equal(result.allowed, true, JSON.stringify(result));
});

test("rejects a lookalike queue entry and stale head", () => {
  for (const request of [{ selectedEntry: "other-change", headCommit: "abc1234" }, { selectedEntry: "first-change", headCommit: "different" }, { selectedEntry: "first-change", headCommit: "" }]) {
    const result = checkOperationAuthorization({ authorization, runtime, request: {
      profile: "sdd-delivery", operation: "run-lifecycle-action", lifecycleAction: "merge-pr", target: "pr:42", derivedRecord: record, evidenceCurrent: true, recovery: "recover", ...request
    } });
    assert.equal(result.allowed, false);
  }
});

test("requires matching kinds for archive and merged-branch cleanup", () => {
  const base = { profile: "sdd-delivery", operation: "run-lifecycle-action", selectedEntry: "first-change", evidenceCurrent: true, recovery: "recover" };
  const change = { entry: "first-change", kind: "change", id: "first-change", repository: "owner/repository" };
  const branch = { entry: "first-change", kind: "branch", id: "feature/first-change", repository: "owner/repository", baseBranch: "main", headCommit: "abc1234" };
  assert.equal(checkOperationAuthorization({ authorization, runtime, request: { ...base, lifecycleAction: "archive-change", target: "change:first-change", derivedRecord: change } }).allowed, true);
  assert.equal(checkOperationAuthorization({ authorization, runtime, request: { ...base, lifecycleAction: "delete-merged-topic-branch", target: "branch:feature/first-change", derivedRecord: branch, headCommit: "abc1234" } }).allowed, true);
});

test("preserves exact target authorization without derived declarations", () => {
  const result = checkOperationAuthorization({ authorization: { targets: ["workspace:reports"], allowedMutations: ["read-source"] }, runtime, request: {
    profile: "research-read-only", operation: "read-source", target: "workspace:reports/source-record.md"
  } });
  assert.equal(result.allowed, true, JSON.stringify(result));
});

test("allows only explicitly public unauthenticated source reads", () => {
  const request = { profile: "research-read-only", operation: "read-source", target: "https://docs.example.test/rules" };
  assert.equal(checkOperationAuthorization({ authorization, runtime, request }).allowed, true);
  assert.equal(checkOperationAuthorization({ authorization, runtime, request: { ...request, requiresAuthentication: true } }).allowed, false);
  assert.equal(checkOperationAuthorization({ authorization, runtime, request: { ...request, privateSource: true } }).allowed, false);
});

test("checkpoint resumes first incomplete step and stops invalid linkage", () => {
  const base = { selectedEntry: { name: "first-change", records: [record] }, steps: [
    { id: "issue", status: "complete", evidence: { present: true, current: true } }, { id: "pr", status: "pending" }
  ] };
  assert.deepEqual(inspectCheckpoint(base), { classification: "continue", firstIncomplete: "pr", reason: "first-incomplete-step" });
  assert.deepEqual(inspectCheckpoint({ ...base, steps: [{ id: "issue", status: "complete", evidence: { present: true, current: false } }] }), { classification: "stale-evidence", firstIncomplete: "issue", reason: "completed-step-lacks-current-evidence" });
  assert.equal(inspectCheckpoint({ ...base, selectedEntry: { name: "other", records: [record] } }).classification, "human-decision");
});

test("production-rapid delivery requires current independent review evidence", () => {
  const reviewer = { type: "fixture-reviewer", identity: "fresh-reviewer", available: true, nonInteractive: true, isolatedContext: true, readOnly: true };
  const reviewInput = { baseCommit: "aaaaaaa", headCommit: "abc1234", diff: "diff", openspecArtifacts: ["proposal"], validationEvidence: ["tests"] };
  assert.equal(prepareIndependentReview({ reviewer, implementerSession: "implementer", reviewInput }).allowed, true);
  const result = checkOperationAuthorization({ authorization, runtime, request: {
    profile: "sdd-delivery", operation: "run-lifecycle-action", lifecycleAction: "merge-pr", target: "pr:42", selectedEntry: "first-change", derivedRecord: record, headCommit: "abc1234", baseCommit: "aaaaaaa", independentReviewInput: reviewInput, evidenceCurrent: true, recovery: "re-read PR and checkpoint", deliveryProfile: "production-rapid", implementerSession: "implementer", reviewer,
    independentReviewEvidence: { reviewer: { type: "fixture-reviewer", identity: "fresh-reviewer" }, executionRef: "run", invocationRef: "fixture", reviewedBase: "aaaaaaa", reviewedHead: "abc1234", inputManifest: immutableReviewManifest(reviewInput), timestamp: "2026-08-12T12:00:00.000Z", findings: [], dispositions: [], finalStatus: "clear" }
  } });
  assert.equal(result.allowed, true, JSON.stringify(result));
  assert.equal(checkOperationAuthorization({ authorization, runtime, request: {
    profile: "sdd-delivery", operation: "run-lifecycle-action", lifecycleAction: "merge-pr", target: "pr:42", selectedEntry: "first-change", derivedRecord: record, headCommit: "abc1234", baseCommit: "aaaaaaa", evidenceCurrent: true, recovery: "re-read PR and checkpoint", deliveryProfile: "production-rapid", implementerSession: "implementer", reviewer, independentReviewInput: { ...reviewInput, diff: "tampered" }, independentReviewEvidence: { reviewer: { type: "fixture-reviewer", identity: "fresh-reviewer" }, executionRef: "run", invocationRef: "fixture", reviewedBase: "aaaaaaa", reviewedHead: "abc1234", inputManifest: immutableReviewManifest(reviewInput), timestamp: "2026-08-12T12:00:00.000Z", findings: [], dispositions: [], finalStatus: "clear" }
  } }).issues[0]?.code, "independent-review-evidence-manifest-mismatch");
});
