import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { RUN_CONTRACT_VERSION, buildParentProjection, digestValue, serializeDomainRecord, validateDomainRecord } from "./autonomous-sdd-run-contract.mjs";

const text = (value) => typeof value === "string" && value.trim().length > 0;
const object = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const identifier = /^[a-z0-9][a-z0-9-]{2,127}$/i;
const repositoryId = /^r1-[0-9a-f]{64}$/i;
const timestamp = (value) => typeof value === "string" && !Number.isNaN(Date.parse(value));

function contained(root, candidate) {
  const resolvedRoot = path.resolve(root);
  const resolved = path.resolve(candidate);
  return resolved !== resolvedRoot && resolved.startsWith(`${resolvedRoot}${path.sep}`) ? resolved : null;
}

function fail(reason) { return { valid: false, reason }; }

export function defaultStateHome(environment = process.env, homeDirectory = os.homedir()) {
  const root = environment.XDG_STATE_HOME || path.join(homeDirectory, ".local", "state");
  return path.join(root, "ai-skills", "autonomous-sdd");
}

export function repositoryStatePath({ stateHome, readableName, repositoryId: id }) {
  if (!text(stateHome) || !identifier.test(readableName ?? "") || !repositoryId.test(id ?? "")) return null;
  const root = path.resolve(stateHome);
  return contained(root, path.join(root, "repositories", `${readableName}--${id.slice(3, 15)}`));
}

export function statePaths(input) {
  const repository = repositoryStatePath(input);
  if (!repository) return null;
  return Object.freeze({
    repository,
    metadata: path.join(repository, "repository.json"),
    lock: path.join(repository, "locks", "mutation.lock"),
    active: path.join(repository, "active"),
    archive: path.join(repository, "archive"),
    index: path.join(repository, "index")
  });
}

function repositoryMutationLockPath({ stateHome, repositoryId: id }) {
  if (!text(stateHome) || !repositoryId.test(id ?? "")) return null;
  const root = path.resolve(stateHome);
  return contained(root, path.join(root, "locks", `${id}.mutation.lock`));
}

function deadMutationLockOwner(owner) {
  if (owner?.schemaVersion !== 1 || !Number.isInteger(owner.pid) || owner.pid <= 0 || !timestamp(owner.createdAt)) return false;
  try { process.kill(owner.pid, 0); return false; } catch (error) { return error?.code === "ESRCH"; }
}

export function withRepositoryMutationLock({ stateHome, repositoryId: id, fileSystem = fs } = {}, operation) {
  const lock = repositoryMutationLockPath({ stateHome, repositoryId: id });
  if (!lock || typeof operation !== "function") return fail("repository-mutation-lock-input-invalid");
  const directory = path.dirname(lock);
  const reclaim = `${lock}.reclaim`;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const ownerPath = `${lock}.${process.pid}.${crypto.randomUUID()}.owner`;
    let descriptor;
    try {
      fileSystem.mkdirSync(directory, { recursive: true, mode: 0o700 });
      descriptor = fileSystem.openSync(ownerPath, "wx", 0o600);
      const owner = { schemaVersion: 1, pid: process.pid, createdAt: new Date().toISOString() };
      fileSystem.writeFileSync(descriptor, `${JSON.stringify(owner)}\n`, "utf8");
      fileSystem.fsyncSync(descriptor);
      fileSystem.linkSync(ownerPath, lock);
      try { return operation(); } finally {
        try { fileSystem.closeSync(descriptor); } catch {}
        try { fileSystem.unlinkSync(lock); } catch {}
        try { fileSystem.unlinkSync(ownerPath); } catch {}
      }
    } catch (error) {
      if (descriptor !== undefined) try { fileSystem.closeSync(descriptor); } catch {}
      try { fileSystem.unlinkSync(ownerPath); } catch {}
      if (error?.code !== "EEXIST" || attempt > 0) return fail("repository-mutation-lock-unavailable");
      let reclaimClaimed = false;
      try {
        // A fixed, create-only hard link elects exactly one stale-lock
        // reclaimer. Other contenders cannot unlink a replacement lock.
        fileSystem.linkSync(lock, reclaim);
        reclaimClaimed = true;
        const entry = fileSystem.lstatSync(reclaim);
        const current = fileSystem.lstatSync(lock);
        if (!entry.isFile() || entry.isSymbolicLink() || entry.dev !== current.dev || entry.ino !== current.ino) {
          return fail("repository-mutation-lock-unavailable");
        }
        const owner = JSON.parse(fileSystem.readFileSync(reclaim, "utf8"));
        if (!deadMutationLockOwner(owner)) return fail("repository-mutation-lock-unavailable");
        fileSystem.unlinkSync(lock);
      } catch { return fail("repository-mutation-lock-unavailable"); }
      finally { if (reclaimClaimed) try { fileSystem.unlinkSync(reclaim); } catch {} }
    }
  }
  return fail("repository-mutation-lock-unavailable");
}

export function ensureStateLayout(input, { fileSystem = fs } = {}) {
  const paths = statePaths(input);
  if (!paths) return fail("state-layout-input-invalid");
  try {
    for (const directory of [paths.repository, path.dirname(paths.lock), paths.active, paths.archive, paths.index]) fileSystem.mkdirSync(directory, { recursive: true, mode: 0o700 });
    return { valid: true, paths };
  } catch { return fail("state-layout-unavailable"); }
}

export function validateProviderCapabilities(provider) {
  if (!object(provider) || !text(provider.id) || provider.schemaVersion !== 1 || provider.generationFence !== true ||
      provider.explicitTakeover !== true || provider.durableWrite !== true || provider.directoryMetadataDurability !== true ||
      !object(provider.platforms) || provider.platforms.windows !== "LockFileEx" || provider.platforms.posix !== "advisory-lock") {
    return fail("claim-provider-capability-invalid");
  }
  return { valid: true, provider: Object.freeze({ ...provider, platforms: Object.freeze({ ...provider.platforms }) }) };
}

export function publishImmutableRecord({ directory, name, record, provider, fileSystem = fs }) {
  if (!text(directory) || !identifier.test(name ?? "") || !validateProviderCapabilities(provider).valid) return fail("record-publication-input-invalid");
  const serialized = serializeDomainRecord(record);
  if (!serialized.valid) return fail(serialized.reason);
  const destination = path.join(directory, `${name}.json`);
  const temporary = path.join(directory, `.${name}.${crypto.randomUUID()}.tmp`);
  try {
    fileSystem.mkdirSync(directory, { recursive: true, mode: 0o700 });
    if (fileSystem.existsSync(destination)) return fail("immutable-record-already-exists");
    const handle = fileSystem.openSync(temporary, "wx", 0o600);
    try { fileSystem.writeFileSync(handle, serialized.content, "utf8"); fileSystem.fsyncSync(handle); } finally { fileSystem.closeSync(handle); }
    fileSystem.renameSync(temporary, destination);
    // Node does not expose reliable directory fsync on every supported host.
    // Capability is recorded at admission; a provider that cannot supply this
    // boundary is rejected before mutating admission.
    return { valid: true, path: destination, digest: serialized.digest };
  } catch {
    try { fileSystem.rmSync(temporary, { force: true }); } catch { /* best effort only */ }
    return fail("immutable-record-publication-failed");
  }
}

export function createTransitionAttempt({ attemptId, workUnitId, idempotencyKey, preconditionDigest, targetDigest, ownershipGeneration, state = "prepared", receipt = {}, result = {} } = {}) {
  const record = { kind: "transition-attempt", schemaVersion: RUN_CONTRACT_VERSION, attemptId, workUnitId, idempotencyKey, preconditionDigest, targetDigest, ownershipGeneration, state, receipt, result };
  return validateDomainRecord(record).valid ? { valid: true, record } : fail("transition-attempt-invalid");
}

export function reconcileTransitionAttempt(existing, expected) {
  if (!validateDomainRecord(existing).valid || !object(expected) || existing.kind !== "transition-attempt" ||
      existing.workUnitId !== expected.workUnitId || existing.idempotencyKey !== expected.idempotencyKey ||
      existing.targetDigest !== expected.targetDigest) return fail("transition-attempt-conflict");
  if (existing.state === "completed") return { valid: true, classification: "already-completed", record: existing };
  if (["prepared", "in-flight", "in-doubt"].includes(existing.state)) return { valid: true, classification: "reconcile-required", record: existing };
  return fail("transition-attempt-invalid");
}

export function createRepositoryClaim({ claimId, repositoryId: id, workUnitId, owner, ownershipGeneration = 1, providerBinding, state = "active", acquiredAt = new Date().toISOString(), recoveryEvidence = {} } = {}) {
  const record = { kind: "resource-claim", schemaVersion: RUN_CONTRACT_VERSION, claimId, repositoryId: id, workUnitId, owner, ownershipGeneration, providerBinding, state, acquiredAt, recoveryEvidence };
  return validateDomainRecord(record).valid ? { valid: true, record } : fail("resource-claim-invalid");
}

export function admitRepositoryClaim({ existingClaim, requestedClaim }) {
  if (!validateDomainRecord(requestedClaim).valid || requestedClaim?.kind !== "resource-claim") return fail("resource-claim-invalid");
  if (!existingClaim) return { valid: true, classification: "acquired", record: requestedClaim };
  if (!validateDomainRecord(existingClaim).valid || existingClaim.kind !== "resource-claim") return fail("resource-claim-invalid");
  if (existingClaim.repositoryId !== requestedClaim.repositoryId) return fail("resource-claim-repository-mismatch");
  if (existingClaim.state === "active") return fail("repository-mutation-claim-conflict");
  if (existingClaim.state === "in-doubt") return fail("repository-mutation-claim-in-doubt");
  return { valid: true, classification: "acquired", record: requestedClaim };
}

export function takeOverRepositoryClaim({ existingClaim, requestedClaim, proof, unresolvedAttempts = [] }) {
  if (!validateDomainRecord(existingClaim).valid || !validateDomainRecord(requestedClaim).valid ||
      existingClaim.kind !== "resource-claim" || requestedClaim.kind !== "resource-claim" ||
      existingClaim.repositoryId !== requestedClaim.repositoryId) return fail("takeover-input-invalid");
  if (!object(proof) || proof.operatorDirected !== true || proof.ownerAbsent !== true || !timestamp(proof.observedAt)) return fail("takeover-proof-inconclusive");
  if (!Array.isArray(unresolvedAttempts) || unresolvedAttempts.some((attempt) => ["prepared", "in-flight", "in-doubt"].includes(attempt?.state))) return fail("takeover-attempt-reconciliation-required");
  if (requestedClaim.ownershipGeneration !== existingClaim.ownershipGeneration + 1) return fail("takeover-generation-invalid");
  return { valid: true, classification: "taken-over", record: requestedClaim };
}

export function assertOwnershipGeneration(claim, generation) {
  return validateDomainRecord(claim).valid && claim.kind === "resource-claim" && claim.state === "active" && claim.ownershipGeneration === generation
    ? { valid: true } : fail("ownership-generation-stale");
}

export function archiveEligibility({ claim, parentRun, workUnit, terminalSummary, attempts = [], cleanupPending = false, recoveryPending = false, allowBootstrapPreSnapshot = false } = {}) {
  if (!validateDomainRecord(claim).valid || claim?.kind !== "resource-claim" || claim.state !== "active") return fail("archive-claim-not-held");
  if (cleanupPending || recoveryPending || !Array.isArray(attempts) || attempts.some((attempt) => ["prepared", "in-flight", "in-doubt"].includes(attempt?.state))) return fail("archive-reconciliation-incomplete");
  const projection = buildParentProjection(parentRun, workUnit, terminalSummary, { allowBootstrapPreSnapshot });
  return projection.valid ? { valid: true, projection: projection.projection } : fail("archive-projection-invalid");
}

export function rebuildRepositoryIndex({ paths, parentRunId, archivePath, state = "archived", fileSystem = fs } = {}) {
  if (!paths?.index || !identifier.test(parentRunId ?? "") || !text(archivePath) || !["active", "paused", "archived"].includes(state)) return fail("index-rebuild-input-invalid");
  const entry = { schemaVersion: RUN_CONTRACT_VERSION, parentRunId, state, archivePath, rebuiltAt: new Date().toISOString() };
  const runIndex = path.join(paths.index, "runs", `${parentRunId}.json`);
  const statusIndex = path.join(paths.index, "repository-status.json");
  try {
    fileSystem.mkdirSync(path.dirname(runIndex), { recursive: true, mode: 0o700 });
    for (const destination of [runIndex, statusIndex]) {
      const temporary = `${destination}.${crypto.randomUUID()}.tmp`;
      fileSystem.writeFileSync(temporary, `${JSON.stringify(entry)}\n`, { mode: 0o600 });
      fileSystem.renameSync(temporary, destination);
    }
    return { valid: true, entry, runIndex, statusIndex };
  } catch { return fail("index-rebuild-failed"); }
}

export function archiveTerminalRun({ paths, parentRun, workUnit, terminalSummary, claim, attempts, cleanupPending, recoveryPending,
  allowBootstrapPreSnapshot = false, now = new Date().toISOString(), fileSystem = fs, repositoryMutationLockHeld = false } = {}) {
  if (!paths?.active || !paths?.archive || !identifier.test(parentRun?.parentRunId ?? "") || !timestamp(now)) return fail("archive-input-invalid");
  if (!repositoryMutationLockHeld) {
    const stateHome = paths.repository ? path.dirname(path.dirname(paths.repository)) : null;
    return withRepositoryMutationLock({ stateHome, repositoryId: claim?.repositoryId, fileSystem }, () => archiveTerminalRun({
      paths, parentRun, workUnit, terminalSummary, claim, attempts, cleanupPending, recoveryPending,
      allowBootstrapPreSnapshot, now, fileSystem, repositoryMutationLockHeld: true
    }));
  }
  const eligibility = archiveEligibility({ claim, parentRun, workUnit, terminalSummary, attempts, cleanupPending, recoveryPending, allowBootstrapPreSnapshot });
  if (!eligibility.valid) return eligibility;
  const source = path.join(paths.active, parentRun.parentRunId);
  const date = new Date(now);
  const destination = path.join(paths.archive, String(date.getUTCFullYear()), String(date.getUTCMonth() + 1).padStart(2, "0"), String(date.getUTCDate()).padStart(2, "0"), parentRun.parentRunId);
  if (!fileSystem.existsSync(source) || fileSystem.existsSync(destination)) return fail("archive-bundle-unavailable");
  const manifest = { kind: "archive-manifest", schemaVersion: RUN_CONTRACT_VERSION, parentRunId: parentRun.parentRunId, archivedAt: now, reason: terminalSummary.terminalReason, projectionDigest: digestValue(eligibility.projection) };
  try {
    fileSystem.writeFileSync(path.join(source, "archive-manifest.json"), `${JSON.stringify(manifest)}\n`, { mode: 0o600 });
    fileSystem.mkdirSync(path.dirname(destination), { recursive: true, mode: 0o700 });
    fileSystem.renameSync(source, destination);
    const index = rebuildRepositoryIndex({ paths, parentRunId: parentRun.parentRunId, archivePath: destination, fileSystem });
    return index.valid ? { valid: true, archivePath: destination, manifest, index } : { valid: false, reason: index.reason, archivePath: destination };
  } catch { return fail("archive-move-failed"); }
}
