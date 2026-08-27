import assert from "node:assert/strict";
import test from "node:test";

import {
  resolveReviewAdapterDispatch,
  reviewAdapterBindingMatches,
  selectReviewAdapterImplementation,
  validateReviewAdapterDispatchBinding
} from "../review-adapter-dispatch.mjs";

const snapshot = (reviewAdapter) => ({
  schemaVersion: 1,
  sources: ["config/ai-skills.json:runtime"],
  values: { evidenceRoot: "docs/evidence", ...(reviewAdapter ? { reviewAdapter } : {}) }
});

test("resolver maps each allowlisted durable selection to one complete immutable binding", () => {
  const codex = resolveReviewAdapterDispatch(snapshot("codex-detached-read-only-v1"));
  const claude = resolveReviewAdapterDispatch(snapshot("claude-detached-restricted-v1"));
  assert.equal(codex.valid, true);
  assert.equal(codex.binding.resultAdapter, "codex");
  assert.equal(codex.binding.launcherKind, codex.binding.reviewAdapter);
  assert.equal(codex.binding.runtimeHelper, "platform-review-adapters");
  assert.match(codex.binding.bindingDigest, /^[0-9a-f]{64}$/);
  assert.equal(Object.isFrozen(codex.binding), true);
  assert.equal(claude.valid, true);
  assert.equal(claude.binding.resultAdapter, "claude");
  assert.notEqual(claude.binding.bindingDigest, codex.binding.bindingDigest);
});

test("missing, malformed, and unsupported selections fail without a fallback", () => {
  assert.equal(resolveReviewAdapterDispatch().code, "review-adapter-selection-missing");
  assert.equal(resolveReviewAdapterDispatch(snapshot()).code, "review-adapter-selection-missing");
  assert.equal(resolveReviewAdapterDispatch(snapshot("other")).code, "review-adapter-selection-unsupported");
  assert.equal(resolveReviewAdapterDispatch({ ...snapshot("codex-detached-read-only-v1"), sources: ["x", "x"] }).code, "review-adapter-selection-missing");
});

test("binding validation rejects launcher, reviewer, receipt, result, and binding mismatches", () => {
  const configurationSnapshot = snapshot("codex-detached-read-only-v1");
  const { binding } = resolveReviewAdapterDispatch(configurationSnapshot);
  const valid = {
    configurationSnapshot,
    binding,
    launcher: { kind: binding.launcherKind },
    reviewer: { adapter: "codex" },
    runtimeReceipt: { reviewAdapter: binding.reviewAdapter, runtimeHelper: "platform-review-adapters", source: "codex-exec-tool" },
    result: { reviewer: { adapter: "codex" } }
  };
  assert.equal(validateReviewAdapterDispatchBinding(valid).valid, true);
  assert.equal(validateReviewAdapterDispatchBinding({ ...valid, binding: { ...binding, strictOperation: "substitute" } }).code, "review-adapter-binding-mismatch");
  assert.equal(validateReviewAdapterDispatchBinding({ ...valid, launcher: { kind: "claude-detached-restricted-v1" } }).code, "review-adapter-launcher-mismatch");
  assert.equal(validateReviewAdapterDispatchBinding({ ...valid, reviewer: { adapter: "claude" } }).code, "review-adapter-reviewer-mismatch");
  assert.equal(validateReviewAdapterDispatchBinding({ ...valid, runtimeReceipt: { ...valid.runtimeReceipt, reviewAdapter: "claude-detached-restricted-v1" } }).code, "review-adapter-runtime-receipt-mismatch");
  assert.equal(validateReviewAdapterDispatchBinding({ ...valid, runtimeReceipt: { ...valid.runtimeReceipt, runtimeHelper: "substituted-helper" } }).code, "review-adapter-runtime-receipt-mismatch");
  assert.equal(validateReviewAdapterDispatchBinding({ ...valid, result: { reviewer: { adapter: "claude" } } }).code, "review-adapter-result-mismatch");
  assert.equal(reviewAdapterBindingMatches(configurationSnapshot, binding), true);
});

test("implementation selection uses only the sealed adapter key and rejects direct substitutes", () => {
  const configurationSnapshot = snapshot("claude-detached-restricted-v1");
  const { binding } = resolveReviewAdapterDispatch(configurationSnapshot);
  const strict = () => "strict";
  const degraded = () => "degraded";
  const implementations = {
    "claude-detached-restricted-v1": {
      reviewAdapter: "claude-detached-restricted-v1",
      binding,
      strict,
      degraded
    },
    "codex-detached-read-only-v1": {
      reviewAdapter: "codex-detached-read-only-v1",
      binding: resolveReviewAdapterDispatch(snapshot("codex-detached-read-only-v1")).binding,
      strict: () => "wrong",
      degraded: () => "wrong"
    }
  };
  assert.equal(selectReviewAdapterImplementation({ configurationSnapshot, implementations }).operation(), "strict");
  assert.equal(selectReviewAdapterImplementation({ configurationSnapshot, implementations, phase: "authorized-degraded" }).operation(), "degraded");
  assert.equal(selectReviewAdapterImplementation({ configurationSnapshot, implementations: { ...implementations, "claude-detached-restricted-v1": implementations["codex-detached-read-only-v1"] } }).code, "review-adapter-implementation-missing");
  assert.equal(selectReviewAdapterImplementation({ configurationSnapshot, implementations: { direct: strict } }).code, "review-adapter-implementation-missing");
});
