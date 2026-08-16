import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { executeAuthorizedIndependentReview, executeIndependentReview, probeDegradedIndependentReviewAdapter, probeIndependentReviewAdapter } from "../execute-independent-review.mjs";
import { packageDigest } from "../independent-review-contract.mjs";
import { validateIndependentReviewV1 } from "../independent-review.mjs";
const file = (name) => JSON.parse(fs.readFileSync(new URL(`../../../evals/skills/independent-review/fixtures/${name}`, import.meta.url), "utf8"));
const adapter = { adapter: "fixture", attestationRef: "fixture-attestation", probeReference: "fixture-probe", runtimeEnforced: true, freshContext: true, readOnlyView: true, nonInteractive: true, denied: { workspaceWrite: true, gitWrite: true, githubMutation: true, credentialAccess: true, authenticatedNetwork: true, externalSend: true, deployment: true, release: true, delegatedMutation: true } };
test("capability probe fails closed and executor accepts only a validated immutable result", async () => {
  assert.equal(probeIndependentReviewAdapter({ ...adapter, denied: { ...adapter.denied, gitWrite: false } }).available, false);
  const reviewPackage = file("valid-package.json"); reviewPackage.manifestDigest = packageDigest(reviewPackage);
  const result = file("valid-result.json"); result.manifestDigest = reviewPackage.manifestDigest;
  const out = await executeIndependentReview({ package: reviewPackage, adapter, configuredReviewer: { type: "fixture", identity: "fresh-reviewer", attestation: { ref: "fixture-attestation" } }, implementerSession: "implementer", invoke: async () => result });
  assert.equal(out.status, "passed");
  const unavailable = { ...result, status: "unavailable", unavailableCode: "fixture-runtime-unavailable", attestation: { ...result.attestation, nonInteractive: false, isolatedContext: false, freshContext: false, readOnly: false } };
  const diagnostic = { schemaVersion: 1, stage: "reviewer-execution", operation: "fixture-strict-review", code: unavailable.unavailableCode, category: "runtime-unavailable", subject: "reviewer-executable", exitCode: 1, safeMessage: "Fixture runtime is unavailable." };
  const diagnosticOut = await executeIndependentReview({ package: reviewPackage, adapter, configuredReviewer: { type: "fixture", identity: "fresh-reviewer", attestation: { ref: "fixture-attestation" } }, implementerSession: "implementer", invoke: async () => ({ status: "unavailable", result: unavailable, diagnostic }) });
  assert.deepEqual(diagnosticOut.diagnostic, diagnostic);
  assert.equal((await executeIndependentReview({ package: reviewPackage, adapter: {}, invoke: async () => result })).status, "unavailable");
});

test("degraded execution is strict-first and requires the explicit sealed-package authorization", async () => {
  const reviewPackage = file("valid-package.json"); reviewPackage.manifestDigest = packageDigest(reviewPackage);
  const strictReviewer = { type: "strict", identity: "strict-reviewer", attestation: { ref: "strict-attestation" } };
  const degradedReviewer = { type: "degraded", identity: "degraded-reviewer", attestation: { ref: "degraded-attestation" } };
  const authorization = { expiresAt: "2026-08-14T00:00:00.000Z", degradedIndependentReview: { enabled: true, change: "change", transitions: ["merge-pr"], expiresAt: "2026-08-14T00:00:00.000Z", riskReason: "synthetic exact fallback", fallbackBoundary: "fresh-separated-reviewer-only", baseCommit: reviewPackage.baseCommit, headCommit: reviewPackage.headCommit, manifestDigest: reviewPackage.manifestDigest } };
  const strictUnavailable = {
    schemaVersion: 1,
    reviewRecordId: `strict-unavailable-${reviewPackage.manifestDigest.slice(0, 12)}`,
    executionId: `strict-unavailable-${reviewPackage.headCommit.slice(0, 12)}`,
    reviewer: { type: "strict", identity: "strict-reviewer", adapter: "strict" },
    attestation: { ref: "strict-attestation", nonInteractive: false, isolatedContext: false, freshContext: false, readOnly: false },
    assuranceLevel: "strict-isolated",
    baseCommit: reviewPackage.baseCommit,
    headCommit: reviewPackage.headCommit,
    manifestDigest: reviewPackage.manifestDigest,
    startedAt: new Date(0).toISOString(),
    completedAt: new Date(0).toISOString(),
    findings: [],
    status: "unavailable",
    unavailableCode: "independent-reviewer-not-isolated-read-only"
  };
  const degraded = file("valid-result.json");
  Object.assign(degraded, { reviewRecordId: "degraded-record", executionId: "degraded-execution", reviewer: { type: "degraded", identity: "degraded-reviewer", adapter: "degraded" }, attestation: { ref: "degraded-attestation", nonInteractive: true, isolatedContext: false, freshContext: true, readOnly: false }, assuranceLevel: "authorized-degraded", manifestDigest: reviewPackage.manifestDigest, capabilityLedger: { enforced: ["githubMutation", "deployment", "release", "externalSend", "delegatedMutation"], unavailable: ["workspaceWrite", "gitWrite", "credentialAccess", "authenticatedNetwork", "authenticatedParentLaunchEvidence", "hostPinnedReviewerExecutableIdentity"], instructionConstrained: [] }, strictUnavailable: { reviewRecordId: strictUnavailable.reviewRecordId, executionId: strictUnavailable.executionId, adapter: "strict", status: "unavailable", unavailableCode: strictUnavailable.unavailableCode, baseCommit: reviewPackage.baseCommit, headCommit: reviewPackage.headCommit, manifestDigest: reviewPackage.manifestDigest }, degradedAuthorization: { change: "change", transition: "merge-pr", expiresAt: "2026-08-14T00:00:00.000Z", riskReason: "synthetic exact fallback", fallbackBoundary: "fresh-separated-reviewer-only" } });
  const calls = [];
  const common = { package: reviewPackage, strictAdapter: {}, degradedAdapter: { freshContext: true, nonInteractive: true, detachedView: true, sealedPackageOnly: true, disabledMutationTools: true, credentialScrubbed: true }, configuredReviewer: strictReviewer, degradedReviewer, implementerSession: "implementer", authorization, selectedEntry: "change", now: "2026-08-13T00:00:00.000Z", clock: () => "2026-08-13T00:00:01.000Z", invokeStrict: async () => { calls.push("strict"); return degraded; }, invokeDegraded: async (received) => { calls.push("degraded"); assert.notEqual(received, reviewPackage); return degraded; } };
  const pending = await executeAuthorizedIndependentReview(common);
  assert.equal(pending.code, "strict-unavailable-evidence-not-durable");
  assert.equal(pending.requiresPersistence, true);
  assert.deepEqual(calls, []);
  const durable = { reference: "checkpoint:strict-unavailable", current: true, result: strictUnavailable };
  for (const result of [
    { ...strictUnavailable, reviewer: { ...strictUnavailable.reviewer, adapter: "different-adapter" } },
    { ...strictUnavailable, attestation: { ...strictUnavailable.attestation, ref: "different-attestation" } }
  ]) {
    const mismatchedDurable = await executeAuthorizedIndependentReview({ ...common, durableStrictUnavailable: { ...durable, result } });
    assert.equal(mismatchedDurable.code, "strict-unavailable-evidence-not-durable");
  }
  const out = await executeAuthorizedIndependentReview({ ...common, durableStrictUnavailable: durable });
  assert.equal(out.status, "passed", JSON.stringify(out));
  assert.deepEqual(calls, ["degraded"]);
  calls.length = 0;
  const expiredDuringReview = await executeAuthorizedIndependentReview({
    ...common,
    durableStrictUnavailable: durable,
    clock: () => "2026-08-14T00:00:00.000Z"
  });
  assert.equal(expiredDuringReview.code, "degraded-independent-review-authorization-expired");
  assert.deepEqual(calls, ["degraded"], "the post-invocation check must reject a result completed at expiration");
  calls.length = 0;
  for (const strictUnavailableSummary of [
    { ...degraded.strictUnavailable, reviewRecordId: "different-record" },
    { ...degraded.strictUnavailable, executionId: "different-execution" },
    { ...degraded.strictUnavailable, adapter: "different-adapter" }
  ]) {
    const badStrictSummary = await executeAuthorizedIndependentReview({ ...common, durableStrictUnavailable: durable, invokeDegraded: async () => ({ ...degraded, strictUnavailable: strictUnavailableSummary }) });
    assert.equal(badStrictSummary.code, "independent-review-strict-unavailable-not-durable");
  }
  for (const degradedAuthorization of [
    { ...degraded.degradedAuthorization, riskReason: "different risk" },
    { ...degraded.degradedAuthorization, expiresAt: "2026-08-14T00:00:01.000Z" }
  ]) {
    const badAuthorization = await executeAuthorizedIndependentReview({ ...common, durableStrictUnavailable: durable, invokeDegraded: async () => ({ ...degraded, degradedAuthorization }) });
    assert.equal(badAuthorization.code, "independent-review-degraded-authorization-mismatch");
  }
  assert.equal(probeDegradedIndependentReviewAdapter({}).available, false);
});

test("degraded execution resumes from the durable adapter-emitted strict result", async () => {
  const reviewPackage = file("valid-package.json"); reviewPackage.manifestDigest = packageDigest(reviewPackage);
  const configuredReviewer = { type: "strict", identity: "strict-reviewer", attestation: { ref: "strict-attestation" } };
  const degradedReviewer = { type: "degraded", identity: "degraded-reviewer", attestation: { ref: "degraded-attestation" } };
  const strictUnavailable = (suffix) => ({
    schemaVersion: 1, reviewRecordId: `strict-record-${suffix}`, executionId: `strict-execution-${suffix}`,
    reviewer: { type: "strict", identity: "strict-reviewer", adapter: "strict" },
    attestation: { ref: "strict-attestation", nonInteractive: false, isolatedContext: false, freshContext: false, readOnly: false },
    assuranceLevel: "strict-isolated", baseCommit: reviewPackage.baseCommit, headCommit: reviewPackage.headCommit,
    manifestDigest: reviewPackage.manifestDigest, startedAt: `2026-08-13T00:00:0${suffix}.000Z`,
    completedAt: `2026-08-13T00:00:1${suffix}.000Z`, findings: [], status: "unavailable",
    unavailableCode: "independent-reviewer-codex-execution-unavailable"
  });
  const firstStrict = strictUnavailable("1");
  const secondStrict = strictUnavailable("2");
  const degraded = file("valid-result.json");
  Object.assign(degraded, {
    reviewer: { type: "degraded", identity: "degraded-reviewer", adapter: "degraded" },
    attestation: { ref: "degraded-attestation", nonInteractive: true, isolatedContext: false, freshContext: true, readOnly: false },
    assuranceLevel: "authorized-degraded", manifestDigest: reviewPackage.manifestDigest,
    capabilityLedger: { enforced: ["githubMutation", "deployment", "release", "externalSend", "delegatedMutation"], unavailable: ["workspaceWrite", "gitWrite", "credentialAccess", "authenticatedNetwork", "authenticatedParentLaunchEvidence", "hostPinnedReviewerExecutableIdentity"], instructionConstrained: [] },
    strictUnavailable: { reviewRecordId: firstStrict.reviewRecordId, executionId: firstStrict.executionId, adapter: "strict", status: "unavailable", unavailableCode: firstStrict.unavailableCode, baseCommit: reviewPackage.baseCommit, headCommit: reviewPackage.headCommit, manifestDigest: reviewPackage.manifestDigest },
    degradedAuthorization: { change: "change", transition: "merge-pr", expiresAt: "2026-08-14T00:00:00.000Z", riskReason: "synthetic exact fallback", fallbackBoundary: "fresh-separated-reviewer-only" }
  });
  const authorization = { expiresAt: "2026-08-14T00:00:00.000Z", degradedIndependentReview: { enabled: true, change: "change", transitions: ["merge-pr"], expiresAt: "2026-08-14T00:00:00.000Z", riskReason: "synthetic exact fallback", fallbackBoundary: "fresh-separated-reviewer-only", baseCommit: reviewPackage.baseCommit, headCommit: reviewPackage.headCommit, manifestDigest: reviewPackage.manifestDigest } };
  let strictCalls = 0;
  const common = { package: reviewPackage, strictAdapter: adapter, degradedAdapter: { freshContext: true, nonInteractive: true, detachedView: true, sealedPackageOnly: true, disabledMutationTools: true, credentialScrubbed: true }, configuredReviewer, degradedReviewer, implementerSession: "implementer", authorization, selectedEntry: "change", now: "2026-08-13T00:00:00.000Z", clock: () => "2026-08-13T00:00:01.000Z", invokeStrict: async () => (++strictCalls === 1 ? firstStrict : secondStrict), invokeDegraded: async () => degraded };
  const first = await executeAuthorizedIndependentReview(common);
  assert.equal(first.code, "strict-unavailable-evidence-not-durable");
  assert.equal(first.strictResult, firstStrict);
  const resumed = await executeAuthorizedIndependentReview({ ...common, durableStrictUnavailable: { reference: "checkpoint:strict", current: true, result: firstStrict } });
  assert.equal(resumed.status, "passed", JSON.stringify(resumed));
  assert.equal(strictCalls, 1, "resume must reuse the authenticated durable exact-package strict result");
});

test("synthesized strict-unavailable evidence is current enough for the degraded delivery gate", async () => {
  const reviewPackage = file("valid-package.json"); reviewPackage.manifestDigest = packageDigest(reviewPackage);
  const configuredReviewer = { type: "strict", identity: "strict-reviewer", available: true, attestation: { ref: "strict-attestation" } };
  const degradedReviewer = { type: "degraded", identity: "degraded-reviewer", available: true, attestation: { ref: "degraded-attestation" } };
  const applyEvidence = { reference: "apply-current", current: true, headCommit: reviewPackage.headCommit, completedAt: "2026-08-13T00:00:00.000Z", validationEvidence: reviewPackage.validationEvidence };
  const authorization = { expiresAt: "2026-08-14T00:00:00.000Z", degradedIndependentReview: { enabled: true, change: "change", transitions: ["merge-pr"], expiresAt: "2026-08-14T00:00:00.000Z", riskReason: "synthetic exact fallback", fallbackBoundary: "fresh-separated-reviewer-only", baseCommit: reviewPackage.baseCommit, headCommit: reviewPackage.headCommit, manifestDigest: reviewPackage.manifestDigest } };
  const common = {
    package: reviewPackage, strictAdapter: {}, configuredReviewer, degradedReviewer,
    degradedAdapter: { freshContext: true, nonInteractive: true, detachedView: true, sealedPackageOnly: true, disabledMutationTools: true, credentialScrubbed: true },
    implementerSession: "implementer", authorization, selectedEntry: "change",
    now: "2026-08-13T00:00:01.000Z", clock: () => "2026-08-13T00:00:02.000Z"
  };
  const pending = await executeAuthorizedIndependentReview(common);
  assert.equal(pending.code, "strict-unavailable-evidence-not-durable");
  assert.equal(pending.strictResult.startedAt, "2026-08-13T00:00:02.000Z");
  assert.equal(pending.strictResult.completedAt, pending.strictResult.startedAt);

  const result = file("valid-result.json");
  Object.assign(result, {
    reviewRecordId: "degraded-after-apply", executionId: "degraded-after-apply-execution",
    reviewer: { type: "degraded", identity: "degraded-reviewer", adapter: "degraded" },
    attestation: { ref: "degraded-attestation", nonInteractive: true, isolatedContext: false, freshContext: true, readOnly: false },
    assuranceLevel: "authorized-degraded", manifestDigest: reviewPackage.manifestDigest,
    startedAt: "2026-08-13T00:00:03.000Z", completedAt: "2026-08-13T00:00:04.000Z",
    capabilityLedger: { enforced: ["githubMutation", "deployment", "release", "externalSend", "delegatedMutation"], unavailable: ["workspaceWrite", "gitWrite", "credentialAccess", "authenticatedNetwork", "authenticatedParentLaunchEvidence", "hostPinnedReviewerExecutableIdentity"], instructionConstrained: [] },
    strictUnavailable: { reviewRecordId: pending.strictResult.reviewRecordId, executionId: pending.strictResult.executionId, adapter: "strict", status: "unavailable", unavailableCode: pending.strictResult.unavailableCode, baseCommit: reviewPackage.baseCommit, headCommit: reviewPackage.headCommit, manifestDigest: reviewPackage.manifestDigest },
    degradedAuthorization: { change: "change", transition: "merge-pr", expiresAt: "2026-08-14T00:00:00.000Z", riskReason: "synthetic exact fallback", fallbackBoundary: "fresh-separated-reviewer-only" }
  });
  const completed = await executeAuthorizedIndependentReview({
    ...common,
    durableStrictUnavailable: { reference: "checkpoint:strict-current", current: true, result: pending.strictResult },
    invokeDegraded: async () => result
  });
  assert.equal(completed.status, "passed", JSON.stringify(completed));
  const deliveryGate = validateIndependentReviewV1({
    reviewer: configuredReviewer, degradedReviewer, authorization, selectedEntry: "change",
    implementerSession: "implementer", reviewPackage, reviewResult: completed.result,
    strictUnavailableResult: pending.strictResult, applyEvidence, now: "2026-08-13T00:00:05.000Z"
  });
  assert.equal(deliveryGate.allowed, true, JSON.stringify(deliveryGate));
});

test("production orchestration automatically consumes recoverable host requests", async () => {
  const reviewPackage = file("valid-package.json"); reviewPackage.manifestDigest = packageDigest(reviewPackage);
  const configuredReviewer = { type: "codex", identity: "strict-reviewer", attestation: { ref: "strict-attestation" } };
  const degradedReviewer = { type: "codex-degraded", identity: "fresh-reviewer", attestation: { ref: "degraded-attestation" } };
  const strictUnavailable = {
    schemaVersion: 1, reviewRecordId: "strict-runtime-record", executionId: "strict-runtime-execution",
    reviewer: { type: "codex", identity: "strict-reviewer", adapter: "codex" },
    attestation: { ref: "strict-attestation", nonInteractive: false, isolatedContext: false, freshContext: false, readOnly: false },
    assuranceLevel: "strict-isolated", baseCommit: reviewPackage.baseCommit, headCommit: reviewPackage.headCommit,
    manifestDigest: reviewPackage.manifestDigest, startedAt: "2026-08-13T00:00:00.000Z",
    completedAt: "2026-08-13T00:00:01.000Z", findings: [], status: "unavailable",
    unavailableCode: "independent-reviewer-nested-app-server-denied"
  };
  const authorization = {
    expiresAt: "2026-08-14T00:00:00.000Z",
    implementerSession: "implementer",
    degradedIndependentReview: { enabled: true, change: "change", transitions: ["merge-pr"], expiresAt: "2026-08-14T00:00:00.000Z", riskReason: "synthetic exact fallback", fallbackBoundary: "fresh-separated-reviewer-only", baseCommit: reviewPackage.baseCommit, headCommit: reviewPackage.headCommit, manifestDigest: reviewPackage.manifestDigest },
    reviewLauncher: { enabled: true, change: "change", transitions: ["merge-pr"], expiresAt: "2026-08-14T00:00:00.000Z", boundary: "detached-exact-head-inner-read-only", launcherId: "codex-review-launcher", baseCommit: reviewPackage.baseCommit, headCommit: reviewPackage.headCommit, manifestDigest: reviewPackage.manifestDigest },
    reviewWorktreeLifecycle: { enabled: true, operation: "create-detached-review-worktree-v1", change: "change", transitions: ["merge-pr"], expiresAt: "2026-08-14T00:00:00.000Z", repositoryPath: "/fixture", baseCommit: reviewPackage.baseCommit, headCommit: reviewPackage.headCommit, manifestDigest: reviewPackage.manifestDigest }
  };
  const launcherRecovery = {
    launcher: { id: "codex-review-launcher", kind: "codex-detached-read-only-v1", hostScript: "scripts/sdd/review-launcher-host.mjs", enabled: true, executable: "/opt/tools/codex", detachedView: true, innerReadOnlySandbox: true, ephemeral: true, sealedPackageOnly: true, credentialScrubbed: true, nonInteractive: true },
    runtime: { permittedReviewLaunchers: ["codex-review-launcher"] },
    repositoryPath: "/fixture",
    attestationRef: "degraded-attestation"
  };
  const result = file("valid-result.json");
  Object.assign(result, {
    reviewRecordId: "runtime-degraded-record", executionId: "runtime-degraded-execution",
    reviewer: { type: "codex-degraded", identity: "fresh-reviewer", adapter: "codex" },
    attestation: { ref: "degraded-attestation", nonInteractive: true, isolatedContext: false, freshContext: true, readOnly: false },
    assuranceLevel: "authorized-degraded", manifestDigest: reviewPackage.manifestDigest,
    capabilityLedger: { enforced: ["freshContext", "nonInteractive", "sealedPackageOnly", "detachedView", "innerReadOnlySandbox"], unavailable: ["authenticatedParentLaunchEvidence", "hostPinnedReviewerExecutableIdentity"], instructionConstrained: ["workspaceWrite", "gitWrite", "githubMutation", "credentialAccess", "authenticatedNetwork", "externalSend", "deployment", "release", "delegatedMutation"] },
    strictUnavailable: { reviewRecordId: strictUnavailable.reviewRecordId, executionId: strictUnavailable.executionId, adapter: "codex", status: "unavailable", unavailableCode: strictUnavailable.unavailableCode, baseCommit: reviewPackage.baseCommit, headCommit: reviewPackage.headCommit, manifestDigest: reviewPackage.manifestDigest },
    degradedAuthorization: { change: "change", transition: "merge-pr", expiresAt: "2026-08-14T00:00:00.000Z", riskReason: "synthetic exact fallback", fallbackBoundary: "fresh-separated-reviewer-only" }
  });
  const common = {
    package: reviewPackage, strictAdapter: {}, configuredReviewer, degradedReviewer,
    implementerSession: "implementer", authorization, selectedEntry: "change",
    durableStrictUnavailable: { reference: "checkpoint:strict", current: true, result: strictUnavailable },
    launcherRecovery, now: "2026-08-13T00:00:00.000Z", clock: () => "2026-08-13T00:00:01.000Z",
    invokeDegraded: async () => { throw new Error("direct degraded invocation must not run"); }
  };
  let transportCalls = 0;
  const completed = await executeAuthorizedIndependentReview({
    ...common,
    invokePreparedReviewHost: async (prepared) => {
      transportCalls += 1;
      const response = {
        allowed: true, status: "passed", code: "review-launcher-host-complete",
        launchId: prepared.hostRequest.launchId, requestDigest: prepared.hostRequest.requestDigest,
        launcherId: "codex-review-launcher", launcherKind: "codex-detached-read-only-v1",
        hostScript: "scripts/sdd/review-launcher-host.mjs", hostExecutionId: "host-runtime-execution",
        worktreeLifecycle: { operation: prepared.expectedRecovery.worktreeLifecycle.operation, requestDigest: prepared.worktreeLifecycleRequest.requestDigest, expiresAt: prepared.expectedRecovery.worktreeLifecycle.expiresAt },
        result, launcherEvidence: prepared.expectedRecovery, cleanup: { removed: true }
      };
      return {
        status: "executed",
        response,
        runtimeReceipt: { schemaVersion: 1, source: "codex-exec-tool", status: "executed", securityVerifiable: false, outsideManagedSandbox: true, executionRef: "codex-exec-tool:fixture", launcherId: response.launcherId, launcherKind: response.launcherKind, hostScript: response.hostScript, requestDigest: response.requestDigest, hostExecutionId: response.hostExecutionId }
      };
    }
  });
  assert.equal(transportCalls, 1);
  assert.equal(completed.status, "passed", JSON.stringify(completed));
  assert.equal(completed.runtimeReceipt.source, "codex-exec-tool");
  assert.equal(completed.assuranceLevel, "authorized-degraded");

  const unavailable = await executeAuthorizedIndependentReview(common);
  assert.equal(unavailable.code, "review-launcher-runtime-transport-unavailable");
  assert.equal(unavailable.terminal, true);
  assert.equal(unavailable.manualFallback, false);
  assert.notEqual(unavailable.code, "review-launcher-external-host-required");

  const unconfigured = await executeAuthorizedIndependentReview({ ...common, launcherRecovery: undefined });
  assert.equal(unconfigured.code, "review-launcher-runtime-transport-unavailable");
  assert.equal(unconfigured.terminal, true);
  assert.equal(unconfigured.manualFallback, false);
});
