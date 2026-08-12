#!/usr/bin/env node
import fs from "node:fs";

function readJson(path) {
  return JSON.parse(fs.readFileSync(path, "utf8"));
}

function evidenceCurrent(step) {
  return step.evidence?.present === true && step.evidence?.current === true;
}

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
    if ((record.kind === "branch" || record.kind === "pr") && (!record.baseBranch || !record.headCommit)) return "derived-record-missing-linkage";
  }
  return null;
}

export function inspectCheckpoint(input) {
  const steps = input.steps ?? [];
  const recordIssue = invalidDerivedRecord(input);
  if (recordIssue) return { classification: "human-decision", firstIncomplete: null, reason: recordIssue };

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
