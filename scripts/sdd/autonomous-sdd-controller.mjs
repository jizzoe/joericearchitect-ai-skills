#!/usr/bin/env node
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { archiveTerminalRun, defaultStateHome, publishImmutableRecord, statePaths, validateProviderCapabilities } from "./autonomous-sdd-local-store.mjs";
import { buildParentProjection, deriveRepositoryId, digestValue, normalizeCanonicalRemote, validateBootstrapPreSnapshotWorkUnit, validateDomainRecord } from "./autonomous-sdd-run-contract.mjs";
import { admitV2RunFromInitializer, inspectV2Admission } from "./autonomous-sdd-admission.mjs";
import {
  buildControllerRetirementMarker,
  buildControllerTerminalMarker,
  controllerRetirementMarkerName,
  controllerTerminalMarkerName,
  publishControllerMarker,
  readControllerRetirementEvidence,
  validControllerRetirementMarker,
  validControllerTerminalMarker
} from "./autonomous-sdd-controller-retirement.mjs";
import { executeWorkspaceCleanup, migrateLegacyWorkspaceResource, planWorkspaceCleanup } from "./sdd-workspace-cleanup.mjs";
import {
  authContextBindingDigest,
  validateGithubAuthContextBinding,
  validateGithubAuthContextEvidence
} from "./github-cli-auth-context.mjs";
import { bindIssueIntakeEvidence, validateIssueIntakeBinding } from "./issue-intake-binding.mjs";
import { evaluateOperationGate } from "./autonomous-sdd-operation-contract.mjs";

const phases = Object.freeze([
  "propose", "planning-review", "apply", "verify", "delivery", "sync", "archive", "cleanup"
]);

const text = (value) => typeof value === "string" && value.trim().length > 0;
const fullCommit = (value) => typeof value === "string" && /^[0-9a-f]{40}$/i.test(value);
const timestamp = (value) => typeof value === "string" && !Number.isNaN(Date.parse(value));
const canonical = (value) => {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
  }
  return value;
};
const selectedByAuthorization = (selectedEntry, authorization) =>
  text(selectedEntry) && Array.isArray(authorization?.target?.entries) && authorization.target.entries.includes(selectedEntry);
const validRunId = (value) => typeof value === "string" && /^[a-z0-9][a-z0-9-]{7,127}$/i.test(value);
const validTransitionName = (value) => typeof value === "string" && /^[a-z0-9][a-z0-9-]{2,127}$/i.test(value);
const safeEvidencePath = (value) => typeof value === "string" && value.length > 0 && !path.isAbsolute(value) && !/[\\\0\r\n]/.test(value) && value.split("/").every((segment) => segment !== "" && segment !== "." && segment !== ".." && segment !== ".git");
const checkpointForRun = (runId) => `runs/${runId}/controller.json`;
const digest = (value) => typeof value === "string" && /^[0-9a-f]{64}$/i.test(value);
const repositoryId = (value) => typeof value === "string" && /^r1-[0-9a-f]{64}$/i.test(value);
const controllerSchema = (value) => value === 4 || value === 5;
const controllerReadyForMutation = (record) => controllerSchema(record?.schemaVersion) &&
  (record.schemaVersion === 4 || record.v2Admission?.state === "admitted");

function exactKeys(value, keys) {
  return value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).every((key) => keys.includes(key));
}

function validV2AdmissionBinding(value) {
  if (!exactKeys(value, ["schemaVersion", "state", "repositoryId", "parentRunId", "workUnitId", "claimId", "providerBinding", "preparedAt", "admittedAt"]) ||
      value.schemaVersion !== 1 || !["pending", "admitted"].includes(value.state) || !repositoryId(value.repositoryId) ||
      !validRunId(value.parentRunId) || !validRunId(value.workUnitId) || !validRunId(value.claimId) ||
      !text(value.providerBinding?.id) || !digest(value.providerBinding?.digest) || !timestamp(value.preparedAt)) return false;
  return value.state === "pending" ? value.admittedAt === undefined : timestamp(value.admittedAt);
}

function sameV2AdmissionBinding(left, right) {
  return validV2AdmissionBinding(left) && validV2AdmissionBinding(right) &&
    left.repositoryId === right.repositoryId && left.parentRunId === right.parentRunId &&
    left.workUnitId === right.workUnitId && left.claimId === right.claimId &&
    left.providerBinding.id === right.providerBinding.id && left.providerBinding.digest === right.providerBinding.digest;
}

function fullHead(value) {
  return typeof value === "string" && /^[0-9a-f]{40}$/i.test(value);
}

function safeJson(fileSystem, target) {
  try { return JSON.parse(fileSystem.readFileSync(target, "utf8")); } catch { return null; }
}

const bootstrapAttachmentName = "bootstrap-cleanup-attachment.json";
function validBootstrapAttachmentResource(value) {
  return exactKeys(value, ["kind", "id", "role", "headCommit", "disposition"]) &&
    ["worktree", "branch"].includes(value.kind) && text(value.id) && text(value.role) && fullHead(value.headCommit) &&
    ["migrate", "retain"].includes(value.disposition);
}
function validBootstrapAttachmentBinding(value, now) {
  return exactKeys(value, ["schemaVersion", "parentRunId", "workUnitId", "claimId", "repositoryId", "repository", "approvedChangeId", "archiveHead", "expiresAt", "classification", "resources"]) &&
    value.schemaVersion === 1 && validRunId(value.parentRunId) && validRunId(value.workUnitId) && validRunId(value.claimId) && repositoryId(value.repositoryId) &&
    text(value.repository) && validRunId(value.approvedChangeId) && fullHead(value.archiveHead) && timestamp(value.expiresAt) && Date.parse(value.expiresAt) > Date.parse(now) &&
    value.classification === "pre-configuration-snapshot-bootstrap-cleanup" && Array.isArray(value.resources) && value.resources.length > 0 &&
    value.resources.every(validBootstrapAttachmentResource) && new Set(value.resources.map((resource) => `${resource.kind}:${resource.id}`)).size === value.resources.length;
}
function validBootstrapAttachment(record, now) {
  return exactKeys(record, ["schemaVersion", "kind", "binding", "resources", "receipts", "retainedResources", "createdAt", "updatedAt"]) &&
    record.schemaVersion === 1 && record.kind === "bootstrap-cleanup-attachment" && validBootstrapAttachmentBinding(record.binding, now) &&
    Array.isArray(record.resources) && Array.isArray(record.receipts) && Array.isArray(record.retainedResources) &&
    timestamp(record.createdAt) && timestamp(record.updatedAt) &&
    record.resources.every((resource) => validResource(resource, { selectedEntry: record.binding.approvedChangeId, repository: record.binding.repository }) &&
      record.binding.resources.some((binding) => binding.disposition === "migrate" && binding.kind === resource.kind && binding.id === resource.id && binding.headCommit === resource.headCommit)) &&
    new Set(record.resources.map((resource) => `${resource.kind}:${resource.id}`)).size === record.resources.length &&
    record.receipts.every((receipt) => ["started", "completed", "already-completed", "blocked"].includes(receipt?.status) &&
      record.resources.some((resource) => resource.kind === receipt.kind && resource.id === receipt.id)) &&
    record.retainedResources.every((resource) => exactKeys(resource, ["kind", "id", "headCommit", "reason", "recordedAt"]) &&
      ["worktree", "branch"].includes(resource.kind) && text(resource.id) && fullHead(resource.headCommit) && text(resource.reason) && timestamp(resource.recordedAt) &&
      record.binding.resources.some((binding) => binding.disposition === "retain" && binding.kind === resource.kind && binding.id === resource.id && binding.headCommit === resource.headCommit)) &&
    new Set(record.retainedResources.map((resource) => `${resource.kind}:${resource.id}`)).size === record.retainedResources.length;
}
function attachmentPath(paths, binding) { return path.join(paths.active, binding.parentRunId, bootstrapAttachmentName); }
function writeAttachment(file, record, fileSystem = fs) {
  try {
    const temporary = `${file}.${crypto.randomUUID()}.tmp`;
    fileSystem.writeFileSync(temporary, `${JSON.stringify(record)}\n`, { mode: 0o600 });
    fileSystem.renameSync(temporary, file);
    return { valid: true, path: file };
  } catch { return { valid: false, reason: "bootstrap-cleanup-attachment-persist-failed" }; }
}
function bootstrapAttachmentTerminal(record) {
  const migrated = record.binding.resources.filter((resource) => resource.disposition === "migrate");
  const retained = record.binding.resources.filter((resource) => resource.disposition === "retain");
  return migrated.every((binding) => {
    const resource = record.resources.find((item) => item.kind === binding.kind && item.id === binding.id && item.headCommit === binding.headCommit);
    if (!resource) return false;
    const receipts = record.receipts.filter((receipt) => receipt.kind === resource.kind && receipt.id === resource.id);
    return ["completed", "already-completed"].includes(receipts.at(-1)?.status);
  }) && retained.every((binding) => record.retainedResources.some((resource) =>
    resource.kind === binding.kind && resource.id === binding.id && resource.headCommit === binding.headCommit));
}

function terminalizationEvidence(value) {
  const delivery = (item) => exactKeys(item, ["merged", "reference", "deliveredHeadCommit"]) && item.merged === true && text(item.reference) && fullHead(item.deliveredHeadCommit);
  return exactKeys(value, ["current", "implementation", "sync", "archive", "issueClosed", "projectDone", "cleanupCompleted", "observedAt"]) &&
    value.current === true && delivery(value.implementation) && delivery(value.sync) && delivery(value.archive) &&
    value.issueClosed === true && value.projectDone === true && value.cleanupCompleted === true && timestamp(value.observedAt);
}

function terminalDetails(value) {
  return exactKeys(value, ["terminalStatus", "terminalReason", "terminalAt", "finalHead", "attemptCount", "correctionCount", "cleanupDisposition", "childHistoryReference", "childHistoryDigest"]) &&
    value.terminalStatus === "complete" && text(value.terminalReason) && timestamp(value.terminalAt) && fullHead(value.finalHead) &&
    Number.isInteger(value.attemptCount) && value.attemptCount >= 0 && Number.isInteger(value.correctionCount) && value.correctionCount >= 0 &&
    value.cleanupDisposition === "completed" && text(value.childHistoryReference) && digest(value.childHistoryDigest);
}

function validBootstrapCompatibility(value, terminalization, now) {
  return exactKeys(value, ["schemaVersion", "parentRunId", "workUnitId", "claimId", "repositoryId", "approvedChangeId", "archiveHead", "expiresAt", "classification"]) &&
    value.schemaVersion === 1 && value.parentRunId === terminalization.parentRunId && value.workUnitId === terminalization.workUnitId &&
    value.claimId === terminalization.claimId && value.repositoryId === terminalization.repositoryId && value.approvedChangeId === terminalization.approvedChangeId &&
    value.archiveHead === terminalization.completionEvidence.archive.deliveredHeadCommit && fullHead(value.archiveHead) && timestamp(value.expiresAt) &&
    Date.parse(value.expiresAt) > Date.parse(now) && value.classification === "pre-configuration-snapshot-bootstrap";
}

function validTerminalizationRequest(value) {
  return exactKeys(value, ["schemaVersion", "parentRunId", "workUnitId", "claimId", "repositoryId", "approvedChangeId", "provider", "completionEvidence", "terminal", "bootstrapCompatibility"]) &&
    value.schemaVersion === 1 && validRunId(value.parentRunId) && validRunId(value.workUnitId) && validRunId(value.claimId) &&
      repositoryId(value.repositoryId) && validRunId(value.approvedChangeId) && terminalizationEvidence(value.completionEvidence) && terminalDetails(value.terminal) &&
      (value.bootstrapCompatibility === undefined || typeof value.bootstrapCompatibility === "object") &&
    validateProviderCapabilities(value.provider).valid;
}

function terminalSummaryFor({ claim, workUnit, terminal }) {
  const summary = {
    workUnitId: workUnit.workUnitId,
    ordinal: workUnit.ordinal,
    approvedChangeId: workUnit.approvedChangeId,
    terminalStatus: terminal.terminalStatus,
    terminalReason: terminal.terminalReason,
    startedAt: claim.acquiredAt,
    terminalAt: terminal.terminalAt,
    finalHead: terminal.finalHead,
    attemptCount: terminal.attemptCount,
    correctionCount: terminal.correctionCount,
    claimDisposition: "released",
    cleanupDisposition: terminal.cleanupDisposition,
    childHistoryReference: terminal.childHistoryReference,
    childHistoryDigest: terminal.childHistoryDigest
  };
  return { ...summary, terminalSummaryDigest: digestValue(summary) };
}

function terminalizationArchiveMatch({ paths, terminalization, requestDigest, fileSystem = fs }) {
  try {
    if (!fileSystem.existsSync(paths.archive)) return null;
    const years = fileSystem.readdirSync(paths.archive, { withFileTypes: true });
    for (const year of years) {
      if (!year.isDirectory() || year.name.startsWith(".")) continue;
      const yearPath = path.join(paths.archive, year.name);
      for (const month of fileSystem.readdirSync(yearPath, { withFileTypes: true })) {
        if (!month.isDirectory() || month.name.startsWith(".")) continue;
        const monthPath = path.join(yearPath, month.name);
        for (const day of fileSystem.readdirSync(monthPath, { withFileTypes: true })) {
          if (!day.isDirectory() || day.name.startsWith(".")) continue;
          const runPath = path.join(monthPath, day.name, terminalization.parentRunId);
          if (!fileSystem.existsSync(runPath) || fileSystem.lstatSync(runPath).isSymbolicLink()) continue;
          const receipt = safeJson(fileSystem, path.join(runPath, "terminalization-receipt.json"));
          if (!validateDomainRecord(receipt).valid || receipt.kind !== "terminalization-receipt") continue;
          if (receipt.parentRunId !== terminalization.parentRunId || receipt.workUnitId !== terminalization.workUnitId ||
              receipt.claimId !== terminalization.claimId || receipt.repositoryId !== terminalization.repositoryId ||
              receipt.approvedChangeId !== terminalization.approvedChangeId) {
            return { valid: false, reason: "terminalization-archive-identity-conflict", archivePath: runPath };
          }
          if (receipt.requestDigest !== requestDigest) return { valid: false, reason: "terminalization-archive-request-conflict", archivePath: runPath };
          return { valid: true, archivePath: runPath, receipt };
        }
      }
    }
    return null;
  } catch { return { valid: false, reason: "terminalization-archive-inspection-unavailable" }; }
}

function publishExpectedRecord({ directory, name, record, provider, fileSystem = fs }) {
  const expected = validateDomainRecord(record);
  if (!expected.valid) return { valid: false, reason: "terminalization-record-invalid" };
  const published = publishImmutableRecord({ directory, name, record, provider, fileSystem });
  if (published.valid) return published;
  if (published.reason !== "immutable-record-already-exists") return published;
  const existing = safeJson(fileSystem, path.join(directory, `${name}.json`));
  const actual = validateDomainRecord(existing);
  return actual.valid && actual.digest === expected.digest
    ? { valid: true, classification: "already-published", path: path.join(directory, `${name}.json`), digest: actual.digest }
    : { valid: false, reason: "terminalization-record-conflict" };
}

function safeContainedDestination(repositoryPath, checkpointPath) {
  const root = fs.realpathSync(repositoryPath);
  const destination = path.resolve(root, checkpointPath);
  if (destination === root || !destination.startsWith(`${root}${path.sep}`)) return null;
  const inspectComponents = () => {
    const relative = path.relative(root, destination);
    const components = relative.split(path.sep);
    let current = root;
    for (const component of components.slice(0, -1)) {
      current = path.join(current, component);
      if (!fs.existsSync(current)) break;
      if (fs.lstatSync(current).isSymbolicLink()) return false;
    }
    if (fs.existsSync(destination) && fs.lstatSync(destination).isSymbolicLink()) return false;
    return true;
  };
  return { root, destination, inspectComponents };
}

function defaultRunGit(repositoryPath) {
  return execFileSync("git", ["-C", repositoryPath, "rev-parse", "--git-common-dir"], { encoding: "utf8" }).trim();
}

function validResource(resource, { selectedEntry, repository } = {}, { allowPending = true } = {}) {
  if (!resource || resource.entry !== selectedEntry || resource.repository !== repository ||
      !["worktree", "branch"].includes(resource.kind) || !text(resource.id) || !text(resource.role) ||
      !fullCommit(resource.registeredHeadCommit) || !text(resource.ownershipToken) || !text(resource.recoveryReference) ||
      resource.owned !== true || !timestamp(resource.registeredAt)) return false;
  if (resource.deliveryEvidence === undefined) return allowPending && resource.headCommit === undefined;
  const evidence = resource.deliveryEvidence;
  return fullCommit(resource.headCommit) && evidence?.current === true && text(evidence.reference) && evidence.headCommit === resource.headCommit &&
    fullCommit(evidence.deliveredHeadCommit) && evidence.mergedPullRequest?.merged === true &&
    text(evidence.mergedPullRequest.pullRequest) && evidence.mergedPullRequest.topicHeadCommit === resource.headCommit &&
    evidence.mergedPullRequest.finalHeadCommit === evidence.deliveredHeadCommit;
}

function validIssueIntakeRecord(record, selectedEntry) {
  if (!record || record.selectedEntry !== selectedEntry || !validateIssueIntakeBinding(record.binding) ||
      record.binding.selectedEntry !== selectedEntry || record.bindingDigest !== authorizationDigest(record.binding) || !timestamp(record.registeredAt) ||
      !["pending", "delivered"].includes(record.status)) return false;
  if (record.status === "pending") return record.evidence === undefined;
  const evidence = record.evidence;
  return evidence?.current === true && evidence.payloadDigest === record.binding.payloadDigest &&
    Number.isInteger(evidence.number) && evidence.number > 0 && text(evidence.url) &&
    ["OPEN", "CLOSED"].includes(evidence.state) && Array.isArray(evidence.labels) &&
    timestamp(evidence.observedAt) && text(evidence.reference);
}

function validAuthContextRecord(record, selectedEntry) {
  if (!record || record.selectedEntry !== selectedEntry || !validateGithubAuthContextBinding(record.binding) ||
      record.binding.selectedEntry !== selectedEntry || record.bindingDigest !== authContextBindingDigest(record.binding) ||
      !timestamp(record.registeredAt) || !["pending", "delivered"].includes(record.status)) return false;
  if (record.status === "pending") return record.evidence === undefined;
  return validateGithubAuthContextEvidence(record.evidence) && record.evidence.bindingDigest === record.bindingDigest;
}

function validCompletedEntry(entry, repository) {
  const receiptValid = (receipt) => receipt && ["started", "completed", "already-completed", "blocked"].includes(receipt.status) &&
      ["worktree", "branch"].includes(receipt.kind) && text(receipt.id) && timestamp(receipt.at) && text(receipt.recoveryReference) &&
      entry.resourceRecords.some((resource) => resource.kind === receipt.kind && resource.id === receipt.id && resource.recoveryReference === receipt.recoveryReference);
  return entry && text(entry.selectedEntry) && Array.isArray(entry.resourceRecords) && entry.resourceRecords.length > 0 && Array.isArray(entry.cleanupReceipts) &&
    entry.resourceRecords.every((resource) => validResource(resource, { selectedEntry: entry.selectedEntry, repository }, { allowPending: false })) &&
    entry.cleanupReceipts.every(receiptValid) && entry.resourceRecords.every((resource) => {
      const receipts = entry.cleanupReceipts.filter((receipt) => receipt.kind === resource.kind && receipt.id === resource.id);
      return receipts.length > 0 && ["completed", "already-completed"].includes(receipts.at(-1).status);
    });
}

export function resolveControllerStateRoot({ repositoryPath, runGit = defaultRunGit } = {}) {
  if (!text(repositoryPath) || typeof runGit !== "function") return { valid: false, reason: "controller-state-root-input-invalid" };
  try {
    const repository = fs.realpathSync(repositoryPath);
    const reported = runGit(repository);
    if (!text(reported)) return { valid: false, reason: "controller-state-root-unavailable" };
    const commonDirectory = fs.realpathSync(path.resolve(repository, reported));
    if (!fs.statSync(commonDirectory).isDirectory()) return { valid: false, reason: "controller-state-root-unavailable" };
    const stateRoot = path.join(commonDirectory, "sdd-delivery-runs");
    if (fs.existsSync(stateRoot) && fs.lstatSync(stateRoot).isSymbolicLink()) return { valid: false, reason: "controller-state-root-symlink" };
    return { valid: true, repository, commonDirectory, stateRoot };
  } catch {
    return { valid: false, reason: "controller-state-root-unavailable" };
  }
}

/**
 * Closes one exact fully delivered v2 run without accepting caller-chosen
 * storage paths or silently altering a mismatched active claim.
 */
export function terminalizeV2Run({ readableRepositoryName, terminalization, stateHome = defaultStateHome(), now = new Date().toISOString(), fileSystem = fs } = {}) {
  if (!validTerminalizationRequest(terminalization) || !timestamp(now) || !text(readableRepositoryName)) {
    return { valid: false, classification: "paused", reason: "terminalization-input-invalid" };
  }
  const providerCapability = validateProviderCapabilities(terminalization.provider);
  const paths = statePaths({ stateHome, readableName: readableRepositoryName, repositoryId: terminalization.repositoryId });
  if (!providerCapability.valid || !paths) return { valid: false, classification: "paused", reason: "terminalization-state-unavailable" };

  const requestDigest = digestValue(terminalization);
  const archived = terminalizationArchiveMatch({ paths, terminalization, requestDigest, fileSystem });
  if (archived?.valid) {
    return { valid: true, classification: "already-terminalized", requestDigest, archivePath: archived.archivePath, receipt: archived.receipt };
  }
  if (archived && !archived.valid) return { ...archived, classification: "paused", requestDigest };

  const activePath = path.join(paths.active, terminalization.parentRunId);
  try {
    if (!fileSystem.existsSync(activePath) || fileSystem.lstatSync(activePath).isSymbolicLink()) {
      return { valid: false, classification: "paused", reason: "terminalization-active-run-unavailable", requestDigest };
    }
  } catch { return { valid: false, classification: "paused", reason: "terminalization-active-run-unavailable", requestDigest }; }

  const parentRun = safeJson(fileSystem, path.join(activePath, "parent-run.json"));
  const workUnit = safeJson(fileSystem, path.join(activePath, "work-unit.json"));
  const claim = safeJson(fileSystem, path.join(activePath, "resource-claim.json"));
  const normalWorkUnit = validateDomainRecord(workUnit).valid;
  const bootstrapWorkUnit = validateBootstrapPreSnapshotWorkUnit(workUnit) && validBootstrapCompatibility(terminalization.bootstrapCompatibility, terminalization, now);
  if (!validateDomainRecord(parentRun).valid || !validateDomainRecord(claim).valid || (!normalWorkUnit && !bootstrapWorkUnit)) {
    return { valid: false, classification: "paused", reason: "terminalization-active-record-invalid", requestDigest };
  }
  if (parentRun.parentRunId !== terminalization.parentRunId || workUnit.parentRunId !== parentRun.parentRunId ||
      workUnit.workUnitId !== terminalization.workUnitId || workUnit.approvedChangeId !== terminalization.approvedChangeId ||
      claim.claimId !== terminalization.claimId || claim.workUnitId !== workUnit.workUnitId || claim.repositoryId !== terminalization.repositoryId ||
      claim.state !== "active" || claim.providerBinding.id !== providerCapability.provider.id ||
      claim.providerBinding.digest !== digestValue(providerCapability.provider) ||
      parentRun.claimProviderBinding.id !== claim.providerBinding.id || parentRun.claimProviderBinding.digest !== claim.providerBinding.digest ||
      workUnit.claimProviderBinding.id !== claim.providerBinding.id || workUnit.claimProviderBinding.digest !== claim.providerBinding.digest) {
    return { valid: false, classification: "paused", reason: "terminalization-identity-or-claim-mismatch", requestDigest };
  }
  if (bootstrapWorkUnit) {
    const attachment = safeJson(fileSystem, attachmentPath(paths, terminalization.bootstrapCompatibility));
    if (!attachment || !validBootstrapAttachment(attachment, now) || attachment.binding.parentRunId !== terminalization.parentRunId ||
        attachment.binding.workUnitId !== terminalization.workUnitId || attachment.binding.claimId !== terminalization.claimId ||
        attachment.binding.repositoryId !== terminalization.repositoryId || attachment.binding.approvedChangeId !== terminalization.approvedChangeId ||
        attachment.binding.archiveHead !== terminalization.completionEvidence.archive.deliveredHeadCommit || !bootstrapAttachmentTerminal(attachment)) {
      return { valid: false, classification: "paused", reason: "terminalization-bootstrap-cleanup-attachment-incomplete", requestDigest };
    }
  }

  const terminalSummary = terminalSummaryFor({ claim, workUnit, terminal: terminalization.terminal });
  const projection = buildParentProjection(parentRun, workUnit, terminalSummary, { allowBootstrapPreSnapshot: bootstrapWorkUnit });
  const observedAt = Date.parse(terminalization.completionEvidence.observedAt);
  const nowAt = Date.parse(now);
  if (!projection.valid || observedAt > nowAt || nowAt - observedAt > 60 * 60 * 1000 ||
      Date.parse(terminalSummary.terminalAt) > nowAt || Date.parse(terminalSummary.terminalAt) < Date.parse(claim.acquiredAt) ||
      terminalization.completionEvidence.archive.deliveredHeadCommit !== terminalSummary.finalHead) {
    return { valid: false, classification: "paused", reason: "terminalization-terminal-evidence-invalid", requestDigest };
  }

  const receipt = {
    kind: "terminalization-receipt",
    schemaVersion: 2,
    parentRunId: parentRun.parentRunId,
    workUnitId: workUnit.workUnitId,
    claimId: claim.claimId,
    repositoryId: claim.repositoryId,
    approvedChangeId: workUnit.approvedChangeId,
    requestDigest,
    completionEvidenceDigest: digestValue(terminalization.completionEvidence),
    terminalSummary,
    createdAt: now
  };
  const receiptValidation = validateDomainRecord(receipt);
  if (!receiptValidation.valid) return { valid: false, classification: "paused", reason: "terminalization-receipt-invalid", requestDigest };
  const claimRelease = {
    kind: "claim-release",
    schemaVersion: 2,
    claimId: claim.claimId,
    repositoryId: claim.repositoryId,
    workUnitId: workUnit.workUnitId,
    disposition: "released",
    releasedAt: now,
    terminalizationReceiptDigest: receiptValidation.digest
  };
  const projectionRecord = projection.projection;
  for (const [name, record] of [["terminalization-receipt", receipt], ["claim-release", claimRelease], ["projection", projectionRecord]]) {
    const published = publishExpectedRecord({ directory: activePath, name, record, provider: providerCapability.provider, fileSystem });
    if (!published.valid) return { valid: false, classification: "failed", reason: published.reason, requestDigest };
  }

  const archivedRun = archiveTerminalRun({ paths, parentRun, workUnit, terminalSummary, claim, attempts: [], cleanupPending: false, recoveryPending: false, allowBootstrapPreSnapshot: bootstrapWorkUnit, now, fileSystem });
  if (!archivedRun.valid) return { valid: false, classification: "failed", reason: archivedRun.reason, requestDigest, ...(archivedRun.archivePath ? { archivePath: archivedRun.archivePath } : {}) };
  const verified = terminalizationArchiveMatch({ paths, terminalization, requestDigest, fileSystem });
  if (!verified?.valid || verified.archivePath !== archivedRun.archivePath) {
    return { valid: false, classification: "failed", reason: "terminalization-post-archive-verification-failed", requestDigest };
  }
  return { valid: true, classification: "terminalized", requestDigest, archivePath: archivedRun.archivePath, receipt: verified.receipt, index: archivedRun.index };
}

function validCancellationRequest(value) {
  return exactKeys(value, ["schemaVersion", "controllerRunId", "parentRunId", "workUnitId", "claimId", "repositoryId", "approvedChangeId", "provider"]) &&
    value.schemaVersion === 1 && validRunId(value.controllerRunId) && validRunId(value.parentRunId) &&
    validRunId(value.workUnitId) && validRunId(value.claimId) && repositoryId(value.repositoryId) &&
    validRunId(value.approvedChangeId) && validateProviderCapabilities(value.provider).valid;
}

function validOwnerAuthorization(value) {
  return exactKeys(value, ["approved", "owner", "reviewedAt", "reference", "signatureAlgorithm", "signature"]) &&
    value.approved === true && text(value.owner) && timestamp(value.reviewedAt) && text(value.reference) &&
    value.signatureAlgorithm === "ed25519" && text(value.signature);
}

export function earlyRetirementAuthorizationPayload(retirement) {
  const ownerAuthorization = retirement?.ownerAuthorization ?? {};
  return canonical({
    schemaVersion: retirement?.schemaVersion,
    controllerRunId: retirement?.controllerRunId,
    parentRunId: retirement?.parentRunId,
    workUnitId: retirement?.workUnitId,
    claimId: retirement?.claimId,
    repositoryId: retirement?.repositoryId,
    approvedChangeId: retirement?.approvedChangeId,
    provider: retirement?.provider,
    blockedReason: retirement?.blockedReason,
    requiredTransition: retirement?.requiredTransition,
    recoveryReference: retirement?.recoveryReference,
    expiresAt: retirement?.expiresAt,
    ownerAuthorization: {
      approved: ownerAuthorization.approved,
      owner: ownerAuthorization.owner,
      reviewedAt: ownerAuthorization.reviewedAt,
      reference: ownerAuthorization.reference,
      signatureAlgorithm: ownerAuthorization.signatureAlgorithm
    }
  });
}

function validSignedEarlyRetirementAuthorization(retirement, { trustedOwner, trustedOwnerPublicKey } = {}) {
  const authorization = retirement?.ownerAuthorization;
  if (!validOwnerAuthorization(authorization) || !text(trustedOwner) || authorization.owner !== trustedOwner || !trustedOwnerPublicKey) return false;
  try {
    return crypto.verify(null, Buffer.from(JSON.stringify(earlyRetirementAuthorizationPayload(retirement))), trustedOwnerPublicKey,
      Buffer.from(authorization.signature, "base64"));
  } catch { return false; }
}

function validEarlyRetirementAuthorization(value) {
  return exactKeys(value, ["schemaVersion", "controllerRunId", "parentRunId", "workUnitId", "claimId", "repositoryId", "approvedChangeId", "provider", "blockedReason", "requiredTransition", "recoveryReference", "ownerAuthorization", "expiresAt"]) &&
    value.schemaVersion === 1 && validCancellationRequest({
      schemaVersion: 1,
      controllerRunId: value.controllerRunId,
      parentRunId: value.parentRunId,
      workUnitId: value.workUnitId,
      claimId: value.claimId,
      repositoryId: value.repositoryId,
      approvedChangeId: value.approvedChangeId,
      provider: value.provider
    }) && value.blockedReason === "required-controller-transition-unavailable" &&
    validTransitionName(value.requiredTransition) && text(value.recoveryReference) &&
    validOwnerAuthorization(value.ownerAuthorization) && timestamp(value.expiresAt);
}

function activeRunHasProgressArtifacts(activePath, fileSystem = fs) {
  const admissionRecords = new Set(["parent-run.json", "work-unit.json", "resource-claim.json", "operation-contract.json"]);
  try {
    const entries = fileSystem.readdirSync(activePath, { withFileTypes: true });
    return entries.some((entry) => !entry.isFile() || entry.isSymbolicLink() || !admissionRecords.has(entry.name));
  } catch { return true; }
}

function controllerMatchesRetirementBaseline(record, retirement) {
  return record?.schemaVersion === 5 && record.runId === retirement.controllerRunId &&
    record.selectedEntry === retirement.approvedChangeId && record.currentPhase === "propose" &&
    record.v2Admission?.state === "admitted" && record.v2Admission?.repositoryId === retirement.repositoryId &&
    record.v2Admission?.parentRunId === retirement.parentRunId && record.v2Admission?.workUnitId === retirement.workUnitId &&
    record.v2Admission?.claimId === retirement.claimId && Array.isArray(record.steps) && record.steps.length === phases.length &&
    record.steps.every((step, index) => step?.id === phases[index] && step.status === "pending" && step.evidence === undefined) &&
    Array.isArray(record.resourceRecords) && record.resourceRecords.length === 0 &&
    Array.isArray(record.issueIntakeRecords) && record.issueIntakeRecords.length === 0 &&
    Array.isArray(record.authContextRecords) && record.authContextRecords.length === 0 &&
    Array.isArray(record.cleanupReceipts) && record.cleanupReceipts.length === 0 &&
    Array.isArray(record.completedEntries) && record.completedEntries.length === 0;
}

function controllerHasProgressArtifacts(repositoryPath, retirement, runGit) {
  const persisted = readPersistedControllerRecord({
    repositoryPath,
    record: {
      runId: retirement.controllerRunId,
      checkpointPath: checkpointForRun(retirement.controllerRunId)
    },
    runGit,
    allowRetirementEvidence: true
  });
  return !persisted.valid || !controllerMatchesRetirementBaseline(persisted.record, retirement);
}

function ensureControllerRetirementEvidence({ repositoryPath, retirement, requestDigest, cancellationReceipt, archivePath, runGit, fileSystem = fs } = {}) {
  const state = resolveControllerStateRoot({ repositoryPath, runGit });
  if (!state.valid) return state;
  const checkpointPath = checkpointForRun(retirement?.controllerRunId);
  let containment;
  try { containment = safeContainedDestination(state.stateRoot, checkpointPath); } catch { return { valid: false, reason: "controller-retirement-checkpoint-conflict" }; }
  if (!containment || !containment.inspectComponents()) return { valid: false, reason: "controller-retirement-checkpoint-conflict" };
  const lock = path.join(path.dirname(containment.destination), `.${path.basename(containment.destination)}.lock`);
  const lockHandle = acquireControllerRecordLock(lock);
  if (lockHandle === undefined) return { valid: false, reason: "controller-record-lock-unavailable" };
  try {
    const controller = safeJson(fileSystem, containment.destination);
    if (!controllerMatchesRetirementBaseline(controller, retirement)) {
      return { valid: false, reason: "controller-retirement-checkpoint-conflict" };
    }
    const retirementMarker = buildControllerRetirementMarker({
      controller, retirement, requestDigest, cancellationReceipt, createdAt: cancellationReceipt?.createdAt
    });
    if (!retirementMarker) return { valid: false, reason: "controller-retirement-marker-invalid" };
    const publishedRetirement = publishControllerMarker({
      stateRoot: state.stateRoot,
      controller,
      name: controllerRetirementMarkerName,
      marker: retirementMarker,
      validate: (value) => validControllerRetirementMarker(value, { controller, cancellationReceipt }),
      fileSystem
    });
    if (!publishedRetirement.valid) return publishedRetirement;
    if (!archivePath) return { valid: true, state: "retiring", retirementMarker, path: publishedRetirement.path };
    const archiveManifest = safeJson(fileSystem, path.join(archivePath, "archive-manifest.json"));
    const terminalMarker = buildControllerTerminalMarker({ controller, retirementMarker, cancellationReceipt, archiveManifest });
    if (!terminalMarker) return { valid: false, reason: "controller-terminal-marker-invalid" };
    const publishedTerminal = publishControllerMarker({
      stateRoot: state.stateRoot,
      controller,
      name: controllerTerminalMarkerName,
      marker: terminalMarker,
      validate: (value) => validControllerTerminalMarker(value, {
        controller, retirementMarker, cancellationReceipt, archiveManifest
      }),
      fileSystem
    });
    return publishedTerminal.valid
      ? { valid: true, state: "retired", retirementMarker, terminalMarker, path: publishedTerminal.path }
      : publishedTerminal;
  } finally {
    try { fileSystem.closeSync(lockHandle.descriptor); } catch {}
    try { fileSystem.unlinkSync(lock); } catch {}
    try { fileSystem.unlinkSync(lockHandle.ownerPath); } catch {}
  }
}

function cancelledTerminalSummaryFor({ claim, workUnit, reason, now }) {
  const summary = {
    workUnitId: workUnit.workUnitId,
    ordinal: workUnit.ordinal,
    approvedChangeId: workUnit.approvedChangeId,
    terminalStatus: "cancelled",
    terminalReason: reason,
    startedAt: claim.acquiredAt,
    terminalAt: now,
    finalHead: null,
    attemptCount: 0,
    correctionCount: 0,
    claimDisposition: "released",
    cleanupDisposition: "cancelled",
    childHistoryReference: null,
    childHistoryDigest: null
  };
  return { ...summary, terminalSummaryDigest: digestValue(summary) };
}

function cancellationArchiveMatch({ paths, cancellation, requestDigest, fileSystem = fs }) {
  try {
    if (!fileSystem.existsSync(paths.archive)) return null;
    const years = fileSystem.readdirSync(paths.archive, { withFileTypes: true });
    for (const year of years) {
      if (!year.isDirectory() || year.name.startsWith(".")) continue;
      const yearPath = path.join(paths.archive, year.name);
      for (const month of fileSystem.readdirSync(yearPath, { withFileTypes: true })) {
        if (!month.isDirectory() || month.name.startsWith(".")) continue;
        const monthPath = path.join(yearPath, month.name);
        for (const day of fileSystem.readdirSync(monthPath, { withFileTypes: true })) {
          if (!day.isDirectory() || day.name.startsWith(".")) continue;
          const runPath = path.join(monthPath, day.name, cancellation.parentRunId);
          if (!fileSystem.existsSync(runPath) || fileSystem.lstatSync(runPath).isSymbolicLink()) continue;
          const receipt = safeJson(fileSystem, path.join(runPath, "cancellation-receipt.json"));
          if (!validateDomainRecord(receipt).valid || receipt.kind !== "cancellation-receipt") continue;
          if (receipt.controllerRunId !== cancellation.controllerRunId || receipt.parentRunId !== cancellation.parentRunId ||
              receipt.workUnitId !== cancellation.workUnitId || receipt.claimId !== cancellation.claimId ||
              receipt.repositoryId !== cancellation.repositoryId || receipt.approvedChangeId !== cancellation.approvedChangeId) {
            return { valid: false, reason: "cancellation-archive-identity-conflict", archivePath: runPath };
          }
          if (receipt.requestDigest !== requestDigest) return { valid: false, reason: "cancellation-archive-request-conflict", archivePath: runPath };
          return { valid: true, archivePath: runPath, receipt };
        }
      }
    }
    return null;
  } catch { return { valid: false, reason: "cancellation-archive-inspection-unavailable" }; }
}

/**
 * Retires one exact expired, unfinished v2 run without accepting caller-chosen
 * storage paths or fabricating delivery-terminalization evidence. It records a
 * cancellation receipt, marks the run cancelled, and releases only the exact
 * claim it proves is held by that run.
 */
function cancelV2Run({ readableRepositoryName, repositoryPath, cancellation, request, retirement, requireExpired, rejectProgressArtifacts = false, rejectControllerProgress = false, terminalReason, classification, alreadyClassification, stateHome = defaultStateHome(), now = new Date().toISOString(), fileSystem = fs, runGit } = {}) {
  if (!validCancellationRequest(cancellation) || !request || typeof requireExpired !== "boolean" || typeof rejectProgressArtifacts !== "boolean" ||
      typeof rejectControllerProgress !== "boolean" || (rejectControllerProgress && !retirement) || !text(terminalReason) ||
      !text(classification) || !text(alreadyClassification) || !timestamp(now) || !text(readableRepositoryName)) {
    return { valid: false, classification: "paused", reason: "cancellation-input-invalid" };
  }
  const providerCapability = validateProviderCapabilities(cancellation.provider);
  const paths = statePaths({ stateHome, readableName: readableRepositoryName, repositoryId: cancellation.repositoryId });
  if (!providerCapability.valid || !paths) return { valid: false, classification: "paused", reason: "cancellation-state-unavailable" };

  const requestDigest = digestValue(request);
  const archived = cancellationArchiveMatch({ paths, cancellation, requestDigest, fileSystem });
  if (archived?.valid) {
    if (retirement) {
      const marked = ensureControllerRetirementEvidence({
        repositoryPath, retirement, requestDigest, cancellationReceipt: archived.receipt,
        archivePath: archived.archivePath, runGit, fileSystem
      });
      if (!marked.valid || marked.state !== "retired") {
        return { valid: false, classification: "failed", reason: marked.reason ?? "controller-retirement-marker-incomplete", requestDigest };
      }
    }
    return { valid: true, classification: alreadyClassification, requestDigest, archivePath: archived.archivePath, receipt: archived.receipt };
  }
  if (archived && !archived.valid) return { ...archived, classification: "paused", requestDigest };

  const activePath = path.join(paths.active, cancellation.parentRunId);
  try {
    if (!fileSystem.existsSync(activePath) || fileSystem.lstatSync(activePath).isSymbolicLink()) {
      return { valid: false, classification: "paused", reason: "cancellation-active-run-unavailable", requestDigest };
    }
  } catch { return { valid: false, classification: "paused", reason: "cancellation-active-run-unavailable", requestDigest }; }

  const parentRun = safeJson(fileSystem, path.join(activePath, "parent-run.json"));
  const workUnit = safeJson(fileSystem, path.join(activePath, "work-unit.json"));
  const claim = safeJson(fileSystem, path.join(activePath, "resource-claim.json"));
  if (!validateDomainRecord(parentRun).valid || !validateDomainRecord(workUnit).valid || !validateDomainRecord(claim).valid) {
    return { valid: false, classification: "paused", reason: "cancellation-active-record-invalid", requestDigest };
  }
  if (parentRun.parentRunId !== cancellation.parentRunId || workUnit.parentRunId !== parentRun.parentRunId ||
      workUnit.workUnitId !== cancellation.workUnitId || workUnit.approvedChangeId !== cancellation.approvedChangeId ||
      claim.claimId !== cancellation.claimId || claim.workUnitId !== workUnit.workUnitId || claim.repositoryId !== cancellation.repositoryId ||
      cancellation.controllerRunId !== `controller-${parentRun.approvedIntentDigest.slice(0, 32)}` ||
      claim.state !== "active" || claim.providerBinding.id !== providerCapability.provider.id ||
      claim.providerBinding.digest !== digestValue(providerCapability.provider) ||
      parentRun.claimProviderBinding.id !== claim.providerBinding.id || parentRun.claimProviderBinding.digest !== claim.providerBinding.digest ||
      workUnit.claimProviderBinding.id !== claim.providerBinding.id || workUnit.claimProviderBinding.digest !== claim.providerBinding.digest) {
    return { valid: false, classification: "paused", reason: "cancellation-identity-or-claim-mismatch", requestDigest };
  }
  if (requireExpired && Date.parse(parentRun.deadline) > Date.parse(now)) {
    return { valid: false, classification: "paused", reason: "cancellation-run-not-expired", requestDigest };
  }
  if (fileSystem.existsSync(path.join(activePath, "terminalization-receipt.json"))) {
    return { valid: false, classification: "paused", reason: "cancellation-run-delivered", requestDigest };
  }
  if (rejectProgressArtifacts && activeRunHasProgressArtifacts(activePath, fileSystem)) {
    return { valid: false, classification: "paused", reason: "early-retirement-progress-evidence-present", requestDigest };
  }
  if (rejectControllerProgress && controllerHasProgressArtifacts(repositoryPath, retirement, runGit)) {
    return { valid: false, classification: "paused", reason: "early-retirement-progress-evidence-present", requestDigest };
  }

  const terminalSummary = cancelledTerminalSummaryFor({ claim, workUnit, reason: terminalReason, now });
  const projection = buildParentProjection(parentRun, workUnit, terminalSummary, { allowBootstrapPreSnapshot: false });
  if (!projection.valid) return { valid: false, classification: "paused", reason: "cancellation-projection-invalid", requestDigest };

  const receipt = {
    kind: "cancellation-receipt",
    schemaVersion: 2,
    controllerRunId: cancellation.controllerRunId,
    parentRunId: parentRun.parentRunId,
    workUnitId: workUnit.workUnitId,
    claimId: claim.claimId,
    repositoryId: claim.repositoryId,
    approvedChangeId: workUnit.approvedChangeId,
    requestDigest,
    expiresAt: parentRun.deadline,
    createdAt: now
  };
  const receiptValidation = validateDomainRecord(receipt);
  if (!receiptValidation.valid) return { valid: false, classification: "paused", reason: "cancellation-receipt-invalid", requestDigest };
  if (retirement) {
    const marked = ensureControllerRetirementEvidence({
      repositoryPath, retirement, requestDigest, cancellationReceipt: receipt, runGit, fileSystem
    });
    if (!marked.valid || marked.state !== "retiring") {
      return { valid: false, classification: "failed", reason: marked.reason ?? "controller-retirement-marker-incomplete", requestDigest };
    }
  }
  const claimRelease = {
    kind: "claim-release",
    schemaVersion: 2,
    claimId: claim.claimId,
    repositoryId: claim.repositoryId,
    workUnitId: workUnit.workUnitId,
    disposition: "released",
    releasedAt: now,
    cancellationReceiptDigest: receiptValidation.digest
  };
  const projectionRecord = projection.projection;
  for (const [name, record] of [["cancellation-receipt", receipt], ["claim-release", claimRelease], ["projection", projectionRecord]]) {
    const published = publishExpectedRecord({ directory: activePath, name, record, provider: providerCapability.provider, fileSystem });
    if (!published.valid) return { valid: false, classification: "failed", reason: published.reason, requestDigest };
  }

  const archivedRun = archiveTerminalRun({ paths, parentRun, workUnit, terminalSummary, claim, attempts: [], cleanupPending: false, recoveryPending: false, allowBootstrapPreSnapshot: false, now, fileSystem });
  if (!archivedRun.valid) return { valid: false, classification: "failed", reason: archivedRun.reason, requestDigest, ...(archivedRun.archivePath ? { archivePath: archivedRun.archivePath } : {}) };
  const verified = cancellationArchiveMatch({ paths, cancellation, requestDigest, fileSystem });
  if (!verified?.valid || verified.archivePath !== archivedRun.archivePath) {
    return { valid: false, classification: "failed", reason: "cancellation-post-archive-verification-failed", requestDigest };
  }
  if (retirement) {
    const marked = ensureControllerRetirementEvidence({
      repositoryPath, retirement, requestDigest, cancellationReceipt: verified.receipt,
      archivePath: verified.archivePath, runGit, fileSystem
    });
    if (!marked.valid || marked.state !== "retired") {
      return { valid: false, classification: "failed", reason: marked.reason ?? "controller-retirement-marker-incomplete", requestDigest };
    }
  }
  return { valid: true, classification, requestDigest, archivePath: archivedRun.archivePath, receipt: verified.receipt, index: archivedRun.index };
}

export function cancelExpiredV2Run({ readableRepositoryName, cancellation, stateHome = defaultStateHome(), now = new Date().toISOString(), fileSystem = fs } = {}) {
  return cancelV2Run({
    readableRepositoryName,
    cancellation,
    request: cancellation,
    requireExpired: true,
    terminalReason: "expired-unfinished-controller",
    classification: "cancelled",
    alreadyClassification: "already-cancelled",
    stateHome,
    now,
    fileSystem
  });
}

/**
 * Retires one exact admitted run only when a separate current owner binding
 * proves it is blocked on a controller transition missing from this installed
 * runtime. The availability predicate is supplied by the runtime dispatcher,
 * never by the untrusted payload.
 */
export function retireBlockedV2Run({ readableRepositoryName, repositoryPath, retirement, transitionAvailable, trustedOwner, trustedOwnerPublicKey, stateHome = defaultStateHome(), now = new Date().toISOString(), fileSystem = fs, runGit } = {}) {
  if (!validEarlyRetirementAuthorization(retirement) || !validSignedEarlyRetirementAuthorization(retirement, { trustedOwner, trustedOwnerPublicKey }) || typeof transitionAvailable !== "function" || !timestamp(now) || !text(readableRepositoryName)) {
    return { valid: false, classification: "paused", reason: "early-retirement-input-invalid" };
  }
  if (Date.parse(retirement.expiresAt) <= Date.parse(now)) {
    return { valid: false, classification: "paused", reason: "early-retirement-authorization-expired" };
  }
  if (transitionAvailable(retirement.requiredTransition)) {
    return { valid: false, classification: "paused", reason: "early-retirement-transition-available" };
  }
  const cancellation = {
    schemaVersion: 1,
    controllerRunId: retirement.controllerRunId,
    parentRunId: retirement.parentRunId,
    workUnitId: retirement.workUnitId,
    claimId: retirement.claimId,
    repositoryId: retirement.repositoryId,
    approvedChangeId: retirement.approvedChangeId,
    provider: retirement.provider
  };
  return cancelV2Run({
    readableRepositoryName,
    repositoryPath,
    cancellation,
    request: retirement,
    retirement,
    requireExpired: false,
    rejectProgressArtifacts: true,
    rejectControllerProgress: true,
    terminalReason: "owner-authorized-blocked-controller",
    classification: "retired",
    alreadyClassification: "already-retired",
    stateHome,
    now,
    fileSystem,
    runGit
  });
}

export function authorizationDigest(authorization) {
  return crypto.createHash("sha256").update(JSON.stringify(canonical(authorization))).digest("hex");
}

/** Consume the canonical operation gate; callers cannot infer lifecycle policy from a helper name. */
export function evaluateControllerOperation({ record, operation, stage, targetKind, authorization, claimActive, evidenceCurrent, adapterAvailable, runtimePermitted, now } = {}) {
  if (!controllerReadyForMutation(record) || record.selectedEntry !== authorization?.target?.entries?.[0]) {
    return { allowed: false, classification: "paused", reason: "controller-operation-entry-mismatch", disposition: "human-decision" };
  }
  return evaluateOperationGate({ operation, stage, targetKind, authorization, claimActive, evidenceCurrent, adapterAvailable, runtimePermitted, now });
}

export function createControllerRecord({ authorization, repository, selectedEntry, runId = crypto.randomUUID(), v2Admission } = {}) {
  const entries = authorization?.target?.entries;
  const entry = selectedEntry ?? entries?.[0];
  if (!selectedByAuthorization(entry, authorization) || !text(repository) || !validRunId(runId) || authorization?.mode !== "autonomous" || authorization?.authorizationProfile !== "sdd-delivery") {
    return { valid: false, reason: "controller-record-input-invalid" };
  }
  return {
    valid: true,
    record: {
      schemaVersion: v2Admission === undefined ? 4 : 5,
      runId,
      authorizationDigest: authorizationDigest(authorization),
      selectedEntry: entry,
      queueEntries: [...entries],
      queueIndex: entries.indexOf(entry),
      repository,
      expiresAt: authorization.expiresAt,
      allowedLifecycleChain: [...phases],
      checkpointPath: checkpointForRun(runId),
      resourceRecords: [],
      issueIntakeRecords: [],
      authContextRecords: [],
      cleanupReceipts: [],
      completedEntries: [],
      currentPhase: "propose",
      steps: phases.map((id) => ({ id, status: "pending" })),
      ...(v2Admission === undefined ? {} : { v2Admission: structuredClone(v2Admission) })
    }
  };
}

function derivedInitializationIds(authorization) {
  const value = authorizationDigest(authorization);
  return {
    controllerRunId: `controller-${value.slice(0, 32)}`,
    parentRunId: `parent-${value.slice(0, 32)}`,
    workUnitId: `workunit-${value.slice(0, 32)}`,
    claimId: `claim-${value.slice(0, 32)}`
  };
}

/**
 * Starts a new v2 delivery only through a recoverable controller-first
 * protocol. A pending controller record is not lifecycle-eligible; it merely
 * guarantees that a successfully admitted claim is never untracked.
 */
export function initializeV2Delivery({ authorization, repository, canonicalRemote, readableRepositoryName, historyBinding, provider, owner,
  repositoryPath, runtimeConfiguration, stateHome, legacyRecords, legacyDirectory, now = new Date().toISOString(), runGit,
  admit = admitV2RunFromInitializer } = {}) {
  const selectedEntry = authorization?.target?.entries?.[0];
  const canonicalRemoteIdentity = normalizeCanonicalRemote(canonicalRemote);
  const derivedRepositoryId = deriveRepositoryId(canonicalRemote);
  const providerCapability = validateProviderCapabilities(provider);
  if (!selectedByAuthorization(selectedEntry, authorization) || authorization?.mode !== "autonomous" ||
      authorization?.authorizationProfile !== "sdd-delivery" || !text(repository) || !text(readableRepositoryName) ||
      !canonicalRemoteIdentity || !derivedRepositoryId || !providerCapability.valid || !timestamp(now) || !text(repositoryPath)) {
    return { valid: false, classification: "paused", reason: "controller-initialization-input-invalid" };
  }
  const ids = derivedInitializationIds(authorization);
  const providerBinding = { id: providerCapability.provider.id, digest: digestValue(providerCapability.provider) };
  const pendingBinding = {
    schemaVersion: 1,
    state: "pending",
    repositoryId: derivedRepositoryId,
    parentRunId: ids.parentRunId,
    workUnitId: ids.workUnitId,
    claimId: ids.claimId,
    providerBinding,
    preparedAt: now
  };
  const created = createControllerRecord({ authorization, repository, runId: ids.controllerRunId, v2Admission: pendingBinding });
  if (!created.valid || !validV2AdmissionBinding(pendingBinding)) {
    return { valid: false, classification: "paused", reason: "controller-initialization-input-invalid" };
  }
  const admissionInspection = inspectV2Admission({ stateHome, readableRepositoryName, repositoryId: derivedRepositoryId,
    authorization, providerBinding, parentRunId: ids.parentRunId, now });
  if (!admissionInspection.valid) {
    return { valid: false, classification: "paused", reason: admissionInspection.reason };
  }
  const state = resolveControllerStateRoot({ repositoryPath, runGit });
  if (!state.valid) return { valid: false, classification: "paused", reason: state.reason };
  const checkpointPath = path.join(state.stateRoot, created.record.checkpointPath);
  let record = created.record;
  if (fs.existsSync(checkpointPath)) {
    const existing = safeJson(fs, checkpointPath);
    if (existing?.schemaVersion !== 5 || existing.runId !== ids.controllerRunId ||
        existing.authorizationDigest !== authorizationDigest(authorization) || existing.selectedEntry !== selectedEntry ||
        existing.repository !== repository || existing.expiresAt !== authorization.expiresAt ||
        !sameV2AdmissionBinding(existing.v2Admission, pendingBinding)) {
      return { valid: false, classification: "paused", reason: "controller-initialization-context-conflict", checkpointPath };
    }
    const retirementEvidence = readControllerRetirementEvidence({ stateRoot: state.stateRoot, controller: existing });
    if (retirementEvidence.present) {
      return retirementEvidence.valid && retirementEvidence.state === "retired"
        ? { valid: false, classification: "retired", reason: "controller-owner-retired", checkpointPath }
        : { valid: false, classification: "paused", reason: retirementEvidence.valid
          ? "controller-retirement-in-progress" : retirementEvidence.reason, checkpointPath };
    }
    record = existing;
  } else {
    const persisted = persistControllerRecord({ repositoryPath, record, runGit });
    if (!persisted.valid) return { valid: false, classification: "paused", reason: persisted.reason };
  }
  const admitted = admit({ authorization, repository, canonicalRemote, readableRepositoryName, historyBinding, provider, owner, repositoryPath,
    runtimeConfiguration, stateHome, legacyRecords, legacyDirectory, parentRunId: ids.parentRunId,
    workUnitId: ids.workUnitId, claimId: ids.claimId, now }, { checkpointPath, controllerRecord: record });
  if (!admitted?.valid) {
    return { valid: false, classification: "paused", reason: admitted?.reason ?? "controller-initialization-admission-unavailable", checkpointPath };
  }
  if (admitted.repositoryId !== pendingBinding.repositoryId || admitted.parentRun?.parentRunId !== pendingBinding.parentRunId ||
      admitted.workUnit?.workUnitId !== pendingBinding.workUnitId || admitted.claim?.claimId !== pendingBinding.claimId ||
      admitted.workUnit?.approvedChangeId !== selectedEntry || admitted.providerBinding?.id !== providerBinding.id ||
      admitted.providerBinding?.digest !== providerBinding.digest) {
    return { valid: false, classification: "paused", reason: "controller-initialization-admission-mismatch", checkpointPath };
  }
  const bound = {
    ...record,
    v2Admission: { ...record.v2Admission, state: "admitted", admittedAt: record.v2Admission.admittedAt ?? now }
  };
  const persisted = persistControllerRecord({ repositoryPath, record: bound, expectedRecordDigest: digestValue(record), runGit });
  if (!persisted.valid) {
    return { valid: false, classification: "paused", reason: "controller-initialization-bind-persist-failed", checkpointPath };
  }
  return {
    valid: true,
    classification: record.v2Admission.state === "admitted" ? "resumed" : "initialized",
    record: bound,
    checkpointPath: persisted.path,
    admission: admitted
  };
}

export function registerControllerIssueIntake(record, binding, { now = new Date().toISOString() } = {}) {
  if (!controllerReadyForMutation(record) || !timestamp(now) || !validateIssueIntakeBinding(binding) ||
      binding.selectedEntry !== record.selectedEntry) return { valid: false, reason: "controller-issue-intake-registration-invalid" };
  const next = structuredClone(record);
  next.issueIntakeRecords ??= [];
  if (!Array.isArray(next.issueIntakeRecords) ||
      next.issueIntakeRecords.some((item) => !validIssueIntakeRecord(item, next.selectedEntry))) {
    return { valid: false, reason: "controller-issue-intake-registration-invalid" };
  }
  if (next.issueIntakeRecords.some((item) => item.binding.payloadDigest === binding.payloadDigest)) {
    return { valid: false, reason: "controller-issue-intake-registration-duplicate" };
  }
  const intake = {
    selectedEntry: next.selectedEntry,
    status: "pending",
    binding: structuredClone(binding),
    bindingDigest: authorizationDigest(binding),
    registeredAt: now
  };
  if (!validIssueIntakeRecord(intake, next.selectedEntry)) return { valid: false, reason: "controller-issue-intake-registration-invalid" };
  next.issueIntakeRecords.push(intake);
  return { valid: true, record: next, intake };
}

export function bindControllerIssueIntake(record, { payloadDigest, issue, observedAt, reference } = {}) {
  if (!controllerReadyForMutation(record) || !text(payloadDigest)) return { valid: false, reason: "controller-issue-intake-delivery-invalid" };
  const next = structuredClone(record);
  if (!Array.isArray(next.issueIntakeRecords) ||
      next.issueIntakeRecords.some((item) => !validIssueIntakeRecord(item, next.selectedEntry))) {
    return { valid: false, reason: "controller-issue-intake-delivery-invalid" };
  }
  const matches = next.issueIntakeRecords?.filter((item) => item.binding.payloadDigest === payloadDigest) ?? [];
  if (matches.length !== 1 || matches[0].status !== "pending") return { valid: false, reason: "controller-issue-intake-delivery-invalid" };
  const bound = bindIssueIntakeEvidence(matches[0].binding, issue, { observedAt, reference });
  if (!bound.valid) return { valid: false, reason: "controller-issue-intake-delivery-invalid" };
  matches[0].status = "delivered";
  matches[0].evidence = bound.evidence;
  if (!validIssueIntakeRecord(matches[0], next.selectedEntry)) return { valid: false, reason: "controller-issue-intake-delivery-invalid" };
  return { valid: true, record: next, intake: matches[0] };
}

export function registerControllerAuthContext(record, binding, { now = new Date().toISOString() } = {}) {
  if (!controllerReadyForMutation(record) || !timestamp(now) || !validateGithubAuthContextBinding(binding) ||
      binding.selectedEntry !== record.selectedEntry) return { valid: false, reason: "controller-auth-context-registration-invalid" };
  const next = structuredClone(record);
  next.authContextRecords ??= [];
  if (!Array.isArray(next.authContextRecords) || next.authContextRecords.some((item) => !validAuthContextRecord(item, next.selectedEntry)) ||
      next.authContextRecords.some((item) => item.bindingDigest === authContextBindingDigest(binding))) {
    return { valid: false, reason: "controller-auth-context-registration-invalid" };
  }
  const authContext = {
    selectedEntry: next.selectedEntry,
    status: "pending",
    binding: structuredClone(binding),
    bindingDigest: authContextBindingDigest(binding),
    registeredAt: now
  };
  if (!validAuthContextRecord(authContext, next.selectedEntry)) return { valid: false, reason: "controller-auth-context-registration-invalid" };
  next.authContextRecords.push(authContext);
  return { valid: true, record: next, authContext };
}

export function bindControllerAuthContext(record, { bindingDigest, evidence } = {}) {
  if (!controllerReadyForMutation(record) || !text(bindingDigest) || !validateGithubAuthContextEvidence(evidence)) {
    return { valid: false, reason: "controller-auth-context-evidence-invalid" };
  }
  const next = structuredClone(record);
  if (!Array.isArray(next.authContextRecords) || next.authContextRecords.some((item) => !validAuthContextRecord(item, next.selectedEntry))) {
    return { valid: false, reason: "controller-auth-context-evidence-invalid" };
  }
  const matches = next.authContextRecords.filter((item) => item.bindingDigest === bindingDigest);
  if (matches.length !== 1 || matches[0].status !== "pending" || evidence.bindingDigest !== bindingDigest ||
      evidence.binding.selectedEntry !== next.selectedEntry) return { valid: false, reason: "controller-auth-context-evidence-invalid" };
  matches[0].status = "delivered";
  matches[0].evidence = structuredClone(evidence);
  if (!validAuthContextRecord(matches[0], next.selectedEntry)) return { valid: false, reason: "controller-auth-context-evidence-invalid" };
  return { valid: true, record: next, authContext: matches[0] };
}

export function registerControllerResource(record, resource, { now = new Date().toISOString() } = {}) {
  if (!controllerReadyForMutation(record) || !timestamp(now) || !resource || !["worktree", "branch"].includes(resource.kind) ||
      !text(resource.id) || !text(resource.role) || !fullCommit(resource.registeredHeadCommit) || !text(resource.recoveryReference) ||
      resource.deliveryEvidence !== undefined) return { valid: false, reason: "controller-resource-registration-invalid" };
  const next = structuredClone(record);
  if (!Array.isArray(next.resourceRecords) || next.resourceRecords.some((item) => item.kind === resource.kind && item.id === resource.id)) {
    return { valid: false, reason: "controller-resource-registration-duplicate" };
  }
  const registered = {
    entry: next.selectedEntry,
    repository: next.repository,
    kind: resource.kind,
    id: resource.id,
    role: resource.role,
    registeredHeadCommit: resource.registeredHeadCommit,
    ownershipToken: resource.ownershipToken ?? crypto.randomUUID(),
    recoveryReference: resource.recoveryReference,
    owned: true,
    registeredAt: now
  };
  if (!validResource(registered, next)) return { valid: false, reason: "controller-resource-registration-invalid" };
  next.resourceRecords.push(registered);
  return { valid: true, record: next, resource: registered };
}

export function bindControllerResourceDelivery(record, { kind, id, deliveryEvidence } = {}) {
  if (!controllerReadyForMutation(record) || !["worktree", "branch"].includes(kind) || !text(id)) return { valid: false, reason: "controller-resource-delivery-invalid" };
  const next = structuredClone(record);
  const resource = next.resourceRecords?.find((item) => item.kind === kind && item.id === id);
  if (!resource || resource.deliveryEvidence !== undefined) return { valid: false, reason: "controller-resource-delivery-invalid" };
  resource.headCommit = deliveryEvidence?.headCommit;
  resource.deliveryCurrent = true;
  resource.deliveryEvidence = structuredClone(deliveryEvidence);
  if (resource.kind === "branch") resource.squashOrRebaseEvidence = structuredClone(deliveryEvidence?.mergedPullRequest);
  if (!validResource(resource, next, { allowPending: false })) return { valid: false, reason: "controller-resource-delivery-invalid" };
  return { valid: true, record: next };
}

export function appendControllerCleanupReceipt(record, receipt, { now = new Date().toISOString() } = {}) {
  if (!controllerReadyForMutation(record) || !timestamp(now) || !receipt || !["started", "completed", "already-completed", "blocked"].includes(receipt.status) ||
      !["worktree", "branch"].includes(receipt.kind) || !text(receipt.id)) return { valid: false, reason: "controller-cleanup-receipt-invalid" };
  const next = structuredClone(record);
  const resource = next.resourceRecords?.find((item) => item.kind === receipt.kind && item.id === receipt.id);
  if (!resource || !validResource(resource, next, { allowPending: false })) return { valid: false, reason: "controller-cleanup-receipt-resource-invalid" };
  const saved = { kind: receipt.kind, id: receipt.id, status: receipt.status, at: now, recoveryReference: resource.recoveryReference };
  next.cleanupReceipts.push(saved);
  return { valid: true, record: next, receipt: saved };
}

export function persistControllerCleanupReceipt({ repositoryPath, record, receipt, now, runGit } = {}) {
  return mutatePersistedControllerRecord({ repositoryPath, record, runGit,
    mutate: (durable) => appendControllerCleanupReceipt(durable, receipt, { now })
  });
}

export function advanceControllerQueue(record, { now = new Date().toISOString() } = {}) {
  if (!controllerReadyForMutation(record) || !Array.isArray(record?.queueEntries) || !Number.isInteger(record.queueIndex) || record.queueEntries[record.queueIndex] !== record.selectedEntry ||
      record.steps?.some((step) => step.status !== "complete" || step.evidence?.current !== true) || !timestamp(now)) return { valid: false, reason: "controller-queue-advance-invalid" };
  const nextIndex = record.queueIndex + 1;
  if (nextIndex >= record.queueEntries.length) return { valid: false, reason: "controller-queue-complete" };
  const next = structuredClone(record);
  if (!Array.isArray(next.resourceRecords) || !Array.isArray(next.cleanupReceipts) || !Array.isArray(next.completedEntries) ||
      !validCompletedEntry({ selectedEntry: next.selectedEntry, resourceRecords: next.resourceRecords, cleanupReceipts: next.cleanupReceipts }, next.repository)) return { valid: false, reason: "controller-queue-advance-invalid" };
  next.completedEntries.push({
    selectedEntry: next.selectedEntry,
    completedAt: now,
    resourceRecords: next.resourceRecords,
    issueIntakeRecords: next.issueIntakeRecords ?? [],
    authContextRecords: next.authContextRecords ?? [],
    cleanupReceipts: next.cleanupReceipts
  });
  next.queueIndex = nextIndex;
  next.selectedEntry = next.queueEntries[nextIndex];
  next.resourceRecords = [];
  next.issueIntakeRecords = [];
  next.authContextRecords = [];
  next.cleanupReceipts = [];
  next.currentPhase = "propose";
  next.steps = phases.map((id) => ({ id, status: "pending" }));
  return { valid: true, record: next };
}

export function inspectControllerRecord(record, { authorization, repository, retirementEvidence, now = new Date().toISOString() } = {}) {
  if (!record || record.schemaVersion === 1 || record.schemaVersion === 2 || record.schemaVersion === 3) return { classification: "paused", reason: "controller-record-legacy", nextPhase: null };
  if (!controllerSchema(record.schemaVersion) || !validRunId(record.runId) || record.checkpointPath !== checkpointForRun(record.runId) || !text(record.selectedEntry) || !text(record.repository) || !text(record.checkpointPath) || !Array.isArray(record.steps) ||
      !Array.isArray(record.resourceRecords) || (record.issueIntakeRecords !== undefined && !Array.isArray(record.issueIntakeRecords)) ||
      (record.authContextRecords !== undefined && !Array.isArray(record.authContextRecords)) ||
      !Array.isArray(record.cleanupReceipts) || !Array.isArray(record.completedEntries) ||
      record.resourceRecords.some((resource) => !validResource(resource, record)) ||
      (record.issueIntakeRecords ?? []).some((intake) => !validIssueIntakeRecord(intake, record.selectedEntry)) ||
      (record.authContextRecords ?? []).some((authContext) => !validAuthContextRecord(authContext, record.selectedEntry)) ||
      record.completedEntries.some((entry) => !validCompletedEntry(entry, record.repository)) ||
      (record.schemaVersion === 5 && !validV2AdmissionBinding(record.v2Admission)) ||
      (record.schemaVersion === 4 && record.v2Admission !== undefined)) {
    return { classification: "paused", reason: "controller-record-invalid", nextPhase: null };
  }
  if (!selectedByAuthorization(record.selectedEntry, authorization) || record.repository !== repository || record.authorizationDigest !== authorizationDigest(authorization) || record.expiresAt !== authorization?.expiresAt) {
    return { classification: "paused", reason: "controller-context-conflict", nextPhase: null };
  }
  if (retirementEvidence?.present) {
    if (!retirementEvidence.valid) return { classification: "paused", reason: retirementEvidence.reason ?? "controller-retirement-evidence-invalid", nextPhase: null };
    if (retirementEvidence.state === "retiring") return { classification: "paused", reason: "controller-retirement-in-progress", nextPhase: null };
    if (retirementEvidence.state === "retired") return { classification: "retired", reason: "controller-owner-retired", nextPhase: null };
    return { classification: "paused", reason: "controller-retirement-evidence-invalid", nextPhase: null };
  }
  if (Date.parse(record.expiresAt) <= Date.parse(now)) return { classification: "paused", reason: "controller-context-expired", nextPhase: null };
  if (record.schemaVersion === 5 && record.v2Admission.state !== "admitted") {
    return { classification: "paused", reason: "controller-initialization-pending", nextPhase: null };
  }
  if (JSON.stringify(record.allowedLifecycleChain) !== JSON.stringify(phases) || record.steps.length !== phases.length || record.steps.some((step, index) => step?.id !== phases[index])) {
    return { classification: "paused", reason: "controller-phase-chain-invalid", nextPhase: null };
  }
  const stale = record.steps.find((step) => step.status === "complete" && step.evidence?.current !== true);
  if (stale) return { classification: "continue", reason: "controller-phase-stale", nextPhase: stale.id };
  const next = record.steps.find((step) => step.status !== "complete");
  if (!next && !validCompletedEntry({ selectedEntry: record.selectedEntry, resourceRecords: record.resourceRecords, cleanupReceipts: record.cleanupReceipts }, record.repository)) {
    return { classification: "paused", reason: "controller-cleanup-incomplete", nextPhase: "cleanup" };
  }
  return next
    ? { classification: "continue", reason: "controller-first-incomplete-phase", nextPhase: next.id }
    : { classification: "complete", reason: "controller-all-phases-complete", nextPhase: null };
}

export function inspectPersistedControllerRecord({ repositoryPath, record, authorization, repository, now = new Date().toISOString(), runGit, fileSystem = fs } = {}) {
  const state = resolveControllerStateRoot({ repositoryPath, runGit });
  if (!state.valid) return { classification: "paused", reason: state.reason, nextPhase: null };
  const retirementEvidence = readControllerRetirementEvidence({ stateRoot: state.stateRoot, controller: record, fileSystem });
  return inspectControllerRecord(record, { authorization, repository, retirementEvidence, now });
}

function validPhaseEvidence(evidence, phase) {
  return exactKeys(evidence, ["current", "phase", "reference", "artifacts"]) && evidence.current === true && evidence.phase === phase &&
    typeof evidence.reference === "string" && /^[a-z0-9][a-z0-9._:/-]{2,255}$/i.test(evidence.reference) &&
    Array.isArray(evidence.artifacts) && evidence.artifacts.length > 0 && evidence.artifacts.every((artifact) =>
      exactKeys(artifact, ["path", "sha256"]) && safeEvidencePath(artifact.path) && digest(artifact.sha256));
}

function evidenceArtifactsMatchRepository(evidence, repositoryPath) {
  if (!text(repositoryPath)) return false;
  let root;
  try { root = fs.realpathSync(repositoryPath); } catch { return false; }
  return evidence.artifacts.every((artifact) => {
    let destination;
    try {
      const contained = safeContainedDestination(root, artifact.path);
      destination = contained?.destination;
      if (!contained || !contained.inspectComponents()) return false;
      const entry = fs.lstatSync(destination);
      if (!entry.isFile() || entry.isSymbolicLink()) return false;
      return crypto.createHash("sha256").update(fs.readFileSync(destination)).digest("hex") === artifact.sha256;
    } catch { return false; }
  });
}

export function advanceControllerRecord(record, phase, evidence) {
  const index = phases.indexOf(phase);
  const existing = record?.steps?.[index];
  if (!controllerReadyForMutation(record) || index < 0 || !validPhaseEvidence(evidence, phase) || (existing?.status === "complete" && existing.evidence?.current === true)) {
    return { valid: false, reason: "controller-phase-advance-invalid" };
  }
  if (record.steps.slice(0, index).some((step) => step.status !== "complete" || step.evidence?.current !== true)) {
    return { valid: false, reason: "controller-phase-advance-out-of-order" };
  }
  if (phase === "cleanup" && !validCompletedEntry({ selectedEntry: record.selectedEntry, resourceRecords: record.resourceRecords, cleanupReceipts: record.cleanupReceipts }, record.repository)) {
    return { valid: false, reason: "controller-cleanup-incomplete" };
  }
  const next = structuredClone(record);
  next.steps[index] = { id: phase, status: "complete", evidence };
  next.currentPhase = phases[index + 1] ?? null;
  return { valid: true, record: next };
}

export function advanceControllerLifecyclePhase({ repositoryPath, record, authorization, repository, phase, evidence, now, runGit } = {}) {
  const supplied = inspectControllerRecord(record, { authorization, repository, now });
  if (supplied.classification !== "continue" || supplied.nextPhase !== phase) {
    return { valid: false, classification: "paused", reason: supplied.reason ?? "controller-phase-advance-invalid" };
  }
  const persisted = readPersistedControllerRecord({ repositoryPath, record, runGit });
  if (!persisted.valid) return { valid: false, classification: "paused", reason: persisted.reason };
  const durable = persisted.record;
  if (!sameControllerContext(durable, record)) {
    return { valid: false, classification: "paused", reason: "controller-phase-advance-record-conflict" };
  }
  if (!validPhaseEvidence(evidence, phase) || !evidenceArtifactsMatchRepository(evidence, repositoryPath)) {
    return { valid: false, classification: "paused", reason: "controller-phase-evidence-artifacts-invalid" };
  }
  const completed = durable.steps?.[phases.indexOf(phase)];
  if (completed?.status === "complete") {
    return JSON.stringify(canonical(completed.evidence)) === JSON.stringify(canonical(evidence))
      ? { valid: true, classification: "already-advanced", record: durable, nextPhase: durable.currentPhase, path: persisted.path }
      : { valid: false, classification: "paused", reason: "controller-phase-advance-evidence-conflict" };
  }
  if (digestValue(durable) !== digestValue(record)) {
    return { valid: false, classification: "paused", reason: "controller-record-stale" };
  }
  const inspected = inspectControllerRecord(durable, { authorization, repository, now });
  if (inspected.classification !== "continue" || inspected.nextPhase !== phase) {
    return { valid: false, classification: "paused", reason: inspected.reason ?? "controller-phase-advance-invalid" };
  }
  const advanced = advanceControllerRecord(durable, phase, evidence);
  if (!advanced.valid) return { valid: false, classification: "paused", reason: advanced.reason };
  const written = persistControllerRecord({ repositoryPath, record: advanced.record, expectedRecordDigest: digestValue(durable), runGit });
  return written.valid
    ? { valid: true, classification: "advanced", record: advanced.record, nextPhase: advanced.record.currentPhase, path: written.path }
    : { valid: false, classification: "paused", reason: written.reason };
}

/**
 * All installed controller mutation wrappers derive from the durable exact
 * predecessor and persist it with a compare-and-swap digest. This prevents an
 * older caller-provided record from erasing a concurrently completed phase.
 */
function mutatePersistedControllerRecord({ repositoryPath, record, runGit, mutate } = {}) {
  if (typeof mutate !== "function") return { valid: false, reason: "controller-record-mutation-invalid" };
  const persisted = readPersistedControllerRecord({ repositoryPath, record, runGit });
  if (!persisted.valid) return persisted;
  if (!sameControllerContext(persisted.record, record) || digestValue(persisted.record) !== digestValue(record)) {
    return { valid: false, reason: "controller-record-stale" };
  }
  const changed = mutate(persisted.record);
  if (!changed?.valid) return changed;
  const written = persistControllerRecord({ repositoryPath, record: changed.record, expectedRecordDigest: digestValue(persisted.record), runGit });
  return written.valid ? { ...changed, path: written.path } : written;
}

function sameControllerContext(left, right) {
  return left?.schemaVersion === right?.schemaVersion && left?.runId === right?.runId &&
    left?.checkpointPath === right?.checkpointPath && left?.repository === right?.repository &&
    left?.selectedEntry === right?.selectedEntry && left?.authorizationDigest === right?.authorizationDigest &&
    left?.expiresAt === right?.expiresAt;
}

function readPersistedControllerRecord({ repositoryPath, record, runGit, allowRetirementEvidence = false } = {}) {
  if (!text(repositoryPath) || !validRunId(record?.runId) || record?.checkpointPath !== checkpointForRun(record.runId) || path.isAbsolute(record.checkpointPath)) {
    return { valid: false, reason: "controller-record-path-invalid" };
  }
  const state = resolveControllerStateRoot({ repositoryPath, runGit });
  if (!state.valid) return state;
  let containment;
  try { containment = safeContainedDestination(state.stateRoot, record.checkpointPath); } catch { return { valid: false, reason: "controller-record-unavailable" }; }
  if (!containment) return { valid: false, reason: "controller-record-path-escape" };
  try {
    if (!containment.inspectComponents() || !fs.existsSync(containment.destination) || fs.lstatSync(containment.destination).isSymbolicLink()) {
      return { valid: false, reason: "controller-record-unavailable" };
    }
    const durable = safeJson(fs, containment.destination);
    if (!durable || !validRunId(durable.runId)) return { valid: false, reason: "controller-record-invalid" };
    if (!allowRetirementEvidence) {
      const retirementEvidence = readControllerRetirementEvidence({ stateRoot: state.stateRoot, controller: durable });
      if (retirementEvidence.present) {
        return { valid: false, reason: retirementEvidence.valid && retirementEvidence.state === "retired"
          ? "controller-record-retired"
          : retirementEvidence.valid ? "controller-retirement-in-progress" : retirementEvidence.reason };
      }
    }
    return { valid: true, record: durable, path: containment.destination };
  } catch { return { valid: false, reason: "controller-record-unavailable" }; }
}

export function persistControllerRecord({ repositoryPath, record, expectedRecordDigest, runGit } = {}) {
  if (!text(repositoryPath) || !validRunId(record?.runId) || record?.checkpointPath !== checkpointForRun(record.runId) || path.isAbsolute(record.checkpointPath) ||
      (expectedRecordDigest !== undefined && !digest(expectedRecordDigest))) {
    return { valid: false, reason: "controller-record-path-invalid" };
  }
  const state = resolveControllerStateRoot({ repositoryPath, runGit });
  if (!state.valid) return state;
  const retirementEvidence = readControllerRetirementEvidence({ stateRoot: state.stateRoot, controller: record });
  if (retirementEvidence.present) return { valid: false, reason: retirementEvidence.valid && retirementEvidence.state === "retired"
    ? "controller-record-retired" : retirementEvidence.valid ? "controller-retirement-in-progress" : retirementEvidence.reason };
  try {
    fs.mkdirSync(state.stateRoot, { recursive: true, mode: 0o700 });
    if (fs.lstatSync(state.stateRoot).isSymbolicLink()) return { valid: false, reason: "controller-state-root-symlink" };
  } catch {
    return { valid: false, reason: "controller-state-root-unavailable" };
  }
  const containment = safeContainedDestination(state.stateRoot, record.checkpointPath);
  if (!containment) return { valid: false, reason: "controller-record-path-escape" };
  const { root, destination, inspectComponents } = containment;
  const directory = path.dirname(destination);
  const temporary = path.join(directory, `.${path.basename(destination)}.${process.pid}.${crypto.randomUUID()}.tmp`);
  const lock = path.join(directory, `.${path.basename(destination)}.lock`);
  let lockHandle;
  try {
    fs.mkdirSync(directory, { recursive: true });
    if (!inspectComponents() || fs.realpathSync(directory) === root || !fs.realpathSync(directory).startsWith(`${root}${path.sep}`)) return { valid: false, reason: "controller-record-path-symlink" };
    lockHandle = acquireControllerRecordLock(lock);
    if (lockHandle === undefined) return { valid: false, reason: "controller-record-lock-unavailable" };
    const lockedRetirementEvidence = readControllerRetirementEvidence({ stateRoot: state.stateRoot, controller: record });
    if (lockedRetirementEvidence.present) return { valid: false, reason: lockedRetirementEvidence.valid && lockedRetirementEvidence.state === "retired"
      ? "controller-record-retired" : lockedRetirementEvidence.valid ? "controller-retirement-in-progress" : lockedRetirementEvidence.reason };
    if (fs.existsSync(destination)) {
      const existing = JSON.parse(fs.readFileSync(destination, "utf8"));
      if (existing?.runId !== record.runId) return { valid: false, reason: "controller-record-run-conflict" };
      if (expectedRecordDigest === undefined && digestValue(existing) !== digestValue(record)) return { valid: false, reason: "controller-record-expected-digest-required" };
      if (expectedRecordDigest !== undefined && digestValue(existing) !== expectedRecordDigest) return { valid: false, reason: "controller-record-stale" };
    }
    const descriptor = fs.openSync(temporary, "wx", 0o600);
    try {
      fs.writeFileSync(descriptor, `${JSON.stringify(record, null, 2)}\n`);
      fs.fsyncSync(descriptor);
    } finally {
      fs.closeSync(descriptor);
    }
    fs.renameSync(temporary, destination);
    // Node cannot open directories for fsync on Windows. The admitted provider
    // owns directory-metadata durability there; retain the explicit fsync on
    // POSIX hosts where Node exposes it.
    if (process.platform !== "win32") {
      const directoryDescriptor = fs.openSync(directory, "r");
      try {
        fs.fsyncSync(directoryDescriptor);
      } finally {
        fs.closeSync(directoryDescriptor);
      }
    }
    return { valid: true, path: destination };
  } catch {
    try { fs.unlinkSync(temporary); } catch {}
    return { valid: false, reason: "controller-record-persist-failed" };
  } finally {
    if (lockHandle !== undefined) {
      try { fs.closeSync(lockHandle.descriptor); } catch {}
      try { fs.unlinkSync(lock); } catch {}
      try { fs.unlinkSync(lockHandle.ownerPath); } catch {}
    }
  }
}

function controllerLockOwner(ownerPath) {
  return { schemaVersion: 1, pid: process.pid, createdAt: new Date().toISOString(), ownerFile: path.basename(ownerPath) };
}

function deadControllerLockOwner(owner) {
  if (owner?.schemaVersion !== 1 || !Number.isInteger(owner.pid) || owner.pid <= 0 || !timestamp(owner.createdAt) || !text(owner.ownerFile)) return false;
  try {
    process.kill(owner.pid, 0);
    return false;
  } catch (error) {
    return error?.code === "ESRCH";
  }
}

function acquireControllerRecordLock(lock) {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const ownerPath = `${lock}.${process.pid}.${crypto.randomUUID()}.owner`;
    let descriptor;
    try {
      // Write and sync the owner record before atomically linking it into the
      // contended lock name. A crash can leave only an ignored owner file, not
      // an empty lock that would block recovery forever.
      descriptor = fs.openSync(ownerPath, "wx", 0o600);
      try {
        fs.writeFileSync(descriptor, `${JSON.stringify(controllerLockOwner(ownerPath))}\n`);
        fs.fsyncSync(descriptor);
      } catch {
        try { fs.closeSync(descriptor); } catch {}
        try { fs.unlinkSync(ownerPath); } catch {}
        return undefined;
      }
      fs.linkSync(ownerPath, lock);
      return { descriptor, ownerPath };
    } catch (error) {
      if (descriptor !== undefined) {
        try { fs.closeSync(descriptor); } catch {}
        try { fs.unlinkSync(ownerPath); } catch {}
      }
      if (error?.code !== "EEXIST" || attempt > 0) return undefined;
      let owner;
      try {
        const entry = fs.lstatSync(lock);
        if (!entry.isFile() || entry.isSymbolicLink()) return undefined;
        owner = safeJson(fs, lock);
      } catch { return undefined; }
      if (!deadControllerLockOwner(owner)) return undefined;
      try { fs.unlinkSync(lock); } catch { return undefined; }
    }
  }
  return undefined;
}

export function registerControllerLifecycleResource({ repositoryPath, record, resource, now, runGit } = {}) {
  return mutatePersistedControllerRecord({ repositoryPath, record, runGit,
    mutate: (durable) => registerControllerResource(durable, resource, { now })
  });
}

export function persistControllerIssueIntake({ repositoryPath, record, binding, now, runGit } = {}) {
  return mutatePersistedControllerRecord({ repositoryPath, record, runGit,
    mutate: (durable) => registerControllerIssueIntake(durable, binding, { now })
  });
}

export function persistControllerIssueIntakeEvidence({ repositoryPath, record, payloadDigest, issue, observedAt, reference, runGit } = {}) {
  return mutatePersistedControllerRecord({ repositoryPath, record, runGit,
    mutate: (durable) => bindControllerIssueIntake(durable, { payloadDigest, issue, observedAt, reference })
  });
}

export function persistControllerAuthContext({ repositoryPath, record, binding, now, runGit } = {}) {
  return mutatePersistedControllerRecord({ repositoryPath, record, runGit,
    mutate: (durable) => registerControllerAuthContext(durable, binding, { now })
  });
}

export function persistControllerAuthContextEvidence({ repositoryPath, record, bindingDigest, evidence, runGit } = {}) {
  return mutatePersistedControllerRecord({ repositoryPath, record, runGit,
    mutate: (durable) => bindControllerAuthContext(durable, { bindingDigest, evidence })
  });
}

export function bindControllerLifecycleDelivery({ repositoryPath, record, kind, id, deliveryEvidence, runGit } = {}) {
  return mutatePersistedControllerRecord({ repositoryPath, record, runGit,
    mutate: (durable) => bindControllerResourceDelivery(durable, { kind, id, deliveryEvidence })
  });
}

/** Attaches one independently signed legacy migration to one exact active bootstrap run. */
export function attachBootstrapCleanupMigration({ readableRepositoryName, attachmentBinding, migration, stateHome = defaultStateHome(), now = new Date().toISOString(), fileSystem = fs } = {}) {
  if (!text(readableRepositoryName) || !validBootstrapAttachmentBinding(attachmentBinding, now) || !migration || !timestamp(now)) {
    return { valid: false, classification: "paused", reason: "bootstrap-cleanup-attachment-input-invalid" };
  }
  const paths = statePaths({ stateHome, readableName: readableRepositoryName, repositoryId: attachmentBinding.repositoryId });
  const active = paths && path.join(paths.active, attachmentBinding.parentRunId);
  const parentRun = active && safeJson(fileSystem, path.join(active, "parent-run.json"));
  const workUnit = active && safeJson(fileSystem, path.join(active, "work-unit.json"));
  const claim = active && safeJson(fileSystem, path.join(active, "resource-claim.json"));
  if (!paths || !validateDomainRecord(parentRun).valid || !validateBootstrapPreSnapshotWorkUnit(workUnit) || !validateDomainRecord(claim).valid ||
      parentRun.parentRunId !== attachmentBinding.parentRunId || workUnit.workUnitId !== attachmentBinding.workUnitId || claim.claimId !== attachmentBinding.claimId ||
      claim.repositoryId !== attachmentBinding.repositoryId || workUnit.approvedChangeId !== attachmentBinding.approvedChangeId || claim.state !== "active") {
    return { valid: false, classification: "paused", reason: "bootstrap-cleanup-attachment-active-run-mismatch" };
  }
  const migrated = migrateLegacyWorkspaceResource({ ...migration, selectedEntry: attachmentBinding.approvedChangeId, repository: attachmentBinding.repository, now });
  if (!migrated.valid) return { valid: false, classification: "paused", reason: migrated.reason };
  const resource = { ...migrated.resource, registeredHeadCommit: migrated.resource.headCommit };
  if (!attachmentBinding.resources.some((binding) => binding.disposition === "migrate" && binding.kind === resource.kind &&
      binding.id === resource.id && binding.headCommit === resource.headCommit)) {
    return { valid: false, classification: "paused", reason: "bootstrap-cleanup-attachment-resource-unbound" };
  }
  const destination = attachmentPath(paths, attachmentBinding);
  const existing = safeJson(fileSystem, destination);
  const record = existing ?? { schemaVersion: 1, kind: "bootstrap-cleanup-attachment", binding: structuredClone(attachmentBinding), resources: [], receipts: [], retainedResources: [], createdAt: now, updatedAt: now };
  if (!validBootstrapAttachment(record, now) || JSON.stringify(canonical(record.binding)) !== JSON.stringify(canonical(attachmentBinding))) {
    return { valid: false, classification: "paused", reason: "bootstrap-cleanup-attachment-conflict" };
  }
  const dependentWorktree = resource.kind === "branch" && attachmentBinding.resources.find((binding) =>
    binding.disposition === "migrate" && binding.kind === "worktree" && binding.role === resource.role);
  if (dependentWorktree) {
    const worktree = record.resources.find((item) => item.kind === "worktree" && item.id === dependentWorktree.id);
    const receipt = worktree && record.receipts.filter((item) => item.kind === worktree.kind && item.id === worktree.id).at(-1);
    if (!receipt || !["completed", "already-completed"].includes(receipt.status)) {
      return { valid: false, classification: "paused", reason: "bootstrap-cleanup-branch-dependency-incomplete" };
    }
    if (!timestamp(migration?.ownerAuthorization?.reviewedAt) || Date.parse(migration.ownerAuthorization.reviewedAt) <= Date.parse(receipt.at)) {
      return { valid: false, classification: "paused", reason: "bootstrap-cleanup-branch-migration-not-fresh" };
    }
  }
  if (record.resources.some((existingResource) => existingResource.kind === resource.kind && existingResource.id === resource.id)) {
    return { valid: false, classification: "paused", reason: "bootstrap-cleanup-attachment-duplicate" };
  }
  record.resources.push(resource);
  record.updatedAt = now;
  const persisted = writeAttachment(destination, record, fileSystem);
  return persisted.valid ? { valid: true, classification: "attached", record, path: destination, resource } : { valid: false, classification: "failed", reason: persisted.reason };
}

/** Records an exact unsafe resource that the repair binding names for retention. */
export function retainBootstrapCleanupResource({ readableRepositoryName, attachmentBinding, retention, stateHome = defaultStateHome(), now = new Date().toISOString(), fileSystem = fs } = {}) {
  if (!text(readableRepositoryName) || !validBootstrapAttachmentBinding(attachmentBinding, now) || !retention || !timestamp(now)) {
    return { valid: false, classification: "paused", reason: "bootstrap-cleanup-retention-input-invalid" };
  }
  const bound = attachmentBinding.resources.find((resource) => resource.disposition === "retain" && resource.kind === retention.kind &&
    resource.id === retention.id && resource.headCommit === retention.headCommit);
  if (!bound || !text(retention.reason)) return { valid: false, classification: "paused", reason: "bootstrap-cleanup-retention-resource-unbound" };
  const paths = statePaths({ stateHome, readableName: readableRepositoryName, repositoryId: attachmentBinding.repositoryId });
  const active = paths && path.join(paths.active, attachmentBinding.parentRunId);
  const parentRun = active && safeJson(fileSystem, path.join(active, "parent-run.json"));
  const workUnit = active && safeJson(fileSystem, path.join(active, "work-unit.json"));
  const claim = active && safeJson(fileSystem, path.join(active, "resource-claim.json"));
  if (!paths || !validateDomainRecord(parentRun).valid || !validateBootstrapPreSnapshotWorkUnit(workUnit) || !validateDomainRecord(claim).valid ||
      parentRun.parentRunId !== attachmentBinding.parentRunId || workUnit.workUnitId !== attachmentBinding.workUnitId || claim.claimId !== attachmentBinding.claimId ||
      claim.repositoryId !== attachmentBinding.repositoryId || workUnit.approvedChangeId !== attachmentBinding.approvedChangeId || claim.state !== "active") {
    return { valid: false, classification: "paused", reason: "bootstrap-cleanup-retention-active-run-mismatch" };
  }
  const destination = attachmentPath(paths, attachmentBinding);
  const existing = safeJson(fileSystem, destination);
  const record = existing ?? { schemaVersion: 1, kind: "bootstrap-cleanup-attachment", binding: structuredClone(attachmentBinding), resources: [], receipts: [], retainedResources: [], createdAt: now, updatedAt: now };
  if (!validBootstrapAttachment(record, now) || JSON.stringify(canonical(record.binding)) !== JSON.stringify(canonical(attachmentBinding))) {
    return { valid: false, classification: "paused", reason: "bootstrap-cleanup-retention-conflict" };
  }
  if (record.retainedResources.some((resource) => resource.kind === retention.kind && resource.id === retention.id)) {
    return { valid: false, classification: "paused", reason: "bootstrap-cleanup-retention-duplicate" };
  }
  const retained = { kind: retention.kind, id: retention.id, headCommit: retention.headCommit, reason: retention.reason, recordedAt: now };
  record.retainedResources.push(retained);
  record.updatedAt = now;
  const persisted = writeAttachment(destination, record, fileSystem);
  return persisted.valid ? { valid: true, classification: "retained", record, path: destination, retained } : { valid: false, classification: "failed", reason: persisted.reason };
}

export function executeBootstrapCleanupAttachment({ readableRepositoryName, attachmentBinding, cleanupContext, operations = {}, stateHome = defaultStateHome(), now = new Date().toISOString(), fileSystem = fs } = {}) {
  if (!text(readableRepositoryName) || !validBootstrapAttachmentBinding(attachmentBinding, now) || typeof operations.inspectResource !== "function") {
    return { classification: "paused", reason: "bootstrap-cleanup-attachment-input-invalid", outcomes: [] };
  }
  const paths = statePaths({ stateHome, readableName: readableRepositoryName, repositoryId: attachmentBinding.repositoryId });
  const destination = paths && attachmentPath(paths, attachmentBinding);
  const record = destination && safeJson(fileSystem, destination);
  if (!record || !validBootstrapAttachment(record, now) || JSON.stringify(canonical(record.binding)) !== JSON.stringify(canonical(attachmentBinding))) {
    return { classification: "paused", reason: "bootstrap-cleanup-attachment-unavailable", outcomes: [] };
  }
  let resources;
  try { resources = record.resources.map((resource) => operations.inspectResource(resource)); }
  catch { return { classification: "paused", reason: "bootstrap-cleanup-attachment-fresh-inspection-failed", outcomes: [] }; }
  const plan = planWorkspaceCleanup({ ...cleanupContext, selectedEntry: attachmentBinding.approvedChangeId, repository: attachmentBinding.repository, resources });
  if (plan.classification !== "planned" || plan.resources.some((entry) => entry.classification !== "eligible")) {
    if (plan.classification === "planned") {
      for (const entry of plan.resources.filter((item) => item.classification !== "eligible")) {
        const resource = record.resources.find((item) => item.id === entry.id);
        if (resource) record.receipts.push({ kind: resource.kind, id: resource.id, status: "blocked", at: now });
      }
      record.updatedAt = now;
      writeAttachment(destination, record, fileSystem);
    }
    return { classification: "paused", reason: "bootstrap-cleanup-attachment-resource-ineligible", outcomes: [], plan };
  }
  const result = executeWorkspaceCleanup(plan, { ...operations, persistOutcome: (outcome) => {
    record.receipts.push({ kind: outcome.resource.kind, id: outcome.resource.id, status: outcome.status, at: now });
    record.updatedAt = now;
    return { persisted: writeAttachment(destination, record, fileSystem).valid };
  }});
  return { ...result, record, plan };
}

export function executeControllerLifecycleCleanup({ repositoryPath, record, cleanupContext, operations = {}, now = new Date().toISOString(), runGit } = {}) {
  if (!Array.isArray(record?.resourceRecords) || record.resourceRecords.length === 0) {
    return { classification: "paused", reason: "controller-cleanup-resources-missing", outcomes: [], record, plan: null };
  }
  if (typeof operations.inspectResource !== "function") {
    return { classification: "paused", reason: "controller-cleanup-fresh-inspection-missing", outcomes: [], record, plan: null };
  }
  let currentRecord = record;
  const inspect = (resources) => resources.map((resource) => {
    const inspected = operations.inspectResource(resource);
    if (!inspected || typeof inspected !== "object" || inspected.exists === false) return inspected;
    const { exists, ...eligibility } = inspected;
    return eligibility;
  });
  const executeStage = (resources) => {
    let inspectedResources;
    try { inspectedResources = inspect(resources); }
    catch { return { valid: false, reason: "controller-cleanup-fresh-inspection-failed", plan: null, outcomes: [] }; }
    const plan = planWorkspaceCleanup({ ...cleanupContext, selectedEntry: record?.selectedEntry, repository: record?.repository, resources: inspectedResources });
    if (plan.classification !== "planned" || plan.resources.some((resource) => resource.classification !== "eligible")) {
      return { valid: false, reason: "controller-cleanup-resource-ineligible", plan, outcomes: [] };
    }
    const result = executeWorkspaceCleanup(plan, {
      ...operations,
      persistOutcome: (outcome) => {
        const persisted = persistControllerCleanupReceipt({ repositoryPath, record: currentRecord, receipt: { kind: outcome.resource?.kind, id: outcome.resource?.id, status: outcome.status }, now, runGit });
        if (!persisted.valid) return { persisted: false };
        currentRecord = persisted.record;
        return { persisted: true, path: persisted.path };
      }
    });
    return { valid: result.classification === "completed", result, plan, outcomes: result.outcomes };
  };
  const worktrees = record.resourceRecords.filter((resource) => resource.kind === "worktree");
  const branches = record.resourceRecords.filter((resource) => resource.kind === "branch");
  const outcomes = [];
  const plans = {};
  if (worktrees.length) {
    const worktreeStage = executeStage(worktrees);
    plans.worktrees = worktreeStage.plan;
    outcomes.push(...worktreeStage.outcomes);
    if (!worktreeStage.valid) return { classification: outcomes.length ? "partial" : "paused", reason: worktreeStage.reason ?? "cleanup-apply-incomplete", outcomes, record: currentRecord, plan: plans };
  }
  if (branches.length) {
    const branchStage = executeStage(branches);
    plans.branches = branchStage.plan;
    outcomes.push(...branchStage.outcomes);
    if (!branchStage.valid) return { classification: outcomes.length ? "partial" : "paused", reason: branchStage.reason ?? "cleanup-apply-incomplete", outcomes, record: currentRecord, plan: plans };
  }
  return { classification: "completed", reason: "cleanup-apply-complete", outcomes, record: currentRecord, plan: plans };
}
