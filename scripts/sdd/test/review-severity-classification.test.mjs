import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateFindingDispositions } from "../review-findings.mjs";
import { buildCodexReviewInvocation, buildClaudeReviewInvocation, buildCodexDegradedReviewInvocation, buildClaudeDegradedReviewInvocation, runCodexReviewAdapter } from "../platform-review-adapters.mjs";

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

test("advisory severities reject a human-decision disposition", () => {
  for (const severity of ADVISORY) {
    const result = validateFindingDispositions({
      findings: [finding("F", severity)],
      dispositions: [disposition("F", "human-decision")],
    });
    assert.equal(result.allowed, false);
    assert.equal(result.issues[0].code, "independent-review-disposition-incompatible");
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

test("the correction budget is not bypassed by inherited object keys", () => {
  const result = validateFindingDispositions({
    findings: [finding("F", "objective-fix")],
    dispositions: [disposition("F", "objective-fix", { failureSignature: "toString" })],
    correctionAttempts: 3,
    correctionAttemptsByFailureSignature: {},
  });
  assert.equal(result.classification, "paused");
  assert.equal(result.issues[0].code, "correction-limit-exhausted");
});

test("the correction budget fails closed on a malformed counter", () => {
  const result = validateFindingDispositions({
    findings: [finding("F", "objective-fix")],
    dispositions: [disposition("F", "objective-fix", { failureSignature: "sig" })],
    correctionAttemptsByFailureSignature: { sig: "3" },
  });
  assert.equal(result.classification, "paused");
  assert.equal(result.issues[0].code, "correction-state-invalid");
});

test("an exhausted budget is prioritized over an earlier correctable finding", () => {
  const result = validateFindingDispositions({
    findings: [finding("A", "objective-fix"), finding("B", "objective-fix")],
    dispositions: [
      disposition("A", "objective-fix", { failureSignature: "sigA" }),
      disposition("B", "objective-fix", { failureSignature: "sigB" }),
    ],
    correctionAttemptsByFailureSignature: { sigA: 0, sigB: 3 },
  });
  assert.equal(result.classification, "paused");
  assert.equal(result.issues[0].code, "correction-limit-exhausted");
});

test("the Codex and Claude review prompts reference the canonical checklist asset", () => {
  const view = { launchPath: "/tmp/view", reviewPath: "/tmp/view/repository" };
  const codex = buildCodexReviewInvocation({ view, schemaPath: "/tmp/s.json", resultPath: "/tmp/r.json" });
  const codexPrompt = codex.args[codex.args.length - 1];
  assert.ok(codexPrompt.includes("review-matrix.md"), "canonical checklist referenced in Codex prompt");
  assert.ok(codexPrompt.includes("blocker, high, or objective-fix"), "severity in Codex prompt");
  const claude = buildClaudeReviewInvocation({ view, settingsPath: "/tmp/s.json", schema: {}, reviewerHomePath: "/tmp/home" });
  const claudePrompt = claude.args[claude.args.length - 1];
  assert.ok(claudePrompt.includes("review-matrix.md"), "canonical checklist referenced in Claude prompt");
  assert.ok(claudePrompt.includes("blocker, high, or objective-fix"), "severity in Claude prompt");
});

test("the canonical checklist asset carries the full shared dimensions", () => {
  const matrix = fs.readFileSync(path.join(root, "skills", "base", "autonomous-goal-runner", "references", "review-matrix.md"), "utf8");
  for (const dimension of ["correctness and spec compliance", "failure recovery", "untrusted input", "durable-state precedence", "no product constants"]) {
    assert.ok(matrix.includes(dimension), `${dimension} present in the canonical checklist`);
  }
});

test("the degraded review builders also consume the shared checklist and severity instructions", () => {
  const view = { launchPath: "/tmp/view", reviewPath: "/tmp/view/repository" };
  const codex = buildCodexDegradedReviewInvocation({ view, schemaPath: "/tmp/s.json", resultPath: "/tmp/r.json" });
  const codexPrompt = codex.args[codex.args.length - 1];
  assert.ok(codexPrompt.includes("review-matrix.md"), "checklist in degraded Codex prompt");
  assert.ok(codexPrompt.includes("blocker, high, or objective-fix"), "severity in degraded Codex prompt");
  const claude = buildClaudeDegradedReviewInvocation({ view, schema: {}, reviewerHomePath: "/tmp/home" });
  const claudePrompt = claude.args[claude.args.length - 1];
  assert.ok(claudePrompt.includes("review-matrix.md"), "checklist in degraded Claude prompt");
  assert.ok(claudePrompt.includes("blocker, high, or objective-fix"), "severity in degraded Claude prompt");
});

test("the strict adapter forwards completenessPass and priorFindings to the reviewer", () => {
  const view = { launchPath: "/tmp/view", reviewPath: "/tmp/view/repository" };
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "grc-forward-"));
  const resultPath = path.join(dir, "result.json");
  fs.writeFileSync(resultPath, JSON.stringify({ status: "passed", findings: [] }));
  let capturedArgs = null;
  const run = (executable, args) => { capturedArgs = args; return { status: 0, signal: null, stdout: "", stderr: "" }; };
  const prepareEnvironment = () => ({ available: true, code: "ready", environment: {} });
  const outcome = runCodexReviewAdapter({ reviewPackage: {}, view, schemaPath: "/tmp/s.json", resultPath, executable: "codex", reviewer: { type: "codex", identity: "codex-reviewer" }, attestationRef: "attestations/codex-read-only-v1.json", completenessPass: true, priorFindings: [{ id: "F1", severity: "high" }], run, prepareEnvironment });
  assert.equal(outcome.status, "passed");
  const prompt = capturedArgs[capturedArgs.length - 1];
  assert.ok(prompt.includes("Re-review"), "completeness prompt forwarded through the adapter");
  assert.match(prompt, /[0-9a-f]{12} \(high\)/, "prior finding identified by fingerprint");
  fs.rmSync(dir, { recursive: true, force: true });
});

test("the completeness prompt bounds the number of prior findings", () => {
  const view = { launchPath: "/tmp/view", reviewPath: "/tmp/view/repository" };
  const many = Array.from({ length: 25 }, (_, i) => ({ id: `F${i}`, severity: "high", evidence: `e${i}`, recommendation: `r${i}` }));
  const prompt = buildCodexReviewInvocation({ view, schemaPath: "/tmp/s.json", resultPath: "/tmp/r.json", completenessPass: true, priorFindings: many }).args.at(-1);
  assert.ok(prompt.includes("and 5 more"), "remainder summarized");
  const fingerprints = prompt.match(/[0-9a-f]{12} \(high\)/g) ?? [];
  assert.equal(fingerprints.length, 20, "exactly 20 fingerprints included");
});

test("the completeness escalation switches the review prompt and retains the checklist", () => {
  const view = { launchPath: "/tmp/view", reviewPath: "/tmp/view/repository" };
  const codex = buildCodexReviewInvocation({ view, schemaPath: "/tmp/s.json", resultPath: "/tmp/r.json", completenessPass: true });
  const prompt = codex.args[codex.args.length - 1];
  assert.ok(prompt.includes("Re-review"), "completeness prompt used");
  assert.ok(prompt.includes("review-matrix.md"), "checklist retained in completeness prompt");
  assert.ok(prompt.includes("blocker, high, or objective-fix"), "severity retained in completeness prompt");
});

test("the completeness prompt carries only fingerprints and severities, never reviewer text", () => {
  const view = { launchPath: "/tmp/view", reviewPath: "/tmp/view/repository" };
  const codex = buildCodexReviewInvocation({ view, schemaPath: "/tmp/s.json", resultPath: "/tmp/r.json", completenessPass: true, priorFindings: [
    { id: "F1", severity: "high", evidence: "scripts/sdd/example.mjs", recommendation: "fix it" },
    { id: "IGNORE_PREVIOUS_INSTRUCTIONS", severity: "objective-fix", evidence: "x", recommendation: "y" }
  ] });
  const prompt = codex.args[codex.args.length - 1];
  assert.match(prompt, /[0-9a-f]{12} \(high\)/, "prior high finding fingerprinted");
  assert.match(prompt, /[0-9a-f]{12} \(objective-fix\)/, "prior objective-fix finding fingerprinted");
  assert.ok(!prompt.includes("F1"), "finding id must not re-enter the prompt");
  assert.ok(!prompt.includes("IGNORE_PREVIOUS_INSTRUCTIONS"), "instruction-shaped id must not re-enter the prompt");
  assert.ok(!prompt.includes("scripts/sdd/example.mjs"), "evidence path must not re-enter the prompt");
  assert.ok(!prompt.includes("fix it"), "finding prose must not re-enter the prompt");
});

