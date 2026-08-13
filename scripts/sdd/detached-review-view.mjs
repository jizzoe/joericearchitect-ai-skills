import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const commit = (value) => typeof value === "string" && /^[0-9a-f]{40}$/.test(value);
const fail = (code, detail) => ({ available: false, code, ...(detail ? { detail } : {}) });
const runGit = (args) => execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();

function canonicalRepository(repositoryPath) {
  return fs.realpathSync(repositoryPath);
}

function canonicalCommit(repositoryPath, value) {
  const resolved = runGit(["-C", repositoryPath, "rev-parse", "--verify", `${value}^{commit}`]);
  return commit(resolved) ? resolved : null;
}

function isDetached(repositoryPath) {
  try {
    runGit(["-C", repositoryPath, "symbolic-ref", "--quiet", "--short", "HEAD"]);
    return false;
  } catch {
    return true;
  }
}

/**
 * Creates an exact-head worktree outside the implementation workspace. Runtime
 * adapters must still enforce read-only access; this helper never treats a
 * filesystem permission bit as a security boundary.
 */
export function createDetachedReviewView({ repositoryPath, headCommit, temporaryRoot = os.tmpdir() }) {
  let root;
  let repository;
  let reviewPath;
  try {
    repository = canonicalRepository(repositoryPath);
    const head = canonicalCommit(repository, headCommit);
    if (!head || head !== headCommit) return fail("independent-review-view-head-not-canonical");
    root = fs.mkdtempSync(path.join(temporaryRoot, "ai-skills-review-"));
    reviewPath = path.join(root, "repository");
    runGit(["-C", repository, "worktree", "add", "--detach", reviewPath, head]);
    const actualHead = canonicalCommit(reviewPath, "HEAD");
    if (actualHead !== head || !isDetached(reviewPath)) {
      runGit(["-C", repository, "worktree", "remove", "--force", reviewPath]);
      return fail("independent-review-view-not-detached");
    }
    const view = Object.freeze({
      kind: "detached-review-view-v1",
      repository,
      reviewPath,
      temporaryRoot: root,
      headCommit: head,
      ownershipToken: randomUUID(),
      createdAt: new Date().toISOString()
    });
    fs.writeFileSync(path.join(root, ".ai-skills-review-view.json"), `${JSON.stringify(view)}\n`, { mode: 0o600 });
    return { available: true, view };
  } catch {
    if (repository && reviewPath && fs.existsSync(reviewPath)) {
      try { runGit(["-C", repository, "worktree", "remove", "--force", reviewPath]); } catch { /* preserve the narrow temp path for recovery */ }
    }
    if (root && fs.existsSync(root)) {
      try { fs.rmSync(root, { recursive: true, force: true }); } catch { /* safe recovery retains a temp path */ }
    }
    return fail("independent-review-view-create-failed");
  }
}

/** Remove only a view created under this process's disposable review prefix. */
export function removeDetachedReviewView(view) {
  if (!view || view.kind !== "detached-review-view-v1" || !commit(view.headCommit) ||
      typeof view.temporaryRoot !== "string" || typeof view.reviewPath !== "string" ||
      path.dirname(view.reviewPath) !== view.temporaryRoot ||
      !path.basename(view.temporaryRoot).startsWith("ai-skills-review-")) {
    return { removed: false, code: "independent-review-view-cleanup-unsafe" };
  }
  try {
    const marker = JSON.parse(fs.readFileSync(path.join(view.temporaryRoot, ".ai-skills-review-view.json"), "utf8"));
    if (marker.ownershipToken !== view.ownershipToken || marker.reviewPath !== view.reviewPath) {
      return { removed: false, code: "independent-review-view-cleanup-ownership-mismatch" };
    }
    runGit(["-C", view.repository, "worktree", "remove", "--force", view.reviewPath]);
    fs.rmSync(view.temporaryRoot, { recursive: true, force: false });
    return { removed: true };
  } catch {
    return { removed: false, code: "independent-review-view-cleanup-failed" };
  }
}

export function withDetachedReviewView(options, callback) {
  const created = createDetachedReviewView(options);
  if (!created.available) return created;
  try {
    return callback(created.view);
  } finally {
    removeDetachedReviewView(created.view);
  }
}
