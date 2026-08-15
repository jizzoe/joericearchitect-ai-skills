import { validateReviewPackage, validateReviewResult } from "./independent-review-contract.mjs";
import { degradedAuthorizationMatchesResult, strictSummaryMatchesResult } from "./independent-review.mjs";
import { validateReviewAdapterCapabilities } from "./review-adapter-contract.mjs";
import { validateDegradedIndependentReviewAuthorization } from "./degraded-independent-review-authorization.mjs";
import { executeReviewLauncherRecovery, recoverableReviewLauncherFailure } from "./review-launcher-recovery.mjs";

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
  const invoked = await invoke(Object.freeze(structuredClone(reviewPackage)));
  const result = invoked?.result ?? invoked;
  const resultValidation = validateReviewResult(result, { expectedPackage: reviewPackage, configuredReviewer, implementerSession });
  return resultValidation.valid
    ? { status: result.status, result, ...(invoked?.diagnostic ? { diagnostic: invoked.diagnostic } : {}) }
    : { status: "unavailable", code: resultValidation.issues[0].code };
}

export function probeDegradedIndependentReviewAdapter(adapter) {
  if (!adapter || adapter.freshContext !== true || adapter.nonInteractive !== true || adapter.detachedView !== true ||
      adapter.sealedPackageOnly !== true || adapter.disabledMutationTools !== true || adapter.credentialScrubbed !== true) {
    return { available: false, code: "degraded-independent-reviewer-boundary-unavailable" };
  }
  return { available: true, code: "degraded-independent-reviewer-ready" };
}

function strictUnavailableResult({ reviewPackage, configuredReviewer, code, occurredAt }) {
  return {
    schemaVersion: 1,
    reviewRecordId: `strict-unavailable-${reviewPackage.manifestDigest.slice(0, 12)}`,
    executionId: `strict-unavailable-${reviewPackage.headCommit.slice(0, 12)}`,
    reviewer: { type: configuredReviewer?.type ?? "strict", identity: configuredReviewer?.identity ?? "strict-reviewer", adapter: configuredReviewer?.type ?? "strict" },
    attestation: { ref: configuredReviewer?.attestation?.ref ?? "strict-unavailable", nonInteractive: false, isolatedContext: false, freshContext: false, readOnly: false },
    assuranceLevel: "strict-isolated",
    baseCommit: reviewPackage.baseCommit, headCommit: reviewPackage.headCommit, manifestDigest: reviewPackage.manifestDigest,
    startedAt: occurredAt, completedAt: occurredAt, findings: [], status: "unavailable", unavailableCode: code
  };
}

function validatedDurableStrictUnavailable(record, reviewPackage, configuredReviewer, implementerSession) {
  const value = record?.result;
  if (typeof record?.reference !== "string" || record.reference.length === 0 || record.current !== true) return null;
  const validation = validateReviewResult(value, { expectedPackage: reviewPackage, configuredReviewer, implementerSession });
  const expectedAdapter = configuredReviewer?.adapter ?? configuredReviewer?.type;
  return validation.valid && value.status === "unavailable" && value.assuranceLevel === "strict-isolated" &&
    value.reviewer.adapter === expectedAdapter ? value : null;
}

/** Strict is always attempted first. Degraded review is an explicit second
 * transport and receives only an immutable copy of the sealed package. */
export async function executeAuthorizedIndependentReview({ package: reviewPackage, strictAdapter, degradedAdapter, configuredReviewer, degradedReviewer, implementerSession, authorization, selectedEntry, transition = "merge-pr", invokeStrict, invokeDegraded, durableStrictUnavailable, correctionAttempts = 0, derivedCorrection = false, correctionEvidence, launcherRecovery, invokePreparedReviewHost, now, clock = () => new Date().toISOString() } = {}) {
  const durable = validatedDurableStrictUnavailable(durableStrictUnavailable, reviewPackage, configuredReviewer, implementerSession);
  const strict = durable
    ? { status: "unavailable", result: durable }
    : await executeIndependentReview({ package: reviewPackage, adapter: strictAdapter, configuredReviewer, implementerSession, invoke: invokeStrict });
  if (strict.status !== "unavailable") return { ...strict, assuranceLevel: "strict-isolated" };
  const candidate = strict.result ?? strictUnavailableResult({
    reviewPackage,
    configuredReviewer,
    code: strict.code ?? "independent-reviewer-unavailable",
    occurredAt: clock()
  });
  if (!durable) {
    return { status: "unavailable", code: "strict-unavailable-evidence-not-durable", strictResult: candidate, requiresPersistence: true, ...(strict.diagnostic ? { diagnostic: strict.diagnostic } : {}) };
  }
  const strictResult = durable;
  const authorizationCheck = validateDegradedIndependentReviewAuthorization({ authorization, selectedEntry, transition, reviewPackage, strictResult, correctionAttempts, derivedCorrection, correctionEvidence, now });
  if (!authorizationCheck.allowed) return { status: "unavailable", code: authorizationCheck.issues[0].code, strictResult };
  if (recoverableReviewLauncherFailure(strictResult.unavailableCode) && !launcherRecovery) {
    return {
      status: "unavailable",
      code: "review-launcher-runtime-transport-unavailable",
      terminal: true,
      manualFallback: false,
      strictResult
    };
  }
  if (recoverableReviewLauncherFailure(strictResult.unavailableCode) && launcherRecovery) {
    const recovered = await executeReviewLauncherRecovery({
      ...launcherRecovery,
      failureCode: strictResult.unavailableCode,
      authorization,
      selectedEntry,
      transition,
      reviewPackage,
      strictResult,
      reviewer: degradedReviewer,
      correctionAttempts,
      derivedCorrection,
      correctionEvidence,
      now
    }, { invokePreparedReviewHost, now: clock });
    return recovered.allowed
      ? { status: recovered.status, result: recovered.result, strictResult, assuranceLevel: "authorized-degraded", launcherEvidence: recovered.launcherEvidence, runtimeReceipt: recovered.runtimeReceipt }
      : { ...recovered, strictResult };
  }
  const probe = probeDegradedIndependentReviewAdapter(degradedAdapter);
  if (!probe.available || typeof invokeDegraded !== "function") return { status: "unavailable", code: probe.available ? "degraded-independent-reviewer-invocation-unavailable" : probe.code, strictResult };
  const result = await invokeDegraded(Object.freeze(structuredClone(reviewPackage)));
  const completionAuthorizationCheck = validateDegradedIndependentReviewAuthorization({ authorization, selectedEntry, transition, reviewPackage, strictResult, correctionAttempts, derivedCorrection, correctionEvidence, now: clock() });
  if (!completionAuthorizationCheck.allowed) return { status: "unavailable", code: completionAuthorizationCheck.issues[0].code, strictResult };
  const validation = validateReviewResult(result, { expectedPackage: reviewPackage, configuredReviewer: degradedReviewer, implementerSession });
  if (!validation.valid || result.assuranceLevel !== "authorized-degraded") return { status: "unavailable", code: validation.valid ? "degraded-independent-reviewer-assurance-invalid" : validation.issues[0].code, strictResult };
  if (!strictSummaryMatchesResult(result.strictUnavailable, strictResult)) {
    return { status: "unavailable", code: "independent-review-strict-unavailable-not-durable", strictResult };
  }
  if (!degradedAuthorizationMatchesResult(result.degradedAuthorization, completionAuthorizationCheck.authorization)) {
    return { status: "unavailable", code: "independent-review-degraded-authorization-mismatch", strictResult };
  }
  return { status: result.status, result, strictResult, assuranceLevel: "authorized-degraded" };
}
