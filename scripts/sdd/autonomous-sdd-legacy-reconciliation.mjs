import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import {
  deriveRepositoryId,
  digestValue,
  normalizeCanonicalRemote,
  validateBootstrapPreSnapshotWorkUnit,
  validateDomainRecord
} from "./autonomous-sdd-run-contract.mjs";
import { statePaths } from "./autonomous-sdd-local-store.mjs";

const text = (value) => typeof value === "string" && value.trim().length > 0;
const object = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const digest = /^[0-9a-f]{64}$/i;
const identifier = /^[a-z0-9][a-z0-9-]{2,127}$/i;
const timestamp = (value) => typeof value === "string" && !Number.isNaN(Date.parse(value));
const commit = /^[0-9a-f]{40,64}$/i;
const controllerPhases = Object.freeze(["propose", "planning-review", "apply", "verify", "delivery", "sync", "archive", "cleanup"]);
const fail = (reason, extra = {}) => ({ valid: false, reason, classification: "paused", ...extra });
const exactKeys = (value, keys) => object(value) && Object.keys(value).length === keys.length && Object.keys(value).every((key) => keys.includes(key));
const receiptKeys = Object.freeze([
  "schemaVersion", "kind", "receiptId", "reference", "recordDigest", "selectedEntry", "repository",
  "authorizationScopeDigest", "evidenceDigest", "reconciledAt", "classification", "v2Authority", "nativeClaim",
  "legacyMutation", "recoveryReference"
]);

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

function validDeliveryEvidence(evidence, legacy, now) {
  if (!object(evidence) || !timestamp(evidence.observedAt) || Date.parse(evidence.observedAt) > Date.parse(now) ||
      Date.parse(now) - Date.parse(evidence.observedAt) > 15 * 60 * 1000 || !object(evidence.issue) || evidence.issue.state !== "CLOSED" ||
      !text(evidence.issue.reference) || !validDelivery(evidence.implementation) || !validDelivery(evidence.sync) || !validDelivery(evidence.archive) ||
      !Array.isArray(evidence.cleanup)) return false;
  const expected = Array.isArray(legacy.resourceRecords) ? legacy.resourceRecords.map((resource) => `${resource?.kind}:${resource?.id}`).filter((id) => !id.includes("undefined")) : [];
  const completed = new Set(evidence.cleanup.filter((item) => object(item) && item.status === "completed" && text(item.kind) && text(item.id)).map((item) => `${item.kind}:${item.id}`));
  return expected.every((id) => completed.has(id));
}

function safeArchiveJson(fileSystem, archive, target) {
  try {
    const entry = fileSystem.lstatSync(target);
    if (!entry.isFile() || entry.isSymbolicLink()) return null;
    const canonical = fileSystem.realpathSync(target);
    if (!canonical.startsWith(`${archive}${path.sep}`)) return null;
    return JSON.parse(fileSystem.readFileSync(canonical, "utf8"));
  } catch { return null; }
}

function terminalSummaryDigest(summary) {
  if (!object(summary)) return null;
  const value = { ...summary };
  delete value.terminalSummaryDigest;
  return digestValue(value);
}

function archiveMatchesFor(paths, parentRunId, fileSystem) {
  const matches = [];
  try {
    if (!fileSystem.existsSync(paths.archive) || fileSystem.lstatSync(paths.archive).isSymbolicLink()) return matches;
    const root = fileSystem.realpathSync(paths.archive);
    for (const year of fileSystem.readdirSync(root, { withFileTypes: true })) {
      if (!year.isDirectory() || !/^\d{4}$/.test(year.name)) continue;
      const yearPath = path.join(root, year.name);
      if (fileSystem.lstatSync(yearPath).isSymbolicLink()) continue;
      for (const month of fileSystem.readdirSync(yearPath, { withFileTypes: true })) {
        if (!month.isDirectory() || !/^\d{2}$/.test(month.name)) continue;
        const monthPath = path.join(yearPath, month.name);
        if (fileSystem.lstatSync(monthPath).isSymbolicLink()) continue;
        for (const day of fileSystem.readdirSync(monthPath, { withFileTypes: true })) {
          if (!day.isDirectory() || !/^\d{2}$/.test(day.name)) continue;
          const dayPath = path.join(monthPath, day.name);
          if (fileSystem.lstatSync(dayPath).isSymbolicLink()) continue;
          const candidate = path.join(dayPath, parentRunId);
          if (!fileSystem.existsSync(candidate) || !fileSystem.lstatSync(candidate).isDirectory() || fileSystem.lstatSync(candidate).isSymbolicLink()) continue;
          const canonical = fileSystem.realpathSync(candidate);
          if (canonical !== root && canonical.startsWith(`${root}${path.sep}`)) matches.push(canonical);
        }
      }
    }
  } catch { return []; }
  return matches;
}

function validateSchema5ArchiveEvidence(controller, {
  stateHome, readableRepositoryName, repositoryId, canonicalRemote, fileSystem = fs
} = {}) {
  const admission = controller?.v2Admission;
  const canonicalIdentity = normalizeCanonicalRemote(canonicalRemote);
  const repositoryName = canonicalIdentity?.slice(canonicalIdentity.indexOf("/") + 1);
  if (controller?.schemaVersion !== 5 || !identifier.test(controller.runId ?? "") || !digest.test(controller.authorizationDigest ?? "") ||
      controller.runId !== `controller-${controller.authorizationDigest.slice(0, 32)}` || !timestamp(controller.expiresAt) ||
      controller.checkpointPath !== path.posix.join("runs", controller.runId, "controller.json") || admission?.state !== "admitted" ||
      !identifier.test(controller.selectedEntry ?? "") || !text(controller.repository) || !controllerPhases.includes(controller.currentPhase) ||
      JSON.stringify(controller.allowedLifecycleChain) !== JSON.stringify(controllerPhases) || !Array.isArray(controller.steps) ||
      controller.steps.length !== controllerPhases.length || controller.steps.some((step, index) => step?.id !== controllerPhases[index]) ||
      !canonicalIdentity || repositoryName !== controller.repository.toLowerCase() || deriveRepositoryId(canonicalRemote) !== repositoryId ||
      admission.repositoryId !== repositoryId || !identifier.test(admission.parentRunId ?? "") ||
      !identifier.test(admission.workUnitId ?? "") || !identifier.test(admission.claimId ?? "") || !timestamp(admission.admittedAt) ||
      !text(admission.providerBinding?.id) || !digest.test(admission.providerBinding?.digest ?? "")) return null;
  const paths = statePaths({ stateHome, readableName: readableRepositoryName, repositoryId });
  if (!paths) return null;
  const archives = archiveMatchesFor(paths, admission.parentRunId, fileSystem);
  try {
    if (archives.length !== 1 || fileSystem.existsSync(path.join(paths.active, admission.parentRunId))) return null;
  } catch { return null; }
  const archive = archives[0];
  const records = Object.fromEntries([
    "parent-run", "work-unit", "resource-claim", "terminalization-receipt", "cancellation-receipt", "claim-release", "projection", "archive-manifest"
  ].map((name) => [name, safeArchiveJson(fileSystem, archive, path.join(archive, `${name}.json`))]));
  const parent = records["parent-run"];
  const workUnit = records["work-unit"];
  const claim = records["resource-claim"];
  const terminalizationReceipt = records["terminalization-receipt"];
  const cancellationReceipt = records["cancellation-receipt"];
  const release = records["claim-release"];
  const projection = records.projection;
  const manifest = records["archive-manifest"];
  const terminalized = terminalizationReceipt != null;
  const cancelled = cancellationReceipt != null;
  if (terminalized === cancelled) return null;
  const required = [parent, claim, terminalized ? terminalizationReceipt : cancellationReceipt, release, projection, manifest];
  const validations = required.map((record) => validateDomainRecord(record));
  const workUnitValid = validateDomainRecord(workUnit).valid || validateBootstrapPreSnapshotWorkUnit(workUnit);
  if (!workUnitValid || validations.some((validation) => !validation.valid)) return null;
  const receipt = terminalized ? terminalizationReceipt : cancellationReceipt;
  const receiptValidation = validateDomainRecord(receipt);
  const summary = terminalized ? receipt.terminalSummary : projection.children?.[0];
  const sameProvider = (binding) => binding?.id === admission.providerBinding?.id && binding?.digest === admission.providerBinding?.digest;
  const releasedReceiptDigest = terminalized ? release.terminalizationReceiptDigest : release.cancellationReceiptDigest;
  const checks = {
    authorization: controller.authorizationDigest === parent.approvedIntentDigest && controller.authorizationDigest === workUnit.authorizationDigest,
    deadline: controller.expiresAt === parent.deadline,
    parent: admission.parentRunId === parent.parentRunId && parent.children.length === 0,
    workUnit: admission.workUnitId === workUnit.workUnitId && workUnit.parentRunId === parent.parentRunId,
    claim: admission.claimId === claim.claimId && claim.workUnitId === workUnit.workUnitId && claim.repositoryId === repositoryId && claim.state === "active",
    change: workUnit.approvedChangeId === controller.selectedEntry && receipt.approvedChangeId === controller.selectedEntry,
    receipt: receipt.parentRunId === parent.parentRunId && receipt.workUnitId === workUnit.workUnitId && receipt.claimId === claim.claimId && receipt.repositoryId === repositoryId,
    cancellation: terminalized || (receipt.controllerRunId === controller.runId && receipt.expiresAt === controller.expiresAt),
    release: release.claimId === claim.claimId && release.workUnitId === workUnit.workUnitId && release.repositoryId === repositoryId &&
      release.disposition === "released" && releasedReceiptDigest === receiptValidation.digest,
    provider: sameProvider(parent.claimProviderBinding) && sameProvider(workUnit.claimProviderBinding) && sameProvider(claim.providerBinding),
    projection: projection.parentRunId === parent.parentRunId && projection.children?.length === 1 && digestValue(projection.children[0]) === digestValue(summary),
    manifest: manifest.parentRunId === parent.parentRunId && manifest.projectionDigest === validateDomainRecord(projection).digest &&
      manifest.reason === summary?.terminalReason && manifest.archivedAt === receipt.createdAt && manifest.archivedAt === release.releasedAt,
    summary: summary?.workUnitId === workUnit.workUnitId && summary?.approvedChangeId === controller.selectedEntry &&
      summary?.claimDisposition === "released" && summary?.terminalSummaryDigest === terminalSummaryDigest(summary) &&
      (terminalized
        ? summary?.terminalStatus === "complete" && summary?.cleanupDisposition === "completed"
        : summary?.terminalStatus === "cancelled" && summary?.cleanupDisposition === "cancelled")
  };
  if (!Object.values(checks).every(Boolean)) return null;
  return {
    evidenceDigest: digestValue({ parent, workUnit, claim, receipt, release, projection, manifest }),
    terminalEvidenceKind: terminalized ? "terminalization-receipt" : "cancellation-receipt"
  };
}

function parseLegacy(content) {
  if (typeof content === "string") {
    try { return JSON.parse(content); } catch { return null; }
  }
  return object(content) ? content : null;
}

export function validateLegacyReconciliationReceipt(receipt, {
  reference, recordDigest, sourceSchemaVersion, runId, selectedEntry, repository, now = new Date().toISOString()
} = {}) {
  const expectedKeys = receipt?.schemaVersion === 2 ? [...receiptKeys, "runId", "terminalEvidenceKind"] : receiptKeys;
  if (!exactKeys(receipt, expectedKeys) || ![1, 2].includes(receipt.schemaVersion) || receipt.kind !== "legacy-reconciliation-receipt" || !text(receipt.receiptId) ||
      !text(receipt.reference) || !digest.test(receipt.recordDigest ?? "") || !text(receipt.selectedEntry) || !text(receipt.repository) ||
      !digest.test(receipt.authorizationScopeDigest ?? "") || !digest.test(receipt.evidenceDigest ?? "") || !timestamp(receipt.reconciledAt) ||
      receipt.classification !== "compatible-terminal" || receipt.v2Authority !== false || receipt.nativeClaim !== false || receipt.legacyMutation !== false ||
      !text(receipt.recoveryReference)) return false;
  const schemaMatches = sourceSchemaVersion === 5
    ? receipt.schemaVersion === 2 && receipt.runId === runId && identifier.test(receipt.runId ?? "") &&
      ["terminalization-receipt", "cancellation-receipt"].includes(receipt.terminalEvidenceKind)
    : [1, 2, 3, 4].includes(sourceSchemaVersion) && receipt.schemaVersion === 1;
  return schemaMatches && receipt.reference === reference && receipt.recordDigest === recordDigest && receipt.selectedEntry === selectedEntry &&
    receipt.repository === repository && Date.parse(receipt.reconciledAt) <= Date.parse(now);
}

export function reconcileLegacyBootstrapRecord({
  authorization, legacy, evidence, stateHome, readableRepositoryName, repositoryId, canonicalRemote,
  now = new Date().toISOString(), fileSystem = fs
} = {}) {
  const bound = validateAuthorization(authorization, now);
  const record = parseLegacy(legacy?.content);
  const recordDigest = legacyRecordDigest(legacy?.content);
  if (!bound || !record || !recordDigest || ![1, 2, 3, 4, 5].includes(record.schemaVersion) || !text(legacy?.reference) ||
      !text(record.runId) || !text(record.selectedEntry) || !text(record.repository)) return fail("legacy-reconciliation-input-invalid");
  if (legacy?.reference !== bound.reference || recordDigest !== bound.recordDigest || record.selectedEntry !== authorization.selectedEntry || record.repository !== authorization.repository) return fail("legacy-reconciliation-authorization-mismatch");
  if (record.currentPhase === null || (Array.isArray(record.steps) && record.steps.length > 0 && record.steps.every((step) => step?.status === "complete"))) return fail("legacy-reconciliation-not-active");
  const schema5Archive = record.schemaVersion === 5
    ? validateSchema5ArchiveEvidence(record, { stateHome, readableRepositoryName, repositoryId, canonicalRemote, fileSystem })
    : null;
  if (record.schemaVersion === 5 ? !schema5Archive : !validDeliveryEvidence(evidence, record, now)) {
    return fail(record.schemaVersion === 5 ? "legacy-reconciliation-archive-evidence-invalid" : "legacy-reconciliation-evidence-invalid");
  }
  const receipt = Object.freeze({
    schemaVersion: record.schemaVersion === 5 ? 2 : 1,
    kind: "legacy-reconciliation-receipt",
    receiptId: reconciliationReceiptId({ reference: legacy.reference, recordDigest }),
    reference: legacy.reference,
    recordDigest,
    selectedEntry: record.selectedEntry,
    repository: record.repository,
    ...(record.schemaVersion === 5 ? { runId: record.runId, terminalEvidenceKind: schema5Archive.terminalEvidenceKind } : {}),
    authorizationScopeDigest: authorization.scopeDigest,
    evidenceDigest: record.schemaVersion === 5 ? schema5Archive.evidenceDigest : digestValue(evidence),
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
  const sourceSchemaVersion = receipt?.schemaVersion === 2 ? 5 : 1;
  if (!directory || !validateLegacyReconciliationReceipt(receipt, { reference: receipt?.reference, recordDigest: receipt?.recordDigest,
    sourceSchemaVersion, runId: receipt?.runId, selectedEntry: receipt?.selectedEntry, repository: receipt?.repository })) return fail("legacy-reconciliation-receipt-invalid");
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
