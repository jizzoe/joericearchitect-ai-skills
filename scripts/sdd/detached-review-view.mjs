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
    if (!head || head !== headCommit) return fail("independent-review-view-head-not-canonical");
    if (!regularTreeOnly(repository, head)) return fail("independent-review-view-tree-unsafe");
    root = fs.mkdtempSync(path.join(temporaryRoot, "ai-skills-review-archive-"));
    const reviewPath = path.join(root, "repository");
    fs.mkdirSync(reviewPath, { mode: 0o700 });
    const archive = execFileSync("git", ["-C", repository, "archive", "--format=tar", head], { encoding: "buffer", stdio: ["ignore", "pipe", "pipe"], maxBuffer: 128 * 1024 * 1024 });
    execFileSync("tar", ["-xf", "-", "-C", reviewPath], { input: archive, stdio: ["pipe", "ignore", "pipe"], maxBuffer: 128 * 1024 * 1024 });
    const view = Object.freeze({
      kind: "archived-review-view-v1",
      repository,
      reviewPath,
      temporaryRoot: root,
      headCommit: head,
      ownershipToken: randomUUID(),
      createdAt: new Date().toISOString()
    });
    fs.writeFileSync(path.join(root, ".ai-skills-review-view.json"), `${JSON.stringify(view)}\n`, { mode: 0o600, flag: "wx" });
    return { available: true, view };
  } catch {
    if (root && fs.existsSync(root)) {
      try { fs.rmSync(root, { recursive: true, force: true }); } catch { /* preserve the narrow temp path for recovery */ }
    }
    return fail("independent-review-view-create-failed");
  }
}

export function removeArchivedReviewView(view) {
  if (!view || view.kind !== "archived-review-view-v1" || !commit(view.headCommit) ||
      typeof view.temporaryRoot !== "string" || typeof view.reviewPath !== "string" ||
      path.dirname(view.reviewPath) !== view.temporaryRoot ||
      !path.basename(view.temporaryRoot).startsWith("ai-skills-review-archive-")) {
    return { removed: false, code: "independent-review-view-cleanup-unsafe" };
  }
  try {
    const marker = JSON.parse(fs.readFileSync(path.join(view.temporaryRoot, ".ai-skills-review-view.json"), "utf8"));
    if (marker.ownershipToken !== view.ownershipToken || marker.reviewPath !== view.reviewPath) {
      return { removed: false, code: "independent-review-view-cleanup-ownership-mismatch" };
    }
    fs.rmSync(view.temporaryRoot, { recursive: true, force: false });
    return { removed: true };
  } catch {
    return { removed: false, code: "independent-review-view-cleanup-failed" };
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
