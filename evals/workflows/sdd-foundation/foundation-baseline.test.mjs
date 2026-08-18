import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../../..");

function exists(relativePath) {
  return fs.existsSync(path.join(repoRoot, relativePath));
}

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
}

test("foundation living specs exist for all delivered capabilities", () => {
  for (const spec of [
    "asset-quality",
    "bounded-autonomous-execution",
    "cross-assistant-assets",
    "dependency-aware-work-selection",
    "github-openspec-intake",
    "github-pr-linkage",
    "github-work-intake",
    "github-work-tracking",
    "openspec-github-lifecycle-sync",
    "project-pr-status-sync",
    "sdd-lifecycle"
  ]) {
    assert.equal(exists(`openspec/specs/${spec}/spec.md`), true, spec);
  }
});

test("foundation workflows and canonical skills are exposed to Claude and Codex", () => {
  for (const skill of [
    "autonomous-goal-runner",
    "autonomous-sdd-delivery",
    "autonomous-sdd-lifecycle",
    "github-issue-authoring",
    "github-issue-to-openspec",
    "github-pr-linkage",
    "openspec-github-sync",
    "project-pr-status-sync",
    "dependency-aware-work-selection"
  ]) {
    assert.equal(exists(`skills/base/${skill}/SKILL.md`), true, skill);
  }
  assert.match(read(".agents/skills/dependency-aware-work-selection/SKILL.md"), /Canonical skill/);
  assert.match(read(".claude/skills/dependency-aware-work-selection/SKILL.md"), /Canonical skill/);
});

test("security-sensitive workflows keep PR trust boundaries", () => {
  for (const workflow of [
    ".github/workflows/openspec-linkage.yml",
    ".github/workflows/openspec-validate.yml",
    ".github/workflows/project-status-sync.yml"
  ]) {
    const text = read(workflow);
    assert.doesNotMatch(text, /pull_request_target|PROJECT_TOKEN|secrets\./, workflow);
    assert.doesNotMatch(text, /contents: write|pull-requests: write|projects: write/, workflow);
  }
});

test("portable global assets do not contain bookkeeping fixture constants", () => {
  const globals = [
    "skills/base",
    "workflows",
    "scripts",
    "openspec/specs",
    "docs"
  ];
  for (const root of globals) {
    const text = collectText(path.join(repoRoot, root));
    assert.doesNotMatch(text, /Mobile Bookkeeping|mobile-bookkeeping|bookkeeping-domain/i, root);
  }
});

function collectText(root) {
  if (!fs.existsSync(root)) return "";
  const entries = fs.readdirSync(root, { withFileTypes: true });
  return entries.map((entry) => {
    const full = path.join(root, entry.name);
    if (entry.isDirectory()) return collectText(full);
    if (!/\.(md|mjs|json|yaml|yml)$/.test(entry.name)) return "";
    return fs.readFileSync(full, "utf8");
  }).join("\n");
}
