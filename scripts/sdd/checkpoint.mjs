#!/usr/bin/env node
import fs from "node:fs";

function readJson(path) {
  return JSON.parse(fs.readFileSync(path, "utf8"));
}

function evidenceCurrent(step) {
  return step.evidence?.present === true && step.evidence?.current === true;
}
function commitReference(value) { return typeof value === "string" && /^(?:[0-9a-f]{40}|[0-9a-f]{64})$/i.test(value); }

function invalidDerivedRecord(input) {
  const checkpoint = input.selectedEntry;
  if (!checkpoint) return null;
  if (typeof checkpoint.name !== "string" || !checkpoint.name.trim()) return "selected-entry-missing-name";
  if (!Array.isArray(checkpoint.records)) return "selected-entry-missing-records";
  const seen = new Set();
  for (const record of checkpoint.records) {
    const key = `${record?.kind}:${record?.id}`;
    if (!record || typeof record.kind !== "string" || typeof record.id !== "string" || seen.has(key)) return "invalid-derived-record";
    seen.add(key);
    if (record.entry !== checkpoint.name || !record.repository) return "derived-record-linkage-mismatch";
    if (!record.evidence || typeof record.evidence.reference !== "string" || !record.evidence.reference || record.evidence.current !== true) return "derived-record-missing-current-evidence";
    if ((record.kind === "branch" || record.kind === "pr") && (!record.baseBranch || !commitReference(record.headCommit))) return "derived-record-missing-linkage";
    if ((record.kind === "branch" || record.kind === "pr") && record.evidence.headCommit !== record.headCommit) return "derived-record-evidence-head-mismatch";
  }
  return null;
}

function invalidReviewRecord(input) {
  const entry = input.selectedEntry;
  if (!entry || entry.reviewRecords === undefined) return null;
  if (!Array.isArray(entry.reviewRecords)) return "selected-entry-invalid-review-records";
  const seen = new Set();
  for (const record of entry.reviewRecords) {
    if (!record || typeof record.id !== "string" || !record.id || seen.has(record.id) ||
        typeof record.transition !== "string" || !record.transition || !record.evidence ||
        record.entry !== entry.name) return "invalid-independent-review-record";
    seen.add(record.id);
  }
  return null;
}

function invalidApplyEvidenceRecord(input) {
  const entry = input.selectedEntry;
  if (!entry || entry.applyEvidenceRecords === undefined) return null;
  if (!Array.isArray(entry.applyEvidenceRecords)) return "selected-entry-invalid-apply-evidence-records";
  const seen = new Set();
  for (const evidence of entry.applyEvidenceRecords) {
    if (!evidence || typeof evidence.reference !== "string" || !evidence.reference || seen.has(evidence.reference) ||
        evidence.current !== true || !commitReference(evidence.headCommit) ||
        typeof evidence.completedAt !== "string" || Number.isNaN(Date.parse(evidence.completedAt)) ||
        !Array.isArray(evidence.validationEvidence) || evidence.validationEvidence.length === 0 ||
        !evidence.validationEvidence.every((item) => typeof item === "string" && item.trim())) return "invalid-apply-evidence-record";
    seen.add(evidence.reference);
  }
  return null;
}

export function inspectCheckpoint(input) {
  const steps = input.steps ?? [];
  const recordIssue = invalidDerivedRecord(input);
  if (recordIssue) return { classification: "human-decision", firstIncomplete: null, reason: recordIssue };
  const reviewIssue = invalidReviewRecord(input);
  if (reviewIssue) return { classification: "human-decision", firstIncomplete: null, reason: reviewIssue };
  const applyEvidenceIssue = invalidApplyEvidenceRecord(input);
  if (applyEvidenceIssue) return { classification: "human-decision", firstIncomplete: null, reason: applyEvidenceIssue };

  const conflict = steps.find((step) => step.durableConflict === true);
  if (conflict) {
    return {
      classification: "human-decision",
      firstIncomplete: conflict.id,
      reason: "durable-state-conflict"
    };
  }

  const stale = steps.find(
    (step) => step.status === "complete" && !evidenceCurrent(step)
  );
  if (stale) {
    return {
      classification: "stale-evidence",
      firstIncomplete: stale.id,
      reason: "completed-step-lacks-current-evidence"
    };
  }

  const incomplete = steps.find((step) => step.status !== "complete");
  if (incomplete) {
    return {
      classification: "continue",
      firstIncomplete: incomplete.id,
      reason: "first-incomplete-step"
    };
  }

  return {
    classification: "no-op",
    firstIncomplete: null,
    reason: "all-durable-steps-complete"
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const inputPath = process.argv[2];
  if (!inputPath) {
    console.error("Usage: checkpoint.mjs <input.json>");
    process.exit(2);
  }
  const result = inspectCheckpoint(readJson(inputPath));
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.classification === "human-decision" ? 1 : 0);
}
