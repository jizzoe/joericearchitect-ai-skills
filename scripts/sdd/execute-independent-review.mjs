import { validateReviewPackage, validateReviewResult } from "./independent-review-contract.mjs";
import { degradedAuthorizationMatchesResult, strictSummaryMatchesResult } from "./independent-review.mjs";
import { validateReviewAdapterCapabilities } from "./review-adapter-contract.mjs";
import { validateDegradedIndependentReviewAuthorization } from "./degraded-independent-review-authorization.mjs";
import { executeReviewLauncherRecovery, recoverableReviewLauncherFailure } from "./review-launcher-recovery.mjs";
import { diagnosticFromCode, diagnosticFromError, preservedDiagnostic, unavailableOutcome } from "./review-diagnostics.mjs";
import { selectReviewAdapterImplementation, validateReviewAdapterDispatchBinding } from "./review-adapter-dispatch.mjs";

function unavailable(stage, operation, code, subject, safeMessage, additional = {}, preserveChild = true) {
  const diagnostic = (preserveChild ? preservedDiagnostic(additional) : null) ?? diagnosticFromCode({ stage, operation, code, subject, safeMessage });
  return unavailableOutcome(diagnostic, additional);
}

export function probeIndependentReviewAdapter(adapter) {
  const result = validateReviewAdapterCapabilities(adapter);
  return result.valid ? { available: true, code: result.code } : {
    available: false,
    ...unavailable("adapter-preflight", "validate-review-adapter", result.code, "review-adapter", "The configured independent-review adapter does not meet the required boundary.")
  };
}

export async function executeIndependentReview({ package: reviewPackage, configurationSnapshot, adapterImplementations, configuredReviewer, implementerSession }) {
  const packageValidation = validateReviewPackage(reviewPackage);
  if (!packageValidation.valid) return unavailable("package-validation", "validate-review-package", packageValidation.issues[0].code, "sealed-review-package", "The independent-review package failed validation.");
  const selected = selectReviewAdapterImplementation({ configurationSnapshot, implementations: adapterImplementations, phase: "strict" });
  if (!selected.valid) return unavailable("adapter-dispatch", "select-review-adapter", selected.code, "review-adapter", "The durable review-adapter selection cannot be dispatched.");
  const bindingCheck = validateReviewAdapterDispatchBinding({ configurationSnapshot, binding: selected.binding, reviewer: configuredReviewer });
  if (!bindingCheck.valid) return unavailable("adapter-dispatch", "bind-review-adapter", bindingCheck.code, "review-adapter", "The configured reviewer does not match the durable review-adapter selection.");
  const probe = probeIndependentReviewAdapter(selected.implementation.strictCapabilities);
  if (!probe.available) return unavailable("adapter-preflight", "validate-review-adapter", probe.code, "review-adapter", "The configured independent-review adapter is unavailable.", probe);
  let invoked;
  try {
    invoked = await selected.operation(Object.freeze(structuredClone(reviewPackage)));
  } catch (error) {
    const diagnostic = diagnosticFromError({ stage: "reviewer-invocation", operation: "invoke-independent-reviewer", code: "independent-reviewer-invocation-failed", subject: "reviewer-invocation", safeMessage: "The independent reviewer invocation failed before producing a result.", error });
    return unavailableOutcome(diagnostic);
  }
  const result = invoked?.result ?? invoked;
  if (!invoked?.runtimeReceipt) return unavailable("adapter-dispatch", "accept-review-runtime-receipt", "review-adapter-runtime-receipt-mismatch", "review-adapter", "The review runtime receipt is missing from the durable adapter dispatch.");
  const completionBinding = validateReviewAdapterDispatchBinding({
    configurationSnapshot,
    binding: selected.binding,
    reviewer: configuredReviewer,
    runtimeReceipt: invoked.runtimeReceipt,
    result
  });
  if (!completionBinding.valid) return unavailable("adapter-dispatch", "accept-review-adapter-result", completionBinding.code, "review-adapter", "The review result does not match the durable review-adapter selection.");
  const resultValidation = validateReviewResult(result, { expectedPackage: reviewPackage, configuredReviewer, implementerSession });
  return resultValidation.valid
    ? { status: result.status, result, ...(invoked?.runtimeReceipt ? { runtimeReceipt: invoked.runtimeReceipt } : {}), ...(preservedDiagnostic(invoked) ? { diagnostic: invoked.diagnostic } : {}) }
    : unavailable("result-validation", "validate-review-result", resultValidation.issues[0].code, "reviewer-result", "The independent reviewer result failed validation.", invoked);
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
    reviewer: { type: configuredReviewer?.type ?? "strict", identity: configuredReviewer?.identity ?? "strict-reviewer", adapter: configuredReviewer?.adapter ?? configuredReviewer?.type ?? "strict" },
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
export async function executeAuthorizedIndependentReview({ package: reviewPackage, configurationSnapshot, adapterImplementations, configuredReviewer, degradedReviewer, implementerSession, authorization, selectedEntry, transition = "merge-pr", durableStrictUnavailable, correctionAttempts = 0, derivedCorrection = false, correctionEvidence, launcherRecovery, invokePreparedReviewHost, now, clock = () => new Date().toISOString() } = {}) {
  const strictBinding = validateReviewAdapterDispatchBinding({ configurationSnapshot, reviewer: configuredReviewer });
  if (!strictBinding.valid) return unavailable("adapter-dispatch", "bind-strict-reviewer", strictBinding.code, "review-adapter", "The strict reviewer does not match the durable review-adapter selection.");
  const degradedBinding = validateReviewAdapterDispatchBinding({ configurationSnapshot, reviewer: degradedReviewer });
  if (!degradedBinding.valid) return unavailable("adapter-dispatch", "bind-degraded-reviewer", degradedBinding.code, "review-adapter", "The degraded reviewer does not match the durable review-adapter selection.");
  const durable = validatedDurableStrictUnavailable(durableStrictUnavailable, reviewPackage, configuredReviewer, implementerSession);
  const strict = durable
    ? { status: "unavailable", result: durable }
    : await executeIndependentReview({ package: reviewPackage, configurationSnapshot, adapterImplementations, configuredReviewer, implementerSession });
  if (strict.status !== "unavailable") return { ...strict, assuranceLevel: "strict-isolated" };
  const candidate = strict.result ?? strictUnavailableResult({
    reviewPackage,
    configuredReviewer,
    code: strict.code ?? "independent-reviewer-unavailable",
    occurredAt: clock()
  });
  if (!durable) {
    return unavailable("strict-evidence", "persist-strict-unavailable", "strict-unavailable-evidence-not-durable", "strict-review-result", "The strict reviewer unavailability must be durably recorded before fallback.", { strictResult: candidate, requiresPersistence: true, ...(strict.diagnostic ? { strictDiagnostic: strict.diagnostic } : {}) }, false);
  }
  const strictResult = durable;
  const authorizationCheck = validateDegradedIndependentReviewAuthorization({ authorization, selectedEntry, transition, reviewPackage, strictResult, correctionAttempts, derivedCorrection, correctionEvidence, now });
  if (!authorizationCheck.allowed) return unavailable("recovery-authorization", "authorize-degraded-review", authorizationCheck.issues[0].code, "degraded-review-authorization", "The degraded reviewer authorization is not valid.", { strictResult });
  if (recoverableReviewLauncherFailure(strictResult.unavailableCode) && !launcherRecovery) {
    return unavailable("recovery-transport", "launch-external-reviewer", "review-launcher-runtime-transport-unavailable", "review-launcher", "The required external reviewer transport is unavailable.", {
      terminal: true,
      manualFallback: false,
      strictResult
    });
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
      configurationSnapshot,
      now
    }, { invokePreparedReviewHost, now: clock });
    return recovered.allowed
      ? { status: recovered.status, result: recovered.result, strictResult, assuranceLevel: "authorized-degraded", launcherEvidence: recovered.launcherEvidence, runtimeReceipt: recovered.runtimeReceipt }
      : { ...recovered, strictResult };
  }
  const selectedDegraded = selectReviewAdapterImplementation({ configurationSnapshot, implementations: adapterImplementations, phase: "authorized-degraded" });
  if (!selectedDegraded.valid) return unavailable("adapter-dispatch", "select-degraded-review-adapter", selectedDegraded.code, "review-adapter", "The durable degraded review-adapter selection cannot be dispatched.", { strictResult });
  const probe = probeDegradedIndependentReviewAdapter(selectedDegraded.implementation.degradedCapabilities);
  if (!probe.available) return unavailable("adapter-preflight", "prepare-degraded-reviewer", probe.code, "degraded-reviewer", "The authorized degraded reviewer is unavailable.", { strictResult });
  let result;
  let runtimeReceipt;
  try {
    const invoked = await selectedDegraded.operation(Object.freeze(structuredClone(reviewPackage)));
    result = invoked?.result ?? invoked;
    runtimeReceipt = invoked?.runtimeReceipt;
  } catch (error) {
    const diagnostic = diagnosticFromError({ stage: "reviewer-invocation", operation: "invoke-degraded-reviewer", code: "degraded-independent-reviewer-invocation-failed", subject: "degraded-reviewer", safeMessage: "The authorized degraded reviewer invocation failed before producing a result.", error });
    return unavailableOutcome(diagnostic, { strictResult });
  }
  const completionAuthorizationCheck = validateDegradedIndependentReviewAuthorization({ authorization, selectedEntry, transition, reviewPackage, strictResult, correctionAttempts, derivedCorrection, correctionEvidence, now: clock() });
  if (!completionAuthorizationCheck.allowed) return unavailable("recovery-authorization", "authorize-degraded-review", completionAuthorizationCheck.issues[0].code, "degraded-review-authorization", "The degraded reviewer authorization expired or became invalid.", { strictResult });
  if (!runtimeReceipt) return unavailable("adapter-dispatch", "accept-degraded-runtime-receipt", "review-adapter-runtime-receipt-mismatch", "review-adapter", "The degraded review runtime receipt is missing from the durable adapter dispatch.", { strictResult });
  const validation = validateReviewResult(result, { expectedPackage: reviewPackage, configuredReviewer: degradedReviewer, implementerSession });
  const resultBinding = validateReviewAdapterDispatchBinding({ configurationSnapshot, binding: selectedDegraded.binding, reviewer: degradedReviewer, runtimeReceipt, result });
  if (!resultBinding.valid) return unavailable("adapter-dispatch", "accept-degraded-review-result", resultBinding.code, "review-adapter", "The degraded result does not match the durable review-adapter selection.", { strictResult });
  if (!validation.valid || result.assuranceLevel !== "authorized-degraded") return unavailable("result-validation", "validate-degraded-review-result", validation.valid ? "degraded-independent-reviewer-assurance-invalid" : validation.issues[0].code, "degraded-review-result", "The degraded reviewer result failed validation.", { strictResult });
  if (!strictSummaryMatchesResult(result.strictUnavailable, strictResult)) {
    return unavailable("strict-evidence", "verify-strict-unavailable", "independent-review-strict-unavailable-not-durable", "strict-review-result", "The degraded result does not preserve the durable strict-review evidence.", { strictResult });
  }
  if (!degradedAuthorizationMatchesResult(result.degradedAuthorization, completionAuthorizationCheck.authorization)) {
    return unavailable("recovery-authorization", "verify-degraded-authorization", "independent-review-degraded-authorization-mismatch", "degraded-review-authorization", "The degraded result does not match its authorization.", { strictResult });
  }
  return { status: result.status, result, strictResult, assuranceLevel: "authorized-degraded", runtimeReceipt };
}
