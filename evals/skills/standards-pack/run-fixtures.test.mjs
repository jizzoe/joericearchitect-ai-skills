import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { validateStandardsPack } from "../../../scripts/validation/lib/standards-pack.mjs";

const valid = {
  schemaVersion: 1,
  target: { path: "fixtures/second-workspace" },
  rules: [
    { id: "repository-style", classification: "repository-selected", source: "config/quality.md", scope: "repository" },
    { id: "official-rule", classification: "required", source: "https://example.invalid/official", scope: "src" },
    { id: "expo-rule", classification: "not-applicable", source: "https://example.invalid/expo", scope: "repository", reason: "target is not Expo" }
  ],
  overrides: [],
  expectedEvidence: ["lint"],
  gaps: []
};

test("valid selection records preserve precedence, override, exclusion, portability, and handoff", () => {
  assert.deepEqual(validateStandardsPack(valid), { valid: true, issues: [] });
  assert.deepEqual(validateStandardsPack({ ...valid, target: { path: "another/repository" } }), { valid: true, issues: [] });
  const selected = { ...valid, overrides: [{ ruleId: "official-rule", scope: "src", reason: "repository convention", status: "resolved" }] };
  assert.deepEqual(validateStandardsPack(selected), { valid: true, issues: [] });
  const handoff = JSON.parse(JSON.stringify(selected));
  assert.deepEqual(handoff.rules.map((rule) => rule.id), ["repository-style", "official-rule", "expo-rule"]);
  for (const file of ["skills/base/base-code-review/SKILL.md", "skills/base/base-verification-loop/SKILL.md"]) {
    const content = fs.readFileSync(file, "utf8");
    assert.match(content, /validated\s+selection record/);
    assert.match(content, /standards-pack\.md/);
  }
});

test("unsafe and incomplete records fail closed", () => {
  const cases = [
    [{ ...valid, unknown: true }, "unknown-field"],
    [{ ...valid, target: { path: "../outside" } }, "unsafe-target-path"],
    [{ ...valid, target: { path: "C:\\workspace" } }, "unsafe-target-path"],
    [{ ...valid, target: { path: "\\\\server\\share" } }, "unsafe-target-path"],
    [{ ...valid, rules: [{ ...valid.rules[0], source: "api_token=value" }] }, "unsafe-source"],
    [{ ...valid, rules: [{ ...valid.rules[0], source: "https://alice:hunter2@example.invalid/standard" }] }, "unsafe-source"],
    [{ ...valid, rules: [{ ...valid.rules[0], source: "https://127.0.0.1/standard" }] }, "unsafe-source"],
    [{ ...valid, rules: [{ ...valid.rules[0], source: "https://192.168.1.5/standard" }] }, "unsafe-source"],
    [{ ...valid, rules: [{ ...valid.rules[0], source: "https://[::1]/standard" }] }, "unsafe-source"],
    [{ ...valid, rules: { id: "not-an-array" } }, "missing-rules"],
    [{ ...valid, rules: [{ ...valid.rules[2], reason: "" }] }, "missing-not-applicable-reason"],
    [{ ...valid, rules: [{ ...valid.rules[0], scope: "" }] }, "unsafe-rule-scope"],
    [{ ...valid, rules: [{ ...valid.rules[0], command: "npm test" }] }, "invalid-rule"],
    [{ ...valid, target: { path: "src", command: "npm test" } }, "invalid-target"],
    [{ ...valid, overrides: [{ ruleId: "official-rule", scope: "src", reason: "local policy", status: "open" }] }, "unresolved-conflict"],
    [{ ...valid, overrides: [{ ruleId: "official-rule", scope: "src", reason: "local policy", status: "resolved", command: "npm test" }] }, "invalid-override"],
    [{ ...valid, overrides: { ruleId: "official-rule" } }, "invalid-overrides"],
    [{ ...valid, overrides: [{ ruleId: "missing-rule", scope: "src", reason: "local policy", status: "resolved" }] }, "unknown-override-rule"],
    [{ ...valid, rules: [...valid.rules, valid.rules[0]] }, "duplicate-rule-id"],
    [{ ...valid, expectedEvidence: undefined }, "missing-expected-evidence"],
    [{ ...valid, expectedEvidence: { id: "lint" } }, "missing-expected-evidence"],
    [{ ...valid, expectedEvidence: ["npm test"] }, "invalid-expected-evidence"],
    [{ ...valid, gaps: undefined }, "invalid-gaps"],
    [{ ...valid, gaps: { id: "missing-tool" } }, "invalid-gaps"],
    [{ ...valid, gaps: [{ id: "missing-tool", reason: "api_token=value" }] }, "invalid-gap"],
    [{ ...valid, rules: [] }, "missing-rules"]
  ];
  for (const [record, code] of cases) {
    const result = validateStandardsPack(record);
    assert.equal(result.valid, false);
    assert.ok(result.issues.some((item) => item.code === code), code);
  }
});
