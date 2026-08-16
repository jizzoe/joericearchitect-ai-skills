#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const phases = Object.freeze([
  "propose", "planning-review", "apply", "verify", "delivery", "sync", "archive", "cleanup"
]);

const text = (value) => typeof value === "string" && value.trim().length > 0;
const canonical = (value) => JSON.stringify(value, Object.keys(value).sort());

export function authorizationDigest(authorization) {
  const source = {
    schemaVersion: authorization?.schemaVersion,
    target: authorization?.target,
    mode: authorization?.mode,
    qualityProfile: authorization?.qualityProfile,
    authorizationProfile: authorization?.authorizationProfile,
    independentReviewPolicy: authorization?.independentReviewPolicy,
    expiresAt: authorization?.expiresAt
  };
  return crypto.createHash("sha256").update(canonical(source)).digest("hex");
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
  if (record.repository !== repository || record.authorizationDigest !== authorizationDigest(authorization) || record.expiresAt !== authorization?.expiresAt) {
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
  if (index < 0 || record?.steps?.[index]?.status === "complete" || evidence?.current !== true) {
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
  const root = path.resolve(repositoryPath);
  const destination = path.resolve(root, record.checkpointPath);
  if (destination !== root && !destination.startsWith(`${root}${path.sep}`)) return { valid: false, reason: "controller-record-path-escape" };
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, `${JSON.stringify(record, null, 2)}\n`);
  return { valid: true, path: destination };
}
