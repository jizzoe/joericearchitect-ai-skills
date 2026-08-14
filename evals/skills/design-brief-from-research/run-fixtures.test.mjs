import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.resolve(new URL("../../..", import.meta.url).pathname);
const canonical = path.join(root, "skills/base/design-brief-from-research/SKILL.md");
const codex = path.join(root, ".agents/skills/design-brief-from-research/SKILL.md");
const claude = path.join(root, ".claude/skills/design-brief-from-research/SKILL.md");
const text = fs.readFileSync(canonical, "utf8");
const flat = text.replace(/\s+/g, " ");

test("trigger: metadata names the pre-Explore/Propose decision-record boundary", () => {
  assert.match(text, /^name: design-brief-from-research$/m);
  assert.match(flat, /before OpenSpec Explore or Propose/);
});

test("non-trigger: activation description excludes fabricated decisions and artifact generation", () => {
  assert.match(flat, /do not use to fabricate a decision from incomplete evidence or to generate OpenSpec artifacts/);
});

test("missing input: gap behavior never fabricates a decision", () => {
  assert.match(flat, /paused result naming the missing or conflicting evidence/);
  assert.match(flat, /Do not fabricate a decision/);
});

test("untrusted content: conflicting sources become an open question, not a guess", () => {
  assert.match(flat, /sources conflict on a point material to the recommendation without a defensible interpretation/);
});

test("autonomous action and pause reference the bounded local-implementation profile", () => {
  assert.match(flat, /local-implementation/);
  assert.match(flat, /request asks the brief to claim approval that was not given/);
});

test("output-path safety: brief writes only to the configured output path", () => {
  assert.match(flat, /output path or the `designBriefRoot` default/);
  assert.doesNotMatch(text, /\/Users\//);
});

test("portability: destination resolves from configured designBriefRoot default", () => {
  assert.match(flat, /designBriefRoot. default from `config\/ai-skills\.json`/);
});

test("skill stops before OpenSpec artifact generation", () => {
  assert.match(flat, /Do not create OpenSpec proposal, design, delta spec, or task content/);
});

test("platform adapters remain thin canonical pointers", () => {
  for (const adapter of [codex, claude]) {
    const adapterText = fs.readFileSync(adapter, "utf8");
    assert.match(adapterText, /canonical: \.\.\/\.\.\/\.\.\/skills\/base\/design-brief-from-research\/SKILL\.md/);
    assert.match(adapterText, /must not duplicate/);
    assert.ok(adapterText.length < 700);
  }
});
