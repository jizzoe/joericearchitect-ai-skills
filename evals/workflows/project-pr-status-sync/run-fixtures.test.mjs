import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { planPullRequestProjectStatus } from "../../../scripts/github/lib/pr-status-sync.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../../..");
const config = JSON.parse(fs.readFileSync(path.join(repoRoot, "config/sdd-github.json"), "utf8"));
const observedProject = JSON.parse(fs.readFileSync(path.join(__dirname, "observed-project.json"), "utf8"));
const scenarios = JSON.parse(fs.readFileSync(path.join(__dirname, "scenarios.json"), "utf8"));

function pullRequest(scenario) {
  return {
    merged: scenario.merged === true,
    base: { ref: "main" },
    head: {
      repo: {
        full_name: scenario.fork ? "external/fork" : "jizzoe/joericearchitect-ai-skills"
      }
    }
  };
}

test("Project PR status sync evals cover required lifecycle transitions", () => {
  for (const scenario of scenarios) {
    const result = planPullRequestProjectStatus({
      config,
      eventName: scenario.eventName ?? "pull_request",
      action: scenario.event,
      pullRequest: pullRequest(scenario),
      issue: { url: "https://github.com/jizzoe/joericearchitect-ai-skills/issues/41" },
      observedProject,
      currentStatus: "In Progress"
    });
    assert.equal(result.ok, true, scenario.name);
    if (scenario.expectedAction) assert.equal(result.action, scenario.expectedAction, scenario.name);
    else if (scenario.expected === null) assert.equal(result.status, null, scenario.name);
    else assert.equal(result.to ?? result.status, scenario.expected, scenario.name);
  }
});

