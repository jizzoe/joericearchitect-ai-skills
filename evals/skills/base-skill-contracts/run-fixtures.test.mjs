import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { createBlockedSkillResult, renderSkillResultMarkdown, validateAiSkillsConfig, validateSkillResult } from "../../../scripts/validation/validate-base-skill-contracts.mjs";

const fixtureDir = new URL("./fixtures/", import.meta.url);
function fixture(name) { return JSON.parse(fs.readFileSync(new URL(name, fixtureDir), "utf8")); }
function has(result, code) { return result.issues.some((item) => item.code === code); }

test("valid result fixture satisfies the shared contract", () => {
  const result = fixture("valid-result.json");
  assert.equal(validateSkillResult(result).valid, true);
  const markdown = renderSkillResultMarkdown(result);
  assert.match(markdown, /Synthetic result completed\./);
  assert.match(markdown, /docs\/output\.md/);
  assert.doesNotMatch(markdown, /synthetic: true/);
});

test("invalid result inputs produce a schema-valid blocked result", () => {
  const invalid = validateSkillResult(fixture("invalid-result-unknown.json"));
  const blocked = createBlockedSkillResult(invalid.issues);
  assert.equal(validateSkillResult(blocked).valid, true);
  assert.equal(blocked.status, "blocked");
});

test("result contract covers enums, unsafe paths, duplicates, versions, and unknown keys", () => {
  for (const status of ["completed", "paused", "blocked", "no-op"]) {
    const value = fixture("valid-result.json"); value.status = status;
    assert.equal(validateSkillResult(value).valid, true);
  }
  for (const mode of ["interactive", "autonomous"]) {
    const value = fixture("valid-result.json"); value.mode = mode;
    assert.equal(validateSkillResult(value).valid, true);
  }
  for (const kind of ["file", "record", "external-state", "other"]) {
    const value = fixture("valid-result.json"); value.artifacts[0].kind = kind;
    assert.equal(validateSkillResult(value).valid, true);
  }
  for (const operation of ["read", "created", "updated", "unchanged"]) {
    const value = fixture("valid-result.json"); value.artifacts[0].operation = operation;
    assert.equal(validateSkillResult(value).valid, true);
  }
  for (const type of ["command", "validation", "test", "review", "screenshot", "accessibility", "record", "other"]) {
    const value = fixture("valid-result.json"); value.evidence[0].type = type;
    assert.equal(validateSkillResult(value).valid, true);
  }
  for (const result of ["passed", "failed", "not-applicable", "informational"]) {
    const value = fixture("valid-result.json"); value.evidence[0].result = result;
    assert.equal(validateSkillResult(value).valid, true);
  }
  for (const kind of ["continue", "user-decision", "resume", "openspec-explore", "openspec-propose", "none"]) {
    const value = fixture("valid-result.json"); value.nextAction.kind = kind;
    assert.equal(validateSkillResult(value).valid, true);
  }
  for (const badPath of ["/absolute/path", "../outside", "docs/../outside", "C:\\outside"]) {
    const value = fixture("valid-result.json"); value.artifacts[0].subject = badPath;
    assert.equal(has(validateSkillResult(value), "unsafe-workspace-path"), true);
  }
  const duplicateEvidence = fixture("valid-result.json"); duplicateEvidence.evidence.push({ ...duplicateEvidence.evidence[0] });
  assert.equal(has(validateSkillResult(duplicateEvidence), "duplicate-evidence-id"), true);
  const duplicateQuestion = fixture("valid-result.json"); duplicateQuestion.openQuestions.push({ ...duplicateQuestion.openQuestions[0] });
  assert.equal(has(validateSkillResult(duplicateQuestion), "duplicate-question-id"), true);
  const unsupported = fixture("valid-result.json"); unsupported.schemaVersion = 2;
  assert.equal(has(validateSkillResult(unsupported), "unsupported-schema-version"), true);
  assert.equal(has(validateSkillResult(fixture("invalid-result-unknown.json")), "unknown-key"), true);
});

test("result contract rejects missing and invalid nested values", () => {
  const missing = fixture("valid-result.json"); delete missing.summary;
  assert.equal(has(validateSkillResult(missing), "missing-required"), true);
  const badArtifact = fixture("valid-result.json"); badArtifact.artifacts = {};
  assert.equal(has(validateSkillResult(badArtifact), "invalid-array"), true);
  const badReference = fixture("valid-result.json"); badReference.evidence[0].reference = "Bearer synthetic-token";
  assert.equal(has(validateSkillResult(badReference), "unsafe-evidence-reference"), true);
  const badQuestion = fixture("valid-result.json"); badQuestion.openQuestions[0].blocking = "false";
  assert.equal(has(validateSkillResult(badQuestion), "invalid-question-blocking"), true);
  const badNextAction = fixture("valid-result.json"); badNextAction.nextAction.description = "";
  assert.equal(has(validateSkillResult(badNextAction), "invalid-next-action-description"), true);
  const badDetails = fixture("valid-result.json"); badDetails.details = [];
  assert.equal(has(validateSkillResult(badDetails), "invalid-details"), true);
});

test("configuration fixtures enforce strict keys, paths, adapter operations, secrets, and absence", () => {
  assert.equal(validateAiSkillsConfig(fixture("valid-config.json")).valid, true);
  assert.equal(validateAiSkillsConfig(fixture("second-workspace-config.json")).valid, true);
  assert.deepEqual(validateAiSkillsConfig(undefined, { present: false }), { valid: true, requiresExplicitPaths: true, issues: [] });
  const badPath = fixture("valid-config.json"); badPath.defaults.researchRoot = "../outside";
  assert.equal(has(validateAiSkillsConfig(badPath), "unsafe-workspace-path"), true);
  const duplicateOperation = fixture("valid-config.json"); duplicateOperation.adapters["synthetic-adapter"].operations.push("read-source");
  assert.equal(has(validateAiSkillsConfig(duplicateOperation), "duplicate-adapter-operation"), true);
  const unsupported = fixture("valid-config.json"); unsupported.schemaVersion = 2;
  assert.equal(has(validateAiSkillsConfig(unsupported), "unsupported-schema-version"), true);
  const unknown = fixture("valid-config.json"); unknown.unknown = true;
  assert.equal(has(validateAiSkillsConfig(unknown), "unknown-key"), true);
  const secret = validateAiSkillsConfig(fixture("invalid-config-secret.json"));
  assert.equal(has(secret, "unknown-key"), true);
  assert.equal(has(secret, "unsafe-policy-value"), true);
  const malformedAdapter = fixture("valid-config.json"); malformedAdapter.adapters["synthetic-adapter"].enabled = "true";
  assert.equal(has(validateAiSkillsConfig(malformedAdapter), "invalid-adapter-enabled"), true);
  const invalidOperation = fixture("valid-config.json"); invalidOperation.adapters["synthetic-adapter"].operations = ["external-send"];
  assert.equal(has(validateAiSkillsConfig(invalidOperation), "invalid-adapter-operation"), true);
});
