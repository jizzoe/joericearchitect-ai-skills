import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

function readJson(path) {
  return JSON.parse(fs.readFileSync(path, "utf8"));
}

function readText(path) {
  return fs.readFileSync(path, "utf8");
}

function configHasPortableShape(config) {
  assert.equal(config.schemaVersion, 1);
  assert.ok(config.repository.owner);
  assert.ok(config.repository.name);
  assert.ok(config.repository.defaultBranch);
  assert.ok(config.project.owner);
  assert.ok(config.project.ownerType);
  assert.ok(config.project.number);
  assert.deepEqual(config.statusField.options, [
    "Backlog",
    "Ready",
    "In Progress",
    "In Review",
    "Done"
  ]);
  assert.ok(config.managedLabels.some((label) => label.name === "type:feature"));
  assert.ok(config.managedLabels.some((label) => label.name === "type:bug"));
  assert.ok(config.managedLabels.some((label) => label.name === "sdd"));
}

test("repository GitHub config has portable non-secret shape", () => {
  const config = readJson(new URL("../../config/sdd-github.json", import.meta.url));
  configHasPortableShape(config);
  const serialized = JSON.stringify(config);
  assert.equal(/ghp_|github_pat_|token|secret|password/i.test(serialized), false);
});

test("alternate product config uses the same shape", () => {
  const config = readJson(new URL("./fixtures/alternate-sdd-github.json", import.meta.url));
  configHasPortableShape(config);
  assert.equal(config.repository.owner, "example-owner");
  assert.equal(config.repository.defaultBranch, "trunk");
});

test("issue forms include required SDD intake fields", () => {
  const feature = readText(new URL("../../.github/ISSUE_TEMPLATE/feature.yml", import.meta.url));
  const bug = readText(new URL("../../.github/ISSUE_TEMPLATE/bug.yml", import.meta.url));

  for (const expected of ["Problem", "Desired outcome", "Scope", "Acceptance criteria", "OpenSpec impact", "Verification plan"]) {
    assert.ok(feature.includes(expected), `feature form missing ${expected}`);
  }

  for (const expected of ["Observed behavior", "Expected behavior", "Reproduction steps", "Impact", "OpenSpec impact", "Verification plan"]) {
    assert.ok(bug.includes(expected), `bug form missing ${expected}`);
  }
});

test("pull request template prompts for SDD evidence", () => {
  const template = readText(new URL("../../.github/pull_request_template.md", import.meta.url));
  for (const expected of ["SDD Linkage", "Verification", "Security", "Recovery", "Portability", "Known Limitations"]) {
    assert.ok(template.includes(expected), `PR template missing ${expected}`);
  }
});
