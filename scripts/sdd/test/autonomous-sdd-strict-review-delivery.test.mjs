import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";

import {
  deliverStrictReviewArtifact,
  strictReviewDeliveryCodes,
  strictReviewTerminalKey,
  terminalizeStrictReviewCapture,
} from "../autonomous-sdd-strict-review-delivery.mjs";
import { packageDigest } from "../independent-review-contract.mjs";
import { createEphemeralStore, seedBindings, thinReviewLoop } from "../autonomous-sdd-vertical-slice.mjs";

const sha = (value) => createHash("sha256").update(value).digest("hex");
const commit = (n) => "a".repeat(40 - String(n).length) + String(n);
const requestDigest = sha("request");
const launchId = "launch-1";

const reviewer = { type: "codex", identity: "reviewer-1", adapter: "codex-cli" };
const configuredReviewer = { type: "codex", identity: "reviewer-1", attestation: { ref: "attestation-ref" } };
const implementerSession = "implementer-1";

function makePackage({ head = commit("1"), diff = "diff --git a/x b/x\n+line\n", artifacts = [{ path: "scripts/a.mjs", sha256: sha("a"), bytes: 10 }] } = {}) {
  const unsigned = { schemaVersion: 1, baseCommit: commit("0"), headCommit: head, diff, validationEvidence: ["evidence-1"], artifacts };
  return { ...unsigned, manifestDigest: packageDigest(unsigned) };
}

function makeResult({ pkg, status = "passed", findings = [], head, manifestDigest } = {}) {
  return {
    schemaVersion: 1,
    reviewRecordId: "record-1",
    executionId: "exec-1",
    reviewer: { type: "codex", identity: "reviewer-1", adapter: "codex-cli" },
    attestation: { ref: "attestation-ref", nonInteractive: true, isolatedContext: true, freshContext: true, readOnly: true },
    assuranceLevel: "strict-isolated",
    baseCommit: pkg.baseCommit,
    headCommit: head ?? pkg.headCommit,
    manifestDigest: manifestDigest ?? pkg.manifestDigest,
    startedAt: "2026-08-24T00:00:00.000Z",
    completedAt: "2026-08-24T00:00:01.000Z",
    findings,
    status,
  };
}

const args = (pkg, capture) => ({
  launchId,
  requestDigest,
  reviewPackage: pkg,
  configuredReviewer,
  implementerSession,
  capture,
});


test("minimal review returns an accepted parent-owned terminal artifact", () => {
  const pkg = makePackage();
  const result = makeResult({ pkg });
  const out = deliverStrictReviewArtifact(args(pkg, { exitCode: 0, artifact: result, cleanup: { removed: true } }));
  assert.equal(out.kind, "terminal");
  assert.equal(out.allowed, true);
  assert.equal(out.status, "passed");
  assert.equal(out.code, strictReviewDeliveryCodes.complete);
  assert.deepEqual(out.result, result);
  assert.deepEqual(out.cleanup, { removed: true });
});

test("large-read review is accepted through the same interface", () => {
  const pkg = makePackage({ diff: "diff --git a/x b/x\n" + "+line\n".repeat(40000) });
  const result = makeResult({ pkg });
  const out = deliverStrictReviewArtifact(args(pkg, { exitCode: 0, artifact: result, cleanup: { removed: true } }));
  assert.equal(out.allowed, true);
  assert.equal(out.status, "passed");
});

test("genuine multi-step review (findings-bearing) returns a terminal artifact", () => {
  const pkg = makePackage();
  const findings = [{ id: "f1", severity: "blocker", evidence: "scripts/a.mjs", recommendation: "Fix the defect" }];
  const result = makeResult({ pkg, status: "failed", findings });
  const out = deliverStrictReviewArtifact(args(pkg, { exitCode: 1, artifact: result, cleanup: { removed: true } }));
  assert.equal(out.allowed, true);
  assert.equal(out.status, "failed");
  assert.equal(out.result.findings.length, 1);
});

test("exit before result creation yields one terminal missing-artifact record", () => {
  const pkg = makePackage();
  const out = deliverStrictReviewArtifact(args(pkg, { exitCode: 0, artifact: null, cleanup: { removed: true } }));
  assert.equal(out.kind, "terminal");
  assert.equal(out.allowed, false);
  assert.equal(out.code, strictReviewDeliveryCodes.artifactMissing);
  assert.equal(out.status, "unavailable");
});

test("exit after result creation yields exactly one terminal record", () => {
  const pkg = makePackage();
  const result = makeResult({ pkg });
  const out = deliverStrictReviewArtifact(args(pkg, { exitCode: 0, artifact: result, cleanup: { removed: true } }));
  assert.equal(out.allowed, true);
  assert.equal(out.kind, "terminal");
});

test("timeout yields one terminal unavailable record", () => {
  const pkg = makePackage();
  const out = deliverStrictReviewArtifact(args(pkg, { timeout: true, cleanup: { removed: true } }));
  assert.equal(out.allowed, false);
  assert.equal(out.code, strictReviewDeliveryCodes.timeout);
});

test("crash (no observable exit) yields one terminal unavailable record", () => {
  const pkg = makePackage();
  const out = deliverStrictReviewArtifact(args(pkg, { exitCode: null, artifact: null, cleanup: { removed: true } }));
  assert.equal(out.allowed, false);
  assert.equal(out.code, strictReviewDeliveryCodes.crash);
});

test("transcript-only review is rejected", () => {
  const pkg = makePackage();
  const out = deliverStrictReviewArtifact(args(pkg, { exitCode: 0, transcriptOnly: true, artifact: null, cleanup: { removed: true } }));
  assert.equal(out.allowed, false);
  assert.equal(out.code, strictReviewDeliveryCodes.transcriptOnlyRejected);
});

test("wrong-package result (different head) is rejected", () => {
  const pkg = makePackage({ head: commit("1") });
  const result = makeResult({ pkg, head: commit("9") });
  const out = deliverStrictReviewArtifact(args(pkg, { exitCode: 0, artifact: result, cleanup: { removed: true } }));
  assert.equal(out.allowed, false);
  assert.equal(out.code, strictReviewDeliveryCodes.wrongPackageRejected);
});

test("wrong-package result (different manifest) is rejected", () => {
  const pkg = makePackage();
  const result = makeResult({ pkg, manifestDigest: sha("other-manifest") });
  const out = deliverStrictReviewArtifact(args(pkg, { exitCode: 0, artifact: result, cleanup: { removed: true } }));
  assert.equal(out.allowed, false);
  assert.equal(out.code, strictReviewDeliveryCodes.wrongPackageRejected);
});

test("cleanup failure retains an actionable recovery record", () => {
  const pkg = makePackage();
  const result = makeResult({ pkg });
  const recovery = { resource: "review-view", action: "remove-owned-view" };
  const out = deliverStrictReviewArtifact(args(pkg, { exitCode: 0, artifact: result, cleanup: { removed: false, recovery } }));
  assert.equal(out.allowed, false);
  assert.equal(out.code, strictReviewDeliveryCodes.cleanupFailed);
  assert.deepEqual(out.recovery, recovery);
});

test("terminalization is deterministic and exactly-once for the same key", () => {
  const pkg = makePackage();
  const result = makeResult({ pkg });
  const capture = { exitCode: 0, artifact: result, cleanup: { removed: true } };
  const first = terminalizeStrictReviewCapture({ launchId, requestDigest, capture, expectedPackage: pkg, configuredReviewer, implementerSession });
  const second = terminalizeStrictReviewCapture({ launchId, requestDigest, capture, expectedPackage: pkg, configuredReviewer, implementerSession });
  assert.deepEqual(first, second);
  assert.equal(first.key, strictReviewTerminalKey({ launchId, requestDigest }));
});

test("an unavailable result is never acceptance evidence", () => {
  const pkg = makePackage();
  const result = makeResult({ pkg, status: "unavailable" });
  result.unavailableCode = "review-launcher-codex-result-artifact-missing";
  const out = deliverStrictReviewArtifact(args(pkg, { exitCode: 0, artifact: result, cleanup: { removed: true } }));
  assert.equal(out.allowed, false);
  assert.equal(out.code, "review-launcher-codex-result-artifact-missing");
});

test("missing launch identity yields a typed request-invalid record", () => {
  const out = deliverStrictReviewArtifact({ requestDigest, reviewPackage: makePackage(), capture: { exitCode: 0, artifact: null, cleanup: { removed: true } } });
  assert.equal(out.allowed, false);
  assert.equal(out.code, strictReviewDeliveryCodes.requestInvalid);
});


test("production review routes through strict delivery and pauses on transcript-only", () => {
  const store = createEphemeralStore();
  const pkg = makePackage();
  const strictDelivery = ({ launchId }) =>
    deliverStrictReviewArtifact({
      launchId,
      requestDigest,
      reviewPackage: pkg,
      configuredReviewer,
      implementerSession,
      capture: { exitCode: 0, transcriptOnly: true, artifact: null, cleanup: { removed: true } },
    });
  const out = thinReviewLoop({
    store,
    profile: "production-rapid",
    previousBindings: seedBindings(),
    currentBindings: { ...seedBindings(), reviewedHead: "head-changed" },
    strictDelivery,
  });
  assert.equal(out.state, "paused");
  assert.equal(out.reason, strictReviewDeliveryCodes.transcriptOnlyRejected);
});

test("production review accepts a valid strict terminal artifact", () => {
  const store = createEphemeralStore();
  const pkg = makePackage();
  const result = makeResult({ pkg });
  const strictDelivery = ({ launchId }) =>
    deliverStrictReviewArtifact({
      launchId,
      requestDigest,
      reviewPackage: pkg,
      configuredReviewer,
      implementerSession,
      capture: { exitCode: 0, artifact: result, cleanup: { removed: true } },
    });
  const out = thinReviewLoop({
    store,
    profile: "production-rapid",
    previousBindings: seedBindings(),
    currentBindings: { ...seedBindings(), reviewedHead: "head-changed" },
    strictDelivery,
  });
  assert.equal(out.state, "fresh");
  assert.equal(out.terminalArtifactKey, strictReviewTerminalKey({ launchId: "review-1", requestDigest }));
});
