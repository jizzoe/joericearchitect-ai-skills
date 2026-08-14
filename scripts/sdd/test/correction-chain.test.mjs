import assert from "node:assert/strict";
import test from "node:test";

import { canonicalFailureSignature } from "../correction-chain.mjs";

const source = (findingId, evidence, transition = "merge-pr") => ({
  kind: "independent-review",
  reviewRecordId: "review-1",
  findingId,
  severity: "objective-fix",
  evidence,
  transition
});

test("failure signatures preserve existing durable path-valued signatures", () => {
  assert.equal(
    canonicalFailureSignature(source("finding-1", "scripts/sdd/correction-chain.mjs")),
    "independent-review/finding-1/scripts/sdd/correction-chain.mjs/merge-pr"
  );
});

test("failure signature boundaries cannot collide through slash or percent values", () => {
  assert.notEqual(
    canonicalFailureSignature(source("a/b", "c")),
    canonicalFailureSignature(source("a", "b/c"))
  );
  assert.notEqual(
    canonicalFailureSignature(source("a/b", "c")),
    canonicalFailureSignature(source("a%2Fb", "c"))
  );
  assert.notEqual(
    canonicalFailureSignature(source("a", "c/d", "e")),
    canonicalFailureSignature(source("a", "c", "d/e"))
  );
});

test("verification failure signatures come from their durable source field", () => {
  const verification = { kind: "verification", verificationRecordId: "verification-1", failureSignature: "focused-regression", evidence: "evidence/focused.json", transition: "openspec-verify" };
  assert.equal(canonicalFailureSignature(verification), "focused-regression");
  assert.equal(canonicalFailureSignature({ ...verification, verificationRecordId: "" }), null);
  assert.equal(canonicalFailureSignature({ ...verification, failureSignature: "" }), null);
});
