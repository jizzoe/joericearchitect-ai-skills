import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { ghCommand } from "../lib/gh.mjs";
import {
  buildIssueToOpenSpecIntake,
  createOrFindIssue,
  renderManagedIssueBlock,
  replaceManagedBlock
} from "../lib/issues.mjs";
import { planAddToProject, planSetProjectStatus } from "../lib/projects.mjs";
import { parseTrackingYaml, validateTrackingObject } from "../../validation/lib/tracking.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../../..");
const config = JSON.parse(fs.readFileSync(path.join(repoRoot, "config/sdd-github.json"), "utf8"));

test("gh boundary returns dry-run command without executing GitHub", () => {
  const result = ghCommand(["issue", "list", "--repo", "example/repo"], { dryRun: true });
  assert.equal(result.ok, true);
  assert.equal(result.dryRun, true);
  assert.deepEqual(result.command, ["gh", "issue", "list", "--repo", "example/repo"]);
});

test("create-or-find returns existing issue by exact title", () => {
  const result = createOrFindIssue({
    repo: "example/repo",
    title: "[Feature] Existing",
    body: "ignored",
    labels: ["sdd"],
    existingIssues: [{ number: 5, title: "[Feature] Existing", url: "https://github.com/example/repo/issues/5" }]
  });
  assert.equal(result.ok, true);
  assert.equal(result.action, "found");
  assert.equal(result.issue.number, 5);
});

test("create-or-find plans create operation in dry-run mode", () => {
  const result = createOrFindIssue({
    repo: "example/repo",
    title: "[Feature] New",
    body: "body",
    labels: ["type:feature", "sdd"],
    existingIssues: [],
    dryRun: true
  });
  assert.equal(result.ok, true);
  assert.equal(result.action, "create");
  assert.deepEqual(result.command.slice(0, 5), ["gh", "issue", "create", "--repo", "example/repo"]);
  assert.ok(result.command.includes("type:feature"));
});

test("managed issue block replacement preserves human content", () => {
  const oldBody = [
    "Human intro",
    "",
    "<!-- sdd-managed:start -->",
    "old",
    "<!-- sdd-managed:end -->",
    "",
    "Human footer"
  ].join("\n");
  const block = renderManagedIssueBlock({
    markers: config.managedIssueBlockMarkers,
    changeName: "add-example",
    changeDir: "openspec/changes/add-example"
  });
  const next = replaceManagedBlock(oldBody, block, config.managedIssueBlockMarkers);
  assert.match(next, /^Human intro/);
  assert.match(next, /Human footer$/);
  assert.doesNotMatch(next, /\nold\n/);
  assert.match(next, /OpenSpec change: `add-example`/);
});

test("managed issue block is appended when markers are absent", () => {
  const next = replaceManagedBlock("Human-only body", "BLOCK", config.managedIssueBlockMarkers);
  assert.equal(next, "Human-only body\n\nBLOCK");
});

test("Project helpers produce dry-run operation plans", () => {
  const project = { ...config.project, statusField: config.statusField };
  const addPlan = planAddToProject({ project, issueUrl: "https://github.com/example/repo/issues/1" });
  const statusPlan = planSetProjectStatus({ project, issueUrl: "https://github.com/example/repo/issues/1", status: "Ready" });
  assert.equal(addPlan.operation, "project.itemAdd");
  assert.equal(statusPlan.operation, "project.setStatus");
  assert.equal(statusPlan.field, "Status");
});

test("Project helper rejects unknown configured status", () => {
  const result = planSetProjectStatus({
    project: { ...config.project, statusField: config.statusField },
    issueUrl: "https://github.com/example/repo/issues/1",
    status: "Blocked"
  });
  assert.equal(result.ok, false);
  assert.equal(result.error, "unknown project status");
});

test("issue-to-OpenSpec intake produces managed block and valid tracking", () => {
  const result = buildIssueToOpenSpecIntake({
    config,
    issue: { number: 77, url: "https://github.com/jizzoe/joericearchitect-ai-skills/issues/77" },
    title: "Add example capability",
    changeName: "add-example-capability"
  });
  assert.equal(result.ok, true);
  assert.match(result.managedBlock, /OpenSpec change: `add-example-capability`/);
  assert.equal(validateTrackingObject(result.tracking, { expectedChange: "add-example-capability" }).valid, true);
  const trackingPath = Object.keys(result.files).find((file) => file.endsWith("tracking.yaml"));
  assert.ok(trackingPath);
  const parsedTracking = parseTrackingYaml(result.files[trackingPath]);
  assert.equal(validateTrackingObject(parsedTracking, { expectedChange: "add-example-capability" }).valid, true);
  assert.deepEqual(parsedTracking.implementation_repositories[0].paths, ["openspec/changes/add-example-capability/"]);
});

test("issue-to-OpenSpec intake fails without required issue data", () => {
  const result = buildIssueToOpenSpecIntake({
    config,
    issue: { url: "https://github.com/example/repo/issues/1" },
    title: "",
    changeName: "add-example"
  });
  assert.equal(result.ok, false);
  assert.deepEqual(result.missing, ["issue.number", "title"]);
});

test("skill wrappers point to canonical base skills", () => {
  const wrappers = [
    ".claude/skills/github-issue-authoring/SKILL.md",
    ".claude/skills/github-issue-to-openspec/SKILL.md",
    ".agents/skills/github-issue-authoring/SKILL.md",
    ".agents/skills/github-issue-to-openspec/SKILL.md"
  ];
  for (const wrapper of wrappers) {
    const text = fs.readFileSync(path.join(repoRoot, wrapper), "utf8");
    assert.match(text, /Canonical skill: `skills\/base\/github-issue-/);
    assert.match(text, /scripts\/github\//);
  }
});
