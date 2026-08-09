import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { validateChange } from "../validate-openspec-artifacts.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../../..");
const fixturesRoot = path.join(repoRoot, "evals/openspec-artifact-quality/fixtures");
const validator = path.join(repoRoot, "scripts/validation/validate-openspec-artifacts.mjs");

function fixture(name) {
  return path.join(fixturesRoot, name);
}

test("sample change fixture satisfies OpenSpec artifact quality rules", () => {
  const result = validateChange(fixture("sample-change"));
  assert.equal(result.valid, true);
  assert.deepEqual(result.issues, []);
});

test("validator CLI emits JSON for a valid fixture", () => {
  const output = execFileSync("node", [validator, "--json", fixture("sample-change")], {
    cwd: repoRoot,
    encoding: "utf8"
  });
  const parsed = JSON.parse(output);
  assert.equal(parsed.valid, true);
  assert.deepEqual(parsed.issues, []);
});

test("invalid fixtures fail with precise expected rule ids", () => {
  const cases = [
    ["invalid-missing-issue", "proposal.issue_linkage"],
    ["invalid-task-spec", "spec.requirement.behavioral"],
    ["invalid-missing-recovery", "design.section.recovery"],
    ["invalid-complete-task-no-evidence", "tasks.completed.evidence"]
  ];

  for (const [name, expectedRuleId] of cases) {
    const result = validateChange(fixture(name));
    assert.equal(result.valid, false, name);
    assert.ok(
      result.issues.some((issue) => issue.ruleId === expectedRuleId),
      `${name} should report ${expectedRuleId}; got ${result.issues.map((issue) => issue.ruleId).join(", ")}`
    );
  }
});

test("validator CLI exits nonzero for an invalid fixture", () => {
  const result = spawnSync("node", [validator, fixture("invalid-missing-issue")], {
    cwd: repoRoot,
    encoding: "utf8"
  });

  assert.equal(result.status, 1);
  assert.match(result.stderr, /proposal\.issue_linkage/);
});

test("M3-C1 change satisfies the artifact quality rules", () => {
  const activePath = path.join(repoRoot, "openspec/changes/establish-openspec-quality-rules");
  const archivePath = path.join(repoRoot, "openspec/changes/archive/2026-08-09-establish-openspec-quality-rules");
  const changePath = fs.existsSync(activePath) ? activePath : archivePath;
  const result = validateChange(changePath);
  assert.equal(result.valid, true, JSON.stringify(result.issues, null, 2));
});
