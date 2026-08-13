import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import test from "node:test";
import { checkOperationAuthorization } from "../check-operation-authorization.mjs";
import { packageDigest } from "../independent-review-contract.mjs";
import { validateIndependentReviewV1 } from "../independent-review.mjs";

const fixture = (name) => JSON.parse(fs.readFileSync(new URL(`../../../evals/skills/independent-review/fixtures/${name}`, import.meta.url), "utf8"));
const baseCommit = execFileSync("git", ["rev-parse", "HEAD~1"], { encoding: "utf8" }).trim();
const headCommit = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
const reviewer = { type: "fixture", identity: "fresh-reviewer", enabled: true, attestation: { ref: "fixture-attestation", nonInteractive: true, isolatedContext: true, readOnly: true } };
const make = () => {
  const reviewPackage = fixture("valid-package.json");
  reviewPackage.baseCommit = baseCommit; reviewPackage.headCommit = headCommit; reviewPackage.validationEvidence = ["tests"];
  reviewPackage.manifestDigest = packageDigest(reviewPackage);
  const result = fixture("valid-result.json");
  result.baseCommit = baseCommit; result.headCommit = headCommit; result.manifestDigest = reviewPackage.manifestDigest;
  return { reviewPackage, result };
};

test("normalized v1 review result requires current Apply evidence and preserves dispositions", () => {
  const { reviewPackage, result } = make();
  const applyEvidence = { reference: "apply-v1", current: true, headCommit, completedAt: "2026-08-13T03:00:00.000Z", validationEvidence: ["tests"] };
  const configured = { ...reviewer, available: true, nonInteractive: true, isolatedContext: true, readOnly: true };
  assert.equal(validateIndependentReviewV1({ reviewer: configured, implementerSession: "implementer", reviewPackage, reviewResult: result, applyEvidence }).allowed, true);
  assert.equal(validateIndependentReviewV1({ reviewer: configured, implementerSession: "implementer", reviewPackage, reviewResult: { ...result, status: "unavailable", unavailableCode: "independent-reviewer-runtime-unavailable", attestation: { ...result.attestation, nonInteractive: false, isolatedContext: false, readOnly: false } }, applyEvidence }).allowed, false);
  const finding = { id: "finding-1", severity: "warning", evidence: "scripts/sdd/test/independent-review-v1-gate.test.mjs", recommendation: "document expected state" };
  assert.equal(validateIndependentReviewV1({ reviewer: configured, implementerSession: "implementer", reviewPackage, reviewResult: { ...result, findings: [finding] }, applyEvidence, dispositions: [] }).allowed, false);
  assert.equal(validateIndependentReviewV1({ reviewer: configured, implementerSession: "implementer", reviewPackage, reviewResult: { ...result, findings: [finding] }, applyEvidence, dispositions: [{ findingId: "finding-1", kind: "warning", evidence: "documented behavior" }] }).allowed, true);
});

test("operation checker accepts only a durable exact v1 record", () => {
  const { reviewPackage, result } = make();
  const applyEvidence = { reference: "apply-v1", current: true, headCommit, completedAt: "2026-08-13T03:00:00.000Z", validationEvidence: ["tests"] };
  const pr = { entry: "change", kind: "pr", id: "7", repository: "owner/repository", baseBranch: "main", headCommit, evidence: { reference: "pr", current: true, headCommit } };
  const issue = { entry: "change", kind: "issue", id: "8", repository: "owner/repository", evidence: { reference: "issue", current: true } };
  const branch = { entry: "change", kind: "branch", id: "feature/change", repository: "owner/repository", baseBranch: "main", headCommit, evidence: { reference: "branch", current: true, headCommit } };
  const reviewRecord = { id: result.reviewRecordId, entry: "change", transition: "merge-pr", evidence: {}, reviewPackage, result, dispositions: [] };
  const steps = ["issue", "branch", "pr", "merge-pr", "sync-change", "archive-change", "delete-merged-topic-branch"].map((id, index) => ({ id, status: index < 3 ? "complete" : "pending", evidence: index < 3 ? { present: true, current: true } : undefined }));
  const checkpoint = { selectedEntry: { name: "change", records: [issue, branch, pr], applyEvidenceRecords: [applyEvidence], reviewRecords: [reviewRecord] }, steps };
  const request = { profile: "sdd-delivery", operation: "run-lifecycle-action", lifecycleAction: "merge-pr", target: "pr:7", selectedEntry: "change", derivedRecord: pr, headCommit, baseCommit, evidenceCurrent: true, evidenceReference: "pr", evidenceHeadCommit: headCommit, recovery: "re-read state", deliveryProfile: "production-rapid", implementerSession: "implementer", reviewer: { type: "fixture", identity: "fresh-reviewer" }, checkpoint, applyEvidence, independentReviewPackage: reviewPackage, independentReviewResult: result, reviewDispositions: [] };
  const authorization = { targets: ["workspace:reports"], allowedMutations: ["run-lifecycle-action"], derivedTargets: { queue: ["change"], selectedEntry: "change", repository: "owner/repository" } };
  const config = { independentReviewer: reviewer };
  assert.equal(checkOperationAuthorization({ authorization, runtime: { permittedOperations: ["run-lifecycle-action"] }, config, request }).allowed, true);
  assert.equal(checkOperationAuthorization({ authorization, runtime: { permittedOperations: ["run-lifecycle-action"] }, config, request: { ...request, independentReviewResult: { ...result, headCommit: baseCommit } } }).issues[0].code, "independent-review-evidence-not-durable");
});
