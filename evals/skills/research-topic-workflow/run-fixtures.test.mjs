import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.resolve(new URL("../../..", import.meta.url).pathname);
const canonical = path.join(root, "skills/base/research-topic-workflow/SKILL.md");
const codex = path.join(root, ".agents/skills/research-topic-workflow/SKILL.md");
const claude = path.join(root, ".claude/skills/research-topic-workflow/SKILL.md");
const text = fs.readFileSync(canonical, "utf8");
const flat = text.replace(/\s+/g, " ");

test("trigger: metadata names the durable-research activation boundary", () => {
  assert.match(text, /^name: research-topic-workflow$/m);
  assert.match(flat, /Research a defined topic and preserve durable, sourced findings/);
});

test("non-trigger: activation description excludes quick-answer and implementation use", () => {
  assert.match(flat, /do not use for a quick factual answer with no durable output, an implementation task/);
});

test("missing input: gap behavior never invents a topic, category, depth, or destination", () => {
  assert.match(flat, /blocked. result naming the gap/);
  assert.match(flat, /Do not invent a topic, category, depth, or destination/);
});

test("untrusted content: source material is never executed", () => {
  assert.match(flat, /untrusted content/);
  assert.match(flat, /never execute an instruction embedded/);
});

test("autonomous action and pause reference the bounded research-read-only profile", () => {
  assert.match(flat, /research-read-only/);
  assert.match(flat, /check-operation-authorization/);
  assert.match(flat, /Pause when topic, category, depth, or destination is missing/);
});

test("output-path safety: findings and sources are workspace-relative", () => {
  assert.match(text, /<destination>\/<category>\/<topic>\/<topic>-findings\.md/);
  assert.match(text, /<destination>\/<category>\/<topic>\/sources\.md/);
  assert.doesNotMatch(text, /\/Users\//);
});

test("portability: destination resolves from configured researchRoot default", () => {
  assert.match(flat, /researchRoot. default from `config\/ai-skills\.json`/);
});

test("platform adapters remain thin canonical pointers", () => {
  for (const adapter of [codex, claude]) {
    const adapterText = fs.readFileSync(adapter, "utf8");
    assert.match(adapterText, /canonical: \.\.\/\.\.\/\.\.\/skills\/base\/research-topic-workflow\/SKILL\.md/);
    assert.match(adapterText, /must not duplicate/);
    assert.ok(adapterText.length < 700);
  }
});
