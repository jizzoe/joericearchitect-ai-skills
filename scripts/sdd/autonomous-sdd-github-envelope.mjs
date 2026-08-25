import crypto from "node:crypto";

export const githubDeliveryOperations = Object.freeze([
  "issue-create-or-reuse",
  "project-item-add-or-reuse",
  "project-set-status",
  "topic-branch-create",
  "pr-create-or-update",
  "exact-head-check",
  "merge",
  "issue-close",
  "delivery-status"
]);

export const hostResultOutcomes = Object.freeze(["success", "conflict", "denied", "unavailable", "unknown"]);

const repositoryPattern = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
const operationPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const digestPattern = /^[0-9a-f]{64}$/i;
const idempotencyKeyPattern = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;

const text = (value) => typeof value === "string" && value.trim().length > 0;
const timestamp = (value) => text(value) && !Number.isNaN(Date.parse(value));
const repository = (value) => {
  if (!text(value) || !repositoryPattern.test(value)) return false;
  const [owner, name] = value.split("/");
  return owner !== "." && owner !== ".." && name !== "." && name !== "..";
};
const operation = (value) => text(value) && operationPattern.test(value) && githubDeliveryOperations.includes(value);
const digest = (value) => typeof value === "string" && digestPattern.test(value);
const idempotencyKey = (value) => text(value) && idempotencyKeyPattern.test(value);

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
  }
  return value;
}

function sha256(value) {
  return crypto.createHash("sha256").update(JSON.stringify(canonical(value))).digest("hex");
}

function validTargetIdentities(value) {
  return Array.isArray(value) && value.length > 0 && value.every((entry) => text(entry));
}

function validOwnershipScope(value) {
  return Array.isArray(value) && value.length > 0 && value.every((entry) => text(entry));
}

const envelopeKeys = Object.freeze([
  "schemaVersion", "operation", "repository", "targetIdentities", "payloadDigest",
  "preconditionDigest", "idempotencyKey", "ownershipScope", "expiresAt", "envelopeDigest"
]);

const receiptKeys = Object.freeze([
  "schemaVersion", "envelopeDigest", "operation", "repository", "targetIdentities", "outcome", "observedAt", "receiptDigest"
]);

export function hostOperationEnvelopeDigest(envelope) {
  if (!envelope || typeof envelope !== "object") return null;
  const base = {
    schemaVersion: envelope.schemaVersion,
    operation: envelope.operation,
    repository: envelope.repository,
    targetIdentities: envelope.targetIdentities,
    payloadDigest: envelope.payloadDigest,
    preconditionDigest: envelope.preconditionDigest,
    idempotencyKey: envelope.idempotencyKey,
    ownershipScope: envelope.ownershipScope,
    expiresAt: envelope.expiresAt
  };
  return sha256(base);
}

export function validateHostOperationEnvelope(envelope, now = new Date().toISOString()) {
  if (!envelope || envelope.schemaVersion !== 1 || !operation(envelope.operation) ||
      !repository(envelope.repository) || !validTargetIdentities(envelope.targetIdentities) ||
      !digest(envelope.payloadDigest) || !digest(envelope.preconditionDigest) ||
      !idempotencyKey(envelope.idempotencyKey) || !validOwnershipScope(envelope.ownershipScope) ||
      !timestamp(envelope.expiresAt) || !timestamp(now) ||
      Date.parse(envelope.expiresAt) <= Date.parse(now)) return false;
  if (!Object.keys(envelope).every((key) => envelopeKeys.includes(key))) return false;
  if (envelope.envelopeDigest !== undefined && !digest(envelope.envelopeDigest)) return false;
  return true;
}

export function createHostOperationEnvelope({ operation: operationName, repository: targetRepository, targetIdentities,
  payloadDigest, preconditionDigest, idempotencyKey: key, ownershipScope, expiresAt } = {}) {
  const base = {
    schemaVersion: 1,
    operation: operationName,
    repository: targetRepository,
    targetIdentities,
    payloadDigest,
    preconditionDigest,
    idempotencyKey: key,
    ownershipScope,
    expiresAt
  };
  if (!validateHostOperationEnvelope(base)) return { valid: false, reason: "host-operation-envelope-invalid" };
  const envelopeDigest = hostOperationEnvelopeDigest(base);
  return { valid: true, envelope: { ...base, envelopeDigest }, envelopeDigest };
}

export function createHostResultReceipt({ envelope, outcome, observedAt = new Date().toISOString() } = {}) {
  if (!validateHostOperationEnvelope(envelope) || !digest(envelope.envelopeDigest)) {
    return { valid: false, reason: "host-result-receipt-envelope-invalid" };
  }
  if (!hostResultOutcomes.includes(outcome) || !timestamp(observedAt)) {
    return { valid: false, reason: "host-result-receipt-input-invalid" };
  }
  const base = {
    schemaVersion: 1,
    envelopeDigest: envelope.envelopeDigest,
    operation: envelope.operation,
    repository: envelope.repository,
    targetIdentities: envelope.targetIdentities,
    outcome,
    observedAt
  };
  const receiptDigest = sha256(base);
  return { valid: true, receipt: { ...base, receiptDigest }, receiptDigest };
}

export function validateHostResultReceipt(receipt, envelope) {
  if (!receipt || receipt.schemaVersion !== 1 || !digest(receipt.envelopeDigest) ||
      !operation(receipt.operation) || !repository(receipt.repository) ||
      !validTargetIdentities(receipt.targetIdentities) || !hostResultOutcomes.includes(receipt.outcome) ||
      !timestamp(receipt.observedAt)) return false;
  if (!Object.keys(receipt).every((key) => receiptKeys.includes(key))) return false;
  if (receipt.receiptDigest !== undefined && !digest(receipt.receiptDigest)) return false;
  if (!validateHostOperationEnvelope(envelope) || !digest(envelope.envelopeDigest)) return false;
  if (receipt.envelopeDigest !== envelope.envelopeDigest || receipt.operation !== envelope.operation ||
      receipt.repository !== envelope.repository ||
      JSON.stringify(receipt.targetIdentities) !== JSON.stringify(envelope.targetIdentities)) return false;
  return true;
}

export function revalidateControllerAdvance({ receipt, envelope, liveState, now = new Date().toISOString() } = {}) {
  if (!validateHostOperationEnvelope(envelope, now)) return { decision: "paused", reason: "envelope-invalid-or-expired" };
  if (!validateHostResultReceipt(receipt, envelope)) return { decision: "paused", reason: "receipt-mismatch" };
  if (receipt.outcome === "denied" || receipt.outcome === "unavailable") {
    return { decision: "paused", reason: `host-${receipt.outcome}` };
  }
  if (receipt.outcome === "unknown") return { decision: "in-doubt", reason: "ambiguous-receipt" };
  if (receipt.outcome === "conflict") return { decision: "reconcile", reason: "host-reported-conflict" };
  const state = liveState?.state;
  if (state === "confirms") return { decision: "advance", reason: "receipt-and-live-state-agree" };
  if (state === "conflicts") return { decision: "reconcile", reason: "live-state-conflicts-receipt" };
  if (state === "unknown") return { decision: "in-doubt", reason: "unobservable-live-state" };
  return { decision: "paused", reason: "unclassifiable-advance" };
}
