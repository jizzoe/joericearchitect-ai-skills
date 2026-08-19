import assert from "node:assert/strict";
import test from "node:test";

import {
  githubAuthProbeArgs,
  normalizeGithubAuthProbeResult,
  probeGithubCliAuthContext,
  validateGithubAuthProbeEvidence
} from "../lib/auth-context.mjs";

const observedAt = "2026-08-19T20:00:00.000Z";

test("auth probe uses fixed read-only command kinds", () => {
  assert.deepEqual(githubAuthProbeArgs({ commandKind: "github-api-user" }), ["api", "user", "--method", "GET", "--jq", ".login"]);
  assert.deepEqual(githubAuthProbeArgs({ commandKind: "repository-read", repository: "owner/repository" }), ["api", "repos/owner/repository", "--method", "GET", "--jq", ".full_name"]);
  assert.equal(githubAuthProbeArgs({ commandKind: "shell", repository: "owner/repository" }), null);
  assert.equal(githubAuthProbeArgs({ commandKind: "repository-read", repository: "../escape" }), null);
});

test("auth probe normalizes success without retaining raw output", () => {
  const evidence = normalizeGithubAuthProbeResult({
    commandKind: "github-api-user", contextType: "restricted", observedAt,
    result: { ok: true, stdout: "octocat\nextra data that is not retained\n", stderr: "ignored" }
  });
  assert.deepEqual(evidence, { commandKind: "github-api-user", contextType: "restricted", observedAt, state: "success", account: "octocat" });
  assert.equal(validateGithubAuthProbeEvidence(evidence), true);
  assert.doesNotMatch(JSON.stringify(evidence), /extra data|ignored|stdout|stderr/i);
});

test("auth probe conservatively classifies failures and never returns credential-shaped output", () => {
  const cases = [
    [{ ok: false, status: 1, stderr: "HTTP 401: Bad credentials, token abcdef" }, "authentication-shaped"],
    [{ ok: false, status: 127, stderr: "command not found: gh" }, "unavailable-cli"],
    [{ ok: false, status: 1, stderr: "unexpected upstream failure" }, "unknown"]
  ];
  for (const [result, state] of cases) {
    const evidence = normalizeGithubAuthProbeResult({ commandKind: "github-api-user", contextType: "restricted", observedAt, result });
    assert.equal(evidence.state, state);
    assert.doesNotMatch(JSON.stringify(evidence), /abcdef|credentials|stdout|stderr/i);
  }
});

test("probe accepts an injected runner and rejects unsupported input without execution", () => {
  let calls = 0;
  const result = probeGithubCliAuthContext({ commandKind: "github-api-user", contextType: "host", observedAt }, {
    run: (args) => {
      calls += 1;
      assert.deepEqual(args, ["api", "user", "--method", "GET", "--jq", ".login"]);
      return { ok: true, stdout: "octocat\n" };
    }
  });
  assert.equal(calls, 1);
  assert.equal(result.evidence.account, "octocat");
  const invalid = probeGithubCliAuthContext({ commandKind: "arbitrary", contextType: "host" }, { run: () => { throw new Error("must not run"); } });
  assert.deepEqual(invalid, { available: false, classification: "auth-state-unknown", reason: "github-auth-probe-input-invalid" });
});
