import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { requiredReviewDenials } from "./review-adapter-contract.mjs";

const now = () => new Date().toISOString();
const operationalReviewEnvironmentNames = Object.freeze([
  "PATH", "Path", "SYSTEMROOT", "SystemRoot", "COMSPEC", "PATHEXT", "PROGRAMDATA",
  "TMPDIR", "TMP", "TEMP", "LANG", "LC_ALL", "LC_CTYPE", "TERM",
  "COLORTERM", "SHELL"
]);

export function sanitizedReviewEnvironment(parentEnvironment = process.env, overrides = {}) {
  const environment = {};
  for (const name of operationalReviewEnvironmentNames) {
    if (typeof parentEnvironment[name] === "string") environment[name] = parentEnvironment[name];
  }
  return { ...environment, ...overrides };
}

export function isolatedReviewerEnvironment(homePath) {
  if (typeof homePath !== "string" || !path.isAbsolute(homePath) || /[\r\n\0]/.test(homePath)) return {};
  const temporaryPath = path.join(homePath, "tmp");
  return {
    HOME: homePath,
    USERPROFILE: homePath,
    APPDATA: path.join(homePath, "appdata", "roaming"),
    LOCALAPPDATA: path.join(homePath, "appdata", "local"),
    XDG_CONFIG_HOME: path.join(homePath, "config"),
    XDG_CACHE_HOME: path.join(homePath, "cache"),
    XDG_DATA_HOME: path.join(homePath, "data"),
    TMPDIR: temporaryPath,
    TMP: temporaryPath,
    TEMP: temporaryPath
  };
}

export function codexAuthenticationEnvironment(parentEnvironment = process.env) {
  return Object.fromEntries(["HOME", "USERPROFILE", "APPDATA", "LOCALAPPDATA"]
    .filter((name) => typeof parentEnvironment[name] === "string")
    .map((name) => [name, parentEnvironment[name]]));
}

function codexRestrictedReviewArguments() {
  return [
    "--config", "default_permissions=\"sealed-review\"",
    "--config", "permissions.sealed-review={filesystem={\":minimal\"=\"read\",\":workspace_roots\"={\".\"=\"read\"}},network={enabled=false}}",
    "--config", "shell_environment_policy.inherit=\"none\""
  ];
}

function prepareReviewerHome(view) {
  if (typeof view?.temporaryRoot !== "string" || !path.isAbsolute(view.temporaryRoot)) return null;
  const homePath = path.join(view.temporaryRoot, "reviewer-home");
  for (const directory of Object.values(isolatedReviewerEnvironment(homePath))) {
    if (path.isAbsolute(directory)) fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
  }
  return homePath;
}

const unavailable = (code, { reviewPackage, adapter, reviewer, attestationRef, startedAt = now(), executionId = randomUUID() } = {}) => ({
  schemaVersion: 1,
  reviewRecordId: `unavailable-${executionId}`,
  executionId,
  reviewer: { type: reviewer?.type ?? adapter, identity: reviewer?.identity ?? `${adapter}-reviewer`, adapter },
  attestation: { ref: attestationRef ?? "unavailable", nonInteractive: false, isolatedContext: false, freshContext: false, readOnly: false },
  assuranceLevel: "strict-isolated",
  baseCommit: reviewPackage?.baseCommit ?? "0000000000000000000000000000000000000000",
  headCommit: reviewPackage?.headCommit ?? "0000000000000000000000000000000000000000",
  manifestDigest: reviewPackage?.manifestDigest ?? "0".repeat(64),
  startedAt,
  completedAt: now(),
  findings: [],
  status: "unavailable",
  unavailableCode: code
});

function helpIncludes(executable, arguments_, required) {
  const run = spawnSync(executable, arguments_, {
    encoding: "utf8",
    timeout: 10_000,
    env: sanitizedReviewEnvironment(process.env, { NO_COLOR: "1" })
  });
  const output = `${run.stdout ?? ""}\n${run.stderr ?? ""}`;
  return run.status === 0 && required.every((item) => output.includes(item));
}

function capabilities({ adapter, attestationRef, probeReference }) {
  return {
    adapter,
    attestationRef,
    probeReference,
    runtimeEnforced: true,
    freshContext: true,
    nonInteractive: true,
    readOnlyView: true,
    denied: Object.fromEntries(requiredReviewDenials.map((name) => [name, true]))
  };
}

export function buildCodexReviewInvocation({ executable = "codex", view, schemaPath, resultPath, authenticationEnvironment = {} }) {
  return {
    executable,
    args: ["exec", "--strict-config", ...codexRestrictedReviewArguments(), "--ephemeral", "--ignore-user-config", "--ignore-rules", "--cd", view.reviewPath, "--output-schema", schemaPath, "--output-last-message", resultPath,
      "Review only the committed detached repository view. Read .ai-independent-review-package.json and inspect the exact base-to-head diff. Do not modify files, Git, credentials, network state, or external systems. Return only the required JSON review result."],
    environment: { ...authenticationEnvironment, NO_COLOR: "1" }
  };
}

// This is deliberately not a strict-isolation transport. It is available only
// to the authorized fallback orchestrator after strict unavailability and
// reports every restriction that cannot be runtime-proven in its ledger.
export function buildCodexDegradedReviewInvocation({ executable = "codex", view, schemaPath, resultPath, authenticationEnvironment = {} }) {
  return {
    executable,
    args: ["exec", "--strict-config", ...codexRestrictedReviewArguments(), "--ephemeral", "--ignore-user-config", "--ignore-rules", "--cd", view.reviewPath, "--output-schema", schemaPath, "--output-last-message", resultPath,
      "Review only the sealed package in this disposable detached view. Inspect the exact base-to-head diff and relevant committed files. Do not modify files, Git, credentials, network state, or external systems. Return only the required JSON findings payload without an intended conclusion."],
    environment: { ...authenticationEnvironment, NO_COLOR: "1", GITHUB_TOKEN: "", GH_TOKEN: "", SSH_AUTH_SOCK: "", AWS_ACCESS_KEY_ID: "", AWS_SECRET_ACCESS_KEY: "", AWS_SESSION_TOKEN: "", NPM_TOKEN: "" }
  };
}

export function degradedCapabilityLedger() {
  return {
    enforced: ["freshContext", "nonInteractive", "sealedPackageOnly", "detachedView", "innerReadOnlySandbox", "credentialAccess"],
    unavailable: [],
    instructionConstrained: ["workspaceWrite", "gitWrite", "githubMutation", "authenticatedNetwork", "externalSend", "deployment", "release", "delegatedMutation"]
  };
}

export function probeCodexReviewAdapter({ executable = "codex", attestationRef = "attestations/codex-read-only-v1.json" } = {}) {
  if (!helpIncludes(executable, ["exec", "--help"], ["--config", "--strict-config", "--ephemeral", "--ignore-user-config", "--output-schema"])) {
    return { available: false, code: "independent-reviewer-codex-runtime-unavailable" };
  }
  return { available: true, capability: capabilities({ adapter: "codex", attestationRef, probeReference: "codex-exec-read-only-v1" }) };
}

export function createClaudeReviewSettings(view) {
  return {
    sandbox: {
      enabled: true,
      failIfUnavailable: true,
      allowUnsandboxedCommands: false,
      excludedCommands: [],
      filesystem: {
        denyRead: ["/"],
        allowRead: [view.reviewPath],
        denyWrite: [view.reviewPath],
        allowWrite: []
      },
      network: { allowedDomains: [], strictAllowlist: true },
      credentials: {
        files: [{ path: "~/", mode: "deny" }],
        envVars: ["GITHUB_TOKEN", "GH_TOKEN", "AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "AWS_SESSION_TOKEN", "SSH_AUTH_SOCK", "NPM_TOKEN"].map((name) => ({ name, mode: "deny" }))
      }
    },
    permissions: { allow: ["Bash"], deny: ["Edit", "Write", "NotebookEdit", "Task", "Agent", "WebFetch", "WebSearch", "MCP"] }
  };
}

export function buildClaudeReviewInvocation({ executable = "claude", view, settingsPath, schema, reviewerHomePath }) {
  return {
    executable,
    args: ["--print", "--safe-mode", "--no-session-persistence", "--setting-sources", "", "--settings", settingsPath,
      "--tools", "Bash", "--disallowed-tools", "Edit,Write,NotebookEdit,Task,Agent,WebFetch,WebSearch,MCP", "--permission-mode", "dontAsk", "--output-format", "json", "--json-schema", JSON.stringify(schema),
      "Review only the committed detached repository view. Read .ai-independent-review-package.json and inspect the exact base-to-head diff. Do not modify files, Git, credentials, network state, or external systems. Return only the required JSON review result."],
    environment: { ...isolatedReviewerEnvironment(reviewerHomePath), CLAUDE_CODE_SUBPROCESS_ENV_SCRUB: "1", NO_COLOR: "1" }
  };
}

// Claude's degraded transport deliberately does not claim an OS sandbox. It
// starts a fresh non-persistent process with only read/search tools exposed and
// records the remaining boundary as reduced assurance.
export function buildClaudeDegradedReviewInvocation({ executable = "claude", view, schema, reviewerHomePath }) {
  return {
    executable,
    args: ["--print", "--safe-mode", "--no-session-persistence", "--setting-sources", "",
      "--strict-mcp-config", "--mcp-config", "{}", "--tools", "Read,Glob,Grep",
      "--disallowed-tools", "Bash,Edit,Write,NotebookEdit,Task,Agent,WebFetch,WebSearch,MCP",
      "--permission-mode", "dontAsk", "--output-format", "json", "--json-schema", JSON.stringify(schema),
      "Review only the sealed package in this disposable detached view. Inspect the exact base-to-head diff and relevant committed files. Do not modify files, Git, credentials, network state, or external systems. Return only the required JSON findings payload without an intended conclusion."],
    environment: { ...isolatedReviewerEnvironment(reviewerHomePath), CLAUDE_CODE_SUBPROCESS_ENV_SCRUB: "1", NO_COLOR: "1", GITHUB_TOKEN: "", GH_TOKEN: "", SSH_AUTH_SOCK: "", AWS_ACCESS_KEY_ID: "", AWS_SECRET_ACCESS_KEY: "", AWS_SESSION_TOKEN: "", NPM_TOKEN: "" }
  };
}

export function probeClaudeReviewAdapter({ executable = "claude", attestationRef = "attestations/claude-sandbox-v1.json" } = {}) {
  if (process.platform === "win32") return { available: false, code: "independent-reviewer-claude-native-windows-unsupported" };
  if (!helpIncludes(executable, ["--help"], ["--print", "--settings", "--setting-sources", "--no-session-persistence", "--tools"])) {
    return { available: false, code: "independent-reviewer-claude-runtime-unavailable" };
  }
  return { available: true, capability: capabilities({ adapter: "claude", attestationRef, probeReference: "claude-temporary-strict-sandbox-v1" }) };
}

export function writeReviewPackageForView(view, reviewPackage) {
  const filePath = path.join(view.reviewPath, ".ai-independent-review-package.json");
  // The detached view is built from untrusted repository content. Exclusive
  // creation rejects both a committed file and a committed symlink at the
  // injection path instead of following either one outside the owned view.
  fs.writeFileSync(filePath, `${JSON.stringify(reviewPackage)}\n`, { mode: 0o400, flag: "wx" });
  return filePath;
}

function parseJsonResult(output) {
  if (typeof output !== "string" || !output.trim()) return null;
  try {
    const outer = JSON.parse(output);
    if (outer?.structured_output && typeof outer.structured_output === "object") return outer.structured_output;
    if (typeof outer?.result === "string") return JSON.parse(outer.result);
    return outer;
  } catch {
    return null;
  }
}

function validFindingPayload(value) {
  return value?.schemaVersion === 1 && ["passed", "failed"].includes(value.status) &&
    Array.isArray(value.findings) && value.findings.every((finding) =>
      typeof finding?.id === "string" && finding.id.length > 0 &&
      ["blocker", "high", "objective-fix", "warning", "false-positive"].includes(finding.severity) &&
      typeof finding.evidence === "string" && finding.evidence.length > 0 &&
      typeof finding.recommendation === "string" && finding.recommendation.length > 0);
}

export function classifyCodexExecutionFailure(execution = {}) {
  const output = `${execution.stdout ?? ""}\n${execution.stderr ?? ""}`;
  if (/in-process app-server client|app-server.*operation not permitted|operation not permitted.*app-server/i.test(output)) {
    return "independent-reviewer-nested-app-server-denied";
  }
  return "independent-reviewer-codex-execution-unavailable";
}

export function classifyClaudeExecutionFailure(execution = {}) {
  const output = `${execution.stdout ?? ""}\n${execution.stderr ?? ""}`;
  if (/sandbox.*(?:unavailable|denied|operation not permitted)|failIfUnavailable/i.test(output)) {
    return "independent-reviewer-claude-sandbox-unavailable";
  }
  return "independent-reviewer-claude-execution-unavailable";
}

export function invokeReviewProcess(invocation, view, run, parentEnvironment = process.env) {
  return run(invocation.executable, invocation.args, {
    cwd: view.reviewPath,
    encoding: "utf8",
    timeout: 120_000,
    env: sanitizedReviewEnvironment(parentEnvironment, invocation.environment)
  });
}

export function runCodexReviewAdapter({ reviewPackage, view, schemaPath, resultPath, reviewer, attestationRef, executable, run = spawnSync }) {
  const probe = probeCodexReviewAdapter({ executable, attestationRef });
  if (!probe.available) return { status: "unavailable", result: unavailable(probe.code, { reviewPackage, adapter: "codex", reviewer, attestationRef }) };
  const invocation = buildCodexReviewInvocation({ executable, view, schemaPath, resultPath, authenticationEnvironment: codexAuthenticationEnvironment() });
  const execution = invokeReviewProcess(invocation, view, run);
  let result = null;
  try { result = fs.existsSync(resultPath) ? parseJsonResult(fs.readFileSync(resultPath, "utf8")) : null; } catch { result = null; }
  if (execution.status !== 0 || !result) {
    const code = classifyCodexExecutionFailure(execution);
    return { status: "unavailable", result: unavailable(code, { reviewPackage, adapter: "codex", reviewer, attestationRef }), execution: { status: execution.status, signal: execution.signal ?? null, emittedResult: false } };
  }
  return { status: result.status, result, execution: { status: 0, signal: null, emittedResult: true } };
}

export function runCodexDegradedReviewAdapter({ reviewPackage, view, schemaPath, resultPath, reviewer, attestationRef, strictResult, degradedAuthorization, executable, run = spawnSync }) {
  const probe = probeCodexReviewAdapter({ executable, attestationRef });
  if (!probe.available) return { status: "unavailable", result: unavailable(probe.code, { reviewPackage, adapter: "codex", reviewer, attestationRef }) };
  const startedAt = now();
  const invocation = buildCodexDegradedReviewInvocation({ executable, view, schemaPath, resultPath, authenticationEnvironment: codexAuthenticationEnvironment() });
  const execution = invokeReviewProcess(invocation, view, run);
  let payload = null;
  try { payload = fs.existsSync(resultPath) ? parseJsonResult(fs.readFileSync(resultPath, "utf8")) : null; } catch { payload = null; }
  if (execution.status !== 0 || !validFindingPayload(payload)) {
    const code = classifyCodexExecutionFailure(execution);
    return { status: "unavailable", result: unavailable(code, { reviewPackage, adapter: "codex", reviewer, attestationRef, startedAt }), execution: { status: execution.status, signal: execution.signal ?? null, emittedResult: false } };
  }
  const executionId = randomUUID();
  const result = {
    schemaVersion: 1,
    reviewRecordId: `degraded-${executionId}`,
    executionId,
    reviewer: { type: reviewer.type, identity: reviewer.identity, adapter: "codex" },
    attestation: { ref: attestationRef, nonInteractive: true, isolatedContext: false, freshContext: true, readOnly: false },
    assuranceLevel: "authorized-degraded",
    capabilityLedger: degradedCapabilityLedger(),
    strictUnavailable: {
      reviewRecordId: strictResult.reviewRecordId,
      executionId: strictResult.executionId,
      adapter: strictResult.reviewer?.adapter ?? strictResult.reviewer?.type ?? "strict",
      status: "unavailable",
      unavailableCode: strictResult.unavailableCode,
      baseCommit: reviewPackage.baseCommit,
      headCommit: reviewPackage.headCommit,
      manifestDigest: reviewPackage.manifestDigest
    },
    degradedAuthorization: {
      change: degradedAuthorization.change,
      transition: degradedAuthorization.transition,
      expiresAt: degradedAuthorization.expiresAt,
      riskReason: degradedAuthorization.riskReason,
      fallbackBoundary: degradedAuthorization.fallbackBoundary
    },
    baseCommit: reviewPackage.baseCommit,
    headCommit: reviewPackage.headCommit,
    manifestDigest: reviewPackage.manifestDigest,
    startedAt,
    completedAt: now(),
    findings: payload.findings,
    status: payload.status,
    unavailableCode: ""
  };
  return { status: result.status, result, execution: { status: 0, signal: null, emittedResult: true } };
}

export function runClaudeDegradedReviewAdapter({ reviewPackage, view, schemaPath, reviewer, attestationRef, strictResult, degradedAuthorization, executable, run = spawnSync, probe = probeClaudeReviewAdapter }) {
  const probeResult = probe({ executable, attestationRef });
  if (!probeResult.available) return { status: "unavailable", result: unavailable(probeResult.code, { reviewPackage, adapter: "claude", reviewer, attestationRef }) };
  const startedAt = now();
  let schema = null;
  try { schema = JSON.parse(fs.readFileSync(schemaPath, "utf8")); } catch { schema = null; }
  if (!schema) return { status: "unavailable", result: unavailable("independent-reviewer-claude-schema-unavailable", { reviewPackage, adapter: "claude", reviewer, attestationRef, startedAt }) };
  const invocation = buildClaudeDegradedReviewInvocation({ executable, view, schema, reviewerHomePath: prepareReviewerHome(view) });
  const execution = invokeReviewProcess(invocation, view, run);
  const payload = parseJsonResult(execution.stdout);
  if (execution.status !== 0 || !validFindingPayload(payload)) {
    const code = classifyClaudeExecutionFailure(execution);
    return { status: "unavailable", result: unavailable(code, { reviewPackage, adapter: "claude", reviewer, attestationRef, startedAt }), execution: { status: execution.status, signal: execution.signal ?? null, emittedResult: false } };
  }
  const executionId = randomUUID();
  const result = {
    schemaVersion: 1,
    reviewRecordId: `degraded-${executionId}`,
    executionId,
    reviewer: { type: reviewer.type, identity: reviewer.identity, adapter: "claude" },
    attestation: { ref: attestationRef, nonInteractive: true, isolatedContext: false, freshContext: true, readOnly: false },
    assuranceLevel: "authorized-degraded",
    capabilityLedger: {
      enforced: ["freshContext", "nonInteractive", "sealedPackageOnly", "detachedView", "disabledMutationTools"],
      unavailable: [],
      instructionConstrained: ["workspaceWrite", "gitWrite", "githubMutation", "credentialAccess", "authenticatedNetwork", "externalSend", "deployment", "release", "delegatedMutation"]
    },
    strictUnavailable: {
      reviewRecordId: strictResult.reviewRecordId,
      executionId: strictResult.executionId,
      adapter: strictResult.reviewer?.adapter ?? strictResult.reviewer?.type ?? "strict",
      status: "unavailable",
      unavailableCode: strictResult.unavailableCode,
      baseCommit: reviewPackage.baseCommit,
      headCommit: reviewPackage.headCommit,
      manifestDigest: reviewPackage.manifestDigest
    },
    degradedAuthorization: {
      change: degradedAuthorization.change,
      transition: degradedAuthorization.transition,
      expiresAt: degradedAuthorization.expiresAt,
      riskReason: degradedAuthorization.riskReason,
      fallbackBoundary: degradedAuthorization.fallbackBoundary
    },
    baseCommit: reviewPackage.baseCommit,
    headCommit: reviewPackage.headCommit,
    manifestDigest: reviewPackage.manifestDigest,
    startedAt,
    completedAt: now(),
    findings: payload.findings,
    status: payload.status,
    unavailableCode: ""
  };
  return { status: result.status, result, execution: { status: 0, signal: null, emittedResult: true } };
}

export function runClaudeReviewAdapter({ reviewPackage, view, settingsPath, schema, reviewer, attestationRef, executable, run = spawnSync }) {
  const probe = probeClaudeReviewAdapter({ executable, attestationRef });
  if (!probe.available) return { status: "unavailable", result: unavailable(probe.code, { reviewPackage, adapter: "claude", reviewer, attestationRef }) };
  fs.writeFileSync(settingsPath, `${JSON.stringify(createClaudeReviewSettings(view))}\n`, { mode: 0o600 });
  const invocation = buildClaudeReviewInvocation({ executable, view, settingsPath, schema, reviewerHomePath: prepareReviewerHome(view) });
  const execution = invokeReviewProcess(invocation, view, run);
  const result = parseJsonResult(execution.stdout);
  if (execution.status !== 0 || !result) {
    return { status: "unavailable", result: unavailable(classifyClaudeExecutionFailure(execution), { reviewPackage, adapter: "claude", reviewer, attestationRef }), execution: { status: execution.status, signal: execution.signal ?? null, emittedResult: false } };
  }
  return { status: result.status, result, execution: { status: 0, signal: null, emittedResult: true } };
}

export { unavailable as unavailableReviewResult };
