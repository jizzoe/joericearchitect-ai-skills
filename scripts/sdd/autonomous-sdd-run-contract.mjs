import crypto from "node:crypto";

export const RUN_CONTRACT_VERSION = 2;
export const RECORD_KINDS = Object.freeze([
  "repository", "parent-run", "work-unit", "transition-attempt", "resource-claim",
  "evidence", "projection", "archive-manifest", "legacy-classification",
  "claim-release", "terminalization-receipt", "cancellation-receipt"
]);
export const PARENT_CHILD_SUMMARY_KEYS = Object.freeze([
  "workUnitId", "ordinal", "approvedChangeId", "terminalStatus", "terminalReason",
  "startedAt", "terminalAt", "finalHead", "attemptCount", "correctionCount",
  "claimDisposition", "cleanupDisposition", "childHistoryReference",
  "childHistoryDigest", "terminalSummaryDigest"
]);

const identifier = /^[a-z0-9][a-z0-9-]{2,127}$/i;
const digest = /^[0-9a-f]{64}$/i;
const timestamp = (value) => typeof value === "string" && !Number.isNaN(Date.parse(value));
const text = (value) => typeof value === "string" && value.trim().length > 0;
const object = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const secretKey = /(?:password|secret|token|credential|api[_-]?key|authorization|private[_-]?key)/i;
const secretValue = /(?:gh[pousr]_[A-Za-z0-9]{20,}|Bearer\s+\S+|AKIA[A-Z0-9]{16}|-----BEGIN [A-Z ]*PRIVATE KEY-----)/;
const sensitiveKey = (key) => secretKey.test(key) && !/digest$/i.test(key);
const relativePath = (value) => text(value) && !value.startsWith("/") && !/^(?:[a-z]:[\\/]|\\\\)/i.test(value) && !value.split(/[\\/]/).includes("..");

export function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (object(value)) return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
  return value;
}

export function digestValue(value) {
  return crypto.createHash("sha256").update(JSON.stringify(canonical(value))).digest("hex");
}

function hasSensitiveValue(value, seen = new Set()) {
  if (value === null || typeof value !== "object") return typeof value === "string" && secretValue.test(value);
  if (seen.has(value)) return false;
  seen.add(value);
  if (Array.isArray(value)) return value.some((item) => hasSensitiveValue(item, seen));
  return Object.entries(value).some(([key, item]) => sensitiveKey(key) || hasSensitiveValue(item, seen));
}

function exactKeys(value, allowed) {
  return object(value) && Object.keys(value).every((key) => allowed.includes(key));
}

function normalizedPath(value) {
  const trimmed = value.replace(/^\/+|\/+$/g, "").replace(/\.git$/i, "");
  if (!trimmed || trimmed.split("/").some((part) => !part || part === "." || part === "..")) return null;
  return trimmed.toLowerCase();
}

/**
 * Produces a stable credential-free identity for common Git fetch URL forms.
 * It intentionally returns null for unknown schemes, user credentials, query
 * fragments, local paths, or malformed remotes instead of guessing.
 */
export function normalizeCanonicalRemote(remote) {
  if (!text(remote)) return null;
  const value = remote.trim();
  if (value.includes("?") || value.includes("#") || /:\/\//.test(value) && /:\/\/[^/]*@/.test(value)) return null;
  const scp = value.match(/^git@([A-Za-z0-9.-]+):(.+)$/);
  if (scp) {
    const path = normalizedPath(scp[2]);
    return path ? `${scp[1].toLowerCase()}/${path}` : null;
  }
  let parsed;
  try { parsed = new URL(value); } catch { return null; }
  if (!["https:", "ssh:"].includes(parsed.protocol) || parsed.username || parsed.password || parsed.port || parsed.search || parsed.hash) return null;
  const path = normalizedPath(parsed.pathname);
  return path && parsed.hostname ? `${parsed.hostname.toLowerCase()}/${path}` : null;
}

export function deriveRepositoryId(remote) {
  const identity = normalizeCanonicalRemote(remote);
  return identity ? `r1-${crypto.createHash("sha256").update(identity).digest("hex")}` : null;
}

function validBinding(value) {
  return object(value) && exactKeys(value, ["id", "digest"]) && text(value.id) && digest.test(value.digest);
}

function validParentSummary(value) {
  if (!object(value) || !exactKeys(value, PARENT_CHILD_SUMMARY_KEYS) || !identifier.test(value.workUnitId) ||
      !Number.isInteger(value.ordinal) || value.ordinal < 1 || !identifier.test(value.approvedChangeId) ||
      !text(value.terminalStatus) || !text(value.terminalReason) || !timestamp(value.startedAt) ||
      !timestamp(value.terminalAt) || !Number.isInteger(value.attemptCount) ||
      value.attemptCount < 0 || !Number.isInteger(value.correctionCount) || value.correctionCount < 0 ||
      !text(value.claimDisposition) || !text(value.cleanupDisposition) || !digest.test(value.terminalSummaryDigest)) return false;
  if (value.terminalStatus === "cancelled") {
    if (value.finalHead !== null || value.childHistoryReference !== null || value.childHistoryDigest !== null) return false;
  } else if (!text(value.finalHead) || !text(value.childHistoryReference) || !digest.test(value.childHistoryDigest)) {
    return false;
  }
  return Date.parse(value.terminalAt) >= Date.parse(value.startedAt);
}

function validConfigurationSnapshot(value) {
  if (!object(value) || !exactKeys(value, ["schemaVersion", "sources", "values"]) || value.schemaVersion !== 1 ||
      !Array.isArray(value.sources) || !object(value.values)) return false;
  const allowed = ["evidenceRoot", "claimProvider", "reviewAdapter"];
  if (Object.keys(value.values).some((key) => !allowed.includes(key))) return false;
  if (value.values.evidenceRoot !== undefined && !relativePath(value.values.evidenceRoot)) return false;
  for (const key of ["claimProvider", "reviewAdapter"]) {
    if (value.values[key] !== undefined && (!text(value.values[key]) || !/^[a-z0-9][a-z0-9-]*$/i.test(value.values[key]))) return false;
  }
  const sourced = value.sources.length === 1 && value.sources[0] === "config/ai-skills.json:runtime";
  return (Object.keys(value.values).length === 0 && value.sources.length === 0) || sourced;
}

export function validateParentRun(record) {
  if (!exactKeys(record, ["kind", "schemaVersion", "parentRunId", "approvedIntentDigest", "deadline", "historyBinding", "claimProviderBinding", "children"]) ||
      record.kind !== "parent-run" || record.schemaVersion !== RUN_CONTRACT_VERSION || !identifier.test(record.parentRunId) ||
      !digest.test(record.approvedIntentDigest) || !timestamp(record.deadline) || !validBinding(record.historyBinding) ||
      !validBinding(record.claimProviderBinding) || !Array.isArray(record.children) || record.children.length > 1 ||
      !record.children.every(validParentSummary) || hasSensitiveValue(record)) return false;
  return new Set(record.children.map((child) => child.workUnitId)).size === record.children.length;
}

export function validateWorkUnit(record) {
  if (!exactKeys(record, ["kind", "schemaVersion", "workUnitId", "parentRunId", "ordinal", "approvedChangeId", "authorizationDigest", "configurationSnapshot", "configurationDigest", "lifecycleState", "evidenceNamespace", "historyBinding", "claimProviderBinding"]) ||
      record.kind !== "work-unit" || record.schemaVersion !== RUN_CONTRACT_VERSION || !identifier.test(record.workUnitId) ||
      !identifier.test(record.parentRunId) || record.ordinal !== 1 || !identifier.test(record.approvedChangeId) ||
      !digest.test(record.authorizationDigest) || !validConfigurationSnapshot(record.configurationSnapshot) ||
      !digest.test(record.configurationDigest) || record.configurationDigest !== digestValue(record.configurationSnapshot) || !text(record.lifecycleState) ||
      !identifier.test(record.evidenceNamespace) || !validBinding(record.historyBinding) ||
      !validBinding(record.claimProviderBinding) || hasSensitiveValue(record)) return false;
  return true;
}

/** Accepts only the original v2 work-unit shape used before configuration snapshots existed. */
export function validateBootstrapPreSnapshotWorkUnit(record) {
  if (!exactKeys(record, ["kind", "schemaVersion", "workUnitId", "parentRunId", "ordinal", "approvedChangeId", "authorizationDigest", "configurationDigest", "lifecycleState", "evidenceNamespace", "historyBinding", "claimProviderBinding"]) ||
      record.kind !== "work-unit" || record.schemaVersion !== RUN_CONTRACT_VERSION || !identifier.test(record.workUnitId) ||
      !identifier.test(record.parentRunId) || record.ordinal !== 1 || !identifier.test(record.approvedChangeId) ||
      !digest.test(record.authorizationDigest) || !digest.test(record.configurationDigest) || !text(record.lifecycleState) ||
      !identifier.test(record.evidenceNamespace) || !validBinding(record.historyBinding) ||
      !validBinding(record.claimProviderBinding) || hasSensitiveValue(record)) return false;
  return true;
}

export function validateTransitionAttempt(record) {
  return exactKeys(record, ["kind", "schemaVersion", "attemptId", "workUnitId", "idempotencyKey", "preconditionDigest", "targetDigest", "ownershipGeneration", "state", "receipt", "result"]) &&
    record.kind === "transition-attempt" && record.schemaVersion === RUN_CONTRACT_VERSION && identifier.test(record.attemptId) &&
    identifier.test(record.workUnitId) && text(record.idempotencyKey) && digest.test(record.preconditionDigest) &&
    digest.test(record.targetDigest) && Number.isInteger(record.ownershipGeneration) && record.ownershipGeneration >= 1 &&
    ["prepared", "in-flight", "in-doubt", "completed"].includes(record.state) && object(record.receipt) && object(record.result) && !hasSensitiveValue(record);
}

export function validateResourceClaim(record) {
  return exactKeys(record, ["kind", "schemaVersion", "claimId", "repositoryId", "workUnitId", "owner", "ownershipGeneration", "providerBinding", "state", "acquiredAt", "recoveryEvidence"]) &&
    record.kind === "resource-claim" && record.schemaVersion === RUN_CONTRACT_VERSION && identifier.test(record.claimId) &&
    /^r1-[0-9a-f]{64}$/i.test(record.repositoryId) && identifier.test(record.workUnitId) && object(record.owner) &&
    Number.isInteger(record.ownershipGeneration) && record.ownershipGeneration >= 1 && validBinding(record.providerBinding) &&
    ["active", "released", "in-doubt"].includes(record.state) && timestamp(record.acquiredAt) && object(record.recoveryEvidence) && !hasSensitiveValue(record);
}

export function validateRepository(record) {
  return exactKeys(record, ["kind", "schemaVersion", "repositoryId", "canonicalRemoteDigest", "historyBinding", "claimProviderBinding"]) &&
    record.kind === "repository" && record.schemaVersion === RUN_CONTRACT_VERSION && /^r1-[0-9a-f]{64}$/i.test(record.repositoryId) &&
    digest.test(record.canonicalRemoteDigest) && validBinding(record.historyBinding) && validBinding(record.claimProviderBinding) && !hasSensitiveValue(record);
}

export function validateEvidence(record) {
  return exactKeys(record, ["kind", "schemaVersion", "evidenceId", "workUnitId", "subject", "contentDigest", "createdAt"]) &&
    record.kind === "evidence" && record.schemaVersion === RUN_CONTRACT_VERSION && identifier.test(record.evidenceId) &&
    identifier.test(record.workUnitId) && text(record.subject) && digest.test(record.contentDigest) && timestamp(record.createdAt) && !hasSensitiveValue(record);
}

export function validateProjection(record) {
  return exactKeys(record, ["kind", "schemaVersion", "parentRunId", "children"]) && record.kind === "projection" &&
    record.schemaVersion === RUN_CONTRACT_VERSION && identifier.test(record.parentRunId) && Array.isArray(record.children) &&
    record.children.length === 1 && record.children.every(validParentSummary) && !hasSensitiveValue(record);
}

export function validateArchiveManifest(record) {
  return exactKeys(record, ["kind", "schemaVersion", "parentRunId", "archivedAt", "reason", "projectionDigest"]) &&
    record.kind === "archive-manifest" && record.schemaVersion === RUN_CONTRACT_VERSION && identifier.test(record.parentRunId) &&
    timestamp(record.archivedAt) && text(record.reason) && digest.test(record.projectionDigest) && !hasSensitiveValue(record);
}

export function validateLegacyClassification(record) {
  return exactKeys(record, ["kind", "schemaVersion", "reference", "classification", "reason", "recordDigest"]) &&
    record.kind === "legacy-classification" && record.schemaVersion === RUN_CONTRACT_VERSION && text(record.reference) &&
    ["compatible-terminal", "active-legacy", "ambiguous"].includes(record.classification) && text(record.reason) &&
    digest.test(record.recordDigest) && !hasSensitiveValue(record);
}

export function validateClaimRelease(record) {
  if (!exactKeys(record, ["kind", "schemaVersion", "claimId", "repositoryId", "workUnitId", "disposition", "releasedAt", "terminalizationReceiptDigest", "cancellationReceiptDigest"]) ||
      record.kind !== "claim-release" || record.schemaVersion !== RUN_CONTRACT_VERSION || !identifier.test(record.claimId) ||
      !/^r1-[0-9a-f]{64}$/i.test(record.repositoryId) || !identifier.test(record.workUnitId) || record.disposition !== "released" ||
      !timestamp(record.releasedAt)) return false;
  const terminalization = record.terminalizationReceiptDigest !== undefined;
  const cancellation = record.cancellationReceiptDigest !== undefined;
  if (terminalization === cancellation) return false;
  return digest.test(terminalization ? record.terminalizationReceiptDigest : record.cancellationReceiptDigest) && !hasSensitiveValue(record);
}

export function validateTerminalizationReceipt(record) {
  return exactKeys(record, ["kind", "schemaVersion", "parentRunId", "workUnitId", "claimId", "repositoryId", "approvedChangeId", "requestDigest", "completionEvidenceDigest", "terminalSummary", "createdAt"]) &&
    record.kind === "terminalization-receipt" && record.schemaVersion === RUN_CONTRACT_VERSION && identifier.test(record.parentRunId) &&
    identifier.test(record.workUnitId) && identifier.test(record.claimId) && /^r1-[0-9a-f]{64}$/i.test(record.repositoryId) &&
    identifier.test(record.approvedChangeId) && digest.test(record.requestDigest) && digest.test(record.completionEvidenceDigest) &&
    validParentSummary(record.terminalSummary) && timestamp(record.createdAt) && !hasSensitiveValue(record);
}

export function validateCancellationReceipt(record) {
  return exactKeys(record, ["kind", "schemaVersion", "controllerRunId", "parentRunId", "workUnitId", "claimId", "repositoryId", "approvedChangeId", "requestDigest", "expiresAt", "createdAt"]) &&
    record.kind === "cancellation-receipt" && record.schemaVersion === RUN_CONTRACT_VERSION && identifier.test(record.controllerRunId) &&
    identifier.test(record.parentRunId) && identifier.test(record.workUnitId) && identifier.test(record.claimId) &&
    /^r1-[0-9a-f]{64}$/i.test(record.repositoryId) && identifier.test(record.approvedChangeId) &&
    digest.test(record.requestDigest) && timestamp(record.expiresAt) && timestamp(record.createdAt) && !hasSensitiveValue(record);
}

export function validateDomainRecord(record) {
  if (!object(record) || !RECORD_KINDS.includes(record.kind)) return { valid: false, reason: "unknown-record-kind" };
  const validators = {
    repository: validateRepository,
    "parent-run": validateParentRun,
    "work-unit": validateWorkUnit,
    "transition-attempt": validateTransitionAttempt,
    "resource-claim": validateResourceClaim,
    evidence: validateEvidence,
    projection: validateProjection,
    "archive-manifest": validateArchiveManifest,
    "legacy-classification": validateLegacyClassification,
    "claim-release": validateClaimRelease,
    "terminalization-receipt": validateTerminalizationReceipt,
    "cancellation-receipt": validateCancellationReceipt
  };
  const valid = validators[record.kind]?.(record) ?? false;
  return valid ? { valid: true, digest: digestValue(record) } : { valid: false, reason: "invalid-domain-record" };
}

export function buildParentProjection(parentRun, workUnit, terminalSummary, { allowBootstrapPreSnapshot = false } = {}) {
  if (!validateParentRun(parentRun) || !(validateWorkUnit(workUnit) || (allowBootstrapPreSnapshot && validateBootstrapPreSnapshotWorkUnit(workUnit))) || workUnit.parentRunId !== parentRun.parentRunId ||
      !validParentSummary(terminalSummary) || terminalSummary.workUnitId !== workUnit.workUnitId) {
    return { valid: false, reason: "parent-projection-input-invalid" };
  }
  return {
    valid: true,
    projection: {
      kind: "projection",
      schemaVersion: RUN_CONTRACT_VERSION,
      parentRunId: parentRun.parentRunId,
      children: [canonical(terminalSummary)]
    }
  };
}

export function serializeDomainRecord(record) {
  const validation = validateDomainRecord(record);
  return validation.valid ? { valid: true, content: `${JSON.stringify(canonical(record))}\n`, digest: validation.digest } : validation;
}

export function deserializeDomainRecord(content) {
  if (!text(content)) return { valid: false, reason: "record-content-invalid" };
  try { return validateDomainRecord(JSON.parse(content)); } catch { return { valid: false, reason: "record-json-invalid" }; }
}
