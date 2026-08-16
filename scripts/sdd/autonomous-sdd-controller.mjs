#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const phases = Object.freeze([
  "propose", "planning-review", "apply", "verify", "delivery", "sync", "archive", "cleanup"
]);

const text = (value) => typeof value === "string" && value.trim().length > 0;
const canonical = (value) => {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
  }
  return value;
};
const selectedByAuthorization = (selectedEntry, authorization) =>
  text(selectedEntry) && Array.isArray(authorization?.target?.entries) && authorization.target.entries.includes(selectedEntry);

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

export function authorizationDigest(authorization) {
  return crypto.createHash("sha256").update(JSON.stringify(canonical(authorization))).digest("hex");
}

export function createControllerRecord({ authorization, repository, checkpointPath }) {
  const entry = authorization?.target?.entries?.[0];
  if (!entry || !text(repository) || !text(checkpointPath) || authorization?.mode !== "autonomous" || authorization?.authorizationProfile !== "sdd-delivery") {
    return { valid: false, reason: "controller-record-input-invalid" };
  }
  return {
    valid: true,
    record: {
      schemaVersion: 1,
      authorizationDigest: authorizationDigest(authorization),
      selectedEntry: entry,
      repository,
      expiresAt: authorization.expiresAt,
      allowedLifecycleChain: [...phases],
      checkpointPath,
      currentPhase: "propose",
      steps: phases.map((id) => ({ id, status: "pending" }))
    }
  };
}

export function inspectControllerRecord(record, { authorization, repository, now = new Date().toISOString() } = {}) {
  if (!record || record.schemaVersion !== 1 || !text(record.selectedEntry) || !text(record.repository) || !text(record.checkpointPath) || !Array.isArray(record.steps)) {
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
  const next = structuredClone(record);
  next.steps[index] = { id: phase, status: "complete", evidence };
  next.currentPhase = phases[index + 1] ?? null;
  return { valid: true, record: next };
}

export function persistControllerRecord({ repositoryPath, record }) {
  if (!text(repositoryPath) || !text(record?.checkpointPath) || path.isAbsolute(record.checkpointPath)) {
    return { valid: false, reason: "controller-record-path-invalid" };
  }
  let containment;
  try {
    containment = safeContainedDestination(repositoryPath, record.checkpointPath);
  } catch {
    return { valid: false, reason: "controller-record-path-invalid" };
  }
  if (!containment) return { valid: false, reason: "controller-record-path-escape" };
  const { root, destination, inspectComponents } = containment;
  const directory = path.dirname(destination);
  const temporary = path.join(directory, `.${path.basename(destination)}.${process.pid}.${crypto.randomUUID()}.tmp`);
  try {
    fs.mkdirSync(directory, { recursive: true });
    if (!inspectComponents() || fs.realpathSync(directory) === root || !fs.realpathSync(directory).startsWith(`${root}${path.sep}`)) return { valid: false, reason: "controller-record-path-symlink" };
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
