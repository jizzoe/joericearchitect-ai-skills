import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { executeAuthorizedIndependentReview, executeIndependentReview, probeDegradedIndependentReviewAdapter, probeIndependentReviewAdapter } from "../execute-independent-review.mjs";
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

test("degraded execution is strict-first and requires the explicit sealed-package authorization", async () => {
  const reviewPackage = file("valid-package.json"); reviewPackage.manifestDigest = packageDigest(reviewPackage);
  const strictReviewer = { type: "strict", identity: "strict-reviewer", attestation: { ref: "strict-attestation" } };
  const degradedReviewer = { type: "degraded", identity: "degraded-reviewer", attestation: { ref: "degraded-attestation" } };
  const authorization = { degradedIndependentReview: { enabled: true, change: "change", transitions: ["merge-pr"], expiresAt: "2026-08-14T00:00:00.000Z", riskReason: "synthetic exact fallback", fallbackBoundary: "fresh-separated-reviewer-only", baseCommit: reviewPackage.baseCommit, headCommit: reviewPackage.headCommit, manifestDigest: reviewPackage.manifestDigest } };
  const degraded = file("valid-result.json");
  Object.assign(degraded, { reviewRecordId: "degraded-record", executionId: "degraded-execution", reviewer: { type: "degraded", identity: "degraded-reviewer", adapter: "degraded" }, attestation: { ref: "degraded-attestation", nonInteractive: true, isolatedContext: false, freshContext: true, readOnly: false }, assuranceLevel: "authorized-degraded", manifestDigest: reviewPackage.manifestDigest, capabilityLedger: { enforced: ["githubMutation", "deployment", "release", "externalSend", "delegatedMutation"], unavailable: ["workspaceWrite", "gitWrite", "credentialAccess", "authenticatedNetwork"], instructionConstrained: [] }, strictUnavailable: { reviewRecordId: `strict-unavailable-${reviewPackage.manifestDigest.slice(0, 12)}`, executionId: `strict-unavailable-${reviewPackage.headCommit.slice(0, 12)}`, adapter: "strict", status: "unavailable", unavailableCode: "independent-reviewer-not-isolated-read-only", baseCommit: reviewPackage.baseCommit, headCommit: reviewPackage.headCommit, manifestDigest: reviewPackage.manifestDigest }, degradedAuthorization: { change: "change", transition: "merge-pr", expiresAt: "2026-08-14T00:00:00.000Z", riskReason: "synthetic exact fallback", fallbackBoundary: "fresh-separated-reviewer-only" } });
  const calls = [];
  const common = { package: reviewPackage, strictAdapter: {}, degradedAdapter: { freshContext: true, nonInteractive: true, detachedView: true, sealedPackageOnly: true, disabledMutationTools: true, credentialScrubbed: true }, configuredReviewer: strictReviewer, degradedReviewer, implementerSession: "implementer", authorization, selectedEntry: "change", now: "2026-08-13T00:00:00.000Z", invokeStrict: async () => { calls.push("strict"); return degraded; }, invokeDegraded: async (received) => { calls.push("degraded"); assert.notEqual(received, reviewPackage); return degraded; } };
  const pending = await executeAuthorizedIndependentReview(common);
  assert.equal(pending.code, "strict-unavailable-evidence-not-durable");
  assert.equal(pending.requiresPersistence, true);
  assert.deepEqual(calls, []);
  const out = await executeAuthorizedIndependentReview({ ...common, durableStrictUnavailable: { reference: "checkpoint:strict-unavailable", current: true, result: degraded.strictUnavailable } });
  assert.equal(out.status, "passed", JSON.stringify(out));
  assert.deepEqual(calls, ["degraded"]);
  assert.equal(probeDegradedIndependentReviewAdapter({}).available, false);
});
