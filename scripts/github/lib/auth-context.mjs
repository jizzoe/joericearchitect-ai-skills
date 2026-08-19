import { ghCommand } from "./gh.mjs";

export const githubAuthProbeCommandKinds = Object.freeze(["github-api-user", "repository-read"]);
export const githubAuthProbeContexts = Object.freeze(["restricted", "host"]);
export const githubAuthProbeStates = Object.freeze(["success", "authentication-shaped", "unavailable-cli", "unknown"]);

const repositoryPattern = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
const accountPattern = /^[A-Za-z0-9-]{1,39}$/;
const timestamp = (value) => typeof value === "string" && !Number.isNaN(Date.parse(value));
const text = (value) => typeof value === "string" && value.trim().length > 0;

function safeRepository(value) {
  if (typeof value !== "string" || !repositoryPattern.test(value)) return null;
  const [owner, name] = value.split("/");
  return owner !== "." && owner !== ".." && name !== "." && name !== ".." ? value : null;
}

function safeAccount(value) {
  if (!text(value)) return null;
  const account = value.trim().split(/\r?\n/, 1)[0];
  return accountPattern.test(account) ? account : null;
}

function outputOf(result) {
  return [result?.stdout, result?.stderr, result?.error?.message, result?.error?.code]
    .filter((value) => typeof value === "string")
    .join("\n");
}

export function isAuthenticationShapedGithubFailure(result) {
  const output = outputOf(result);
  return /(?:http\s*401|bad credentials|authentication token is invalid|authentication required|token (?:is )?(?:invalid|expired)|gh auth login)/i.test(output);
}

export function isGithubCliUnavailable(result) {
  if (result?.error?.code === "ENOENT" || result?.status === 127) return true;
  return /(?:command not found|not recognized as an internal or external command|spawn\s+gh\s+enoent)/i.test(outputOf(result));
}

export function githubAuthProbeArgs({ commandKind, repository } = {}) {
  if (!githubAuthProbeCommandKinds.includes(commandKind)) return null;
  if (commandKind === "github-api-user") return ["api", "user", "--method", "GET", "--jq", ".login"];
  const target = safeRepository(repository);
  return target ? ["api", `repos/${target}`, "--method", "GET", "--jq", ".full_name"] : null;
}

/**
 * Converts an untrusted process result into the intentionally small durable
 * probe shape. Raw output is used only to classify the result and is never
 * returned.
 */
export function normalizeGithubAuthProbeResult({ commandKind, repository, contextType, result, observedAt = new Date().toISOString() } = {}) {
  const args = githubAuthProbeArgs({ commandKind, repository });
  if (!args || !githubAuthProbeContexts.includes(contextType) || !timestamp(observedAt)) return null;
  const normalized = {
    commandKind,
    contextType,
    observedAt
  };
  if (commandKind === "repository-read") normalized.repository = repository;
  if (result?.ok === true) {
    normalized.state = "success";
    if (commandKind === "github-api-user") {
      const account = safeAccount(result.stdout);
      if (account) normalized.account = account;
    }
    return normalized;
  }
  if (isAuthenticationShapedGithubFailure(result)) normalized.state = "authentication-shaped";
  else if (isGithubCliUnavailable(result)) normalized.state = "unavailable-cli";
  else normalized.state = "unknown";
  return normalized;
}

export function validateGithubAuthProbeEvidence(value) {
  if (!value || typeof value !== "object" || !githubAuthProbeCommandKinds.includes(value.commandKind) ||
      !githubAuthProbeContexts.includes(value.contextType) || !githubAuthProbeStates.includes(value.state) ||
      !timestamp(value.observedAt)) return false;
  if (value.commandKind === "repository-read" && !safeRepository(value.repository)) return false;
  if (value.commandKind === "github-api-user" && value.repository !== undefined) return false;
  if (value.account !== undefined && !safeAccount(value.account)) return false;
  return Object.keys(value).every((key) => ["commandKind", "contextType", "state", "observedAt", "repository", "account"].includes(key));
}

export function probeGithubCliAuthContext({ commandKind = "github-api-user", repository, contextType = "restricted", observedAt } = {}, { run = (args) => ghCommand(args) } = {}) {
  const args = githubAuthProbeArgs({ commandKind, repository });
  if (!args || !githubAuthProbeContexts.includes(contextType)) {
    return { available: false, classification: "auth-state-unknown", reason: "github-auth-probe-input-invalid" };
  }
  let result;
  try {
    result = run(args);
  } catch {
    result = { ok: false, error: { code: "runner-failed" } };
  }
  const evidence = normalizeGithubAuthProbeResult({ commandKind, repository, contextType, result, observedAt });
  return evidence
    ? { available: true, evidence }
    : { available: false, classification: "auth-state-unknown", reason: "github-auth-probe-normalization-failed" };
}
