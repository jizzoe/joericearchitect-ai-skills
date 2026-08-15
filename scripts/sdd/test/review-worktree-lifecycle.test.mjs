import assert from "node:assert/strict";
import test from "node:test";

import { packageDigest } from "../independent-review-contract.mjs";
import {
  cleanupReviewWorktreeLifecycle,
  executeReviewWorktreeLifecycle,
  prepareReviewWorktreeLifecycle,
  validatePreparedReviewWorktreeLifecycle,
  validateReviewWorktreeLifecycle
} from "../review-worktree-lifecycle.mjs";

const reviewPackage = (() => {
  const draft = {
    schemaVersion: 1,
    baseCommit: "1".repeat(40),
    headCommit: "2".repeat(40),
    diff: "diff --git a/file b/file\n",
    artifacts: [{ path: "file", sha256: "3".repeat(64), bytes: 4 }],
    validationEvidence: ["node --test: passed"]
  };
  return { ...draft, manifestDigest: packageDigest(draft) };
})();

const authorization = {
  expiresAt: "2026-08-14T00:00:00.000Z",
  reviewWorktreeLifecycle: {
    enabled: true,
    operation: "create-detached-review-worktree-v1",
    change: "change",
    transitions: ["merge-pr"],
    expiresAt: "2026-08-14T00:00:00.000Z",
    repositoryPath: "/fixture",
    baseCommit: reviewPackage.baseCommit,
    headCommit: reviewPackage.headCommit,
    manifestDigest: reviewPackage.manifestDigest
  }
};

const input = {
  authorization,
  selectedEntry: "change",
  transition: "merge-pr",
  reviewPackage,
  repositoryPath: "/fixture",
  sourceRequestDigest: "a".repeat(64),
  now: "2026-08-13T12:00:00.000Z"
};

test("lifecycle preparation seals repository, exact head, expiration, and parent request without a destination", () => {
  const prepared = prepareReviewWorktreeLifecycle(input, { lifecycleId: "fixture-lifecycle" });
  assert.equal(prepared.allowed, true, JSON.stringify(prepared));
  assert.equal(prepared.lifecycleRequest.request.operation, "create-detached-review-worktree-v1");
  assert.equal(prepared.lifecycleRequest.request.sourceRequestDigest, input.sourceRequestDigest);
  assert.equal(prepared.lifecycleRequest.request.repositoryPath, "/fixture");
  assert.equal(prepared.lifecycleRequest.request.headCommit, reviewPackage.headCommit);
  assert.equal("temporaryRoot" in prepared.lifecycleRequest.request, false);
  assert.match(prepared.lifecycleRequest.requestDigest, /^[0-9a-f]{64}$/);
  assert.equal(validatePreparedReviewWorktreeLifecycle({
    lifecycleRequest: prepared.lifecycleRequest,
    sourceRequestDigest: input.sourceRequestDigest,
    expected: prepared.lifecycle,
    now: input.now
  }).allowed, true);
});

test("lifecycle validation rejects expired, unbound, and changed-head requests before view construction", () => {
  assert.equal(validateReviewWorktreeLifecycle({
    ...input,
    authorization: { ...authorization, reviewWorktreeLifecycle: { ...authorization.reviewWorktreeLifecycle, expiresAt: "2026-08-13T11:59:59.000Z" } }
  }).code, "review-worktree-lifecycle-expired");
  assert.equal(validateReviewWorktreeLifecycle({
    ...input,
    authorization: { ...authorization, reviewWorktreeLifecycle: { ...authorization.reviewWorktreeLifecycle, headCommit: "4".repeat(40) } }
  }).code, "review-worktree-lifecycle-scope-mismatch");

  const prepared = prepareReviewWorktreeLifecycle(input, { lifecycleId: "fixture-lifecycle" });
  let called = false;
  const result = executeReviewWorktreeLifecycle({
    lifecycleRequest: prepared.lifecycleRequest,
    sourceRequestDigest: "b".repeat(64),
    expected: prepared.lifecycle,
    now: input.now
  }, { createView: () => { called = true; } });
  assert.equal(called, false);
  assert.equal(result.status, "unavailable");
  assert.equal(result.error.code, "review-worktree-lifecycle-parent-binding-mismatch");

  const changedDraft = { ...reviewPackage, headCommit: "4".repeat(40) };
  delete changedDraft.manifestDigest;
  const changedPackage = { ...changedDraft, manifestDigest: packageDigest(changedDraft) };
  assert.equal(validateReviewWorktreeLifecycle({ ...input, reviewPackage: changedPackage }).code, "review-worktree-lifecycle-scope-mismatch");
});

test("outer execution and cleanup pass only request-bound data to host-owned helpers", () => {
  const prepared = prepareReviewWorktreeLifecycle(input, { lifecycleId: "fixture-lifecycle" });
  const view = {
    kind: "detached-review-view-v2",
    repository: "/fixture",
    reviewPath: "/runtime-generated/repository",
    temporaryRoot: "/runtime-generated",
    headCommit: reviewPackage.headCommit,
    lifecycleRequestDigest: prepared.lifecycleRequest.requestDigest,
    ownershipToken: "fixture",
    createdAt: input.now
  };
  let request;
  const created = executeReviewWorktreeLifecycle({
    lifecycleRequest: prepared.lifecycleRequest,
    sourceRequestDigest: input.sourceRequestDigest,
    expected: prepared.lifecycle,
    now: input.now
  }, { createView: (received) => { request = received; return { available: true, status: "available", requestDigest: received.lifecycleRequestDigest, view }; } });
  assert.equal(created.available, true);
  assert.deepEqual(Object.keys(request).sort(), ["expiresAt", "headCommit", "lifecycleRequestDigest", "repositoryPath"]);
  assert.equal(request.repositoryPath, "/fixture");
  assert.equal(request.headCommit, reviewPackage.headCommit);

  let removed = false;
  const cleanup = cleanupReviewWorktreeLifecycle({
    lifecycleRequest: prepared.lifecycleRequest,
    sourceRequestDigest: input.sourceRequestDigest,
    expected: prepared.lifecycle,
    view,
    now: input.now
  }, { removeView: (received) => { removed = received === view; return { removed: true, status: "removed", requestDigest: received.lifecycleRequestDigest }; } });
  assert.equal(removed, true);
  assert.equal(cleanup.removed, true);
});

test("cleanup refuses a view from a different lifecycle request", () => {
  const prepared = prepareReviewWorktreeLifecycle(input, { lifecycleId: "fixture-lifecycle" });
  const cleanup = cleanupReviewWorktreeLifecycle({
    lifecycleRequest: prepared.lifecycleRequest,
    sourceRequestDigest: input.sourceRequestDigest,
    expected: prepared.lifecycle,
    view: { lifecycleRequestDigest: "b".repeat(64) },
    now: input.now
  });
  assert.equal(cleanup.removed, false);
  assert.equal(cleanup.stage, "review-view-cleanup");
  assert.equal(cleanup.error.code, "review-worktree-cleanup-request-mismatch");
});

test("expired lifecycle requests still remove owned views but fail closed", () => {
  const prepared = prepareReviewWorktreeLifecycle(input, { lifecycleId: "fixture-lifecycle" });
  const view = { lifecycleRequestDigest: prepared.lifecycleRequest.requestDigest };
  let removed = false;
  const cleanup = cleanupReviewWorktreeLifecycle({
    lifecycleRequest: prepared.lifecycleRequest,
    sourceRequestDigest: input.sourceRequestDigest,
    expected: prepared.lifecycle,
    view,
    now: "2026-08-14T00:00:00.000Z"
  }, { removeView: () => { removed = true; return { removed: true, status: "removed" }; } });
  assert.equal(removed, true);
  assert.equal(cleanup.removed, true);
  assert.equal(cleanup.status, "unavailable");
  assert.equal(cleanup.error.code, "review-worktree-lifecycle-expired");
});
