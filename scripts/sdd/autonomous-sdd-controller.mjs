#!/usr/bin/env node
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { executeWorkspaceCleanup, planWorkspaceCleanup } from "./sdd-workspace-cleanup.mjs";
import { bindIssueIntakeEvidence, validateIssueIntakeBinding } from "./issue-intake-binding.mjs";

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
const checkpointForRun = (runId) => `runs/${runId}/controller.json`;

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

export function authorizationDigest(authorization) {
  return crypto.createHash("sha256").update(JSON.stringify(canonical(authorization))).digest("hex");
}

export function createControllerRecord({ authorization, repository, selectedEntry, runId = crypto.randomUUID() } = {}) {
  const entries = authorization?.target?.entries;
  const entry = selectedEntry ?? entries?.[0];
  if (!selectedByAuthorization(entry, authorization) || !text(repository) || !validRunId(runId) || authorization?.mode !== "autonomous" || authorization?.authorizationProfile !== "sdd-delivery") {
    return { valid: false, reason: "controller-record-input-invalid" };
  }
  return {
    valid: true,
    record: {
      schemaVersion: 4,
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
      cleanupReceipts: [],
      completedEntries: [],
      currentPhase: "propose",
      steps: phases.map((id) => ({ id, status: "pending" }))
    }
  };
}

export function registerControllerIssueIntake(record, binding, { now = new Date().toISOString() } = {}) {
  if (record?.schemaVersion !== 4 || !timestamp(now) || !validateIssueIntakeBinding(binding) ||
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
  if (record?.schemaVersion !== 4 || !text(payloadDigest)) return { valid: false, reason: "controller-issue-intake-delivery-invalid" };
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

export function registerControllerResource(record, resource, { now = new Date().toISOString() } = {}) {
  if (record?.schemaVersion !== 4 || !timestamp(now) || !resource || !["worktree", "branch"].includes(resource.kind) ||
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
  if (record?.schemaVersion !== 4 || !["worktree", "branch"].includes(kind) || !text(id)) return { valid: false, reason: "controller-resource-delivery-invalid" };
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
  if (record?.schemaVersion !== 4 || !timestamp(now) || !receipt || !["started", "completed", "already-completed", "blocked"].includes(receipt.status) ||
      !["worktree", "branch"].includes(receipt.kind) || !text(receipt.id)) return { valid: false, reason: "controller-cleanup-receipt-invalid" };
  const next = structuredClone(record);
  const resource = next.resourceRecords?.find((item) => item.kind === receipt.kind && item.id === receipt.id);
  if (!resource || !validResource(resource, next, { allowPending: false })) return { valid: false, reason: "controller-cleanup-receipt-resource-invalid" };
  const saved = { kind: receipt.kind, id: receipt.id, status: receipt.status, at: now, recoveryReference: resource.recoveryReference };
  next.cleanupReceipts.push(saved);
  return { valid: true, record: next, receipt: saved };
}

export function persistControllerCleanupReceipt({ repositoryPath, record, receipt, now, runGit } = {}) {
  const appended = appendControllerCleanupReceipt(record, receipt, { now });
  if (!appended.valid) return appended;
  const persisted = persistControllerRecord({ repositoryPath, record: appended.record, runGit });
  return persisted.valid
    ? { valid: true, record: appended.record, receipt: appended.receipt, path: persisted.path }
    : persisted;
}

export function advanceControllerQueue(record, { now = new Date().toISOString() } = {}) {
  if (!Array.isArray(record?.queueEntries) || !Number.isInteger(record.queueIndex) || record.queueEntries[record.queueIndex] !== record.selectedEntry ||
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
    cleanupReceipts: next.cleanupReceipts
  });
  next.queueIndex = nextIndex;
  next.selectedEntry = next.queueEntries[nextIndex];
  next.resourceRecords = [];
  next.issueIntakeRecords = [];
  next.cleanupReceipts = [];
  next.currentPhase = "propose";
  next.steps = phases.map((id) => ({ id, status: "pending" }));
  return { valid: true, record: next };
}

export function inspectControllerRecord(record, { authorization, repository, now = new Date().toISOString() } = {}) {
  if (!record || record.schemaVersion === 1 || record.schemaVersion === 2 || record.schemaVersion === 3) return { classification: "paused", reason: "controller-record-legacy", nextPhase: null };
  if (record.schemaVersion !== 4 || !validRunId(record.runId) || record.checkpointPath !== checkpointForRun(record.runId) || !text(record.selectedEntry) || !text(record.repository) || !text(record.checkpointPath) || !Array.isArray(record.steps) ||
      !Array.isArray(record.resourceRecords) || (record.issueIntakeRecords !== undefined && !Array.isArray(record.issueIntakeRecords)) ||
      !Array.isArray(record.cleanupReceipts) || !Array.isArray(record.completedEntries) ||
      record.resourceRecords.some((resource) => !validResource(resource, record)) ||
      (record.issueIntakeRecords ?? []).some((intake) => !validIssueIntakeRecord(intake, record.selectedEntry)) ||
      record.completedEntries.some((entry) => !validCompletedEntry(entry, record.repository))) {
    return { classification: "paused", reason: "controller-record-invalid", nextPhase: null };
  }
  if (!selectedByAuthorization(record.selectedEntry, authorization) || record.repository !== repository || record.authorizationDigest !== authorizationDigest(authorization) || record.expiresAt !== authorization?.expiresAt) {
    return { classification: "paused", reason: "controller-context-conflict", nextPhase: null };
  }
  if (Date.parse(record.expiresAt) <= Date.parse(now)) return { classification: "paused", reason: "controller-context-expired", nextPhase: null };
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

export function advanceControllerRecord(record, phase, evidence) {
  const index = phases.indexOf(phase);
  const existing = record?.steps?.[index];
  if (index < 0 || evidence?.current !== true || (existing?.status === "complete" && existing.evidence?.current === true)) {
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

export function persistControllerRecord({ repositoryPath, record, runGit } = {}) {
  if (!text(repositoryPath) || !validRunId(record?.runId) || record?.checkpointPath !== checkpointForRun(record.runId) || path.isAbsolute(record.checkpointPath)) {
    return { valid: false, reason: "controller-record-path-invalid" };
  }
  const state = resolveControllerStateRoot({ repositoryPath, runGit });
  if (!state.valid) return state;
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
  try {
    fs.mkdirSync(directory, { recursive: true });
    if (!inspectComponents() || fs.realpathSync(directory) === root || !fs.realpathSync(directory).startsWith(`${root}${path.sep}`)) return { valid: false, reason: "controller-record-path-symlink" };
    if (fs.existsSync(destination)) {
      const existing = JSON.parse(fs.readFileSync(destination, "utf8"));
      if (existing?.runId !== record.runId) return { valid: false, reason: "controller-record-run-conflict" };
    }
    const descriptor = fs.openSync(temporary, "wx", 0o600);
    try {
      fs.writeFileSync(descriptor, `${JSON.stringify(record, null, 2)}\n`);
      fs.fsyncSync(descriptor);
    } finally {
      fs.closeSync(descriptor);
    }
    fs.renameSync(temporary, destination);
    const directoryDescriptor = fs.openSync(directory, "r");
    try {
      fs.fsyncSync(directoryDescriptor);
    } finally {
      fs.closeSync(directoryDescriptor);
    }
    return { valid: true, path: destination };
  } catch {
    try { fs.unlinkSync(temporary); } catch {}
    return { valid: false, reason: "controller-record-persist-failed" };
  }
}

export function registerControllerLifecycleResource({ repositoryPath, record, resource, now, runGit } = {}) {
  const registered = registerControllerResource(record, resource, { now });
  if (!registered.valid) return registered;
  const persisted = persistControllerRecord({ repositoryPath, record: registered.record, runGit });
  return persisted.valid ? { valid: true, record: registered.record, resource: registered.resource, path: persisted.path } : persisted;
}

export function persistControllerIssueIntake({ repositoryPath, record, binding, now, runGit } = {}) {
  const registered = registerControllerIssueIntake(record, binding, { now });
  if (!registered.valid) return registered;
  const persisted = persistControllerRecord({ repositoryPath, record: registered.record, runGit });
  return persisted.valid ? { valid: true, record: registered.record, intake: registered.intake, path: persisted.path } : persisted;
}

export function persistControllerIssueIntakeEvidence({ repositoryPath, record, payloadDigest, issue, observedAt, reference, runGit } = {}) {
  const bound = bindControllerIssueIntake(record, { payloadDigest, issue, observedAt, reference });
  if (!bound.valid) return bound;
  const persisted = persistControllerRecord({ repositoryPath, record: bound.record, runGit });
  return persisted.valid ? { valid: true, record: bound.record, intake: bound.intake, path: persisted.path } : persisted;
}

export function bindControllerLifecycleDelivery({ repositoryPath, record, kind, id, deliveryEvidence, runGit } = {}) {
  const bound = bindControllerResourceDelivery(record, { kind, id, deliveryEvidence });
  if (!bound.valid) return bound;
  const persisted = persistControllerRecord({ repositoryPath, record: bound.record, runGit });
  return persisted.valid ? { valid: true, record: bound.record, path: persisted.path } : persisted;
}

export function executeControllerLifecycleCleanup({ repositoryPath, record, cleanupContext, operations = {}, now = new Date().toISOString(), runGit } = {}) {
  if (!Array.isArray(record?.resourceRecords) || record.resourceRecords.length === 0) {
    return { classification: "paused", reason: "controller-cleanup-resources-missing", outcomes: [], record, plan: null };
  }
  if (typeof operations.inspectResource !== "function") {
    return { classification: "paused", reason: "controller-cleanup-fresh-inspection-missing", outcomes: [], record, plan: null };
  }
  let inspectedResources;
  try {
    inspectedResources = (record?.resourceRecords ?? []).map((resource) => {
      const inspected = operations.inspectResource(resource);
      if (!inspected || typeof inspected !== "object") return inspected;
      if (inspected.exists === false) return inspected;
      const { exists, ...eligibility } = inspected;
      return eligibility;
    });
  } catch {
    return { classification: "paused", reason: "controller-cleanup-fresh-inspection-failed", outcomes: [], record, plan: null };
  }
  const plan = planWorkspaceCleanup({ ...cleanupContext, selectedEntry: record?.selectedEntry, repository: record?.repository, resources: inspectedResources });
  if (plan.classification !== "planned" || plan.resources.some((resource) => resource.classification !== "eligible")) {
    return { classification: "paused", reason: "controller-cleanup-resource-ineligible", outcomes: [], record, plan };
  }
  let currentRecord = record;
  const result = executeWorkspaceCleanup(plan, {
    ...operations,
    persistOutcome: (outcome) => {
      const persisted = persistControllerCleanupReceipt({ repositoryPath, record: currentRecord, receipt: { kind: outcome.resource?.kind, id: outcome.resource?.id, status: outcome.status }, now, runGit });
      if (!persisted.valid) return { persisted: false };
      currentRecord = persisted.record;
      return { persisted: true, path: persisted.path };
    }
  });
  return { ...result, record: currentRecord, plan };
}
