import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  mergeTracking,
  normalizeTracking,
  parseTrackingYaml,
  readTrackingFile,
  stringifyTracking,
  validateTrackingObject
} from "../lib/tracking.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../../..");
const fixturesRoot = path.join(repoRoot, "scripts/validation/fixtures/tracking");
const cli = path.join(repoRoot, "scripts/validation/validate-tracking.mjs");

function fixture(name) {
  return path.join(fixturesRoot, name, "tracking.yaml");
}

test("valid tracking fixture normalizes successfully", () => {
  const result = readTrackingFile(fixture("valid"), { expectedChange: "add-report-export-review" });
  assert.equal(result.validation.valid, true);
  assert.equal(result.normalized.github.issue, 42);
  assert.equal(result.normalized.implementation_repositories[0].repository, "example/bookkeeping-assistant");
});

test("invalid tracking fixtures fail with precise field paths", () => {
  const cases = [
    ["missing-field", "$.github.issue"],
    ["invalid-type", "$.schema_version"],
    ["mismatched-change", "$.openspec.change"],
    ["unsafe-field", "github_token"]
  ];

  for (const [name, expectedPath] of cases) {
    const result = readTrackingFile(fixture(name), { expectedChange: "add-report-export-review" });
    assert.equal(result.validation.valid, false, name);
    assert.ok(
      result.validation.issues.some((issue) => issue.path === expectedPath),
      `${name} should report ${expectedPath}; got ${result.validation.issues.map((issue) => issue.path).join(", ")}`
    );
  }
});

test("unknown safe fields validate and survive helper updates", () => {
  const source = parseTrackingYaml(fs.readFileSync(fixture("unknown-safe"), "utf8"));
  const validation = validateTrackingObject(source, { expectedChange: "add-report-export-review" });
  assert.equal(validation.valid, true);

  const updated = mergeTracking(source, {
    github: {
      issue: 43,
      issue_url: "https://github.com/example/bookkeeping-assistant/issues/43"
    }
  });
  assert.equal(updated.review_notes, "local-only fixture metadata");
  assert.equal(updated.github.issue, 43);
  assert.equal(validateTrackingObject(updated, { expectedChange: "add-report-export-review" }).valid, true);
  assert.match(stringifyTracking(updated), /review_notes: local-only fixture metadata/);
});

test("CLI emits deterministic normalized JSON", () => {
  const output = execFileSync("node", [cli, "--json", "--change", "add-report-export-review", fixture("multi-repo")], {
    cwd: repoRoot,
    encoding: "utf8"
  });
  const parsed = JSON.parse(output);
  assert.equal(parsed.valid, true);
  assert.deepEqual(
    parsed.normalized.implementation_repositories.map((repo) => repo.repository),
    ["example/bookkeeping-assistant", "example/report-renderer"]
  );
});

test("CLI exits nonzero for invalid tracking", () => {
  const result = spawnSync("node", [cli, "--change", "add-report-export-review", fixture("missing-field")], {
    cwd: repoRoot,
    encoding: "utf8"
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /\$\.github\.issue/);
});

test("M3-C2 tracking metadata validates", () => {
  const activePath = path.join(repoRoot, "openspec/changes/add-openspec-change-tracking/tracking.yaml");
  const archivePath = path.join(repoRoot, "openspec/changes/archive/2026-08-09-add-openspec-change-tracking/tracking.yaml");
  const trackingPath = fs.existsSync(activePath) ? activePath : archivePath;
  const result = readTrackingFile(trackingPath, {
    expectedChange: "add-openspec-change-tracking"
  });
  assert.equal(result.validation.valid, true, JSON.stringify(result.validation.issues, null, 2));
  assert.equal(result.normalized.github.issue, 25);
});
