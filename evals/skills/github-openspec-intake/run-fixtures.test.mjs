import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const scenarios = JSON.parse(fs.readFileSync(path.join(__dirname, "scenarios.json"), "utf8")).scenarios;

test("GitHub OpenSpec intake evals cover trigger and non-trigger behavior", () => {
  const ids = new Set(scenarios.map((scenario) => scenario.id));
  for (const id of ["trigger-create-issue", "trigger-issue-to-openspec", "non-trigger-general-github-question"]) {
    assert.ok(ids.has(id), id);
  }
});

test("GitHub OpenSpec intake evals cover failure behavior", () => {
  const outcomes = new Set(scenarios.map((scenario) => scenario.expectedOutcome).filter(Boolean));
  assert.ok(outcomes.has("fail-locally"));
  assert.ok(outcomes.has("structured-failure"));
});
