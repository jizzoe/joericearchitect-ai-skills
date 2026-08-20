import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { deriveRepositoryId, digestValue, normalizeCanonicalRemote, RUN_CONTRACT_VERSION, validateDomainRecord } from "./autonomous-sdd-run-contract.mjs";
import { inventoryLegacyDirectory, inventoryLegacyRecords } from "./autonomous-sdd-legacy.mjs";
import { createRepositoryClaim, defaultStateHome, ensureStateLayout, publishImmutableRecord, rebuildRepositoryIndex, statePaths, validateProviderCapabilities } from "./autonomous-sdd-local-store.mjs";

const text = (value) => typeof value === "string" && value.trim().length > 0;
const identifier = /^[a-z0-9][a-z0-9-]{2,127}$/i;
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

/** Persist parent, selected work unit, and initial generation-one claim before any lifecycle phase. */
export function admitV2Run({ authorization, canonicalRemote, readableRepositoryName, historyBinding, provider, owner, stateHome, legacyRecords = [], legacyDirectory, parentRunId = crypto.randomUUID(), workUnitId = crypto.randomUUID(), claimId = crypto.randomUUID(), now = new Date().toISOString(), fileSystem = fs } = {}) {
  const selectedEntry = validateAuthorization(authorization, now);
  const canonicalRemoteIdentity = normalizeCanonicalRemote(canonicalRemote);
  const repositoryId = deriveRepositoryId(canonicalRemote);
  if (!selectedEntry) return fail("v2-admission-authorization-invalid-or-expired");
  if (!canonicalRemoteIdentity || !repositoryId || !identifier.test(readableRepositoryName ?? "") || !binding(historyBinding) || !provider || !owner || !identifier.test(parentRunId) || !identifier.test(workUnitId) || !identifier.test(claimId)) return fail("v2-admission-input-invalid");
  const providerCapability = validateProviderCapabilities(provider);
  if (!providerCapability.valid) return fail(providerCapability.reason);
  const providerBinding = { id: provider.id, digest: digestValue(providerCapability.provider) };
  const suppliedLegacy = inventoryLegacyRecords(legacyRecords);
  const discoveredLegacy = legacyDirectory === undefined ? inventoryLegacyRecords([]) : inventoryLegacyDirectory(legacyDirectory, { fileSystem });
  if (!suppliedLegacy.valid || !discoveredLegacy.valid) return fail(!suppliedLegacy.valid ? suppliedLegacy.reason : discoveredLegacy.reason);
  const legacyEntries = [...suppliedLegacy.entries, ...discoveredLegacy.entries];
  const legacy = {
    valid: true,
    entries: legacyEntries,
    classification: legacyEntries.some((entry) => entry.classification === "ambiguous") ? "ambiguous" : legacyEntries.some((entry) => entry.classification === "active-legacy") ? "active-legacy" : "compatible"
  };
  if (legacy.classification === "ambiguous") return fail("legacy-inventory-ambiguous", { legacy });
  if (legacy.classification === "active-legacy") return fail("legacy-authority-active", { legacy });
  const resolvedStateHome = stateHome ?? defaultStateHome();
  const inspection = inspectV2Admission({ stateHome: resolvedStateHome, readableRepositoryName, repositoryId, authorization, providerBinding, parentRunId, now, fileSystem });
  if (!inspection.valid) return inspection;
  if (inspection.classification === "resumed") return { ...inspection, canonicalRemoteIdentity, repositoryId, providerBinding, selectedEntry };
  const layout = ensureStateLayout({ stateHome: resolvedStateHome, readableName: readableRepositoryName, repositoryId }, { fileSystem });
  if (!layout.valid) return layout;
  const authorizationDigest = digestValue(authorization);
  const parentRun = { kind: "parent-run", schemaVersion: RUN_CONTRACT_VERSION, parentRunId, approvedIntentDigest: authorizationDigest, deadline: authorization.expiresAt, historyBinding, claimProviderBinding: providerBinding, children: [] };
  const workUnit = { kind: "work-unit", schemaVersion: RUN_CONTRACT_VERSION, workUnitId, parentRunId, ordinal: 1, approvedChangeId: selectedEntry, authorizationDigest, configurationDigest: digestValue({ canonicalRemoteIdentity, repositoryId, historyBinding, providerBinding }), lifecycleState: "admitted", evidenceNamespace: `evidence-${workUnitId}`, historyBinding, claimProviderBinding: providerBinding };
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
    fileSystem.renameSync(staging, active);
    const index = rebuildRepositoryIndex({ paths: layout.paths, parentRunId, archivePath: active, state: "active", fileSystem });
    if (!index.valid) return fail(index.reason, { paths: layout.paths, parentRun, workUnit, claim: claimed.record });
    return { valid: true, classification: "admitted", paths: layout.paths, canonicalRemoteIdentity, repositoryId, providerBinding, selectedEntry, parentRun, workUnit, claim: claimed.record, index };
  } catch (error) {
    try { fileSystem.rmSync(staging, { recursive: true, force: true }); } catch { /* preserve no partial active admission */ }
    return fail("v2-admission-persist-failed", { detail: error instanceof Error ? error.message : "unknown" });
  }
}
