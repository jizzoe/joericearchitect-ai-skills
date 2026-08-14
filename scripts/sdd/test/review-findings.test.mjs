import assert from "node:assert/strict";
import test from "node:test";
import { nextReviewState, validateFindingDispositions } from "../review-findings.mjs";
const finding = { id: "f-1", severity: "objective-fix", recommendation: "format output" };
test("every finding requires a durable evidence-backed disposition", () => {
  assert.equal(validateFindingDispositions({ findings: [finding], dispositions: [] }).allowed, false);
  const required = validateFindingDispositions({ findings: [finding], dispositions: [{ findingId: "f-1", kind: "objective-fix", evidence: "test failure" }] });
  assert.equal(required.allowed, false);
  assert.equal(required.classification, "objective-fix");
  assert.equal(required.issues[0].code, "independent-review-objective-fix-required");
});
test("disposition rather than severity determines whether human judgment is required", () => {
  assert.equal(validateFindingDispositions({ findings: [{ ...finding, severity: "high" }], dispositions: [{ findingId: "f-1", kind: "objective-fix", evidence: "bounded deterministic failure" }] }).classification, "objective-fix");
  assert.equal(validateFindingDispositions({ findings: [{ ...finding, severity: "warning" }], dispositions: [{ findingId: "f-1", kind: "human-decision", evidence: "product behavior choice" }] }).issues[0].code, "independent-review-human-decision");
  assert.equal(validateFindingDispositions({ findings: [finding], dispositions: [{ findingId: "f-1", kind: "objective-fix", evidence: "test failure" }], correctionAttempts: 3 }).allowed, false);
  assert.deepEqual(nextReviewState({ priorHead: "a", currentHead: "b", findings: [], dispositions: [] }), { state: "rereview-required", reason: "head-changed" });
  assert.deepEqual(nextReviewState({ priorHead: "a", currentHead: "a", findings: [finding], dispositions: [{ findingId: "f-1", kind: "objective-fix", evidence: "test failure" }] }), { state: "correction-required", reason: "independent-review-objective-fix-required" });
});
test("correction limits are counted independently for each failure signature", () => {
  const disposition = { findingId: "f-1", kind: "objective-fix", evidence: "test failure", failureSignature: "signature-new" };
  assert.equal(validateFindingDispositions({ findings: [finding], dispositions: [disposition], correctionAttempts: 4, correctionAttemptsByFailureSignature: { "signature-old": 3, "signature-new": 1 } }).classification, "objective-fix");
  assert.equal(validateFindingDispositions({ findings: [finding], dispositions: [disposition], correctionAttemptsByFailureSignature: { "signature-new": 3 } }).issues[0].code, "correction-limit-exhausted");
});
test("severity and disposition compatibility prevents relabeling material findings", () => {
  for (const severity of ["blocker", "high", "objective-fix"]) {
    for (const kind of ["warning", "false-positive"]) {
      const result = validateFindingDispositions({ findings: [{ ...finding, severity }], dispositions: [{ findingId: "f-1", kind, evidence: "assertion only" }] });
      assert.equal(result.issues[0].code, "independent-review-disposition-incompatible", `${severity}:${kind}`);
    }
  }
  assert.equal(validateFindingDispositions({ findings: [{ ...finding, severity: "warning" }], dispositions: [{ findingId: "f-1", kind: "false-positive", evidence: "assertion only" }] }).issues[0].code, "independent-review-disposition-incompatible");
  assert.equal(validateFindingDispositions({ findings: [{ ...finding, severity: "false-positive" }], dispositions: [{ findingId: "f-1", kind: "warning", evidence: "assertion only" }] }).issues[0].code, "independent-review-disposition-incompatible");
});
test("dispositions map exactly once to every finding", () => {
  const disposition = { findingId: "f-1", kind: "objective-fix", evidence: "test failure" };
  assert.equal(validateFindingDispositions({ findings: [finding], dispositions: [disposition, disposition] }).issues[0].code, "independent-review-dispositions-malformed");
  assert.equal(validateFindingDispositions({ findings: [finding], dispositions: [disposition, { findingId: "unknown", kind: "warning", evidence: "extra" }] }).issues[0].code, "independent-review-disposition-count-mismatch");
});
test("warnings and false positives remain evidence-backed and reviewable", () => {
  for (const kind of ["warning", "false-positive"]) {
    const result = validateFindingDispositions({ findings: [{ id: kind, severity: kind, recommendation: "documented observation" }], dispositions: [{ findingId: kind, kind, evidence: "docs/protocol.md" }] });
    assert.equal(result.allowed, true);
  }
});
