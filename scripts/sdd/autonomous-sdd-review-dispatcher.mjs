import { validateReviewPackage } from "./independent-review-contract.mjs";
import { validateDegradedIndependentReviewAuthorization } from "./degraded-independent-review-authorization.mjs";
import { deliverStrictReviewArtifact, strictReviewDeliveryCodes, strictReviewTerminalKey } from "./autonomous-sdd-strict-review-delivery.mjs";
import { diagnosticFromCode, unavailableOutcome } from "./review-diagnostics.mjs";

const text = (value) => typeof value === "string" && value.trim().length > 0;
const hex64 = (value) => text(value) && /^[0-9a-f]{64}$/.test(value);
const freeze = (value) => Object.freeze(value);

const stage = "review-dispatch";
const operation = "dispatch-review";
const subject = "review-dispatcher";

// Stable terminal codes for the single-owner review dispatcher.
export const reviewDispatchCodes = freeze({
  requestInvalid: "review-dispatch-request-invalid",
  launchUnavailable: "review-dispatch-launch-unavailable",
  receiptInvalid: "review-dispatch-receipt-invalid",
  reviewerLost: "review-dispatch-reviewer-lost",
  degradedNotAuthorized: "review-dispatch-degraded-not-authorized",
  fallbackNotEligible: "review-dispatch-fallback-not-eligible",
  complete: "review-dispatch-complete",
});

// Adapter-produced typed inspection-capability/environment failures. Only these
// codes make the context-compatible fallback eligible; a transcript, findings,
// or repository text never does.
export const inspectionEnvironmentFailureCodes = freeze([
  "reviewer-inspection-executable-resolution-failed",
  "reviewer-inspection-toolchain-resolution-failed",
  "reviewer-inspection-permission-denied",
  "reviewer-inspection-runtime-event-failed",
]);

const isInspectionEnvironmentFailure = (code) => typeof code === "string" && inspectionEnvironmentFailureCodes.includes(code);

const unavailable = (code, safeMessage, additional = {}) => {
  const diagnostic = diagnosticFromCode({ stage, operation, code, subject, safeMessage });
  return freeze({ kind: "terminal", allowed: false, ...unavailableOutcome(diagnostic, additional) });
};

/**
 * Classify a strict-review terminal code into one typed disposition. The
 * classifier consumes only a typed code plus a boolean degraded-authorization
 * flag — never transcript text, stdout, or repository content.
 */
export function classifyReviewDispatch({ code, degradedAuthorizationValid = false } = {}) {
  if (code === strictReviewDeliveryCodes.complete) {
    return freeze({ kind: "complete", allowed: true, disposition: "terminal-evidence" });
  }
  if (code === strictReviewDeliveryCodes.timeout || code === strictReviewDeliveryCodes.crash) {
    return freeze({ kind: "paused", allowed: false, disposition: "resume", reason: "review-dispatch-reviewer-lost" });
  }
  if (isInspectionEnvironmentFailure(code) && degradedAuthorizationValid) {
    return freeze({ kind: "degraded-eligible", allowed: false, disposition: "degraded-fallback" });
  }
  return freeze({ kind: "terminal", allowed: false, disposition: "terminal-failure" });
}

/**
 * The single owner of review invocation. It launches the reviewer, consumes the
 * launch receipt, terminalizes the capture into one terminal record, and
 * classifies the outcome into exactly one typed disposition: terminal evidence,
 * an exact resume/pause on reviewer loss, or an allowed degraded fallback. It
 * never converts an unavailable strict result into success and never asks the
 * owner to relay commands.
 *
 * launch() -> { launchId, requestDigest, capture }
 */
export function dispatchReview({
  reviewPackage,
  configuredReviewer,
  implementerSession,
  launch,
  strictResult,
  selectedEntry,
  transition = "merge-pr",
  deliver = deliverStrictReviewArtifact,
  degradedAuthorization,
  runDegraded,
  now = new Date().toISOString(),
} = {}) {
  const packageCheck = validateReviewPackage(reviewPackage);
  if (!packageCheck.valid) {
    return unavailable(reviewDispatchCodes.requestInvalid, "The review dispatch request has an invalid sealed package.");
  }
  if (typeof launch !== "function") {
    return unavailable(reviewDispatchCodes.launchUnavailable, "The review launcher is unavailable.");
  }

  let launched;
  try {
    launched = launch({ reviewPackage, now });
  } catch {
    return unavailable(reviewDispatchCodes.launchUnavailable, "The review launcher failed before producing a receipt.");
  }
  const launchId = launched?.launchId;
  const requestDigest = launched?.requestDigest;
  if (!text(launchId) || !hex64(requestDigest)) {
    return unavailable(reviewDispatchCodes.receiptInvalid, "The review launch receipt is missing or malformed.");
  }

  const delivery = deliver({ launchId, requestDigest, reviewPackage, configuredReviewer, implementerSession, capture: launched.capture });
  if (delivery?.allowed === true) {
    return freeze({
      kind: "terminal",
      allowed: true,
      status: "complete",
      code: reviewDispatchCodes.complete,
      key: delivery.key,
      result: delivery.result,
      cleanup: delivery.cleanup,
    });
  }

  const code = text(delivery?.code) ? delivery.code : reviewDispatchCodes.launchUnavailable;
  const terminalKey = strictReviewTerminalKey({ launchId, requestDigest });

  const degradedCheck = degradedAuthorization
    ? validateDegradedIndependentReviewAuthorization({ authorization: degradedAuthorization, selectedEntry, transition, reviewPackage, strictResult, now })
    : null;
  const degradedValid = degradedCheck?.allowed === true;
  const classification = classifyReviewDispatch({ code, degradedAuthorizationValid: degradedValid });

  if (classification.kind === "paused") {
    return freeze({
      kind: "paused",
      allowed: false,
      code: reviewDispatchCodes.reviewerLost,
      disposition: "resume",
      reason: classification.reason,
      terminalKey,
      resume: freeze({ launchId, requestDigest }),
    });
  }

  if (classification.kind === "degraded-eligible") {
    if (typeof runDegraded !== "function") {
      return unavailable(reviewDispatchCodes.fallbackNotEligible, "The degraded fallback is not available.", { terminalKey });
    }
    const degraded = runDegraded({ reviewPackage, strictResult, degradedAuthorization: degradedCheck.authorization, now });
    if (degraded?.allowed === true) {
      return freeze({
        kind: "terminal",
        allowed: true,
        status: "degraded",
        code: reviewDispatchCodes.complete,
        assuranceLevel: "authorized-degraded",
        result: degraded.result,
        terminalKey,
      });
    }
    return unavailable(reviewDispatchCodes.fallbackNotEligible, "The degraded fallback did not produce a valid result.", { terminalKey });
  }

  return unavailable(code, "The strict review did not produce a usable result.", { terminalKey });
}

