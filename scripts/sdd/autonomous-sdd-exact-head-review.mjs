import crypto from "node:crypto";

import { validateReviewReuse } from "./autonomous-sdd-operation-contract.mjs";

const text = (value) => typeof value === "string" && value.trim().length > 0;
const digest = (value) => typeof value === "string" && /^[0-9a-f]{64}$/i.test(value);
const freeze = (value) => Object.freeze(value);
const assuranceLevels = new Set(["strict-isolated", "authorized-degraded"]);

// The canonical review-relevant invalidation set. Items 1-6 are the existing
// review-reuse contract; items 7-8 are added by M3-S3.
export const exactHeadReviewFields = freeze([
  "sealedPackageDigest",
  "headCommit",
  "artifactManifestDigest",
  "applyEvidenceDigest",
  "dispositionsDigest",
  "policyGateDigest",
  "reviewerIdentity",
  "assuranceLevel",
]);

const object = (value) => value !== null && typeof value === "object" && !Array.isArray(value);

/**
 * Compute the canonical exact-head review binding: one digest over the full
 * invalidation set. Returns null when any field is missing or malformed.
 */
export function exactHeadReviewBinding({
  sealedPackageDigest,
  headCommit,
  artifactManifestDigest,
  applyEvidenceDigest,
  dispositionsDigest,
  policyGateDigest,
  reviewerIdentity,
  assuranceLevel,
} = {}) {
  if (![sealedPackageDigest, artifactManifestDigest, applyEvidenceDigest, dispositionsDigest, policyGateDigest].every(digest) ||
      !text(headCommit) || !text(reviewerIdentity) || !assuranceLevels.has(assuranceLevel)) {
    return null;
  }
  const canonical = Object.fromEntries(Object.entries({
    sealedPackageDigest,
    headCommit,
    artifactManifestDigest,
    applyEvidenceDigest,
    dispositionsDigest,
    policyGateDigest,
    reviewerIdentity,
    assuranceLevel,
  }).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
  return crypto.createHash("sha256").update(JSON.stringify(canonical)).digest("hex");
}

/**
 * Decide whether a prior review may be reused for a later transition. Composes
 * the existing six-field validateReviewReuse with the two added fields and
 * returns one typed decision.
 *
 * previous/current shape: { sealedPackageDigest, headCommit,
 *   artifactManifestDigest, applyEvidenceDigest, dispositionsDigest,
 *   policyGateDigest, reviewerIdentity, assuranceLevel }
 */
export function reviewExactHeadReuse({ previous, current } = {}) {
  if (!object(previous) || !object(current)) {
    return freeze({ valid: false, reason: "exact-head-review-input-invalid" });
  }
  if (!text(previous.reviewerIdentity) || !text(current.reviewerIdentity) ||
      !assuranceLevels.has(previous.assuranceLevel) || !assuranceLevels.has(current.assuranceLevel)) {
    return freeze({ valid: false, reason: "exact-head-review-input-invalid" });
  }
  const base = validateReviewReuse({
    sealedPackageDigest: previous.sealedPackageDigest,
    currentSealedPackageDigest: current.sealedPackageDigest,
    reviewedHead: previous.headCommit,
    currentHead: current.headCommit,
    artifactManifestDigest: previous.artifactManifestDigest,
    currentArtifactManifestDigest: current.artifactManifestDigest,
    applyEvidenceDigest: previous.applyEvidenceDigest,
    currentApplyEvidenceDigest: current.applyEvidenceDigest,
    dispositionsDigest: previous.dispositionsDigest,
    currentDispositionsDigest: current.dispositionsDigest,
    policyGateDigest: previous.policyGateDigest,
    currentPolicyGateDigest: current.policyGateDigest,
  });
  if (!base.valid) return freeze({ valid: false, reason: base.reason });

  const invalidated = [];
  for (const field of ["sealedPackageDigest", "headCommit", "artifactManifestDigest", "applyEvidenceDigest", "dispositionsDigest", "policyGateDigest"]) {
    if (previous[field] !== current[field]) invalidated.push(field);
  }
  if (previous.reviewerIdentity !== current.reviewerIdentity) invalidated.push("reviewerIdentity");
  if (previous.assuranceLevel !== current.assuranceLevel) invalidated.push("assuranceLevel");

  if (invalidated.length > 0) {
    return freeze({ valid: true, reusable: false, reason: "exact-head-review-invalidated", invalidated: freeze([...invalidated]) });
  }
  return freeze({ valid: true, reusable: true });
}

/**
 * The correction-to-rereview rule: an objective correction changes the head, so
 * it invalidates the prior review and requires a fresh exact-head rereview, but
 * only within the existing per-signature correction budget. An exhausted
 * signature blocks rather than resetting.
 */
export function correctionRequiresRereview({ headChanged = false, attempts = 0, budget = 3 } = {}) {
  if (!Number.isInteger(attempts) || attempts < 0 || !Number.isInteger(budget) || budget < 0) {
    return freeze({ valid: false, reason: "correction-rereview-input-invalid" });
  }
  if (!headChanged) {
    return freeze({ valid: true, rereviewRequired: false, reason: "head-unchanged" });
  }
  if (attempts >= budget) {
    return freeze({ valid: true, rereviewRequired: false, blocked: true, reason: "correction-budget-exhausted" });
  }
  return freeze({ valid: true, rereviewRequired: true, reason: "correction-changed-head" });
}
