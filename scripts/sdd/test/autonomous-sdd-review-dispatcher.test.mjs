import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";

import {
  classifyReviewDispatch,
  dispatchReview,
  inspectionEnvironmentFailureCodes,
  reviewDispatchCodes,
} from "../autonomous-sdd-review-dispatcher.mjs";
import { strictReviewDeliveryCodes } from "../autonomous-sdd-strict-review-delivery.mjs";
import { packageDigest } from "../independent-review-contract.mjs";

const sha = (value) => createHash("sha256").update(value).digest("hex");
const commit = (n) => "a".repeat(40 - String(n).length) + String(n);
const requestDigest = sha("request");
const launchId = "launch-1";

const reviewer = { type: "codex", identity: "reviewer-1", adapter: "codex-cli" };
const configuredReviewer = { type: "codex", identity: "reviewer-1", attestation: { ref: "attestation-ref" } };
const implementerSession = "implementer-1";
const selectedEntry = "add-autonomous-sdd-review-admission-and-dispatcher";

function makePackage({ head = commit("1") } = {}) {
  const unsigned = {
    schemaVersion: 1, baseCommit: commit("0"), headCommit: head,
    diff: "diff --git a/x b/x\n+line\n", validationEvidence: ["evidence-1"],
    artifacts: [{ path: "scripts/a.mjs", sha256: sha("a"), bytes: 10 }],
  };
  return { ...unsigned, manifestDigest: packageDigest(unsigned) };
}

function makeResult(pkg) {
  return {
    schemaVersion: 1, reviewRecordId: "record-1", executionId: "exec-1", reviewer,
    attestation: { ref: "attestation-ref", nonInteractive: true, isolatedContext: true, freshContext: true, readOnly: true },
    assuranceLevel: "strict-isolated", baseCommit: pkg.baseCommit, headCommit: pkg.headCommit, manifestDigest: pkg.manifestDigest,
    startedAt: "2026-08-24T00:00:00.000Z", completedAt: "2026-08-24T00:00:01.000Z", findings: [], status: "passed",
  };
}

function makeUnavailableResult(pkg, unavailableCode) {
  return {
    schemaVersion: 1, reviewRecordId: "record-unav", executionId: "exec-unav", reviewer,
    attestation: { ref: "attestation-ref", nonInteractive: false, isolatedContext: false, freshContext: false, readOnly: false },
    assuranceLevel: "strict-isolated", baseCommit: pkg.baseCommit, headCommit: pkg.headCommit, manifestDigest: pkg.manifestDigest,
    startedAt: "2026-08-24T00:00:00.000Z", completedAt: "2026-08-24T00:00:01.000Z", findings: [], status: "unavailable", unavailableCode,
  };
}

test("classifyReviewDispatch maps complete, reviewer-lost, degraded, and terminal", () => {
  assert.equal(classifyReviewDispatch({ code: strictReviewDeliveryCodes.complete }).kind, "complete");
  assert.equal(classifyReviewDispatch({ code: strictReviewDeliveryCodes.timeout }).kind, "paused");
  assert.equal(classifyReviewDispatch({ code: strictReviewDeliveryCodes.crash }).kind, "paused");
  assert.equal(classifyReviewDispatch({ code: inspectionEnvironmentFailureCodes[0], degradedAuthorizationValid: true }).kind, "degraded-eligible");
  assert.equal(classifyReviewDispatch({ code: inspectionEnvironmentFailureCodes[0], degradedAuthorizationValid: false }).kind, "terminal");
  assert.equal(classifyReviewDispatch({ code: "strict-review-result-invalid" }).kind, "terminal");
});

test("dispatchReview returns terminal evidence for a valid strict result", () => {
  const pkg = makePackage();
  const result = makeResult(pkg);
  const out = dispatchReview({
    reviewPackage: pkg, configuredReviewer, implementerSession,
    launch: () => ({ launchId, requestDigest, capture: { exitCode: 0, artifact: result, cleanup: { removed: true } } }),
  });
  assert.equal(out.allowed, true);
  assert.equal(out.code, reviewDispatchCodes.complete);
  assert.ok(out.key);
});

test("dispatchReview returns an exact resume/pause on reviewer crash", () => {
  const pkg = makePackage();
  const out = dispatchReview({
    reviewPackage: pkg, configuredReviewer, implementerSession,
    launch: () => ({ launchId, requestDigest, capture: { exitCode: null } }),
  });
  assert.equal(out.kind, "paused");
  assert.equal(out.code, reviewDispatchCodes.reviewerLost);
  assert.equal(out.disposition, "resume");
  assert.ok(out.resume);
});

test("dispatchReview does not run the fallback without a valid degraded authorization", () => {
  const pkg = makePackage();
  const strictResult = makeUnavailableResult(pkg, inspectionEnvironmentFailureCodes[0]);
  const out = dispatchReview({
    reviewPackage: pkg, configuredReviewer, implementerSession, strictResult, selectedEntry,
    launch: () => ({ launchId, requestDigest, capture: { exitCode: 0, artifact: strictResult, cleanup: { removed: true } } }),
  });
  assert.equal(out.allowed, false);
  assert.equal(out.kind, "terminal");
});

test("dispatchReview runs the fallback only under a valid degraded authorization", () => {
  const pkg = makePackage();
  const strictResult = makeUnavailableResult(pkg, inspectionEnvironmentFailureCodes[0]);
  const future = "2026-08-25T00:00:00.000Z";
  const degradedAuthorization = {
    degradedIndependentReview: {
      enabled: true, change: selectedEntry, transitions: ["merge-pr"], fallbackBoundary: "fresh-separated-reviewer-only", riskReason: "test",
      expiresAt: future, baseCommit: pkg.baseCommit, headCommit: pkg.headCommit, manifestDigest: pkg.manifestDigest,
    },
    expiresAt: future,
  };
  let runDegradedCalled = false;
  const out = dispatchReview({
    reviewPackage: pkg, configuredReviewer, implementerSession, strictResult, selectedEntry, degradedAuthorization,
    launch: () => ({ launchId, requestDigest, capture: { exitCode: 0, artifact: strictResult, cleanup: { removed: true } } }),
    runDegraded: () => { runDegradedCalled = true; return { allowed: true, result: { status: "passed", findings: [] } }; },
    now: "2026-08-24T00:00:00.000Z",
  });
  assert.equal(runDegradedCalled, true);
  assert.equal(out.allowed, true);
  assert.equal(out.status, "degraded");
  assert.equal(out.assuranceLevel, "authorized-degraded");
});
