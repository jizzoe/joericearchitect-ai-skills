import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";

import {
  correctionRequiresRereview,
  exactHeadReviewBinding,
  exactHeadReviewFields,
  reviewExactHeadReuse,
} from "../autonomous-sdd-exact-head-review.mjs";
import { validateExactHeadReviewReuse } from "../independent-review.mjs";

const sha = (value) => createHash("sha256").update(String(value)).digest("hex");

function binding({ head = "head-1", reviewer = "codex-reviewer", assurance = "strict-isolated" } = {}) {
  return {
    sealedPackageDigest: sha("pkg"),
    headCommit: head,
    artifactManifestDigest: sha("manifest"),
    applyEvidenceDigest: sha("apply"),
    dispositionsDigest: sha("disp"),
    policyGateDigest: sha("gate"),
    reviewerIdentity: reviewer,
    assuranceLevel: assurance,
  };
}

test("exact-head binding is a deterministic digest over all fields", () => {
  assert.ok(exactHeadReviewBinding(binding()));
  assert.equal(exactHeadReviewBinding(binding()), exactHeadReviewBinding(binding()));
  assert.equal(exactHeadReviewBinding({ ...binding(), reviewerIdentity: "" }), null);
  assert.equal(exactHeadReviewBinding({ ...binding(), assuranceLevel: "nope" }), null);
});

test("unchanged bindings reuse the review", () => {
  const out = reviewExactHeadReuse({ previous: binding(), current: binding() });
  assert.equal(out.valid, true);
  assert.equal(out.reusable, true);
});

test("a changed head invalidates", () => {
  const out = reviewExactHeadReuse({ previous: binding(), current: binding({ head: "head-2" }) });
  assert.equal(out.reusable, false);
  assert.ok(out.invalidated.includes("headCommit"));
});

test("each review-relevant field change invalidates", () => {
  const previous = binding();
  for (const field of exactHeadReviewFields) {
    const current = binding();
    if (field === "headCommit") current[field] = "head-2";
    else if (field === "reviewerIdentity") current[field] = "other-reviewer";
    else if (field === "assuranceLevel") current[field] = "authorized-degraded";
    else current[field] = sha(field);
    const out = reviewExactHeadReuse({ previous, current });
    assert.equal(out.reusable, false, field);
    assert.ok(out.invalidated.includes(field), field);
  }
});

test("unchanged non-code closeout reuses without launching a reviewer", () => {
  const out = validateExactHeadReviewReuse({ previous: binding(), current: binding() });
  assert.equal(out.reusable, true);
});

test("correction changes the head and requires rereview within budget", () => {
  assert.equal(correctionRequiresRereview({ headChanged: false }).rereviewRequired, false);
  assert.equal(correctionRequiresRereview({ headChanged: true, attempts: 0, budget: 3 }).rereviewRequired, true);
  assert.equal(correctionRequiresRereview({ headChanged: true, attempts: 2, budget: 3 }).rereviewRequired, true);
});

test("an exhausted signature blocks rather than resets", () => {
  const out = correctionRequiresRereview({ headChanged: true, attempts: 3, budget: 3 });
  assert.equal(out.blocked, true);
  assert.equal(out.rereviewRequired, false);
});
