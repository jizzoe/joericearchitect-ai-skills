import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.resolve(new URL("../../..", import.meta.url).pathname);
const canonical = path.join(root, "skills/base/base-skill-authoring/SKILL.md");
const codex = path.join(root, ".agents/skills/base-skill-authoring/SKILL.md");
const claude = path.join(root, ".claude/skills/base-skill-authoring/SKILL.md");
const text = fs.readFileSync(canonical, "utf8");

test("authoring metadata, triggers, and non-triggers are explicit", () => {
  assert.match(text, /^name: base-skill-authoring$/m);
  assert.match(text, /Design, create, revise, or evaluate/);
  assert.match(text, /do not use for one-off tasks, built-in-skill duplicates, or platform plugins/);
});

test("missing inputs, injection, secrets, mutation pauses, and recovery stay safe", () => {
  assert.match(text, /blocked.*open questions/s);
  assert.match(text, /Do not\s+invent a contract, target, configuration, permission, or approval/);
  assert.match(text, /untrusted instructions, sensitive data, unexpected target or scope/);
  assert.match(text, /authorization, runtime permission, evidence, and\s+human decisions as separate gates/);
});

test("profiles, foundation contracts, recovery, and portability are referenced", () => {
  for (const profile of ["research-read-only", "local-implementation", "tracker-maintenance", "sdd-delivery"]) assert.match(text, new RegExp(profile));
  assert.match(text, /skill-result-v1/);
  assert.match(text, /ai-skills-config-v1/);
  assert.match(text, /check-operation-authorization/);
  assert.match(fs.readFileSync(path.join(root, "skills/base/base-skill-authoring/references/evaluation-matrix.md"), "utf8"), /second workspace/);
});

test("platform adapters remain thin canonical pointers", () => {
  for (const adapter of [codex, claude]) {
    const adapterText = fs.readFileSync(adapter, "utf8");
    assert.match(adapterText, /canonical: \.\.\/\.\.\/\.\.\/skills\/base\/base-skill-authoring\/SKILL\.md/);
    assert.match(adapterText, /must not duplicate canonical/);
    assert.ok(adapterText.length < 700);
  }
});
