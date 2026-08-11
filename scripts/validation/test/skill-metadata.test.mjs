import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { validateSkillMetadata } from "../validate-skill-metadata.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../../..");

function withFixture(populate, callback) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "skill-metadata-"));
  try {
    populate(root);
    callback(root);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

function addSkill(root, directory, frontmatter) {
  const skillDirectory = path.join(root, directory);
  fs.mkdirSync(skillDirectory, { recursive: true });
  fs.writeFileSync(path.join(skillDirectory, "SKILL.md"), `${frontmatter}\n# Fixture\n`, "utf8");
}

test("canonical skill metadata passes", () => {
  const result = validateSkillMetadata(path.join(repoRoot, "skills/base"));
  assert.equal(result.valid, true, JSON.stringify(result.issues, null, 2));
});

test("dynamically discovers a newly added valid skill", () => {
  withFixture((root) => addSkill(root, "new-skill", "---\nname: new-skill\ndescription: Fixture skill\n---"), (root) => {
    assert.deepEqual(validateSkillMetadata(root), { valid: true, issues: [] });
  });
});

for (const [name, directory, frontmatter, ruleId] of [
  ["missing frontmatter", "missing-frontmatter", "# No frontmatter", "skill-metadata.frontmatter"],
  ["invalid frontmatter", "invalid-frontmatter", "---\nname invalid\n---", "skill-metadata.frontmatter"],
  ["missing name", "missing-name", "---\ndescription: Fixture skill\n---", "skill-metadata.name-required"],
  ["missing description", "missing-description", "---\nname: missing-description\n---", "skill-metadata.description-required"],
  ["name mismatch", "actual-directory", "---\nname: different-directory\ndescription: Fixture skill\n---", "skill-metadata.directory-match"],
  ["invalid name format", "invalid-name", "---\nname: Invalid_Name\ndescription: Fixture skill\n---", "skill-metadata.name-format"]
]) {
  test(`reports ${name}`, () => {
    withFixture((root) => addSkill(root, directory, frontmatter), (root) => {
      const result = validateSkillMetadata(root);
      assert.equal(result.valid, false);
      assert.ok(result.issues.some((issue) => issue.ruleId === ruleId), JSON.stringify(result.issues));
    });
  });
}

test("reports duplicate names", () => {
  withFixture((root) => {
    addSkill(root, "first-skill", "---\nname: first-skill\ndescription: First fixture skill\n---");
    addSkill(root, "second-skill", "---\nname: first-skill\ndescription: Second fixture skill\n---");
  }, (root) => {
    const result = validateSkillMetadata(root);
    assert.equal(result.valid, false);
    assert.ok(result.issues.some((issue) => issue.ruleId === "skill-metadata.duplicate-name"), JSON.stringify(result.issues));
  });
});
