import fs from "node:fs";
import path from "node:path";

import { validateDomainRecord } from "./autonomous-sdd-run-contract.mjs";
import { defaultStateHome, rebuildRepositoryIndex, statePaths, withRepositoryMutationLock } from "./autonomous-sdd-local-store.mjs";

const identifier = /^[a-z0-9][a-z0-9-]{2,127}$/i;
const repositoryIdPattern = /^r1-[0-9a-f]{64}$/i;
const timestamp = (value) => typeof value === "string" && !Number.isNaN(Date.parse(value));

export const RUN_STATUS_VERSION = 1;
export const RUN_STATUS_CLASSIFICATIONS = Object.freeze([
  "running",
  "complete",
  "expired",
  "waiting-human",
  "retryable-infrastructure",
  "quality-blocked",
  "configuration-discovery-gap",
  "ambiguous-legacy-state",
]);

// Typed stop reasons mapped to the paused classifications. Unknown reasons are
// not guessed: classifyStopReason returns null and the caller fails closed.
const WAITING_HUMAN_REASONS = new Set([
  "material-requirement", "architecture-choice", "compatibility-change", "data-ownership",
  "license-obligation", "governance", "credential", "destructive-action",
  "unexpected-external-target", "dependency-ambiguity", "durable-state-conflict",
  "authorization-expired", "claim-not-active", "controller-context-conflict",
  "controller-context-expired", "takeover-proof-inconclusive", "takeover-attempt-reconciliation-required",
]);

const RETRYABLE_INFRA_REASONS = new Set([
  "adapter-unavailable", "runtime-permission-unavailable", "v2-admission-inspection-unavailable",
  "v2-admission-persist-failed", "github-cli-auth-context-unavailable", "archive-inspection-unavailable",
]);

const QUALITY_REASONS = new Set([
  "evidence-not-current", "planning-not-ready", "apply-not-ready", "review-not-ready",
  "controller-phase-stale", "controller-cleanup-incomplete", "correction-budget-exhausted",
  "controller-phase-chain-invalid", "controller-record-invalid",
]);

const CONFIG_GAP_REASONS = new Set([
  "claim-provider-capability-invalid", "state-layout-input-invalid", "v2-inspection-input-invalid",
  "run-discovery-input-invalid", "configuration-snapshot-invalid", "repository-identity-conflict",
]);

export function classifyStopReason(reason) {
  if (WAITING_HUMAN_REASONS.has(reason)) return "waiting-human";
  if (RETRYABLE_INFRA_REASONS.has(reason)) return "retryable-infrastructure";
  if (QUALITY_REASONS.has(reason)) return "quality-blocked";
  if (CONFIG_GAP_REASONS.has(reason)) return "configuration-discovery-gap";
  return null;
}

// Pure, deterministic classification of one run from its durable facts. The
// caller derives these facts from authoritative history; this function performs
// no I/O and never mutates.
export function classifyRunStatus({ terminal = null, claimState = null, claimDisposition = null, cleanupDisposition = null, deadline = null, projectionFresh = true, stopReason = null, now = new Date().toISOString() } = {}) {
  if (!timestamp(now)) return { classification: "ambiguous-legacy-state", reason: "status-time-invalid" };
  if (!projectionFresh) return { classification: "ambiguous-legacy-state", reason: "projection-stale" };
  if (terminal === "terminalization") {
    return claimDisposition === "released" && cleanupDisposition === "completed"
      ? { classification: "complete", reason: "terminalized-and-clean" }
      : { classification: "ambiguous-legacy-state", reason: "terminal-cleanup-disagrees" };
  }
  if (terminal === "cancellation") {
    return claimDisposition === "released" && cleanupDisposition === "cancelled"
      ? { classification: "complete", reason: "cancelled-and-released" }
      : { classification: "ambiguous-legacy-state", reason: "cancellation-cleanup-disagrees" };
  }
  if (claimState !== "active") return { classification: "ambiguous-legacy-state", reason: "claim-not-active" };
  if (timestamp(deadline) && Date.parse(deadline) <= Date.parse(now)) {
    return { classification: "expired", reason: "deadline-passed" };
  }
  if (stopReason != null) {
    const bucket = classifyStopReason(stopReason);
    if (bucket) return { classification: bucket, reason: stopReason };
  }
  return { classification: "running", reason: "active-claim-in-progress" };
}

function safeJson(target, fileSystem) {
  try { return JSON.parse(fileSystem.readFileSync(target, "utf8")); } catch { return null; }
}

function listArchiveRuns(paths, fileSystem) {
  const runs = [];
  if (!fileSystem.existsSync(paths.archive)) return runs;
  for (const year of fileSystem.readdirSync(paths.archive, { withFileTypes: true })) {
    if (!year.isDirectory() || !/^\d{4}$/.test(year.name)) continue;
    for (const month of fileSystem.readdirSync(path.join(paths.archive, year.name), { withFileTypes: true })) {
      if (!month.isDirectory() || !/^\d{2}$/.test(month.name)) continue;
      for (const day of fileSystem.readdirSync(path.join(paths.archive, year.name, month.name), { withFileTypes: true })) {
        if (!day.isDirectory() || !/^\d{2}$/.test(day.name)) continue;
        for (const run of fileSystem.readdirSync(path.join(paths.archive, year.name, month.name, day.name), { withFileTypes: true })) {
          if (!run.isDirectory()) continue;
          runs.push({ parentRunId: run.name, location: "archived", archivePath: path.join(paths.archive, year.name, month.name, day.name, run.name) });
        }
      }
    }
  }
  return runs;
}

// Discovery is by canonical repository identity and the configured backend,
// never the caller's current directory. Returns the active run (if any) plus
// every archived run, read from authoritative history rather than the index.
export function discoverRuns({ stateHome = defaultStateHome(), readableRepositoryName, repositoryId, fileSystem = fs } = {}) {
  if (!identifier.test(readableRepositoryName ?? "") || !repositoryIdPattern.test(repositoryId ?? "")) return { valid: false, reason: "run-discovery-input-invalid" };
  const paths = statePaths({ stateHome, readableName: readableRepositoryName, repositoryId });
  if (!paths) return { valid: false, reason: "run-discovery-input-invalid" };
  try {
    const runs = [];
    if (fileSystem.existsSync(paths.active)) {
      for (const entry of fileSystem.readdirSync(paths.active, { withFileTypes: true })) {
        if (entry.isDirectory() && !entry.name.startsWith(".")) {
          runs.push({ parentRunId: entry.name, location: "active", archivePath: path.join(paths.active, entry.name) });
        }
      }
    }
    runs.push(...listArchiveRuns(paths, fileSystem));
    return { valid: true, paths, runs };
  } catch {
    return { valid: false, reason: "run-discovery-unavailable", paths };
  }
}

function loadRunRecords(archivePath, fileSystem) {
  const names = ["parent-run", "work-unit", "resource-claim", "terminalization-receipt", "cancellation-receipt", "claim-release", "projection", "archive-manifest"];
  const records = Object.fromEntries(names.map((name) => [name, safeJson(path.join(archivePath, `${name}.json`), fileSystem)]));
  const validations = Object.fromEntries(Object.entries(records).filter(([, record]) => record != null).map(([name, record]) => [name, validateDomainRecord(record)]));
  const invalid = Object.entries(validations).find(([, validation]) => !validation.valid);
  return invalid ? { valid: false, reason: "run-record-invalid", name: invalid[0] } : { valid: true, records, validations };
}

function deriveTerminalFacts(records) {
  const terminalization = records["terminalization-receipt"];
  const cancellation = records["cancellation-receipt"];
  const release = records["claim-release"];
  const projection = records.projection;
  const terminal = terminalization != null ? "terminalization" : cancellation != null ? "cancellation" : null;
  const summary = terminalization?.terminalSummary ?? projection?.children?.[0] ?? null;
  return {
    terminal,
    claimDisposition: release?.disposition ?? null,
    cleanupDisposition: summary?.cleanupDisposition ?? null,
    terminalStatus: summary?.terminalStatus ?? null,
  };
}

// Builds a versioned, read-only status projection for one run. It links
// evidence by digest and repository-relative reference, never inlines evidence
// or secrets.
export function buildRunStatus({ stateHome = defaultStateHome(), readableRepositoryName, repositoryId, parentRunId, now = new Date().toISOString(), fileSystem = fs } = {}) {
  const discovered = discoverRuns({ stateHome, readableRepositoryName, repositoryId, fileSystem });
  if (!discovered.valid) return discovered;
  const run = discovered.runs.find((entry) => entry.parentRunId === parentRunId);
  if (!run) return { valid: false, reason: "run-not-found", classification: "ambiguous-legacy-state" };
  const loaded = loadRunRecords(run.archivePath, fileSystem);
  if (!loaded.valid) return { valid: false, reason: loaded.reason, classification: "ambiguous-legacy-state" };
  const parent = loaded.records["parent-run"];
  const workUnit = loaded.records["work-unit"];
  const claim = loaded.records["resource-claim"];
  const facts = deriveTerminalFacts(loaded.records);
  const classified = classifyRunStatus({
    terminal: facts.terminal,
    claimState: claim?.state ?? null,
    claimDisposition: facts.claimDisposition,
    cleanupDisposition: facts.cleanupDisposition,
    deadline: parent?.deadline ?? null,
    projectionFresh: true,
    now,
  });
  return {
    valid: true,
    status: {
      kind: "run-status",
      schemaVersion: RUN_STATUS_VERSION,
      repositoryId,
      readableRepositoryName,
      parentRunId,
      workUnitId: workUnit?.workUnitId ?? null,
      classification: classified.classification,
      stopReason: classified.reason,
      location: run.location,
      claim: claim
        ? { claimId: claim.claimId, state: claim.state, ownershipGeneration: claim.ownershipGeneration, acquiredAt: claim.acquiredAt }
        : null,
      deadline: parent?.deadline ?? null,
      currentPhase: null,
      evidenceRefs: loaded.records["archive-manifest"] ? [{ kind: "archive-manifest", digest: loaded.validations["archive-manifest"].digest, reference: "archive-manifest.json" }] : [],
      generatedAt: now,
    },
  };
}

// Recommends exactly one of safe-resume, no-op, or typed pause. It never
// authorizes mutation or claim release; wrong-run, wrong-repository, and stale
// inputs pause.
export function recommendResume({ status, requestedRepositoryId, requestedParentRunId, now = new Date().toISOString() } = {}) {
  if (!status || status.kind !== "run-status" || status.schemaVersion !== RUN_STATUS_VERSION) return { recommendation: "paused", reason: "status-input-invalid" };
  if (requestedRepositoryId != null && status.repositoryId !== requestedRepositoryId) return { recommendation: "paused", reason: "wrong-repository" };
  if (requestedParentRunId != null && status.parentRunId !== requestedParentRunId) return { recommendation: "paused", reason: "wrong-run" };
  const resume = {
    running: "safe-resume",
    "retryable-infrastructure": "safe-resume",
    complete: "no-op",
    expired: "paused",
    "waiting-human": "paused",
    "quality-blocked": "paused",
    "configuration-discovery-gap": "paused",
    "ambiguous-legacy-state": "paused",
  };
  const recommendation = resume[status.classification] ?? "paused";
  return { recommendation, reason: status.stopReason ?? status.classification };
}

// Rebuilds the repository index projection from authoritative history. It reads
// active and archived run directories and rewrites only the index (runs/*.json
// and repository-status.json); it never rewrites run history records.
export function rebuildProjection({ stateHome = defaultStateHome(), readableRepositoryName, repositoryId, now = new Date().toISOString(),
  fileSystem = fs, repositoryMutationLockHeld = false } = {}) {
  if (!repositoryMutationLockHeld) {
    return withRepositoryMutationLock({ stateHome, repositoryId, fileSystem }, () => rebuildProjection({
      stateHome, readableRepositoryName, repositoryId, now, fileSystem, repositoryMutationLockHeld: true
    }));
  }
  const discovered = discoverRuns({ stateHome, readableRepositoryName, repositoryId, fileSystem });
  if (!discovered.valid) return discovered;
  if (!timestamp(now)) return { valid: false, reason: "projection-time-invalid" };
  try {
    const rebuilt = [];
    for (const run of discovered.runs) {
      const state = run.location === "active" ? "active" : "archived";
      const index = rebuildRepositoryIndex({ paths: discovered.paths, parentRunId: run.parentRunId, archivePath: run.archivePath, state, fileSystem });
      if (!index.valid) return { valid: false, reason: index.reason };
      rebuilt.push({ parentRunId: run.parentRunId, state, index });
    }
    return { valid: true, rebuilt };
  } catch {
    return { valid: false, reason: "projection-rebuild-failed" };
  }
}
