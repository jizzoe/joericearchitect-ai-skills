import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";

import { packageDigest } from "../independent-review-contract.mjs";
import {
  bootstrapReviewBindingDigest,
  buildBootstrapReviewBinding,
  validateBootstrapReviewBinding
} from "../review-bootstrap-binding.mjs";
import { reviewWorktreeLifecycleRequestDigest } from "../review-worktree-lifecycle.mjs";

const sha = (value) => createHash("sha256").update(value).digest("hex");
const draft = {
  schemaVersion: 1,
  baseCommit: "1".repeat(40),
  headCommit: "2".repeat(40),
  diff: "diff --git a/file b/file\n",
  artifacts: [{ path: "file", sha256: sha("file"), bytes: 4 }],
  validationEvidence: ["tests passed"]
};
const reviewPackage = { ...draft, manifestDigest: packageDigest(draft) };
const installedRuntime = {
  generation: "runtime-5f050691d1e3",
  digest: "5".repeat(64),
  sourceRevision: "a".repeat(40),
  helper: "platform-review-adapters"
};
const ownerAuthorization = {
  reference: "conversation:explicit-bootstrap-authorization",
  scopeDigest: "9".repeat(64)
};
const reviewer = { type: "claude", identity: "bootstrap-reviewer", adapter: "claude", attestationRef: "attestations/claude-sandbox-v1.json" };
const lifecycleRequest = {
  schemaVersion: 1,
  lifecycleId: "bootstrap-review-lifecycle-1",
  request: {
    operation: "create-detached-review-worktree-v1",
    sourceRequestDigest: "8".repeat(64),
    repositoryPath: "/fixture/repository",
    baseCommit: reviewPackage.baseCommit,
    headCommit: reviewPackage.headCommit,
    manifestDigest: reviewPackage.manifestDigest,
    expiresAt: "2026-08-27T12:00:00.000Z"
  }
};
lifecycleRequest.requestDigest = reviewWorktreeLifecycleRequestDigest(lifecycleRequest);
const worktreeLifecycle = {
  lifecycleRequest,
  exactOwned: true,
  cleanupRequired: true
};
const input = {
  bindingId: "bootstrap-binding-1",
  change: "repair",
  transition: "merge-pr",
  repositoryId: "owner/repository",
  reviewPackage,
  expiresAt: "2026-08-27T12:00:00.000Z",
  ownerAuthorization,
  installedRuntime,
  launcher: {
    kind: "claude-detached-restricted-v1",
    executableName: "claude",
    executableSha256: "6".repeat(64),
    boundary: "detached-exact-head-read-tools-only",
    capabilityProbeRef: "probe:claude:2.1.220"
  },
  implementerIdentity: "implementation-session",
  reviewer,
  worktreeLifecycle
};
const expected = {
  expectedChange: "repair",
  expectedTransition: "merge-pr",
  expectedRepositoryId: "owner/repository",
  reviewPackage,
  installedRuntime,
  launcher: input.launcher,
  implementerIdentity: input.implementerIdentity,
  reviewer,
  ownerAuthorization,
  worktreeLifecycle,
  authorizationExpiresAt: "2026-08-27T13:00:00.000Z",
  now: "2026-08-27T11:00:00.000Z"
};

test("bootstrap binding seals exact package, N-1 runtime, Claude identity, and owned lifecycle", () => {
  const binding = buildBootstrapReviewBinding(input);
  assert.equal(validateBootstrapReviewBinding(binding, expected).valid, true);
  assert.equal(binding.bindingDigest, bootstrapReviewBindingDigest(binding));
  assert.equal(binding.reviewAdapter, "claude-detached-restricted-v1");
  assert.equal(binding.candidateCodexCaptureExcluded, true);
  assert.equal(Object.isFrozen(binding.worktreeLifecycle), true);
});

test("bootstrap binding rejects every self-certification and identity substitution boundary", () => {
  const binding = buildBootstrapReviewBinding(input);
  const changed = [
    [{ ...binding, headCommit: "3".repeat(40) }, "bootstrap-review-binding-invalid"],
    [{ ...binding, reviewAdapter: "codex-detached-read-only-v1" }, "bootstrap-review-binding-invalid"],
    [{ ...binding, installedRuntime: { ...binding.installedRuntime, digest: "7".repeat(64) } }, "bootstrap-review-binding-invalid"],
    [{ ...binding, launcher: { ...binding.launcher, executableSha256: "8".repeat(64) } }, "bootstrap-review-binding-invalid"],
    [{ ...binding, reviewer: { ...binding.reviewer, identity: "other" } }, "bootstrap-review-binding-invalid"],
    [{ ...binding, ownerAuthorization: { ...binding.ownerAuthorization, scopeDigest: "0".repeat(64) } }, "bootstrap-review-binding-invalid"],
    [{ ...binding, worktreeLifecycle: { ...binding.worktreeLifecycle, cleanupRequired: false } }, "bootstrap-review-binding-invalid"],
    [{ ...binding, candidateCodexCaptureExcluded: false }, "bootstrap-review-binding-invalid"]
  ];
  for (const [value, code] of changed) assert.equal(validateBootstrapReviewBinding(value, expected).code, code);
});

test("a correctly redigested record still rejects semantic mismatches and expiration", () => {
  const binding = buildBootstrapReviewBinding(input);
  const redigest = (value) => ({ ...value, bindingDigest: bootstrapReviewBindingDigest(value) });
  assert.equal(validateBootstrapReviewBinding(redigest({ ...binding, reviewAdapter: "codex-detached-read-only-v1" }), expected).code, "bootstrap-review-adapter-mismatch");
  assert.equal(validateBootstrapReviewBinding(redigest({ ...binding, reviewPolicy: "strict-only" }), expected).code, "bootstrap-review-adapter-mismatch");
  assert.equal(validateBootstrapReviewBinding(redigest({ ...binding, installedRuntime: { ...binding.installedRuntime, digest: "7".repeat(64) } }), expected).code, "bootstrap-review-runtime-mismatch");
  assert.equal(validateBootstrapReviewBinding(redigest({ ...binding, launcher: { ...binding.launcher, executableName: "codex" } }), expected).code, "bootstrap-review-launcher-mismatch");
  assert.equal(validateBootstrapReviewBinding(redigest({ ...binding, launcher: { ...binding.launcher, executableSha256: "0".repeat(64) } }), expected).code, "bootstrap-review-launcher-mismatch");
  assert.equal(validateBootstrapReviewBinding(redigest({ ...binding, reviewer: { ...binding.reviewer, identity: "other" } }), expected).code, "bootstrap-review-reviewer-mismatch");
  assert.equal(validateBootstrapReviewBinding(redigest({ ...binding, reviewer: { ...binding.reviewer, identity: binding.implementerIdentity } }), { ...expected, reviewer: { ...reviewer, identity: binding.implementerIdentity } }).code, "bootstrap-review-reviewer-mismatch");
  assert.equal(validateBootstrapReviewBinding(redigest({ ...binding, ownerAuthorization: { ...binding.ownerAuthorization, scopeDigest: "0".repeat(64) } }), expected).code, "bootstrap-review-authorization-mismatch");
  assert.equal(validateBootstrapReviewBinding(redigest({ ...binding, worktreeLifecycle: { ...binding.worktreeLifecycle, cleanupRequired: false } }), expected).code, "bootstrap-review-worktree-lifecycle-mismatch");
  assert.equal(validateBootstrapReviewBinding(redigest({ ...binding, candidateCodexCaptureExcluded: false }), expected).code, "bootstrap-review-self-certification-denied");
  assert.equal(validateBootstrapReviewBinding(binding, { ...expected, now: binding.expiresAt }).code, "bootstrap-review-binding-expired");
  assert.equal(validateBootstrapReviewBinding(binding, { ...expected, expectedTransition: "archive-change" }).code, "bootstrap-review-scope-mismatch");
});

test("bootstrap validation requires the exact prepared lifecycle request", () => {
  const binding = buildBootstrapReviewBinding(input);
  const changedLifecycleRequest = {
    ...lifecycleRequest,
    request: { ...lifecycleRequest.request, sourceRequestDigest: "0".repeat(64) }
  };
  changedLifecycleRequest.requestDigest = reviewWorktreeLifecycleRequestDigest(changedLifecycleRequest);
  assert.equal(validateBootstrapReviewBinding(binding, {
    ...expected,
    worktreeLifecycle: { ...worktreeLifecycle, lifecycleRequest: changedLifecycleRequest }
  }).code, "bootstrap-review-worktree-lifecycle-mismatch");

  const staleDigestLifecycle = {
    ...worktreeLifecycle,
    lifecycleRequest: {
      ...lifecycleRequest,
      request: { ...lifecycleRequest.request, repositoryPath: "/substituted/repository" }
    }
  };
  const staleBinding = buildBootstrapReviewBinding({ ...input, worktreeLifecycle: staleDigestLifecycle });
  assert.equal(validateBootstrapReviewBinding(staleBinding, {
    ...expected,
    worktreeLifecycle: staleDigestLifecycle
  }).code, "bootstrap-review-worktree-lifecycle-mismatch");
});
