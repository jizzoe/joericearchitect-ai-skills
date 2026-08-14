const commit = (value) => typeof value === "string" && /^(?:[0-9a-f]{40}|[0-9a-f]{64})$/.test(value);
const digest = (value) => typeof value === "string" && /^[0-9a-f]{64}$/.test(value);
const text = (value) => typeof value === "string" && value.trim().length > 0;
const encodeBoundary = (value) => value.replaceAll("%", "%25").replaceAll("/", "%2F");

export function canonicalFailureSignature(source) {
  if (!source || source.kind !== "independent-review" || !text(source.reviewRecordId) ||
      !text(source.findingId) || !text(source.severity) || !text(source.evidence) ||
      !text(source.transition)) return null;
  // Evidence is intentionally preserved for compatibility with durable v1
  // correction chains. Escaping the two boundary fields makes the framing
  // unambiguous even when finding IDs or transitions contain the delimiter;
  // escaping '%' first prevents encoded and literal values from colliding.
  return `independent-review/${encodeBoundary(source.findingId)}/${source.evidence}/${encodeBoundary(source.transition)}`;
}

export function inspectCorrectionChain(records, { selectedEntry, anchor, maxPerFailureSignature = 3 } = {}) {
  if (!Array.isArray(records)) return { valid: false, reason: "selected-entry-invalid-correction-records" };
  if (records.length === 0) return { valid: true, attemptsByFailureSignature: new Map() };
  if (!anchor || !commit(anchor.baseCommit) || !commit(anchor.headCommit) || !digest(anchor.manifestDigest) ||
      !Number.isInteger(maxPerFailureSignature) || maxPerFailureSignature < 0 || maxPerFailureSignature > 3) {
    return { valid: false, reason: "invalid-objective-correction-anchor" };
  }
  const ids = new Set();
  const attemptsByFailureSignature = new Map();
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
    ids.add(record.id);
    priorHead = record.headCommit;
    priorManifestDigest = record.manifestDigest;
  }
  return { valid: true, attemptsByFailureSignature, headCommit: priorHead, manifestDigest: priorManifestDigest };
}
