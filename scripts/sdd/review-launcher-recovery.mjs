#!/usr/bin/env node
import { createHash, randomUUID } from "node:crypto";
import fs from "node:fs";

import { validateDegradedIndependentReviewAuthorization } from "./degraded-independent-review-authorization.mjs";
import { canonicalJson, validateReviewPackage, validateReviewResult } from "./independent-review-contract.mjs";
import { degradedAuthorizationMatchesResult, strictSummaryMatchesResult } from "./independent-review.mjs";
import { prepareReviewWorktreeLifecycle, validatePreparedReviewWorktreeLifecycle, validateReviewWorktreeLifecycle } from "./review-worktree-lifecycle.mjs";
import { diagnosticFromCode, diagnosticFromError, preservedDiagnostic, unavailableOutcome } from "./review-diagnostics.mjs";

const hostScript = "scripts/sdd/review-launcher-host.mjs";
const text = (value) => typeof value === "string" && value.trim().length > 0;
const fail = (code, detail) => {
  const diagnostic = diagnosticFromCode({ stage: "launcher-recovery", operation: "validate-review-launcher-recovery", code, subject: "review-launcher-recovery", safeMessage: "The external reviewer recovery request is not valid or cannot be completed." });
  return { allowed: false, ...unavailableOutcome(diagnostic), ...(detail ? { detail } : {}) };
};
const terminal = (code, prepared, detail) => ({
  allowed: false,
  ...unavailableOutcome(preservedDiagnostic(detail) ?? diagnosticFromCode({ stage: "launcher-recovery", operation: "execute-review-launcher-recovery", code, subject: "review-launcher-recovery", safeMessage: "The external reviewer recovery could not complete through its required transport." })),
  terminal: true,
  manualFallback: false,
  ...(prepared?.hostRequest?.requestDigest ? { requestDigest: prepared.hostRequest.requestDigest } : {}),
  ...(detail && !preservedDiagnostic(detail) ? { detail } : {})
});

const launcherDefinitions = Object.freeze({
  "codex-detached-read-only-v1": Object.freeze({
    executableNames: Object.freeze(["codex", "codex.exe"]),
    boundary: "detached-exact-head-inner-read-only",
    recoverableFailures: Object.freeze([
      "independent-review-view-create-failed",
      "independent-reviewer-nested-app-server-denied",
      "review-launcher-codex-result-artifact-missing"
    ]),
    requiredCapability: "innerReadOnlySandbox",
    innerBoundary: "read-only-sandbox"
  }),
  "claude-detached-restricted-v1": Object.freeze({
    executableNames: Object.freeze(["claude", "claude.exe"]),
    boundary: "detached-exact-head-read-tools-only",
    recoverableFailures: Object.freeze(["independent-review-view-create-failed", "independent-reviewer-claude-sandbox-unavailable"]),
    requiredCapability: "readToolsOnly",
    innerBoundary: "read-search-tools-only"
  })
});

export function reviewLauncherDefinition(kind) {
  return launcherDefinitions[kind] ?? null;
}

export function recoverableReviewLauncherFailure(code) {
  return Object.values(launcherDefinitions).some((definition) => definition.recoverableFailures.includes(code));
}

function executableMatches(value, definition) {
  if (!text(value) || /[\r\n\0]/.test(value)) return false;
  return definition.executableNames.includes(value.split(/[\\/]/).at(-1).toLowerCase());
}

export function reviewLauncherRequestDigest({ schemaVersion, launchId, request } = {}) {
  if (schemaVersion !== 1 || !text(launchId) || !request) return null;
  const digestRequest = structuredClone(request);
  // The exact lifecycle record names this parent digest. Exclude only that
  // self-reference from the digest input; host validation separately requires
  // the field to equal the recomputed parent digest.
  if (digestRequest.authorization?.reviewWorktreeLifecycle) {
    delete digestRequest.authorization.reviewWorktreeLifecycle.sourceRequestDigest;
  }
  return createHash("sha256").update(canonicalJson({ schemaVersion, launchId, request: digestRequest })).digest("hex");
}

export function validateReviewLauncherRecovery({ failureCode, authorization, selectedEntry, transition = "merge-pr", reviewPackage, repositoryPath, sourceRequestDigest, strictResult, launcher, runtime, reviewer, correctionAttempts = 0, derivedCorrection = false, correctionEvidence, now = new Date().toISOString() } = {}) {
  const packageCheck = validateReviewPackage(reviewPackage);
  if (!packageCheck.valid) return fail(packageCheck.issues[0].code);
  if (!text(authorization?.implementerSession) || !text(reviewer?.identity)) return fail("review-launcher-identity-binding-missing");
  if (authorization.implementerSession === reviewer.identity) return fail("review-launcher-self-review");
  const definition = reviewLauncherDefinition(launcher?.kind);
  if (!definition || !definition.recoverableFailures.includes(failureCode)) return fail("review-launcher-failure-not-recoverable", failureCode);
  if (strictResult?.status !== "unavailable" || strictResult.unavailableCode !== failureCode) return fail("review-launcher-strict-unavailable-mismatch");
  const degradedCheck = validateDegradedIndependentReviewAuthorization({ authorization, selectedEntry, transition, reviewPackage, strictResult, correctionAttempts, derivedCorrection, correctionEvidence, now });
  if (!degradedCheck.allowed) return fail(degradedCheck.issues[0].code);
  const record = authorization?.reviewLauncher;
  if (record?.enabled !== true) return fail("review-launcher-not-authorized");
  if (record.change !== selectedEntry || !Array.isArray(record.transitions) || !record.transitions.includes(transition)) return fail("review-launcher-scope-mismatch");
  if (record.boundary !== definition.boundary || record.launcherId !== launcher?.id) return fail("review-launcher-boundary-mismatch");
  if (record.baseCommit !== reviewPackage.baseCommit || record.headCommit !== reviewPackage.headCommit || record.manifestDigest !== reviewPackage.manifestDigest) return fail("review-launcher-package-mismatch");
  const expires = Date.parse(record.expiresAt);
  const goalExpires = Date.parse(authorization?.expiresAt ?? authorization?.stoppingConditions?.expiresAt);
  const current = Date.parse(now);
  if (Number.isNaN(expires) || Number.isNaN(current) || expires <= current) return fail("review-launcher-authorization-expired");
  if (Number.isNaN(goalExpires) || expires > goalExpires) return fail("review-launcher-expiration-exceeds-goal");
  if (launcher?.enabled !== true || launcher.hostScript !== hostScript || !executableMatches(launcher.executable, definition) ||
      launcher.detachedView !== true || launcher[definition.requiredCapability] !== true || launcher.ephemeral !== true ||
      launcher.sealedPackageOnly !== true || launcher.credentialScrubbed !== true || launcher.nonInteractive !== true) {
    return fail("review-launcher-capability-unavailable");
  }
  if (!Array.isArray(runtime?.permittedReviewLaunchers) || !runtime.permittedReviewLaunchers.includes(launcher.id)) {
    return fail("review-launcher-runtime-permission-required");
  }
  const worktreeLifecycle = validateReviewWorktreeLifecycle({ authorization, selectedEntry, transition, reviewPackage, repositoryPath, sourceRequestDigest, now });
  if (!worktreeLifecycle.allowed) return fail(worktreeLifecycle.code);
  return {
    allowed: true,
    status: "ready",
    code: "review-launcher-recovery-ready",
    degradedAuthorization: degradedCheck.authorization,
    recovery: Object.freeze({
      launcherId: launcher.id,
      launcherKind: launcher.kind,
      hostScript,
      boundary: definition.boundary,
      selectedEntry,
      transition,
      baseCommit: reviewPackage.baseCommit,
      headCommit: reviewPackage.headCommit,
      manifestDigest: reviewPackage.manifestDigest,
      expiresAt: new Date(expires).toISOString(),
      parentLaunchPermission: "runtime-permitted",
      innerBoundary: definition.innerBoundary,
      sealedPackageOnly: true,
      worktreeLifecycle: worktreeLifecycle.lifecycle
    })
  };
}

export function prepareReviewLauncherRecovery(request, { launchId = randomUUID() } = {}) {
  const preflight = validateReviewLauncherRecovery(request);
  if (!preflight.allowed) return preflight;
  const sealedRequest = structuredClone(request);
  delete sealedRequest.now;
  const hostRequest = { schemaVersion: 1, launchId, request: sealedRequest };
  hostRequest.requestDigest = reviewLauncherRequestDigest(hostRequest);
  // The standing policy authorizes derivation of one exact lifecycle record.
  // Bind that derived record only after the parent request has been sealed so
  // its authorization independently names the request it may service without
  // introducing a recursive parent digest.
  const lifecycleAuthorization = {
    ...request.authorization.reviewWorktreeLifecycle,
    sourceRequestDigest: hostRequest.requestDigest
  };
  hostRequest.request.authorization.reviewWorktreeLifecycle = lifecycleAuthorization;
  const worktreeLifecycle = prepareReviewWorktreeLifecycle({
    authorization: hostRequest.request.authorization,
    selectedEntry: request.selectedEntry,
    transition: request.transition,
    reviewPackage: request.reviewPackage,
    repositoryPath: request.repositoryPath,
    sourceRequestDigest: hostRequest.requestDigest,
    now: request.now
  }, { lifecycleId: `worktree-${launchId}` });
  if (!worktreeLifecycle.allowed) return worktreeLifecycle;
  return {
    allowed: true,
    status: "host-launch-required",
    code: "review-launcher-external-host-required",
    hostRequest,
    expectedRecovery: preflight.recovery,
    worktreeLifecycleRequest: worktreeLifecycle.lifecycleRequest,
    worktreeLifecycleAuthorization: worktreeLifecycle.authorization
  };
}

function validRuntimeReceipt(value, prepared, response) {
  return value?.schemaVersion === 1 && value.status === "executed" &&
    ["codex-exec-tool", "claude-parent-runtime", "ci-review-service"].includes(value.source) &&
    value.outsideManagedSandbox === true && value.securityVerifiable === false &&
    text(value.executionRef) && value.launcherId === prepared.expectedRecovery.launcherId &&
    value.launcherKind === prepared.expectedRecovery.launcherKind && value.hostScript === hostScript &&
    value.requestDigest === prepared.hostRequest.requestDigest &&
    value.hostExecutionId === response?.hostExecutionId;
}

export function acceptReviewLauncherHostResponse({ prepared, response, runtimeReceipt, runtimeLaunchEvidence, now = new Date().toISOString() } = {}) {
  const hostRequest = prepared?.hostRequest;
  const requestDigest = reviewLauncherRequestDigest(hostRequest);
  if (prepared?.allowed !== true || prepared.code !== "review-launcher-external-host-required" ||
      requestDigest !== hostRequest?.requestDigest) return fail("review-launcher-prepared-request-invalid");
  const preflight = validateReviewLauncherRecovery({ ...hostRequest.request, sourceRequestDigest: requestDigest, now });
  if (!preflight.allowed) return preflight;
  if (response?.allowed !== true || response.code !== "review-launcher-host-complete" ||
      response.launchId !== hostRequest.launchId || response.requestDigest !== requestDigest ||
      response.launcherId !== preflight.recovery.launcherId || response.launcherKind !== preflight.recovery.launcherKind ||
      response.hostScript !== hostScript || !text(response.hostExecutionId)) return fail("review-launcher-host-response-invalid");
  const lifecycle = validatePreparedReviewWorktreeLifecycle({
    lifecycleRequest: prepared.worktreeLifecycleRequest,
    sourceRequestDigest: requestDigest,
    expected: preflight.recovery.worktreeLifecycle,
    now
  });
  if (!lifecycle.allowed) return fail(lifecycle.code);
  if (response.worktreeLifecycle?.operation !== preflight.recovery.worktreeLifecycle.operation ||
      response.worktreeLifecycle?.requestDigest !== prepared.worktreeLifecycleRequest.requestDigest ||
      response.worktreeLifecycle?.expiresAt !== preflight.recovery.worktreeLifecycle.expiresAt) {
    return fail("review-launcher-worktree-lifecycle-evidence-invalid");
  }
  const receipt = runtimeReceipt ?? runtimeLaunchEvidence;
  if (!validRuntimeReceipt(receipt, prepared, response)) return fail("review-launcher-runtime-receipt-invalid");
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
    runtimeReceipt: { ...receipt }
  };
}

export async function executePreparedReviewLauncherRecovery(prepared, {
  invokePreparedReviewHost,
  now = () => new Date().toISOString()
} = {}) {
  if (prepared?.allowed !== true || prepared.code !== "review-launcher-external-host-required") {
    return terminal("review-launcher-prepared-request-invalid", prepared);
  }
  if (typeof invokePreparedReviewHost !== "function") {
    return terminal("review-launcher-runtime-transport-unavailable", prepared);
  }
  let transportResult;
  try {
    transportResult = await invokePreparedReviewHost(Object.freeze(structuredClone(prepared)));
  } catch (error) {
    const diagnostic = diagnosticFromError({ stage: "recovery-transport", operation: "invoke-prepared-review-host", code: "review-launcher-runtime-transport-failed", subject: "review-launcher-transport", safeMessage: "The parent review transport failed before returning a host response.", error });
    return terminal(diagnostic.code, prepared, { diagnostic });
  }
  if (transportResult?.status === "denied") {
    return terminal("review-launcher-runtime-transport-denied", prepared);
  }
  if (transportResult?.status === "timed-out") {
    return terminal("review-launcher-runtime-transport-timed-out", prepared);
  }
  if (transportResult?.status !== "executed") {
    return terminal(transportResult?.code ?? "review-launcher-runtime-transport-unavailable", prepared, transportResult);
  }
  const accepted = acceptReviewLauncherHostResponse({
    prepared,
    response: transportResult.response,
    runtimeReceipt: transportResult.runtimeReceipt,
    now: now()
  });
  return accepted.allowed ? accepted : terminal(accepted.code, prepared, accepted);
}

export async function executeReviewLauncherRecovery(request, options = {}) {
  const prepared = prepareReviewLauncherRecovery(request, options);
  if (!prepared.allowed) return terminal(prepared.code, prepared, prepared);
  return executePreparedReviewLauncherRecovery(prepared, options);
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
      runtimeReceipt: JSON.parse(fs.readFileSync(paths[2], "utf8"))
    });
  } else {
    console.error("Usage: review-launcher-recovery.mjs prepare <request.json> | accept <prepared.json> <response.json> <runtime-receipt.json>");
    process.exit(2);
  }
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.allowed ? 0 : 1);
}
