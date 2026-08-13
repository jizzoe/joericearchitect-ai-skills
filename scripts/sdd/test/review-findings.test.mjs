import assert from "node:assert/strict";
import test from "node:test";
import { nextReviewState, validateFindingDispositions } from "../review-findings.mjs";
const finding = { id: "f-1", severity: "objective-fix", recommendation: "format output" };
test("every finding requires a durable evidence-backed disposition", () => {
  assert.equal(validateFindingDispositions({ findings: [finding], dispositions: [] }).allowed, false);
  assert.equal(validateFindingDispositions({ findings: [finding], dispositions: [{ findingId: "f-1", kind: "objective-fix", evidence: "test failure" }] }).allowed, true);
});
test("material findings pause and corrections require a new head review", () => {
  assert.equal(validateFindingDispositions({ findings: [{ ...finding, severity: "high" }], dispositions: [{ findingId: "f-1", kind: "objective-fix", evidence: "test failure" }] }).allowed, false);
  assert.equal(validateFindingDispositions({ findings: [finding], dispositions: [{ findingId: "f-1", kind: "objective-fix", evidence: "test failure" }], correctionAttempts: 3 }).allowed, false);
  assert.deepEqual(nextReviewState({ priorHead: "a", currentHead: "b", findings: [], dispositions: [] }), { state: "rereview-required", reason: "head-changed" });
});
test("correction limits are counted independently for each failure signature", () => {
  const disposition = { findingId: "f-1", kind: "objective-fix", evidence: "test failure", failureSignature: "signature-new" };
  assert.equal(validateFindingDispositions({ findings: [finding], dispositions: [disposition], correctionAttempts: 4, correctionAttemptsByFailureSignature: { "signature-old": 3, "signature-new": 1 } }).allowed, true);
  assert.equal(validateFindingDispositions({ findings: [finding], dispositions: [disposition], correctionAttemptsByFailureSignature: { "signature-new": 3 } }).issues[0].code, "correction-limit-exhausted");
});
test("warnings and false positives remain evidence-backed and reviewable", () => {
  for (const kind of ["warning", "false-positive"]) {
    const result = validateFindingDispositions({ findings: [{ id: kind, severity: kind, recommendation: "documented observation" }], dispositions: [{ findingId: kind, kind, evidence: "docs/protocol.md" }] });
    assert.equal(result.allowed, true);
  }
});
