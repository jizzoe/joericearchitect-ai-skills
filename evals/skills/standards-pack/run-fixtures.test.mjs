import assert from "node:assert/strict";
import test from "node:test";
import { validateStandardsPack } from "../../../scripts/validation/lib/standards-pack.mjs";

const valid = {
  schemaVersion: 1,
  target: { path: "fixtures/second-workspace" },
  rules: [
    { id: "repository-style", classification: "repository-selected", source: "config/quality.md" },
    { id: "official-rule", classification: "required", source: "https://example.invalid/official" },
    { id: "expo-rule", classification: "not-applicable", source: "https://example.invalid/expo", reason: "target is not Expo" }
  ],
  overrides: [],
  expectedEvidence: ["lint"],
  gaps: []
};

test("valid selection records preserve precedence, exclusion, and portability", () => {
  assert.deepEqual(validateStandardsPack(valid), { valid: true, issues: [] });
  assert.deepEqual(validateStandardsPack({ ...valid, target: { path: "another/repository" } }), { valid: true, issues: [] });
});

test("unsafe and incomplete records fail closed", () => {
  const cases = [
    [{ ...valid, unknown: true }, "unknown-field"],
    [{ ...valid, target: { path: "../outside" } }, "unsafe-target-path"],
    [{ ...valid, rules: [{ ...valid.rules[0], source: "api_token=value" }] }, "unsafe-source"],
    [{ ...valid, rules: [{ ...valid.rules[2], reason: "" }] }, "missing-not-applicable-reason"],
    [{ ...valid, overrides: [{ ruleId: "official-rule", scope: "src", reason: "local policy", status: "open" }] }, "unresolved-conflict"],
    [{ ...valid, rules: [] }, "missing-rules"]
  ];
  for (const [record, code] of cases) {
    const result = validateStandardsPack(record);
    assert.equal(result.valid, false);
    assert.ok(result.issues.some((item) => item.code === code), code);
  }
});
