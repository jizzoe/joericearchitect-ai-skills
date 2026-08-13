import assert from "node:assert/strict";
import test from "node:test";

import { resolveSddDeliveryRequest, sddDeliveryRequestInputs } from "../resolve-sdd-delivery-request.mjs";

const complete = {
  target: "add-research-and-planning-base-skills",
  mode: "autonomous",
  qualityProfile: "production-rapid",
  authorizationProfile: "sdd-delivery",
  independentReviewPolicy: "strict-first-degraded",
  expiration: "12h"
};
const started = "2026-08-13T12:00:00.000Z";

test("production-rapid shorthand expands without weakening quality or mutation boundaries", () => {
  const result = resolveSddDeliveryRequest(complete, { goalStartedAt: started });
  assert.equal(result.ready, true);
  assert.equal(result.effectiveAuthorization.expiresAt, "2026-08-14T00:00:00.000Z");
  assert.equal(result.effectiveAuthorization.correctionBudgetPerFailureSignature, 3);
  assert.equal(result.effectiveAuthorization.review.strictFirst, true);
  assert.equal(result.effectiveAuthorization.review.degradedFallbackAuthorized, true);
  assert.equal(result.effectiveAuthorization.review.launcherRecoveryAuthorized, true);
  assert.ok(result.effectiveAuthorization.qualityGates.includes("openspec-verify"));
  assert.ok(result.effectiveAuthorization.lifecycle.allowed.includes("merge-archive-pr"));
  assert.ok(result.effectiveAuthorization.lifecycle.forbidden.includes("deployment"));
});

test("strict-only remains fail-closed and an optional correction budget can only narrow the maximum", () => {
  const result = resolveSddDeliveryRequest({ ...complete, independentReviewPolicy: "strict-only", correctionBudgetPerFailureSignature: 1 }, { goalStartedAt: started });
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
    independentReviewPolicy: true,
    expiration: "forever"
  }, { goalStartedAt: started });
  assert.equal(result.ready, false);
  assert.equal(result.classification, "invalid");
  assert.deepEqual(new Set(result.issues.map((item) => item.field)), new Set(["mode", "authorizationProfile", "independentReviewPolicy", "expiration"]));
  assert.match(result.clarification, /autonomous \| interactive/);
  assert.match(result.clarification, /strict-only \| strict-first-degraded/);
});

test("target rejects duplicates, unsafe names, and empty queues", () => {
  for (const target of [[], ["same-change", "same-change"], "../unsafe", { queue: [] }]) {
    const result = resolveSddDeliveryRequest({ ...complete, target }, { goalStartedAt: started });
    assert.equal(result.ready, false);
    assert.equal(result.issues[0].field, "target");
  }
});
