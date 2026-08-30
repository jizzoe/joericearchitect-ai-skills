import fs from "node:fs";
import path from "node:path";

import { legacyRecordDigest, validateLegacyReconciliationReceipt } from "./autonomous-sdd-legacy-reconciliation.mjs";
import { validatePendingRetirementReceipt } from "./autonomous-sdd-pending-retirement.mjs";

const text = (value) => typeof value === "string" && value.trim().length > 0;
const object = (value) => value !== null && typeof value === "object" && !Array.isArray(value);

function classifyRecord(record, reference) {
  if (!object(record)) return { reference, classification: "ambiguous", reason: "legacy-record-not-object" };
  if (![1, 2, 3, 4].includes(record.schemaVersion)) {
    const identity = { schemaVersion: record.schemaVersion };
    if (text(record.runId)) identity.runId = record.runId;
    if (text(record.selectedEntry)) identity.selectedEntry = record.selectedEntry;
    if (text(record.repository)) identity.repository = record.repository;
    return { reference, classification: "ambiguous", reason: "legacy-schema-unknown", ...identity };
  }
  if (!text(record.runId) || !text(record.selectedEntry) || !text(record.repository)) {
    return { reference, classification: "ambiguous", reason: "legacy-record-identity-incomplete" };
  }
  const terminal = record.currentPhase === null || (Array.isArray(record.steps) && record.steps.length > 0 && record.steps.every((step) => step?.status === "complete"));
  return {
    reference,
    classification: terminal ? "compatible-terminal" : "active-legacy",
    reason: terminal ? "legacy-record-terminal" : "legacy-record-still-authoritative",
    runId: record.runId,
    selectedEntry: record.selectedEntry,
    repository: record.repository
  };
}

/** Decode legacy content only. This function never writes, upgrades, or deletes it. */
export function decodeLegacyRecord(content, { reference = "legacy:unknown" } = {}) {
  if (typeof content === "string") {
    try { return classifyRecord(JSON.parse(content), reference); } catch { return { reference, classification: "ambiguous", reason: "legacy-record-json-invalid" }; }
  }
  return classifyRecord(content, reference);
}

/** Deterministically inventory caller-provided legacy evidence without mutating it. */
export function inventoryLegacyRecords(records = [], { reconciliationReceipts = [], pendingRetirementReceipts = [], now = new Date().toISOString() } = {}) {
  if (!Array.isArray(records)) return { valid: false, reason: "legacy-inventory-input-invalid" };
  if (!Array.isArray(reconciliationReceipts)) return { valid: false, reason: "legacy-reconciliation-inventory-input-invalid" };
  if (!Array.isArray(pendingRetirementReceipts)) return { valid: false, reason: "legacy-pending-retirement-inventory-input-invalid" };
  const entries = records.map((item, index) => {
    const content = item?.content ?? item?.record ?? item;
    const reference = item?.reference ?? `legacy:${index}`;
    const entry = decodeLegacyRecord(content, { reference });
    const recordDigest = legacyRecordDigest(content);
    const reconcilable = entry.classification === "active-legacy" ||
      (entry.classification === "ambiguous" && entry.reason === "legacy-schema-unknown" && entry.schemaVersion === 5 &&
        text(entry.runId) && text(entry.selectedEntry) && text(entry.repository));
    const reconciled = reconcilable && reconciliationReceipts.some((receipt) =>
      validateLegacyReconciliationReceipt(receipt, { reference, recordDigest, sourceSchemaVersion: entry.schemaVersion === 5 ? 5 : 1,
        runId: entry.runId, selectedEntry: entry.selectedEntry, repository: entry.repository, now })
    );
    const pendingRetired = entry.classification === "ambiguous" && entry.reason === "legacy-schema-unknown" &&
      entry.schemaVersion === 5 && text(entry.runId) && text(entry.selectedEntry) && text(entry.repository) &&
      pendingRetirementReceipts.some((receipt) =>
        validatePendingRetirementReceipt(receipt, { reference, recordDigest, selectedEntry: entry.selectedEntry, repository: entry.repository, now })
      );
    return (reconciled || pendingRetired)
      ? { ...entry, classification: "compatible-terminal", reason: pendingRetired ? "legacy-record-pending-retired" : "legacy-record-terminal-reconciled" }
      : entry;
  });
  const ambiguous = entries.filter((entry) => entry.classification === "ambiguous");
  const active = entries.filter((entry) => entry.classification === "active-legacy");
  return Object.freeze({
    valid: true,
    entries: Object.freeze(entries),
    classification: ambiguous.length ? "ambiguous" : active.length ? "active-legacy" : "compatible",
    ambiguous: Object.freeze(ambiguous),
    active: Object.freeze(active)
  });
}

/** Read actual legacy controller candidates without rewriting their content or timestamps. */
export function inventoryLegacyDirectory(directory, {
  fileSystem = fs, reconciliationReceipts = [], excludedReferences = [], now = new Date().toISOString()
} = {}) {
  if (!text(directory)) return { valid: false, reason: "legacy-directory-input-invalid" };
  if (!Array.isArray(excludedReferences)) return { valid: false, reason: "legacy-inventory-exclusion-invalid" };
  try {
    const canonical = (reference) => {
      const resolved = path.resolve(reference);
      return fileSystem.existsSync(resolved) && typeof fileSystem.realpathSync === "function"
        ? path.resolve(fileSystem.realpathSync(resolved))
        : resolved;
    };
    const root = canonical(directory);
    const exclusions = new Set();
    for (const reference of excludedReferences) {
      if (!text(reference)) return { valid: false, reason: "legacy-inventory-exclusion-invalid" };
      const resolved = canonical(reference);
      const relative = path.relative(root, resolved);
      if (!relative || path.isAbsolute(relative) || relative === ".." || relative.startsWith(`..${path.sep}`) || path.basename(resolved) !== "controller.json") {
        return { valid: false, reason: "legacy-inventory-exclusion-invalid" };
      }
      exclusions.add(resolved);
    }
    if (!fileSystem.existsSync(directory)) return inventoryLegacyRecords([], { reconciliationReceipts, now });
    const files = [];
    const walk = (current) => {
      for (const entry of fileSystem.readdirSync(current, { withFileTypes: true })) {
        const target = path.join(current, entry.name);
        if (entry.isDirectory()) walk(target);
        else if (entry.isFile() && entry.name === "controller.json" && !exclusions.has(canonical(target))) {
          files.push({ reference: target, content: fileSystem.readFileSync(target, "utf8") });
        }
      }
    };
    walk(directory);
    return inventoryLegacyRecords(files, { reconciliationReceipts, now });
  } catch { return { valid: false, reason: "legacy-directory-unreadable" }; }
}

/** A permanent cutover guard used by former mutation entrypoints. */
export function denyLegacyMutation() {
  return { valid: false, reason: "legacy-write-denied", classification: "paused" };
}
