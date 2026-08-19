import assert from "node:assert/strict";
import test from "node:test";

import {
  authorizeGithubAuthContextEvidence,
  createGithubAuthContextBinding,
  evaluateGithubAuthContextContrast,
  validateGithubAuthContextEvidence
} from "../github-cli-auth-context.mjs";

const expiresAt = "2026-08-20T00:00:00.000Z";
const observedAt = "2026-08-19T20:00:00.000Z";
const input = {
  selectedEntry: "auth-context-change",
  operation: "issue-create-or-reuse",
  repository: "owner/repository",
  payloadDigest: "a".repeat(64),
  expiresAt
};
const binding = createGithubAuthContextBinding(input).binding;
const probe = (contextType, state, account) => ({ commandKind: "github-api-user", contextType, state, observedAt, ...(account ? { account } : {}) });

test("binding is exact, portable, and rejects unsafe scope", () => {
  assert.equal(createGithubAuthContextBinding(input).valid, true);
  assert.equal(createGithubAuthContextBinding({ ...input, repository: "../repo" }).valid, false);
  assert.equal(createGithubAuthContextBinding({ ...input, payloadDigest: "not-a-digest" }).valid, false);
});

test("current-context success becomes accepted authenticated evidence", () => {
  const result = evaluateGithubAuthContextContrast({ binding, restrictedProbe: probe("restricted", "success", "octocat"), observedAt });
  assert.equal(result.valid, true);
  assert.equal(result.evidence.classification, "authenticated");
  assert.equal(validateGithubAuthContextEvidence(result.evidence), true);
  assert.deepEqual(authorizeGithubAuthContextEvidence({ evidence: result.evidence, ...input, now: observedAt }), {
    allowed: true, classification: "authorized", bindingDigest: result.evidence.bindingDigest, recoveryReference: binding.recoveryReference
  });
});

test("contrast distinguishes restricted visibility, invalid credential, and denied host permission", () => {
  const restricted = probe("restricted", "authentication-shaped");
  const unavailable = evaluateGithubAuthContextContrast({ binding, restrictedProbe: restricted, hostProbe: probe("host", "success", "octocat"), hostPermission: "granted", observedAt });
  assert.equal(unavailable.evidence.classification, "credential-unavailable-in-restricted-runtime");
  const invalid = evaluateGithubAuthContextContrast({ binding, restrictedProbe: restricted, hostProbe: probe("host", "authentication-shaped"), hostPermission: "granted", observedAt });
  assert.equal(invalid.evidence.classification, "credential-invalid-or-expired");
  const denied = evaluateGithubAuthContextContrast({ binding, restrictedProbe: restricted, hostPermission: "denied", observedAt });
  assert.equal(denied.evidence.classification, "host-permission-denied");
  assert.equal(authorizeGithubAuthContextEvidence({ evidence: unavailable.evidence, ...input, executionContext: "restricted", now: observedAt }).allowed, false);
  assert.equal(authorizeGithubAuthContextEvidence({ evidence: unavailable.evidence, ...input, executionContext: "host", now: observedAt }).allowed, true);
  for (const evidence of [invalid.evidence, denied.evidence]) {
    assert.equal(authorizeGithubAuthContextEvidence({ evidence, ...input, now: observedAt }).allowed, false);
    assert.doesNotMatch(JSON.stringify(evidence), /token|stdout|stderr|secret/i);
  }
});

test("a restricted authentication failure requests only the same bound host probe", () => {
  const result = evaluateGithubAuthContextContrast({ binding, restrictedProbe: probe("restricted", "authentication-shaped"), observedAt });
  assert.equal(result.valid, true);
  assert.equal(result.classification, "host-retry-required");
  assert.equal(result.hostRetry.bindingDigest, createGithubAuthContextBinding(input).bindingDigest);
  assert.equal(result.hostRetry.commandKind, "github-api-user");
});

test("unknown, expired, and cross-target evidence fail closed", () => {
  const unknown = evaluateGithubAuthContextContrast({ binding, restrictedProbe: probe("restricted", "unknown"), observedAt }).evidence;
  assert.equal(unknown.classification, "auth-state-unknown");
  assert.equal(authorizeGithubAuthContextEvidence({ evidence: unknown, ...input, now: observedAt }).allowed, false);
  assert.equal(authorizeGithubAuthContextEvidence({ evidence: evaluateGithubAuthContextContrast({ binding, restrictedProbe: probe("restricted", "success"), observedAt }).evidence, ...input, repository: "other/repository", now: observedAt }).reason, "github-auth-context-evidence-mismatch");
  assert.equal(evaluateGithubAuthContextContrast({ binding, restrictedProbe: probe("restricted", "success"), observedAt: expiresAt }).reason, "github-auth-context-binding-expired");
});
