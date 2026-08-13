import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { executeIndependentReview, probeIndependentReviewAdapter } from "../execute-independent-review.mjs";
import { packageDigest } from "../independent-review-contract.mjs";
const file = (name) => JSON.parse(fs.readFileSync(new URL(`../../../evals/skills/independent-review/fixtures/${name}`, import.meta.url), "utf8"));
const adapter = { adapter: "fixture", attestationRef: "fixture-attestation", probeReference: "fixture-probe", runtimeEnforced: true, freshContext: true, readOnlyView: true, nonInteractive: true, denied: { workspaceWrite: true, gitWrite: true, githubMutation: true, credentialAccess: true, authenticatedNetwork: true, externalSend: true, deployment: true, release: true, delegatedMutation: true } };
test("capability probe fails closed and executor accepts only a validated immutable result", async () => {
  assert.equal(probeIndependentReviewAdapter({ ...adapter, denied: { ...adapter.denied, gitWrite: false } }).available, false);
  const reviewPackage = file("valid-package.json"); reviewPackage.manifestDigest = packageDigest(reviewPackage);
  const result = file("valid-result.json"); result.manifestDigest = reviewPackage.manifestDigest;
  const out = await executeIndependentReview({ package: reviewPackage, adapter, configuredReviewer: { type: "fixture", identity: "fresh-reviewer", attestation: { ref: "fixture-attestation" } }, implementerSession: "implementer", invoke: async () => result });
  assert.equal(out.status, "passed");
  assert.equal((await executeIndependentReview({ package: reviewPackage, adapter: {}, invoke: async () => result })).status, "unavailable");
});
