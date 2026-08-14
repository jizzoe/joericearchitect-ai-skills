import assert from "node:assert/strict";
import test from "node:test";
import { validateDegradedIndependentReviewAuthorization } from "../degraded-independent-review-authorization.mjs";

const baseCommit = "a".repeat(40);
const headCommit = "b".repeat(40);
const manifestDigest = "c".repeat(64);
const reviewPackage = { baseCommit, headCommit, manifestDigest };
const strictResult = { status: "unavailable", unavailableCode: "strict-runtime-unavailable", baseCommit, headCommit, manifestDigest };
const authorization = { expiresAt: "2026-08-14T00:00:00.000Z", degradedIndependentReview: { enabled: true, change: "add-authorized-degraded-independent-review", transitions: ["merge-pr"], expiresAt: "2026-08-14T00:00:00.000Z", riskReason: "Bootstrap exception for exact delivery", fallbackBoundary: "fresh-separated-reviewer-only", baseCommit, headCommit, manifestDigest, allowDerivedObjectiveCorrections: true } };
const input = { authorization, selectedEntry: "add-authorized-degraded-independent-review", transition: "merge-pr", reviewPackage, strictResult, now: "2026-08-13T00:00:00.000Z" };
const source = (findingId, reviewRecordId = `review-${findingId}`) => ({ kind: "independent-review", reviewRecordId, findingId, severity: "high", evidence: "scripts/sdd/degraded-independent-review-authorization.mjs", transition: "merge-pr" });
const signature = (item) => `independent-review/${item.findingId}/${item.evidence}/${item.transition}`;

test("degraded authorization is explicit, strict-first, exact, and expiring", () => {
  assert.equal(validateDegradedIndependentReviewAuthorization(input).allowed, true);
  assert.equal(validateDegradedIndependentReviewAuthorization({ ...input, authorization: {} }).issues[0].code, "degraded-independent-review-not-authorized");
  assert.equal(validateDegradedIndependentReviewAuthorization({ ...input, strictResult: { ...strictResult, status: "passed" } }).issues[0].code, "degraded-independent-review-strict-unavailable-missing");
  assert.equal(validateDegradedIndependentReviewAuthorization({ ...input, transition: "archive-change" }).issues[0].code, "degraded-independent-review-transition-mismatch");
  assert.equal(validateDegradedIndependentReviewAuthorization({ ...input, now: "2026-08-15T00:00:00.000Z" }).issues[0].code, "degraded-independent-review-authorization-expired");
  assert.equal(validateDegradedIndependentReviewAuthorization({ ...input, now: "not-a-time" }).issues[0].code, "degraded-independent-review-authorization-expired");
  assert.equal(validateDegradedIndependentReviewAuthorization({ ...input, authorization: { ...authorization, expiresAt: "2026-08-13T23:59:59.000Z" } }).issues[0].code, "degraded-independent-review-expiration-exceeds-goal");
  assert.equal(validateDegradedIndependentReviewAuthorization({ ...input, authorization: { ...authorization, expiresAt: undefined } }).issues[0].code, "degraded-independent-review-expiration-exceeds-goal");
  assert.equal(validateDegradedIndependentReviewAuthorization({ ...input, reviewPackage: { ...reviewPackage, headCommit: "d".repeat(40) } }).issues[0].code, "degraded-independent-review-strict-unavailable-missing");
});

test("derived packages are limited to an evidenced corrective envelope", () => {
  const derived = { ...reviewPackage, headCommit: "d".repeat(40), manifestDigest: "e".repeat(64) };
  const strict = { ...strictResult, headCommit: derived.headCommit, manifestDigest: derived.manifestDigest };
  const failureSource = source("fixture-failure");
  const correctionEvidence = { id: "correction-1", change: "add-authorized-degraded-independent-review", attempt: 1, failureSource, failureSignature: signature(failureSource), classification: "objective-fix", behaviorPreserving: true, current: true, ancestryVerified: true, evidenceReference: "checkpoint:correction-1", baseCommit, previousHead: headCommit, previousManifestDigest: manifestDigest, headCommit: derived.headCommit, manifestDigest: derived.manifestDigest };
  const derivedAuthorization = { ...authorization, degradedIndependentReview: { ...authorization.degradedIndependentReview, derivedCorrections: [correctionEvidence] } };
  assert.equal(validateDegradedIndependentReviewAuthorization({ ...input, authorization: derivedAuthorization, reviewPackage: derived, strictResult: strict, derivedCorrection: true, correctionAttempts: 1, correctionEvidence }).allowed, true);
  assert.equal(validateDegradedIndependentReviewAuthorization({ ...input, authorization: derivedAuthorization, reviewPackage: derived, strictResult: strict, derivedCorrection: true, correctionAttempts: 0, correctionEvidence }).issues[0].code, "degraded-independent-review-package-mismatch");
  assert.equal(validateDegradedIndependentReviewAuthorization({ ...input, authorization: derivedAuthorization, reviewPackage: derived, strictResult: strict, derivedCorrection: true, correctionAttempts: 1, correctionEvidence: { ...correctionEvidence, ancestryVerified: false } }).issues[0].code, "degraded-independent-review-package-mismatch");
});

test("derived correction chains enforce three attempts per failure signature rather than three total", () => {
  const makeChain = (signatures) => {
    let previousHead = headCommit;
    let previousManifestDigest = manifestDigest;
    return signatures.map((findingId, index) => {
      const failureSource = source(findingId, `review-${index + 1}`);
      const item = {
        id: `correction-${index + 1}`,
        change: input.selectedEntry,
        attempt: index + 1,
        failureSource,
        failureSignature: signature(failureSource),
        classification: "objective-fix",
        behaviorPreserving: true,
        current: true,
        ancestryVerified: true,
        evidenceReference: `checkpoint:correction-${index + 1}`,
        baseCommit,
        previousHead,
        previousManifestDigest,
        headCommit: String(index + 1).repeat(40),
        manifestDigest: String(index + 1).repeat(64)
      };
      previousHead = item.headCommit;
      previousManifestDigest = item.manifestDigest;
      return item;
    });
  };
  const evaluate = (chain) => {
    const latest = chain.at(-1);
    const derived = { ...reviewPackage, headCommit: latest.headCommit, manifestDigest: latest.manifestDigest };
    const strict = { ...strictResult, headCommit: latest.headCommit, manifestDigest: latest.manifestDigest };
    const derivedAuthorization = { ...authorization, degradedIndependentReview: { ...authorization.degradedIndependentReview, derivedCorrections: chain } };
    return validateDegradedIndependentReviewAuthorization({ ...input, authorization: derivedAuthorization, reviewPackage: derived, strictResult: strict, derivedCorrection: true, correctionAttempts: chain.length, correctionEvidence: latest });
  };
  assert.equal(evaluate(makeChain(["signature-a", "signature-b", "signature-c", "signature-d"])).allowed, true);
  assert.equal(evaluate(makeChain(["same-signature", "same-signature", "same-signature", "same-signature"])).issues[0].code, "degraded-independent-review-package-mismatch");
});
