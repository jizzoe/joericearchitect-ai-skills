import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { buildClaudeDegradedReviewInvocation, buildClaudeReviewInvocation, buildCodexDegradedReviewInvocation, buildCodexParentReviewHostToolRequest, buildCodexReviewInvocation, classifyClaudeExecutionFailure, classifyCodexExecutionFailure, codexAuthenticationEnvironment, consumeCodexParentReviewHostToolResult, createClaudeReviewSettings, degradedCapabilityLedger, invokeReviewProcess, isolatedReviewerEnvironment, probeClaudeReviewAdapter, probeCodexReviewAdapter, runClaudeDegradedReviewAdapter, runClaudeReviewAdapter, runCodexDegradedReviewAdapter, runCodexReviewAdapter, sanitizedReviewEnvironment, unavailableReviewResult, writePreparedReviewHostRequest, writeReviewPackageForView } from "../platform-review-adapters.mjs";
import { packageDigest, validateReviewResult } from "../independent-review-contract.mjs";
import { normalizedReviewAdapterCapabilities } from "../review-adapter-contract.mjs";

const packageFixture = () => {
  const value = JSON.parse(fs.readFileSync(new URL("../../../evals/skills/independent-review/fixtures/valid-package.json", import.meta.url), "utf8"));
  value.manifestDigest = packageDigest(value);
  return value;
};
const view = { reviewPath: "/tmp/ai-skills-review-fixture/repository" };

test("review package injection rejects a pre-existing symlink without changing its target", () => {
  const temporary = fs.mkdtempSync("/tmp/review-package-injection-");
  const reviewPath = `${temporary}/repository`;
  const canaryPath = `${temporary}/outside-canary.json`;
  const packagePath = `${reviewPath}/.ai-independent-review-package.json`;
  fs.mkdirSync(reviewPath);
  fs.writeFileSync(canaryPath, "outside\n");
  fs.symlinkSync(canaryPath, packagePath);
  try {
    assert.throws(
      () => writeReviewPackageForView({ reviewPath }, packageFixture()),
      (error) => error?.code === "EEXIST"
    );
    assert.equal(fs.readFileSync(canaryPath, "utf8"), "outside\n");
    assert.equal(fs.lstatSync(packagePath).isSymbolicLink(), true);
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
});

test("strict and degraded reviewer subprocesses receive only allowlisted operational environment", () => {
  const parentEnvironment = {
    PATH: "/usr/bin:/bin",
    HOME: "/tmp/reviewer-home",
    LANG: "en_US.UTF-8",
    UNLISTED_SYNTHETIC_CREDENTIAL: "must-not-leak",
    OPENAI_API_KEY: "must-not-leak",
    ANTHROPIC_API_KEY: "must-not-leak",
    NODE_OPTIONS: "--require=/tmp/untrusted-hook.cjs"
  };
  const schema = { type: "object" };
  const reviewerHomePath = "/tmp/isolated-reviewer-home";
  const authenticationEnvironment = codexAuthenticationEnvironment(parentEnvironment);
  const invocations = [
    ["Codex strict", buildCodexReviewInvocation({ view, schemaPath: "/tmp/schema.json", resultPath: "/tmp/result.json", authenticationEnvironment }), parentEnvironment.HOME],
    ["Codex degraded", buildCodexDegradedReviewInvocation({ view, schemaPath: "/tmp/schema.json", resultPath: "/tmp/result.json", authenticationEnvironment }), parentEnvironment.HOME],
    ["Claude strict", buildClaudeReviewInvocation({ view, settingsPath: "/tmp/settings.json", schema, reviewerHomePath }), reviewerHomePath],
    ["Claude degraded", buildClaudeDegradedReviewInvocation({ view, schema, reviewerHomePath }), reviewerHomePath]
  ];

  for (const [label, invocation, expectedHome] of invocations) {
    let receivedEnvironment = null;
    invokeReviewProcess(invocation, view, (_executable, _args, options) => {
      receivedEnvironment = options.env;
      return { status: 0, signal: null, stdout: "", stderr: "" };
    }, parentEnvironment);
    assert.equal(receivedEnvironment.PATH, parentEnvironment.PATH, `${label} retains PATH`);
    assert.equal(receivedEnvironment.HOME, expectedHome, `${label} uses only its required authentication boundary`);
    if (label.startsWith("Codex")) {
      assert.ok(invocation.args.includes("default_permissions=\"sealed-review\""), `${label} uses a restricted OS permission profile`);
      assert.ok(invocation.args.includes("permissions.sealed-review={filesystem={\":minimal\"=\"read\",\":workspace_roots\"={\".\"=\"read\"}},network={enabled=false}}"), `${label} restricts reads to its workspace and minimal runtime paths`);
      assert.ok(invocation.args.includes("shell_environment_policy.inherit=\"none\""), `${label} denies authentication variables to model-generated commands`);
    } else {
      assert.notEqual(receivedEnvironment.HOME, parentEnvironment.HOME, `${label} rejects the caller home`);
      assert.equal(receivedEnvironment.XDG_CONFIG_HOME, `${reviewerHomePath}/config`, `${label} isolates configuration`);
    }
    assert.equal(receivedEnvironment.NO_COLOR, "1", `${label} applies fixed adapter overrides`);
    assert.equal("UNLISTED_SYNTHETIC_CREDENTIAL" in receivedEnvironment, false, `${label} rejects an unlisted credential`);
    assert.equal("OPENAI_API_KEY" in receivedEnvironment, false, `${label} rejects OpenAI credentials`);
    assert.equal("ANTHROPIC_API_KEY" in receivedEnvironment, false, `${label} rejects Anthropic credentials`);
    assert.equal("NODE_OPTIONS" in receivedEnvironment, false, `${label} rejects process injection options`);
  }

  assert.deepEqual(sanitizedReviewEnvironment(parentEnvironment), {
    PATH: parentEnvironment.PATH,
    LANG: parentEnvironment.LANG
  });
  assert.deepEqual(isolatedReviewerEnvironment("relative/home"), {});
});

test("Codex adapter uses a fresh read-only noninteractive transport without user configuration", () => {
  const invocation = buildCodexReviewInvocation({ view, schemaPath: "/tmp/result-schema.json", resultPath: "/tmp/result.json" });
  assert.equal(invocation.args[0], "exec");
  assert.ok(invocation.args.includes("default_permissions=\"sealed-review\""));
  assert.ok(invocation.args.includes("permissions.sealed-review={filesystem={\":minimal\"=\"read\",\":workspace_roots\"={\".\"=\"read\"}},network={enabled=false}}"));
  assert.equal(invocation.args.includes("--sandbox"), false);
  assert.ok(invocation.args.includes("--ephemeral"));
  assert.ok(invocation.args.includes("--ignore-user-config"));
  const probe = probeCodexReviewAdapter();
  assert.equal(typeof probe.available, "boolean");
  if (probe.available) assert.equal(probe.capability.denied.delegatedMutation, true);
});

test("degraded Codex transport is explicitly reduced-assurance and scrubs mutation credentials", () => {
  const invocation = buildCodexDegradedReviewInvocation({ view, schemaPath: "/tmp/result-schema.json", resultPath: "/tmp/result.json" });
  assert.equal(invocation.args[0], "exec");
  assert.ok(invocation.args.includes("default_permissions=\"sealed-review\""));
  assert.equal(invocation.args.includes("--ephemeral"), true);
  assert.equal(invocation.environment.GH_TOKEN, "");
  const ledger = degradedCapabilityLedger();
  assert.ok(ledger.enforced.includes("innerReadOnlySandbox"));
  assert.ok(ledger.unavailable.includes("authenticatedParentLaunchEvidence"));
  assert.ok(ledger.unavailable.includes("hostPinnedReviewerExecutableIdentity"));
  assert.ok(ledger.instructionConstrained.includes("gitWrite"));
  assert.ok(ledger.instructionConstrained.includes("githubMutation"));
});

test("Codex nested app-server denial receives a stable launcher-recovery code", () => {
  assert.equal(classifyCodexExecutionFailure({ stderr: "failed to initialize in-process app-server client: Operation not permitted" }), "independent-reviewer-nested-app-server-denied");
  assert.equal(classifyCodexExecutionFailure({ stderr: "other failure" }), "independent-reviewer-codex-execution-unavailable");
});

test("Codex parent transport builds only the fixed escalated host tool request and consumes its result", () => {
  const digest = "a".repeat(64);
  const prepared = {
    allowed: true,
    code: "review-launcher-external-host-required",
    hostRequest: { requestDigest: digest },
    expectedRecovery: { hostScript: "scripts/sdd/review-launcher-host.mjs" }
  };
  const temporary = fs.mkdtempSync("/tmp/codex-parent-transport-");
  try {
    const written = writePreparedReviewHostRequest(prepared, temporary);
    assert.equal(written.available, true, JSON.stringify(written));
    assert.equal(fs.lstatSync(written.requestPath).isSymbolicLink(), false);
    assert.equal(writePreparedReviewHostRequest(prepared, temporary).code, "review-launcher-runtime-request-write-failed");

    const toolRequest = buildCodexParentReviewHostToolRequest({
      prepared,
      preparedRequestPath: written.requestPath,
      repositoryPath: process.cwd()
    });
    assert.equal(toolRequest.available, true, JSON.stringify(toolRequest));
    assert.equal(toolRequest.tool, "exec_command");
    assert.equal(toolRequest.sandboxPermissions, "require_escalated");
    assert.equal(toolRequest.approvalPolicyRequirement, "interactive");
    assert.equal(toolRequest.approvalReviewer, "auto_review");
    assert.deepEqual(toolRequest.arguments.slice(1), [written.requestPath]);
    assert.equal(toolRequest.arguments.some((value) => /host-debug|danger-full-access|--yolo/.test(value)), false);

    const response = {
      requestDigest: digest,
      hostExecutionId: "host-execution",
      launcherId: "codex-review-launcher",
      launcherKind: "codex-detached-read-only-v1"
    };
    const consumed = consumeCodexParentReviewHostToolResult({
      toolRequest,
      toolResult: { exit_code: 0, output: JSON.stringify(response) }
    });
    assert.equal(consumed.status, "executed");
    assert.equal(consumed.runtimeReceipt.source, "codex-exec-tool");
    assert.equal(consumed.runtimeReceipt.securityVerifiable, false);
    assert.equal("attestedBy" in consumed.runtimeReceipt, false);
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
});

test("Codex parent transport rejects unvalidated request paths and arbitrary payloads", () => {
  const invalid = buildCodexParentReviewHostToolRequest({
    prepared: { allowed: true, code: "review-launcher-external-host-required", hostRequest: { requestDigest: "a".repeat(64) }, expectedRecovery: { hostScript: "scripts/sdd/review-launcher-host.mjs" } },
    preparedRequestPath: "$(touch /tmp/untrusted)",
    repositoryPath: process.cwd()
  });
  assert.equal(invalid.code, "review-launcher-codex-tool-request-invalid");
  assert.equal(consumeCodexParentReviewHostToolResult({ toolRequest: invalid, toolResult: { output: "{}" } }).status, "unavailable");
});

test("degraded adapter seals reviewer findings into parent-owned exact-package evidence", () => {
  const reviewPackage = packageFixture();
  const strictResult = unavailableReviewResult("independent-reviewer-nested-app-server-denied", { reviewPackage, adapter: "codex", reviewer: { type: "codex", identity: "strict-reviewer" }, attestationRef: "strict-attestation" });
  const temporary = fs.mkdtempSync("/tmp/degraded-adapter-");
  const resultPath = `${temporary}/result.json`;
  const payload = { schemaVersion: 1, findings: [], status: "passed" };
  const run = (_executable, args) => {
    assert.ok(args.includes("default_permissions=\"sealed-review\""));
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
    assert.ok(output.result.capabilityLedger.unavailable.includes("authenticatedParentLaunchEvidence"));
    assert.ok(output.result.capabilityLedger.unavailable.includes("hostPinnedReviewerExecutableIdentity"));
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
  assert.equal("allOf" in schema, false);
});

test("strict result schema distinguishes unavailable from proven isolation", () => {
  const schema = JSON.parse(fs.readFileSync(new URL("../../../schemas/independent-review-result-v1.schema.json", import.meta.url), "utf8"));
  assert.equal(schema.allOf.length, 4);
  assert.equal(schema.allOf[0].if.properties.status.enum.includes("passed"), true);
  assert.equal(schema.allOf[1].if.properties.status.const, "unavailable");
  assert.equal(schema.allOf[1].then.properties.attestation.properties.readOnly.const, false);
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

test("degraded Claude transport is fresh, read/search-only, and truthfully reduced-assurance", () => {
  const schema = JSON.parse(fs.readFileSync(new URL("../../../schemas/independent-review-findings-v1.schema.json", import.meta.url), "utf8"));
  const invocation = buildClaudeDegradedReviewInvocation({ view, schema });
  assert.ok(invocation.args.includes("--safe-mode"));
  assert.ok(invocation.args.includes("--no-session-persistence"));
  assert.equal(invocation.args[invocation.args.indexOf("--tools") + 1], "Read,Glob,Grep");
  assert.match(invocation.args[invocation.args.indexOf("--disallowed-tools") + 1], /Bash/);
  assert.equal(invocation.environment.GH_TOKEN, "");
});

test("degraded Claude adapter seals findings with Claude-specific reduced-assurance evidence", () => {
  const reviewPackage = packageFixture();
  const strictResult = unavailableReviewResult("independent-reviewer-claude-sandbox-unavailable", { reviewPackage, adapter: "claude", reviewer: { type: "claude", identity: "strict-reviewer" }, attestationRef: "strict-attestation" });
  const run = () => ({ status: 0, signal: null, stdout: JSON.stringify({ structured_output: { schemaVersion: 1, findings: [], status: "passed" } }), stderr: "" });
  const output = runClaudeDegradedReviewAdapter({
    reviewPackage,
    view,
    schemaPath: new URL("../../../schemas/independent-review-findings-v1.schema.json", import.meta.url),
    reviewer: { type: "claude-degraded", identity: "degraded-reviewer" },
    attestationRef: "degraded-attestation",
    strictResult,
    degradedAuthorization: { change: "change", transition: "merge-pr", expiresAt: "2026-08-14T00:00:00.000Z", riskReason: "synthetic risk acceptance", fallbackBoundary: "fresh-separated-reviewer-only" },
    executable: "claude",
    run,
    probe: () => ({ available: true })
  });
  assert.equal(output.status, "passed");
  assert.equal(output.result.reviewer.adapter, "claude");
  assert.ok(output.result.capabilityLedger.enforced.includes("disabledMutationTools"));
  assert.ok(output.result.capabilityLedger.unavailable.includes("authenticatedParentLaunchEvidence"));
  assert.ok(output.result.capabilityLedger.unavailable.includes("hostPinnedReviewerExecutableIdentity"));
  assert.equal(output.result.attestation.readOnly, false);
});

test("Claude sandbox denial receives a stable launcher-recovery code", () => {
  assert.equal(classifyClaudeExecutionFailure({ stderr: "sandbox unavailable because failIfUnavailable was set" }), "independent-reviewer-claude-sandbox-unavailable");
  assert.equal(classifyClaudeExecutionFailure({ stderr: "authentication failed" }), "independent-reviewer-claude-execution-unavailable");
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
