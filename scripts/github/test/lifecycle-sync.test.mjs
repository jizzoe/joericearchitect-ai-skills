import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  auditLifecycle,
  backfillSummary,
  expectedStatusForEvent,
  planLifecycleTransition,
  repairLifecycle,
  resolveProjectStatus
} from "../lib/lifecycle.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../../..");
const config = JSON.parse(fs.readFileSync(path.join(repoRoot, "config/sdd-github.json"), "utf8"));
const tracking = {
  github: {
    issue_url: "https://github.com/jizzoe/joericearchitect-ai-skills/issues/33"
  }
};
const observedProject = {
  fields: [
    {
      id: "status-field",
      name: "Status",
      options: [
        { id: "ready-id", name: "Ready" },
        { id: "progress-id", name: "In Progress" },
        { id: "done-id", name: "Done" }
      ]
    }
  ]
};

test("lifecycle events map to expected statuses", () => {
  assert.equal(expectedStatusForEvent("propose-reviewed"), "Ready");
  assert.equal(expectedStatusForEvent("apply-started"), "In Progress");
});

test("Project status resolution uses configured names", () => {
  const result = resolveProjectStatus({ config, observedProject, status: "Ready" });
  assert.equal(result.ok, true);
  assert.equal(result.field.id, "status-field");
  assert.equal(result.option.id, "ready-id");
});

test("Project status resolution fails safely for missing fields", () => {
  const result = resolveProjectStatus({ config, observedProject: { fields: [] }, status: "Ready" });
  assert.equal(result.ok, false);
  assert.equal(result.error, "missing status field");
});

test("transition planning returns no-op when already synchronized", () => {
  const result = planLifecycleTransition({
    config,
    tracking,
    observedProject,
    currentStatus: "Ready",
    event: "propose-reviewed"
  });
  assert.equal(result.ok, true);
  assert.equal(result.action, "noop");
});

test("transition planning returns minimal status update when drift exists", () => {
  const result = planLifecycleTransition({
    config,
    tracking,
    observedProject,
    currentStatus: "Backlog",
    event: "propose-reviewed"
  });
  assert.equal(result.ok, true);
  assert.equal(result.action, "set-status");
  assert.equal(result.to, "Ready");
  assert.equal(result.optionId, "ready-id");
});

test("read-only audit detects drift without repair", () => {
  const result = auditLifecycle({
    config,
    tracking,
    observedProject,
    observedIssue: {
      url: tracking.github.issue_url,
      projectStatus: "Backlog"
    },
    event: "apply-started"
  });
  assert.equal(result.ok, true);
  assert.equal(result.drift, true);
  assert.equal(result.issues[0].type, "status-drift");
  assert.equal(result.issues[0].expectedStatus, "In Progress");
});

test("repair requires explicit authorization", () => {
  const result = repairLifecycle({
    config,
    tracking,
    observedProject,
    observedIssue: {
      url: tracking.github.issue_url,
      projectStatus: "Backlog"
    },
    event: "apply-started",
    authorized: false
  });
  assert.equal(result.ok, false);
  assert.equal(result.error, "repair authorization required");
});

test("authorized repair returns dry-run repair plan", () => {
  const result = repairLifecycle({
    config,
    tracking,
    observedProject,
    observedIssue: {
      url: tracking.github.issue_url,
      projectStatus: "Backlog"
    },
    event: "apply-started",
    authorized: true,
    dryRun: true
  });
  assert.equal(result.ok, true);
  assert.equal(result.action, "plan-repair");
  assert.equal(result.repair.to, "In Progress");
});

test("backfill summary records prior closed Done changes as compatible", () => {
  const result = backfillSummary([
    { change: "bootstrap-openspec-foundation", issue: 2, issueState: "CLOSED", projectStatus: "Done" },
    { change: "add-example", issue: 99, issueState: "OPEN", projectStatus: "In Progress" }
  ]);
  assert.equal(result[0].compatible, true);
  assert.equal(result[1].compatible, false);
});

test("assistant wrappers point to canonical sync skill", () => {
  for (const wrapper of [".claude/skills/openspec-github-sync/SKILL.md", ".agents/skills/openspec-github-sync/SKILL.md"]) {
    const text = fs.readFileSync(path.join(repoRoot, wrapper), "utf8");
    assert.match(text, /Canonical skill: `skills\/base\/openspec-github-sync\/SKILL.md`/);
    assert.match(text, /scripts\/github\//);
  }
});
