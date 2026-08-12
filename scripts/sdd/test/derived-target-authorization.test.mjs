import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
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
const repositoryPath = process.cwd();
const configuredReviewer = { type: "fixture-reviewer", identity: "fresh-reviewer", enabled: true, attestation: { ref: "attestation-1", nonInteractive: true, isolatedContext: true, readOnly: true } };
const config = { reviewRepositoryPath: repositoryPath, independentReviewer: configuredReviewer };
const baseSha = execFileSync("git", ["rev-parse", "HEAD~1"], { encoding: "utf8" }).trim();
const headSha = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
const accumulatedDiff = execFileSync("git", ["diff", "--no-ext-diff", "--no-textconv", "--binary", baseSha, headSha], { encoding: "utf8" });
const record = { entry: "first-change", kind: "pr", id: "42", repository: "owner/repository", baseBranch: "main", headCommit: headSha, evidence: { reference: "pr-evidence", current: true, headCommit: headSha } };
const derivedCheckpoint = { selectedEntry: { name: "first-change", records: [record] }, steps: [] };

test("allows only a current exact derived pull request", () => {
  const result = checkOperationAuthorization({ authorization, runtime, config, request: {
    profile: "sdd-delivery", operation: "run-lifecycle-action", lifecycleAction: "merge-pr", target: "pr:42", selectedEntry: "first-change", derivedRecord: record, checkpoint: derivedCheckpoint, headCommit: headSha, evidenceCurrent: true, evidenceReference: "pr-evidence", evidenceHeadCommit: headSha, recovery: "re-read PR and checkpoint"
  } });
  assert.equal(result.allowed, true, JSON.stringify(result));
});

test("rejects a lookalike queue entry and stale head", () => {
  for (const request of [{ selectedEntry: "other-change", headCommit: headSha }, { selectedEntry: "first-change", headCommit: "different" }, { selectedEntry: "first-change", headCommit: "" }]) {
    const result = checkOperationAuthorization({ authorization, runtime, request: {
      profile: "sdd-delivery", operation: "run-lifecycle-action", lifecycleAction: "merge-pr", target: "pr:42", derivedRecord: record, checkpoint: derivedCheckpoint, evidenceCurrent: true, evidenceReference: "pr-evidence", evidenceHeadCommit: headSha, recovery: "recover", ...request
    } });
    assert.equal(result.allowed, false);
  }
});

test("requires matching kinds for archive and merged-branch cleanup", () => {
  const base = { profile: "sdd-delivery", operation: "run-lifecycle-action", selectedEntry: "first-change", evidenceCurrent: true, recovery: "recover" };
  const change = { entry: "first-change", kind: "change", id: "first-change", repository: "owner/repository", evidence: { reference: "change-evidence", current: true } };
  const branch = { entry: "first-change", kind: "branch", id: "feature/first-change", repository: "owner/repository", baseBranch: "main", headCommit: headSha, evidence: { reference: "branch-evidence", current: true, headCommit: headSha } };
  assert.equal(checkOperationAuthorization({ authorization, runtime, request: { ...base, lifecycleAction: "archive-change", target: "change:first-change", derivedRecord: change, checkpoint: { selectedEntry: { name: "first-change", records: [change] } }, evidenceReference: "change-evidence" } }).allowed, true);
  assert.equal(checkOperationAuthorization({ authorization, runtime, request: { ...base, lifecycleAction: "delete-merged-topic-branch", target: "branch:feature/first-change", derivedRecord: branch, checkpoint: { selectedEntry: { name: "first-change", records: [branch] } }, headCommit: headSha, evidenceReference: "branch-evidence", evidenceHeadCommit: headSha } }).allowed, true);
});

test("derived declarations require durable records for Sync as well as high-impact actions", () => {
  const sync = { entry: "first-change", kind: "sync", id: "first-change", repository: "owner/repository", evidence: { reference: "sync-evidence", current: true } };
  const request = { profile: "sdd-delivery", operation: "run-lifecycle-action", lifecycleAction: "sync-change", target: "sync:first-change", selectedEntry: "first-change", derivedRecord: sync, evidenceCurrent: true, evidenceReference: "sync-evidence", recovery: "recover" };
  assert.equal(checkOperationAuthorization({ authorization: { ...authorization, targets: ["sync:first-change"] }, runtime, request: { ...request, derivedRecord: undefined, selectedEntry: undefined } }).issues[0]?.code, "derived-record-not-durable");
  assert.equal(checkOperationAuthorization({ authorization, runtime, request: { ...request, checkpoint: { selectedEntry: { name: "first-change", records: [sync] } } } }).allowed, true);
  assert.equal(checkOperationAuthorization({ authorization, runtime, request: { ...request, derivedRecord: record, target: "pr:42", checkpoint: { selectedEntry: { name: "first-change", records: [record] } } } }).issues[0]?.code, "derived-record-not-durable");
});

test("preserves exact target authorization without derived declarations", () => {
  const result = checkOperationAuthorization({ authorization: { targets: ["workspace:reports"], allowedMutations: ["read-source"] }, runtime, request: {
    profile: "research-read-only", operation: "read-source", target: "workspace:reports/source-record.md"
  } });
  assert.equal(result.allowed, true, JSON.stringify(result));
  assert.equal(checkOperationAuthorization({ authorization, runtime, config, request: { profile: "sdd-delivery", operation: "run-lifecycle-action", lifecycleAction: "merge-pr", target: "pr:42", selectedEntry: "first-change", derivedRecord: record, headCommit: headSha, evidenceCurrent: true, recovery: "recover" } }).issues[0]?.code, "derived-record-not-durable");
  assert.equal(checkOperationAuthorization({ authorization: { ...authorization, targets: ["pr:42"] }, runtime, config, request: { profile: "sdd-delivery", operation: "run-lifecycle-action", lifecycleAction: "merge-pr", target: "pr:42", headCommit: headSha, evidenceCurrent: true, recovery: "recover" } }).issues[0]?.code, "derived-record-not-durable");
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
  assert.equal(inspectCheckpoint({ ...base, selectedEntry: { name: "first-change", records: [{ ...record, headCommit: "abc1234" }] } }).classification, "human-decision");
  assert.equal(inspectCheckpoint({ ...base, selectedEntry: { name: "first-change", records: [record], reviewRecords: [{ id: "review-1", entry: "wrong-entry", transition: "merge-pr", evidence: {} }] } }).classification, "human-decision");
});

test("production-rapid delivery requires current independent review evidence", () => {
  const reviewer = { type: "fixture-reviewer", identity: "fresh-reviewer", available: true, nonInteractive: true, isolatedContext: true, readOnly: true };
  const reviewInput = { baseCommit: baseSha, headCommit: headSha, diff: accumulatedDiff, openspecArtifacts: ["proposal"], validationEvidence: ["tests"] };
  const evidence = { reviewer: { type: "fixture-reviewer", identity: "fresh-reviewer" }, executionRef: "run", invocationRef: "fixture", reviewedBase: baseSha, reviewedHead: headSha, inputManifest: immutableReviewManifest(reviewInput), timestamp: "2026-08-12T12:00:00.000Z", findings: [], dispositions: [], finalStatus: "clear" };
  const checkpoint = { selectedEntry: { name: "first-change", records: [record], reviewRecords: [{ id: "review-1", entry: "first-change", transition: "merge-pr", evidence }] }, steps: [] };
  assert.equal(prepareIndependentReview({ reviewer, implementerSession: "implementer", reviewInput }).allowed, true);
  const result = checkOperationAuthorization({ authorization, runtime, config, request: {
    profile: "sdd-delivery", operation: "run-lifecycle-action", lifecycleAction: "merge-pr", target: "pr:42", selectedEntry: "first-change", derivedRecord: record, headCommit: headSha, baseCommit: baseSha, independentReviewInput: reviewInput, reviewRepositoryPath: repositoryPath, evidenceCurrent: true, evidenceReference: "pr-evidence", evidenceHeadCommit: headSha, recovery: "re-read PR and checkpoint", deliveryProfile: "production-rapid", implementerSession: "implementer", reviewer, checkpoint, reviewRecordId: "review-1", independentReviewEvidence: evidence
  } });
  assert.equal(result.allowed, true, JSON.stringify(result));
  assert.equal(checkOperationAuthorization({ authorization, runtime, config, request: {
    profile: "sdd-delivery", operation: "run-lifecycle-action", lifecycleAction: "merge-pr", target: "pr:42", selectedEntry: "first-change", derivedRecord: record, headCommit: headSha, baseCommit: baseSha, evidenceCurrent: true, evidenceReference: "pr-evidence", evidenceHeadCommit: headSha, recovery: "re-read PR and checkpoint", deliveryProfile: "production-rapid", implementerSession: "implementer", reviewer, checkpoint, reviewRecordId: "review-1", independentReviewInput: { ...reviewInput, diff: "tampered" }, reviewRepositoryPath: repositoryPath, independentReviewEvidence: evidence
  } }).issues[0]?.code, "independent-review-diff-provenance-mismatch");
  assert.equal(checkOperationAuthorization({ authorization, runtime, config, request: { profile: "sdd-delivery", operation: "run-lifecycle-action", lifecycleAction: "merge-pr", target: "pr:42", selectedEntry: "first-change", derivedRecord: record, checkpoint: derivedCheckpoint, headCommit: headSha, baseCommit: baseSha, evidenceCurrent: true, evidenceReference: "pr-evidence", evidenceHeadCommit: headSha, recovery: "recover", deliveryProfile: "production-rapid", implementerSession: "implementer", reviewer, independentReviewInput: reviewInput, reviewRepositoryPath: repositoryPath, independentReviewEvidence: evidence } }).issues[0]?.code, "independent-review-evidence-not-durable");
  const duplicateCheckpoint = { selectedEntry: { ...checkpoint.selectedEntry, reviewRecords: [...checkpoint.selectedEntry.reviewRecords, { ...checkpoint.selectedEntry.reviewRecords[0] }] }, steps: [] };
  assert.equal(checkOperationAuthorization({ authorization, runtime, config, request: { profile: "sdd-delivery", operation: "run-lifecycle-action", lifecycleAction: "merge-pr", target: "pr:42", selectedEntry: "first-change", derivedRecord: record, headCommit: headSha, baseCommit: baseSha, independentReviewInput: reviewInput, reviewRepositoryPath: repositoryPath, evidenceCurrent: true, evidenceReference: "pr-evidence", evidenceHeadCommit: headSha, recovery: "recover", deliveryProfile: "production-rapid", implementerSession: "implementer", reviewer, checkpoint: duplicateCheckpoint, reviewRecordId: "review-1", independentReviewEvidence: evidence } }).issues[0]?.code, "derived-checkpoint-not-valid");
  const conflictedCheckpoint = { selectedEntry: { name: "first-change", records: [record, { ...record, id: "other", evidence: { reference: "other", current: false, headCommit: headSha } }], reviewRecords: [{ id: "review-1", entry: "first-change", transition: "merge-pr", evidence }] }, steps: [] };
  assert.equal(checkOperationAuthorization({ authorization, runtime, config, request: { profile: "sdd-delivery", operation: "run-lifecycle-action", lifecycleAction: "merge-pr", target: "pr:42", selectedEntry: "first-change", derivedRecord: record, checkpoint: conflictedCheckpoint, headCommit: headSha, baseCommit: baseSha, independentReviewInput: reviewInput, reviewRepositoryPath: repositoryPath, evidenceCurrent: true, evidenceReference: "pr-evidence", evidenceHeadCommit: headSha, recovery: "recover", deliveryProfile: "production-rapid", implementerSession: "implementer", reviewer, reviewRecordId: "review-1", independentReviewEvidence: evidence } }).issues[0]?.code, "derived-checkpoint-not-valid");
  assert.equal(checkOperationAuthorization({ authorization, runtime, config: { reviewRepositoryPath: "/wrong" }, request: { profile: "sdd-delivery", operation: "run-lifecycle-action", lifecycleAction: "merge-pr", target: "pr:42", selectedEntry: "first-change", derivedRecord: record, headCommit: headSha, baseCommit: baseSha, independentReviewInput: reviewInput, reviewRepositoryPath: repositoryPath, evidenceCurrent: true, evidenceReference: "pr-evidence", evidenceHeadCommit: headSha, recovery: "recover", deliveryProfile: "production-rapid", implementerSession: "implementer", reviewer, checkpoint, reviewRecordId: "review-1", independentReviewEvidence: evidence } }).issues[0]?.code, "independent-review-repository-mismatch");
  assert.equal(checkOperationAuthorization({ authorization, runtime, config, request: { profile: "sdd-delivery", operation: "run-lifecycle-action", lifecycleAction: "merge-pr", target: "pr:42", selectedEntry: "first-change", derivedRecord: record, headCommit: headSha, baseCommit: baseSha, independentReviewInput: reviewInput, reviewRepositoryPath: repositoryPath, evidenceCurrent: true, evidenceReference: "pr-evidence", evidenceHeadCommit: headSha, recovery: "recover", deliveryProfile: "production-rapid", implementerSession: "implementer", reviewer: { ...reviewer, identity: "unconfigured" }, checkpoint, reviewRecordId: "review-1", independentReviewEvidence: evidence } }).issues[0]?.code, "independent-reviewer-not-configured");
  assert.equal(checkOperationAuthorization({ authorization, runtime, config, request: { profile: "sdd-delivery", operation: "run-lifecycle-action", lifecycleAction: "merge-pr", target: "pr:42", selectedEntry: "first-change", derivedRecord: record, headCommit: headSha.toUpperCase(), baseCommit: baseSha, independentReviewInput: { ...reviewInput, headCommit: headSha.toUpperCase() }, reviewRepositoryPath: repositoryPath, evidenceCurrent: true, recovery: "recover", deliveryProfile: "production-rapid", implementerSession: "implementer", reviewer, checkpoint, reviewRecordId: "review-1", independentReviewEvidence: evidence } }).issues[0]?.code, "derived-record-not-durable");
});
