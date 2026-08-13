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

function hostRun(prepared, result = validResult(), viewHead = reviewPackage.headCommit) {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), "review-launcher-test-"));
  const reviewPath = path.join(temporaryRoot, "repository");
  fs.mkdirSync(path.join(reviewPath, "schemas"), { recursive: true });
  fs.writeFileSync(path.join(reviewPath, "schemas", "independent-review-findings-v1.schema.json"), "{}\n");
  const view = { kind: "detached-review-view-v1", repository: "/fixture", reviewPath, temporaryRoot, headCommit: viewHead, ownershipToken: "fixture", createdAt: "2026-08-13T13:00:00.000Z" };
  let removed = false;
  let invoked = false;
  const response = executeReviewLauncherHost(prepared.hostRequest, {
    hostExecutionId: "host-execution-1",
    createView: () => ({ available: true, view }),
    removeView: (received) => { removed = received === view; fs.rmSync(temporaryRoot, { recursive: true, force: true }); return { removed }; },
    invoke: (request) => { invoked = true; assert.equal(request.view, view); return { status: result.status, result }; }
  });
  return { response, removed, invoked };
}

function runtimeEvidence(prepared, response) {
  return { attestedBy: "trusted-runtime", outsideManagedSandbox: true, executionRef: "runtime:test:1", launcherId: launcher.id, launcherKind: launcher.kind, hostScript: launcher.hostScript, requestDigest: prepared.hostRequest.requestDigest, hostExecutionId: response.hostExecutionId };
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
  assert.match(prepared.hostRequest.requestDigest, /^[0-9a-f]{64}$/);
});

test("external host owns the detached view and acceptance requires trusted runtime evidence", () => {
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

test("recovery accepts a durable derived objective-correction chain", () => {
  const derivedDraft = { ...reviewPackage, headCommit: "5".repeat(40) }; delete derivedDraft.manifestDigest;
  const derived = { ...derivedDraft, manifestDigest: packageDigest(derivedDraft) };
  const derivedStrict = { ...strictResult, headCommit: derived.headCommit, manifestDigest: derived.manifestDigest };
  const correctionEvidence = { id: "correction-1", change: "change", attempt: 1, failureSignature: "fixture-failure", classification: "objective-fix", behaviorPreserving: true, current: true, ancestryVerified: true, evidenceReference: "checkpoint:correction-1", baseCommit: derived.baseCommit, previousHead: reviewPackage.headCommit, previousManifestDigest: reviewPackage.manifestDigest, headCommit: derived.headCommit, manifestDigest: derived.manifestDigest };
  const derivedAuthorization = { ...authorization, degradedIndependentReview: { ...authorization.degradedIndependentReview, allowDerivedObjectiveCorrections: true, derivedCorrections: [correctionEvidence] }, reviewLauncher: { ...authorization.reviewLauncher, headCommit: derived.headCommit, manifestDigest: derived.manifestDigest } };
  const result = validateReviewLauncherRecovery({ ...baseInput, reviewPackage: derived, strictResult: derivedStrict, authorization: derivedAuthorization, correctionAttempts: 0, derivedCorrection: true, correctionEvidence });
  assert.equal(result.allowed, true, JSON.stringify(result));
});
