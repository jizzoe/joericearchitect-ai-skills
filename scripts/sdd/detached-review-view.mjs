import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { createReviewDiagnostic, diagnosticFromError } from "./review-diagnostics.mjs";

const commit = (value) => typeof value === "string" && /^[0-9a-f]{40}$/.test(value);
const digest = (value) => typeof value === "string" && /^[0-9a-f]{64}$/.test(value);
const date = (value) => Number.isFinite(Date.parse(value));
const worktreeOperation = "create-detached-worktree";
const cleanupOperation = "remove-detached-worktree";
const fail = (code, detail) => ({ available: false, code, ...(detail ? { detail } : {}) });
const runGitDefault = (args) => execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();

function unavailable({ requestDigest, stage, operation, code, category, subject, exitCode, safeMessage }) {
  const diagnostic = createReviewDiagnostic({ stage, operation, code, category, subject, ...(Number.isInteger(exitCode) ? { exitCode } : {}), safeMessage });
  return {
    available: false,
    status: "unavailable",
    requestDigest,
    code,
    diagnostic
  };
}

function gitFailure(error, { requestDigest, stage, operation, fallbackCode, fallbackSubject, fallbackMessage }) {
  const permissionDenied = error?.code === "EACCES" || error?.code === "EPERM";
  const diagnostic = diagnosticFromError({
    stage, operation, code: fallbackCode, subject: permissionDenied ? "source-git-metadata" : fallbackSubject,
    error, exitCode: Number.isInteger(error?.status) ? error.status : undefined,
    safeMessage: permissionDenied ? "The review worktree could not be registered in the source repository." : fallbackMessage
  });
  return { available: false, status: "unavailable", requestDigest, code: diagnostic.code, diagnostic };
}

function canonicalRepository(repositoryPath) {
  return fs.realpathSync(repositoryPath);
}

function canonicalCommit(repositoryPath, value, runGit = runGitDefault) {
  const resolved = runGit(["-C", repositoryPath, "rev-parse", "--verify", `${value}^{commit}`]);
  return commit(resolved) ? resolved : null;
}

function isDetached(repositoryPath, runGit = runGitDefault) {
  try {
    runGit(["-C", repositoryPath, "symbolic-ref", "--quiet", "--short", "HEAD"]);
    return false;
  } catch {
    return true;
  }
}

function validLifecycleInput({ repositoryPath, headCommit, lifecycleRequestDigest, expiresAt }, now) {
  return typeof repositoryPath === "string" && path.isAbsolute(repositoryPath) && commit(headCommit) &&
    digest(lifecycleRequestDigest) && date(expiresAt) && Date.parse(expiresAt) > Date.parse(now);
}

function ownedMarkerPath(temporaryRoot) {
  return path.join(temporaryRoot, ".ai-skills-review-view.json");
}

function partialCleanupFailure(error, requestDigest) {
  const diagnostic = createReviewDiagnostic({
    stage: "review-view-cleanup",
    operation: cleanupOperation,
    code: "review-worktree-partial-cleanup-failed",
    category: "cleanup-failed",
    subject: "review-worktree",
    ...(Number.isInteger(error?.status) ? { exitCode: error.status } : {}),
    safeMessage: "The partially created review worktree could not be safely removed."
  });
  return {
    removed: false,
    available: false,
    status: "unavailable",
    requestDigest,
    code: diagnostic.code,
    diagnostic
  };
}

function cleanupOwnedPath({ repository, reviewPath, temporaryRoot, requestDigest }, runGit) {
  if (repository && reviewPath && fs.existsSync(reviewPath)) {
    try {
      runGit(["-C", repository, "worktree", "remove", "--force", reviewPath]);
    } catch (error) {
      // Preserve the owned root for a separately authenticated recovery path.
      // Removing it after Git cleanup failed would discard the only remaining
      // local evidence while leaving source metadata potentially registered.
      return partialCleanupFailure(error, requestDigest);
    }
  }
  if (temporaryRoot && fs.existsSync(temporaryRoot)) {
    try {
      fs.rmSync(temporaryRoot, { recursive: true, force: true });
    } catch (error) {
      return partialCleanupFailure(error, requestDigest);
    }
  }
  return { removed: true };
}

function archiveUnavailable(code, category, subject, safeMessage) {
  const diagnostic = createReviewDiagnostic({ stage: "view-construction", operation: "archive-review-view", code, category, subject, safeMessage });
  return { available: false, status: "unavailable", code, diagnostic };
}

function archiveFailure(error, code, subject, safeMessage) {
  const diagnostic = diagnosticFromError({ stage: "view-construction", operation: "archive-review-view", code, subject, safeMessage, error, exitCode: Number.isInteger(error?.status) ? error.status : undefined });
  return { available: false, status: "unavailable", code, diagnostic };
}

function archiveCleanupUnavailable(code, category, subject, safeMessage) {
  const diagnostic = createReviewDiagnostic({ stage: "view-cleanup", operation: "archive-review-view", code, category, subject, safeMessage });
  return { removed: false, code, diagnostic };
}

function regularTreeOnly(repositoryPath, headCommit) {
  try {
    const entries = execFileSync("git", ["-C", repositoryPath, "ls-tree", "-r", "-z", headCommit], { encoding: "buffer", stdio: ["ignore", "pipe", "pipe"] });
    return entries.toString("utf8").split("\0").filter(Boolean).every((entry) => /^(100644|100755) blob [0-9a-f]{40}\t/.test(entry));
  } catch {
    return false;
  }
}

/**
 * Materializes an exact committed tree without registering a worktree or
 * executing repository code. The archive rejects symlinks, submodules, and
 * non-regular entries before extraction so an untrusted tree cannot redirect
 * writes outside the owned temporary root.
 */
export function createArchivedReviewView({ repositoryPath, headCommit, temporaryRoot = os.tmpdir() }) {
  let root;
  try {
    const repository = canonicalRepository(repositoryPath);
    const head = canonicalCommit(repository, headCommit);
    if (!head || head !== headCommit) return archiveUnavailable("independent-review-view-head-not-canonical", "validation-failed", "sealed-head", "The requested review commit is not a canonical commit in the source repository.");
    if (!regularTreeOnly(repository, head)) return archiveUnavailable("independent-review-view-tree-unsafe", "validation-failed", "review-archive", "The requested review archive contains unsupported tree entries.");
    root = fs.mkdtempSync(path.join(temporaryRoot, "ai-skills-review-archive-"));
    // Keep the repository below a neutral launcher directory. Codex and
    // Claude start from launchPath so repository-owned AGENTS.md, skills, and
    // other startup customizations are not discovered before review begins.
    const launchPath = path.join(root, "review-session");
    const reviewPath = path.join(launchPath, "repository");
    fs.mkdirSync(launchPath, { mode: 0o700 });
    fs.mkdirSync(reviewPath, { mode: 0o700 });
    const archive = execFileSync("git", ["-C", repository, "archive", "--format=tar", head], { encoding: "buffer", stdio: ["ignore", "pipe", "pipe"], maxBuffer: 128 * 1024 * 1024 });
    execFileSync("tar", ["-xf", "-", "-C", reviewPath], { input: archive, stdio: ["pipe", "ignore", "pipe"], maxBuffer: 128 * 1024 * 1024 });
    const view = Object.freeze({
      kind: "archived-review-view-v1",
      repository,
      launchPath,
      reviewPath,
      temporaryRoot: root,
      headCommit: head,
      ownershipToken: randomUUID(),
      createdAt: new Date().toISOString()
    });
    fs.writeFileSync(path.join(root, ".ai-skills-review-view.json"), `${JSON.stringify(view)}\n`, { mode: 0o600, flag: "wx" });
    return { available: true, view };
  } catch (error) {
    if (root && fs.existsSync(root)) {
      try { fs.rmSync(root, { recursive: true, force: true }); } catch { /* preserve the narrow temp path for recovery */ }
    }
    return archiveFailure(error, "independent-review-view-create-failed", "review-archive", "The review archive could not be created.");
  }
}

export function removeArchivedReviewView(view) {
  if (!view || view.kind !== "archived-review-view-v1" || !commit(view.headCommit) ||
      typeof view.temporaryRoot !== "string" || typeof view.launchPath !== "string" || typeof view.reviewPath !== "string" ||
      view.launchPath !== path.join(view.temporaryRoot, "review-session") ||
      view.reviewPath !== path.join(view.launchPath, "repository") ||
      !path.basename(view.temporaryRoot).startsWith("ai-skills-review-archive-")) {
    return archiveCleanupUnavailable("independent-review-view-cleanup-unsafe", "ownership-invalid", "review-archive", "The review archive cannot be removed because ownership could not be verified.");
  }
  try {
    const marker = JSON.parse(fs.readFileSync(path.join(view.temporaryRoot, ".ai-skills-review-view.json"), "utf8"));
    if (marker.ownershipToken !== view.ownershipToken || marker.launchPath !== view.launchPath || marker.reviewPath !== view.reviewPath) {
      return archiveCleanupUnavailable("independent-review-view-cleanup-ownership-mismatch", "ownership-invalid", "review-archive", "The review archive cannot be removed because ownership does not match.");
    }
    fs.rmSync(view.temporaryRoot, { recursive: true, force: false });
    return { removed: true };
  } catch (error) {
    return { removed: false, code: "independent-review-view-cleanup-failed", diagnostic: diagnosticFromError({ stage: "view-cleanup", operation: "archive-review-view", code: "independent-review-view-cleanup-failed", subject: "review-archive", safeMessage: "The review archive could not be removed.", error }) };
  }
}

/**
 * Creates an exact-head worktree outside the implementation workspace. Runtime
 * adapters must still enforce read-only access; this helper never treats a
 * filesystem permission bit as a security boundary.
 */
export function createDetachedReviewView({ repositoryPath, headCommit, lifecycleRequestDigest, expiresAt }, {
  now = new Date().toISOString(),
  runGit = runGitDefault,
  createTemporaryRoot = () => fs.mkdtempSync(path.join(os.tmpdir(), "ai-skills-review-")),
  realpath = fs.realpathSync
} = {}) {
  if (!validLifecycleInput({ repositoryPath, headCommit, lifecycleRequestDigest, expiresAt }, now)) {
    return unavailable({ requestDigest: lifecycleRequestDigest, stage: "review-view-construction", operation: worktreeOperation,
      code: "review-worktree-request-invalid", category: "request-invalid", subject: "worktree-lifecycle-request",
      safeMessage: "The requested review worktree lifecycle is not valid." });
  }
  let repository;
  let temporaryRoot;
  let launchPath;
  let reviewPath;
  try {
    repository = realpath(repositoryPath);
    if (repository !== repositoryPath) return unavailable({ requestDigest: lifecycleRequestDigest, stage: "review-view-construction", operation: worktreeOperation,
      code: "review-worktree-repository-not-canonical", category: "validation-failed", subject: "source-repository",
      safeMessage: "The requested review repository is not canonical." });
    const head = canonicalCommit(repository, headCommit, runGit);
    if (!head || head !== headCommit) return unavailable({ requestDigest: lifecycleRequestDigest, stage: "review-view-construction", operation: worktreeOperation,
      code: "review-worktree-head-not-canonical", category: "validation-failed", subject: "sealed-head",
      safeMessage: "The requested review commit is not a canonical commit in the source repository." });
    temporaryRoot = createTemporaryRoot();
    if (!path.isAbsolute(temporaryRoot) || !path.basename(temporaryRoot).startsWith("ai-skills-review-")) {
      return unavailable({ requestDigest: lifecycleRequestDigest, stage: "review-view-construction", operation: worktreeOperation,
        code: "review-worktree-temporary-root-invalid", category: "validation-failed", subject: "temporary-root",
        safeMessage: "The review worktree temporary location is not valid." });
    }
    launchPath = path.join(temporaryRoot, "review-session");
    reviewPath = path.join(launchPath, "repository");
    fs.mkdirSync(launchPath, { mode: 0o700 });
    try {
      runGit(["-C", repository, "worktree", "add", "--detach", reviewPath, head]);
    } catch (error) {
      const cleanup = cleanupOwnedPath({ repository, reviewPath, temporaryRoot, requestDigest: lifecycleRequestDigest }, runGit);
      if (!cleanup.removed) return cleanup;
      return gitFailure(error, { requestDigest: lifecycleRequestDigest, stage: "review-view-construction", operation: worktreeOperation,
        fallbackCode: "review-worktree-create-failed", fallbackSubject: "worktree-creation",
        fallbackMessage: "The review worktree could not be created." });
    }
    let actualHead;
    let detached;
    try {
      actualHead = canonicalCommit(reviewPath, "HEAD", runGit);
      detached = isDetached(reviewPath, runGit);
    } catch (error) {
      const cleanup = cleanupOwnedPath({ repository, reviewPath, temporaryRoot, requestDigest: lifecycleRequestDigest }, runGit);
      if (!cleanup.removed) return cleanup;
      return gitFailure(error, { requestDigest: lifecycleRequestDigest, stage: "review-view-verification", operation: worktreeOperation,
        fallbackCode: "review-worktree-verification-failed", fallbackSubject: "review-worktree",
        fallbackMessage: "The created review worktree could not be verified." });
    }
    if (actualHead !== head || !detached) {
      const cleanup = cleanupOwnedPath({ repository, reviewPath, temporaryRoot, requestDigest: lifecycleRequestDigest }, runGit);
      if (!cleanup.removed) return cleanup;
      return unavailable({ requestDigest: lifecycleRequestDigest, stage: "review-view-verification", operation: worktreeOperation,
        code: "review-worktree-verification-mismatch", category: "verification-failed", subject: "sealed-head",
        safeMessage: "The created review worktree does not match the sealed detached commit." });
    }
    const view = Object.freeze({ kind: "detached-review-view-v2", repository, launchPath, reviewPath, temporaryRoot, headCommit: head,
      lifecycleRequestDigest, ownershipToken: randomUUID(), createdAt: new Date(now).toISOString() });
    fs.writeFileSync(ownedMarkerPath(temporaryRoot), `${JSON.stringify(view)}\n`, { mode: 0o600, flag: "wx" });
    return { available: true, status: "available", requestDigest: lifecycleRequestDigest, view };
  } catch (error) {
    const cleanup = cleanupOwnedPath({ repository, reviewPath, temporaryRoot, requestDigest: lifecycleRequestDigest }, runGit);
    if (!cleanup.removed) return cleanup;
    return gitFailure(error, { requestDigest: lifecycleRequestDigest, stage: "review-view-construction", operation: worktreeOperation,
      fallbackCode: "review-worktree-create-failed", fallbackSubject: "worktree-creation",
      fallbackMessage: "The review worktree could not be created." });
  }
}

/** Remove only a worktree that remains bound to this lifecycle request. */
export function removeDetachedReviewView(view, { now = new Date().toISOString(), runGit = runGitDefault } = {}) {
  const requestDigest = view?.lifecycleRequestDigest;
  if (!view || view.kind !== "detached-review-view-v2" || !commit(view.headCommit) || !digest(requestDigest) ||
      typeof view.temporaryRoot !== "string" || typeof view.launchPath !== "string" || typeof view.reviewPath !== "string" ||
      view.launchPath !== path.join(view.temporaryRoot, "review-session") ||
      view.reviewPath !== path.join(view.launchPath, "repository") || !path.basename(view.temporaryRoot).startsWith("ai-skills-review-")) {
    return { removed: false, ...unavailable({ requestDigest, stage: "review-view-cleanup", operation: cleanupOperation,
      code: "review-worktree-cleanup-unsafe", category: "ownership-invalid", subject: "review-worktree",
      safeMessage: "The review worktree cannot be removed because ownership could not be verified." }) };
  }
  try {
    const marker = JSON.parse(fs.readFileSync(ownedMarkerPath(view.temporaryRoot), "utf8"));
    if (marker.ownershipToken !== view.ownershipToken || marker.launchPath !== view.launchPath || marker.reviewPath !== view.reviewPath || marker.repository !== view.repository ||
        marker.headCommit !== view.headCommit || marker.lifecycleRequestDigest !== requestDigest || marker.createdAt !== view.createdAt) {
      return { removed: false, ...unavailable({ requestDigest, stage: "review-view-cleanup", operation: cleanupOperation,
        code: "review-worktree-cleanup-ownership-mismatch", category: "ownership-invalid", subject: "review-worktree",
        safeMessage: "The review worktree cannot be removed because ownership does not match the lifecycle request." }) };
    }
    if (!date(now)) throw new Error("invalid cleanup clock");
    runGit(["-C", view.repository, "worktree", "remove", "--force", view.reviewPath]);
    fs.rmSync(view.temporaryRoot, { recursive: true, force: false });
    return { removed: true, status: "removed", requestDigest };
  } catch (error) {
    return { removed: false, ...gitFailure(error, { requestDigest, stage: "review-view-cleanup", operation: cleanupOperation,
      fallbackCode: "review-worktree-cleanup-failed", fallbackSubject: "review-worktree",
      fallbackMessage: "The review worktree could not be removed." }) };
  }
}

export function withDetachedReviewView(request, callback, options) {
  const created = createDetachedReviewView(request, options);
  if (!created.available) return created;
  let callbackResult;
  let callbackError;
  try {
    callbackResult = callback(created.view);
  } catch (error) {
    callbackError = error;
  }
  const cleanup = removeDetachedReviewView(created.view, options);
  if (cleanup?.removed !== true) return cleanup;
  if (callbackError) throw callbackError;
  return callbackResult;
}
