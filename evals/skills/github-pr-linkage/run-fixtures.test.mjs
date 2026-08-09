import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const scenarios = JSON.parse(fs.readFileSync(path.join(__dirname, "scenarios.json"), "utf8")).scenarios;

test("GitHub PR linkage evals cover pass and corrective failures", () => {
  const outcomes = new Set(scenarios.map((scenario) => scenario.expectedOutcome));
  assert.ok(outcomes.has("pass"));
  assert.ok(outcomes.has("corrective-failure"));
});

test("GitHub PR linkage evals cover untrusted fork safety", () => {
  assert.ok(scenarios.some((scenario) => scenario.expectedOutcome === "no-project-token"));
});
