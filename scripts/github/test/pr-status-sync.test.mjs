import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  classifyPullRequestTrust,
  expectedStatusForPullRequestEvent,
  planPullRequestProjectStatus
} from "../lib/pr-status-sync.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../../..");
const config = JSON.parse(fs.readFileSync(path.join(repoRoot, "config/sdd-github.json"), "utf8"));
const observedProject = {
  fields: [
    {
      id: "status-field",
      name: "Status",
      options: [
        { id: "progress-id", name: "In Progress" },
        { id: "review-id", name: "In Review" },
        { id: "done-id", name: "Done" }
      ]
    }
  ]
};

function pr(overrides = {}) {
  return {
    merged: false,
    base: { ref: "main" },
    head: { repo: { full_name: "jizzoe/joericearchitect-ai-skills" } },
    ...overrides
  };
}

test("pull request events map to Project statuses", () => {
  assert.equal(expectedStatusForPullRequestEvent({ action: "opened", pullRequest: pr(), defaultBranch: "main" }), "In Progress");
  assert.equal(expectedStatusForPullRequestEvent({ action: "ready_for_review", pullRequest: pr(), defaultBranch: "main" }), "In Review");
  assert.equal(expectedStatusForPullRequestEvent({ action: "converted_to_draft", pullRequest: pr(), defaultBranch: "main" }), "In Progress");
});

test("merged default-branch PR relies on closing keywords and built-in Done automation", () => {
  const result = expectedStatusForPullRequestEvent({
    action: "closed",
    pullRequest: pr({ merged: true }),
    defaultBranch: "main"
  });
  assert.equal(result, null);
});

test("closed unmerged PR returns issue to In Progress", () => {
  const result = planPullRequestProjectStatus({
    config,
    action: "closed",
    pullRequest: pr({ merged: false }),
    issue: { url: "https://github.com/jizzoe/joericearchitect-ai-skills/issues/41" },
    observedProject,
    currentStatus: "In Review"
  });
  assert.equal(result.ok, true);
  assert.equal(result.action, "set-status");
  assert.equal(result.to, "In Progress");
});

test("ready for review moves Project status to In Review", () => {
  const result = planPullRequestProjectStatus({
    config,
    action: "ready_for_review",
    pullRequest: pr(),
    issue: { url: "https://github.com/jizzoe/joericearchitect-ai-skills/issues/41" },
    observedProject,
    currentStatus: "In Progress"
  });
  assert.equal(result.ok, true);
  assert.equal(result.to, "In Review");
  assert.equal(result.optionId, "review-id");
});

test("untrusted pull request context is audit-only", () => {
  const result = planPullRequestProjectStatus({
    config,
    eventName: "pull_request_target",
    action: "ready_for_review",
    pullRequest: pr({ head: { repo: { full_name: "external/fork" } } }),
    observedProject,
    currentStatus: "In Progress"
  });
  assert.equal(result.ok, true);
  assert.equal(result.action, "audit-only");
  assert.equal(result.trust.trusted, false);
});

test("trust classifier accepts same-repository pull_request only", () => {
  assert.equal(classifyPullRequestTrust({
    eventName: "pull_request",
    pullRequest: pr(),
    repository: { full_name: "jizzoe/joericearchitect-ai-skills" }
  }).trusted, true);
  assert.equal(classifyPullRequestTrust({
    eventName: "pull_request_target",
    pullRequest: pr(),
    repository: { full_name: "jizzoe/joericearchitect-ai-skills" }
  }).trusted, false);
});

test("workflow uses read-only permissions and avoids Project credentials", () => {
  const workflow = fs.readFileSync(path.join(repoRoot, ".github/workflows/project-status-sync.yml"), "utf8");
  assert.match(workflow, /contents: read/);
  assert.match(workflow, /pull-requests: read/);
  assert.doesNotMatch(workflow, /pull_request_target/);
  assert.doesNotMatch(workflow, /PROJECT_TOKEN|secrets\.|projects: write|contents: write|pull-requests: write/);
});

test("assistant wrappers point to canonical Project PR status sync skill", () => {
  for (const wrapper of [".claude/skills/project-pr-status-sync/SKILL.md", ".agents/skills/project-pr-status-sync/SKILL.md"]) {
    const text = fs.readFileSync(path.join(repoRoot, wrapper), "utf8");
    assert.match(text, /Canonical skill: `skills\/base\/project-pr-status-sync\/SKILL.md`/);
    assert.match(text, /scripts\/github\//);
  }
});
