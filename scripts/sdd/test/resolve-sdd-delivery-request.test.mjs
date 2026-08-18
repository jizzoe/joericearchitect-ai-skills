import assert from "node:assert/strict";
import test from "node:test";

import { resolveSddDeliveryRequest, resolveShipSddRequest, sddDeliveryRequestInputs } from "../resolve-sdd-delivery-request.mjs";

const complete = {
  target: "add-research-and-planning-base-skills",
  mode: "autonomous",
  qualityProfile: "production-rapid",
  authorizationProfile: "sdd-delivery",
  reviewPolicy: "strict-first-degraded",
  expiration: "12h"
};
const started = "2026-08-13T12:00:00.000Z";

test("production-rapid shorthand expands without weakening quality or mutation boundaries", () => {
  const result = resolveSddDeliveryRequest(complete, { goalStartedAt: started });
  assert.equal(result.ready, true);
  assert.equal(result.effectiveAuthorization.expiresAt, "2026-08-14T00:00:00.000Z");
  assert.equal(result.effectiveAuthorization.correctionBudgetPerFailureSignature, 3);
  assert.equal(result.effectiveAuthorization.schemaVersion, 2);
  assert.equal(result.effectiveAuthorization.reviewPolicy, "strict-first-degraded");
  assert.equal(result.effectiveAuthorization.review.strictFirst, true);
  assert.equal(result.effectiveAuthorization.review.degradedFallbackAuthorized, true);
  assert.equal(result.effectiveAuthorization.review.launcherRecoveryAuthorized, true);
  assert.ok(result.effectiveAuthorization.qualityGates.includes("openspec-verify"));
  assert.deepEqual(result.effectiveAuthorization.qualityGates, result.effectiveAuthorization.requiredQualityActions);
  assert.ok(result.effectiveAuthorization.completionEvidencePredicates.includes("final-target-package-workspace-and-head-bound"));
  assert.ok(result.effectiveAuthorization.lifecycle.allowed.includes("merge-archive-pr"));
  assert.ok(result.effectiveAuthorization.lifecycle.forbidden.includes("deployment"));
});

test("strict-only remains fail-closed and an optional correction budget can only narrow the maximum", () => {
  const result = resolveSddDeliveryRequest({ ...complete, reviewPolicy: "strict-only", correctionBudgetPerFailureSignature: 1 }, { goalStartedAt: started });
  assert.equal(result.ready, true);
  assert.equal(result.effectiveAuthorization.correctionBudgetPerFailureSignature, 1);
  assert.equal(result.effectiveAuthorization.review.degradedFallbackAuthorized, false);
  assert.equal(result.effectiveAuthorization.review.launcherRecoveryAuthorized, false);
  assert.equal(result.effectiveAuthorization.review.riskAcceptanceReason, null);
  assert.equal(resolveSddDeliveryRequest({ ...complete, correctionBudgetPerFailureSignature: 4 }, { goalStartedAt: started }).ready, false);
});

test("an ordered queue and absolute expiration normalize deterministically", () => {
  const result = resolveSddDeliveryRequest({
    ...complete,
    target: ["first-change", "second-change"],
    expiration: "2026-08-14T06:00:00-04:00"
  }, { goalStartedAt: started });
  assert.equal(result.ready, true);
  assert.equal(result.effectiveAuthorization.target.kind, "ordered-queue");
  assert.deepEqual(result.effectiveAuthorization.target.entries, ["first-change", "second-change"]);
  assert.equal(result.effectiveAuthorization.expiresAt, "2026-08-14T10:00:00.000Z");
});

test("all missing inputs produce one concise pre-mutation clarification", () => {
  const result = resolveSddDeliveryRequest({}, { goalStartedAt: started });
  assert.equal(result.ready, false);
  assert.equal(result.classification, "needs-input");
  assert.equal(result.issues.length, sddDeliveryRequestInputs.length);
  for (const definition of sddDeliveryRequestInputs) {
    assert.match(result.clarification, new RegExp(`- ${definition.field}:`));
    assert.match(result.clarification, new RegExp(definition.values[0].replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(result.clarification, /before I can select work or make changes/);
});

test("invalid and conflicting values identify the field and published values without guessing", () => {
  const result = resolveSddDeliveryRequest({
    ...complete,
    mode: "autonomouser",
    authorizationProfile: "deploy-everything",
    reviewPolicy: true,
    expiration: "forever"
  }, { goalStartedAt: started });
  assert.equal(result.ready, false);
  assert.equal(result.classification, "invalid");
  assert.deepEqual(new Set(result.issues.map((item) => item.field)), new Set(["mode", "authorizationProfile", "reviewPolicy", "expiration"]));
  assert.match(result.clarification, /autonomous \| interactive/);
  assert.match(result.clarification, /strict-only \| strict-first-degraded \| same-session-local/);
});

test("target rejects duplicates, unsafe names, and empty queues", () => {
  for (const target of [[], ["same-change", "same-change"], "../unsafe", { queue: [] }]) {
    const result = resolveSddDeliveryRequest({ ...complete, target }, { goalStartedAt: started });
    assert.equal(result.ready, false);
    assert.equal(result.issues[0].field, "target");
  }
});

test("duration overflow returns a structured invalid-input clarification", () => {
  for (const expiration of ["999999999999h", { hours: 999999999999 }]) {
    const result = resolveSddDeliveryRequest({ ...complete, expiration }, { goalStartedAt: started });
    assert.equal(result.ready, false);
    assert.equal(result.classification, "invalid");
    assert.equal(result.issues[0].field, "expiration");
  }
});

test("ship-sdd aliases preserve explicit target and only override duration", () => {
  const prod = resolveShipSddRequest("ship-sdd complete-delivery prod", { goalStartedAt: started });
  assert.equal(prod.ready, true);
  assert.equal(prod.effectiveAuthorization.target.entries[0], "complete-delivery");
  assert.equal(prod.effectiveAuthorization.qualityProfile, "production-rapid");
  assert.equal(prod.effectiveAuthorization.reviewPolicy, "strict-only");
  assert.equal(prod.effectiveAuthorization.independentReviewPolicy, "strict-only");
  assert.equal(prod.effectiveAuthorization.expiresAt, "2026-08-13T16:00:00.000Z");
  const prototype = resolveShipSddRequest("ship-sdd complete-delivery prototype 8h", { goalStartedAt: started });
  assert.equal(prototype.ready, true);
  assert.equal(prototype.effectiveAuthorization.qualityProfile, "prototype-rapid");
  assert.equal(prototype.effectiveAuthorization.reviewPolicy, "same-session-local");
  assert.equal(prototype.effectiveAuthorization.independentReviewPolicy, undefined);
  assert.deepEqual(prototype.effectiveAuthorization.blockingApprovalGates, []);
  assert.equal(prototype.effectiveAuthorization.review.assurance, "local-review");
  assert.equal(prototype.effectiveAuthorization.expiresAt, "2026-08-13T20:00:00.000Z");
});

test("explicit autonomous prototype matrix requires same-session-local", () => {
  const resolved = resolveSddDeliveryRequest({
    ...complete,
    qualityProfile: "prototype-rapid",
    reviewPolicy: "same-session-local"
  }, { goalStartedAt: started });
  assert.equal(resolved.ready, true);
  assert.deepEqual(resolved.effectiveAuthorization.blockingApprovalGates, []);
  assert.ok(resolved.effectiveAuthorization.requiredQualityActions.includes("local-code-security-review"));
  assert.ok(resolved.effectiveAuthorization.requiredQualityActions.includes("openspec-verify"));
  assert.equal(resolved.effectiveAuthorization.requiredQualityActions.includes("independent-review"), false);

  const wrong = resolveSddDeliveryRequest({
    ...complete,
    qualityProfile: "prototype-rapid",
    reviewPolicy: "strict-only"
  }, { goalStartedAt: started });
  assert.equal(wrong.ready, false);
  assert.equal(wrong.issues[0].code, "delivery-request-matrix-conflict");
});

test("legacy independent-review input remains compatible only when consistent", () => {
  const legacy = { ...complete };
  delete legacy.reviewPolicy;
  legacy.independentReviewPolicy = "strict-only";
  const accepted = resolveSddDeliveryRequest(legacy, { goalStartedAt: started });
  assert.equal(accepted.ready, true);
  assert.equal(accepted.effectiveAuthorization.reviewPolicy, "strict-only");
  assert.equal(accepted.effectiveAuthorization.independentReviewPolicyDeprecated, true);

  const conflict = resolveSddDeliveryRequest({ ...complete, reviewPolicy: "strict-only", independentReviewPolicy: "strict-first-degraded" }, { goalStartedAt: started });
  assert.equal(conflict.ready, false);
  assert.equal(conflict.issues[0].code, "conflicting-delivery-request-input");

  const invalid = { ...complete };
  delete invalid.reviewPolicy;
  invalid.independentReviewPolicy = "same-session-local";
  const rejected = resolveSddDeliveryRequest(invalid, { goalStartedAt: started });
  assert.equal(rejected.ready, false);
  assert.equal(rejected.issues[0].field, "independentReviewPolicy");
  assert.match(rejected.clarification, /independentReviewPolicy:/);
});

test("ship-sdd accepts an explicitly ordered bracketed queue and resolves exact brief scope", () => {
  const result = resolveShipSddRequest("ship-sdd [first-change, second-change] prod 12h", { goalStartedAt: started });
  assert.equal(result.ready, true);
  assert.deepEqual(result.effectiveAuthorization.target.entries, ["first-change", "second-change"]);
  assert.equal(result.effectiveAuthorization.deliveryPreparation.outputPath, "ai-planning/design-briefs/first-change.md");
  assert.equal(result.effectiveAuthorization.allowedMutations.includes("run-lifecycle-action"), true);
});

test("ship-sdd rejects omitted targets and malformed aliases before selection", () => {
  for (const value of ["ship-sdd prod", "ship-sdd target unknown", "apply target prod"]) {
    assert.equal(resolveShipSddRequest(value, { goalStartedAt: started }).ready, false);
  }
});
