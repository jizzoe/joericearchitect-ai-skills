import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const scenarios = JSON.parse(fs.readFileSync(path.join(__dirname, "scenarios.json"), "utf8")).scenarios;

test("OpenSpec GitHub lifecycle evals cover key transitions", () => {
  const transitions = new Map(scenarios.filter((scenario) => scenario.event).map((scenario) => [scenario.event, scenario.expectedStatus]));
  assert.equal(transitions.get("propose-reviewed"), "Ready");
  assert.equal(transitions.get("apply-started"), "In Progress");
});

test("OpenSpec GitHub lifecycle evals cover safe failure and repair", () => {
  const outcomes = new Set(scenarios.map((scenario) => scenario.expectedOutcome).filter(Boolean));
  assert.ok(outcomes.has("fail-safely"));
  assert.ok(outcomes.has("authorization-required"));
  assert.ok(outcomes.has("plan-repair"));
});
