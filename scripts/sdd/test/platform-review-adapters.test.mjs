import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { buildClaudeReviewInvocation, buildCodexDegradedReviewInvocation, buildCodexReviewInvocation, classifyCodexExecutionFailure, createClaudeReviewSettings, degradedCapabilityLedger, probeClaudeReviewAdapter, probeCodexReviewAdapter, runClaudeReviewAdapter, runCodexDegradedReviewAdapter, runCodexReviewAdapter, unavailableReviewResult } from "../platform-review-adapters.mjs";
import { packageDigest, validateReviewResult } from "../independent-review-contract.mjs";
import { normalizedReviewAdapterCapabilities } from "../review-adapter-contract.mjs";

const packageFixture = () => {
  const value = JSON.parse(fs.readFileSync(new URL("../../../evals/skills/independent-review/fixtures/valid-package.json", import.meta.url), "utf8"));
  value.manifestDigest = packageDigest(value);
  return value;
};
const view = { reviewPath: "/tmp/ai-skills-review-fixture/repository" };

test("Codex adapter uses a fresh read-only noninteractive transport without user configuration", () => {
  const invocation = buildCodexReviewInvocation({ view, schemaPath: "/tmp/result-schema.json", resultPath: "/tmp/result.json" });
  assert.deepEqual(invocation.args.slice(0, 11), ["exec", "--sandbox", "read-only", "--ephemeral", "--ignore-user-config", "--ignore-rules", "--cd", view.reviewPath, "--output-schema", "/tmp/result-schema.json", "--output-last-message"]);
  const probe = probeCodexReviewAdapter();
  assert.equal(typeof probe.available, "boolean");
  if (probe.available) assert.equal(probe.capability.denied.delegatedMutation, true);
});

test("degraded Codex transport is explicitly reduced-assurance and scrubs mutation credentials", () => {
  const invocation = buildCodexDegradedReviewInvocation({ view, schemaPath: "/tmp/result-schema.json", resultPath: "/tmp/result.json" });
  assert.deepEqual(invocation.args.slice(0, 5), ["exec", "--sandbox", "read-only", "--ephemeral", "--ignore-user-config"]);
  assert.equal(invocation.args.includes("--ephemeral"), true);
  assert.equal(invocation.environment.GH_TOKEN, "");
  const ledger = degradedCapabilityLedger();
  assert.ok(ledger.enforced.includes("innerReadOnlySandbox"));
  assert.ok(ledger.instructionConstrained.includes("gitWrite"));
  assert.ok(ledger.instructionConstrained.includes("githubMutation"));
});

test("Codex nested app-server denial receives a stable launcher-recovery code", () => {
  assert.equal(classifyCodexExecutionFailure({ stderr: "failed to initialize in-process app-server client: Operation not permitted" }), "independent-reviewer-nested-app-server-denied");
  assert.equal(classifyCodexExecutionFailure({ stderr: "other failure" }), "independent-reviewer-codex-execution-unavailable");
});

test("degraded adapter seals reviewer findings into parent-owned exact-package evidence", () => {
  const reviewPackage = packageFixture();
  const strictResult = unavailableReviewResult("independent-reviewer-nested-app-server-denied", { reviewPackage, adapter: "codex", reviewer: { type: "codex", identity: "strict-reviewer" }, attestationRef: "strict-attestation" });
  const temporary = fs.mkdtempSync("/tmp/degraded-adapter-");
  const resultPath = `${temporary}/result.json`;
  const payload = { schemaVersion: 1, findings: [], status: "passed" };
  const run = (_executable, args) => {
    assert.ok(args.includes("read-only"));
    fs.writeFileSync(resultPath, JSON.stringify(payload));
    return { status: 0, signal: null, stdout: "", stderr: "" };
  };
  try {
    const output = runCodexDegradedReviewAdapter({
      reviewPackage,
      view,
      schemaPath: "/tmp/findings-schema.json",
      resultPath,
      reviewer: { type: "codex-degraded", identity: "degraded-reviewer" },
      attestationRef: "degraded-attestation",
      strictResult,
      degradedAuthorization: { change: "change", transition: "merge-pr", expiresAt: "2026-08-14T00:00:00.000Z", riskReason: "synthetic risk acceptance", fallbackBoundary: "fresh-separated-reviewer-only" },
      run
    });
    assert.equal(output.status, "passed");
    assert.equal(output.result.assuranceLevel, "authorized-degraded");
    assert.equal(output.result.strictUnavailable.unavailableCode, "independent-reviewer-nested-app-server-denied");
    assert.deepEqual(output.result.findings, []);
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
});

test("findings output schema is accepted by strict structured-output validators", () => {
  const schema = JSON.parse(fs.readFileSync(new URL("../../../schemas/independent-review-findings-v1.schema.json", import.meta.url), "utf8"));
  assert.deepEqual(schema.properties.schemaVersion, { type: "integer", const: 1 });
  assert.equal(schema.additionalProperties, false);
  assert.deepEqual(new Set(schema.required), new Set(Object.keys(schema.properties)));
});

test("Claude adapter uses a temporary strict sandbox configuration without inherited settings", () => {
  const settings = createClaudeReviewSettings(view);
  assert.equal(settings.sandbox.failIfUnavailable, true);
  assert.equal(settings.sandbox.allowUnsandboxedCommands, false);
  assert.deepEqual(settings.sandbox.network.allowedDomains, []);
  assert.deepEqual(settings.sandbox.filesystem.denyWrite, [view.reviewPath]);
  const invocation = buildClaudeReviewInvocation({ view, settingsPath: "/tmp/temporary-settings.json", schema: { type: "object" } });
  assert.ok(invocation.args.includes("--setting-sources"));
  assert.equal(invocation.args[invocation.args.indexOf("--setting-sources") + 1], "");
  assert.equal(invocation.args.includes("--bare"), false);
  assert.ok(invocation.args.includes("--no-session-persistence"));
  const probe = probeClaudeReviewAdapter();
  assert.equal(typeof probe.available, "boolean");
});

test("unavailable transport output remains exact-head data and cannot claim isolation", () => {
  const reviewPackage = packageFixture();
  const result = unavailableReviewResult("independent-reviewer-codex-runtime-unavailable", { reviewPackage, adapter: "codex", reviewer: { type: "codex", identity: "codex-reviewer" }, attestationRef: "attestations/codex-read-only-v1.json" });
  assert.equal(result.status, "unavailable");
  assert.equal(result.attestation.readOnly, false);
  assert.equal(validateReviewResult(result, { expectedPackage: reviewPackage, configuredReviewer: { type: "codex", identity: "codex-reviewer", attestation: { ref: "attestations/codex-read-only-v1.json" } }, implementerSession: "implementer" }).valid, true);
});

test("both adapters record an exact fail-closed unavailable result when no structured output exists", () => {
  const reviewPackage = packageFixture();
  const run = () => ({ status: 1, signal: null, stdout: "", stderr: "runtime unavailable" });
  const codex = runCodexReviewAdapter({ reviewPackage, view, schemaPath: "/tmp/schema.json", resultPath: "/tmp/no-result.json", executable: "/missing-codex", reviewer: { type: "codex", identity: "codex-reviewer" }, attestationRef: "attestations/codex-read-only-v1.json", run });
  const claude = runClaudeReviewAdapter({ reviewPackage, view, settingsPath: "/tmp/claude-settings-test.json", schema: { type: "object" }, executable: "/missing-claude", reviewer: { type: "claude", identity: "claude-reviewer" }, attestationRef: "attestations/claude-sandbox-v1.json", run });
  for (const item of [codex, claude]) {
    assert.equal(item.status, "unavailable");
    assert.equal(item.result.status, "unavailable");
    assert.equal(item.result.baseCommit, reviewPackage.baseCommit);
    assert.equal(item.result.attestation.readOnly, false);
  }
});

test("Codex and Claude shaped results use one validator and thin wrappers contain no policy", () => {
  const reviewPackage = packageFixture();
  for (const [adapter, identity, ref] of [["codex", "codex-reviewer", "attestations/codex-read-only-v1.json"], ["claude", "claude-reviewer", "attestations/claude-sandbox-v1.json"]]) {
    const result = JSON.parse(fs.readFileSync(new URL("../../../evals/skills/independent-review/fixtures/valid-result.json", import.meta.url), "utf8"));
    result.reviewer = { type: adapter, identity, adapter };
    result.attestation.ref = ref;
    result.manifestDigest = reviewPackage.manifestDigest;
    assert.equal(validateReviewResult(result, { expectedPackage: reviewPackage, configuredReviewer: { type: adapter, identity, attestation: { ref } }, implementerSession: "implementer" }).valid, true);
    const capability = normalizedReviewAdapterCapabilities({ adapter, attestationRef: ref, probeReference: `${adapter}-probe`, runtimeEnforced: true, freshContext: true, nonInteractive: true, readOnlyView: true, denied: { workspaceWrite: true, gitWrite: true, githubMutation: true, credentialAccess: true, authenticatedNetwork: true, externalSend: true, deployment: true, release: true, delegatedMutation: true } });
    assert.equal(capability.valid, true);
  }
  for (const relative of [".agents/skills/independent-review/SKILL.md", ".claude/skills/independent-review/SKILL.md"]) {
    const text = fs.readFileSync(new URL(`../../../${relative}`, import.meta.url), "utf8");
    assert.doesNotMatch(text, /authorization|severity|disposition|jizzoe/i);
  }
});
