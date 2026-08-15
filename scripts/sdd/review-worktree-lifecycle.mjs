import { createHash, randomUUID } from "node:crypto";

import { canonicalJson, validateReviewPackage } from "./independent-review-contract.mjs";
import { createDetachedReviewView, removeDetachedReviewView } from "./detached-review-view.mjs";

export const detachedWorktreeOperation = "create-detached-review-worktree-v1";
const schemaVersion = 1;
const commit = (value) => typeof value === "string" && /^[0-9a-f]{40}$/.test(value);
const digest = (value) => typeof value === "string" && /^[0-9a-f]{64}$/.test(value);
const text = (value) => typeof value === "string" && value.trim().length > 0;
const fail = (code, detail) => ({ allowed: false, status: "unavailable", code, ...(detail ? { detail } : {}) });

function lifecycleDigest({ schemaVersion: version, lifecycleId, request } = {}) {
  if (version !== schemaVersion || !text(lifecycleId) || !request) return null;
  return createHash("sha256").update(canonicalJson({ schemaVersion: version, lifecycleId, request })).digest("hex");
}

export function reviewWorktreeLifecycleRequestDigest(value) {
  return lifecycleDigest(value);
}

function validRecord(record, { selectedEntry, transition, reviewPackage, authorization, repositoryPath, now }) {
  if (record?.enabled !== true || record.operation !== detachedWorktreeOperation ||
      record.change !== selectedEntry || !Array.isArray(record.transitions) || !record.transitions.includes(transition) ||
      !text(record.repositoryPath) || record.repositoryPath !== repositoryPath ||
      record.baseCommit !== reviewPackage.baseCommit || record.headCommit !== reviewPackage.headCommit ||
      record.manifestDigest !== reviewPackage.manifestDigest) {
    return "review-worktree-lifecycle-scope-mismatch";
  }
  const expiresAt = Date.parse(record.expiresAt);
  const goalExpiresAt = Date.parse(authorization?.expiresAt ?? authorization?.stoppingConditions?.expiresAt);
  const current = Date.parse(now);
  if (Number.isNaN(expiresAt) || Number.isNaN(current) || expiresAt <= current) return "review-worktree-lifecycle-expired";
  if (Number.isNaN(goalExpiresAt) || expiresAt > goalExpiresAt) return "review-worktree-lifecycle-expiration-exceeds-goal";
  return null;
}

/** Validate the authorization record before any host lifecycle request exists. */
export function validateReviewWorktreeLifecycle({ authorization, selectedEntry, transition = "merge-pr", reviewPackage, repositoryPath, now = new Date().toISOString() } = {}) {
  const packageCheck = validateReviewPackage(reviewPackage);
  if (!packageCheck.valid) return fail(packageCheck.issues[0].code);
  if (!text(repositoryPath) || !commit(reviewPackage.baseCommit) || !commit(reviewPackage.headCommit) || !digest(reviewPackage.manifestDigest)) {
    return fail("review-worktree-lifecycle-input-incomplete");
  }
  const issue = validRecord(authorization?.reviewWorktreeLifecycle, { selectedEntry, transition, reviewPackage, authorization, repositoryPath, now });
  if (issue) return fail(issue);
  return {
    allowed: true,
    status: "ready",
    code: "review-worktree-lifecycle-ready",
    lifecycle: Object.freeze({
      operation: detachedWorktreeOperation,
      selectedEntry,
      transition,
      repositoryPath,
      baseCommit: reviewPackage.baseCommit,
      headCommit: reviewPackage.headCommit,
      manifestDigest: reviewPackage.manifestDigest,
      expiresAt: new Date(Date.parse(authorization.reviewWorktreeLifecycle.expiresAt)).toISOString()
    })
  };
}

/**
 * Prepare a sealed child request. There is deliberately no destination or Git
 * argument in this request: the outer host creates its own temporary root.
 */
export function prepareReviewWorktreeLifecycle(input, { lifecycleId = randomUUID() } = {}) {
  const valid = validateReviewWorktreeLifecycle(input);
  if (!valid.allowed) return valid;
  if (!digest(input.sourceRequestDigest)) return fail("review-worktree-lifecycle-parent-binding-missing");
  const request = {
    operation: detachedWorktreeOperation,
    sourceRequestDigest: input.sourceRequestDigest,
    repositoryPath: valid.lifecycle.repositoryPath,
    baseCommit: valid.lifecycle.baseCommit,
    headCommit: valid.lifecycle.headCommit,
    manifestDigest: valid.lifecycle.manifestDigest,
    expiresAt: valid.lifecycle.expiresAt
  };
  const prepared = { schemaVersion, lifecycleId, request };
  prepared.requestDigest = lifecycleDigest(prepared);
  return { allowed: true, status: "ready", code: "review-worktree-lifecycle-prepared", lifecycleRequest: prepared, lifecycle: valid.lifecycle };
}

export function validatePreparedReviewWorktreeLifecycle({ lifecycleRequest, sourceRequestDigest, expected, now = new Date().toISOString(), allowExpired = false } = {}) {
  const actualDigest = lifecycleDigest(lifecycleRequest);
  const request = lifecycleRequest?.request;
  if (!actualDigest || actualDigest !== lifecycleRequest?.requestDigest) return fail("review-worktree-lifecycle-request-invalid");
  if (!digest(sourceRequestDigest) || request?.sourceRequestDigest !== sourceRequestDigest) return fail("review-worktree-lifecycle-parent-binding-mismatch");
  if (request?.operation !== detachedWorktreeOperation || !text(request.repositoryPath) || !commit(request.baseCommit) ||
      !commit(request.headCommit) || !digest(request.manifestDigest) || Number.isNaN(Date.parse(request.expiresAt))) {
    return fail("review-worktree-lifecycle-request-invalid");
  }
  const expired = Date.parse(request.expiresAt) <= Date.parse(now);
  if (expired && !allowExpired) return fail("review-worktree-lifecycle-expired");
  if (!expected || request.repositoryPath !== expected.repositoryPath || request.baseCommit !== expected.baseCommit ||
      request.headCommit !== expected.headCommit || request.manifestDigest !== expected.manifestDigest ||
      request.expiresAt !== expected.expiresAt) return fail("review-worktree-lifecycle-request-binding-mismatch");
  return { allowed: true, status: expired ? "expired" : "ready", code: expired ? "review-worktree-lifecycle-expired" : "review-worktree-lifecycle-request-valid", lifecycleRequest, expired };
}

/** Execute only an already-bound lifecycle request at the outer host boundary. */
export function executeReviewWorktreeLifecycle({ lifecycleRequest, sourceRequestDigest, expected, now }, { createView = createDetachedReviewView } = {}) {
  const valid = validatePreparedReviewWorktreeLifecycle({ lifecycleRequest, sourceRequestDigest, expected, now });
  if (!valid.allowed) {
    return {
      status: "unavailable",
      requestDigest: lifecycleRequest?.requestDigest,
      stage: "review-view-construction",
      operation: "create-detached-worktree",
      error: {
        code: valid.code,
        category: "request-invalid",
        subject: "worktree-lifecycle-request",
        safeMessage: "The requested review worktree lifecycle is not valid."
      }
    };
  }
  return createView({
    repositoryPath: lifecycleRequest.request.repositoryPath,
    headCommit: lifecycleRequest.request.headCommit,
    lifecycleRequestDigest: lifecycleRequest.requestDigest,
    expiresAt: lifecycleRequest.request.expiresAt
  }, { now });
}

/** Remove only a view tied to the same prepared lifecycle request. */
export function cleanupReviewWorktreeLifecycle({ lifecycleRequest, sourceRequestDigest, expected, view, now }, { removeView = removeDetachedReviewView } = {}) {
  const valid = validatePreparedReviewWorktreeLifecycle({ lifecycleRequest, sourceRequestDigest, expected, now, allowExpired: true });
  if (!valid.allowed) {
    return {
      removed: false,
      status: "unavailable",
      requestDigest: lifecycleRequest?.requestDigest,
      stage: "review-view-cleanup",
      operation: "remove-detached-worktree",
      error: {
        code: valid.code,
        category: "request-invalid",
        subject: "worktree-lifecycle-request",
        safeMessage: "The review worktree lifecycle is no longer valid for cleanup."
      }
    };
  }
  if (view?.lifecycleRequestDigest !== lifecycleRequest.requestDigest) {
    return {
      removed: false,
      status: "unavailable",
      requestDigest: lifecycleRequest.requestDigest,
      stage: "review-view-cleanup",
      operation: "remove-detached-worktree",
      error: {
        code: "review-worktree-cleanup-request-mismatch",
        category: "ownership-invalid",
        subject: "review-worktree",
        safeMessage: "The review worktree does not match the lifecycle request."
      }
    };
  }
  const cleanup = removeView(view, { now });
  if (cleanup?.removed !== true || !valid.expired) return cleanup;
  return {
    ...cleanup,
    status: "unavailable",
    requestDigest: lifecycleRequest.requestDigest,
    stage: "review-view-cleanup",
    operation: "remove-detached-worktree",
    error: {
      code: "review-worktree-lifecycle-expired",
      category: "request-expired",
      subject: "worktree-lifecycle-request",
      safeMessage: "The review worktree was removed after its lifecycle request expired."
    }
  };
}
