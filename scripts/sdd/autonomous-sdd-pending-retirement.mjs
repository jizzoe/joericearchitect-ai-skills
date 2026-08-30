import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { digestValue, deriveRepositoryId, normalizeCanonicalRemote } from "./autonomous-sdd-run-contract.mjs";
import { statePaths } from "./autonomous-sdd-local-store.mjs";
import { legacyRecordDigest, reconciliationDirectory } from "./autonomous-sdd-legacy-reconciliation.mjs";

const text = (value) => typeof value === "string" && value.trim().length > 0;
const object = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const digest = /^[0-9a-f]{64}$/i;
const identifier = /^[a-z0-9][a-z0-9-]{2,127}$/i;
const repositoryIdPattern = /^r1-[0-9a-f]{64}$/i;
const timestamp = (value) => typeof value === "string" && !Number.isNaN(Date.parse(value));
const controllerPhases = Object.freeze(["propose", "planning-review", "apply", "verify", "delivery", "sync", "archive", "cleanup"]);
const fail = (reason, extra = {}) => ({ valid: false, classification: "paused", reason, ...extra });
const providerBinding = (value) => object(value) && text(value.id) && digest.test(value.digest ?? "");

export function pendingRetirementReceiptId({ reference, recordDigest }) {
  if (!text(reference) || !digest.test(recordDigest ?? "")) return null;
  return `pending-retirement-${crypto.createHash("sha256").update(`${reference}:${recordDigest}`).digest("hex").slice(0, 32)}`;
}

function validateAuthorization(authorization, now) {
  if (!object(authorization) || authorization.schemaVersion !== 1 || authorization.approved !== true ||
      !text(authorization.id) || !digest.test(authorization.scopeDigest ?? "") ||
      !text(authorization.repository) || !text(authorization.selectedEntry) ||
      !timestamp(authorization.expiresAt) || Date.parse(authorization.expiresAt) <= Date.parse(now)) return null;
  const binding = authorization.pendingController;
  if (!object(binding) || !text(binding.reference) || !digest.test(binding.recordDigest ?? "") ||
      !identifier.test(binding.runId ?? "") || !identifier.test(binding.parentRunId ?? "") ||
      !identifier.test(binding.workUnitId ?? "") || !identifier.test(binding.claimId ?? "")) return null;
  return binding;
}

/**
 * Accepts only an expired, never-admitted, non-progressed schema-5 controller.
 * This is the narrow baseline the retirement transition may retire.
 */
export function validatePendingControllerBaseline(controller, { now = new Date().toISOString() } = {}) {
  const admission = controller?.v2Admission;
  if (!object(controller) || controller.schemaVersion !== 5 || !identifier.test(controller.runId ?? "") ||
      !digest.test(controller.authorizationDigest ?? "") || controller.runId !== `controller-${controller.authorizationDigest.slice(0, 32)}` ||
      !timestamp(controller.expiresAt) || Date.parse(controller.expiresAt) > Date.parse(now) ||
      controller.checkpointPath !== path.posix.join("runs", controller.runId, "controller.json") ||
      !identifier.test(controller.selectedEntry ?? "") || !text(controller.repository) ||
      controller.currentPhase !== "propose" ||
      JSON.stringify(controller.allowedLifecycleChain) !== JSON.stringify(controllerPhases) ||
      !Array.isArray(controller.steps) || controller.steps.length !== controllerPhases.length ||
      controller.steps.some((step, index) => step?.id !== controllerPhases[index] || step?.status !== "pending") ||
      !Array.isArray(controller.resourceRecords) || controller.resourceRecords.length !== 0 ||
      !Array.isArray(controller.issueIntakeRecords) || controller.issueIntakeRecords.length !== 0 ||
      !Array.isArray(controller.authContextRecords) || controller.authContextRecords.length !== 0 ||
      !Array.isArray(controller.cleanupReceipts) || controller.cleanupReceipts.length !== 0 ||
      !Array.isArray(controller.completedEntries) || controller.completedEntries.length !== 0 ||
      !object(admission) || admission.state !== "pending" || !identifier.test(admission.parentRunId ?? "") ||
      !identifier.test(admission.workUnitId ?? "") || !identifier.test(admission.claimId ?? "") ||
      !providerBinding(admission.providerBinding)) {
    return { valid: false, reason: "pending-controller-baseline-invalid" };
  }
  return { valid: true, admission };
}

function absenceFor(paths, parentRunId, fileSystem) {
  const activePath = path.join(paths.active, parentRunId);
  if (fileSystem.existsSync(activePath)) return { valid: false, reason: "pending-retirement-active-parent-present" };
  try {
    if (fileSystem.existsSync(paths.archive) && fileSystem.lstatSync(paths.archive).isDirectory() && !fileSystem.lstatSync(paths.archive).isSymbolicLink()) {
      const root = fileSystem.realpathSync(paths.archive);
      for (const year of fileSystem.readdirSync(root, { withFileTypes: true })) {
        if (!year.isDirectory() || !/^\d{4}$/.test(year.name)) continue;
        for (const month of fileSystem.readdirSync(path.join(root, year.name), { withFileTypes: true })) {
          if (!month.isDirectory() || !/^\d{2}$/.test(month.name)) continue;
          for (const day of fileSystem.readdirSync(path.join(root, year.name, month.name), { withFileTypes: true })) {
            if (!day.isDirectory() || !/^\d{2}$/.test(day.name)) continue;
            if (fileSystem.existsSync(path.join(root, year.name, month.name, day.name, parentRunId))) {
              return { valid: false, reason: "pending-retirement-archive-parent-present" };
            }
          }
        }
      }
    }
  } catch { return { valid: false, reason: "pending-retirement-archive-unreadable" }; }
  try {
    const statusPath = path.join(paths.index, "repository-status.json");
    if (fileSystem.existsSync(statusPath)) {
      const status = JSON.parse(fileSystem.readFileSync(statusPath, "utf8"));
      if (status?.parentRunId === parentRunId) return { valid: false, reason: "pending-retirement-projection-parent-present" };
    }
  } catch { return { valid: false, reason: "pending-retirement-projection-unreadable" }; }
  return { valid: true };
}

export function retireExpiredPendingController({
  authorization, controllerContent, reference, stateHome, readableRepositoryName, repositoryId, canonicalRemote,
  now = new Date().toISOString(), fileSystem = fs
} = {}) {
  const binding = validateAuthorization(authorization, now);
  if (!binding || typeof controllerContent !== "string") return fail("pending-retirement-input-invalid");
  const recordDigest = legacyRecordDigest(controllerContent);
  let controller;
  try { controller = JSON.parse(controllerContent); } catch { return fail("pending-retirement-input-invalid"); }
  const baseline = validatePendingControllerBaseline(controller, { now });
  if (!baseline.valid) return fail("pending-retirement-input-invalid");
  if (!digest.test(recordDigest) || binding.reference !== reference || binding.recordDigest !== recordDigest ||
      binding.runId !== controller.runId || binding.parentRunId !== baseline.admission.parentRunId ||
      binding.workUnitId !== baseline.admission.workUnitId || binding.claimId !== baseline.admission.claimId ||
      authorization.selectedEntry !== controller.selectedEntry || authorization.repository !== controller.repository) {
    return fail("pending-retirement-authorization-mismatch");
  }
  const canonicalIdentity = normalizeCanonicalRemote(canonicalRemote);
  const derivedRepositoryId = deriveRepositoryId(canonicalRemote);
  if (!canonicalIdentity || !derivedRepositoryId || derivedRepositoryId !== repositoryId || baseline.admission.repositoryId !== repositoryId) {
    return fail("pending-retirement-repository-mismatch");
  }
  const paths = statePaths({ stateHome, readableName: readableRepositoryName, repositoryId });
  if (!paths) return fail("pending-retirement-state-layout-invalid");
  const absence = absenceFor(paths, baseline.admission.parentRunId, fileSystem);
  if (!absence.valid) return fail(absence.reason);
  const receipt = Object.freeze({
    schemaVersion: 1,
    kind: "pending-controller-retirement-receipt",
    receiptId: pendingRetirementReceiptId({ reference, recordDigest }),
    reference,
    recordDigest,
    runId: controller.runId,
    selectedEntry: controller.selectedEntry,
    repository: controller.repository,
    repositoryId,
    parentRunId: baseline.admission.parentRunId,
    workUnitId: baseline.admission.workUnitId,
    claimId: baseline.admission.claimId,
    providerBinding: baseline.admission.providerBinding,
    authorizationScopeDigest: authorization.scopeDigest,
    absenceEvidenceDigest: digestValue({ active: "absent", archive: "absent", projection: "absent" }),
    reconciledAt: now,
    classification: "compatible-terminal",
    v2Authority: false,
    nativeClaim: false,
    legacyMutation: false,
    recoveryReference: "re-run exact pending-controller retirement with the same record and fresh absence evidence"
  });
  return { valid: true, classification: "compatible-terminal", receipt };
}

export function validatePendingRetirementReceipt(receipt, { reference, recordDigest, selectedEntry, repository, now = new Date().toISOString() } = {}) {
  if (!object(receipt) || receipt.schemaVersion !== 1 || receipt.kind !== "pending-controller-retirement-receipt" ||
      !text(receipt.receiptId) || !text(receipt.reference) || !digest.test(receipt.recordDigest ?? "") ||
      !identifier.test(receipt.runId ?? "") || !identifier.test(receipt.selectedEntry ?? "") || !text(receipt.repository) ||
      !repositoryIdPattern.test(receipt.repositoryId ?? "") || !identifier.test(receipt.parentRunId ?? "") ||
      !identifier.test(receipt.workUnitId ?? "") || !identifier.test(receipt.claimId ?? "") ||
      !providerBinding(receipt.providerBinding) ||
      !digest.test(receipt.authorizationScopeDigest ?? "") || !digest.test(receipt.absenceEvidenceDigest ?? "") ||
      !timestamp(receipt.reconciledAt) || Date.parse(receipt.reconciledAt) > Date.parse(now) ||
      receipt.classification !== "compatible-terminal" || receipt.v2Authority !== false || receipt.nativeClaim !== false ||
      receipt.legacyMutation !== false || !text(receipt.recoveryReference)) return false;
  if (receipt.receiptId !== pendingRetirementReceiptId({ reference: receipt.reference, recordDigest: receipt.recordDigest })) return false;
  return receipt.reference === reference && receipt.recordDigest === recordDigest &&
    receipt.selectedEntry === selectedEntry && receipt.repository === repository;
}

export function publishPendingRetirementReceipt({ receipt, stateHome, readableRepositoryName, repositoryId, fileSystem = fs } = {}) {
  const directory = reconciliationDirectory({ stateHome, readableRepositoryName: readableRepositoryName, repositoryId });
  if (!directory || !validatePendingRetirementReceipt(receipt, { reference: receipt?.reference, recordDigest: receipt?.recordDigest,
    selectedEntry: receipt?.selectedEntry, repository: receipt?.repository })) return fail("pending-retirement-receipt-invalid");
  const destination = path.join(directory, `${receipt.receiptId}.json`);
  if (path.dirname(destination) !== directory) return fail("pending-retirement-receipt-invalid");
  try {
    fileSystem.mkdirSync(directory, { recursive: true, mode: 0o700 });
    if (fileSystem.existsSync(destination)) {
      const existing = JSON.parse(fileSystem.readFileSync(destination, "utf8"));
      return digestValue(existing) === digestValue(receipt) ? { valid: true, classification: "already-retired", receipt: existing, path: destination } : fail("pending-retirement-receipt-conflict");
    }
    const temporary = path.join(directory, `.${receipt.receiptId}.${crypto.randomUUID()}.tmp`);
    if (path.dirname(temporary) !== directory) return fail("pending-retirement-receipt-invalid");
    const handle = fileSystem.openSync(temporary, "wx", 0o600);
    try { fileSystem.writeFileSync(handle, `${JSON.stringify(receipt)}\n`, "utf8"); fileSystem.fsyncSync(handle); } finally { fileSystem.closeSync(handle); }
    fileSystem.renameSync(temporary, destination);
    return { valid: true, classification: "retired", receipt, path: destination };
  } catch { return fail("pending-retirement-receipt-persist-failed"); }
}

export function inventoryPendingRetirementReceipts({ stateHome, readableRepositoryName, repositoryId, fileSystem = fs } = {}) {
  const directory = reconciliationDirectory({ stateHome, readableRepositoryName: readableRepositoryName, repositoryId });
  if (!directory) return { valid: false, reason: "pending-retirement-directory-invalid" };
  try {
    if (!fileSystem.existsSync(directory)) return { valid: true, receipts: [] };
    const receipts = fileSystem.readdirSync(directory, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
      .map((entry) => JSON.parse(fileSystem.readFileSync(path.join(directory, entry.name), "utf8")))
      .filter((receipt) => receipt?.kind === "pending-controller-retirement-receipt");
    return { valid: true, receipts };
  } catch { return { valid: false, reason: "pending-retirement-directory-unreadable" }; }
}
