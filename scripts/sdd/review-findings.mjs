const materialTerms = /requirement|architecture|security|compatib|licens|governance|scope/i;
const allowed = new Set(["objective-fix", "warning", "false-positive", "human-decision"]);
const severity = new Set(["blocker", "high", "objective-fix", "warning", "false-positive"]);
const text = (value) => typeof value === "string" && value.trim().length > 0;
const pause = (code, detail) => ({ allowed: false, classification: "paused", issues: [{ code, ...(detail ? { detail } : {}) }] });

export function validateFindingDispositions({ findings, dispositions, correctionAttempts = 0, correctionAttemptsByFailureSignature } = {}) {
  if (!Array.isArray(findings) || !Array.isArray(dispositions) || !findings.every((item) => text(item?.id) && severity.has(item.severity))) return pause("independent-review-findings-malformed");
  const ids = new Set();
  for (const finding of findings) {
    if (ids.has(finding.id)) return pause("independent-review-finding-duplicate", finding.id);
    ids.add(finding.id);
    const disposition = dispositions.find((item) => item?.findingId === finding.id);
    if (!disposition || !allowed.has(disposition.kind) || !text(disposition.evidence)) return pause("independent-review-disposition-missing", finding.id);
    if (finding.severity === "blocker" || finding.severity === "high" || materialTerms.test(`${finding.recommendation ?? ""} ${disposition.evidence}`) || disposition.kind === "human-decision") return pause("independent-review-human-decision", finding.id);
    const signature = disposition.failureSignature ?? finding.id;
    const signatureAttempts = correctionAttemptsByFailureSignature?.[signature] ?? correctionAttempts;
    if (disposition.kind === "objective-fix" && Number(signatureAttempts) >= 3) return pause("correction-limit-exhausted", signature);
  }
  return { allowed: true, classification: "ready", issues: [] };
}

export function nextReviewState({ priorHead, currentHead, findings, dispositions, correctionAttempts = 0, correctionAttemptsByFailureSignature }) {
  if (priorHead !== currentHead) return { state: "rereview-required", reason: "head-changed" };
  const result = validateFindingDispositions({ findings, dispositions, correctionAttempts, correctionAttemptsByFailureSignature });
  return result.allowed ? { state: "reviewable", reason: "dispositions-current" } : { state: "paused", reason: result.issues[0].code };
}
