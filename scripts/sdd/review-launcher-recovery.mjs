#!/usr/bin/env node
import { createHash, randomUUID } from "node:crypto";
import fs from "node:fs";

import { validateDegradedIndependentReviewAuthorization } from "./degraded-independent-review-authorization.mjs";
import { canonicalJson, validateReviewPackage, validateReviewResult } from "./independent-review-contract.mjs";
import { degradedAuthorizationMatchesResult, strictSummaryMatchesResult } from "./independent-review.mjs";

const recoverableFailures = new Set([
  "independent-review-view-create-failed",
  "independent-reviewer-nested-app-server-denied"
]);
const boundary = "detached-exact-head-inner-read-only";
const launcherKind = "codex-detached-read-only-v1";
const hostScript = "scripts/sdd/review-launcher-host.mjs";
const text = (value) => typeof value === "string" && value.trim().length > 0;
const fail = (code, detail) => ({ allowed: false, status: "unavailable", code, ...(detail ? { detail } : {}) });

function executableIsCodex(value) {
  if (!text(value) || /[\r\n\0]/.test(value)) return false;
  return ["codex", "codex.exe"].includes(value.split(/[\\/]/).at(-1).toLowerCase());
}

export function reviewLauncherRequestDigest({ schemaVersion, launchId, request } = {}) {
  if (schemaVersion !== 1 || !text(launchId) || !request) return null;
  return createHash("sha256").update(canonicalJson({ schemaVersion, launchId, request })).digest("hex");
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
  if (launcher?.enabled !== true || launcher.kind !== launcherKind || launcher.hostScript !== hostScript || !executableIsCodex(launcher.executable) ||
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
      hostScript,
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

export function prepareReviewLauncherRecovery(request, { launchId = randomUUID() } = {}) {
  const preflight = validateReviewLauncherRecovery(request);
  if (!preflight.allowed) return preflight;
  const hostRequest = { schemaVersion: 1, launchId, request: structuredClone(request) };
  hostRequest.requestDigest = reviewLauncherRequestDigest(hostRequest);
  return {
    allowed: true,
    status: "host-launch-required",
    code: "review-launcher-external-host-required",
    hostRequest,
    expectedRecovery: preflight.recovery
  };
}

function validRuntimeLaunchEvidence(value, prepared, response) {
  return value?.attestedBy === "trusted-runtime" && value.outsideManagedSandbox === true &&
    text(value.executionRef) && value.launcherId === prepared.expectedRecovery.launcherId &&
    value.launcherKind === launcherKind && value.hostScript === hostScript &&
    value.requestDigest === prepared.hostRequest.requestDigest &&
    value.hostExecutionId === response?.hostExecutionId;
}

export function acceptReviewLauncherHostResponse({ prepared, response, runtimeLaunchEvidence } = {}) {
  const hostRequest = prepared?.hostRequest;
  const requestDigest = reviewLauncherRequestDigest(hostRequest);
  if (prepared?.allowed !== true || prepared.code !== "review-launcher-external-host-required" ||
      requestDigest !== hostRequest?.requestDigest) return fail("review-launcher-prepared-request-invalid");
  const preflight = validateReviewLauncherRecovery(hostRequest.request);
  if (!preflight.allowed) return preflight;
  if (response?.allowed !== true || response.code !== "review-launcher-host-complete" ||
      response.launchId !== hostRequest.launchId || response.requestDigest !== requestDigest ||
      response.launcherId !== preflight.recovery.launcherId || response.launcherKind !== launcherKind ||
      response.hostScript !== hostScript || !text(response.hostExecutionId)) return fail("review-launcher-host-response-invalid");
  if (!validRuntimeLaunchEvidence(runtimeLaunchEvidence, prepared, response)) return fail("review-launcher-runtime-attestation-missing");
  const request = hostRequest.request;
  const configuredReviewer = { ...request.reviewer, attestation: request.reviewer?.attestation ?? { ref: request.attestationRef } };
  const validation = validateReviewResult(response.result, { expectedPackage: request.reviewPackage, configuredReviewer, implementerSession: request.authorization?.implementerSession });
  if (!validation.valid || response.result.assuranceLevel !== "authorized-degraded") return fail("review-launcher-result-invalid", validation.issues?.[0]?.code);
  if (!strictSummaryMatchesResult(response.result.strictUnavailable, request.strictResult)) return fail("review-launcher-strict-unavailable-mismatch");
  if (!degradedAuthorizationMatchesResult(response.result.degradedAuthorization, preflight.degradedAuthorization)) return fail("review-launcher-degraded-authorization-mismatch");
  if (canonicalJson(response.launcherEvidence) !== canonicalJson(preflight.recovery) || response.cleanup?.removed !== true) return fail("review-launcher-host-evidence-invalid");
  return {
    allowed: true,
    status: response.result.status,
    code: "review-launcher-recovery-complete",
    result: response.result,
    launcherEvidence: response.launcherEvidence,
    runtimeLaunchEvidence: { ...runtimeLaunchEvidence }
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [command, ...paths] = process.argv.slice(2);
  let result;
  if (command === "prepare" && paths.length === 1) {
    result = prepareReviewLauncherRecovery(JSON.parse(fs.readFileSync(paths[0], "utf8")));
  } else if (command === "accept" && paths.length === 3) {
    result = acceptReviewLauncherHostResponse({
      prepared: JSON.parse(fs.readFileSync(paths[0], "utf8")),
      response: JSON.parse(fs.readFileSync(paths[1], "utf8")),
      runtimeLaunchEvidence: JSON.parse(fs.readFileSync(paths[2], "utf8"))
    });
  } else {
    console.error("Usage: review-launcher-recovery.mjs prepare <request.json> | accept <prepared.json> <response.json> <runtime-evidence.json>");
    process.exit(2);
  }
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.allowed ? 0 : 1);
}
