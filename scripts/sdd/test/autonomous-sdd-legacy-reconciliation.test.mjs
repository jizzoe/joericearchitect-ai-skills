import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { inventoryLegacyRecords } from "../autonomous-sdd-legacy.mjs";
import { inventoryLegacyReconciliationReceipts, legacyRecordDigest, publishLegacyReconciliationReceipt, reconcileLegacyBootstrapRecord } from "../autonomous-sdd-legacy-reconciliation.mjs";
import { deriveRepositoryId, digestValue } from "../autonomous-sdd-run-contract.mjs";

const now = "2026-08-21T01:00:00.000Z";
const stateHome = () => fs.mkdtempSync(path.join(os.tmpdir(), "legacy-reconciliation-"));
const record = () => ({ schemaVersion: 4, runId: "bootstrap-run-001", selectedEntry: "bootstrap-change", repository: "owner/repository", currentPhase: "propose", resourceRecords: [{ kind: "branch", id: "implementation" }, { kind: "branch", id: "archive" }] });
const content = (value = record()) => `${JSON.stringify(value)}\n`;
const authorization = (legacyContent) => ({ schemaVersion: 1, approved: true, id: "owner-bootstrap-reconciliation", scopeDigest: "a".repeat(64), expiresAt: "2026-08-21T02:00:00.000Z", selectedEntry: "bootstrap-change", repository: "owner/repository", legacyRecords: [{ reference: "runs/bootstrap/controller.json", recordDigest: legacyRecordDigest(legacyContent) }] });
const evidence = () => ({ observedAt: now, issue: { state: "CLOSED", reference: "issue-1" }, implementation: { merged: true, reference: "implementation-pr", topicHeadCommit: "1".repeat(40), deliveredHeadCommit: "2".repeat(40) }, sync: { merged: true, reference: "sync-pr", topicHeadCommit: "3".repeat(40), deliveredHeadCommit: "4".repeat(40) }, archive: { merged: true, reference: "archive-pr", topicHeadCommit: "5".repeat(40), deliveredHeadCommit: "6".repeat(40) }, cleanup: [{ kind: "branch", id: "implementation", status: "completed" }, { kind: "branch", id: "archive", status: "completed" }] });

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
