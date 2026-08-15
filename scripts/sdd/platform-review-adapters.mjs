import { spawnSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { createArchivedReviewView, removeArchivedReviewView } from "./detached-review-view.mjs";
import { buildReviewPackage, canonicalJson, validateReviewResult } from "./independent-review-contract.mjs";
import { degradedAuthorizationMatchesResult, strictSummaryMatchesResult } from "./independent-review.mjs";
import { requiredReviewDenials } from "./review-adapter-contract.mjs";
import { createReviewDiagnostic, diagnosticFromCode, diagnosticFromError, unavailableOutcome, unclassifiedRuntimeDiagnostic } from "./review-diagnostics.mjs";

const now = () => new Date().toISOString();
const reviewLauncherHostScript = "scripts/sdd/review-launcher-host.mjs";
const maximumReviewResultArtifactBytes = 1024 * 1024;
const operationalReviewEnvironmentNames = Object.freeze([
  "PATH", "Path", "SYSTEMROOT", "SystemRoot", "COMSPEC", "PATHEXT", "PROGRAMDATA",
  "TMPDIR", "TMP", "TEMP", "LANG", "LC_ALL", "LC_CTYPE", "TERM",
  "COLORTERM", "SHELL"
]);

function runtimePath(value) {
  return typeof value === "string" && path.isAbsolute(value) && !/[\r\n\0]/.test(value);
}

function validPreparedRecovery(prepared) {
  return prepared?.allowed === true &&
    prepared.code === "review-launcher-external-host-required" &&
    /^[0-9a-f]{64}$/.test(prepared?.hostRequest?.requestDigest ?? "") &&
    prepared?.expectedRecovery?.hostScript === reviewLauncherHostScript;
}

function resultArtifactDiagnostics({ present = false, bytes = 0, sha256 = "", parse = "not-attempted", payload = "not-attempted", validation = "not-attempted", cleanup = "not-attempted" } = {}) {
  return { resultArtifactPresent: present, resultArtifactBytes: bytes, resultArtifactSha256: sha256, parse, payload, validation, cleanup };
}

function artifactUnavailable(code, diagnostics, error) {
  const diagnostic = error
    ? diagnosticFromError({ stage: "result-artifact", operation: "inspect-codex-review-result", code, subject: "codex-result-artifact", safeMessage: "The Codex reviewer result artifact could not be safely read or validated.", error })
    : diagnosticFromCode({ stage: "result-artifact", operation: "inspect-codex-review-result", code, subject: "codex-result-artifact", safeMessage: "The Codex reviewer result artifact is absent or does not meet the required output contract." });
  return { available: false, ...unavailableOutcome(diagnostic), diagnostics };
}

export function inspectCodexReviewResultArtifact(resultPath) {
  if (!runtimePath(resultPath)) {
    return artifactUnavailable("review-launcher-codex-result-artifact-path-invalid", resultArtifactDiagnostics());
  }
  let entry;
  try {
    entry = fs.lstatSync(resultPath);
  } catch (error) {
    return artifactUnavailable("review-launcher-codex-result-artifact-missing", resultArtifactDiagnostics(), error);
  }
  if (!entry.isFile() || entry.isSymbolicLink()) {
    return artifactUnavailable("review-launcher-codex-result-artifact-invalid", resultArtifactDiagnostics({ present: true }));
  }
  if (entry.size === 0) {
    return artifactUnavailable("review-launcher-codex-result-artifact-empty", resultArtifactDiagnostics({ present: true }));
  }
  if (entry.size > maximumReviewResultArtifactBytes) {
    return artifactUnavailable("review-launcher-codex-result-artifact-oversized", resultArtifactDiagnostics({ present: true, bytes: entry.size }));
  }
  let raw;
  try {
    raw = fs.readFileSync(resultPath);
  } catch (error) {
    return artifactUnavailable("review-launcher-codex-result-artifact-unreadable", resultArtifactDiagnostics({ present: true, bytes: entry.size }), error);
  }
  const diagnostics = resultArtifactDiagnostics({
    present: true,
    bytes: raw.length,
    sha256: createHash("sha256").update(raw).digest("hex"),
    parse: "attempted"
  });
  const payload = parseJsonResult(raw.toString("utf8"));
  if (!payload) {
    return artifactUnavailable("review-launcher-codex-result-artifact-malformed", { ...diagnostics, parse: "invalid" });
  }
  if (!validFindingPayload(payload)) {
    return artifactUnavailable("review-launcher-codex-result-payload-invalid", { ...diagnostics, parse: "valid", payload: "invalid" });
  }
  return { available: true, payload, diagnostics: { ...diagnostics, parse: "valid", payload: "valid" } };
}

function unavailableCodexParentResult(code, diagnostics, cleanup) {
  const diagnostic = diagnosticFromCode({ stage: "parent-transport", operation: "consume-codex-review-receipt", code, subject: "codex-parent-review-tool", safeMessage: "The parent review transport could not verify a complete reviewer response." });
  return {
    ...unavailableOutcome(diagnostic),
    diagnostics: { ...diagnostics, cleanup: cleanup?.removed === true ? "removed" : cleanup?.code ?? "failed" }
  };
}

function platformUnavailable(stage, operation, code, subject, safeMessage, error) {
  const diagnostic = error
    ? diagnosticFromError({ stage, operation, code, subject, safeMessage, error })
    : diagnosticFromCode({ stage, operation, code, subject, safeMessage });
  return { available: false, ...unavailableOutcome(diagnostic) };
}

export function writePreparedReviewHostRequest(prepared, directoryPath) {
  if (!validPreparedRecovery(prepared) || !runtimePath(directoryPath)) return platformUnavailable("parent-transport", "write-host-request", "review-launcher-runtime-request-path-invalid", "prepared-host-request", "The prepared host request path is invalid.");
  let directory;
  try {
    directory = fs.lstatSync(directoryPath);
  } catch (error) {
    return platformUnavailable("parent-transport", "write-host-request", "review-launcher-runtime-request-directory-unavailable", "prepared-host-request", "The parent runtime cannot access the host request directory.", error);
  }
  if (!directory.isDirectory() || directory.isSymbolicLink()) return platformUnavailable("parent-transport", "write-host-request", "review-launcher-runtime-request-directory-invalid", "prepared-host-request", "The host request directory does not satisfy the transport safety checks.");
  const requestPath = path.join(directoryPath, `review-launcher-${prepared.hostRequest.requestDigest}.json`);
  try {
    fs.writeFileSync(requestPath, `${JSON.stringify(prepared)}\n`, { flag: "wx", mode: 0o400 });
  } catch (error) {
    return platformUnavailable("parent-transport", "write-host-request", "review-launcher-runtime-request-write-failed", "prepared-host-request", "The parent runtime could not write the host request.", error);
  }
  return { available: true, code: "review-launcher-runtime-request-written", requestPath };
}

export function buildCodexParentReviewHostToolRequest({ prepared, preparedRequestPath, repositoryPath } = {}, {
  createView = createArchivedReviewView,
  removeView = removeArchivedReviewView,
  rebuildPackage = buildReviewPackage,
  injectPackage = writeReviewPackageForView
} = {}) {
  if (!validPreparedRecovery(prepared) || !runtimePath(preparedRequestPath) || !runtimePath(repositoryPath)) {
    return platformUnavailable("parent-transport", "prepare-codex-review-tool", "review-launcher-codex-tool-request-invalid", "prepared-host-request", "The prepared Codex host request is invalid.");
  }
  const expectedName = `review-launcher-${prepared.hostRequest.requestDigest}.json`;
  const hostPath = path.join(repositoryPath, reviewLauncherHostScript);
  try {
    const requestEntry = fs.lstatSync(preparedRequestPath);
    const hostEntry = fs.lstatSync(hostPath);
    const stored = JSON.parse(fs.readFileSync(preparedRequestPath, "utf8"));
    if (path.basename(preparedRequestPath) !== expectedName || !requestEntry.isFile() || requestEntry.isSymbolicLink() ||
        !hostEntry.isFile() || hostEntry.isSymbolicLink() || JSON.stringify(stored) !== JSON.stringify(prepared)) {
      return platformUnavailable("parent-transport", "prepare-codex-review-tool", "review-launcher-codex-tool-request-invalid", "prepared-host-request", "The stored Codex host request did not pass integrity checks.");
    }
  } catch (error) {
    return platformUnavailable("parent-transport", "prepare-codex-review-tool", "review-launcher-codex-tool-request-invalid", "prepared-host-request", "The parent runtime could not read the prepared Codex host request.", error);
  }
  const request = prepared.hostRequest.request;
  const created = createView({ repositoryPath, headCommit: request?.reviewPackage?.headCommit });
  if (!created?.available) {
    const diagnostic = created?.diagnostic ?? diagnosticFromCode({ stage: "archive-view", operation: "create-archived-review-view", code: "review-launcher-codex-view-unavailable", subject: "archived-review-view", safeMessage: "The parent transport could not create the archived review view." });
    return { available: false, ...unavailableOutcome(diagnostic) };
  }
  const { view } = created;
  try {
    const rebuilt = rebuildPackage({
      repositoryPath,
      baseCommit: request.reviewPackage.baseCommit,
      headCommit: request.reviewPackage.headCommit,
      artifactPaths: request.reviewPackage.artifacts.map((artifact) => artifact.path),
      validationEvidence: request.reviewPackage.validationEvidence
    });
    if (!rebuilt?.valid || canonicalJson(rebuilt.package) !== canonicalJson(request.reviewPackage)) throw new Error("package-mismatch");
    injectPackage(view, rebuilt.package);
    const schemaPath = path.join(view.reviewPath, "schemas", "independent-review-findings-v1.schema.json");
    const resultPath = path.join(view.temporaryRoot, "independent-review-findings.json");
    const invocation = buildCodexDegradedReviewInvocation({
      executable: request.launcher.executable,
      view,
      schemaPath,
      resultPath,
      authenticationEnvironment: codexAuthenticationEnvironment()
    });
    const environmentArguments = Object.entries(invocation.environment)
      .filter(([name, value]) => /^[A-Z_][A-Z0-9_]*$/.test(name) && typeof value === "string" && !/[\r\n\0]/.test(value))
      .map(([name, value]) => `${name}=${value}`);
    return {
      available: true,
      code: "review-launcher-codex-tool-request-ready",
      transport: "codex-exec-tool",
      tool: "exec_command",
      executable: "/usr/bin/env",
      arguments: Object.freeze(["-i", ...environmentArguments, invocation.executable, ...invocation.args]),
      workingDirectory: view.reviewPath,
      sandboxPermissions: "require_escalated",
      approvalPolicyRequirement: "interactive",
      approvalReviewer: "auto_review",
      requestDigest: prepared.hostRequest.requestDigest,
      hostScript: reviewLauncherHostScript,
      hostExecutionModel: "sandbox-prepared-host-owned-executable",
      runtimeState: Object.freeze({ view, resultPath, preparedRequestPath })
    };
  } catch (error) {
    removeView(view);
    return platformUnavailable("parent-transport", "prepare-codex-review-tool", "review-launcher-codex-tool-request-invalid", "prepared-host-request", "The parent transport could not prepare the Codex review tool request.", error);
  }
}

export function consumeCodexParentReviewHostToolResult({ prepared, toolRequest, toolResult } = {}, {
  removeView = removeArchivedReviewView,
  hostExecutionId = randomUUID(),
  sealPayload = sealCodexDegradedReviewPayload,
  validateResult = validateReviewResult,
  strictMatches = strictSummaryMatchesResult,
  degradedAuthorizationMatches = degradedAuthorizationMatchesResult
} = {}) {
  const cleanupView = () => toolRequest?.runtimeState?.view ? removeView(toolRequest.runtimeState.view) : { removed: false };
  if (toolRequest?.available !== true || toolRequest.transport !== "codex-exec-tool" ||
      toolRequest.sandboxPermissions !== "require_escalated" || toolRequest.hostScript !== reviewLauncherHostScript ||
      toolRequest.hostExecutionModel !== "sandbox-prepared-host-owned-executable" ||
      toolRequest.executable !== "/usr/bin/env" || toolResult?.exit_code !== 0 || !validPreparedRecovery(prepared)) {
    const cleanup = cleanupView();
    return unavailableCodexParentResult("review-launcher-codex-tool-receipt-invalid", resultArtifactDiagnostics(), cleanup);
  }
  const inspected = inspectCodexReviewResultArtifact(toolRequest.runtimeState.resultPath);
  if (!inspected.available) {
    const cleanup = cleanupView();
    return unavailableCodexParentResult(inspected.code, inspected.diagnostics, cleanup);
  }
  const request = prepared.hostRequest.request;
  const sealed = sealPayload({
    payload: inspected.payload,
    reviewPackage: request.reviewPackage,
    reviewer: request.reviewer,
    attestationRef: request.attestationRef,
    strictResult: request.strictResult,
    degradedAuthorization: {
      change: request.authorization.degradedIndependentReview.change,
      transition: request.transition,
      expiresAt: request.authorization.degradedIndependentReview.expiresAt,
      riskReason: request.authorization.degradedIndependentReview.riskReason,
      fallbackBoundary: request.authorization.degradedIndependentReview.fallbackBoundary
    }
  });
  const configuredReviewer = { ...request.reviewer, attestation: request.reviewer.attestation ?? { ref: request.attestationRef } };
  const validation = validateResult(sealed?.result, { expectedPackage: request.reviewPackage, configuredReviewer, implementerSession: request.authorization.implementerSession });
  const cleanup = cleanupView();
  if (!sealed) {
    return unavailableCodexParentResult("review-launcher-codex-result-normalization-invalid", inspected.diagnostics, cleanup);
  }
  if (!validation.valid) {
    return unavailableCodexParentResult("review-launcher-codex-result-validation-invalid", { ...inspected.diagnostics, validation: validation.issues?.[0]?.code ?? "invalid" }, cleanup);
  }
  if (!strictMatches(sealed.result.strictUnavailable, request.strictResult)) {
    return unavailableCodexParentResult("review-launcher-codex-strict-unavailable-mismatch", inspected.diagnostics, cleanup);
  }
  if (!degradedAuthorizationMatches(sealed.result.degradedAuthorization, sealed.degradedAuthorization)) {
    return unavailableCodexParentResult("review-launcher-codex-degraded-authorization-mismatch", inspected.diagnostics, cleanup);
  }
  if (cleanup?.removed !== true) {
    return unavailableCodexParentResult("review-launcher-codex-result-cleanup-failed", inspected.diagnostics, cleanup);
  }
  const response = {
    allowed: true,
    status: sealed.result.status,
    code: "review-launcher-host-complete",
    launchId: prepared.hostRequest.launchId,
    requestDigest: toolRequest.requestDigest,
    launcherId: prepared.expectedRecovery.launcherId,
    launcherKind: prepared.expectedRecovery.launcherKind,
    hostScript: reviewLauncherHostScript,
    hostExecutionId,
    result: sealed.result,
    launcherEvidence: prepared.expectedRecovery,
    cleanup: { removed: true }
  };
  return {
    status: "executed",
    response,
    runtimeReceipt: {
      schemaVersion: 1,
      source: "codex-exec-tool",
      status: "executed",
      securityVerifiable: false,
      outsideManagedSandbox: true,
      executionRef: `codex-exec-tool:${toolRequest.requestDigest}:${response.hostExecutionId}`,
      launcherId: response.launcherId,
      launcherKind: response.launcherKind,
      hostScript: reviewLauncherHostScript,
      requestDigest: toolRequest.requestDigest,
      hostExecutionId: response.hostExecutionId
    }
  };
}

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
  const environment = Object.fromEntries(["HOME", "USERPROFILE", "APPDATA", "LOCALAPPDATA"]
    .filter((name) => typeof parentEnvironment[name] === "string")
    .map((name) => [name, parentEnvironment[name]]));
  const platformPath = ["/opt/homebrew/bin", "/usr/local/bin", "/usr/bin", "/bin"]
    .filter((entry) => fs.existsSync(entry))
    .join(path.delimiter);
  return platformPath ? { ...environment, PATH: platformPath } : environment;
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
    args: ["exec", "--strict-config", ...codexRestrictedReviewArguments(), "--ephemeral", "--ignore-user-config", "--ignore-rules", "--skip-git-repo-check", "--cd", view.reviewPath, "--output-schema", schemaPath, "--output-last-message", resultPath,
      "Review only the sealed package in this disposable detached view. Inspect the exact base-to-head diff and relevant committed files. Do not modify files, Git, credentials, network state, or external systems. Return only the required JSON findings payload without an intended conclusion."],
    environment: { ...authenticationEnvironment, NO_COLOR: "1", GITHUB_TOKEN: "", GH_TOKEN: "", SSH_AUTH_SOCK: "", AWS_ACCESS_KEY_ID: "", AWS_SECRET_ACCESS_KEY: "", AWS_SESSION_TOKEN: "", NPM_TOKEN: "" }
  };
}

export function degradedCapabilityLedger() {
  return {
    enforced: ["freshContext", "nonInteractive", "sealedPackageOnly", "detachedView", "innerReadOnlySandbox", "credentialAccess"],
    unavailable: ["authenticatedParentLaunchEvidence", "hostPinnedReviewerExecutableIdentity"],
    instructionConstrained: ["workspaceWrite", "gitWrite", "githubMutation", "authenticatedNetwork", "externalSend", "deployment", "release", "delegatedMutation"]
  };
}

export function probeCodexReviewAdapter({ executable = "codex", attestationRef = "attestations/codex-read-only-v1.json" } = {}) {
  if (!helpIncludes(executable, ["exec", "--help"], ["--config", "--strict-config", "--ephemeral", "--ignore-user-config", "--output-schema"])) {
    return platformUnavailable("adapter-preflight", "probe-codex-reviewer", "independent-reviewer-codex-runtime-unavailable", "codex-reviewer", "The configured Codex reviewer runtime or required capabilities are unavailable.");
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
  if (process.platform === "win32") return platformUnavailable("adapter-preflight", "probe-claude-reviewer", "independent-reviewer-claude-native-windows-unsupported", "claude-reviewer", "The configured Claude reviewer boundary is unsupported on this platform.");
  if (!helpIncludes(executable, ["--help"], ["--print", "--settings", "--setting-sources", "--no-session-persistence", "--tools"])) {
    return platformUnavailable("adapter-preflight", "probe-claude-reviewer", "independent-reviewer-claude-runtime-unavailable", "claude-reviewer", "The configured Claude reviewer runtime or required capabilities are unavailable.");
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

function safeProcessDiagnostic({ adapter, execution, code, category, subject, safeMessage }) {
  return createReviewDiagnostic({ stage: "reviewer-execution", operation: `${adapter}-strict-review`, code, category, subject, ...(Number.isInteger(execution?.status) ? { exitCode: execution.status } : {}), safeMessage });
}

function executionText(execution = {}) {
  return `${execution.stdout ?? ""}\n${execution.stderr ?? ""}`;
}

function diagnoseReviewProcessFailure(adapter, execution = {}, { resultMissing = false } = {}) {
  const output = executionText(execution);
  const unavailable = (code, category, subject, safeMessage) => safeProcessDiagnostic({ adapter, execution, code, category, subject, safeMessage });
  if (execution?.error?.code === "ENOENT") {
    return unavailable(`independent-reviewer-${adapter}-runtime-unavailable`, "runtime-unavailable", "reviewer-executable", "The configured reviewer executable is not available; install or configure the reviewer runtime and retry.");
  }
  if (adapter === "codex" && /in-process app-server client|app-server.*operation not permitted|operation not permitted.*app-server/i.test(output)) {
    return unavailable("independent-reviewer-nested-app-server-denied", "permission-denied", "codex-app-server", "The Codex isolated reviewer cannot start its app-server in this runtime; use a runtime that permits the configured reviewer boundary.");
  }
  if (/\b(?:authentication|auth|login|sign[ -]?in|credential|token)\b.{0,80}\b(?:failed|invalid|expired|missing|required|denied|unavailable)\b|\b(?:failed|invalid|expired|missing|required|denied|unavailable)\b.{0,80}\b(?:authentication|auth|login|sign[ -]?in|credential|token)\b/i.test(output)) {
    return unavailable(`independent-reviewer-${adapter}-authentication-unavailable`, "authentication-unavailable", "reviewer-authentication", "The isolated reviewer cannot access a valid authentication session; refresh its runtime authentication and retry.");
  }
  if (/\b(?:network|connection|dns|proxy|certificate|tls|offline|timed?\s*out)\b/i.test(output)) {
    return unavailable(`independent-reviewer-${adapter}-network-unavailable`, "network-unavailable", "reviewer-network", "The isolated reviewer cannot reach its required runtime service; restore the permitted reviewer network path and retry.");
  }
  if (/output[- ](?:schema|last-message)|structured[- ]output|schema(?:\s+validation)?\s+(?:failed|invalid)|invalid\s+(?:json|schema)/i.test(output)) {
    return unavailable(`independent-reviewer-${adapter}-output-contract-invalid`, "output-contract-invalid", "reviewer-result-contract", "The reviewer did not produce a result matching the required output contract; verify the installed reviewer supports the configured structured-output options and retry.");
  }
  if (/sandbox.*(?:unavailable|denied|operation not permitted)|failIfUnavailable|permission denied|operation not permitted/i.test(output)) {
    return unavailable(`independent-reviewer-${adapter}-sandbox-unavailable`, "permission-denied", "reviewer-sandbox", "The isolated reviewer sandbox could not start with its required restrictions; use a runtime that supports the configured boundary and retry.");
  }
  if (resultMissing && execution?.status === 0) {
    return unavailable(`independent-reviewer-${adapter}-output-contract-invalid`, "output-contract-invalid", "reviewer-result-contract", "The reviewer exited without a valid result artifact; verify its structured-output configuration and retry.");
  }
  return unclassifiedRuntimeDiagnostic({ stage: "reviewer-execution", operation: `${adapter}-strict-review`, code: `independent-reviewer-${adapter}-unclassified-runtime-failure`, subject: "reviewer-process", ...(Number.isInteger(execution?.status) ? { exitCode: execution.status } : {}), safeMessage: "The isolated reviewer failed without a classifiable safe signal; inspect its local runtime diagnostics and retry." });
}

export function diagnoseCodexExecutionFailure(execution = {}, options = {}) {
  return diagnoseReviewProcessFailure("codex", execution, options);
}

export function diagnoseClaudeExecutionFailure(execution = {}, options = {}) {
  return diagnoseReviewProcessFailure("claude", execution, options);
}

export function classifyCodexExecutionFailure(execution = {}) {
  return diagnoseCodexExecutionFailure(execution).code;
}

export function classifyClaudeExecutionFailure(execution = {}) {
  return diagnoseClaudeExecutionFailure(execution).code;
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
  if (!probe.available) return { ...unavailableOutcome(probe.diagnostic), result: unavailable(probe.code, { reviewPackage, adapter: "codex", reviewer, attestationRef }) };
  const invocation = buildCodexReviewInvocation({ executable, view, schemaPath, resultPath, authenticationEnvironment: codexAuthenticationEnvironment() });
  const execution = invokeReviewProcess(invocation, view, run);
  let result = null;
  try { result = fs.existsSync(resultPath) ? parseJsonResult(fs.readFileSync(resultPath, "utf8")) : null; } catch { result = null; }
  if (execution.status !== 0 || !result) {
    const diagnostic = diagnoseCodexExecutionFailure(execution, { resultMissing: !result });
    return { ...unavailableOutcome(diagnostic), result: unavailable(diagnostic.code, { reviewPackage, adapter: "codex", reviewer, attestationRef }), execution: { status: execution.status, signal: execution.signal ?? null, emittedResult: false } };
  }
  return { status: result.status, result, execution: { status: 0, signal: null, emittedResult: true } };
}

export function runCodexDegradedReviewAdapter({ reviewPackage, view, schemaPath, resultPath, reviewer, attestationRef, strictResult, degradedAuthorization, executable, run = spawnSync }) {
  const probe = probeCodexReviewAdapter({ executable, attestationRef });
  if (!probe.available) return { ...unavailableOutcome(probe.diagnostic), result: unavailable(probe.code, { reviewPackage, adapter: "codex", reviewer, attestationRef }) };
  const startedAt = now();
  const invocation = buildCodexDegradedReviewInvocation({ executable, view, schemaPath, resultPath, authenticationEnvironment: codexAuthenticationEnvironment() });
  const execution = invokeReviewProcess(invocation, view, run);
  let payload = null;
  try { payload = fs.existsSync(resultPath) ? parseJsonResult(fs.readFileSync(resultPath, "utf8")) : null; } catch { payload = null; }
  if (execution.status !== 0 || !validFindingPayload(payload)) {
    const diagnostic = diagnoseCodexExecutionFailure(execution, { resultMissing: !validFindingPayload(payload) });
    return { ...unavailableOutcome(diagnostic), result: unavailable(diagnostic.code, { reviewPackage, adapter: "codex", reviewer, attestationRef, startedAt }), execution: { status: execution.status, signal: execution.signal ?? null, emittedResult: false } };
  }
  const sealed = sealCodexDegradedReviewPayload({ payload, reviewPackage, reviewer, attestationRef, strictResult, degradedAuthorization, startedAt });
  return { status: sealed.result.status, result: sealed.result, execution: { status: 0, signal: null, emittedResult: true } };
}

export function sealCodexDegradedReviewPayload({ payload, reviewPackage, reviewer, attestationRef, strictResult, degradedAuthorization, startedAt = now() } = {}) {
  if (!validFindingPayload(payload)) return null;
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
  return { status: result.status, result, degradedAuthorization: result.degradedAuthorization };
}

export function runClaudeDegradedReviewAdapter({ reviewPackage, view, schemaPath, reviewer, attestationRef, strictResult, degradedAuthorization, executable, run = spawnSync, probe = probeClaudeReviewAdapter }) {
  const probeResult = probe({ executable, attestationRef });
  if (!probeResult.available) return { ...unavailableOutcome(probeResult.diagnostic), result: unavailable(probeResult.code, { reviewPackage, adapter: "claude", reviewer, attestationRef }) };
  const startedAt = now();
  let schema = null;
  try { schema = JSON.parse(fs.readFileSync(schemaPath, "utf8")); } catch { schema = null; }
  if (!schema) {
    const diagnostic = diagnosticFromCode({ stage: "adapter-preflight", operation: "load-claude-result-schema", code: "independent-reviewer-claude-schema-unavailable", subject: "reviewer-result-schema", safeMessage: "The Claude reviewer result schema is unavailable." });
    return { ...unavailableOutcome(diagnostic), result: unavailable(diagnostic.code, { reviewPackage, adapter: "claude", reviewer, attestationRef, startedAt }) };
  }
  const invocation = buildClaudeDegradedReviewInvocation({ executable, view, schema, reviewerHomePath: prepareReviewerHome(view) });
  const execution = invokeReviewProcess(invocation, view, run);
  const payload = parseJsonResult(execution.stdout);
  if (execution.status !== 0 || !validFindingPayload(payload)) {
    const diagnostic = diagnoseClaudeExecutionFailure(execution, { resultMissing: !validFindingPayload(payload) });
    return { ...unavailableOutcome(diagnostic), result: unavailable(diagnostic.code, { reviewPackage, adapter: "claude", reviewer, attestationRef, startedAt }), execution: { status: execution.status, signal: execution.signal ?? null, emittedResult: false } };
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
      unavailable: ["authenticatedParentLaunchEvidence", "hostPinnedReviewerExecutableIdentity"],
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
  if (!probe.available) return { ...unavailableOutcome(probe.diagnostic), result: unavailable(probe.code, { reviewPackage, adapter: "claude", reviewer, attestationRef }) };
  let reviewerHomePath;
  try {
    fs.writeFileSync(settingsPath, `${JSON.stringify(createClaudeReviewSettings(view))}\n`, { mode: 0o600 });
    reviewerHomePath = prepareReviewerHome(view);
  } catch (error) {
    const diagnostic = diagnosticFromError({ stage: "adapter-preflight", operation: "prepare-claude-reviewer", code: "independent-reviewer-claude-settings-unavailable", subject: "claude-reviewer-settings", safeMessage: "The Claude reviewer isolation settings could not be prepared.", error });
    return { ...unavailableOutcome(diagnostic), result: unavailable(diagnostic.code, { reviewPackage, adapter: "claude", reviewer, attestationRef }) };
  }
  const invocation = buildClaudeReviewInvocation({ executable, view, settingsPath, schema, reviewerHomePath });
  const execution = invokeReviewProcess(invocation, view, run);
  const result = parseJsonResult(execution.stdout);
  if (execution.status !== 0 || !result) {
    const diagnostic = diagnoseClaudeExecutionFailure(execution, { resultMissing: !result });
    return { ...unavailableOutcome(diagnostic), result: unavailable(diagnostic.code, { reviewPackage, adapter: "claude", reviewer, attestationRef }), execution: { status: execution.status, signal: execution.signal ?? null, emittedResult: false } };
  }
  return { status: result.status, result, execution: { status: 0, signal: null, emittedResult: true } };
}

export { unavailable as unavailableReviewResult };
