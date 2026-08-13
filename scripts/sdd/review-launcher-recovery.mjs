#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

import { createDetachedReviewView, removeDetachedReviewView } from "./detached-review-view.mjs";
import { validateDegradedIndependentReviewAuthorization } from "./degraded-independent-review-authorization.mjs";
import { validateReviewPackage, validateReviewResult } from "./independent-review-contract.mjs";
import { degradedAuthorizationMatchesResult, strictSummaryMatchesResult } from "./independent-review.mjs";
import { runCodexDegradedReviewAdapter, writeReviewPackageForView } from "./platform-review-adapters.mjs";

const recoverableFailures = new Set([
  "independent-review-view-create-failed",
  "independent-reviewer-nested-app-server-denied"
]);
const boundary = "detached-exact-head-inner-read-only";
const launcherKind = "codex-detached-read-only-v1";
const text = (value) => typeof value === "string" && value.trim().length > 0;
const fail = (code, detail) => ({ allowed: false, status: "unavailable", code, ...(detail ? { detail } : {}) });

function executableIsCodex(value) {
  if (!text(value) || /[\r\n\0]/.test(value)) return false;
  return ["codex", "codex.exe"].includes(path.basename(value).toLowerCase());
}

export function validateReviewLauncherRecovery({ failureCode, authorization, selectedEntry, transition = "merge-pr", reviewPackage, strictResult, launcher, runtime, correctionAttempts = 0, derivedCorrection = false, correctionEvidence, now = new Date().toISOString() } = {}) {
  const packageCheck = validateReviewPackage(reviewPackage);
  if (!packageCheck.valid) return fail(packageCheck.issues[0].code);
  if (!recoverableFailures.has(failureCode)) return fail("review-launcher-failure-not-recoverable", failureCode);
  if (strictResult?.status !== "unavailable" || strictResult.unavailableCode !== failureCode) return fail("review-launcher-strict-unavailable-mismatch");
  const degradedCheck = validateDegradedIndependentReviewAuthorization({ authorization, selectedEntry, transition, reviewPackage, strictResult, correctionAttempts, derivedCorrection, correctionEvidence, now });
  if (!degradedCheck.allowed) return fail(degradedCheck.issues[0].code);
  const record = authorization?.reviewLauncher;
  if (record?.enabled !== true) return fail("review-launcher-not-authorized");
  if (record.change !== selectedEntry || !Array.isArray(record.transitions) || !record.transitions.includes(transition)) return fail("review-launcher-scope-mismatch");
  if (record.boundary !== boundary || record.launcherId !== launcher?.id) return fail("review-launcher-boundary-mismatch");
  if (record.baseCommit !== reviewPackage.baseCommit || record.headCommit !== reviewPackage.headCommit || record.manifestDigest !== reviewPackage.manifestDigest) return fail("review-launcher-package-mismatch");
  const expires = Date.parse(record.expiresAt);
  const current = Date.parse(now);
  if (Number.isNaN(expires) || Number.isNaN(current) || expires <= current) return fail("review-launcher-authorization-expired");
  if (launcher?.enabled !== true || launcher.kind !== launcherKind || !executableIsCodex(launcher.executable) ||
      launcher.detachedView !== true || launcher.innerReadOnlySandbox !== true || launcher.ephemeral !== true ||
      launcher.sealedPackageOnly !== true || launcher.credentialScrubbed !== true || launcher.nonInteractive !== true) {
    return fail("review-launcher-capability-unavailable");
  }
  if (!Array.isArray(runtime?.permittedReviewLaunchers) || !runtime.permittedReviewLaunchers.includes(launcher.id)) {
    return fail("review-launcher-runtime-permission-required");
  }
  return {
    allowed: true,
    status: "ready",
    code: "review-launcher-recovery-ready",
    degradedAuthorization: degradedCheck.authorization,
    recovery: Object.freeze({
      launcherId: launcher.id,
      launcherKind,
      boundary,
      selectedEntry,
      transition,
      baseCommit: reviewPackage.baseCommit,
      headCommit: reviewPackage.headCommit,
      manifestDigest: reviewPackage.manifestDigest,
      expiresAt: new Date(expires).toISOString(),
      parentLaunchPermission: "runtime-permitted",
      innerSandbox: "read-only",
      sealedPackageOnly: true
    })
  };
}

export function executeReviewLauncherRecovery({
  failureCode,
  authorization,
  selectedEntry,
  transition = "merge-pr",
  reviewPackage,
  strictResult,
  launcher,
  runtime,
  repositoryPath,
  reviewer,
  attestationRef,
  correctionAttempts = 0,
  derivedCorrection = false,
  correctionEvidence,
  now,
  createView = createDetachedReviewView,
  removeView = removeDetachedReviewView,
  invoke = runCodexDegradedReviewAdapter
} = {}) {
  const preflight = validateReviewLauncherRecovery({ failureCode, authorization, selectedEntry, transition, reviewPackage, strictResult, launcher, runtime, correctionAttempts, derivedCorrection, correctionEvidence, now });
  if (!preflight.allowed) return preflight;
  if (!text(repositoryPath) || !reviewer || !text(reviewer.type) || !text(reviewer.identity) || !text(attestationRef)) return fail("review-launcher-input-incomplete");
  const created = createView({ repositoryPath, headCommit: reviewPackage.headCommit });
  if (!created?.available || created.view?.headCommit !== reviewPackage.headCommit) return fail("review-launcher-detached-view-unavailable", created?.code);
  const { view } = created;
  let output;
  try {
    writeReviewPackageForView(view, reviewPackage);
    const schemaPath = path.join(view.reviewPath, "schemas", "independent-review-findings-v1.schema.json");
    const resultPath = path.join(view.temporaryRoot, "independent-review-findings.json");
    const execution = invoke({
      reviewPackage,
      view,
      schemaPath,
      resultPath,
      reviewer,
      attestationRef,
      strictResult,
      degradedAuthorization: {
        change: selectedEntry,
        transition,
        expiresAt: authorization.degradedIndependentReview.expiresAt,
        riskReason: authorization.degradedIndependentReview.riskReason,
        fallbackBoundary: authorization.degradedIndependentReview.fallbackBoundary
      },
      executable: launcher.executable
    });
    if (execution?.status === "unavailable") output = fail("review-launcher-inner-reviewer-unavailable", execution.result?.unavailableCode);
    else {
      const configuredReviewer = { ...reviewer, attestation: reviewer.attestation ?? { ref: attestationRef } };
      const validation = validateReviewResult(execution?.result, { expectedPackage: reviewPackage, configuredReviewer, implementerSession: authorization.implementerSession });
      if (!validation.valid || execution.result.assuranceLevel !== "authorized-degraded") {
        output = fail("review-launcher-result-invalid", validation.issues?.[0]?.code);
      } else if (!strictSummaryMatchesResult(execution.result.strictUnavailable, strictResult)) {
        output = fail("review-launcher-strict-unavailable-mismatch");
      } else if (!degradedAuthorizationMatchesResult(execution.result.degradedAuthorization, preflight.degradedAuthorization)) {
        output = fail("review-launcher-degraded-authorization-mismatch");
      } else {
        output = { allowed: true, status: execution.result.status, code: "review-launcher-recovery-complete", result: execution.result, launcherEvidence: preflight.recovery };
      }
    }
  } catch {
    output = fail("review-launcher-execution-failed");
  }
  const cleanup = removeView(view);
  if (cleanup?.removed !== true) return fail("review-launcher-cleanup-failed", cleanup?.code);
  return output;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const inputPath = process.argv[2];
  if (!inputPath) {
    console.error("Usage: review-launcher-recovery.mjs <request.json>");
    process.exit(2);
  }
  const request = JSON.parse(fs.readFileSync(inputPath, "utf8"));
  const result = executeReviewLauncherRecovery(request);
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.allowed && result.status !== "unavailable" ? 0 : 1);
}
