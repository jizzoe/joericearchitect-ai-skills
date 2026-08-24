import { createHash } from "node:crypto";

import { canonicalJson, validateReviewPackage } from "./independent-review-contract.mjs";
import { validateReviewAdapterCapabilities } from "./review-adapter-contract.mjs";
import { diagnosticFromCode, unavailableOutcome } from "./review-diagnostics.mjs";

const text = (value) => typeof value === "string" && value.trim().length > 0;
const hex64 = (value) => text(value) && /^[0-9a-f]{64}$/.test(value);
const freeze = (value) => Object.freeze(value);

const stage = "review-admission";
const operation = "admit-review-readiness";
const subject = "review-admission";

// Stable terminal codes for the review-readiness admission contract. The code,
// not a free-form message, is the machine-comparable outcome.
export const reviewAdmissionCodes = freeze({
  requestInvalid: "review-admission-request-invalid",
  adapterMissing: "review-admission-adapter-missing",
  attestationInvalid: "review-admission-attestation-invalid",
  artifactPathInvalid: "review-admission-artifact-path-invalid",
  inspectionUnavailable: "review-admission-inspection-unavailable",
  permissionDenied: "review-admission-permission-denied",
  deadlineInadequate: "review-admission-deadline-inadequate",
  cleanupUnwritable: "review-admission-cleanup-unwritable",
  stale: "review-admission-evidence-stale",
  complete: "review-admission-complete",
});

const unavailable = (code, safeMessage, additional = {}) => {
  const diagnostic = diagnosticFromCode({ stage, operation, code, subject, safeMessage });
  return freeze({ kind: "terminal", allowed: false, ...unavailableOutcome(diagnostic, additional) });
};

const admissionPackageDigest = (reviewPackage) => createHash("sha256").update(canonicalJson(reviewPackage)).digest("hex");

/**
 * The durable admission-evidence identity: one immutable key per
 * (sealedPackageDigest, observedAt). Callers persist the evidence at most once.
 */
export function reviewAdmissionEvidenceKey({ sealedPackageDigest, observedAt } = {}) {
  if (!hex64(sealedPackageDigest) || !text(observedAt)) return null;
  return createHash("sha256").update(canonicalJson({ sealedPackageDigest, observedAt })).digest("hex");
}

/**
 * Prove the production review path is viable before Apply can become eligible.
 *
 * Injected dependencies keep this deterministic: `probe` performs the genuine
 * multi-step read-only operations against a synthetic owned fixture, `transport`
 * crosses the parent boundary, and `now`/`deadline` bound the freshness window.
 *
 * probe() -> { launchId, requestDigest, operations: [{name}], capture }
 * transport() -> { status: "executed" | "denied" | "timed-out", capture? }
 */
export function admitReviewReadiness({
  reviewPackage,
  adapter,
  executableIdentity,
  transport,
  probe,
  deadline,
  ttlMs = 60 * 60 * 1000,
  now = new Date().toISOString(),
} = {}) {
  if (!reviewPackage || typeof reviewPackage !== "object") {
    return unavailable(reviewAdmissionCodes.requestInvalid, "The review admission request is missing a sealed package.");
  }
  const packageCheck = validateReviewPackage(reviewPackage);
  if (!packageCheck.valid) {
    return unavailable(reviewAdmissionCodes.requestInvalid, "The sealed review package does not satisfy the canonical package contract.");
  }

  const nowMs = Date.parse(now);
  const deadlineMs = Date.parse(deadline);
  if (Number.isNaN(nowMs) || Number.isNaN(deadlineMs)) {
    return unavailable(reviewAdmissionCodes.requestInvalid, "The admission deadline or observed time is invalid.");
  }
  if (deadlineMs <= nowMs) {
    return unavailable(reviewAdmissionCodes.deadlineInadequate, "The review deadline budget is inadequate for admission.");
  }

  const adapterCheck = validateReviewAdapterCapabilities(adapter);
  if (!adapterCheck.valid) {
    return unavailable(reviewAdmissionCodes.adapterMissing, "The configured review adapter is missing or does not meet the required boundary.");
  }
  if (!executableIdentity || executableIdentity.managedMutationDenied !== true) {
    return unavailable(reviewAdmissionCodes.adapterMissing, "The exact configured reviewer executable identity could not be resolved.");
  }

  if (typeof transport !== "function") {
    return unavailable(reviewAdmissionCodes.permissionDenied, "The parent review transport is unavailable.");
  }
  if (typeof probe !== "function") {
    return unavailable(reviewAdmissionCodes.inspectionUnavailable, "No multi-step readiness probe is available.");
  }

  let probeResult;
  try {
    probeResult = probe({ reviewPackage, adapter, executableIdentity, now });
  } catch {
    return unavailable(reviewAdmissionCodes.inspectionUnavailable, "The multi-step readiness probe failed before producing evidence.");
  }

  const operations = Array.isArray(probeResult?.operations) ? probeResult.operations : [];
  const distinctOperations = [...new Set(operations.filter((op) => text(op?.name)).map((op) => op.name))];
  if (distinctOperations.length < 2) {
    return unavailable(reviewAdmissionCodes.artifactPathInvalid, "The readiness probe did not perform a genuine multi-step artifact path.");
  }

  let transportResult;
  try {
    transportResult = transport({ reviewPackage, probe: probeResult, now });
  } catch {
    return unavailable(reviewAdmissionCodes.permissionDenied, "The parent review transport failed.");
  }
  if (transportResult?.status === "denied") {
    return unavailable(reviewAdmissionCodes.permissionDenied, "The parent review transport was denied.");
  }
  if (transportResult?.status === "timed-out") {
    return unavailable(reviewAdmissionCodes.deadlineInadequate, "The parent review transport timed out.");
  }
  if (transportResult?.status !== "executed") {
    return unavailable(reviewAdmissionCodes.permissionDenied, "The parent review transport did not execute.");
  }

  const capture = transportResult.capture ?? probeResult.capture;
  const hasArtifact = capture?.artifact !== null && capture?.artifact !== undefined && typeof capture.artifact === "object";
  if (!hasArtifact) {
    return unavailable(reviewAdmissionCodes.artifactPathInvalid, "The readiness probe did not produce a parent-owned result artifact.");
  }
  if (capture.cleanup?.removed !== true) {
    return unavailable(reviewAdmissionCodes.cleanupUnwritable, "The review temporary resources could not be confirmed removed.", {
      recovery: capture.cleanup?.recovery ?? { resource: "review-view", action: "remove-owned-view" },
    });
  }

  const sealedPackageDigest = admissionPackageDigest(reviewPackage);
  const evidence = freeze({
    sealedPackageDigest,
    headCommit: reviewPackage.headCommit,
    manifestDigest: reviewPackage.manifestDigest,
    observedAt: now,
    expiresAt: new Date(nowMs + ttlMs).toISOString(),
    operations: freeze([...distinctOperations].sort()),
  });

  return freeze({
    kind: "terminal",
    allowed: true,
    status: "admitted",
    code: reviewAdmissionCodes.complete,
    key: reviewAdmissionEvidenceKey({ sealedPackageDigest, observedAt: now }),
    evidence,
  });
}

/**
 * Freshness: admission evidence is valid only for the exact sealed package it
 * proved and only within its bounded time-to-live.
 */
export function reviewAdmissionFresh({ evidence, reviewPackage, now = new Date().toISOString() } = {}) {
  if (!evidence || !reviewPackage) return false;
  if (evidence.sealedPackageDigest !== admissionPackageDigest(reviewPackage)) return false;
  if (evidence.headCommit !== reviewPackage.headCommit || evidence.manifestDigest !== reviewPackage.manifestDigest) return false;
  const nowMs = Date.parse(now);
  const expiresAt = Date.parse(evidence.expiresAt);
  if (Number.isNaN(nowMs) || Number.isNaN(expiresAt)) return false;
  return nowMs < expiresAt;
}

