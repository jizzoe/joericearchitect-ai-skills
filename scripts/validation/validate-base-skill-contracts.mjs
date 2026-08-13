#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const kebab = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const resultStatuses = new Set(["completed", "paused", "blocked", "no-op"]);
const modes = new Set(["interactive", "autonomous"]);
const artifactKinds = new Set(["file", "record", "external-state", "other"]);
const artifactOperations = new Set(["read", "created", "updated", "unchanged"]);
const evidenceTypes = new Set(["command", "validation", "test", "review", "screenshot", "accessibility", "record", "other"]);
const evidenceResults = new Set(["passed", "failed", "not-applicable", "informational"]);
const nextActionKinds = new Set(["continue", "user-decision", "resume", "openspec-explore", "openspec-propose", "none"]);
export const operationVocabulary = new Set(["read-source", "write-findings", "write-sources", "write-result", "read-workspace", "local-edit", "run-test", "run-validation", "objective-correction", "read-tracker", "backup-tracker", "upsert-allowlisted-record", "write-reconciliation-report", "issue-create-or-update", "project-update", "draft-pr-create-or-update", "run-lifecycle-action", "notify-state"]);
const secretPattern = /(password|secret|token|apikey|api[_-]?key|refresh[_-]?token|authorization|bearer\s+|oauth|otp|mfa|private[_-]?key)/i;

function issue(code, subject, detail) {
  return { code, subject, ...(detail ? { detail } : {}) };
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function nonEmpty(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function workspacePath(value) {
  return nonEmpty(value) && !path.isAbsolute(value) && !/^[A-Za-z]:[\\/]/.test(value) && !value.split(/[\\/]/).includes("..");
}

function exactKeys(value, allowed, subject, issues) {
  if (!isObject(value)) {
    issues.push(issue("invalid-object", subject));
    return false;
  }
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) issues.push(issue("unknown-key", `${subject}.${key}`));
  }
  return true;
}

function required(value, keys, subject, issues) {
  for (const key of keys) if (!(key in value)) issues.push(issue("missing-required", `${subject}.${key}`));
}

export function validateSkillResult(value) {
  const issues = [];
  if (!exactKeys(value, new Set(["schemaVersion", "skill", "status", "mode", "summary", "artifacts", "evidence", "assumptions", "openQuestions", "nextAction", "details"]), "result", issues)) return { valid: false, issues };
  required(value, ["schemaVersion", "skill", "status", "mode", "summary", "artifacts", "evidence", "assumptions", "openQuestions", "nextAction"], "result", issues);
  if (value.schemaVersion !== 1) issues.push(issue("unsupported-schema-version", "result.schemaVersion"));
  if (!nonEmpty(value.skill) || !kebab.test(value.skill)) issues.push(issue("invalid-skill", "result.skill"));
  if (!resultStatuses.has(value.status)) issues.push(issue("invalid-status", "result.status"));
  if (!modes.has(value.mode)) issues.push(issue("invalid-mode", "result.mode"));
  if (!nonEmpty(value.summary)) issues.push(issue("invalid-summary", "result.summary"));
  if ("details" in value && !isObject(value.details)) issues.push(issue("invalid-details", "result.details"));
  validateArtifacts(value.artifacts, issues);
  validateEvidence(value.evidence, issues);
  validateAssumptions(value.assumptions, issues);
  validateQuestions(value.openQuestions, issues);
  validateNextAction(value.nextAction, issues);
  return { valid: issues.length === 0, issues };
}

export function createBlockedSkillResult(issues, { mode = "interactive" } = {}) {
  return {
    schemaVersion: 1,
    skill: "contract-validator",
    status: "blocked",
    mode,
    summary: "The supplied skill contract is invalid.",
    artifacts: [],
    evidence: (issues ?? []).map((item, index) => ({
      id: `validation-${index + 1}`,
      type: "validation",
      subject: item.subject ?? item.code ?? "contract validation",
      result: "failed"
    })),
    assumptions: [],
    openQuestions: [{ id: "correct-contract", question: "Correct the reported contract validation failures.", blocking: true }],
    nextAction: { kind: "user-decision", description: "Provide a valid contract input before continuing." }
  };
}

export function renderSkillResultMarkdown(value) {
  const validation = validateSkillResult(value);
  if (!validation.valid) throw new Error(`Cannot render invalid skill result: ${validation.issues.map((item) => item.code).join(", ")}`);
  const lines = [`# ${value.skill}`, "", value.summary, "", `Status: ${value.status}`, `Mode: ${value.mode}`];
  if (value.artifacts.length) lines.push("", "## Artifacts", ...value.artifacts.map((item) => `- ${item.operation}: ${item.subject}`));
  if (value.evidence.length) lines.push("", "## Evidence", ...value.evidence.map((item) => `- ${item.id}: ${item.result} — ${item.subject}`));
  if (value.assumptions.length) lines.push("", "## Assumptions", ...value.assumptions.map((item) => `- ${item}`));
  if (value.openQuestions.length) lines.push("", "## Open Questions", ...value.openQuestions.map((item) => `- ${item.question}`));
  lines.push("", "## Next Action", `${value.nextAction.kind}: ${value.nextAction.description}`);
  return `${lines.join("\n")}\n`;
}

function validateArtifacts(items, issues) {
  if (!Array.isArray(items)) return issues.push(issue("invalid-array", "result.artifacts"));
  items.forEach((item, index) => {
    const subject = `result.artifacts[${index}]`;
    if (!exactKeys(item, new Set(["kind", "operation", "subject"]), subject, issues)) return;
    required(item, ["kind", "operation", "subject"], subject, issues);
    if (!artifactKinds.has(item.kind)) issues.push(issue("invalid-artifact-kind", `${subject}.kind`));
    if (!artifactOperations.has(item.operation)) issues.push(issue("invalid-artifact-operation", `${subject}.operation`));
    if (!nonEmpty(item.subject)) issues.push(issue("invalid-artifact-subject", `${subject}.subject`));
    if (item.kind === "file" && !workspacePath(item.subject)) issues.push(issue("unsafe-workspace-path", `${subject}.subject`));
  });
}

function validateEvidence(items, issues) {
  if (!Array.isArray(items)) return issues.push(issue("invalid-array", "result.evidence"));
  const ids = new Set();
  items.forEach((item, index) => {
    const subject = `result.evidence[${index}]`;
    if (!exactKeys(item, new Set(["id", "type", "subject", "result", "reference"]), subject, issues)) return;
    required(item, ["id", "type", "subject", "result"], subject, issues);
    if (!nonEmpty(item.id)) issues.push(issue("invalid-evidence-id", `${subject}.id`));
    else if (ids.has(item.id)) issues.push(issue("duplicate-evidence-id", `${subject}.id`));
    else ids.add(item.id);
    if (!evidenceTypes.has(item.type)) issues.push(issue("invalid-evidence-type", `${subject}.type`));
    if (!nonEmpty(item.subject)) issues.push(issue("invalid-evidence-subject", `${subject}.subject`));
    if (!evidenceResults.has(item.result)) issues.push(issue("invalid-evidence-result", `${subject}.result`));
    if ("reference" in item && (!nonEmpty(item.reference) || secretPattern.test(item.reference))) issues.push(issue("unsafe-evidence-reference", `${subject}.reference`));
  });
}

function validateAssumptions(items, issues) {
  if (!Array.isArray(items)) return issues.push(issue("invalid-array", "result.assumptions"));
  items.forEach((item, index) => { if (!nonEmpty(item)) issues.push(issue("invalid-assumption", `result.assumptions[${index}]`)); });
}

function validateQuestions(items, issues) {
  if (!Array.isArray(items)) return issues.push(issue("invalid-array", "result.openQuestions"));
  const ids = new Set();
  items.forEach((item, index) => {
    const subject = `result.openQuestions[${index}]`;
    if (!exactKeys(item, new Set(["id", "question", "blocking"]), subject, issues)) return;
    required(item, ["id", "question", "blocking"], subject, issues);
    if (!nonEmpty(item.id)) issues.push(issue("invalid-question-id", `${subject}.id`));
    else if (ids.has(item.id)) issues.push(issue("duplicate-question-id", `${subject}.id`));
    else ids.add(item.id);
    if (!nonEmpty(item.question)) issues.push(issue("invalid-question", `${subject}.question`));
    if (typeof item.blocking !== "boolean") issues.push(issue("invalid-question-blocking", `${subject}.blocking`));
  });
}

function validateNextAction(value, issues) {
  if (!exactKeys(value, new Set(["kind", "description"]), "result.nextAction", issues)) return;
  required(value, ["kind", "description"], "result.nextAction", issues);
  if (!nextActionKinds.has(value.kind)) issues.push(issue("invalid-next-action-kind", "result.nextAction.kind"));
  if (!nonEmpty(value.description)) issues.push(issue("invalid-next-action-description", "result.nextAction.description"));
}

export function validateAiSkillsConfig(value, { present = true } = {}) {
  if (!present || value === undefined || value === null) return { valid: true, requiresExplicitPaths: true, issues: [] };
  const issues = [];
  if (!exactKeys(value, new Set(["schemaVersion", "defaults", "paths", "adapters", "policies", "featureFlags", "independentReview"]), "config", issues)) return { valid: false, requiresExplicitPaths: false, issues };
  required(value, ["schemaVersion"], "config", issues);
  if (value.schemaVersion !== 1) issues.push(issue("unsupported-schema-version", "config.schemaVersion"));
  validateDefaults(value.defaults, issues);
  validateNamedPaths(value.paths, "config.paths", issues);
  validateAdapters(value.adapters, issues);
  validateStringMap(value.policies, "config.policies", issues);
  validateFeatureFlags(value.featureFlags, issues);
  validateIndependentReviewConfig(value.independentReview, issues);
  return { valid: issues.length === 0, requiresExplicitPaths: false, issues };
}

export function validateIndependentReviewConfig(value, issues = []) {
  if (value === undefined) return { valid: issues.length === 0, issues };
  if (!isObject(value) || !exactKeys(value, new Set(["enabled", "adapter", "attestationRef", "reviewPath", "allowedCommands", "artifactPaths", "evidenceRoot"]), "config.independentReview", issues)) return { valid: false, issues };
  required(value, ["enabled", "adapter", "attestationRef", "reviewPath", "allowedCommands", "artifactPaths", "evidenceRoot"], "config.independentReview", issues);
  if (typeof value.enabled !== "boolean") issues.push(issue("invalid-independent-review-enabled", "config.independentReview.enabled"));
  if (!kebab.test(value.adapter ?? "")) issues.push(issue("invalid-independent-review-adapter", "config.independentReview.adapter"));
  for (const key of ["attestationRef", "reviewPath", "evidenceRoot"]) if (!workspacePath(value[key])) issues.push(issue("unsafe-independent-review-path", `config.independentReview.${key}`));
  if (!Array.isArray(value.artifactPaths) || !value.artifactPaths.length || !value.artifactPaths.every(workspacePath)) issues.push(issue("unsafe-independent-review-artifacts", "config.independentReview.artifactPaths"));
  const allowed = new Set(["git-diff", "openspec-validate", "node-test"]);
  if (!Array.isArray(value.allowedCommands) || !value.allowedCommands.length || !value.allowedCommands.every((item) => allowed.has(item)) || new Set(value.allowedCommands).size !== value.allowedCommands.length) issues.push(issue("invalid-independent-review-commands", "config.independentReview.allowedCommands"));
  return { valid: issues.length === 0, issues };
}

function validateDefaults(value, issues) {
  if (value === undefined) return;
  if (!exactKeys(value, new Set(["researchRoot", "designBriefRoot", "planRoot"]), "config.defaults", issues)) return;
  for (const [key, item] of Object.entries(value)) if (!workspacePath(item)) issues.push(issue("unsafe-workspace-path", `config.defaults.${key}`));
}

function validateNamedPaths(value, subject, issues) {
  if (value === undefined) return;
  if (!isObject(value)) return issues.push(issue("invalid-object", subject));
  for (const [key, item] of Object.entries(value)) {
    if (!kebab.test(key)) issues.push(issue("invalid-config-key", `${subject}.${key}`));
    if (!workspacePath(item)) issues.push(issue("unsafe-workspace-path", `${subject}.${key}`));
  }
}

function validateAdapters(value, issues) {
  if (value === undefined) return;
  if (!isObject(value)) return issues.push(issue("invalid-object", "config.adapters"));
  for (const [name, adapter] of Object.entries(value)) {
    const subject = `config.adapters.${name}`;
    if (!kebab.test(name)) issues.push(issue("invalid-config-key", subject));
    if (!exactKeys(adapter, new Set(["kind", "enabled", "operations"]), subject, issues)) continue;
    required(adapter, ["kind", "enabled", "operations"], subject, issues);
    if (!nonEmpty(adapter.kind)) issues.push(issue("invalid-adapter-kind", `${subject}.kind`));
    if (typeof adapter.enabled !== "boolean") issues.push(issue("invalid-adapter-enabled", `${subject}.enabled`));
    if (!Array.isArray(adapter.operations)) { issues.push(issue("invalid-array", `${subject}.operations`)); continue; }
    const seen = new Set();
    adapter.operations.forEach((operation, index) => {
      if (!operationVocabulary.has(operation)) issues.push(issue("invalid-adapter-operation", `${subject}.operations[${index}]`));
      if (seen.has(operation)) issues.push(issue("duplicate-adapter-operation", `${subject}.operations[${index}]`));
      seen.add(operation);
    });
  }
}

function validateStringMap(value, subject, issues) {
  if (value === undefined) return;
  if (!isObject(value)) return issues.push(issue("invalid-object", subject));
  for (const [key, item] of Object.entries(value)) {
    if (!kebab.test(key)) issues.push(issue("invalid-config-key", `${subject}.${key}`));
    if (!nonEmpty(item) || secretPattern.test(key) || secretPattern.test(item)) issues.push(issue("unsafe-policy-value", `${subject}.${key}`));
  }
}

function validateFeatureFlags(value, issues) {
  if (value === undefined) return;
  if (!isObject(value)) return issues.push(issue("invalid-object", "config.featureFlags"));
  for (const [key, item] of Object.entries(value)) {
    if (!kebab.test(key)) issues.push(issue("invalid-config-key", `config.featureFlags.${key}`));
    if (typeof item !== "boolean") issues.push(issue("invalid-feature-flag", `config.featureFlags.${key}`));
  }
}

function readJson(filePath) { return JSON.parse(fs.readFileSync(filePath, "utf8")); }

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [kind, filePath] = process.argv.slice(2);
  if (!new Set(["result", "config"]).has(kind) || !filePath) {
    console.error("Usage: validate-base-skill-contracts.mjs <result|config> <file.json>");
    process.exit(2);
  }
  const result = kind === "result" ? validateSkillResult(readJson(filePath)) : validateAiSkillsConfig(readJson(filePath));
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.valid ? 0 : 1);
}
