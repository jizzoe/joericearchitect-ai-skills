import { inspectCorrectionChain } from "./correction-chain.mjs";

const commit = (value) => typeof value === "string" && /^[0-9a-f]{40}$/.test(value);
const text = (value) => typeof value === "string" && value.trim().length > 0;
const fail = (code) => ({ allowed: false, classification: "paused", issues: [{ code }] });

/**
 * Evaluates the explicit, disabled-by-default fallback authorization. This
 * module receives durable evidence only; it never infers permission from an
 * adapter, environment, feature flag, or unavailable outcome.
 */
function validCorrectionChain(records, record, authorizationRecord, selectedEntry, reviewPackage, correctionAttempts) {
  if (!Array.isArray(records) || records.length === 0 || !record ||
      JSON.stringify(records.at(-1)) !== JSON.stringify(record)) return false;
  const chain = inspectCorrectionChain(records, {
    selectedEntry,
    anchor: { baseCommit: reviewPackage.baseCommit, headCommit: authorizationRecord.headCommit, manifestDigest: authorizationRecord.manifestDigest }
  });
  if (!chain.valid) return false;
  return records.length === correctionAttempts && record.attempt === correctionAttempts &&
    correctionAttempts > 0 &&
    chain.headCommit === reviewPackage.headCommit && chain.manifestDigest === reviewPackage.manifestDigest;
}

export function validateDegradedIndependentReviewAuthorization({ authorization, selectedEntry, transition, reviewPackage, strictResult, correctionAttempts = 0, derivedCorrection = false, correctionEvidence, now = new Date().toISOString() } = {}) {
  const record = authorization?.degradedIndependentReview;
  if (!record || record.enabled !== true) return fail("degraded-independent-review-not-authorized");
  if (!text(selectedEntry) || record.change !== selectedEntry) return fail("degraded-independent-review-change-mismatch");
  if (transition !== "merge-pr" || !Array.isArray(record.transitions) || !record.transitions.includes(transition)) return fail("degraded-independent-review-transition-mismatch");
  if (record.fallbackBoundary !== "fresh-separated-reviewer-only" || !text(record.riskReason)) return fail("degraded-independent-review-authorization-malformed");
  const expiresAt = Date.parse(record.expiresAt);
  const currentTime = Date.parse(now);
  if (Number.isNaN(expiresAt) || Number.isNaN(currentTime) || expiresAt <= currentTime) return fail("degraded-independent-review-authorization-expired");
  if (!reviewPackage || !commit(reviewPackage.baseCommit) || !commit(reviewPackage.headCommit) || !text(reviewPackage.manifestDigest)) return fail("degraded-independent-review-package-invalid");
  if (!strictResult || strictResult.status !== "unavailable" || !text(strictResult.unavailableCode) || strictResult.baseCommit !== reviewPackage.baseCommit || strictResult.headCommit !== reviewPackage.headCommit || strictResult.manifestDigest !== reviewPackage.manifestDigest) return fail("degraded-independent-review-strict-unavailable-missing");
  const exact = record.baseCommit === reviewPackage.baseCommit && record.headCommit === reviewPackage.headCommit && record.manifestDigest === reviewPackage.manifestDigest;
  if (!exact) {
    if (record.allowDerivedObjectiveCorrections !== true || derivedCorrection !== true ||
        !validCorrectionChain(record.derivedCorrections, correctionEvidence, record, selectedEntry, reviewPackage, correctionAttempts)) {
      return fail("degraded-independent-review-package-mismatch");
    }
  }
  return { allowed: true, classification: "authorized", issues: [], authorization: { change: record.change, transition, expiresAt: record.expiresAt, riskReason: record.riskReason, fallbackBoundary: record.fallbackBoundary } };
}
