import path from "node:path";

const commit = (value) => typeof value === "string" && /^(?:[0-9a-f]{40}|[0-9a-f]{64})$/.test(value);
const digest = (value) => typeof value === "string" && /^[0-9a-f]{64}$/.test(value);
const text = (value) => typeof value === "string" && value.trim().length > 0;
const encodeBoundary = (value) => value.replaceAll("%", "%25").replaceAll("/", "%2F");
const stableToken = (value) => text(value) && /^[a-z0-9][a-z0-9._:-]*$/i.test(value.trim())
  ? value.trim().toLowerCase()
  : null;
const repositoryPath = (value) => {
  if (!text(value) || path.isAbsolute(value) || /^[A-Za-z]:[\\/]/.test(value)) return null;
  const normalized = path.posix.normalize(value.replaceAll("\\", "/").replace(/^\.\//, ""));
  return normalized !== "." && !normalized.split("/").includes("..") ? normalized : null;
};

export function canonicalCorrectionDimensions(input) {
  const gate = stableToken(input?.gate ?? input?.command);
  const errorClass = stableToken(input?.errorClass);
  const transition = stableToken(input?.transition);
  const taskBatch = stableToken(input?.taskBatch);
  const artifact = input?.artifact === undefined ? null : repositoryPath(input.artifact);
  const exactTarget = input?.exactTarget === undefined ? null : (text(input.exactTarget) ? input.exactTarget.trim() : null);
  if (!gate || !errorClass || !transition || !taskBatch || Boolean(artifact) === Boolean(exactTarget)) return null;
  return Object.freeze({ gate, errorClass, artifact, exactTarget, transition, taskBatch });
}

export function canonicalCorrectionSignature(input) {
  const dimensions = canonicalCorrectionDimensions(input);
  if (!dimensions) return null;
  const target = dimensions.artifact ? `artifact:${dimensions.artifact}` : `target:${dimensions.exactTarget}`;
  return `correction-v2/${[dimensions.gate, dimensions.errorClass, target, dimensions.transition, dimensions.taskBatch].map(encodeBoundary).join("/")}`;
}

export function canonicalFailureSignature(source) {
  if (!source) return null;
  if (source.signatureVersion === 2 || source.canonicalDimensions) {
    return text(source.evidence) ? canonicalCorrectionSignature(source.canonicalDimensions) : null;
  }
  if (!text(source.evidence) || !text(source.transition)) return null;
  if (source.kind === "verification") {
    return text(source.verificationRecordId) && text(source.failureSignature)
      ? source.failureSignature
      : null;
  }
  if (source.kind !== "independent-review" || !text(source.reviewRecordId) ||
      !text(source.findingId) || !text(source.severity)) return null;
  // Evidence is intentionally preserved for compatibility with durable v1
  // correction chains. Escaping the two boundary fields makes the framing
  // unambiguous even when finding IDs or transitions contain the delimiter;
  // escaping '%' first prevents encoded and literal values from colliding.
  return `independent-review/${encodeBoundary(source.findingId)}/${source.evidence}/${encodeBoundary(source.transition)}`;
}

export function inspectCorrectionChain(records, { selectedEntry, anchor, maxPerFailureSignature = 3 } = {}) {
  if (!Array.isArray(records)) return { valid: false, reason: "selected-entry-invalid-correction-records" };
  if (records.length === 0) return { valid: true, attemptsByFailureSignature: new Map(), aggregateAttempts: 0, distinctFailureSignatures: 0, stagnationByFailureSignature: new Map(), exhaustedFailureSignatures: [], intervention: null };
  if (!anchor || !commit(anchor.baseCommit) || !commit(anchor.headCommit) || !digest(anchor.manifestDigest) ||
      !Number.isInteger(maxPerFailureSignature) || maxPerFailureSignature < 0 || maxPerFailureSignature > 3) {
    return { valid: false, reason: "invalid-objective-correction-anchor" };
  }
  const ids = new Set();
  const attemptsByFailureSignature = new Map();
  const stagnationByFailureSignature = new Map();
  const latestByFailureSignature = new Map();
  let priorHead = anchor.headCommit;
  let priorManifestDigest = anchor.manifestDigest;
  for (let index = 0; index < records.length; index += 1) {
    const record = records[index];
    const failureSignature = canonicalFailureSignature(record?.failureSource);
    if (!record || !text(record.id) || ids.has(record.id) || record.change !== selectedEntry ||
        record.attempt !== index + 1 || record.classification !== "objective-fix" ||
        record.behaviorPreserving !== true || record.current !== true || record.ancestryVerified !== true ||
        !failureSignature || record.failureSignature !== failureSignature || !text(record.evidenceReference) ||
        record.baseCommit !== anchor.baseCommit || record.previousHead !== priorHead ||
        record.previousManifestDigest !== priorManifestDigest || !commit(record.headCommit) ||
        !digest(record.manifestDigest)) {
      return { valid: false, reason: "invalid-objective-correction-record" };
    }
    const signatureAttempts = (attemptsByFailureSignature.get(failureSignature) ?? 0) + 1;
    if (signatureAttempts > maxPerFailureSignature) {
      return { valid: false, reason: "selected-entry-invalid-correction-records" };
    }
    attemptsByFailureSignature.set(failureSignature, signatureAttempts);
    if (record.signatureVersion === 2) {
      const previous = latestByFailureSignature.get(failureSignature);
      const derivedStagnation = previous?.strategyDigest === record.strategyDigest &&
        previous?.diagnosticEvidenceDigest === record.diagnosticEvidenceDigest;
      if (record.signatureAttempt !== signatureAttempts || !text(record.diagnosticHypothesis) ||
          !Array.isArray(record.affectedArtifacts) || record.affectedArtifacts.length === 0 ||
          record.affectedArtifacts.some((item) => !repositoryPath(item)) || !digest(record.strategyDigest) ||
          !digest(record.diagnosticEvidenceDigest) || !["passed", "failed"].includes(record.result) ||
          !Array.isArray(record.rerunEvidenceIds) || record.rerunEvidenceIds.length === 0 ||
          record.rerunEvidenceIds.some((item) => !text(item)) || record.stagnation !== derivedStagnation) {
        return { valid: false, reason: "invalid-objective-correction-record" };
      }
      if (derivedStagnation) stagnationByFailureSignature.set(failureSignature, (stagnationByFailureSignature.get(failureSignature) ?? 0) + 1);
      latestByFailureSignature.set(failureSignature, record);
    }
    ids.add(record.id);
    priorHead = record.headCommit;
    priorManifestDigest = record.manifestDigest;
  }
  const exhaustedFailureSignatures = [...latestByFailureSignature]
    .filter(([signature, record]) => record.result === "failed" && attemptsByFailureSignature.get(signature) >= maxPerFailureSignature)
    .map(([signature]) => signature)
    .sort();
  return {
    valid: true,
    attemptsByFailureSignature,
    aggregateAttempts: records.length,
    distinctFailureSignatures: attemptsByFailureSignature.size,
    stagnationByFailureSignature,
    exhaustedFailureSignatures,
    intervention: exhaustedFailureSignatures.length
      ? {
          classification: "blocked",
          reason: "correction-limit-exhausted",
          failureSignatures: exhaustedFailureSignatures,
          recoveryReference: "obtain human direction with the durable attempts and current rerun evidence"
        }
      : null,
    headCommit: priorHead,
    manifestDigest: priorManifestDigest
  };
}
