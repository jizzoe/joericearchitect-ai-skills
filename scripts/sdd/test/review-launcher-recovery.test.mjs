import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { packageDigest } from "../independent-review-contract.mjs";
import { executeReviewLauncherHost } from "../review-launcher-host.mjs";
import { acceptReviewLauncherHostResponse, prepareReviewLauncherRecovery, validateReviewLauncherRecovery } from "../review-launcher-recovery.mjs";

const reviewPackage = (() => {
  const draft = { schemaVersion: 1, baseCommit: "1".repeat(40), headCommit: "2".repeat(40), diff: "diff --git a/file b/file\n", artifacts: [{ path: "file", sha256: "3".repeat(64), bytes: 4 }], validationEvidence: ["node --test: passed"] };
  return { ...draft, manifestDigest: packageDigest(draft) };
})();
const strictResult = {
  schemaVersion: 1, reviewRecordId: "strict-unavailable-record", executionId: "strict-unavailable-execution",
  reviewer: { type: "codex", identity: "strict-reviewer", adapter: "codex" },
  attestation: { ref: "strict-attestation", nonInteractive: false, isolatedContext: false, freshContext: false, readOnly: false },
  assuranceLevel: "strict-isolated", baseCommit: reviewPackage.baseCommit, headCommit: reviewPackage.headCommit,
  manifestDigest: reviewPackage.manifestDigest, startedAt: "2026-08-13T12:00:00.000Z", completedAt: "2026-08-13T12:00:01.000Z",
  findings: [], status: "unavailable", unavailableCode: "independent-reviewer-nested-app-server-denied"
};
const authorization = {
  implementerSession: "implementer",
  degradedIndependentReview: { enabled: true, change: "change", transitions: ["merge-pr"], expiresAt: "2026-08-14T00:00:00.000Z", riskReason: "synthetic owner risk acceptance", fallbackBoundary: "fresh-separated-reviewer-only", baseCommit: reviewPackage.baseCommit, headCommit: reviewPackage.headCommit, manifestDigest: reviewPackage.manifestDigest },
  reviewLauncher: { enabled: true, change: "change", transitions: ["merge-pr"], expiresAt: "2026-08-14T00:00:00.000Z", boundary: "detached-exact-head-inner-read-only", launcherId: "codex-review-launcher", baseCommit: reviewPackage.baseCommit, headCommit: reviewPackage.headCommit, manifestDigest: reviewPackage.manifestDigest }
};
const launcher = { id: "codex-review-launcher", kind: "codex-detached-read-only-v1", hostScript: "scripts/sdd/review-launcher-host.mjs", enabled: true, executable: "/opt/tools/codex", detachedView: true, innerReadOnlySandbox: true, ephemeral: true, sealedPackageOnly: true, credentialScrubbed: true, nonInteractive: true };
const runtime = { permittedReviewLaunchers: ["codex-review-launcher"] };
const reviewer = { type: "codex-degraded", identity: "fresh-reviewer", attestation: { ref: "degraded-attestation" } };
const baseInput = { failureCode: strictResult.unavailableCode, authorization, selectedEntry: "change", transition: "merge-pr", reviewPackage, strictResult, launcher, runtime, repositoryPath: "/fixture", reviewer, attestationRef: "degraded-attestation", now: "2026-08-13T13:00:00.000Z" };

function validResult() {
  return {
    schemaVersion: 1, reviewRecordId: "degraded-record", executionId: "degraded-execution",
    reviewer: { type: "codex-degraded", identity: "fresh-reviewer", adapter: "codex" },
    attestation: { ref: "degraded-attestation", nonInteractive: true, isolatedContext: false, freshContext: true, readOnly: false },
    assuranceLevel: "authorized-degraded",
    capabilityLedger: { enforced: ["freshContext", "nonInteractive", "sealedPackageOnly", "detachedView", "innerReadOnlySandbox"], unavailable: [], instructionConstrained: ["workspaceWrite", "gitWrite", "githubMutation", "credentialAccess", "authenticatedNetwork", "externalSend", "deployment", "release", "delegatedMutation"] },
    strictUnavailable: { reviewRecordId: strictResult.reviewRecordId, executionId: strictResult.executionId, adapter: "codex", status: "unavailable", unavailableCode: strictResult.unavailableCode, baseCommit: reviewPackage.baseCommit, headCommit: reviewPackage.headCommit, manifestDigest: reviewPackage.manifestDigest },
    degradedAuthorization: { change: "change", transition: "merge-pr", expiresAt: "2026-08-14T00:00:00.000Z", riskReason: "synthetic owner risk acceptance", fallbackBoundary: "fresh-separated-reviewer-only" },
    baseCommit: reviewPackage.baseCommit, headCommit: reviewPackage.headCommit, manifestDigest: reviewPackage.manifestDigest,
    startedAt: "2026-08-13T13:00:00.000Z", completedAt: "2026-08-13T13:01:00.000Z", findings: [], status: "passed", unavailableCode: ""
  };
}

function hostRun(prepared, result = validResult(), viewHead = reviewPackage.headCommit, now = "2026-08-13T13:00:00.000Z", rebuiltPackage = reviewPackage) {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), "review-launcher-test-"));
  const reviewPath = path.join(temporaryRoot, "repository");
  fs.mkdirSync(path.join(reviewPath, "schemas"), { recursive: true });
  fs.writeFileSync(path.join(reviewPath, "schemas", "independent-review-findings-v1.schema.json"), "{}\n");
  const view = { kind: "detached-review-view-v1", repository: "/fixture", reviewPath, temporaryRoot, headCommit: viewHead, ownershipToken: "fixture", createdAt: "2026-08-13T13:00:00.000Z" };
  let removed = false;
  let invoked = false;
  const response = executeReviewLauncherHost(prepared.hostRequest, {
    hostExecutionId: "host-execution-1",
    now,
    createView: () => ({ available: true, view }),
    removeView: (received) => { removed = received === view; fs.rmSync(temporaryRoot, { recursive: true, force: true }); return { removed }; },
    rebuildPackage: (input) => {
      assert.equal(input.repositoryPath, reviewPath);
      assert.equal(input.baseCommit, prepared.hostRequest.request.reviewPackage.baseCommit);
      assert.equal(input.headCommit, prepared.hostRequest.request.reviewPackage.headCommit);
      assert.deepEqual(input.artifactPaths, prepared.hostRequest.request.reviewPackage.artifacts.map((artifact) => artifact.path));
      return { valid: true, package: rebuiltPackage };
    },
    invoke: (request) => { invoked = true; assert.equal(request.view, view); return { status: result.status, result }; }
  });
  return { response, removed, invoked };
}

function runtimeEvidence(prepared, response, selectedLauncher = launcher) {
  return { attestedBy: "trusted-runtime", outsideManagedSandbox: true, executionRef: "runtime:test:1", launcherId: selectedLauncher.id, launcherKind: selectedLauncher.kind, hostScript: selectedLauncher.hostScript, requestDigest: prepared.hostRequest.requestDigest, hostExecutionId: response.hostExecutionId };
}

test("recovery preflight requires exact authorization, fixed host, and runtime permission", () => {
  assert.equal(validateReviewLauncherRecovery(baseInput).allowed, true);
  assert.equal(validateReviewLauncherRecovery({ ...baseInput, runtime: {} }).code, "review-launcher-runtime-permission-required");
  assert.equal(validateReviewLauncherRecovery({ ...baseInput, launcher: { ...launcher, hostScript: "scripts/sdd/other.mjs" } }).code, "review-launcher-capability-unavailable");
  assert.equal(validateReviewLauncherRecovery({ ...baseInput, launcher: { ...launcher, executable: "/bin/sh" } }).code, "review-launcher-capability-unavailable");
  assert.equal(validateReviewLauncherRecovery({ ...baseInput, failureCode: "independent-reviewer-codex-execution-unavailable" }).code, "review-launcher-failure-not-recoverable");
});

test("controller prepares only a fixed external host request", () => {
  const prepared = prepareReviewLauncherRecovery(baseInput, { launchId: "launch-1" });
  assert.equal(prepared.allowed, true);
  assert.equal(prepared.status, "host-launch-required");
  assert.equal(prepared.hostRequest.request.launcher.hostScript, "scripts/sdd/review-launcher-host.mjs");
  assert.equal("now" in prepared.hostRequest.request, false);
  assert.match(prepared.hostRequest.requestDigest, /^[0-9a-f]{64}$/);
});

test("Claude launcher uses the same sealed host protocol with a read-tools-only boundary", () => {
  const claudeStrict = {
    ...strictResult,
    reviewer: { type: "claude", identity: "strict-reviewer", adapter: "claude" },
    unavailableCode: "independent-reviewer-claude-sandbox-unavailable"
  };
  const claudeLauncher = { id: "claude-review-launcher", kind: "claude-detached-restricted-v1", hostScript: "scripts/sdd/review-launcher-host.mjs", enabled: true, executable: "/opt/tools/claude", detachedView: true, readToolsOnly: true, ephemeral: true, sealedPackageOnly: true, credentialScrubbed: true, nonInteractive: true };
  const claudeAuthorization = {
    ...authorization,
    reviewLauncher: { ...authorization.reviewLauncher, launcherId: claudeLauncher.id, boundary: "detached-exact-head-read-tools-only" }
  };
  const claudeInput = {
    ...baseInput,
    failureCode: claudeStrict.unavailableCode,
    strictResult: claudeStrict,
    authorization: claudeAuthorization,
    launcher: claudeLauncher,
    runtime: { permittedReviewLaunchers: [claudeLauncher.id] },
    reviewer: { type: "claude-degraded", identity: "fresh-reviewer", attestation: { ref: "degraded-attestation" } }
  };
  const prepared = prepareReviewLauncherRecovery(claudeInput, { launchId: "claude-launch-1" });
  assert.equal(prepared.allowed, true, JSON.stringify(prepared));
  assert.equal(prepared.expectedRecovery.innerBoundary, "read-search-tools-only");
  const result = {
    ...validResult(),
    reviewer: { type: "claude-degraded", identity: "fresh-reviewer", adapter: "claude" },
    strictUnavailable: { ...validResult().strictUnavailable, adapter: "claude", unavailableCode: claudeStrict.unavailableCode },
    capabilityLedger: { enforced: ["freshContext", "nonInteractive", "sealedPackageOnly", "detachedView", "disabledMutationTools"], unavailable: [], instructionConstrained: ["workspaceWrite", "gitWrite", "githubMutation", "credentialAccess", "authenticatedNetwork", "externalSend", "deployment", "release", "delegatedMutation"] }
  };
  const { response } = hostRun(prepared, result);
  const accepted = acceptReviewLauncherHostResponse({ prepared, response, runtimeLaunchEvidence: runtimeEvidence(prepared, response, claudeLauncher) });
  assert.equal(accepted.allowed, true, JSON.stringify(accepted));
});

test("external host owns the detached view and acceptance requires the recorded runtime evidence shape", () => {
  const prepared = prepareReviewLauncherRecovery(baseInput, { launchId: "launch-1" });
  const { response, removed, invoked } = hostRun(prepared);
  assert.equal(response.allowed, true, JSON.stringify(response));
  assert.equal(invoked, true);
  assert.equal(removed, true);
  assert.equal(acceptReviewLauncherHostResponse({ prepared, response }).code, "review-launcher-runtime-attestation-missing");
  const accepted = acceptReviewLauncherHostResponse({ prepared, response, runtimeLaunchEvidence: runtimeEvidence(prepared, response) });
  assert.equal(accepted.allowed, true, JSON.stringify(accepted));
  assert.equal(accepted.status, "passed");
});

test("external host rederives the sealed package and fails closed before review on any mismatch", () => {
  const prepared = prepareReviewLauncherRecovery(baseInput, { launchId: "launch-rederive" });
  const changedDraft = { ...reviewPackage, diff: `${reviewPackage.diff}omitted committed change\n` };
  delete changedDraft.manifestDigest;
  const changedPackage = { ...changedDraft, manifestDigest: packageDigest(changedDraft) };
  const { response, removed, invoked } = hostRun(prepared, validResult(), reviewPackage.headCommit, "2026-08-13T13:00:00.000Z", changedPackage);
  assert.equal(response.code, "review-launcher-package-mismatch");
  assert.equal(invoked, false);
  assert.equal(removed, true);
});

test("host cleans a mismatched view without invoking the reviewer", () => {
  const prepared = prepareReviewLauncherRecovery(baseInput, { launchId: "launch-1" });
  const { response, removed, invoked } = hostRun(prepared, validResult(), "4".repeat(40));
  assert.equal(response.code, "review-launcher-detached-view-unavailable");
  assert.equal(removed, true);
  assert.equal(invoked, false);
});

test("acceptance authenticates exact precursor, authorization, and host execution bindings", () => {
  const prepared = prepareReviewLauncherRecovery(baseInput, { launchId: "launch-1" });
  const { response } = hostRun(prepared);
  const evidence = runtimeEvidence(prepared, response);
  for (const strictUnavailable of [
    { ...response.result.strictUnavailable, reviewRecordId: "different-record" },
    { ...response.result.strictUnavailable, executionId: "different-execution" },
    { ...response.result.strictUnavailable, adapter: "different-adapter" }
  ]) {
    assert.equal(acceptReviewLauncherHostResponse({ prepared, response: { ...response, result: { ...response.result, strictUnavailable } }, runtimeLaunchEvidence: evidence }).code, "review-launcher-strict-unavailable-mismatch");
  }
  for (const degradedAuthorization of [
    { ...response.result.degradedAuthorization, expiresAt: "2026-08-14T00:00:01.000Z" },
    { ...response.result.degradedAuthorization, riskReason: "different risk" }
  ]) {
    assert.equal(acceptReviewLauncherHostResponse({ prepared, response: { ...response, result: { ...response.result, degradedAuthorization } }, runtimeLaunchEvidence: evidence }).code, "review-launcher-degraded-authorization-mismatch");
  }
  assert.equal(acceptReviewLauncherHostResponse({ prepared, response, runtimeLaunchEvidence: { ...evidence, outsideManagedSandbox: false } }).code, "review-launcher-runtime-attestation-missing");
});

test("host execution and controller acceptance each use their current clock", () => {
  const prepared = prepareReviewLauncherRecovery(baseInput, { launchId: "launch-1" });
  const expiredHost = hostRun(prepared, validResult(), reviewPackage.headCommit, "2026-08-14T00:00:00.000Z");
  assert.equal(expiredHost.response.code, "degraded-independent-review-authorization-expired");
  const { response } = hostRun(prepared);
  const evidence = runtimeEvidence(prepared, response);
  assert.equal(acceptReviewLauncherHostResponse({ prepared, response, runtimeLaunchEvidence: evidence, now: "2026-08-14T00:00:00.000Z" }).code, "degraded-independent-review-authorization-expired");
});

test("recovery accepts a durable derived objective-correction chain", () => {
  const derivedDraft = { ...reviewPackage, headCommit: "5".repeat(40) }; delete derivedDraft.manifestDigest;
  const derived = { ...derivedDraft, manifestDigest: packageDigest(derivedDraft) };
  const derivedStrict = { ...strictResult, headCommit: derived.headCommit, manifestDigest: derived.manifestDigest };
  const correctionEvidence = { id: "correction-1", change: "change", attempt: 1, failureSignature: "fixture-failure", classification: "objective-fix", behaviorPreserving: true, current: true, ancestryVerified: true, evidenceReference: "checkpoint:correction-1", baseCommit: derived.baseCommit, previousHead: reviewPackage.headCommit, previousManifestDigest: reviewPackage.manifestDigest, headCommit: derived.headCommit, manifestDigest: derived.manifestDigest };
  const derivedAuthorization = { ...authorization, degradedIndependentReview: { ...authorization.degradedIndependentReview, allowDerivedObjectiveCorrections: true, derivedCorrections: [correctionEvidence] }, reviewLauncher: { ...authorization.reviewLauncher, headCommit: derived.headCommit, manifestDigest: derived.manifestDigest } };
  const result = validateReviewLauncherRecovery({ ...baseInput, reviewPackage: derived, strictResult: derivedStrict, authorization: derivedAuthorization, correctionAttempts: 1, derivedCorrection: true, correctionEvidence });
  assert.equal(result.allowed, true, JSON.stringify(result));
});
