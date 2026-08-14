const allowed = new Set(["objective-fix", "warning", "false-positive", "human-decision"]);
const severity = new Set(["blocker", "high", "objective-fix", "warning", "false-positive"]);
const compatibleDispositions = Object.freeze({
  blocker: new Set(["objective-fix", "human-decision"]),
  high: new Set(["objective-fix", "human-decision"]),
  "objective-fix": new Set(["objective-fix", "human-decision"]),
  warning: new Set(["warning", "human-decision"]),
  "false-positive": new Set(["false-positive", "human-decision"])
});
const text = (value) => typeof value === "string" && value.trim().length > 0;
const pause = (code, detail) => ({ allowed: false, classification: "paused", issues: [{ code, ...(detail ? { detail } : {}) }] });
const correction = (detail) => ({ allowed: false, classification: "objective-fix", issues: [{ code: "independent-review-objective-fix-required", detail }] });

export function validateFindingDispositions({ findings, dispositions, correctionAttempts = 0, correctionAttemptsByFailureSignature } = {}) {
  if (!Array.isArray(findings) || !Array.isArray(dispositions) || !findings.every((item) => text(item?.id) && severity.has(item.severity))) return pause("independent-review-findings-malformed");
  const ids = new Set();
  const dispositionIds = new Set();
  for (const disposition of dispositions) {
    if (!text(disposition?.findingId) || dispositionIds.has(disposition.findingId)) return pause("independent-review-dispositions-malformed", disposition?.findingId);
    dispositionIds.add(disposition.findingId);
  }
  if (dispositions.length !== findings.length) return pause("independent-review-disposition-count-mismatch");
  for (const finding of findings) {
    if (ids.has(finding.id)) return pause("independent-review-finding-duplicate", finding.id);
    ids.add(finding.id);
    const disposition = dispositions.find((item) => item?.findingId === finding.id);
    if (!disposition || !allowed.has(disposition.kind) || !text(disposition.evidence)) return pause("independent-review-disposition-missing", finding.id);
    if (!compatibleDispositions[finding.severity].has(disposition.kind)) return pause("independent-review-disposition-incompatible", finding.id);
    if (disposition.kind === "human-decision") return pause("independent-review-human-decision", finding.id);
    const signature = disposition.failureSignature ?? finding.id;
    const signatureAttempts = correctionAttemptsByFailureSignature?.[signature] ?? correctionAttempts;
    if (disposition.kind === "objective-fix" && Number(signatureAttempts) >= 3) return pause("correction-limit-exhausted", signature);
    if (disposition.kind === "objective-fix") return correction(signature);
  }
  return { allowed: true, classification: "ready", issues: [] };
}

export function nextReviewState({ priorHead, currentHead, findings, dispositions, correctionAttempts = 0, correctionAttemptsByFailureSignature }) {
  if (priorHead !== currentHead) return { state: "rereview-required", reason: "head-changed" };
  const result = validateFindingDispositions({ findings, dispositions, correctionAttempts, correctionAttemptsByFailureSignature });
  if (result.allowed) return { state: "reviewable", reason: "dispositions-current" };
  if (result.classification === "objective-fix") return { state: "correction-required", reason: result.issues[0].code };
  return { state: "paused", reason: result.issues[0].code };
}
