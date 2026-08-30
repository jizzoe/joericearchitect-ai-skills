import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import { digestValue, deriveRepositoryId, normalizeCanonicalRemote } from "./autonomous-sdd-run-contract.mjs";
import { statePaths, withRepositoryMutationLock } from "./autonomous-sdd-local-store.mjs";
import { legacyRecordDigest, reconciliationDirectory } from "./autonomous-sdd-legacy-reconciliation.mjs";

const text = (value) => typeof value === "string" && value.trim().length > 0;
const object = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const digest = /^[0-9a-f]{64}$/i;
const identifier = /^[a-z0-9][a-z0-9-]{2,127}$/i;
const repositoryIdPattern = /^r1-[0-9a-f]{64}$/i;
const timestamp = (value) => typeof value === "string" && !Number.isNaN(Date.parse(value));
const controllerPhases = Object.freeze(["propose", "planning-review", "apply", "verify", "delivery", "sync", "archive", "cleanup"]);
const fail = (reason, extra = {}) => ({ valid: false, classification: "paused", reason, ...extra });
const exactKeys = (value, keys) => object(value) && Object.keys(value).length === keys.length && Object.keys(value).every((key) => keys.includes(key));
const providerBinding = (value) => exactKeys(value, ["id", "digest"]) && text(value.id) && digest.test(value.digest ?? "");
const authorizationKeys = Object.freeze(["schemaVersion", "approved", "id", "scopeDigest", "repository", "selectedEntry", "expiresAt", "pendingController"]);
const bindingKeys = Object.freeze([
  "reference", "recordDigest", "runId", "authorizationDigest", "controllerExpiresAt", "repositoryId",
  "parentRunId", "workUnitId", "claimId", "providerBinding"
]);
const receiptKeys = Object.freeze([
  "schemaVersion", "kind", "receiptId", "reference", "recordDigest", "runId", "authorizationDigest",
  "controllerExpiresAt", "selectedEntry", "repository", "repositoryId", "parentRunId", "workUnitId", "claimId",
  "providerBinding", "authorizationScopeDigest", "absenceEvidenceDigest", "reconciledAt", "classification",
  "v2Authority", "nativeClaim", "legacyMutation", "recoveryReference"
]);

export function pendingRetirementReceiptId({ reference, recordDigest }) {
  if (!text(reference) || !digest.test(recordDigest ?? "")) return null;
  return `pending-retirement-${crypto.createHash("sha256").update(`${reference}:${recordDigest}`).digest("hex").slice(0, 32)}`;
}

function validateAuthorization(authorization, now) {
  if (!exactKeys(authorization, authorizationKeys) || authorization.schemaVersion !== 1 || authorization.approved !== true ||
      !text(authorization.id) || !digest.test(authorization.scopeDigest ?? "") ||
      !text(authorization.repository) || !identifier.test(authorization.selectedEntry ?? "") ||
      !timestamp(authorization.expiresAt) || Date.parse(authorization.expiresAt) <= Date.parse(now)) return null;
  const binding = authorization.pendingController;
  if (!exactKeys(binding, bindingKeys) || !path.isAbsolute(binding.reference ?? "") || !digest.test(binding.recordDigest ?? "") ||
      !identifier.test(binding.runId ?? "") || !digest.test(binding.authorizationDigest ?? "") ||
      !timestamp(binding.controllerExpiresAt) || !repositoryIdPattern.test(binding.repositoryId ?? "") ||
      !identifier.test(binding.parentRunId ?? "") || !identifier.test(binding.workUnitId ?? "") ||
      !identifier.test(binding.claimId ?? "") || !providerBinding(binding.providerBinding)) return null;
  return binding;
}

/**
 * Accepts only an expired, never-admitted, non-progressed schema-5 controller.
 * This is the narrow baseline the retirement transition may retire.
 */
export function validatePendingControllerBaseline(controller, { now = new Date().toISOString() } = {}) {
  const admission = controller?.v2Admission;
  const controllerKeys = [
    "schemaVersion", "runId", "authorizationDigest", "selectedEntry", "queueEntries", "queueIndex", "repository",
    "expiresAt", "allowedLifecycleChain", "checkpointPath", "resourceRecords", "issueIntakeRecords", "authContextRecords",
    "cleanupReceipts", "completedEntries", "currentPhase", "steps", "v2Admission"
  ];
  if (!exactKeys(controller, controllerKeys) || controller.schemaVersion !== 5 || !identifier.test(controller.runId ?? "") ||
      !digest.test(controller.authorizationDigest ?? "") || controller.runId !== `controller-${controller.authorizationDigest.slice(0, 32)}` ||
      !timestamp(controller.expiresAt) || Date.parse(controller.expiresAt) > Date.parse(now) ||
      controller.checkpointPath !== path.posix.join("runs", controller.runId, "controller.json") ||
      !identifier.test(controller.selectedEntry ?? "") || !text(controller.repository) ||
      !Array.isArray(controller.queueEntries) || controller.queueEntries.length === 0 ||
      controller.queueEntries.some((entry) => !identifier.test(entry)) || new Set(controller.queueEntries).size !== controller.queueEntries.length ||
      controller.queueIndex !== 0 || controller.queueEntries[0] !== controller.selectedEntry ||
      controller.currentPhase !== "propose" ||
      JSON.stringify(controller.allowedLifecycleChain) !== JSON.stringify(controllerPhases) ||
      !Array.isArray(controller.steps) || controller.steps.length !== controllerPhases.length ||
      controller.steps.some((step, index) => step?.id !== controllerPhases[index] || step?.status !== "pending") ||
      !Array.isArray(controller.resourceRecords) || controller.resourceRecords.length !== 0 ||
      !Array.isArray(controller.issueIntakeRecords) || controller.issueIntakeRecords.length !== 0 ||
      !Array.isArray(controller.authContextRecords) || controller.authContextRecords.length !== 0 ||
      !Array.isArray(controller.cleanupReceipts) || controller.cleanupReceipts.length !== 0 ||
      !Array.isArray(controller.completedEntries) || controller.completedEntries.length !== 0 ||
      !exactKeys(admission, ["schemaVersion", "state", "repositoryId", "parentRunId", "workUnitId", "claimId", "providerBinding", "preparedAt"]) ||
      admission.schemaVersion !== 1 || admission.state !== "pending" || !repositoryIdPattern.test(admission.repositoryId ?? "") ||
      admission.parentRunId !== `parent-${controller.authorizationDigest.slice(0, 32)}` ||
      admission.workUnitId !== `workunit-${controller.authorizationDigest.slice(0, 32)}` ||
      admission.claimId !== `claim-${controller.authorizationDigest.slice(0, 32)}` ||
      !providerBinding(admission.providerBinding) || !timestamp(admission.preparedAt) ||
      Date.parse(admission.preparedAt) > Date.parse(controller.expiresAt)) {
    return { valid: false, reason: "pending-controller-baseline-invalid" };
  }
  return { valid: true, admission };
}

function absenceFor(paths, parentRunId, fileSystem) {
  const safeDirectory = (target, reason) => {
    if (!fileSystem.existsSync(target)) return { valid: true, exists: false };
    try {
      const entry = fileSystem.lstatSync(target);
      return entry.isDirectory() && !entry.isSymbolicLink() ? { valid: true, exists: true } : { valid: false, reason };
    } catch { return { valid: false, reason }; }
  };
  const repository = safeDirectory(paths.repository, "pending-retirement-state-unreadable");
  if (!repository.valid) return repository;
  const active = safeDirectory(paths.active, "pending-retirement-active-unreadable");
  if (!active.valid) return active;
  const activePath = path.join(paths.active, parentRunId);
  if (active.exists && fileSystem.existsSync(activePath)) return { valid: false, reason: "pending-retirement-active-parent-present" };
  try {
    const archive = safeDirectory(paths.archive, "pending-retirement-archive-unreadable");
    if (!archive.valid) return archive;
    if (archive.exists) {
      const root = fileSystem.realpathSync(paths.archive);
      for (const year of fileSystem.readdirSync(root, { withFileTypes: true })) {
        if (!/^\d{4}$/.test(year.name)) return { valid: false, reason: "pending-retirement-archive-unreadable" };
        const yearPath = path.join(root, year.name);
        const yearEntry = fileSystem.lstatSync(yearPath);
        if (!yearEntry.isDirectory() || yearEntry.isSymbolicLink()) return { valid: false, reason: "pending-retirement-archive-unreadable" };
        for (const month of fileSystem.readdirSync(yearPath, { withFileTypes: true })) {
          if (!/^\d{2}$/.test(month.name)) return { valid: false, reason: "pending-retirement-archive-unreadable" };
          const monthPath = path.join(yearPath, month.name);
          const monthEntry = fileSystem.lstatSync(monthPath);
          if (!monthEntry.isDirectory() || monthEntry.isSymbolicLink()) return { valid: false, reason: "pending-retirement-archive-unreadable" };
          for (const day of fileSystem.readdirSync(monthPath, { withFileTypes: true })) {
            if (!/^\d{2}$/.test(day.name)) return { valid: false, reason: "pending-retirement-archive-unreadable" };
            const dayPath = path.join(monthPath, day.name);
            const dayEntry = fileSystem.lstatSync(dayPath);
            if (!dayEntry.isDirectory() || dayEntry.isSymbolicLink()) return { valid: false, reason: "pending-retirement-archive-unreadable" };
            if (fileSystem.existsSync(path.join(dayPath, parentRunId))) {
              return { valid: false, reason: "pending-retirement-archive-parent-present" };
            }
          }
        }
      }
    }
  } catch { return { valid: false, reason: "pending-retirement-archive-unreadable" }; }
  try {
    const index = safeDirectory(paths.index, "pending-retirement-projection-unreadable");
    if (!index.valid) return index;
    const runStatusPath = path.join(paths.index, "runs", `${parentRunId}.json`);
    if (index.exists && fileSystem.existsSync(runStatusPath)) return { valid: false, reason: "pending-retirement-projection-parent-present" };
    const statusPath = path.join(paths.index, "repository-status.json");
    if (index.exists && fileSystem.existsSync(statusPath)) {
      const status = JSON.parse(fileSystem.readFileSync(statusPath, "utf8"));
      if (status?.parentRunId === parentRunId) return { valid: false, reason: "pending-retirement-projection-parent-present" };
    }
  } catch { return { valid: false, reason: "pending-retirement-projection-unreadable" }; }
  return { valid: true };
}

function defaultRunGit(repository, args) {
  return execFileSync("git", ["-C", repository, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

function readBoundController({ repositoryPath, binding, fileSystem, runGit }) {
  if (!path.isAbsolute(repositoryPath ?? "")) return fail("pending-retirement-repository-path-invalid");
  try {
    const commonValue = runGit(repositoryPath, ["rev-parse", "--git-common-dir"]);
    const common = path.isAbsolute(commonValue) ? path.resolve(commonValue) : path.resolve(repositoryPath, commonValue);
    const commonEntry = fileSystem.lstatSync(common);
    if (!commonEntry.isDirectory() || commonEntry.isSymbolicLink()) return fail("pending-retirement-controller-state-unreadable");
    const stateRoot = path.join(fileSystem.realpathSync(common), "sdd-delivery-runs");
    const expected = path.join(stateRoot, "runs", binding.runId, "controller.json");
    if (path.resolve(binding.reference) !== path.resolve(expected)) return fail("pending-retirement-authorization-mismatch");
    const entry = fileSystem.lstatSync(expected);
    if (!entry.isFile() || entry.isSymbolicLink() || fileSystem.realpathSync(expected) !== path.resolve(expected)) {
      return fail("pending-retirement-controller-state-unreadable");
    }
    return { valid: true, reference: expected, content: fileSystem.readFileSync(expected, "utf8") };
  } catch { return fail("pending-retirement-controller-state-unreadable"); }
}

export function retireExpiredPendingController({
  authorization, repositoryPath, stateHome, readableRepositoryName, repositoryId, canonicalRemote,
  now = new Date().toISOString(), fileSystem = fs, runGit = defaultRunGit
} = {}) {
  const binding = validateAuthorization(authorization, now);
  if (!binding || typeof runGit !== "function") return fail("pending-retirement-input-invalid");
  const loaded = readBoundController({ repositoryPath, binding, fileSystem, runGit });
  if (!loaded.valid) return loaded;
  const { content: controllerContent, reference } = loaded;
  const recordDigest = legacyRecordDigest(controllerContent);
  let controller;
  try { controller = JSON.parse(controllerContent); } catch { return fail("pending-retirement-input-invalid"); }
  const baseline = validatePendingControllerBaseline(controller, { now });
  if (!baseline.valid) return fail("pending-retirement-input-invalid");
  if (!digest.test(recordDigest) || binding.reference !== reference || binding.recordDigest !== recordDigest ||
      binding.runId !== controller.runId || binding.parentRunId !== baseline.admission.parentRunId ||
      binding.workUnitId !== baseline.admission.workUnitId || binding.claimId !== baseline.admission.claimId ||
      binding.authorizationDigest !== controller.authorizationDigest || binding.controllerExpiresAt !== controller.expiresAt ||
      binding.repositoryId !== baseline.admission.repositoryId ||
      digestValue(binding.providerBinding) !== digestValue(baseline.admission.providerBinding) ||
      authorization.selectedEntry !== controller.selectedEntry || authorization.repository !== controller.repository) {
    return fail("pending-retirement-authorization-mismatch");
  }
  const canonicalIdentity = normalizeCanonicalRemote(canonicalRemote);
  const derivedRepositoryId = deriveRepositoryId(canonicalRemote);
  const identityParts = canonicalIdentity?.split("/") ?? [];
  const canonicalRepository = identityParts.length >= 2 ? identityParts.slice(-2).join("/") : null;
  const canonicalRepositoryName = identityParts.at(-1);
  const readableRepository = readableRepositoryName?.toLowerCase();
  const controllerRepository = controller.repository.toLowerCase();
  if (!canonicalIdentity || !canonicalRepository || readableRepository !== canonicalRepositoryName ||
      ![canonicalRepository, canonicalRepositoryName].includes(controllerRepository) ||
      !derivedRepositoryId || derivedRepositoryId !== repositoryId || binding.repositoryId !== repositoryId ||
      baseline.admission.repositoryId !== repositoryId) {
    return fail("pending-retirement-repository-mismatch");
  }
  const paths = statePaths({ stateHome, readableName: readableRepositoryName, repositoryId });
  if (!paths) return fail("pending-retirement-state-layout-invalid");
  const absence = absenceFor(paths, baseline.admission.parentRunId, fileSystem);
  if (!absence.valid) return fail(absence.reason);
  const receiptId = pendingRetirementReceiptId({ reference, recordDigest });
  const directory = reconciliationDirectory({ stateHome, readableRepositoryName, repositoryId });
  const destination = directory ? path.join(directory, `${receiptId}.json`) : null;
  if (destination && fileSystem.existsSync(destination)) {
    try {
      const existing = JSON.parse(fileSystem.readFileSync(destination, "utf8"));
      const valid = validatePendingRetirementReceipt(existing, {
        reference, recordDigest, controllerContent, authorizationScopeDigest: authorization.scopeDigest, now
      });
      return valid ? { valid: true, classification: "already-retired", receipt: existing } : fail("pending-retirement-receipt-conflict");
    } catch { return fail("pending-retirement-receipt-conflict"); }
  }
  const receipt = Object.freeze({
    schemaVersion: 1,
    kind: "pending-controller-retirement-receipt",
    receiptId,
    reference,
    recordDigest,
    runId: controller.runId,
    authorizationDigest: controller.authorizationDigest,
    controllerExpiresAt: controller.expiresAt,
    selectedEntry: controller.selectedEntry,
    repository: controller.repository,
    repositoryId,
    parentRunId: baseline.admission.parentRunId,
    workUnitId: baseline.admission.workUnitId,
    claimId: baseline.admission.claimId,
    providerBinding: baseline.admission.providerBinding,
    authorizationScopeDigest: authorization.scopeDigest,
    absenceEvidenceDigest: digestValue({ repositoryId, parentRunId: baseline.admission.parentRunId, active: "absent", archive: "absent", projection: "absent" }),
    reconciledAt: now,
    classification: "compatible-terminal",
    v2Authority: false,
    nativeClaim: false,
    legacyMutation: false,
    recoveryReference: "re-run exact pending-controller retirement with the same record and fresh absence evidence"
  });
  return { valid: true, classification: "compatible-terminal", receipt };
}

export function executeExpiredPendingControllerRetirement(input = {}) {
  const { stateHome, readableRepositoryName, repositoryId, fileSystem = fs } = input;
  return withRepositoryMutationLock({ stateHome, repositoryId, fileSystem }, () => {
    const retired = retireExpiredPendingController(input);
    return retired.valid
      ? publishPendingRetirementReceipt({ receipt: retired.receipt, stateHome, readableRepositoryName, repositoryId, fileSystem })
      : retired;
  });
}

export function validatePendingRetirementReceipt(receipt, {
  reference, recordDigest, controllerContent, authorizationScopeDigest, now = new Date().toISOString()
} = {}) {
  let controller;
  try { controller = typeof controllerContent === "string" ? JSON.parse(controllerContent) : controllerContent; } catch { return false; }
  const baseline = validatePendingControllerBaseline(controller, { now });
  if (!baseline.valid || !validReceiptShape(receipt, now) ||
      receipt.receiptId !== pendingRetirementReceiptId({ reference: receipt.reference, recordDigest: receipt.recordDigest })) return false;
  return receipt.reference === reference && receipt.recordDigest === recordDigest &&
    receipt.runId === controller.runId && receipt.authorizationDigest === controller.authorizationDigest &&
    receipt.controllerExpiresAt === controller.expiresAt && receipt.selectedEntry === controller.selectedEntry &&
    receipt.repository === controller.repository && receipt.repositoryId === baseline.admission.repositoryId &&
    receipt.parentRunId === baseline.admission.parentRunId && receipt.workUnitId === baseline.admission.workUnitId &&
    receipt.claimId === baseline.admission.claimId && digestValue(receipt.providerBinding) === digestValue(baseline.admission.providerBinding) &&
    (authorizationScopeDigest === undefined || receipt.authorizationScopeDigest === authorizationScopeDigest);
}

function validReceiptShape(receipt, now = new Date().toISOString()) {
  if (!exactKeys(receipt, receiptKeys) || receipt.schemaVersion !== 1 || receipt.kind !== "pending-controller-retirement-receipt" ||
      !text(receipt.receiptId) || !text(receipt.reference) || !digest.test(receipt.recordDigest ?? "") ||
      !identifier.test(receipt.runId ?? "") || !identifier.test(receipt.selectedEntry ?? "") || !text(receipt.repository) ||
      !repositoryIdPattern.test(receipt.repositoryId ?? "") || !identifier.test(receipt.parentRunId ?? "") ||
      !identifier.test(receipt.workUnitId ?? "") || !identifier.test(receipt.claimId ?? "") ||
      !providerBinding(receipt.providerBinding) ||
      !digest.test(receipt.authorizationDigest ?? "") || !timestamp(receipt.controllerExpiresAt) ||
      !digest.test(receipt.authorizationScopeDigest ?? "") || !digest.test(receipt.absenceEvidenceDigest ?? "") ||
      !timestamp(receipt.reconciledAt) || Date.parse(receipt.reconciledAt) > Date.parse(now) ||
      receipt.classification !== "compatible-terminal" || receipt.v2Authority !== false || receipt.nativeClaim !== false ||
      receipt.legacyMutation !== false || !text(receipt.recoveryReference)) return false;
  return receipt.receiptId === pendingRetirementReceiptId({ reference: receipt.reference, recordDigest: receipt.recordDigest }) &&
    receipt.runId === `controller-${receipt.authorizationDigest.slice(0, 32)}` &&
    receipt.parentRunId === `parent-${receipt.authorizationDigest.slice(0, 32)}` &&
    receipt.workUnitId === `workunit-${receipt.authorizationDigest.slice(0, 32)}` &&
    receipt.claimId === `claim-${receipt.authorizationDigest.slice(0, 32)}` &&
    Date.parse(receipt.controllerExpiresAt) <= Date.parse(receipt.reconciledAt) &&
    receipt.absenceEvidenceDigest === digestValue({
      repositoryId: receipt.repositoryId, parentRunId: receipt.parentRunId,
      active: "absent", archive: "absent", projection: "absent"
    });
}

export function publishPendingRetirementReceipt({ receipt, stateHome, readableRepositoryName, repositoryId, fileSystem = fs } = {}) {
  const directory = reconciliationDirectory({ stateHome, readableRepositoryName: readableRepositoryName, repositoryId });
  if (!directory || !validReceiptShape(receipt)) return fail("pending-retirement-receipt-invalid");
  const destination = path.join(directory, `${receipt.receiptId}.json`);
  if (path.dirname(destination) !== directory) return fail("pending-retirement-receipt-invalid");
  let temporary;
  try {
    fileSystem.mkdirSync(directory, { recursive: true, mode: 0o700 });
    if (fileSystem.existsSync(destination)) {
      const existing = JSON.parse(fileSystem.readFileSync(destination, "utf8"));
      return digestValue(existing) === digestValue(receipt) ? { valid: true, classification: "already-retired", receipt: existing, path: destination } : fail("pending-retirement-receipt-conflict");
    }
    temporary = path.join(directory, `.${receipt.receiptId}.${crypto.randomUUID()}.tmp`);
    if (path.dirname(temporary) !== directory) return fail("pending-retirement-receipt-invalid");
    const handle = fileSystem.openSync(temporary, "wx", 0o600);
    try { fileSystem.writeFileSync(handle, `${JSON.stringify(receipt)}\n`, "utf8"); fileSystem.fsyncSync(handle); } finally { fileSystem.closeSync(handle); }
    fileSystem.linkSync(temporary, destination);
    fileSystem.unlinkSync(temporary);
    if (process.platform !== "win32") {
      const directoryHandle = fileSystem.openSync(directory, "r");
      try { fileSystem.fsyncSync(directoryHandle); } finally { fileSystem.closeSync(directoryHandle); }
    }
    return { valid: true, classification: "retired", receipt, path: destination };
  } catch (error) {
    if (temporary) try { fileSystem.unlinkSync(temporary); } catch { /* exact temporary cleanup only */ }
    if (error?.code === "EEXIST") {
      try {
        const existing = JSON.parse(fileSystem.readFileSync(destination, "utf8"));
        return digestValue(existing) === digestValue(receipt)
          ? { valid: true, classification: "already-retired", receipt: existing, path: destination }
          : fail("pending-retirement-receipt-conflict");
      } catch { return fail("pending-retirement-receipt-conflict"); }
    }
    return fail("pending-retirement-receipt-persist-failed");
  }
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
