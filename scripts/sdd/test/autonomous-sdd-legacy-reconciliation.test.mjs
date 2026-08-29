import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { inventoryLegacyRecords } from "../autonomous-sdd-legacy.mjs";
import { inventoryLegacyReconciliationReceipts, legacyRecordDigest, publishLegacyReconciliationReceipt, reconcileLegacyBootstrapRecord } from "../autonomous-sdd-legacy-reconciliation.mjs";
import { cancelExpiredV2Run, initializeV2Delivery, terminalizeV2Run } from "../autonomous-sdd-controller.mjs";
import { deriveRepositoryId, digestValue } from "../autonomous-sdd-run-contract.mjs";
import { resolveSddDeliveryRequest } from "../resolve-sdd-delivery-request.mjs";

const now = "2026-08-21T01:00:00.000Z";
const stateHome = () => fs.mkdtempSync(path.join(os.tmpdir(), "legacy-reconciliation-"));
const record = () => ({ schemaVersion: 4, runId: "bootstrap-run-001", selectedEntry: "bootstrap-change", repository: "owner/repository", currentPhase: "propose", resourceRecords: [{ kind: "branch", id: "implementation" }, { kind: "branch", id: "archive" }] });
const content = (value = record()) => `${JSON.stringify(value)}\n`;
const authorization = (legacyContent, { reference = "runs/bootstrap/controller.json", expiresAt = "2026-08-21T02:00:00.000Z" } = {}) => ({ schemaVersion: 1, approved: true, id: "owner-bootstrap-reconciliation", scopeDigest: "a".repeat(64), expiresAt, selectedEntry: "bootstrap-change", repository: "owner/repository", legacyRecords: [{ reference, recordDigest: legacyRecordDigest(legacyContent) }] });
const evidence = () => ({ observedAt: now, issue: { state: "CLOSED", reference: "issue-1" }, implementation: { merged: true, reference: "implementation-pr", topicHeadCommit: "1".repeat(40), deliveredHeadCommit: "2".repeat(40) }, sync: { merged: true, reference: "sync-pr", topicHeadCommit: "3".repeat(40), deliveredHeadCommit: "4".repeat(40) }, archive: { merged: true, reference: "archive-pr", topicHeadCommit: "5".repeat(40), deliveredHeadCommit: "6".repeat(40) }, cleanup: [{ kind: "branch", id: "implementation", status: "completed" }, { kind: "branch", id: "archive", status: "completed" }] });
const provider = { schemaVersion: 1, id: "native-claim", generationFence: true, explicitTakeover: true, durableWrite: true, directoryMetadataDurability: true, platforms: { windows: "LockFileEx", posix: "advisory-lock" } };
const canonicalRemote = "git@github.com:owner/repository.git";
const deliveryStartedAt = "2026-08-20T12:00:00.000Z";

function terminalizationFor(admission) {
  return {
    schemaVersion: 1,
    parentRunId: admission.parentRun.parentRunId,
    workUnitId: admission.workUnit.workUnitId,
    claimId: admission.claim.claimId,
    repositoryId: admission.repositoryId,
    approvedChangeId: admission.workUnit.approvedChangeId,
    provider,
    completionEvidence: {
      current: true,
      implementation: { merged: true, reference: "implementation-pr", deliveredHeadCommit: "d".repeat(40) },
      sync: { merged: true, reference: "sync-pr", deliveredHeadCommit: "e".repeat(40) },
      archive: { merged: true, reference: "archive-pr", deliveredHeadCommit: "f".repeat(40) },
      issueClosed: true,
      projectDone: true,
      cleanupCompleted: true,
      observedAt: "2026-08-20T12:20:00.000Z"
    },
    terminal: {
      terminalStatus: "complete",
      terminalReason: "delivered-and-archived",
      terminalAt: "2026-08-20T12:30:00.000Z",
      finalHead: "f".repeat(40),
      attemptCount: 1,
      correctionCount: 0,
      cleanupDisposition: "completed",
      childHistoryReference: "external-delivery-evidence",
      childHistoryDigest: "d".repeat(64)
    }
  };
}

function schema5ArchiveFixture(disposition) {
  const home = stateHome();
  const repositoryPath = stateHome();
  fs.mkdirSync(path.join(repositoryPath, ".git"));
  fs.mkdirSync(path.join(repositoryPath, "config"));
  fs.writeFileSync(path.join(repositoryPath, "config", "ai-skills.json"), JSON.stringify({ runtime: { schemaVersion: 1, evidenceRoot: "evidence" } }));
  const deliveryAuthorization = resolveSddDeliveryRequest({ target: "bootstrap-change", mode: "autonomous", qualityProfile: "prototype-rapid", authorizationProfile: "sdd-delivery", reviewPolicy: "same-session-local", expiration: "4h" }, { goalStartedAt: deliveryStartedAt }).effectiveAuthorization;
  const initialized = initializeV2Delivery({
    authorization: deliveryAuthorization,
    repository: "owner/repository",
    canonicalRemote,
    readableRepositoryName: "repository",
    historyBinding: { id: "local-history", digest: "b".repeat(64) },
    provider,
    owner: { host: "fixture-host", boot: "fixture-boot", pidStart: "fixture-process" },
    repositoryPath,
    stateHome: home,
    legacyDirectory: path.join(repositoryPath, ".git", "sdd-delivery-runs"),
    now: deliveryStartedAt,
    runGit: () => ".git"
  });
  assert.equal(initialized.valid, true, JSON.stringify(initialized));
  const legacyContent = fs.readFileSync(initialized.checkpointPath, "utf8");
  let archivePath;
  if (disposition === "terminalized") {
    const result = terminalizeV2Run({ readableRepositoryName: "repository", stateHome: home, terminalization: terminalizationFor(initialized.admission), now: "2026-08-20T12:31:00.000Z" });
    assert.equal(result.classification, "terminalized", JSON.stringify(result));
    archivePath = result.archivePath;
  } else {
    const admission = initialized.admission;
    const result = cancelExpiredV2Run({
      readableRepositoryName: "repository",
      stateHome: home,
      cancellation: {
        schemaVersion: 1,
        controllerRunId: initialized.record.runId,
        parentRunId: admission.parentRun.parentRunId,
        workUnitId: admission.workUnit.workUnitId,
        claimId: admission.claim.claimId,
        repositoryId: admission.repositoryId,
        approvedChangeId: admission.workUnit.approvedChangeId,
        provider
      },
      now: "2026-08-20T17:00:00.000Z"
    });
    assert.equal(result.classification, "cancelled", JSON.stringify(result));
    archivePath = result.archivePath;
  }
  return { home, repositoryPath, initialized, legacyContent, archivePath };
}

test("reconciliation publishes an immutable sidecar receipt without changing legacy bytes", () => {
  const home = stateHome();
  const legacyContent = content();
  try {
    const result = reconcileLegacyBootstrapRecord({ authorization: authorization(legacyContent), legacy: { reference: "runs/bootstrap/controller.json", content: legacyContent }, evidence: evidence(), now });
    assert.equal(result.valid, true);
    assert.equal(result.receipt.v2Authority, false);
    assert.equal(result.receipt.nativeClaim, false);
    assert.equal(result.receipt.legacyMutation, false);
    const published = publishLegacyReconciliationReceipt({ receipt: result.receipt, stateHome: home, readableRepositoryName: "repository", repositoryId: deriveRepositoryId("git@github.com:owner/repository.git") });
    assert.equal(published.classification, "reconciled");
    const receipts = inventoryLegacyReconciliationReceipts({ stateHome: home, readableRepositoryName: "repository", repositoryId: deriveRepositoryId("git@github.com:owner/repository.git") });
    assert.equal(receipts.receipts.length, 1);
    assert.equal(inventoryLegacyRecords([{ reference: "runs/bootstrap/controller.json", content: legacyContent }], { reconciliationReceipts: receipts.receipts, now }).classification, "compatible");
    assert.equal(legacyContent, content());
  } finally { fs.rmSync(home, { recursive: true, force: true }); }
});

test("reconciliation fails closed for missing cleanup, mismatched authorization, and duplicate retry", () => {
  const legacyContent = content();
  const missingCleanup = evidence(); missingCleanup.cleanup.pop();
  assert.equal(reconcileLegacyBootstrapRecord({ authorization: authorization(legacyContent), legacy: { reference: "runs/bootstrap/controller.json", content: legacyContent }, evidence: missingCleanup, now }).reason, "legacy-reconciliation-evidence-invalid");
  const mismatched = authorization(legacyContent); mismatched.legacyRecords[0].recordDigest = digestValue({ other: true });
  assert.equal(reconcileLegacyBootstrapRecord({ authorization: mismatched, legacy: { reference: "runs/bootstrap/controller.json", content: legacyContent }, evidence: evidence(), now }).reason, "legacy-reconciliation-authorization-mismatch");
  const home = stateHome();
  try {
    const first = reconcileLegacyBootstrapRecord({ authorization: authorization(legacyContent), legacy: { reference: "runs/bootstrap/controller.json", content: legacyContent }, evidence: evidence(), now });
    const identity = { stateHome: home, readableRepositoryName: "repository", repositoryId: deriveRepositoryId("git@github.com:owner/repository.git") };
    assert.equal(publishLegacyReconciliationReceipt({ receipt: first.receipt, ...identity }).valid, true);
    assert.equal(publishLegacyReconciliationReceipt({ receipt: first.receipt, ...identity }).classification, "already-reconciled");
  } finally { fs.rmSync(home, { recursive: true, force: true }); }
});

test("receipt implementation is portable and does not embed fixture product values", () => {
  const source = fs.readFileSync(new URL("../autonomous-sdd-legacy-reconciliation.mjs", import.meta.url), "utf8");
  assert.doesNotMatch(source, /owner\/repository|bootstrap-change|github\.com/);
});

for (const disposition of ["terminalized", "cancelled"]) {
  test(`schema-5 stale checkpoint reconciles only from an immutable ${disposition} archive`, () => {
    const fixture = schema5ArchiveFixture(disposition);
    try {
      const reference = fixture.initialized.checkpointPath;
      const withoutReceipt = inventoryLegacyRecords([{ reference, content: fixture.legacyContent }], { reconciliationReceipts: [], now });
      assert.equal(withoutReceipt.classification, "ambiguous");
      assert.equal(withoutReceipt.entries[0].schemaVersion, 5);

      const genericOnly = reconcileLegacyBootstrapRecord({ authorization: authorization(fixture.legacyContent, { reference }), legacy: { reference, content: fixture.legacyContent }, evidence: evidence(), now });
      assert.equal(genericOnly.reason, "legacy-reconciliation-archive-evidence-invalid");
      assert.equal(reconcileLegacyBootstrapRecord({ legacy: { reference, content: fixture.legacyContent }, stateHome: fixture.home,
        readableRepositoryName: "repository", repositoryId: fixture.initialized.admission.repositoryId, canonicalRemote, now }).reason, "legacy-reconciliation-input-invalid");
      assert.equal(reconcileLegacyBootstrapRecord({ authorization: authorization(fixture.legacyContent, { reference, expiresAt: "2026-08-21T00:00:00.000Z" }),
        legacy: { reference, content: fixture.legacyContent }, stateHome: fixture.home, readableRepositoryName: "repository",
        repositoryId: fixture.initialized.admission.repositoryId, canonicalRemote, now }).reason, "legacy-reconciliation-input-invalid");

      const reconciled = reconcileLegacyBootstrapRecord({
        authorization: authorization(fixture.legacyContent, { reference }),
        legacy: { reference, content: fixture.legacyContent },
        stateHome: fixture.home,
        readableRepositoryName: "repository",
        repositoryId: fixture.initialized.admission.repositoryId,
        canonicalRemote,
        now
      });
      assert.equal(reconciled.valid, true, JSON.stringify(reconciled));
      assert.equal(reconciled.receipt.schemaVersion, 2);
      assert.equal(reconciled.receipt.runId, fixture.initialized.record.runId);
      assert.equal(reconciled.receipt.terminalEvidenceKind, disposition === "terminalized" ? "terminalization-receipt" : "cancellation-receipt");
      const withReceipt = inventoryLegacyRecords([{ reference, content: fixture.legacyContent }], { reconciliationReceipts: [reconciled.receipt], now });
      assert.equal(withReceipt.classification, "compatible");
      assert.equal(withReceipt.entries[0].classification, "compatible-terminal");
      assert.equal(inventoryLegacyRecords([{ reference, content: fixture.legacyContent }], {
        reconciliationReceipts: [{ ...reconciled.receipt, unexpected: "untrusted" }], now
      }).classification, "ambiguous");

      const mismatchedArchive = reconcileLegacyBootstrapRecord({
        authorization: authorization(fixture.legacyContent, { reference }),
        legacy: { reference, content: fixture.legacyContent },
        stateHome: fixture.home,
        readableRepositoryName: "repository",
        repositoryId: `r1-${"f".repeat(64)}`,
        canonicalRemote,
        now
      });
      assert.equal(mismatchedArchive.reason, "legacy-reconciliation-archive-evidence-invalid");
      const mismatchedRemote = reconcileLegacyBootstrapRecord({
        authorization: authorization(fixture.legacyContent, { reference }),
        legacy: { reference, content: fixture.legacyContent },
        stateHome: fixture.home,
        readableRepositoryName: "repository",
        repositoryId: fixture.initialized.admission.repositoryId,
        canonicalRemote: "git@github.com:other/repository.git",
        now
      });
      assert.equal(mismatchedRemote.reason, "legacy-reconciliation-archive-evidence-invalid");

      const futureContent = content({ ...JSON.parse(fixture.legacyContent), schemaVersion: 99 });
      const futureReceipt = { ...reconciled.receipt, recordDigest: legacyRecordDigest(futureContent) };
      assert.equal(inventoryLegacyRecords([{ reference, content: futureContent }], { reconciliationReceipts: [futureReceipt], now }).classification, "ambiguous");

      const malformedContent = content({ ...JSON.parse(fixture.legacyContent), allowedLifecycleChain: ["propose"] });
      assert.equal(reconcileLegacyBootstrapRecord({ authorization: authorization(malformedContent, { reference }),
        legacy: { reference, content: malformedContent }, stateHome: fixture.home, readableRepositoryName: "repository",
        repositoryId: fixture.initialized.admission.repositoryId, canonicalRemote, now }).reason, "legacy-reconciliation-archive-evidence-invalid");

      if (disposition === "terminalized") {
        const parentPath = path.join(fixture.archivePath, "parent-run.json");
        const parentContent = fs.readFileSync(parentPath, "utf8");
        const projection = JSON.parse(fs.readFileSync(path.join(fixture.archivePath, "projection.json"), "utf8"));
        fs.writeFileSync(parentPath, `${JSON.stringify({ ...JSON.parse(parentContent), children: projection.children })}\n`);
        assert.equal(reconcileLegacyBootstrapRecord({ authorization: authorization(fixture.legacyContent, { reference }),
          legacy: { reference, content: fixture.legacyContent }, stateHome: fixture.home, readableRepositoryName: "repository",
          repositoryId: fixture.initialized.admission.repositoryId, canonicalRemote, now }).reason, "legacy-reconciliation-archive-evidence-invalid");
        fs.writeFileSync(parentPath, parentContent);

        const relocatedParent = path.join(fixture.home, "relocated-parent-run.json");
        fs.renameSync(parentPath, relocatedParent);
        fs.symlinkSync(relocatedParent, parentPath);
        assert.equal(reconcileLegacyBootstrapRecord({ authorization: authorization(fixture.legacyContent, { reference }),
          legacy: { reference, content: fixture.legacyContent }, stateHome: fixture.home, readableRepositoryName: "repository",
          repositoryId: fixture.initialized.admission.repositoryId, canonicalRemote, now }).reason, "legacy-reconciliation-archive-evidence-invalid");
      }
      assert.equal(fs.readFileSync(reference, "utf8"), fixture.legacyContent);
    } finally {
      fs.rmSync(fixture.home, { recursive: true, force: true });
      fs.rmSync(fixture.repositoryPath, { recursive: true, force: true });
    }
  });
}

test("the declared controller verb publishes a receipt without selecting a v2 lifecycle phase", () => {
  const home = stateHome();
  const legacyContent = content();
  try {
    const module = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../runtime/bin/autonomous-sdd-controller.mjs");
    const payload = { authorization: authorization(legacyContent), legacy: { reference: "runs/bootstrap/controller.json", content: legacyContent }, evidence: evidence(), now, stateHome: home, readableRepositoryName: "repository", repositoryId: deriveRepositoryId("git@github.com:owner/repository.git") };
    const invoked = spawnSync(process.execPath, [module, "reconcile-legacy-bootstrap-record", "--stdin"], { input: JSON.stringify(payload), encoding: "utf8" });
    assert.equal(invoked.status, 0, invoked.stderr);
    const output = JSON.parse(invoked.stdout);
    assert.equal(output.ok, true);
    assert.equal(output.result.classification, "reconciled");
    assert.equal(output.result.receipt.v2Authority, false);
    assert.equal(fs.existsSync(path.join(home, "repositories", "repository--" + payload.repositoryId.slice(3, 15), "active")), false);
  } finally { fs.rmSync(home, { recursive: true, force: true }); }
});
