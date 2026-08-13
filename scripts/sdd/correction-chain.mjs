const text = (value) => typeof value === "string" && value.trim().length > 0;

export function canonicalFailureSignature(source) {
  if (!source || source.kind !== "independent-review" || !text(source.reviewRecordId) ||
      !text(source.findingId) || !text(source.severity) || !text(source.evidence) ||
      !text(source.transition)) return null;
  return `independent-review/${source.findingId}/${source.evidence}/${source.transition}`;
}
