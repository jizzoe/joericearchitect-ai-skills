#!/usr/bin/env node
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { createDetachedReviewView, removeDetachedReviewView } from "./detached-review-view.mjs";
import { buildReviewPackage, canonicalJson, validateReviewResult } from "./independent-review-contract.mjs";
import { degradedAuthorizationMatchesResult, strictSummaryMatchesResult } from "./independent-review.mjs";
import { runClaudeDegradedReviewAdapter, runCodexDegradedReviewAdapter, writeReviewPackageForView } from "./platform-review-adapters.mjs";
import { reviewLauncherDefinition, reviewLauncherRequestDigest, validateReviewLauncherRecovery } from "./review-launcher-recovery.mjs";
import { cleanupReviewWorktreeLifecycle, executeReviewWorktreeLifecycle, prepareReviewWorktreeLifecycle } from "./review-worktree-lifecycle.mjs";
import { diagnosticFromCode, diagnosticFromError, preservedDiagnostic, unavailableOutcome } from "./review-diagnostics.mjs";

const hostScript = "scripts/sdd/review-launcher-host.mjs";
const text = (value) => typeof value === "string" && value.trim().length > 0;
const fail = (code, detail) => {
  const diagnostic = diagnosticFromCode({ stage: "launcher-host", operation: "execute-review-launcher-host", code, subject: "review-launcher-host", safeMessage: "The external reviewer host could not complete the requested review." });
  return { allowed: false, ...unavailableOutcome(diagnostic), ...(detail ? { detail } : {}) };
};
const lifecycleUnavailable = (lifecycle) => ({
  allowed: false,
  ...unavailableOutcome(preservedDiagnostic(lifecycle) ?? diagnosticFromCode({ stage: "worktree-lifecycle", operation: "manage-review-worktree", code: lifecycle?.code ?? "review-worktree-lifecycle-unavailable", subject: "review-worktree", safeMessage: "The external reviewer host could not manage its detached review worktree." })),
  lifecycle
});

export function executeReviewLauncherHost(hostRequest, {
  createView = createDetachedReviewView,
  removeView = removeDetachedReviewView,
  rebuildPackage = buildReviewPackage,
  invoke,
  hostExecutionId = randomUUID(),
  now = new Date().toISOString()
} = {}) {
  const digest = reviewLauncherRequestDigest(hostRequest);
  if (!digest || digest !== hostRequest?.requestDigest) return fail("review-launcher-host-request-invalid");
  const request = hostRequest.request;
  const preflight = validateReviewLauncherRecovery({ ...request, sourceRequestDigest: digest, now });
  if (!preflight.allowed) return preflight;
  const selectedAdapter = preflight.adapterBinding.reviewAdapter;
  const definition = reviewLauncherDefinition(selectedAdapter);
  if (selectedAdapter === "codex-detached-read-only-v1" && typeof invoke !== "function") {
    return fail("independent-reviewer-codex-capture-parent-required");
  }
  const invokeAdapter = invoke ?? (selectedAdapter === "claude-detached-restricted-v1" ? runClaudeDegradedReviewAdapter : runCodexDegradedReviewAdapter);
  if (!definition) return fail("review-launcher-capability-unavailable");
  if (!text(request.repositoryPath) || !request.reviewer || !text(request.reviewer.type) || !text(request.reviewer.identity) || !text(request.attestationRef)) return fail("review-launcher-input-incomplete");
  const preparedLifecycle = prepareReviewWorktreeLifecycle({
    authorization: request.authorization,
    selectedEntry: request.selectedEntry,
    transition: request.transition,
    reviewPackage: request.reviewPackage,
    repositoryPath: request.repositoryPath,
    sourceRequestDigest: digest,
    now
  }, { lifecycleId: `worktree-${hostRequest.launchId}` });
  if (!preparedLifecycle.allowed) return fail(preparedLifecycle.code);
  const created = executeReviewWorktreeLifecycle({
    lifecycleRequest: preparedLifecycle.lifecycleRequest,
    sourceRequestDigest: digest,
    expected: preflight.recovery.worktreeLifecycle,
    now
  }, { createView });
  if (!created?.available) return lifecycleUnavailable(created);
  const { view } = created;
  let output;
  try {
    if (view?.headCommit !== request.reviewPackage.headCommit) {
      output = fail("review-launcher-detached-view-unavailable", "review-launcher-detached-view-head-mismatch");
    } else {
      const rebuilt = rebuildPackage({
        repositoryPath: view.reviewPath,
        baseCommit: request.reviewPackage.baseCommit,
        headCommit: request.reviewPackage.headCommit,
        artifactPaths: request.reviewPackage.artifacts.map((artifact) => artifact.path),
        validationEvidence: request.reviewPackage.validationEvidence
      });
      if (!rebuilt?.valid) {
        output = fail("review-launcher-package-rederivation-failed", rebuilt?.issues?.[0]?.code);
      } else if (canonicalJson(rebuilt.package) !== canonicalJson(request.reviewPackage)) {
        output = fail("review-launcher-package-mismatch");
      } else {
        writeReviewPackageForView(view, rebuilt.package);
        const schemaPath = path.join(view.reviewPath, "schemas", "independent-review-findings-v1.schema.json");
        const resultPath = path.join(view.temporaryRoot, "independent-review-findings.json");
        const execution = invokeAdapter({
          reviewPackage: rebuilt.package,
          view,
          schemaPath,
          resultPath,
          reviewer: request.reviewer,
          attestationRef: request.attestationRef,
          strictResult: request.strictResult,
          degradedAuthorization: preflight.degradedAuthorization,
          executable: request.launcher.executable
        });
        if (execution?.status === "unavailable") {
          const diagnostic = preservedDiagnostic(execution) ?? diagnosticFromCode({ stage: "reviewer-execution", operation: "execute-degraded-reviewer", code: execution?.result?.unavailableCode ?? "review-launcher-inner-reviewer-unavailable", subject: "degraded-reviewer", safeMessage: "The external reviewer process did not produce a usable result." });
          output = { allowed: false, ...unavailableOutcome(diagnostic) };
        }
        else {
          const configuredReviewer = { ...request.reviewer, attestation: request.reviewer.attestation ?? { ref: request.attestationRef } };
          const validation = validateReviewResult(execution?.result, { expectedPackage: rebuilt.package, configuredReviewer, implementerSession: request.authorization.implementerSession });
          if (!validation.valid || execution.result.assuranceLevel !== "authorized-degraded") output = fail("review-launcher-result-invalid", validation.issues?.[0]?.code);
          else if (!strictSummaryMatchesResult(execution.result.strictUnavailable, request.strictResult)) output = fail("review-launcher-strict-unavailable-mismatch");
          else if (!degradedAuthorizationMatchesResult(execution.result.degradedAuthorization, preflight.degradedAuthorization)) output = fail("review-launcher-degraded-authorization-mismatch");
          else output = {
            allowed: true,
            status: execution.result.status,
            code: "review-launcher-host-complete",
            launchId: hostRequest.launchId,
            requestDigest: digest,
            reviewAdapter: selectedAdapter,
            launcherId: preflight.recovery.launcherId,
            launcherKind: preflight.recovery.launcherKind,
            hostScript,
            hostExecutionId,
            worktreeLifecycle: {
              operation: preparedLifecycle.lifecycle.operation,
              requestDigest: preparedLifecycle.lifecycleRequest.requestDigest,
              expiresAt: preparedLifecycle.lifecycle.expiresAt
            },
            result: execution.result,
            launcherEvidence: preflight.recovery
          };
        }
      }
    }
  } catch (error) {
    const diagnostic = diagnosticFromError({ stage: "launcher-host", operation: "execute-review-launcher-host", code: "review-launcher-execution-failed", subject: "review-launcher-host", safeMessage: "The external reviewer host failed while executing the review.", error });
    output = { allowed: false, ...unavailableOutcome(diagnostic) };
  }
  const cleanup = cleanupReviewWorktreeLifecycle({
    lifecycleRequest: preparedLifecycle.lifecycleRequest,
    sourceRequestDigest: digest,
    expected: preflight.recovery.worktreeLifecycle,
    view,
    now
  }, { removeView });
  if (cleanup?.removed !== true || cleanup.status !== "removed") return lifecycleUnavailable(cleanup);
  return output.allowed ? { ...output, cleanup: { removed: true } } : output;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const inputPath = process.argv[2];
  if (!inputPath || process.argv.length !== 3) {
    console.error(JSON.stringify(fail("review-launcher-host-runtime-input-missing")));
    process.exit(2);
  }
  const prepared = JSON.parse(fs.readFileSync(inputPath, "utf8"));
  const result = executeReviewLauncherHost(prepared.hostRequest);
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.allowed && result.status !== "unavailable" ? 0 : 1);
}
