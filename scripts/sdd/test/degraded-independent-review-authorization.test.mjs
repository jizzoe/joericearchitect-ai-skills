import assert from "node:assert/strict";
import test from "node:test";
import { validateDegradedIndependentReviewAuthorization } from "../degraded-independent-review-authorization.mjs";

const baseCommit = "a".repeat(40);
const headCommit = "b".repeat(40);
const manifestDigest = "c".repeat(64);
const reviewPackage = { baseCommit, headCommit, manifestDigest };
const strictResult = { status: "unavailable", unavailableCode: "strict-runtime-unavailable", baseCommit, headCommit, manifestDigest };
const authorization = { degradedIndependentReview: { enabled: true, change: "add-authorized-degraded-independent-review", transitions: ["merge-pr"], expiresAt: "2026-08-14T00:00:00.000Z", riskReason: "Bootstrap exception for exact delivery", fallbackBoundary: "fresh-separated-reviewer-only", baseCommit, headCommit, manifestDigest, allowDerivedObjectiveCorrections: true } };
const input = { authorization, selectedEntry: "add-authorized-degraded-independent-review", transition: "merge-pr", reviewPackage, strictResult, now: "2026-08-13T00:00:00.000Z" };

test("degraded authorization is explicit, strict-first, exact, and expiring", () => {
  assert.equal(validateDegradedIndependentReviewAuthorization(input).allowed, true);
  assert.equal(validateDegradedIndependentReviewAuthorization({ ...input, authorization: {} }).issues[0].code, "degraded-independent-review-not-authorized");
  assert.equal(validateDegradedIndependentReviewAuthorization({ ...input, strictResult: { ...strictResult, status: "passed" } }).issues[0].code, "degraded-independent-review-strict-unavailable-missing");
  assert.equal(validateDegradedIndependentReviewAuthorization({ ...input, transition: "archive-change" }).issues[0].code, "degraded-independent-review-transition-mismatch");
  assert.equal(validateDegradedIndependentReviewAuthorization({ ...input, now: "2026-08-15T00:00:00.000Z" }).issues[0].code, "degraded-independent-review-authorization-expired");
  assert.equal(validateDegradedIndependentReviewAuthorization({ ...input, reviewPackage: { ...reviewPackage, headCommit: "d".repeat(40) } }).issues[0].code, "degraded-independent-review-strict-unavailable-missing");
});

test("derived packages are limited to an evidenced corrective envelope", () => {
  const derived = { ...reviewPackage, headCommit: "d".repeat(40), manifestDigest: "e".repeat(64) };
  const strict = { ...strictResult, headCommit: derived.headCommit, manifestDigest: derived.manifestDigest };
  const correctionEvidence = { id: "correction-1", change: "add-authorized-degraded-independent-review", attempt: 1, failureSignature: "fixture-failure", classification: "objective-fix", behaviorPreserving: true, current: true, ancestryVerified: true, evidenceReference: "checkpoint:correction-1", baseCommit, previousHead: headCommit, previousManifestDigest: manifestDigest, headCommit: derived.headCommit, manifestDigest: derived.manifestDigest };
  const derivedAuthorization = { degradedIndependentReview: { ...authorization.degradedIndependentReview, derivedCorrections: [correctionEvidence] } };
  assert.equal(validateDegradedIndependentReviewAuthorization({ ...input, authorization: derivedAuthorization, reviewPackage: derived, strictResult: strict, derivedCorrection: true, correctionAttempts: 0, correctionEvidence }).allowed, true);
  assert.equal(validateDegradedIndependentReviewAuthorization({ ...input, authorization: derivedAuthorization, reviewPackage: derived, strictResult: strict, derivedCorrection: true, correctionAttempts: 1, correctionEvidence }).issues[0].code, "degraded-independent-review-package-mismatch");
  assert.equal(validateDegradedIndependentReviewAuthorization({ ...input, authorization: derivedAuthorization, reviewPackage: derived, strictResult: strict, derivedCorrection: true, correctionAttempts: 0, correctionEvidence: { ...correctionEvidence, ancestryVerified: false } }).issues[0].code, "degraded-independent-review-package-mismatch");
});
