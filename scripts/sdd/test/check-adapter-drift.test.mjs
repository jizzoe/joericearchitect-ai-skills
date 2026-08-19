import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { checkAdapterDrift } from "../check-adapter-drift.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

function withFixture(populate, callback) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "adapter-drift-"));
  try {
    populate(root);
    callback(root);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

function addCanonicalSkill(root, name = "new-skill") {
  fs.mkdirSync(path.join(root, "skills/base", name), { recursive: true });
  fs.writeFileSync(path.join(root, "skills/base", name, "SKILL.md"), "---\nname: new-skill\ndescription: Fixture skill\n---\n", "utf8");
}

function addAdapter(root, platform, name = "new-skill", content) {
  const canonical = `skills/base/${name}/SKILL.md`;
  const adapter = path.join(root, platform, "skills", name, "SKILL.md");
  fs.mkdirSync(path.dirname(adapter), { recursive: true });
  fs.writeFileSync(adapter, content ?? `Canonical skill: \`${canonical}\`\n\nThis discovery adapter must not duplicate canonical policy.\n`, "utf8");
}

test("root Claude guidance imports the shared repository guidance exactly once", () => {
  assert.equal(fs.readFileSync(path.join(repoRoot, "CLAUDE.md"), "utf8"), "@AGENTS.md\n");
});

test("new canonical skills are discovered without an inventory update", () => {
  withFixture((root) => {
    addCanonicalSkill(root);
    addAdapter(root, ".claude");
    addAdapter(root, ".agents");
  }, (root) => assert.deepEqual(checkAdapterDrift(root), { valid: true, issues: [] }));
});

test("OpenSpec-generated platform assets are outside the canonical catalog", () => {
  withFixture((root) => {
    fs.mkdirSync(path.join(root, ".claude/skills/openspec-generated"), { recursive: true });
    fs.writeFileSync(path.join(root, ".claude/skills/openspec-generated/SKILL.md"), "generated\n", "utf8");
  }, (root) => assert.deepEqual(checkAdapterDrift(root), { valid: true, issues: [] }));
});

test("missing adapters name the generated platform path", () => {
  withFixture((root) => {
    addCanonicalSkill(root);
    addAdapter(root, ".claude");
  }, (root) => {
    const result = checkAdapterDrift(root);
    assert.deepEqual(result.issues, [{ code: "missing-adapter", adapter: ".agents/skills/new-skill/SKILL.md" }]);
  });
});

test("repository-owned adapters must declare their no-policy-duplication boundary", () => {
  withFixture((root) => {
    addCanonicalSkill(root);
    addAdapter(root, ".claude", "new-skill", "Canonical skill: `skills/base/new-skill/SKILL.md`\n");
    addAdapter(root, ".agents");
  }, (root) => {
    assert.deepEqual(checkAdapterDrift(root).issues, [
      { code: "missing-no-policy-duplication-statement", adapter: ".claude/skills/new-skill/SKILL.md" }
    ]);
  });
});

test("adapters fail when they omit canonical references or duplicate policy-sized content", () => {
  withFixture((root) => {
    addCanonicalSkill(root);
    addAdapter(root, ".claude", "new-skill", "This discovery adapter must not duplicate canonical policy.\n");
    addAdapter(root, ".agents", "new-skill", `Canonical skill: \`skills/base/new-skill/SKILL.md\`\n\nThis discovery adapter must not duplicate canonical policy.\n${"x".repeat(1025)}`);
  }, (root) => {
    const result = checkAdapterDrift(root);
    assert.deepEqual(result.issues, [
      { code: "missing-canonical-reference", adapter: ".claude/skills/new-skill/SKILL.md" },
      { code: "adapter-exceeds-thinness-limit", adapter: ".agents/skills/new-skill/SKILL.md", maximumAdapterBytes: 1024 }
    ]);
  });
});
