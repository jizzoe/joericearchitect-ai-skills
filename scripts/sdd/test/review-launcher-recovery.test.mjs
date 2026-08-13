import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { packageDigest } from "../independent-review-contract.mjs";
import { executeReviewLauncherRecovery, validateReviewLauncherRecovery } from "../review-launcher-recovery.mjs";

const reviewPackage = (() => {
  const draft = {
    schemaVersion: 1,
    baseCommit: "1".repeat(40),
    headCommit: "2".repeat(40),
    diff: "diff --git a/file b/file\n",
    artifacts: [{ path: "file", sha256: "3".repeat(64), bytes: 4 }],
    validationEvidence: ["node --test: passed"]
  };
  return { ...draft, manifestDigest: packageDigest(draft) };
})();
const strictResult = {
  schemaVersion: 1,
  reviewRecordId: "strict-unavailable-record",
  executionId: "strict-unavailable-execution",
  reviewer: { type: "codex", identity: "strict-reviewer", adapter: "codex" },
  attestation: { ref: "strict-attestation", nonInteractive: false, isolatedContext: false, freshContext: false, readOnly: false },
  assuranceLevel: "strict-isolated",
  baseCommit: reviewPackage.baseCommit,
  headCommit: reviewPackage.headCommit,
  manifestDigest: reviewPackage.manifestDigest,
  startedAt: "2026-08-13T12:00:00.000Z",
  completedAt: "2026-08-13T12:00:01.000Z",
  findings: [],
  status: "unavailable",
  unavailableCode: "independent-reviewer-nested-app-server-denied"
};
const authorization = {
  implementerSession: "implementer",
  degradedIndependentReview: {
    enabled: true,
    change: "change",
    transitions: ["merge-pr"],
    expiresAt: "2026-08-14T00:00:00.000Z",
    riskReason: "synthetic owner risk acceptance",
    fallbackBoundary: "fresh-separated-reviewer-only",
    baseCommit: reviewPackage.baseCommit,
    headCommit: reviewPackage.headCommit,
    manifestDigest: reviewPackage.manifestDigest
  },
  reviewLauncher: {
    enabled: true,
    change: "change",
    transitions: ["merge-pr"],
    expiresAt: "2026-08-14T00:00:00.000Z",
    boundary: "detached-exact-head-inner-read-only",
    launcherId: "codex-review-launcher",
    baseCommit: reviewPackage.baseCommit,
    headCommit: reviewPackage.headCommit,
    manifestDigest: reviewPackage.manifestDigest
  }
};
const launcher = {
  id: "codex-review-launcher",
  kind: "codex-detached-read-only-v1",
  enabled: true,
  executable: "/opt/tools/codex",
  detachedView: true,
  innerReadOnlySandbox: true,
  ephemeral: true,
  sealedPackageOnly: true,
  credentialScrubbed: true,
  nonInteractive: true
};
const runtime = { permittedReviewLaunchers: ["codex-review-launcher"] };
const baseInput = { failureCode: strictResult.unavailableCode, authorization, selectedEntry: "change", transition: "merge-pr", reviewPackage, strictResult, launcher, runtime, now: "2026-08-13T13:00:00.000Z" };

test("launcher recovery requires exact authorization, strict failure, configured capability, and runtime permission", () => {
  assert.equal(validateReviewLauncherRecovery(baseInput).allowed, true);
  assert.equal(validateReviewLauncherRecovery({ ...baseInput, runtime: {} }).code, "review-launcher-runtime-permission-required");
  assert.equal(validateReviewLauncherRecovery({ ...baseInput, authorization: { ...authorization, reviewLauncher: { ...authorization.reviewLauncher, headCommit: "4".repeat(40) } } }).code, "review-launcher-package-mismatch");
  assert.equal(validateReviewLauncherRecovery({ ...baseInput, launcher: { ...launcher, executable: "/bin/sh" } }).code, "review-launcher-capability-unavailable");
  assert.equal(validateReviewLauncherRecovery({ ...baseInput, failureCode: "independent-reviewer-codex-execution-unavailable" }).code, "review-launcher-failure-not-recoverable");
  assert.equal(validateReviewLauncherRecovery({ ...baseInput, now: "2026-08-14T00:00:00.000Z" }).code, "degraded-independent-review-authorization-expired");
});

test("launcher recovery accepts a durable derived objective-correction chain", () => {
  const derivedDraft = { ...reviewPackage, headCommit: "5".repeat(40) };
  delete derivedDraft.manifestDigest;
  const derived = { ...derivedDraft, manifestDigest: packageDigest(derivedDraft) };
  const derivedStrict = { ...strictResult, headCommit: derived.headCommit, manifestDigest: derived.manifestDigest };
  const correctionEvidence = { id: "correction-1", change: "change", attempt: 1, failureSignature: "fixture-failure", classification: "objective-fix", behaviorPreserving: true, current: true, ancestryVerified: true, evidenceReference: "checkpoint:correction-1", baseCommit: derived.baseCommit, previousHead: reviewPackage.headCommit, previousManifestDigest: reviewPackage.manifestDigest, headCommit: derived.headCommit, manifestDigest: derived.manifestDigest };
  const derivedAuthorization = {
    ...authorization,
    degradedIndependentReview: { ...authorization.degradedIndependentReview, allowDerivedObjectiveCorrections: true, derivedCorrections: [correctionEvidence] },
    reviewLauncher: { ...authorization.reviewLauncher, headCommit: derived.headCommit, manifestDigest: derived.manifestDigest }
  };
  const result = validateReviewLauncherRecovery({ ...baseInput, reviewPackage: derived, strictResult: derivedStrict, authorization: derivedAuthorization, correctionAttempts: 0, derivedCorrection: true, correctionEvidence });
  assert.equal(result.allowed, true, JSON.stringify(result));
});

test("launcher recovery creates an owned detached exact-head view and invokes only sealed read-only review", () => {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), "review-launcher-test-"));
  const reviewPath = path.join(temporaryRoot, "repository");
  fs.mkdirSync(path.join(reviewPath, "schemas"), { recursive: true });
  fs.writeFileSync(path.join(reviewPath, "schemas", "independent-review-findings-v1.schema.json"), "{}\n");
  const view = { kind: "detached-review-view-v1", repository: "/fixture", reviewPath, temporaryRoot, headCommit: reviewPackage.headCommit, ownershipToken: "fixture", createdAt: "2026-08-13T13:00:00.000Z" };
  let removed = false;
  let invoked = false;
  const result = {
    schemaVersion: 1,
    reviewRecordId: "degraded-record",
    executionId: "degraded-execution",
    reviewer: { type: "codex-degraded", identity: "fresh-reviewer", adapter: "codex" },
    attestation: { ref: "degraded-attestation", nonInteractive: true, isolatedContext: false, freshContext: true, readOnly: false },
    assuranceLevel: "authorized-degraded",
    capabilityLedger: { enforced: ["freshContext", "nonInteractive", "sealedPackageOnly", "detachedView", "innerReadOnlySandbox"], unavailable: [], instructionConstrained: ["workspaceWrite", "gitWrite", "githubMutation", "credentialAccess", "authenticatedNetwork", "externalSend", "deployment", "release", "delegatedMutation"] },
    strictUnavailable: { reviewRecordId: strictResult.reviewRecordId, executionId: strictResult.executionId, adapter: "codex", status: "unavailable", unavailableCode: strictResult.unavailableCode, baseCommit: reviewPackage.baseCommit, headCommit: reviewPackage.headCommit, manifestDigest: reviewPackage.manifestDigest },
    degradedAuthorization: { change: "change", transition: "merge-pr", expiresAt: "2026-08-14T00:00:00.000Z", riskReason: "synthetic owner risk acceptance", fallbackBoundary: "fresh-separated-reviewer-only" },
    baseCommit: reviewPackage.baseCommit,
    headCommit: reviewPackage.headCommit,
    manifestDigest: reviewPackage.manifestDigest,
    startedAt: "2026-08-13T13:00:00.000Z",
    completedAt: "2026-08-13T13:01:00.000Z",
    findings: [],
    status: "passed",
    unavailableCode: ""
  };
  try {
    const output = executeReviewLauncherRecovery({
      ...baseInput,
      repositoryPath: "/fixture",
      reviewer: { type: "codex-degraded", identity: "fresh-reviewer", attestation: { ref: "degraded-attestation" } },
      attestationRef: "degraded-attestation",
      createView: ({ headCommit }) => ({ available: headCommit === reviewPackage.headCommit, view }),
      removeView: (received) => { removed = received === view; return { removed: true }; },
      invoke: (request) => {
        invoked = true;
        assert.equal(request.view, view);
        assert.equal(request.executable, "/opt/tools/codex");
        assert.equal(request.strictResult, strictResult);
        assert.equal(fs.existsSync(path.join(reviewPath, ".ai-independent-review-package.json")), true);
        return { status: "passed", result };
      }
    });
    assert.equal(output.allowed, true);
    assert.equal(output.status, "passed");
    assert.equal(output.launcherEvidence.innerSandbox, "read-only");
    assert.equal(invoked, true);
    assert.equal(removed, true);
  } finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
});

test("launcher recovery never substitutes a package-only or mutable inner reviewer", () => {
  const output = executeReviewLauncherRecovery({ ...baseInput, repositoryPath: "/fixture", reviewer: { type: "codex-degraded", identity: "fresh-reviewer" }, attestationRef: "degraded-attestation", createView: () => ({ available: false, code: "denied" }), invoke: () => { throw new Error("must not invoke"); } });
  assert.equal(output.allowed, false);
  assert.equal(output.code, "review-launcher-detached-view-unavailable");
});
