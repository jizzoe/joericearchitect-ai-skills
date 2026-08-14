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
