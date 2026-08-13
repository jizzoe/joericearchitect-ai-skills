import { validateReviewPackage, validateReviewResult } from "./independent-review-contract.mjs";
import { validateReviewAdapterCapabilities } from "./review-adapter-contract.mjs";
import { validateDegradedIndependentReviewAuthorization } from "./degraded-independent-review-authorization.mjs";

export function probeIndependentReviewAdapter(adapter) {
  const result = validateReviewAdapterCapabilities(adapter);
  return result.valid ? { available: true, code: result.code } : { available: false, code: result.code };
}

export async function executeIndependentReview({ package: reviewPackage, adapter, configuredReviewer, implementerSession, invoke }) {
  const packageValidation = validateReviewPackage(reviewPackage);
  if (!packageValidation.valid) return { status: "unavailable", code: packageValidation.issues[0].code };
  const probe = probeIndependentReviewAdapter(adapter);
  if (!probe.available) return { status: "unavailable", code: probe.code };
  if (typeof invoke !== "function") return { status: "unavailable", code: "independent-reviewer-invocation-unavailable" };
  const result = await invoke(Object.freeze(structuredClone(reviewPackage)));
  const resultValidation = validateReviewResult(result, { expectedPackage: reviewPackage, configuredReviewer, implementerSession });
  return resultValidation.valid ? { status: result.status, result } : { status: "unavailable", code: resultValidation.issues[0].code };
}

export function probeDegradedIndependentReviewAdapter(adapter) {
  if (!adapter || adapter.freshContext !== true || adapter.nonInteractive !== true || adapter.detachedView !== true ||
      adapter.sealedPackageOnly !== true || adapter.disabledMutationTools !== true || adapter.credentialScrubbed !== true) {
    return { available: false, code: "degraded-independent-reviewer-boundary-unavailable" };
  }
  return { available: true, code: "degraded-independent-reviewer-ready" };
}

function strictUnavailableResult({ reviewPackage, configuredReviewer, code }) {
  return {
    schemaVersion: 1,
    reviewRecordId: `strict-unavailable-${reviewPackage.manifestDigest.slice(0, 12)}`,
    executionId: `strict-unavailable-${reviewPackage.headCommit.slice(0, 12)}`,
    reviewer: { type: configuredReviewer?.type ?? "strict", identity: configuredReviewer?.identity ?? "strict-reviewer", adapter: configuredReviewer?.type ?? "strict" },
    attestation: { ref: configuredReviewer?.attestation?.ref ?? "strict-unavailable", nonInteractive: false, isolatedContext: false, freshContext: false, readOnly: false },
    assuranceLevel: "strict-isolated",
    baseCommit: reviewPackage.baseCommit, headCommit: reviewPackage.headCommit, manifestDigest: reviewPackage.manifestDigest,
    startedAt: new Date(0).toISOString(), completedAt: new Date(0).toISOString(), findings: [], status: "unavailable", unavailableCode: code
  };
}

function durableStrictUnavailableMatches(record, candidate, reviewPackage) {
  const value = record?.result;
  return typeof record?.reference === "string" && record.reference.length > 0 && record.current === true &&
    value?.status === "unavailable" && value.unavailableCode === candidate.unavailableCode &&
    value.baseCommit === reviewPackage.baseCommit && value.headCommit === reviewPackage.headCommit &&
    value.manifestDigest === reviewPackage.manifestDigest && typeof value.reviewRecordId === "string" &&
    value.reviewRecordId.length > 0 && typeof value.executionId === "string" && value.executionId.length > 0;
}

/** Strict is always attempted first. Degraded review is an explicit second
 * transport and receives only an immutable copy of the sealed package. */
export async function executeAuthorizedIndependentReview({ package: reviewPackage, strictAdapter, degradedAdapter, configuredReviewer, degradedReviewer, implementerSession, authorization, selectedEntry, transition = "merge-pr", invokeStrict, invokeDegraded, durableStrictUnavailable, correctionAttempts = 0, derivedCorrection = false, correctionEvidence, now } = {}) {
  const strict = await executeIndependentReview({ package: reviewPackage, adapter: strictAdapter, configuredReviewer, implementerSession, invoke: invokeStrict });
  if (strict.status !== "unavailable") return { ...strict, assuranceLevel: "strict-isolated" };
  const candidate = strict.result ?? strictUnavailableResult({ reviewPackage, configuredReviewer, code: strict.code ?? "independent-reviewer-unavailable" });
  if (!durableStrictUnavailableMatches(durableStrictUnavailable, candidate, reviewPackage)) {
    return { status: "unavailable", code: "strict-unavailable-evidence-not-durable", strictResult: candidate, requiresPersistence: true };
  }
  const strictResult = durableStrictUnavailable.result;
  const authorizationCheck = validateDegradedIndependentReviewAuthorization({ authorization, selectedEntry, transition, reviewPackage, strictResult, correctionAttempts, derivedCorrection, correctionEvidence, now });
  if (!authorizationCheck.allowed) return { status: "unavailable", code: authorizationCheck.issues[0].code, strictResult };
  const probe = probeDegradedIndependentReviewAdapter(degradedAdapter);
  if (!probe.available || typeof invokeDegraded !== "function") return { status: "unavailable", code: probe.available ? "degraded-independent-reviewer-invocation-unavailable" : probe.code, strictResult };
  const result = await invokeDegraded(Object.freeze(structuredClone(reviewPackage)));
  const validation = validateReviewResult(result, { expectedPackage: reviewPackage, configuredReviewer: degradedReviewer, implementerSession });
  if (!validation.valid || result.assuranceLevel !== "authorized-degraded") return { status: "unavailable", code: validation.valid ? "degraded-independent-reviewer-assurance-invalid" : validation.issues[0].code, strictResult };
  return { status: result.status, result, strictResult, assuranceLevel: "authorized-degraded" };
}
