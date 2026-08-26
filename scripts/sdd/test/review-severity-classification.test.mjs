import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateFindingDispositions } from "../review-findings.mjs";
import { buildCodexReviewInvocation, buildClaudeReviewInvocation } from "../platform-review-adapters.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const MATERIAL = ["blocker", "high", "objective-fix"];
const ADVISORY = ["warning", "false-positive"];

const finding = (id, severity) => ({ id, severity, evidence: "scripts/sdd/example.mjs", recommendation: "fix" });
const disposition = (findingId, kind, extra = {}) => ({ findingId, kind, evidence: "evidence", ...extra });

test("the findings schema declares exactly the material and advisory severities", () => {
  const schema = JSON.parse(fs.readFileSync(path.join(root, "schemas", "independent-review-findings-v1.schema.json"), "utf8"));
  assert.deepEqual([...schema.properties.findings.items.properties.severity.enum].sort(), [...MATERIAL, ...ADVISORY].sort());
});

test("a material severity opens a correction loop", () => {
  for (const severity of MATERIAL) {
    const result = validateFindingDispositions({
      findings: [finding("F", severity)],
      dispositions: [disposition("F", "objective-fix")],
    });
    assert.equal(result.classification, "objective-fix", `${severity} must open a correction loop`);
  }
});

test("an advisory severity does not block", () => {
  for (const severity of ADVISORY) {
    const kind = severity === "warning" ? "warning" : "false-positive";
    const result = validateFindingDispositions({
      findings: [finding("F", severity)],
      dispositions: [disposition("F", kind)],
    });
    assert.equal(result.allowed, true, `${severity} must be non-blocking`);
  }
});

test("a material severity cannot be dispositioned as advisory", () => {
  const result = validateFindingDispositions({
    findings: [finding("F", "high")],
    dispositions: [disposition("F", "warning")],
  });
  assert.equal(result.allowed, false);
  assert.equal(result.issues[0].code, "independent-review-disposition-incompatible");
});

test("the per-signature correction budget fails closed after three attempts", () => {
  const result = validateFindingDispositions({
    findings: [finding("F", "objective-fix")],
    dispositions: [disposition("F", "objective-fix", { failureSignature: "sig" })],
    correctionAttempts: 0,
    correctionAttemptsByFailureSignature: { sig: 3 },
  });
  assert.equal(result.classification, "paused");
  assert.equal(result.issues[0].code, "correction-limit-exhausted");
});

test("the Codex and Claude review prompts consume the shared checklist and severity instructions", () => {
  const view = { launchPath: "/tmp/view", reviewPath: "/tmp/view/repository" };
  const codex = buildCodexReviewInvocation({ view, schemaPath: "/tmp/s.json", resultPath: "/tmp/r.json" });
  const codexPrompt = codex.args[codex.args.length - 1];
  assert.ok(codexPrompt.includes("correctness and spec compliance"), "checklist in Codex prompt");
  assert.ok(codexPrompt.includes("failure recovery"), "failure recovery in Codex prompt");
  assert.ok(codexPrompt.includes("untrusted input"), "untrusted input in Codex prompt");
  assert.ok(codexPrompt.includes("durable-state precedence"), "durable-state precedence in Codex prompt");
  assert.ok(codexPrompt.includes("no product constants"), "portability/attribution in Codex prompt");
  assert.ok(codexPrompt.includes("blocker, high, or objective-fix"), "severity in Codex prompt");
  const claude = buildClaudeReviewInvocation({ view, settingsPath: "/tmp/s.json", schema: {}, reviewerHomePath: "/tmp/home" });
  const claudePrompt = claude.args[claude.args.length - 1];
  assert.ok(claudePrompt.includes("correctness and spec compliance"), "checklist in Claude prompt");
  assert.ok(claudePrompt.includes("failure recovery"), "failure recovery in Claude prompt");
  assert.ok(claudePrompt.includes("untrusted input"), "untrusted input in Claude prompt");
  assert.ok(claudePrompt.includes("durable-state precedence"), "durable-state precedence in Claude prompt");
  assert.ok(claudePrompt.includes("no product constants"), "portability/attribution in Claude prompt");
  assert.ok(claudePrompt.includes("blocker, high, or objective-fix"), "severity in Claude prompt");
});

test("the completeness escalation switches the review prompt and retains the checklist", () => {
  const view = { launchPath: "/tmp/view", reviewPath: "/tmp/view/repository" };
  const codex = buildCodexReviewInvocation({ view, schemaPath: "/tmp/s.json", resultPath: "/tmp/r.json", completenessPass: true });
  const prompt = codex.args[codex.args.length - 1];
  assert.ok(prompt.includes("Re-review"), "completeness prompt used");
  assert.ok(prompt.includes("correctness and spec compliance"), "checklist retained in completeness prompt");
  assert.ok(prompt.includes("blocker, high, or objective-fix"), "severity retained in completeness prompt");
});

test("the completeness prompt carries only trusted finding ids and severities", () => {
  const view = { launchPath: "/tmp/view", reviewPath: "/tmp/view/repository" };
  const codex = buildCodexReviewInvocation({ view, schemaPath: "/tmp/s.json", resultPath: "/tmp/r.json", completenessPass: true, priorFindings: [{ id: "F1", severity: "high", evidence: "scripts/sdd/example.mjs", recommendation: "fix it" }] });
  const prompt = codex.args[codex.args.length - 1];
  assert.ok(prompt.includes("high (F1)"), "prior finding carried by id + severity");
  assert.ok(!prompt.includes("scripts/sdd/example.mjs"), "evidence path must not re-enter the prompt");
  assert.ok(!prompt.includes("fix it"), "finding prose must not re-enter the prompt");
});

