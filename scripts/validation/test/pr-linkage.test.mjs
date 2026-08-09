import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { validateOpenSpecLinkage } from "../validate-openspec-linkage.mjs";
import { validatePrContract } from "../validate-pr-contract.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../../..");

test("valid PR contract includes issue and OpenSpec change linkage", () => {
  const result = validatePrContract({
    body: "OpenSpec change: `enforce-openspec-pr-linkage`\n\nCloses #37",
    changedPaths: ["openspec/changes/enforce-openspec-pr-linkage/proposal.md"]
  });
  assert.equal(result.valid, true);
  assert.equal(result.issue, 37);
  assert.equal(result.change, "enforce-openspec-pr-linkage");
  assert.equal(result.requiresOpenSpecValidation, true);
});

test("missing issue and change links fail with corrective instructions", () => {
  const result = validatePrContract({ body: "No links here" });
  assert.equal(result.valid, false);
  assert.deepEqual(result.issues.map((issue) => issue.ruleId), ["pr.issue_link", "pr.openspec_change"]);
  assert.ok(result.issues.every((issue) => issue.correction));
});

test("irrelevant changed paths do not require OpenSpec validation", () => {
  const result = validatePrContract({
    body: "OpenSpec change: `enforce-openspec-pr-linkage`\n\nRelated to #37",
    changedPaths: ["README.md"]
  });
  assert.equal(result.requiresOpenSpecValidation, false);
});

test("OpenSpec linkage validates current change tracking", () => {
  const result = validateOpenSpecLinkage({
    repoRoot,
    body: "OpenSpec change: `enforce-openspec-pr-linkage`\n\nCloses #37",
    changedPaths: ["scripts/validation/validate-pr-contract.mjs"]
  });
  assert.equal(result.valid, true, JSON.stringify(result.issues, null, 2));
});

test("OpenSpec linkage fails when issue does not match tracking", () => {
  const result = validateOpenSpecLinkage({
    repoRoot,
    body: "OpenSpec change: `enforce-openspec-pr-linkage`\n\nCloses #999",
    changedPaths: ["scripts/validation/validate-pr-contract.mjs"]
  });
  assert.equal(result.valid, false);
  assert.ok(result.issues.some((issue) => issue.ruleId === "openspec.issue_match"));
});

test("advisory workflow permissions are read-only and avoid Project token", () => {
  for (const file of [".github/workflows/openspec-validate.yml", ".github/workflows/openspec-linkage.yml"]) {
    const text = fs.readFileSync(path.join(repoRoot, file), "utf8");
    assert.match(text, /contents: read/);
    assert.doesNotMatch(text, /PROJECT_TOKEN/);
    assert.doesNotMatch(text, /projects: write/);
  }
});

test("assistant wrappers point to canonical PR linkage skill", () => {
  for (const wrapper of [".claude/skills/github-pr-linkage/SKILL.md", ".agents/skills/github-pr-linkage/SKILL.md"]) {
    const text = fs.readFileSync(path.join(repoRoot, wrapper), "utf8");
    assert.match(text, /Canonical skill: `skills\/base\/github-pr-linkage\/SKILL.md`/);
    assert.match(text, /validate-pr-contract\.mjs/);
  }
});
