import { createHash } from "node:crypto";

import { canonicalJson, validateReviewPackage } from "./independent-review-contract.mjs";
import { resolveReviewAdapterDispatch } from "./review-adapter-dispatch.mjs";
import { detachedWorktreeOperation, reviewWorktreeLifecycleRequestDigest } from "./review-worktree-lifecycle.mjs";

export const bootstrapReviewBindingSchemaVersion = 1;
export const bootstrapReviewBindingKind = "independent-review-bootstrap-binding";

const exactKeys = (value, expected) => value && typeof value === "object" && !Array.isArray(value) &&
  Object.keys(value).sort().join("\0") === [...expected].sort().join("\0");
const text = (value, maximum = 512) => typeof value === "string" && value.length > 0 && value.length <= maximum && !/[\r\n\0]/.test(value);
const digest = (value) => typeof value === "string" && /^[0-9a-f]{64}$/.test(value);
const commit = (value) => typeof value === "string" && /^[0-9a-f]{40}$/.test(value);
const repository = (value) => typeof value === "string" && /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(value);
const timestamp = (value) => {
  if (typeof value !== "string") return false;
  const parsed = Date.parse(value);
  return !Number.isNaN(parsed) && new Date(parsed).toISOString() === value;
};
const fail = (code) => ({ valid: false, code });
const deepFreeze = (value) => {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const nested of Object.values(value)) deepFreeze(nested);
  return Object.freeze(value);
};

export function bootstrapReviewBindingDigest(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const unsigned = structuredClone(value);
  delete unsigned.bindingDigest;
  return createHash("sha256").update(canonicalJson(unsigned)).digest("hex");
}

export function buildBootstrapReviewBinding({
  bindingId,
  change,
  transition,
  repositoryId,
  reviewPackage,
  expiresAt,
  ownerAuthorization,
  installedRuntime,
  launcher,
  implementerIdentity,
  reviewer,
  worktreeLifecycle
} = {}) {
  const adapter = resolveReviewAdapterDispatch({
    schemaVersion: 1,
    sources: ["owner-authorized-bootstrap-binding"],
    values: { reviewAdapter: "claude-detached-restricted-v1" }
  });
  const value = {
    schemaVersion: bootstrapReviewBindingSchemaVersion,
    kind: bootstrapReviewBindingKind,
    bindingId,
    change,
    transition,
    repositoryId,
    baseCommit: reviewPackage?.baseCommit,
    headCommit: reviewPackage?.headCommit,
    manifestDigest: reviewPackage?.manifestDigest,
    expiresAt,
    ownerAuthorization: {
      reference: ownerAuthorization?.reference,
      scopeDigest: ownerAuthorization?.scopeDigest
    },
    reviewAdapter: adapter.binding.reviewAdapter,
    reviewPolicy: "strict-first-degraded",
    adapterBindingDigest: adapter.binding.bindingDigest,
    installedRuntime: {
      generation: installedRuntime?.generation,
      digest: installedRuntime?.digest,
      sourceRevision: installedRuntime?.sourceRevision,
      helper: installedRuntime?.helper
    },
    launcher: {
      kind: launcher?.kind,
      executableName: launcher?.executableName,
      executableSha256: launcher?.executableSha256,
      boundary: launcher?.boundary,
      capabilityProbeRef: launcher?.capabilityProbeRef
    },
    implementerIdentity,
    reviewer: {
      type: reviewer?.type,
      identity: reviewer?.identity,
      adapter: reviewer?.adapter,
      attestationRef: reviewer?.attestationRef
    },
    worktreeLifecycle: {
      operation: worktreeLifecycle?.lifecycleRequest?.request?.operation,
      lifecycleId: worktreeLifecycle?.lifecycleRequest?.lifecycleId,
      requestDigest: worktreeLifecycle?.lifecycleRequest?.requestDigest,
      sourceRequestDigest: worktreeLifecycle?.lifecycleRequest?.request?.sourceRequestDigest,
      exactOwned: worktreeLifecycle?.exactOwned,
      cleanupRequired: worktreeLifecycle?.cleanupRequired
    },
    candidateCodexCaptureExcluded: true
  };
  return deepFreeze({ ...value, bindingDigest: bootstrapReviewBindingDigest(value) });
}

export function validateBootstrapReviewBinding(binding, {
  expectedChange,
  expectedTransition,
  expectedRepositoryId,
  reviewPackage,
  installedRuntime,
  launcher,
  implementerIdentity,
  reviewer,
  ownerAuthorization,
  worktreeLifecycle,
  authorizationExpiresAt,
  now = new Date().toISOString()
} = {}) {
  if (!exactKeys(binding, [
    "schemaVersion", "kind", "bindingId", "change", "transition", "repositoryId", "baseCommit", "headCommit",
    "manifestDigest", "expiresAt", "ownerAuthorization", "reviewAdapter", "reviewPolicy", "adapterBindingDigest",
    "installedRuntime", "launcher", "implementerIdentity", "reviewer", "worktreeLifecycle",
    "candidateCodexCaptureExcluded", "bindingDigest"
  ]) || binding.schemaVersion !== bootstrapReviewBindingSchemaVersion || binding.kind !== bootstrapReviewBindingKind) {
    return fail("bootstrap-review-binding-invalid");
  }
  if (!text(binding.bindingId) || !text(binding.change) || !text(binding.transition) || !repository(binding.repositoryId) ||
      !commit(binding.baseCommit) || !commit(binding.headCommit) || !digest(binding.manifestDigest) ||
      !timestamp(binding.expiresAt) || !text(binding.implementerIdentity) || !digest(binding.bindingDigest) ||
      bootstrapReviewBindingDigest(binding) !== binding.bindingDigest) {
    return fail("bootstrap-review-binding-invalid");
  }
  if (!exactKeys(binding.ownerAuthorization, ["reference", "scopeDigest"]) ||
      !text(binding.ownerAuthorization.reference) || !digest(binding.ownerAuthorization.scopeDigest) ||
      binding.ownerAuthorization.reference !== ownerAuthorization?.reference ||
      binding.ownerAuthorization.scopeDigest !== ownerAuthorization?.scopeDigest) {
    return fail("bootstrap-review-authorization-mismatch");
  }
  const packageValidation = validateReviewPackage(reviewPackage);
  if (!packageValidation.valid || binding.baseCommit !== reviewPackage.baseCommit ||
      binding.headCommit !== reviewPackage.headCommit || binding.manifestDigest !== reviewPackage.manifestDigest) {
    return fail("bootstrap-review-package-mismatch");
  }
  if (binding.change !== expectedChange || binding.transition !== expectedTransition ||
      binding.repositoryId !== expectedRepositoryId || binding.implementerIdentity !== implementerIdentity) {
    return fail("bootstrap-review-scope-mismatch");
  }
  const expires = Date.parse(binding.expiresAt);
  const authorizationExpires = Date.parse(authorizationExpiresAt);
  const current = Date.parse(now);
  if (Number.isNaN(expires) || Number.isNaN(authorizationExpires) || Number.isNaN(current) ||
      expires <= current || expires > authorizationExpires) {
    return fail("bootstrap-review-binding-expired");
  }
  const adapter = resolveReviewAdapterDispatch({
    schemaVersion: 1,
    sources: ["owner-authorized-bootstrap-binding"],
    values: { reviewAdapter: binding.reviewAdapter }
  });
  if (!adapter.valid || binding.reviewAdapter !== "claude-detached-restricted-v1" ||
      binding.reviewPolicy !== "strict-first-degraded" ||
      binding.adapterBindingDigest !== adapter.binding.bindingDigest) {
    return fail("bootstrap-review-adapter-mismatch");
  }
  if (!exactKeys(binding.installedRuntime, ["generation", "digest", "sourceRevision", "helper"]) ||
      !text(binding.installedRuntime.generation) || !digest(binding.installedRuntime.digest) ||
      !commit(binding.installedRuntime.sourceRevision) ||
      binding.installedRuntime.helper !== adapter.binding.runtimeHelper ||
      binding.installedRuntime.generation !== installedRuntime?.generation ||
      binding.installedRuntime.digest !== installedRuntime?.digest ||
      binding.installedRuntime.sourceRevision !== installedRuntime?.sourceRevision ||
      binding.installedRuntime.helper !== installedRuntime?.helper) {
    return fail("bootstrap-review-runtime-mismatch");
  }
  if (!exactKeys(binding.launcher, ["kind", "executableName", "executableSha256", "boundary", "capabilityProbeRef"]) ||
      binding.launcher.kind !== adapter.binding.launcherKind ||
      !["claude", "claude.exe"].includes(binding.launcher.executableName) ||
      !digest(binding.launcher.executableSha256) ||
      binding.launcher.boundary !== adapter.binding.launcherBoundary ||
      !text(binding.launcher.capabilityProbeRef) ||
      canonicalJson(binding.launcher) !== canonicalJson(launcher)) {
    return fail("bootstrap-review-launcher-mismatch");
  }
  if (!exactKeys(binding.reviewer, ["type", "identity", "adapter", "attestationRef"]) ||
      !text(binding.reviewer.type) || !binding.reviewer.type.startsWith("claude") || !text(binding.reviewer.identity) ||
      binding.reviewer.identity === binding.implementerIdentity ||
      binding.reviewer.adapter !== adapter.binding.resultAdapter || !text(binding.reviewer.attestationRef) ||
      binding.reviewer.type !== reviewer?.type || binding.reviewer.identity !== reviewer?.identity ||
      binding.reviewer.adapter !== reviewer?.adapter || binding.reviewer.attestationRef !== reviewer?.attestationRef) {
    return fail("bootstrap-review-reviewer-mismatch");
  }
  const lifecycleRequest = worktreeLifecycle?.lifecycleRequest;
  const lifecyclePayload = lifecycleRequest?.request;
  if (!exactKeys(lifecycleRequest, ["schemaVersion", "lifecycleId", "request", "requestDigest"]) ||
      !exactKeys(lifecyclePayload, ["operation", "sourceRequestDigest", "repositoryPath", "baseCommit", "headCommit", "manifestDigest", "expiresAt"]) ||
      reviewWorktreeLifecycleRequestDigest(lifecycleRequest) !== lifecycleRequest.requestDigest ||
      lifecyclePayload.baseCommit !== binding.baseCommit || lifecyclePayload.headCommit !== binding.headCommit ||
      lifecyclePayload.manifestDigest !== binding.manifestDigest || lifecyclePayload.expiresAt !== binding.expiresAt ||
      !exactKeys(binding.worktreeLifecycle, ["operation", "lifecycleId", "requestDigest", "sourceRequestDigest", "exactOwned", "cleanupRequired"]) ||
      binding.worktreeLifecycle.operation !== detachedWorktreeOperation ||
      !text(binding.worktreeLifecycle.lifecycleId) || !digest(binding.worktreeLifecycle.requestDigest) ||
      !digest(binding.worktreeLifecycle.sourceRequestDigest) || binding.worktreeLifecycle.exactOwned !== true ||
      binding.worktreeLifecycle.cleanupRequired !== true ||
      binding.worktreeLifecycle.operation !== lifecyclePayload?.operation ||
      binding.worktreeLifecycle.lifecycleId !== lifecycleRequest?.lifecycleId ||
      binding.worktreeLifecycle.requestDigest !== lifecycleRequest?.requestDigest ||
      binding.worktreeLifecycle.sourceRequestDigest !== lifecyclePayload?.sourceRequestDigest) {
    return fail("bootstrap-review-worktree-lifecycle-mismatch");
  }
  if (binding.candidateCodexCaptureExcluded !== true) return fail("bootstrap-review-self-certification-denied");
  return { valid: true, code: "bootstrap-review-binding-valid", bindingDigest: binding.bindingDigest };
}
