import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { deriveRepositoryId, digestValue, normalizeCanonicalRemote, RUN_CONTRACT_VERSION, validateDomainRecord } from "./autonomous-sdd-run-contract.mjs";
import { inventoryLegacyDirectory, inventoryLegacyRecords } from "./autonomous-sdd-legacy.mjs";
import { inventoryLegacyReconciliationReceipts, legacyRecordDigest } from "./autonomous-sdd-legacy-reconciliation.mjs";
import { inventoryPendingRetirementReceipts } from "./autonomous-sdd-pending-retirement.mjs";
import { createRepositoryClaim, defaultStateHome, ensureStateLayout, publishImmutableRecord, rebuildRepositoryIndex, statePaths, validateProviderCapabilities } from "./autonomous-sdd-local-store.mjs";
import { digestOperationContract, normalizeAgentPolicy } from "./autonomous-sdd-operation-contract.mjs";
import { loadRuntimeConfiguration, resolveRuntimeConfiguration } from "./runtime-configuration.mjs";
import {
  readControllerRetirementEvidence,
  validControllerRetirementMarker,
  validControllerTerminalMarker
} from "./autonomous-sdd-controller-retirement.mjs";

const text = (value) => typeof value === "string" && value.trim().length > 0;
const identifier = /^[a-z0-9][a-z0-9-]{2,127}$/i;
const sha256 = /^[0-9a-f]{64}$/i;
const controllerPhases = Object.freeze(["propose", "planning-review", "apply", "verify", "delivery", "sync", "archive", "cleanup"]);
const timestamp = (value) => typeof value === "string" && !Number.isNaN(Date.parse(value));
const binding = (value) => value && typeof value === "object" && text(value.id) && /^[0-9a-f]{64}$/i.test(value.digest ?? "");
const fail = (reason, extra = {}) => ({ ...extra, valid: false, reason, classification: "paused" });

function validateAuthorization(authorization, now) {
  const entries = authorization?.target?.entries;
  if (authorization?.mode !== "autonomous" || authorization?.authorizationProfile !== "sdd-delivery" ||
      !Array.isArray(entries) || entries.length !== 1 || !identifier.test(entries[0]) || !text(authorization?.expiresAt)) return null;
  if (Number.isNaN(Date.parse(authorization.expiresAt)) || Date.parse(authorization.expiresAt) <= Date.parse(now)) return null;
  return entries[0];
}

function readAdmission(directory, { fileSystem = fs } = {}) {
  try {
    const parentRun = JSON.parse(fileSystem.readFileSync(path.join(directory, "parent-run.json"), "utf8"));
    const workUnit = JSON.parse(fileSystem.readFileSync(path.join(directory, "work-unit.json"), "utf8"));
    const claim = JSON.parse(fileSystem.readFileSync(path.join(directory, "resource-claim.json"), "utf8"));
    return validateDomainRecord(parentRun).valid && validateDomainRecord(workUnit).valid && validateDomainRecord(claim).valid
      ? { valid: true, parentRun, workUnit, claim } : fail("v2-admission-record-invalid");
  } catch { return fail("v2-admission-record-unreadable"); }
}

function foreignActiveIdentity({ stateHome, readableRepositoryName, repositoryPath, fileSystem = fs }) {
  try {
    const root = path.join(stateHome, "repositories");
    if (!fileSystem.existsSync(root)) return { valid: true, active: false };
    const prefix = `${readableRepositoryName}--`;
    for (const entry of fileSystem.readdirSync(root, { withFileTypes: true })) {
      if (!entry.isDirectory() || !entry.name.startsWith(prefix)) continue;
      const candidate = path.join(root, entry.name);
      if (candidate === repositoryPath) continue;
      const active = path.join(candidate, "active");
      if (fileSystem.existsSync(active) && fileSystem.readdirSync(active, { withFileTypes: true }).some((child) => child.isDirectory() && !child.name.startsWith("."))) {
        return { valid: true, active: true, repositoryPath: candidate };
      }
    }
    return { valid: true, active: false };
  } catch { return fail("v2-admission-identity-inspection-unavailable"); }
}

function safeJson(target, fileSystem = fs) {
  try { return JSON.parse(fileSystem.readFileSync(target, "utf8")); } catch { return null; }
}

function terminalSummaryDigest(summary) {
  if (!summary || typeof summary !== "object" || Array.isArray(summary)) return null;
  const value = { ...summary };
  delete value.terminalSummaryDigest;
  return digestValue(value);
}

function archiveMatchesFor(paths, parentRunId, fileSystem = fs) {
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

function validTerminalV2Controller(controller, { repository, repositoryId, paths, legacyDirectory, fileSystem = fs } = {}) {
  if (!controller || controller.schemaVersion !== 5 || !identifier.test(controller.runId ?? "") || !text(repository) || controller.repository !== repository ||
      !Array.isArray(controller.steps) || controller.steps.length !== controllerPhases.length ||
      controller.steps.some((step, index) => step?.id !== controllerPhases[index]) ||
      controller.v2Admission?.state !== "admitted" || controller.v2Admission.repositoryId !== repositoryId ||
      !identifier.test(controller.v2Admission?.parentRunId ?? "") || !identifier.test(controller.v2Admission?.workUnitId ?? "") ||
      !identifier.test(controller.v2Admission?.claimId ?? "") || !timestamp(controller.v2Admission?.admittedAt) ||
      !sha256.test(controller.authorizationDigest ?? "") || !identifier.test(controller.selectedEntry ?? "") || !timestamp(controller.expiresAt)) return false;
  if (controller.runId !== `controller-${controller.authorizationDigest.slice(0, 32)}`) return false;
  if (controller.checkpointPath !== path.posix.join("runs", controller.runId, "controller.json") ||
      JSON.stringify(controller.allowedLifecycleChain) !== JSON.stringify(controllerPhases)) return false;
  const admission = controller.v2Admission;
  const archives = archiveMatchesFor(paths, admission.parentRunId, fileSystem);
  if (archives.length !== 1 || fileSystem.existsSync(path.join(paths.active, admission.parentRunId))) return false;
  const archive = archives[0];
  const records = Object.fromEntries([
    "parent-run", "work-unit", "resource-claim", "terminalization-receipt", "cancellation-receipt", "claim-release", "projection", "archive-manifest"
  ].map((name) => [name, safeJson(path.join(archive, `${name}.json`), fileSystem)]));
  const present = Object.fromEntries(Object.entries(records).filter(([, record]) => record != null));
  const validations = Object.fromEntries(Object.entries(present).map(([name, record]) => [name, validateDomainRecord(record)]));
  if (Object.values(validations).some((validation) => !validation.valid)) return false;
  const parent = present["parent-run"];
  const workUnit = present["work-unit"];
  const claim = present["resource-claim"];
  const terminalizationReceipt = present["terminalization-receipt"];
  const cancellationReceipt = present["cancellation-receipt"];
  const release = present["claim-release"];
  const projection = present.projection;
  const manifest = present["archive-manifest"];
  const terminalized = terminalizationReceipt != null;
  const cancelled = cancellationReceipt != null;
  if (terminalized === cancelled) return false;
  if (terminalized && (controller.currentPhase !== null || controller.steps.some((step) => step?.status !== "complete" || step?.evidence?.current !== true))) return false;
  if (cancelled && (cancellationReceipt.controllerRunId !== controller.runId || cancellationReceipt.expiresAt !== controller.expiresAt)) return false;
  const receipt = terminalized ? terminalizationReceipt : cancellationReceipt;
  const summary = terminalized ? terminalizationReceipt.terminalSummary : projection.children[0];
  const sameProvider = (bindingValue) => bindingValue?.id === admission.providerBinding?.id && bindingValue?.digest === admission.providerBinding?.digest;
  const receiptDigest = validations[terminalized ? "terminalization-receipt" : "cancellation-receipt"].digest;
  const releaseReceiptDigest = terminalized ? release.terminalizationReceiptDigest : release.cancellationReceiptDigest;
  const checks = {
    authorization: controller.authorizationDigest === parent.approvedIntentDigest && controller.authorizationDigest === workUnit.authorizationDigest,
    deadline: controller.expiresAt === parent.deadline,
    parent: admission.parentRunId === parent.parentRunId,
    workUnit: admission.workUnitId === workUnit.workUnitId && workUnit.parentRunId === parent.parentRunId && workUnit.lifecycleState === "admitted",
    claim: admission.claimId === claim.claimId && claim.workUnitId === workUnit.workUnitId && claim.repositoryId === repositoryId && claim.state === "active",
    change: workUnit.approvedChangeId === controller.selectedEntry && receipt.approvedChangeId === controller.selectedEntry,
    receipt: receipt.parentRunId === parent.parentRunId && receipt.workUnitId === workUnit.workUnitId && receipt.claimId === claim.claimId && receipt.repositoryId === repositoryId,
    release: release.claimId === claim.claimId && release.workUnitId === workUnit.workUnitId && release.repositoryId === repositoryId && release.disposition === "released" && releaseReceiptDigest === receiptDigest,
    provider: sameProvider(parent.claimProviderBinding) && sameProvider(workUnit.claimProviderBinding) && sameProvider(claim.providerBinding),
    projection: projection.parentRunId === parent.parentRunId && projection.children.length === 1 && digestValue(projection.children[0]) === digestValue(summary),
    manifest: manifest.parentRunId === parent.parentRunId && manifest.projectionDigest === validations.projection.digest &&
      manifest.reason === summary.terminalReason && manifest.archivedAt === receipt.createdAt && manifest.archivedAt === release.releasedAt,
    summary: summary.workUnitId === workUnit.workUnitId && summary.approvedChangeId === controller.selectedEntry &&
      summary.claimDisposition === "released" && summary.terminalSummaryDigest === terminalSummaryDigest(summary) &&
      (terminalized ? summary.terminalStatus === "complete" && summary.cleanupDisposition === "completed" : summary.terminalStatus === "cancelled" && summary.cleanupDisposition === "cancelled")
  };
  if (!Object.values(checks).every(Boolean)) return false;
  if (cancelled && summary.terminalReason === "owner-authorized-blocked-controller") {
    const retirementEvidence = readControllerRetirementEvidence({ stateRoot: legacyDirectory, controller, fileSystem });
    return retirementEvidence.valid && retirementEvidence.state === "retired" &&
      validControllerRetirementMarker(retirementEvidence.retirementMarker, { controller, cancellationReceipt }) &&
      validControllerTerminalMarker(retirementEvidence.terminalMarker, {
        controller,
        retirementMarker: retirementEvidence.retirementMarker,
        cancellationReceipt,
        archiveManifest: manifest
      });
  }
  return true;
}

function verifiedTerminalV2Controllers({ legacyDirectory, repository, stateHome, readableRepositoryName, repositoryId, fileSystem = fs } = {}) {
  if (!text(legacyDirectory) || !text(repository)) return [];
  const paths = statePaths({ stateHome, readableName: readableRepositoryName, repositoryId });
  if (!paths) return [];
  const verified = [];
  try {
    const walk = (current) => {
      for (const entry of fileSystem.readdirSync(current, { withFileTypes: true })) {
        const target = path.join(current, entry.name);
        if (entry.isDirectory()) walk(target);
        else if (entry.isFile() && entry.name === "controller.json") {
          const content = fileSystem.readFileSync(target, "utf8");
          let controller;
          try { controller = JSON.parse(content); } catch { continue; }
          const expectedReference = path.resolve(legacyDirectory, controller?.checkpointPath ?? "invalid");
          if (expectedReference === path.resolve(target) && validTerminalV2Controller(controller, { repository, repositoryId, paths, legacyDirectory, fileSystem })) {
            verified.push({ reference: target, recordDigest: legacyRecordDigest(content), runId: controller.runId,
              selectedEntry: controller.selectedEntry, repository: controller.repository });
          }
        }
      }
    };
    if (fileSystem.existsSync(legacyDirectory)) walk(legacyDirectory);
  } catch { return []; }
  return verified;
}

function applyVerifiedTerminalV2Controllers(inventory, verified, fileSystem = fs) {
  if (!inventory?.valid || !Array.isArray(inventory.entries) || !Array.isArray(verified) || verified.length === 0) return inventory;
  const entries = inventory.entries.map((entry) => {
    const match = verified.find((candidate) => candidate.reference === entry.reference);
    if (!match) return entry;
    let currentDigest;
    try { currentDigest = legacyRecordDigest(fileSystem.readFileSync(entry.reference, "utf8")); } catch { return entry; }
    return currentDigest === match.recordDigest
      ? { reference: entry.reference, classification: "compatible-terminal", reason: "v2-controller-terminal-evidence-verified",
        runId: match.runId, selectedEntry: match.selectedEntry, repository: match.repository }
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

export function inspectV2Admission({ stateHome, readableRepositoryName, repositoryId, authorization, providerBinding, parentRunId, now = new Date().toISOString(), fileSystem = fs } = {}) {
  const selectedEntry = validateAuthorization(authorization, now);
  if (!selectedEntry || !identifier.test(readableRepositoryName ?? "") || !/^r1-[0-9a-f]{64}$/i.test(repositoryId ?? "") || !binding(providerBinding)) return fail("v2-inspection-input-invalid");
  const paths = statePaths({ stateHome: stateHome ?? defaultStateHome(), readableName: readableRepositoryName, repositoryId });
  if (!paths) return fail("v2-inspection-input-invalid");
  try {
    const foreign = foreignActiveIdentity({ stateHome: stateHome ?? defaultStateHome(), readableRepositoryName, repositoryPath: paths.repository, fileSystem });
    if (!foreign.valid) return { ...foreign, paths };
    if (foreign.active) return fail("repository-identity-conflict", { paths, activeRepositoryPath: foreign.repositoryPath });
    if (!fileSystem.existsSync(paths.active)) return { valid: true, classification: "no-active-v2-admission", paths };
    const runs = fileSystem.readdirSync(paths.active, { withFileTypes: true }).filter((entry) => entry.isDirectory());
    if (!runs.length) return { valid: true, classification: "no-active-v2-admission", paths };
    if (runs.length !== 1) return fail("v2-admission-ambiguous-active-runs", { paths });
    const loaded = readAdmission(path.join(paths.active, runs[0].name), { fileSystem });
    if (!loaded.valid) return { ...loaded, paths };
    const authorizationDigest = digestValue(authorization);
    const exact = (parentRunId === undefined || loaded.parentRun.parentRunId === parentRunId) && loaded.parentRun.approvedIntentDigest === authorizationDigest && loaded.workUnit.approvedChangeId === selectedEntry &&
      loaded.workUnit.authorizationDigest === authorizationDigest && loaded.parentRun.claimProviderBinding.id === providerBinding.id &&
      loaded.parentRun.claimProviderBinding.digest === providerBinding.digest && loaded.parentRun.deadline === authorization.expiresAt &&
      loaded.claim.repositoryId === repositoryId && loaded.claim.state === "active";
    return exact
      ? { valid: true, classification: "resumed", paths, ...loaded }
      : fail("v2-admission-immutable-conflict", { paths, ...loaded });
  } catch { return fail("v2-admission-inspection-unavailable", { paths }); }
}

function admitV2RunInternal({ authorization, repository, canonicalRemote, readableRepositoryName, historyBinding, provider, owner, repositoryPath, runtimeConfiguration, stateHome, legacyRecords = [], legacyDirectory, parentRunId = crypto.randomUUID(), workUnitId = crypto.randomUUID(), claimId = crypto.randomUUID(), now = new Date().toISOString(), fileSystem = fs } = {}, legacyInventoryExclusions = []) {
  const selectedEntry = validateAuthorization(authorization, now);
  const canonicalRemoteIdentity = normalizeCanonicalRemote(canonicalRemote);
  const repositoryId = deriveRepositoryId(canonicalRemote);
  if (!selectedEntry) return fail("v2-admission-authorization-invalid-or-expired");
  if (!canonicalRemoteIdentity || !repositoryId || !identifier.test(readableRepositoryName ?? "") || !binding(historyBinding) || !provider || !owner || !identifier.test(parentRunId) || !identifier.test(workUnitId) || !identifier.test(claimId)) return fail("v2-admission-input-invalid");
  const providerCapability = validateProviderCapabilities(provider);
  if (!providerCapability.valid) return fail(providerCapability.reason);
  const resolvedConfiguration = repositoryPath ? loadRuntimeConfiguration({ repositoryPath, sealed: runtimeConfiguration?.sealed, fileSystem }) : resolveRuntimeConfiguration(runtimeConfiguration);
  if (!resolvedConfiguration.valid) return fail(resolvedConfiguration.reason);
  const providerBinding = { id: provider.id, digest: digestValue(providerCapability.provider) };
  const resolvedStateHome = stateHome ?? defaultStateHome();
  const reconciliation = inventoryLegacyReconciliationReceipts({ stateHome: resolvedStateHome, readableRepositoryName, repositoryId, fileSystem });
  if (!reconciliation.valid) return fail(reconciliation.reason);
  const pendingRetirement = inventoryPendingRetirementReceipts({ stateHome: resolvedStateHome, readableRepositoryName, repositoryId, fileSystem });
  if (!pendingRetirement.valid) return fail(pendingRetirement.reason);
  const terminalV2Controllers = verifiedTerminalV2Controllers({ legacyDirectory, repository, stateHome: resolvedStateHome,
    readableRepositoryName, repositoryId, fileSystem });
  const suppliedLegacy = inventoryLegacyRecords(legacyRecords, {
    reconciliationReceipts: reconciliation.receipts, pendingRetirementReceipts: pendingRetirement.receipts, now
  });
  const discoveredInventory = legacyDirectory === undefined
    ? inventoryLegacyRecords([], { reconciliationReceipts: reconciliation.receipts, now })
    : inventoryLegacyDirectory(legacyDirectory, {
      fileSystem, reconciliationReceipts: reconciliation.receipts, pendingRetirementReceipts: pendingRetirement.receipts,
      excludedReferences: legacyInventoryExclusions, now
    });
  const discoveredLegacy = applyVerifiedTerminalV2Controllers(discoveredInventory, terminalV2Controllers, fileSystem);
  if (!suppliedLegacy.valid || !discoveredLegacy.valid) return fail(!suppliedLegacy.valid ? suppliedLegacy.reason : discoveredLegacy.reason);
  const legacyEntries = [...suppliedLegacy.entries, ...discoveredLegacy.entries];
  const legacy = {
    valid: true,
    entries: legacyEntries,
    classification: legacyEntries.some((entry) => entry.classification === "ambiguous") ? "ambiguous" : legacyEntries.some((entry) => entry.classification === "active-legacy") ? "active-legacy" : "compatible"
  };
  if (legacy.classification === "ambiguous") return fail("legacy-inventory-ambiguous", { legacy });
  if (legacy.classification === "active-legacy") return fail("legacy-authority-active", { legacy });
  const inspection = inspectV2Admission({ stateHome: resolvedStateHome, readableRepositoryName, repositoryId, authorization, providerBinding, parentRunId, now, fileSystem });
  if (!inspection.valid) return inspection;
  if (inspection.classification === "resumed") return { ...inspection, canonicalRemoteIdentity, repositoryId, providerBinding, selectedEntry };
  const layout = ensureStateLayout({ stateHome: resolvedStateHome, readableName: readableRepositoryName, repositoryId }, { fileSystem });
  if (!layout.valid) return layout;
  const authorizationDigest = digestValue(authorization);
  const topology = authorization.agentTopology ?? normalizeAgentPolicy(authorization.agentPolicy, authorization.agentSignals);
  if (!topology?.valid && topology?.policy === undefined) return fail("operation-contract-topology-invalid");
  const operationContract = {
    schemaVersion: 1,
    authorizationDigest,
    profile: authorization.qualityProfile,
    reviewPolicy: authorization.reviewPolicy,
    agentTopology: topology,
    compactStage: "admitted",
    digest: digestOperationContract({ authorizationDigest, profile: authorization.qualityProfile, reviewPolicy: authorization.reviewPolicy, agentTopology: topology, compactStage: "admitted" })
  };
  const parentRun = { kind: "parent-run", schemaVersion: RUN_CONTRACT_VERSION, parentRunId, approvedIntentDigest: authorizationDigest, deadline: authorization.expiresAt, historyBinding, claimProviderBinding: providerBinding, children: [] };
  const workUnit = { kind: "work-unit", schemaVersion: RUN_CONTRACT_VERSION, workUnitId, parentRunId, ordinal: 1, approvedChangeId: selectedEntry, authorizationDigest, configurationSnapshot: resolvedConfiguration.snapshot, configurationDigest: resolvedConfiguration.digest, lifecycleState: "admitted", evidenceNamespace: `evidence-${workUnitId}`, historyBinding, claimProviderBinding: providerBinding };
  const claimed = createRepositoryClaim({ claimId, repositoryId, workUnitId, owner, ownershipGeneration: 1, providerBinding, acquiredAt: now, recoveryEvidence: {} });
  if (!validateDomainRecord(parentRun).valid || !validateDomainRecord(workUnit).valid || !claimed.valid) return fail("v2-admission-record-invalid");
  const staging = path.join(layout.paths.active, `.${parentRunId}.${crypto.randomUUID()}.staging`);
  const active = path.join(layout.paths.active, parentRunId);
  try {
    if (fileSystem.existsSync(active)) return fail("v2-admission-immutable-conflict", { paths: layout.paths });
    fileSystem.mkdirSync(staging, { recursive: false, mode: 0o700 });
    for (const [name, record] of [["parent-run", parentRun], ["work-unit", workUnit], ["resource-claim", claimed.record]]) {
      const published = publishImmutableRecord({ directory: staging, name, record, provider: providerCapability.provider, fileSystem });
      if (!published.valid) throw new Error(published.reason);
    }
    fileSystem.writeFileSync(path.join(staging, "operation-contract.json"), `${JSON.stringify(operationContract)}\n`, { encoding: "utf8", mode: 0o600 });
    fileSystem.renameSync(staging, active);
    const index = rebuildRepositoryIndex({ paths: layout.paths, parentRunId, archivePath: active, state: "active", fileSystem });
    if (!index.valid) return fail(index.reason, { paths: layout.paths, parentRun, workUnit, claim: claimed.record });
    return { valid: true, classification: "admitted", paths: layout.paths, canonicalRemoteIdentity, repositoryId, providerBinding, selectedEntry, parentRun, workUnit, claim: claimed.record, operationContract, index };
  } catch (error) {
    try { fileSystem.rmSync(staging, { recursive: true, force: true }); } catch { /* preserve no partial active admission */ }
    return fail("v2-admission-persist-failed", { detail: error instanceof Error ? error.message : "unknown" });
  }
}

/** Persist parent, selected work unit, and initial generation-one claim before any lifecycle phase. */
export function admitV2Run(input = {}) {
  return admitV2RunInternal(input, []);
}

/** Admit only after proving the initializer's exclusion is its exact persisted schema-5 checkpoint. */
export function admitV2RunFromInitializer(input = {}, { checkpointPath, controllerRecord } = {}) {
  const fileSystem = input.fileSystem ?? fs;
  try {
    const approvedIntentDigest = digestValue(input.authorization);
    const expectedRunId = `controller-${approvedIntentDigest.slice(0, 32)}`;
    const providerCapability = validateProviderCapabilities(input.provider);
    if (!text(input.legacyDirectory) || !text(checkpointPath) || !controllerRecord || typeof controllerRecord !== "object" || Array.isArray(controllerRecord) ||
        controllerRecord.schemaVersion !== 5 || controllerRecord.runId !== expectedRunId ||
        controllerRecord.checkpointPath !== path.posix.join("runs", expectedRunId, "controller.json") ||
        controllerRecord.selectedEntry !== validateAuthorization(input.authorization, input.now) ||
        controllerRecord.authorizationDigest !== approvedIntentDigest || controllerRecord.repository !== input.repository ||
        !["pending", "admitted"].includes(controllerRecord.v2Admission?.state) || !providerCapability.valid ||
        controllerRecord.v2Admission?.repositoryId !== deriveRepositoryId(input.canonicalRemote) ||
        controllerRecord.v2Admission?.providerBinding?.id !== input.provider?.id ||
        controllerRecord.v2Admission?.providerBinding?.digest !== digestValue(providerCapability.provider) ||
        controllerRecord.v2Admission?.parentRunId !== input.parentRunId ||
        controllerRecord.v2Admission?.workUnitId !== input.workUnitId ||
        controllerRecord.v2Admission?.claimId !== input.claimId) return fail("initializer-admission-context-invalid");
    const canonical = (reference) => path.resolve(fileSystem.realpathSync(reference));
    const root = canonical(input.legacyDirectory);
    const exactCheckpoint = canonical(checkpointPath);
    const derivedCheckpoint = canonical(path.resolve(root, controllerRecord.checkpointPath));
    const relative = path.relative(root, exactCheckpoint);
    if (!relative || path.isAbsolute(relative) || relative === ".." || relative.startsWith(`..${path.sep}`) ||
        exactCheckpoint !== derivedCheckpoint || path.basename(exactCheckpoint) !== "controller.json") {
      return fail("initializer-admission-context-invalid");
    }
    const persisted = JSON.parse(fileSystem.readFileSync(exactCheckpoint, "utf8"));
    if (digestValue(persisted) !== digestValue(controllerRecord)) return fail("initializer-admission-context-invalid");
    return admitV2RunInternal(input, [exactCheckpoint]);
  } catch {
    return fail("initializer-admission-context-invalid");
  }
}
