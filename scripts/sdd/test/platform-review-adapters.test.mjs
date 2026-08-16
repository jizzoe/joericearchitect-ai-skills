import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { buildClaudeDegradedReviewInvocation, buildClaudeReviewInvocation, buildCodexDegradedReviewInvocation, buildCodexParentReviewHostToolRequest, buildCodexParentStrictReviewToolRequest, buildCodexReviewInvocation, classifyClaudeExecutionFailure, classifyCodexExecutionFailure, codexAuthenticationEnvironment, consumeCodexParentReviewHostToolResult, consumeCodexParentStrictReviewToolResult, createClaudeReviewSettings, degradedCapabilityLedger, diagnoseClaudeExecutionFailure, diagnoseCodexExecutionFailure, inspectCodexReviewResultArtifact, invokeReviewProcess, isolatedReviewerEnvironment, prepareCodexReviewerEnvironment, probeClaudeReviewAdapter, probeCodexReviewAdapter, resolveTrustedReviewerExecutable, runClaudeDegradedReviewAdapter, runClaudeReviewAdapter, runCodexDegradedReviewAdapter, runCodexReviewAdapter, sanitizedReviewEnvironment, unavailableReviewResult, writePreparedReviewHostRequest, writeReviewPackageForView } from "../platform-review-adapters.mjs";
import { packageDigest, validateReviewResult } from "../independent-review-contract.mjs";
import { normalizedReviewAdapterCapabilities } from "../review-adapter-contract.mjs";

const packageFixture = () => {
  const value = JSON.parse(fs.readFileSync(new URL("../../../evals/skills/independent-review/fixtures/valid-package.json", import.meta.url), "utf8"));
  value.manifestDigest = packageDigest(value);
  return value;
};
const view = { temporaryRoot: "/tmp/ai-skills-review-fixture", launchPath: "/tmp/ai-skills-review-fixture/review-session", reviewPath: "/tmp/ai-skills-review-fixture/review-session/repository" };

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
    PATH: "/untrusted-parent/bin",
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
  assert.equal(authenticationEnvironment.PATH?.includes("/untrusted-parent/bin"), false, "Codex command path does not inherit the parent path");
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
    assert.equal(
      receivedEnvironment.PATH,
      label.startsWith("Codex") ? authenticationEnvironment.PATH : parentEnvironment.PATH,
      `${label} uses only its deterministic command path`
    );
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

test("Codex reviewer state copies only bounded authentication outside the neutral workspace", () => {
  const temporary = fs.mkdtempSync("/tmp/codex-reviewer-state-");
  const parentHome = `${temporary}/parent-home`;
  const temporaryRoot = `${temporary}/view`;
  const launchPath = `${temporaryRoot}/review-session`;
  const reviewPath = `${launchPath}/repository`;
  fs.mkdirSync(`${parentHome}/.codex/skills/fixture`, { recursive: true });
  fs.mkdirSync(reviewPath, { recursive: true });
  fs.writeFileSync(`${parentHome}/.codex/auth.json`, "fixture-auth\n", { mode: 0o600 });
  fs.writeFileSync(`${parentHome}/.codex/config.toml`, "model = 'fixture'\n");
  fs.writeFileSync(`${parentHome}/.codex/skills/fixture/SKILL.md`, "untrusted fixture\n");
  try {
    const prepared = prepareCodexReviewerEnvironment({ temporaryRoot, launchPath, reviewPath }, { HOME: parentHome });
    assert.equal(prepared.available, true, JSON.stringify(prepared));
    assert.equal(prepared.environment.HOME.startsWith(launchPath), false);
    assert.equal(prepared.environment.CODEX_HOME.startsWith(launchPath), false);
    assert.equal(fs.readFileSync(`${prepared.environment.CODEX_HOME}/auth.json`, "utf8"), "fixture-auth\n");
    assert.equal(fs.existsSync(`${prepared.environment.CODEX_HOME}/config.toml`), false);
    assert.equal(fs.existsSync(`${prepared.environment.CODEX_HOME}/skills`), false);
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
});

test("Codex adapter uses a fresh read-only noninteractive transport without user configuration", () => {
  const invocation = buildCodexReviewInvocation({ view, schemaPath: "/tmp/result-schema.json", resultPath: "/tmp/result.json" });
  assert.equal(invocation.args[0], "exec");
  assert.ok(invocation.args.includes("default_permissions=\"sealed-review\""));
  assert.ok(invocation.args.includes("permissions.sealed-review={filesystem={\":minimal\"=\"read\",\":workspace_roots\"={\".\"=\"read\"}},network={enabled=false}}"));
  assert.equal(invocation.args.includes("--sandbox"), false);
  assert.ok(invocation.args.includes("--ephemeral"));
  assert.ok(invocation.args.includes("--ignore-user-config"));
  assert.ok(invocation.args.includes("--skip-git-repo-check"));
  assert.equal(invocation.args[invocation.args.indexOf("--color") + 1], "never");
  assert.equal(invocation.args[invocation.args.indexOf("--output-last-message") + 1], "/tmp/result.json");
  assert.match(invocation.args.at(-1), /Use bounded reads only/);
  assert.match(invocation.args.at(-1), /\/bin\/cat, \/usr\/bin\/awk, and \/usr\/bin\/perl/);
  assert.match(invocation.args.at(-1), /do not invoke git, sed, rg, ls/);
  const probe = probeCodexReviewAdapter();
  assert.equal(typeof probe.available, "boolean");
  if (probe.available) assert.equal(probe.capability.denied.delegatedMutation, true);
  const missingFinalFileCapability = probeCodexReviewAdapter({ executable: "fixture-codex" }, {
    help: (_executable, _arguments, required) => {
      assert.ok(required.includes("--output-last-message"));
      return false;
    }
  });
  assert.equal(missingFinalFileCapability.code, "independent-reviewer-codex-runtime-unavailable");
  const completeCapability = probeCodexReviewAdapter({ executable: "fixture-codex" }, { help: () => true });
  assert.equal(completeCapability.available, true);
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

test("reviewer subprocess diagnostics expose only safe triage fields", () => {
  assert.equal(classifyCodexExecutionFailure({ stderr: "failed to initialize in-process app-server client: Operation not permitted" }), "independent-reviewer-nested-app-server-denied");
  assert.equal(classifyCodexExecutionFailure({ status: 1, stderr: "WARNING: could not create PATH aliases: Operation not permitted\nNot inside a trusted directory and --skip-git-repo-check was not specified." }), "independent-reviewer-codex-repository-trust-unavailable");
  assert.equal(classifyCodexExecutionFailure({ stderr: "other failure" }), "independent-reviewer-codex-unclassified-runtime-failure");
  assert.equal(classifyClaudeExecutionFailure({ stderr: "authentication failed" }), "independent-reviewer-claude-authentication-unavailable");
  const cases = [
    [diagnoseCodexExecutionFailure({ status: 1, stderr: "authentication token expired at /private/secret" }), "independent-reviewer-codex-authentication-unavailable", "authentication-unavailable", "reviewer-authentication"],
    [diagnoseCodexExecutionFailure({ status: 126, stderr: "sandbox operation not permitted at /private/secret" }), "independent-reviewer-codex-sandbox-unavailable", "permission-denied", "reviewer-sandbox"],
    [diagnoseCodexExecutionFailure({ status: 1, stderr: "WARNING: alias setup: Operation not permitted\nNot inside a trusted directory and --skip-git-repo-check was not specified." }), "independent-reviewer-codex-repository-trust-unavailable", "runtime-unavailable", "reviewer-working-directory"],
    [diagnoseCodexExecutionFailure({ status: 1, stderr: "output-schema validation failed: /private/secret" }), "independent-reviewer-codex-output-contract-invalid", "output-contract-invalid", "reviewer-result-contract"],
    [diagnoseClaudeExecutionFailure({ status: 1, stderr: "network connection timed out for token at /private/secret" }), "independent-reviewer-claude-network-unavailable", "network-unavailable", "reviewer-network"]
  ];
  for (const [diagnostic, code, category, subject] of cases) {
    assert.deepEqual(Object.keys(diagnostic).sort(), ["category", "code", "exitCode", "operation", "safeMessage", "schemaVersion", "stage", "subject"]);
    assert.equal(diagnostic.schemaVersion, 1);
    assert.equal(diagnostic.code, code);
    assert.equal(diagnostic.category, category);
    assert.equal(diagnostic.subject, subject);
    assert.equal(diagnostic.stage, "reviewer-execution");
    assert.equal(diagnostic.exitCode, diagnostic.code.includes("sandbox") ? 126 : 1);
    assert.equal(JSON.stringify(diagnostic).includes("/private/secret"), false);
    assert.equal(JSON.stringify(diagnostic).includes("token expired"), false);
  }
});

test("Codex parent transport builds only the fixed escalated host tool request and consumes its result", () => {
  const digest = "a".repeat(64);
  const reviewPackage = packageFixture();
  const strictResult = unavailableReviewResult("independent-review-view-create-failed", { reviewPackage, adapter: "codex", reviewer: { type: "codex", identity: "strict-reviewer" }, attestationRef: "strict-attestation" });
  const degradedAuthorization = { change: "change", transitions: ["merge-pr"], expiresAt: "2026-08-14T00:00:00.000Z", riskReason: "synthetic risk acceptance", fallbackBoundary: "fresh-separated-reviewer-only" };
  const prepared = {
    allowed: true,
    code: "review-launcher-external-host-required",
    hostRequest: { launchId: "launch", requestDigest: digest, request: { reviewPackage, strictResult, transition: "merge-pr", reviewer: { type: "codex-degraded", identity: "degraded-reviewer", attestation: { ref: "degraded-attestation" } }, attestationRef: "degraded-attestation", launcher: { executable: "/opt/tools/codex" }, authorization: { implementerSession: "implementer", degradedIndependentReview: degradedAuthorization } } },
    expectedRecovery: { hostScript: "scripts/sdd/review-launcher-host.mjs", launcherId: "codex-review-launcher", launcherKind: "codex-detached-read-only-v1" }
  };
  const temporary = fs.mkdtempSync("/tmp/codex-parent-transport-");
  const launchPath = `${temporary}/review-session`;
  const reviewPath = `${launchPath}/repository`;
  fs.mkdirSync(`${reviewPath}/schemas`, { recursive: true });
  fs.writeFileSync(`${reviewPath}/schemas/independent-review-findings-v1.schema.json`, "{}\n");
  const viewForTransport = { kind: "archived-review-view-v1", launchPath, reviewPath, temporaryRoot: temporary, headCommit: reviewPackage.headCommit, ownershipToken: "fixture" };
  try {
    const written = writePreparedReviewHostRequest(prepared, temporary);
    assert.equal(written.available, true, JSON.stringify(written));
    assert.equal(fs.lstatSync(written.requestPath).isSymbolicLink(), false);
    assert.equal(writePreparedReviewHostRequest(prepared, temporary).code, "review-launcher-runtime-request-write-failed");

    const toolRequest = buildCodexParentReviewHostToolRequest({
      prepared,
      preparedRequestPath: written.requestPath,
      repositoryPath: process.cwd()
    }, {
      createView: () => ({ available: true, view: viewForTransport }),
      rebuildPackage: () => ({ valid: true, package: reviewPackage }),
      injectPackage: () => `${reviewPath}/.ai-independent-review-package.json`,
      prepareEnvironment: () => ({ available: true, environment: { HOME: `${temporary}/reviewer-home`, PATH: "/usr/bin", NO_COLOR: "1" } })
    });
    assert.equal(toolRequest.available, true, JSON.stringify(toolRequest));
    assert.equal(toolRequest.tool, "exec_command");
    assert.equal(toolRequest.sandboxPermissions, "require_escalated");
    assert.equal(toolRequest.approvalPolicyRequirement, "interactive");
    assert.equal(toolRequest.approvalReviewer, "auto_review");
    assert.equal(toolRequest.executable, "/usr/bin/env");
    assert.ok(toolRequest.arguments.includes("/opt/tools/codex"));
    assert.ok(toolRequest.arguments.some((value) => value.startsWith("PATH=")));
    assert.ok(toolRequest.arguments.includes("--skip-git-repo-check"));
    assert.equal(toolRequest.arguments.some((value) => value.endsWith("review-launcher-host.mjs")), false);
    assert.equal(toolRequest.arguments.some((value) => /host-debug|danger-full-access|--yolo/.test(value)), false);

    fs.writeFileSync(toolRequest.runtimeState.resultPath, "not valid final JSON");
    const transcriptOnly = consumeCodexParentReviewHostToolResult({
      prepared,
      toolRequest,
      toolResult: { exit_code: 0, output: JSON.stringify({ schemaVersion: 1, findings: [], status: "passed" }) }
    }, {
      removeView: (received) => ({ removed: received === viewForTransport }),
      hostExecutionId: "host-execution"
    });
    assert.equal(transcriptOnly.status, "unavailable");
    assert.equal(transcriptOnly.code, "review-launcher-codex-result-artifact-malformed");
    assert.equal(transcriptOnly.diagnostics.parse, "invalid");

    fs.writeFileSync(toolRequest.runtimeState.resultPath, JSON.stringify({ schemaVersion: 1, findings: [], status: "passed" }));
    const normalizationFailure = consumeCodexParentReviewHostToolResult({
      prepared,
      toolRequest,
      toolResult: { exit_code: 0, output: "review completed" }
    }, {
      removeView: (received) => ({ removed: received === viewForTransport }),
      sealPayload: () => null
    });
    assert.equal(normalizationFailure.code, "review-launcher-codex-result-normalization-invalid");

    const validationFailure = consumeCodexParentReviewHostToolResult({
      prepared,
      toolRequest,
      toolResult: { exit_code: 0, output: "review completed" }
    }, {
      removeView: (received) => ({ removed: received === viewForTransport }),
      validateResult: () => ({ valid: false, issues: [{ code: "fixture-validation-failed" }] })
    });
    assert.equal(validationFailure.code, "review-launcher-codex-result-validation-invalid");
    assert.equal(validationFailure.diagnostics.validation, "fixture-validation-failed");

    const strictBindingFailure = consumeCodexParentReviewHostToolResult({
      prepared,
      toolRequest,
      toolResult: { exit_code: 0, output: "review completed" }
    }, {
      removeView: (received) => ({ removed: received === viewForTransport }),
      strictMatches: () => false
    });
    assert.equal(strictBindingFailure.code, "review-launcher-codex-strict-unavailable-mismatch");

    const degradedBindingFailure = consumeCodexParentReviewHostToolResult({
      prepared,
      toolRequest,
      toolResult: { exit_code: 0, output: "review completed" }
    }, {
      removeView: (received) => ({ removed: received === viewForTransport }),
      degradedAuthorizationMatches: () => false
    });
    assert.equal(degradedBindingFailure.code, "review-launcher-codex-degraded-authorization-mismatch");

    const cleanupFailure = consumeCodexParentReviewHostToolResult({
      prepared,
      toolRequest,
      toolResult: { exit_code: 0, output: "review completed" }
    }, {
      removeView: () => ({ removed: false, code: "fixture-cleanup-failed" })
    });
    assert.equal(cleanupFailure.code, "review-launcher-codex-result-cleanup-failed");
    assert.equal(cleanupFailure.diagnostics.cleanup, "fixture-cleanup-failed");

    const consumed = consumeCodexParentReviewHostToolResult({
      prepared,
      toolRequest,
      toolResult: { exit_code: 0, output: "review completed" }
    }, {
      removeView: (received) => ({ removed: received === viewForTransport }),
      hostExecutionId: "host-execution"
    });
    assert.equal(consumed.status, "executed");
    assert.equal(consumed.runtimeReceipt.source, "codex-exec-tool");
    assert.equal(consumed.runtimeReceipt.securityVerifiable, false);
    assert.equal("attestedBy" in consumed.runtimeReceipt, false);
    assert.equal(consumed.response.result.status, "passed");
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
});

test("Codex parent strict transport binds a neutral view, pinned executable, result, and cleanup", () => {
  const temporary = fs.mkdtempSync("/tmp/codex-parent-strict-");
  const launchPath = `${temporary}/review-session`;
  const reviewPath = `${launchPath}/repository`;
  fs.mkdirSync(`${reviewPath}/schemas`, { recursive: true });
  fs.writeFileSync(`${reviewPath}/schemas/independent-review-findings-v1.schema.json`, "{}\n");
  const reviewPackage = packageFixture();
  const executablePath = fs.realpathSync("/bin/echo");
  const executableEntry = fs.statSync(executablePath);
  const executableIdentity = { realPath: executablePath, device: executableEntry.dev, inode: executableEntry.ino, size: executableEntry.size, modifiedMs: executableEntry.mtimeMs };
  const strictView = { kind: "archived-review-view-v1", launchPath, reviewPath, temporaryRoot: temporary, headCommit: reviewPackage.headCommit, ownershipToken: "fixture" };
  try {
    const callerSelectedExecutable = `${temporary}/codex`;
    fs.copyFileSync("/bin/echo", callerSelectedExecutable);
    fs.chmodSync(callerSelectedExecutable, 0o755);
    const rejectedExecutable = buildCodexParentStrictReviewToolRequest({
      reviewPackage,
      repositoryPath: process.cwd(),
      reviewer: { type: "codex", identity: "fresh-strict-reviewer" },
      implementerSession: "implementer-session",
      attestationRef: "attestations/codex-read-only-v1.json",
      executable: callerSelectedExecutable
    });
    assert.equal(rejectedExecutable.code, "independent-reviewer-codex-executable-identity-unavailable");
    let attemptedView = false;
    const unavailablePreflight = buildCodexParentStrictReviewToolRequest({
      reviewPackage,
      repositoryPath: process.cwd(),
      reviewer: { type: "codex", identity: "fresh-strict-reviewer" },
      implementerSession: "implementer-session",
      attestationRef: "attestations/codex-read-only-v1.json"
    }, {
      pinExecutable: (_executable, _expectedName, { preflight }) => {
        preflight.failure = "managed-mutation-proof-unavailable";
        return null;
      },
      createView: () => { attemptedView = true; return { available: true, view: strictView }; }
    });
    assert.equal(unavailablePreflight.code, "independent-reviewer-codex-preflight-boundary-unavailable");
    assert.equal(unavailablePreflight.diagnostic.stage, "adapter-preflight");
    assert.equal(attemptedView, false);
    const toolRequest = buildCodexParentStrictReviewToolRequest({
      reviewPackage,
      repositoryPath: process.cwd(),
      reviewer: { type: "codex", identity: "fresh-strict-reviewer" },
      implementerSession: "implementer-session",
      attestationRef: "attestations/codex-read-only-v1.json"
    }, {
      createView: () => ({ available: true, view: strictView }),
      rebuildPackage: () => ({ valid: true, package: reviewPackage }),
      injectPackage: () => `${reviewPath}/.ai-independent-review-package.json`,
      prepareEnvironment: () => ({ available: true, environment: { HOME: `${temporary}/reviewer-home`, CODEX_HOME: `${temporary}/reviewer-home/codex`, PATH: "/usr/bin", NO_COLOR: "1" } }),
      pinExecutable: () => executableIdentity,
      probeRuntime: () => ({ available: true, capability: {} }),
      clock: () => "2026-08-15T04:00:00.000Z",
      executionId: "strict-execution"
    });
    assert.equal(toolRequest.available, true, JSON.stringify(toolRequest));
    assert.equal(toolRequest.transport, "codex-parent-strict-exec-tool-v1");
    assert.deepEqual(toolRequest.runtimeState.artifactDelivery, { channel: "owned-final-file-v1", outputSchema: true, outputLastMessage: true, color: "never", permissionProfile: "sealed-review" });
    assert.equal(toolRequest.workingDirectory, launchPath);
    assert.ok(toolRequest.arguments.includes(executablePath));
    assert.ok(toolRequest.arguments.includes(launchPath));
    assert.equal(toolRequest.arguments.includes(reviewPath), false, "Codex starts from the neutral parent rather than repository context");
    const tampered = consumeCodexParentStrictReviewToolResult({ toolRequest: { ...toolRequest, workingDirectory: reviewPath }, toolResult: { exit_code: 0, output: "{}" } }, {
      removeView: () => ({ removed: true }),
      clock: () => "2026-08-15T04:01:00.000Z"
    });
    assert.equal(tampered.code, "independent-reviewer-parent-strict-tool-receipt-invalid");
    const tamperedResultPath = consumeCodexParentStrictReviewToolResult({
      toolRequest: { ...toolRequest, runtimeState: { ...toolRequest.runtimeState, resultPath: `${temporary}/attacker-selected.json` } },
      toolResult: { exit_code: 0, output: "{}" }
    }, {
      removeView: () => ({ removed: true }),
      clock: () => "2026-08-15T04:01:00.000Z"
    });
    assert.equal(tamperedResultPath.code, "independent-reviewer-parent-strict-tool-receipt-invalid");
    const tamperedArtifactDelivery = consumeCodexParentStrictReviewToolResult({
      toolRequest: { ...toolRequest, runtimeState: { ...toolRequest.runtimeState, artifactDelivery: { ...toolRequest.runtimeState.artifactDelivery, channel: "stdout-v1" } } },
      toolResult: { exit_code: 0, output: "{}" }
    }, {
      removeView: () => ({ removed: true }),
      clock: () => "2026-08-15T04:01:00.000Z"
    });
    assert.equal(tamperedArtifactDelivery.code, "independent-reviewer-parent-strict-tool-receipt-invalid");
    const tamperedExpiration = consumeCodexParentStrictReviewToolResult({
      toolRequest: { ...toolRequest, runtimeState: { ...toolRequest.runtimeState, expiresAt: "2026-08-16T04:00:00.000Z" } },
      toolResult: { exit_code: 0, output: "{}" }
    }, {
      removeView: () => ({ removed: true }),
      clock: () => "2026-08-15T04:01:00.000Z"
    });
    assert.equal(tamperedExpiration.code, "independent-reviewer-parent-strict-tool-receipt-invalid");
    const authenticationFailure = consumeCodexParentStrictReviewToolResult({ toolRequest, toolResult: { exit_code: 1, output: "authentication token expired at /private/secret" } }, {
      removeView: () => ({ removed: true }),
      verifyExecutable: () => true,
      clock: () => "2026-08-15T04:01:00.000Z"
    });
    assert.equal(authenticationFailure.code, "independent-reviewer-codex-authentication-unavailable");
    assert.equal(JSON.stringify(authenticationFailure).includes("/private/secret"), false);
    assert.equal(authenticationFailure.diagnostics.artifactReceipt, "review-launcher-codex-result-artifact-missing");
    const nonzeroWithArtifact = consumeCodexParentStrictReviewToolResult({ toolRequest, toolResult: { exit_code: 1, output: "authentication failed" } }, {
      removeView: () => ({ removed: true }),
      verifyExecutable: () => true,
      inspectResult: () => ({ available: true, diagnostics: { resultArtifactPresent: true, parse: "valid", payload: "valid" } }),
      clock: () => "2026-08-15T04:01:00.000Z"
    });
    assert.equal(nonzeroWithArtifact.code, "independent-reviewer-codex-authentication-unavailable");
    assert.equal(nonzeroWithArtifact.diagnostics.artifactReceipt, "valid");
    const changedExecutable = consumeCodexParentStrictReviewToolResult({ toolRequest, toolResult: { exit_code: 0, output: "review completed" } }, {
      removeView: () => ({ removed: true }),
      verifyExecutable: () => false,
      clock: () => "2026-08-15T04:01:00.000Z"
    });
    assert.equal(changedExecutable.code, "independent-reviewer-codex-executable-identity-changed");
    fs.writeFileSync(toolRequest.runtimeState.resultPath, JSON.stringify({ schemaVersion: 1, findings: [], status: "passed" }));
    const consumed = consumeCodexParentStrictReviewToolResult({ toolRequest, toolResult: { exit_code: 0, output: "review completed" } }, {
      removeView: (received) => ({ removed: received === strictView }),
      verifyExecutable: () => true,
      clock: () => "2026-08-15T04:01:00.000Z"
    });
    assert.equal(consumed.status, "passed", JSON.stringify(consumed));
    assert.equal(consumed.result.assuranceLevel, "strict-isolated");
    assert.equal(consumed.result.attestation.readOnly, true);
    assert.equal(consumed.result.headCommit, reviewPackage.headCommit);
    assert.equal(consumed.runtimeReceipt.outsideManagedSandbox, true);
    assert.equal(consumed.runtimeReceipt.innerPermissionProfile, "sealed-review");
    assert.equal(consumed.runtimeReceipt.repositoryContext, "neutral-parent");
    assert.equal(consumed.cleanup.removed, true);
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
});

test("Codex executable resolution continues past an invalid fixed candidate", () => {
  const temporary = fs.realpathSync(fs.mkdtempSync("/tmp/codex-fixed-candidates-"));
  const staleCandidate = `${temporary}/stale-codex`;
  const validCandidate = `${temporary}/codex`;
  fs.mkdirSync(staleCandidate);
  fs.copyFileSync("/bin/echo", validCandidate);
  fs.chmodSync(validCandidate, 0o755);
  try {
    const resolved = resolveTrustedReviewerExecutable("codex", "codex", {
      locations: [
        { candidatePath: staleCandidate, trustedRoot: temporary },
        { candidatePath: validCandidate, trustedRoot: temporary }
      ],
      mutationCheck: () => true,
      platformTrustCheck: () => ({ mechanism: "fixture-platform-trust-v1" })
    });
    assert.equal(resolved.candidatePath, validCandidate);
    assert.equal(resolved.realPath, fs.realpathSync(validCandidate));
    assert.equal(resolved.platformTrust.mechanism, "fixture-platform-trust-v1");
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
});

test("Codex strict preflight reserves boundary-unavailable for the managed mutation proof", () => {
  const reviewPackage = packageFixture();
  const request = () => ({
    reviewPackage,
    repositoryPath: process.cwd(),
    reviewer: { type: "codex", identity: "fresh-strict-reviewer" },
    implementerSession: "implementer-session",
    attestationRef: "attestations/codex-read-only-v1.json"
  });
  for (const failure of ["executable-identity-unavailable", "candidate-missing", "platform-trust-unavailable", "identity-unstable", undefined]) {
    const outcome = buildCodexParentStrictReviewToolRequest(request(), {
      pinExecutable: (_executable, _expectedName, { preflight }) => {
        if (failure) preflight.failure = failure;
        return null;
      }
    });
    assert.equal(outcome.code, "independent-reviewer-codex-executable-identity-unavailable", failure);
  }
  const boundary = buildCodexParentStrictReviewToolRequest(request(), {
    pinExecutable: (_executable, _expectedName, { preflight }) => {
      preflight.failure = "managed-mutation-proof-unavailable";
      return null;
    }
  });
  assert.equal(boundary.code, "independent-reviewer-codex-preflight-boundary-unavailable");
});

test("Codex executable resolution classifies mutation denial separately from missing and failed trust", () => {
  const temporary = fs.realpathSync(fs.mkdtempSync("/tmp/codex-preflight-classification-"));
  const candidate = `${temporary}/codex`;
  fs.copyFileSync("/bin/echo", candidate);
  fs.chmodSync(candidate, 0o755);
  try {
    const mutationPreflight = {};
    assert.equal(resolveTrustedReviewerExecutable("codex", "codex", {
      locations: [{ candidatePath: candidate, trustedRoot: temporary }],
      mutationCheck: () => false,
      platformTrustCheck: () => ({ mechanism: "fixture-platform-trust-v1" }),
      preflight: mutationPreflight
    }), null);
    assert.equal(mutationPreflight.failure, "managed-mutation-proof-unavailable");

    const missingPreflight = {};
    assert.equal(resolveTrustedReviewerExecutable("codex", "codex", {
      locations: [{ candidatePath: `${temporary}/missing-codex`, trustedRoot: temporary }],
      preflight: missingPreflight
    }), null);
    assert.equal(missingPreflight.failure, "executable-identity-unavailable");

    const trustPreflight = {};
    assert.equal(resolveTrustedReviewerExecutable("codex", "codex", {
      locations: [{ candidatePath: candidate, trustedRoot: temporary }],
      mutationCheck: () => true,
      platformTrustCheck: () => null,
      preflight: trustPreflight
    }), null);
    assert.equal(trustPreflight.failure, "executable-identity-unavailable");

    const combinedPreflight = {};
    assert.equal(resolveTrustedReviewerExecutable("codex", "codex", {
      locations: [{ candidatePath: candidate, trustedRoot: temporary }],
      mutationCheck: () => false,
      platformTrustCheck: () => null,
      preflight: combinedPreflight
    }), null);
    assert.equal(combinedPreflight.failure, "executable-identity-unavailable");

    const unstablePreflight = {};
    assert.equal(resolveTrustedReviewerExecutable("codex", "codex", {
      locations: [{ candidatePath: candidate, trustedRoot: temporary }],
      mutationCheck: () => true,
      platformTrustCheck: () => {
        fs.writeFileSync(candidate, "changed");
        return { mechanism: "fixture-platform-trust-v1" };
      },
      preflight: unstablePreflight
    }), null);
    assert.equal(unstablePreflight.failure, "executable-identity-unavailable");
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
  assert.equal(consumeCodexParentReviewHostToolResult({ toolRequest: invalid, toolResult: { output: "{}" } }).code, "review-launcher-codex-tool-receipt-invalid");
});

test("Codex parent transport classifies owned final artifacts without retaining their content", () => {
  const temporary = fs.mkdtempSync("/tmp/codex-result-artifact-");
  const resultPath = `${temporary}/result.json`;
  const linkPath = `${temporary}/result-link.json`;
  try {
    assert.equal(inspectCodexReviewResultArtifact(resultPath).code, "review-launcher-codex-result-artifact-missing");
    assert.match(inspectCodexReviewResultArtifact(resultPath).diagnostic.safeMessage, /final-result artifact/);
    fs.writeFileSync(resultPath, "");
    assert.equal(inspectCodexReviewResultArtifact(resultPath).code, "review-launcher-codex-result-artifact-empty");
    fs.writeFileSync(resultPath, "not json");
    const malformed = inspectCodexReviewResultArtifact(resultPath);
    assert.equal(malformed.code, "review-launcher-codex-result-artifact-malformed");
    assert.equal(malformed.diagnostics.resultArtifactPresent, true);
    assert.equal(malformed.diagnostics.resultArtifactSha256.length, 64);
    assert.equal("raw" in malformed.diagnostics, false);
    fs.writeFileSync(resultPath, JSON.stringify({ schemaVersion: 1, findings: [], status: "unavailable" }));
    assert.equal(inspectCodexReviewResultArtifact(resultPath).code, "review-launcher-codex-result-payload-invalid");
    fs.writeFileSync(resultPath, JSON.stringify({ schemaVersion: 1, findings: [], status: "passed" }));
    const valid = inspectCodexReviewResultArtifact(resultPath);
    assert.equal(valid.available, true);
    assert.deepEqual(valid.payload, { schemaVersion: 1, findings: [], status: "passed" });
    assert.equal(valid.diagnostics.parse, "valid");
    assert.equal(valid.diagnostics.payload, "valid");
    fs.writeFileSync(resultPath, JSON.stringify({ schemaVersion: 1, status: "failed", findings: [{ id: "line-suffix", severity: "warning", evidence: "scripts/example.mjs:12", recommendation: "use a file path" }] }));
    assert.equal(inspectCodexReviewResultArtifact(resultPath).code, "review-launcher-codex-result-payload-invalid");
    fs.writeFileSync(resultPath, JSON.stringify({ schemaVersion: 1, status: "failed", findings: [{ id: "fixture-finding", severity: "high", evidence: "fixture evidence", recommendation: "fixture recommendation" }] }));
    assert.equal(inspectCodexReviewResultArtifact(resultPath).payload.status, "failed");
    fs.symlinkSync(resultPath, linkPath);
    assert.equal(inspectCodexReviewResultArtifact(linkPath).code, "review-launcher-codex-result-artifact-invalid");
    fs.writeFileSync(resultPath, "x".repeat(1024 * 1024 + 1));
    assert.equal(inspectCodexReviewResultArtifact(resultPath).code, "review-launcher-codex-result-artifact-oversized");
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
});

test("strict parent transport keeps reusable contracts free of product-specific values", () => {
  const source = fs.readFileSync(new URL("../platform-review-adapters.mjs", import.meta.url), "utf8");
  assert.doesNotMatch(source, /joericearchitect|home-roots-reinvest|jizzoe|AI Skills Development/i);
  assert.match(source, /owned-final-file-v1/);
  assert.match(source, /output-last-message/);
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
      run,
      prepareEnvironment: () => ({ available: true, environment: { HOME: temporary, PATH: "/usr/bin", NO_COLOR: "1" } })
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
  assert.ok(invocation.args.includes("--allowed-tools"));
  assert.equal(invocation.args[invocation.args.indexOf("--allowed-tools") + 1], "Read,Glob,Grep");
  assert.match(invocation.args[invocation.args.indexOf("--disallowed-tools") + 1], /Bash/);
  assert.equal("CLAUDE_CODE_SUBPROCESS_ENV_SCRUB" in invocation.environment, false);
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

test("Claude sandbox and authentication denial receive stable diagnostics", () => {
  assert.equal(classifyClaudeExecutionFailure({ stderr: "sandbox unavailable because failIfUnavailable was set" }), "independent-reviewer-claude-sandbox-unavailable");
  assert.equal(classifyClaudeExecutionFailure({ stderr: "authentication failed" }), "independent-reviewer-claude-authentication-unavailable");
  assert.equal(classifyClaudeExecutionFailure({ stderr: "Not logged in · Please run /login" }), "independent-reviewer-claude-authentication-unavailable");
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
