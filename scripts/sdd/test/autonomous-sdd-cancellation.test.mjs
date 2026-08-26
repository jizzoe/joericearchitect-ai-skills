import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { admitV2Run } from "../autonomous-sdd-admission.mjs";
import { cancelExpiredV2Run, earlyRetirementAuthorizationPayload, retireBlockedV2Run } from "../autonomous-sdd-controller.mjs";
import { resolveSddDeliveryRequest } from "../resolve-sdd-delivery-request.mjs";

const root = () => fs.mkdtempSync(path.join(os.tmpdir(), "autonomous-sdd-cancellation-"));
const started = "2026-08-20T12:00:00.000Z";
const authorization = resolveSddDeliveryRequest({ target: "expired-run", mode: "autonomous", qualityProfile: "prototype-rapid", authorizationProfile: "sdd-delivery", reviewPolicy: "same-session-local", expiration: "4h" }, { goalStartedAt: started }).effectiveAuthorization;
const provider = { schemaVersion: 1, id: "native-claim", generationFence: true, explicitTakeover: true, durableWrite: true, directoryMetadataDurability: true, platforms: { windows: "LockFileEx", posix: "advisory-lock" } };
const historyBinding = { id: "local-history", digest: "a".repeat(64) };
const ownerKeys = crypto.generateKeyPairSync("ed25519");
const trustedOwner = {
  trustedOwner: "repository-owner",
  trustedOwnerPublicKey: ownerKeys.publicKey.export({ type: "spki", format: "pem" })
};
const fixture = (stateHome, overrides = {}) => ({ authorization, canonicalRemote: "git@github.com:owner/repository.git", readableRepositoryName: "repository", historyBinding, provider, owner: { host: "fixture-host", boot: "fixture-boot", pidStart: "fixture-process" }, stateHome, parentRunId: "parent-expired-001", workUnitId: "workunit-expired-001", claimId: "claim-expired-001", now: started, ...overrides });
const cancellationFor = (admitted) => ({
  schemaVersion: 1,
  controllerRunId: `controller-${admitted.parentRun.approvedIntentDigest.slice(0, 32)}`,
  parentRunId: admitted.parentRun.parentRunId,
  workUnitId: admitted.workUnit.workUnitId,
  claimId: admitted.claim.claimId,
  repositoryId: admitted.repositoryId,
  approvedChangeId: admitted.workUnit.approvedChangeId,
  provider
});
const retirementFor = (admitted, overrides = {}) => {
  const retirement = {
    schemaVersion: 1,
    ...cancellationFor(admitted),
    blockedReason: "required-controller-transition-unavailable",
    requiredTransition: "future-controller-transition",
    recoveryReference: "repair-controller-phase-advance-and-early-cancel",
    ownerAuthorization: { approved: true, owner: "repository-owner", reviewedAt: started, reference: "owner-retirement-authorization", signatureAlgorithm: "ed25519" },
    expiresAt: "2026-08-20T16:00:00.000Z",
    ...overrides
  };
  if (!retirement.ownerAuthorization.signature) {
    retirement.ownerAuthorization.signature = crypto.sign(null, Buffer.from(JSON.stringify(earlyRetirementAuthorizationPayload(retirement))), ownerKeys.privateKey).toString("base64");
  }
  return retirement;
};

test("cancellation retires an exact expired unfinished run and releases only its claim", () => {
  const stateHome = root();
  try {
    const admitted = admitV2Run(fixture(stateHome));
    assert.equal(admitted.valid, true);
    const cancellation = cancellationFor(admitted);
    const result = cancelExpiredV2Run({ readableRepositoryName: "repository", cancellation, stateHome, now: "2026-08-20T17:00:00.000Z" });

    assert.equal(result.valid, true);
    assert.equal(result.classification, "cancelled");
    assert.equal(result.receipt.kind, "cancellation-receipt");
    assert.equal(result.receipt.controllerRunId, cancellation.controllerRunId);
    assert.equal(result.receipt.parentRunId, admitted.parentRun.parentRunId);
    assert.equal(result.receipt.claimId, admitted.claim.claimId);

    const activePath = path.join(admitted.paths.active, admitted.parentRun.parentRunId);
    assert.equal(fs.existsSync(activePath), false);
    assert.ok(result.archivePath.endsWith(admitted.parentRun.parentRunId));

    const claimRelease = JSON.parse(fs.readFileSync(path.join(result.archivePath, "claim-release.json"), "utf8"));
    assert.equal(claimRelease.disposition, "released");
    assert.ok(claimRelease.cancellationReceiptDigest);
    assert.equal(claimRelease.terminalizationReceiptDigest, undefined);

    const projection = JSON.parse(fs.readFileSync(path.join(result.archivePath, "projection.json"), "utf8"));
    assert.equal(projection.children[0].terminalStatus, "cancelled");

    const manifest = JSON.parse(fs.readFileSync(path.join(result.archivePath, "archive-manifest.json"), "utf8"));
    assert.equal(manifest.reason, "expired-unfinished-controller");

    assert.ok(fs.existsSync(path.join(admitted.paths.index, "runs", `${admitted.parentRun.parentRunId}.json`)));
  } finally { fs.rmSync(stateHome, { recursive: true, force: true }); }
});

test("cancellation is idempotent after success", () => {
  const stateHome = root();
  try {
    const admitted = admitV2Run(fixture(stateHome));
    const cancellation = cancellationFor(admitted);
    const first = cancelExpiredV2Run({ readableRepositoryName: "repository", cancellation, stateHome, now: "2026-08-20T17:00:00.000Z" });
    assert.equal(first.classification, "cancelled");
    const second = cancelExpiredV2Run({ readableRepositoryName: "repository", cancellation, stateHome, now: "2026-08-20T17:00:00.000Z" });
    assert.equal(second.valid, true);
    assert.equal(second.classification, "already-cancelled");
    assert.equal(second.archivePath, first.archivePath);
    assert.equal(second.receipt.requestDigest, first.receipt.requestDigest);
  } finally { fs.rmSync(stateHome, { recursive: true, force: true }); }
});

test("cancellation refuses an unexpired run and leaves the claim active", () => {
  const stateHome = root();
  try {
    const admitted = admitV2Run(fixture(stateHome));
    const cancellation = cancellationFor(admitted);
    const result = cancelExpiredV2Run({ readableRepositoryName: "repository", cancellation, stateHome, now: "2026-08-20T13:00:00.000Z" });

    assert.equal(result.valid, false);
    assert.equal(result.classification, "paused");
    assert.equal(result.reason, "cancellation-run-not-expired");

    const activePath = path.join(admitted.paths.active, admitted.parentRun.parentRunId);
    assert.ok(fs.existsSync(activePath));
    assert.equal(JSON.parse(fs.readFileSync(path.join(activePath, "resource-claim.json"), "utf8")).state, "active");
    assert.equal(fs.existsSync(path.join(activePath, "cancellation-receipt.json")), false);
  } finally { fs.rmSync(stateHome, { recursive: true, force: true }); }
});

test("separately authorized early retirement archives one exact blocked undelivered run", () => {
  const stateHome = root();
  try {
    const admitted = admitV2Run(fixture(stateHome));
    const retirement = retirementFor(admitted);
    const retired = retireBlockedV2Run({ readableRepositoryName: "repository", retirement, transitionAvailable: () => false, ...trustedOwner, stateHome, now: "2026-08-20T13:00:00.000Z" });
    assert.equal(retired.valid, true);
    assert.equal(retired.classification, "retired");
    assert.equal(JSON.parse(fs.readFileSync(path.join(retired.archivePath, "archive-manifest.json"), "utf8")).reason, "owner-authorized-blocked-controller");
    assert.equal(JSON.parse(fs.readFileSync(path.join(retired.archivePath, "projection.json"), "utf8")).children[0].terminalStatus, "cancelled");
    const retry = retireBlockedV2Run({ readableRepositoryName: "repository", retirement, transitionAvailable: () => false, ...trustedOwner, stateHome, now: "2026-08-20T13:00:00.000Z" });
    assert.equal(retry.classification, "already-retired");
  } finally { fs.rmSync(stateHome, { recursive: true, force: true }); }
});

test("early retirement rejects unavailable authority, identity conflicts, and a present transition", () => {
  const stateHome = root();
  try {
    const admitted = admitV2Run(fixture(stateHome));
    const base = retirementFor(admitted);
    assert.equal(retireBlockedV2Run({ readableRepositoryName: "repository", transitionAvailable: () => false, ...trustedOwner, stateHome, now: "2026-08-20T13:00:00.000Z" }).reason, "early-retirement-input-invalid");
    assert.equal(retireBlockedV2Run({ readableRepositoryName: "repository", retirement: { ...base, ownerAuthorization: { ...base.ownerAuthorization, signature: "invalid" } }, transitionAvailable: () => false, ...trustedOwner, stateHome, now: "2026-08-20T13:00:00.000Z" }).reason, "early-retirement-input-invalid");
    assert.equal(retireBlockedV2Run({ readableRepositoryName: "repository", retirement: retirementFor(admitted, { expiresAt: "2026-08-20T12:00:00.000Z" }), transitionAvailable: () => false, ...trustedOwner, stateHome, now: "2026-08-20T13:00:00.000Z" }).reason, "early-retirement-authorization-expired");
    assert.equal(retireBlockedV2Run({ readableRepositoryName: "repository", retirement: retirementFor(admitted, { claimId: "claim-other-001" }), transitionAvailable: () => false, ...trustedOwner, stateHome, now: "2026-08-20T13:00:00.000Z" }).reason, "cancellation-identity-or-claim-mismatch");
    assert.equal(retireBlockedV2Run({ readableRepositoryName: "repository", retirement: base, transitionAvailable: () => true, ...trustedOwner, stateHome, now: "2026-08-20T13:00:00.000Z" }).reason, "early-retirement-transition-available");
    assert.equal(fs.existsSync(path.join(admitted.paths.active, admitted.parentRun.parentRunId)), true);
  } finally { fs.rmSync(stateHome, { recursive: true, force: true }); }
});

test("early retirement refuses a run with delivery evidence", () => {
  const stateHome = root();
  try {
    const admitted = admitV2Run(fixture(stateHome));
    const activePath = path.join(admitted.paths.active, admitted.parentRun.parentRunId);
    fs.writeFileSync(path.join(activePath, "terminalization-receipt.json"), "{}\n");
    const result = retireBlockedV2Run({
      readableRepositoryName: "repository", retirement: retirementFor(admitted), transitionAvailable: () => false, ...trustedOwner,
      stateHome, now: "2026-08-20T13:00:00.000Z"
    });
    assert.equal(result.reason, "cancellation-run-delivered");
    assert.equal(fs.existsSync(activePath), true);
  } finally { fs.rmSync(stateHome, { recursive: true, force: true }); }
});

test("early retirement fails closed on any durable progress artifact", () => {
  const stateHome = root();
  try {
    const admitted = admitV2Run(fixture(stateHome));
    const activePath = path.join(admitted.paths.active, admitted.parentRun.parentRunId);
    fs.writeFileSync(path.join(activePath, "transition-attempt.json"), "{}\n");
    const result = retireBlockedV2Run({
      readableRepositoryName: "repository", retirement: retirementFor(admitted), transitionAvailable: () => false, ...trustedOwner,
      stateHome, now: "2026-08-20T13:00:00.000Z"
    });
    assert.equal(result.reason, "early-retirement-progress-evidence-present");
    assert.equal(fs.existsSync(activePath), true);
  } finally { fs.rmSync(stateHome, { recursive: true, force: true }); }
});

test("cancellation rejects a mismatched claim without releasing it", () => {
  const stateHome = root();
  try {
    const admitted = admitV2Run(fixture(stateHome));
    const cancellation = { ...cancellationFor(admitted), claimId: "claim-other-001" };
    const result = cancelExpiredV2Run({ readableRepositoryName: "repository", cancellation, stateHome, now: "2026-08-20T17:00:00.000Z" });

    assert.equal(result.valid, false);
    assert.equal(result.classification, "paused");
    assert.equal(result.reason, "cancellation-identity-or-claim-mismatch");

    const activePath = path.join(admitted.paths.active, admitted.parentRun.parentRunId);
    assert.ok(fs.existsSync(activePath));
    assert.equal(JSON.parse(fs.readFileSync(path.join(activePath, "resource-claim.json"), "utf8")).state, "active");
    assert.equal(fs.existsSync(path.join(activePath, "claim-release.json")), false);
  } finally { fs.rmSync(stateHome, { recursive: true, force: true }); }
});

test("cancellation rejects a mismatched controller identity without releasing the claim", () => {
  const stateHome = root();
  try {
    const admitted = admitV2Run(fixture(stateHome));
    const cancellation = { ...cancellationFor(admitted), controllerRunId: "controller-" + "d".repeat(32) };
    const result = cancelExpiredV2Run({ readableRepositoryName: "repository", cancellation, stateHome, now: "2026-08-20T17:00:00.000Z" });

    assert.equal(result.valid, false);
    assert.equal(result.classification, "paused");
    assert.equal(result.reason, "cancellation-identity-or-claim-mismatch");

    const activePath = path.join(admitted.paths.active, admitted.parentRun.parentRunId);
    assert.ok(fs.existsSync(activePath));
    assert.equal(fs.existsSync(path.join(activePath, "claim-release.json")), false);
  } finally { fs.rmSync(stateHome, { recursive: true, force: true }); }
});
