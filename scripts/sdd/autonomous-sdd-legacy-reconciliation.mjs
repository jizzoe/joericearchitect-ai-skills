import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { digestValue, normalizeCanonicalRemote } from "./autonomous-sdd-run-contract.mjs";

const text = (value) => typeof value === "string" && value.trim().length > 0;
const object = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const digest = /^[0-9a-f]{64}$/i;
const timestamp = (value) => typeof value === "string" && !Number.isNaN(Date.parse(value));
const commit = /^[0-9a-f]{40,64}$/i;
const fail = (reason, extra = {}) => ({ valid: false, reason, classification: "paused", ...extra });

/** Hashes exact legacy bytes when available; object inputs are for deterministic fixtures only. */
export function legacyRecordDigest(content) {
  if (typeof content === "string") return crypto.createHash("sha256").update(content).digest("hex");
  return object(content) ? digestValue(content) : null;
}

export function reconciliationReceiptId({ reference, recordDigest }) {
  return `legacy-reconciliation-${crypto.createHash("sha256").update(`${reference}:${recordDigest}`).digest("hex").slice(0, 32)}`;
}

function validateAuthorization(value, now) {
  if (!object(value) || value.schemaVersion !== 1 || value.approved !== true || !text(value.id) || !digest.test(value.scopeDigest ?? "") ||
      !text(value.repository) || !text(value.selectedEntry) || !timestamp(value.expiresAt) || Date.parse(value.expiresAt) <= Date.parse(now) ||
      !Array.isArray(value.legacyRecords) || value.legacyRecords.length !== 1) return null;
  const binding = value.legacyRecords[0];
  if (!object(binding) || !text(binding.reference) || !digest.test(binding.recordDigest ?? "")) return null;
  return binding;
}

function validDelivery(value) {
  return object(value) && value.merged === true && text(value.reference) && commit.test(value.topicHeadCommit ?? "") && commit.test(value.deliveredHeadCommit ?? "");
}

function validEvidence(evidence, legacy, now) {
  if (!object(evidence) || !timestamp(evidence.observedAt) || Date.parse(evidence.observedAt) > Date.parse(now) ||
      Date.parse(now) - Date.parse(evidence.observedAt) > 15 * 60 * 1000 || !object(evidence.issue) || evidence.issue.state !== "CLOSED" ||
      !text(evidence.issue.reference) || !validDelivery(evidence.implementation) || !validDelivery(evidence.sync) || !validDelivery(evidence.archive) ||
      !Array.isArray(evidence.cleanup)) return false;
  const expected = Array.isArray(legacy.resourceRecords) ? legacy.resourceRecords.map((resource) => `${resource?.kind}:${resource?.id}`).filter((id) => !id.includes("undefined")) : [];
  const completed = new Set(evidence.cleanup.filter((item) => object(item) && item.status === "completed" && text(item.kind) && text(item.id)).map((item) => `${item.kind}:${item.id}`));
  return expected.every((id) => completed.has(id));
}

function parseLegacy(content) {
  if (typeof content === "string") {
    try { return JSON.parse(content); } catch { return null; }
  }
  return object(content) ? content : null;
}

export function validateLegacyReconciliationReceipt(receipt, { reference, recordDigest, selectedEntry, repository, now = new Date().toISOString() } = {}) {
  if (!object(receipt) || receipt.schemaVersion !== 1 || receipt.kind !== "legacy-reconciliation-receipt" || !text(receipt.receiptId) ||
      !text(receipt.reference) || !digest.test(receipt.recordDigest ?? "") || !text(receipt.selectedEntry) || !text(receipt.repository) ||
      !digest.test(receipt.authorizationScopeDigest ?? "") || !digest.test(receipt.evidenceDigest ?? "") || !timestamp(receipt.reconciledAt) ||
      receipt.classification !== "compatible-terminal" || receipt.v2Authority !== false || receipt.nativeClaim !== false || receipt.legacyMutation !== false ||
      !text(receipt.recoveryReference)) return false;
  return receipt.reference === reference && receipt.recordDigest === recordDigest && receipt.selectedEntry === selectedEntry && receipt.repository === repository && Date.parse(receipt.reconciledAt) <= Date.parse(now);
}

export function reconcileLegacyBootstrapRecord({ authorization, legacy, evidence, now = new Date().toISOString() } = {}) {
  const bound = validateAuthorization(authorization, now);
  const record = parseLegacy(legacy?.content);
  const recordDigest = legacyRecordDigest(legacy?.content);
  if (!bound || !record || !recordDigest || !text(legacy?.reference) || !text(record.selectedEntry) || !text(record.repository)) return fail("legacy-reconciliation-input-invalid");
  if (legacy?.reference !== bound.reference || recordDigest !== bound.recordDigest || record.selectedEntry !== authorization.selectedEntry || record.repository !== authorization.repository) return fail("legacy-reconciliation-authorization-mismatch");
  if (record.currentPhase === null || (Array.isArray(record.steps) && record.steps.length > 0 && record.steps.every((step) => step?.status === "complete"))) return fail("legacy-reconciliation-not-active");
  if (!validEvidence(evidence, record, now)) return fail("legacy-reconciliation-evidence-invalid");
  const receipt = Object.freeze({
    schemaVersion: 1,
    kind: "legacy-reconciliation-receipt",
    receiptId: reconciliationReceiptId({ reference: legacy.reference, recordDigest }),
    reference: legacy.reference,
    recordDigest,
    selectedEntry: record.selectedEntry,
    repository: record.repository,
    authorizationScopeDigest: authorization.scopeDigest,
    evidenceDigest: digestValue(evidence),
    reconciledAt: now,
    classification: "compatible-terminal",
    v2Authority: false,
    nativeClaim: false,
    legacyMutation: false,
    recoveryReference: "re-run exact legacy reconciliation with the same record and fresh evidence"
  });
  return { valid: true, classification: "compatible-terminal", receipt };
}

export function reconciliationDirectory({ stateHome, readableRepositoryName, repositoryId }) {
  if (!text(stateHome) || !text(readableRepositoryName) || !/^r1-[0-9a-f]{64}$/i.test(repositoryId ?? "")) return null;
  return path.join(path.resolve(stateHome), "repositories", `${readableRepositoryName}--${repositoryId.slice(3, 15)}`, "reconciliations");
}

export function publishLegacyReconciliationReceipt({ receipt, stateHome, readableRepositoryName, repositoryId, fileSystem = fs } = {}) {
  const directory = reconciliationDirectory({ stateHome, readableRepositoryName, repositoryId });
  if (!directory || !validateLegacyReconciliationReceipt(receipt, { reference: receipt?.reference, recordDigest: receipt?.recordDigest, selectedEntry: receipt?.selectedEntry, repository: receipt?.repository })) return fail("legacy-reconciliation-receipt-invalid");
  const destination = path.join(directory, `${receipt.receiptId}.json`);
  try {
    fileSystem.mkdirSync(directory, { recursive: true, mode: 0o700 });
    if (fileSystem.existsSync(destination)) {
      const existing = JSON.parse(fileSystem.readFileSync(destination, "utf8"));
      return digestValue(existing) === digestValue(receipt) ? { valid: true, classification: "already-reconciled", receipt: existing, path: destination } : fail("legacy-reconciliation-receipt-conflict");
    }
    const temporary = path.join(directory, `.${receipt.receiptId}.${crypto.randomUUID()}.tmp`);
    const handle = fileSystem.openSync(temporary, "wx", 0o600);
    try { fileSystem.writeFileSync(handle, `${JSON.stringify(receipt)}\n`, "utf8"); fileSystem.fsyncSync(handle); } finally { fileSystem.closeSync(handle); }
    fileSystem.renameSync(temporary, destination);
    return { valid: true, classification: "reconciled", receipt, path: destination };
  } catch { return fail("legacy-reconciliation-receipt-persist-failed"); }
}

export function inventoryLegacyReconciliationReceipts({ stateHome, readableRepositoryName, repositoryId, fileSystem = fs } = {}) {
  const directory = reconciliationDirectory({ stateHome, readableRepositoryName, repositoryId });
  if (!directory) return { valid: false, reason: "legacy-reconciliation-directory-invalid" };
  try {
    if (!fileSystem.existsSync(directory)) return { valid: true, receipts: [] };
    const receipts = fileSystem.readdirSync(directory, { withFileTypes: true }).filter((entry) => entry.isFile() && entry.name.endsWith(".json")).map((entry) => JSON.parse(fileSystem.readFileSync(path.join(directory, entry.name), "utf8")));
    return { valid: true, receipts };
  } catch { return { valid: false, reason: "legacy-reconciliation-directory-unreadable" }; }
}

export function configuredRepositoryIdentity(canonicalRemote) {
  return normalizeCanonicalRemote(canonicalRemote);
}
