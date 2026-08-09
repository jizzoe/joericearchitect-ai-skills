#!/usr/bin/env node
import fs from "node:fs";

const HUMAN_DECISION_REASONS = new Set([
  "material-requirement",
  "architecture-choice",
  "compatibility-change",
  "data-ownership",
  "license-obligation",
  "governance",
  "credential",
  "destructive-action",
  "unexpected-external-target",
  "dependency-ambiguity",
  "durable-state-conflict"
]);

const OBJECTIVE_FIX_REASONS = new Set([
  "format",
  "lint",
  "type",
  "schema",
  "deterministic-test",
  "link",
  "generated-exposure",
  "stale-fixture",
  "narrow-review"
]);

function readJson(path) {
  return JSON.parse(fs.readFileSync(path, "utf8"));
}

export function classifyResult(input) {
  const reason = input.reason ?? "";
  const attempts = Number(input.attempts ?? 0);
  const materiallyDifferentAttempts = Number(input.materiallyDifferentAttempts ?? attempts);

  if (input.falsePositive === true) {
    return { classification: "false-positive", shouldPause: false };
  }

  if (materiallyDifferentAttempts >= 3 && input.resolved !== true) {
    return {
      classification: "blocked",
      shouldPause: true,
      code: "correction-budget-exhausted"
    };
  }

  if (input.environmentPersistent === true) {
    return {
      classification: "environment-impasse",
      shouldPause: true
    };
  }

  if (HUMAN_DECISION_REASONS.has(reason)) {
    return {
      classification: "human-decision",
      shouldPause: true,
      reason
    };
  }

  if (OBJECTIVE_FIX_REASONS.has(reason) && input.behaviorPreserving !== false) {
    return {
      classification: "objective-fix",
      shouldPause: false,
      rerunAffectedChecks: true,
      reason
    };
  }

  if (input.warning === true) {
    return {
      classification: "warning",
      shouldPause: false,
      reason
    };
  }

  return {
    classification: "human-decision",
    shouldPause: true,
    reason: reason || "unclassified"
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const inputPath = process.argv[2];
  if (!inputPath) {
    console.error("Usage: classify-result.mjs <input.json>");
    process.exit(2);
  }
  const result = classifyResult(readJson(inputPath));
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.shouldPause ? 1 : 0);
}
