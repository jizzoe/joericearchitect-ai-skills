import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";

import {
  admitReviewReadiness,
  reviewAdmissionCodes,
  reviewAdmissionEvidenceKey,
  reviewAdmissionFresh,
} from "../autonomous-sdd-review-admission.mjs";
import { packageDigest } from "../independent-review-contract.mjs";

const sha = (value) => createHash("sha256").update(value).digest("hex");
const commit = (n) => "a".repeat(40 - String(n).length) + String(n);

const denied = Object.freeze({
  workspaceWrite: true, gitWrite: true, githubMutation: true, credentialAccess: true,
  authenticatedNetwork: true, externalSend: true, deployment: true, release: true, delegatedMutation: true,
});
const adapter = Object.freeze({
  freshContext: true, nonInteractive: true, readOnlyView: true, runtimeEnforced: true, denied,
  adapter: "codex-detached-read-only-v1", attestationRef: "attestations/codex-read-only-v1.json", probeReference: "probe-ref",
});
const executableIdentity = Object.freeze({ managedMutationDenied: true, expectedName: "codex" });

function makePackage({ head = commit("1") } = {}) {
  const unsigned = {
    schemaVersion: 1, baseCommit: commit("0"), headCommit: head,
    diff: "diff --git a/x b/x\n+line\n", validationEvidence: ["evidence-1"],
    artifacts: [{ path: "scripts/a.mjs", sha256: sha("a"), bytes: 10 }],
  };
  return { ...unsigned, manifestDigest: packageDigest(unsigned) };
}

const now = "2026-08-24T10:00:00.000Z";
const deadline = "2026-08-24T12:00:00.000Z";
const executedTransport = () => ({ status: "executed" });
const passingProbe = () => ({
  launchId: "launch-1", requestDigest: sha("request"),
  operations: [{ name: "read-file" }, { name: "search-text" }],
  capture: { exitCode: 0, artifact: { status: "passed" }, cleanup: { removed: true } },
});

test("a genuine multi-step probe admits the production review path", () => {
  const pkg = makePackage();
  const out = admitReviewReadiness({ reviewPackage: pkg, adapter, executableIdentity, transport: executedTransport, probe: passingProbe, deadline, now });
  assert.equal(out.allowed, true);
  assert.equal(out.code, reviewAdmissionCodes.complete);
  assert.equal(out.evidence.operations.length, 2);
  assert.equal(out.key, reviewAdmissionEvidenceKey({ sealedPackageDigest: out.evidence.sealedPackageDigest, observedAt: now }));
});

test("missing adapter fails admission", () => {
  const pkg = makePackage();
  const out = admitReviewReadiness({ reviewPackage: pkg, adapter: {}, executableIdentity, transport: executedTransport, probe: passingProbe, deadline, now });
  assert.equal(out.allowed, false);
  assert.equal(out.code, reviewAdmissionCodes.adapterMissing);
});

test("a single-operation probe is not multi-step evidence", () => {
  const pkg = makePackage();
  const probe = () => ({
    launchId: "launch-1", requestDigest: sha("request"), operations: [{ name: "read-file" }],
    capture: { exitCode: 0, artifact: { status: "passed" }, cleanup: { removed: true } },
  });
  const out = admitReviewReadiness({ reviewPackage: pkg, adapter, executableIdentity, transport: executedTransport, probe, deadline, now });
  assert.equal(out.allowed, false);
  assert.equal(out.code, reviewAdmissionCodes.artifactPathInvalid);
});

test("denied runtime permission fails admission", () => {
  const pkg = makePackage();
  const out = admitReviewReadiness({ reviewPackage: pkg, adapter, executableIdentity, transport: () => ({ status: "denied" }), probe: passingProbe, deadline, now });
  assert.equal(out.allowed, false);
  assert.equal(out.code, reviewAdmissionCodes.permissionDenied);
});

test("inadequate deadline fails admission", () => {
  const pkg = makePackage();
  const out = admitReviewReadiness({ reviewPackage: pkg, adapter, executableIdentity, transport: executedTransport, probe: passingProbe, deadline: "2026-08-24T09:00:00.000Z", now });
  assert.equal(out.allowed, false);
  assert.equal(out.code, reviewAdmissionCodes.deadlineInadequate);
});

test("unwritable cleanup destination fails admission", () => {
  const pkg = makePackage();
  const probe = () => ({
    launchId: "launch-1", requestDigest: sha("request"),
    operations: [{ name: "read-file" }, { name: "search-text" }],
    capture: { exitCode: 0, artifact: { status: "passed" }, cleanup: { removed: false } },
  });
  const out = admitReviewReadiness({ reviewPackage: pkg, adapter, executableIdentity, transport: executedTransport, probe, deadline, now });
  assert.equal(out.allowed, false);
  assert.equal(out.code, reviewAdmissionCodes.cleanupUnwritable);
});

test("head change invalidates admission evidence", () => {
  const pkg = makePackage();
  const out = admitReviewReadiness({ reviewPackage: pkg, adapter, executableIdentity, transport: executedTransport, probe: passingProbe, deadline, now });
  assert.equal(reviewAdmissionFresh({ evidence: out.evidence, reviewPackage: makePackage({ head: commit("2") }), now }), false);
});

test("expired TTL invalidates admission evidence", () => {
  const pkg = makePackage();
  const out = admitReviewReadiness({ reviewPackage: pkg, adapter, executableIdentity, transport: executedTransport, probe: passingProbe, deadline, now });
  assert.equal(reviewAdmissionFresh({ evidence: out.evidence, reviewPackage: pkg, now: "2026-08-24T11:00:01.000Z" }), false);
});

test("fresh evidence validates for the exact package within TTL", () => {
  const pkg = makePackage();
  const out = admitReviewReadiness({ reviewPackage: pkg, adapter, executableIdentity, transport: executedTransport, probe: passingProbe, deadline, now });
  assert.equal(reviewAdmissionFresh({ evidence: out.evidence, reviewPackage: pkg, now: "2026-08-24T10:30:00.000Z" }), true);
});
