import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { buildLifecycleReconciliationReport, captureDesignBrief, classifyLifecycleResource, rankDesignBriefCandidates, validateDesignBriefSource } from "../sdd-lifecycle-hygiene.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const changeName = "improve-sdd-lifecycle-hygiene-and-brief-provenance";

function fixture(callback) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "sdd-hygiene-"));
  try { callback(root); } finally { fs.rmSync(root, { recursive: true, force: true }); }
}

test("captures an explicit brief atomically and converges on the exact same provenance", () => fixture((root) => {
  fs.mkdirSync(path.join(root, "ai-planning/design-briefs"), { recursive: true });
  fs.mkdirSync(path.join(root, "openspec/changes/example-change"), { recursive: true });
  fs.writeFileSync(path.join(root, "ai-planning/design-briefs/source.md"), "# Source\n");
  const input = { workspacePath: root, changePath: "openspec/changes/example-change", sourcePath: "ai-planning/design-briefs/source.md", changeName: "example-change", copiedAt: "2026-08-18T00:00:00.000Z" };
  const first = captureDesignBrief(input);
  assert.equal(first.ok, true);
  assert.equal(first.action, "captured");
  assert.match(fs.readFileSync(path.join(root, first.provenancePath), "utf8"), /source_sha256/);
  assert.equal(captureDesignBrief({ ...input, copiedAt: "2026-08-18T00:01:00.000Z" }).action, "already-captured");
}));

test("rejects unsafe source paths without creating a partial context directory", () => fixture((root) => {
  fs.mkdirSync(path.join(root, "openspec/changes/example-change"), { recursive: true });
  assert.equal(captureDesignBrief({ workspacePath: root, changePath: "openspec/changes/example-change", sourcePath: "../secret.md", changeName: "example-change" }).ok, false);
  assert.equal(fs.existsSync(path.join(root, "openspec/changes/example-change/context")), false);
  assert.equal(validateDesignBriefSource({ workspacePath: root, sourcePath: "/tmp/nope.md" }).ok, false);
}));

test("candidate discovery is deterministic and does not select a brief", () => {
  const ranked = rankDesignBriefCandidates([
    { path: "ai-planning/design-briefs/other.md", content: "lifecycle", mtimeMs: 3 },
    { path: "ai-planning/design-briefs/exact.md", content: "improve-sdd-lifecycle #130", mtimeMs: 1 },
    { path: "ai-planning/design-briefs/newer.md", content: "lifecycle", mtimeMs: 4 }
  ], { changeName: "improve-sdd-lifecycle", issueNumber: 130 });
  assert.equal(ranked[0].path, "ai-planning/design-briefs/exact.md");
  assert.ok(ranked.length <= 3);
});

test("reconciliation uses delivery evidence before ancestry and protects dirty resources", () => {
  assert.equal(classifyLifecycleResource({ deliveryEvidence: true, archiveEvidence: true, specEvidence: true, clean: true, registered: true, primary: false, locked: false, divergent: true }).classification, "delivered-and-safe-to-retire");
  assert.equal(classifyLifecycleResource({ deliveryEvidence: true, archiveEvidence: true, specEvidence: true, clean: false }).classification, "delivered-but-dirty");
  const report = buildLifecycleReconciliationReport({ resources: [{ id: "branch", kind: "branch", deliveryEvidence: true, archiveEvidence: true, specEvidence: true, clean: true, registered: true }], github: { available: false } });
  assert.equal(report.evidenceMode, "local-only");
  assert.equal(report.recommendations.length, 1);
});

test("the supplemental context convention remains strict-validation compatible", () => {
  const context = path.join(repoRoot, "openspec/changes", changeName, "context");
  assert.equal(fs.existsSync(context), false);
  try {
    fs.mkdirSync(context);
    fs.writeFileSync(path.join(context, "design-brief.md"), "# Fixture\n");
    fs.writeFileSync(path.join(context, "design-brief-provenance.yaml"), "schema_version: 1\nsource_path: \"fixture.md\"\n");
    execFileSync("openspec", ["validate", changeName, "--strict"], { cwd: repoRoot, stdio: "pipe" });
  } finally {
    fs.rmSync(context, { recursive: true, force: true });
  }
});

test("Claude and Codex adapters remain thin canonical pointers", () => {
  for (const adapter of [".claude/skills/sdd-lifecycle-hygiene/SKILL.md", ".agents/skills/sdd-lifecycle-hygiene/SKILL.md"]) {
    const content = fs.readFileSync(path.join(repoRoot, adapter), "utf8");
    assert.match(content, /canonical: \.\.\/\.\.\/\.\.\/skills\/base\/sdd-lifecycle-hygiene\/SKILL\.md/);
    assert.match(content, /must not duplicate canonical policy/);
  }
});
