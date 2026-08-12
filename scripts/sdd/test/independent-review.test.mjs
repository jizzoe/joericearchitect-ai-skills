import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { immutableReviewManifest, prepareIndependentReview, validateIndependentReviewEvidence } from "../independent-review.mjs";

const fixture = JSON.parse(fs.readFileSync(new URL("../../../evals/skills/autonomous-goal-runner/fixtures/independent-review-evidence.json", import.meta.url), "utf8"));
const ready = () => prepareIndependentReview({ reviewer: fixture.reviewer, implementerSession: fixture.implementerSession, reviewInput: fixture.input });
const manifest = immutableReviewManifest(fixture.input);
const validate = (overrides = {}) => validateIndependentReviewEvidence({ reviewer: fixture.reviewer, implementerSession: fixture.implementerSession, expectedBase: fixture.input.baseCommit, expectedHead: fixture.input.headCommit, expectedReviewManifest: manifest, evidence: { ...fixture.evidence, inputManifest: manifest, ...overrides } });
const code = (result) => result.issues[0]?.code;

test("independent review accepts a clean isolated reviewer and exact immutable package", () => {
  assert.equal(ready().allowed, true);
  assert.equal(ready().reviewManifest, manifest);
  assert.equal(validate().allowed, true);
});

test("blocker or high objective-fix finding requires an objective fix and rereview", () => {
  for (const finding of [
    { id: "blocker", severity: "blocker", classification: "objective-fix" },
    { id: "high", severity: "high", classification: "objective-fix" }
  ]) assert.equal(code(validate({ findings: [finding], finalStatus: "findings" })), "independent-review-findings-unresolved");
  assert.equal(code(validate({ reviewedHead: "eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee" })), "independent-review-evidence-stale-head");
  assert.equal(code(validate({ inputManifest: "other-package" })), "independent-review-evidence-manifest-mismatch");
});

test("rejects self review, stale SHA, malformed or missing evidence, and unavailable reviewer", () => {
  assert.equal(code(prepareIndependentReview({ reviewer: fixture.reviewer, implementerSession: fixture.reviewer.identity, reviewInput: fixture.input })), "independent-review-self-review");
  assert.equal(code(validate({ reviewedBase: "cccccccccccccccccccccccccccccccccccccccc" })), "independent-review-evidence-stale-head");
  assert.equal(code(validate({ reviewedBase: "" })), "independent-review-evidence-malformed");
  assert.equal(code(validate({ reviewedHead: "" })), "independent-review-evidence-malformed");
  assert.equal(code(validate({ executionRef: "" })), "independent-review-evidence-malformed");
  assert.equal(code(validateIndependentReviewEvidence({ reviewer: fixture.reviewer, implementerSession: fixture.implementerSession, expectedBase: fixture.input.baseCommit, expectedHead: fixture.input.headCommit, expectedReviewManifest: manifest })), "independent-review-evidence-malformed");
  assert.equal(code(validateIndependentReviewEvidence({ reviewer: fixture.reviewer, implementerSession: fixture.implementerSession, expectedBase: "", expectedHead: fixture.input.headCommit, expectedReviewManifest: manifest, evidence: fixture.evidence })), "independent-review-input-incomplete");
  assert.equal(code(validateIndependentReviewEvidence({ reviewer: fixture.reviewer, implementerSession: fixture.implementerSession, expectedBase: fixture.input.baseCommit, expectedHead: "", expectedReviewManifest: manifest, evidence: fixture.evidence })), "independent-review-input-incomplete");
  assert.equal(code(validateIndependentReviewEvidence({ reviewer: { ...fixture.reviewer, available: false }, implementerSession: fixture.implementerSession, expectedBase: fixture.input.baseCommit, expectedHead: fixture.input.headCommit, expectedReviewManifest: manifest, evidence: fixture.evidence })), "independent-reviewer-unavailable");
});

test("review evaluator is portable because all reviewer and commit values are inputs", () => {
  const other = { ...fixture, reviewer: { ...fixture.reviewer, identity: "separate-reviewer" }, implementerSession: "other-implementer", input: { ...fixture.input, baseCommit: "cccccccccccccccccccccccccccccccccccccccc", headCommit: "dddddddddddddddddddddddddddddddddddddddd" } };
  const otherManifest = immutableReviewManifest(other.input);
  const evidence = { ...fixture.evidence, reviewer: { type: other.reviewer.type, identity: other.reviewer.identity }, reviewedBase: other.input.baseCommit, reviewedHead: other.input.headCommit, inputManifest: otherManifest };
  assert.equal(prepareIndependentReview({ reviewer: other.reviewer, implementerSession: other.implementerSession, reviewInput: other.input }).allowed, true);
  assert.equal(validateIndependentReviewEvidence({ reviewer: other.reviewer, implementerSession: other.implementerSession, expectedBase: other.input.baseCommit, expectedHead: other.input.headCommit, expectedReviewManifest: otherManifest, evidence }).allowed, true);
});
