import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.resolve(new URL("../../..", import.meta.url).pathname);
const canonical = path.join(root, "skills/base/sdd-requirements-to-plan/SKILL.md");
const codex = path.join(root, ".agents/skills/sdd-requirements-to-plan/SKILL.md");
const claude = path.join(root, ".claude/skills/sdd-requirements-to-plan/SKILL.md");
const text = fs.readFileSync(canonical, "utf8");
const flat = text.replace(/\s+/g, " ");

test("trigger: metadata names the pre-mutation delivery-plan boundary", () => {
  assert.match(text, /^name: sdd-requirements-to-plan$/m);
  assert.match(flat, /before issue, branch, OpenSpec artifact, or implementation mutation/);
});

test("non-trigger: activation description excludes product-direction and inferred acceptance behavior", () => {
  assert.match(flat, /do not use it to choose a product direction, automatically create governance records, or infer missing acceptance behavior/);
});

test("missing input: gap behavior never invents requirements or acceptance behavior", () => {
  assert.match(flat, /paused result naming the gap/);
  assert.match(flat, /Do not invent requirements or acceptance behavior/);
});

test("readiness gaps become open questions rather than guessed tasks", () => {
  assert.match(flat, /openQuestions. entry with `status: paused`/);
  assert.match(flat, /never convert it into a guessed task/);
});

test("dependency-aware-work-selection is reused rather than re-derived", () => {
  assert.match(flat, /delegate to `dependency-aware-work-selection`/);
  assert.match(flat, /Do not generate OpenSpec proposal, design, delta spec, or task content/);
});

test("autonomous action and pause reference the bounded local-implementation profile and profile-risk conflicts", () => {
  assert.match(flat, /local-implementation/);
  assert.match(flat, /requested profile conflicts with risk or data constraints/);
});

test("delivery authority is named per candidate, never implied by profile alone", () => {
  assert.match(flat, /selecting a delivery profile alone never grants that authority/);
});

test("output-path safety: plan writes only to the configured output path", () => {
  assert.match(flat, /output destination or the `planRoot` default/);
  assert.doesNotMatch(text, /\/Users\//);
});

test("portability: destination resolves from configured planRoot default", () => {
  assert.match(flat, /planRoot. default from `config\/ai-skills\.json`/);
});

test("platform adapters remain thin canonical pointers", () => {
  for (const adapter of [codex, claude]) {
    const adapterText = fs.readFileSync(adapter, "utf8");
    assert.match(adapterText, /canonical: \.\.\/\.\.\/\.\.\/skills\/base\/sdd-requirements-to-plan\/SKILL\.md/);
    assert.match(adapterText, /must not duplicate/);
    assert.ok(adapterText.length < 700);
  }
});
