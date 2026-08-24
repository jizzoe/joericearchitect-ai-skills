import { createHash } from "node:crypto";

import { canonicalJson, validateReviewPackage, validateReviewResult } from "./independent-review-contract.mjs";
import { diagnosticFromCode, unavailableOutcome } from "./review-diagnostics.mjs";

const text = (value) => typeof value === "string" && value.trim().length > 0;
const hex64 = (value) => text(value) && /^[0-9a-f]{64}$/.test(value);
const freeze = (value) => Object.freeze(value);

const stage = "strict-review-delivery";
const operation = "terminalize-strict-review";
const subject = "strict-review-artifact";

// Stable terminal codes for the strict-review artifact-delivery contract. The
// code, not a free-form message, is the machine-comparable outcome.
export const strictReviewDeliveryCodes = freeze({
  artifactMissing: "strict-review-artifact-missing",
  transcriptOnlyRejected: "strict-review-transcript-only-rejected",
  wrongPackageRejected: "strict-review-wrong-package-rejected",
  resultInvalid: "strict-review-result-invalid",
  cleanupFailed: "strict-review-cleanup-failed",
  timeout: "strict-review-transport-timeout",
  crash: "strict-review-process-crash",
  requestInvalid: "strict-review-delivery-request-invalid",
  complete: "strict-review-delivery-complete",
});

const unavailable = (code, safeMessage, additional = {}) => {
  const diagnostic = diagnosticFromCode({ stage, operation, code, subject, safeMessage });
  return freeze({ kind: "terminal", allowed: false, ...unavailableOutcome(diagnostic), ...additional });
};

// The terminal record key: one immutable identity per (launchId, requestDigest).
// A caller that persists this key at most once is guaranteed at-most-one
// terminal record for that exact sealed package and transition.
export function strictReviewTerminalKey({ launchId, requestDigest } = {}) {
  if (!text(launchId) || !hex64(requestDigest)) return null;
  return createHash("sha256").update(canonicalJson({ launchId, requestDigest })).digest("hex");
}


/**
 * Deterministically terminalize a raw host capture into exactly one terminal
 * record. The same inputs always produce the same record, so a caller MUST NOT
 * emit a second record for the same key (see strictReviewTerminalKey).
 *
 * capture: {
 *   timeout?: boolean,        // transport timed out before a terminal result
 *   exitCode?: number|null,   // null/undefined = no observable exit (crash)
 *   transcriptOnly?: boolean, // reviewer emitted a transcript/stdout but no artifact
 *   artifact?: object|null,   // parsed owned final-result artifact
 *   cleanup?: { removed: boolean, recovery?: object },
 * }
 */
export function terminalizeStrictReviewCapture({ launchId, requestDigest, capture, expectedPackage, configuredReviewer, implementerSession } = {}) {
  const key = strictReviewTerminalKey({ launchId, requestDigest });
  if (!key) return unavailable(strictReviewDeliveryCodes.requestInvalid, "The strict review delivery request is missing or malformed.");
  if (!capture || typeof capture !== "object") {
    return unavailable(strictReviewDeliveryCodes.requestInvalid, "The strict review capture is missing or malformed.", { key });
  }

  if (capture.timeout === true) {
    return unavailable(strictReviewDeliveryCodes.timeout, "The strict reviewer transport timed out before a terminal result.", { key });
  }
  if (capture.exitCode === null || capture.exitCode === undefined) {
    return unavailable(strictReviewDeliveryCodes.crash, "The strict reviewer process ended without an observable exit.", { key });
  }

  const hasArtifact = capture.artifact !== null && capture.artifact !== undefined && typeof capture.artifact === "object";
  if (!hasArtifact) {
    const transcriptOnly = capture.transcriptOnly === true;
    return unavailable(
      transcriptOnly ? strictReviewDeliveryCodes.transcriptOnlyRejected : strictReviewDeliveryCodes.artifactMissing,
      transcriptOnly
        ? "A transcript or claimed success is not acceptance evidence; the owned final-result artifact is required."
        : "The strict reviewer did not produce its owned final-result artifact.",
      { key },
    );
  }

  const result = capture.artifact;
  if (result.status === "unavailable") {
    const code = text(result.unavailableCode) && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(result.unavailableCode)
      ? result.unavailableCode
      : strictReviewDeliveryCodes.resultInvalid;
    return unavailable(code, "The strict reviewer returned an unavailable result.", { key });
  }

  const validation = validateReviewResult(result, { expectedPackage, configuredReviewer, implementerSession });
  if (!validation.valid) {
    const issue = validation.issues?.[0]?.code;
    const wrongPackage = issue === "independent-review-result-stale-input";
    return unavailable(
      wrongPackage ? strictReviewDeliveryCodes.wrongPackageRejected : strictReviewDeliveryCodes.resultInvalid,
      wrongPackage
        ? "The review result binds a package or head other than the exact sealed package."
        : "The review result does not satisfy the canonical result contract.",
      { key, issue },
    );
  }

  if (capture.cleanup?.removed !== true) {
    return unavailable(strictReviewDeliveryCodes.cleanupFailed, "The strict review temporary resources could not be confirmed removed.", {
      key,
      recovery: capture.cleanup?.recovery ?? { resource: "review-view", action: "remove-owned-view", key },
    });
  }

  return freeze({
    kind: "terminal",
    allowed: true,
    status: result.status,
    code: strictReviewDeliveryCodes.complete,
    key,
    result,
    cleanup: { removed: true },
  });
}

/**
 * Deliver a strict review artifact: validate the sealed package, then
 * deterministically terminalize the host capture into exactly one record. This
 * is the parent-owned schema-valid terminal-artifact boundary for the strict
 * host-captured transport.
 */
export function deliverStrictReviewArtifact({ launchId, requestDigest, reviewPackage, configuredReviewer, implementerSession, capture } = {}) {
  const key = strictReviewTerminalKey({ launchId, requestDigest });
  if (!key) return unavailable(strictReviewDeliveryCodes.requestInvalid, "The strict review delivery request is missing or malformed.");
  if (!reviewPackage || typeof reviewPackage !== "object") {
    return unavailable(strictReviewDeliveryCodes.requestInvalid, "The sealed review package is missing.", { key });
  }
  const packageCheck = validateReviewPackage(reviewPackage);
  if (!packageCheck.valid) {
    return unavailable(strictReviewDeliveryCodes.requestInvalid, "The sealed review package does not satisfy the canonical package contract.", {
      key,
      issue: packageCheck.issues?.[0]?.code,
    });
  }
  return terminalizeStrictReviewCapture({ launchId, requestDigest, capture, expectedPackage: reviewPackage, configuredReviewer, implementerSession });
}
