import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { requiredReviewDenials } from "./review-adapter-contract.mjs";

const now = () => new Date().toISOString();
const unavailable = (code, { reviewPackage, adapter, reviewer, attestationRef, startedAt = now(), executionId = randomUUID() } = {}) => ({
  schemaVersion: 1,
  reviewRecordId: `unavailable-${executionId}`,
  executionId,
  reviewer: { type: reviewer?.type ?? adapter, identity: reviewer?.identity ?? `${adapter}-reviewer`, adapter },
  attestation: { ref: attestationRef ?? "unavailable", nonInteractive: false, isolatedContext: false, freshContext: false, readOnly: false },
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
  const run = spawnSync(executable, arguments_, { encoding: "utf8", timeout: 10_000 });
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

export function buildCodexReviewInvocation({ executable = "codex", view, schemaPath, resultPath }) {
  return {
    executable,
    args: ["exec", "--sandbox", "read-only", "--ephemeral", "--ignore-user-config", "--ignore-rules", "--cd", view.reviewPath, "--output-schema", schemaPath, "--output-last-message", resultPath,
      "Review only the committed detached repository view. Read .ai-independent-review-package.json and inspect the exact base-to-head diff. Do not modify files, Git, credentials, network state, or external systems. Return only the required JSON review result."],
    environment: { NO_COLOR: "1" }
  };
}

export function probeCodexReviewAdapter({ executable = "codex", attestationRef = "attestations/codex-read-only-v1.json" } = {}) {
  if (!helpIncludes(executable, ["exec", "--help"], ["--sandbox", "--ephemeral", "--ignore-user-config", "--output-schema"])) {
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

export function buildClaudeReviewInvocation({ executable = "claude", view, settingsPath, schema }) {
  return {
    executable,
    args: ["--print", "--safe-mode", "--no-session-persistence", "--setting-sources", "", "--settings", settingsPath,
      "--tools", "Bash", "--disallowed-tools", "Edit,Write,NotebookEdit,Task,Agent,WebFetch,WebSearch,MCP", "--permission-mode", "dontAsk", "--output-format", "json", "--json-schema", JSON.stringify(schema),
      "Review only the committed detached repository view. Read .ai-independent-review-package.json and inspect the exact base-to-head diff. Do not modify files, Git, credentials, network state, or external systems. Return only the required JSON review result."],
    environment: { CLAUDE_CODE_SUBPROCESS_ENV_SCRUB: "1", NO_COLOR: "1" }
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
  fs.writeFileSync(filePath, `${JSON.stringify(reviewPackage)}\n`, { mode: 0o400 });
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

function invoke(invocation, view, run) {
  return run(invocation.executable, invocation.args, {
    cwd: view.reviewPath,
    encoding: "utf8",
    timeout: 120_000,
    env: { ...process.env, ...invocation.environment }
  });
}

export function runCodexReviewAdapter({ reviewPackage, view, schemaPath, resultPath, reviewer, attestationRef, executable, run = spawnSync }) {
  const probe = probeCodexReviewAdapter({ executable, attestationRef });
  if (!probe.available) return { status: "unavailable", result: unavailable(probe.code, { reviewPackage, adapter: "codex", reviewer, attestationRef }) };
  const invocation = buildCodexReviewInvocation({ executable, view, schemaPath, resultPath });
  const execution = invoke(invocation, view, run);
  let result = null;
  try { result = fs.existsSync(resultPath) ? parseJsonResult(fs.readFileSync(resultPath, "utf8")) : null; } catch { result = null; }
  if (execution.status !== 0 || !result) {
    return { status: "unavailable", result: unavailable("independent-reviewer-codex-execution-unavailable", { reviewPackage, adapter: "codex", reviewer, attestationRef }), execution: { status: execution.status, signal: execution.signal ?? null, emittedResult: false } };
  }
  return { status: result.status, result, execution: { status: 0, signal: null, emittedResult: true } };
}

export function runClaudeReviewAdapter({ reviewPackage, view, settingsPath, schema, reviewer, attestationRef, executable, run = spawnSync }) {
  const probe = probeClaudeReviewAdapter({ executable, attestationRef });
  if (!probe.available) return { status: "unavailable", result: unavailable(probe.code, { reviewPackage, adapter: "claude", reviewer, attestationRef }) };
  fs.writeFileSync(settingsPath, `${JSON.stringify(createClaudeReviewSettings(view))}\n`, { mode: 0o600 });
  const invocation = buildClaudeReviewInvocation({ executable, view, settingsPath, schema });
  const execution = invoke(invocation, view, run);
  const result = parseJsonResult(execution.stdout);
  if (execution.status !== 0 || !result) {
    return { status: "unavailable", result: unavailable("independent-reviewer-claude-execution-unavailable", { reviewPackage, adapter: "claude", reviewer, attestationRef }), execution: { status: execution.status, signal: execution.signal ?? null, emittedResult: false } };
  }
  return { status: result.status, result, execution: { status: 0, signal: null, emittedResult: true } };
}

export { unavailable as unavailableReviewResult };
