import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { createArchivedReviewView, createDetachedReviewView, removeArchivedReviewView, removeDetachedReviewView, withDetachedReviewView } from "../detached-review-view.mjs";
import { probeIndependentReviewAdapter } from "../execute-independent-review.mjs";

const git = (root, args) => execFileSync("git", ["-C", root, ...args], { encoding: "utf8" }).trim();
const denials = { workspaceWrite: true, gitWrite: true, githubMutation: true, credentialAccess: true, authenticatedNetwork: true, externalSend: true, deployment: true, release: true, delegatedMutation: true };

test("detached review view is pinned to committed state and cleanup is ownership guarded", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ai-skills-review-source-"));
  try {
    git(root, ["init"]);
    git(root, ["config", "user.email", "review@example.invalid"]);
    git(root, ["config", "user.name", "Review Fixture"]);
    fs.writeFileSync(path.join(root, "tracked.txt"), "committed\n");
    git(root, ["add", "tracked.txt"]); git(root, ["commit", "-m", "fixture"]);
    const head = git(root, ["rev-parse", "HEAD"]);
    fs.writeFileSync(path.join(root, "unrelated.txt"), "dirty\n");
    const request = { repositoryPath: fs.realpathSync(root), headCommit: head, lifecycleRequestDigest: "a".repeat(64), expiresAt: "2026-08-14T00:00:00.000Z" };
    const created = createDetachedReviewView(request, { now: "2026-08-13T12:00:00.000Z" });
    assert.equal(created.available, true);
    assert.equal(created.view.launchPath, path.join(created.view.temporaryRoot, "review-session"));
    assert.equal(created.view.reviewPath, path.join(created.view.launchPath, "repository"));
    assert.equal(git(created.view.reviewPath, ["rev-parse", "HEAD"]), head);
    assert.equal(fs.existsSync(path.join(created.view.reviewPath, "unrelated.txt")), false);
    assert.throws(() => git(created.view.reviewPath, ["symbolic-ref", "--quiet", "--short", "HEAD"]));
    assert.equal(removeDetachedReviewView({ ...created.view, ownershipToken: "wrong" }, { now: "2026-08-13T12:00:00.000Z" }).removed, false);
    assert.equal(removeDetachedReviewView(created.view, { now: "2026-08-13T12:00:00.000Z" }).removed, true);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("partial worktree cleanup failure is reported and preserves the owned root", () => {
  const source = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "ai-skills-review-partial-source-")));
  const temporaryRoot = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "ai-skills-review-partial-")));
  const head = "a".repeat(40);
  const requestDigest = "b".repeat(64);
  const reviewPath = path.join(temporaryRoot, "review-session", "repository");
  let cleanupAttempted = false;
  try {
    const result = createDetachedReviewView({
      repositoryPath: source,
      headCommit: head,
      lifecycleRequestDigest: requestDigest,
      expiresAt: "2026-08-14T00:00:00.000Z"
    }, {
      now: "2026-08-13T12:00:00.000Z",
      createTemporaryRoot: () => temporaryRoot,
      runGit: (args) => {
        if (args.includes("rev-parse")) return head;
        if (args.includes("add")) {
          fs.mkdirSync(reviewPath, { recursive: true });
          const error = new Error("synthetic create failure");
          error.status = 128;
          throw error;
        }
        if (args.includes("remove")) {
          cleanupAttempted = true;
          const error = new Error("synthetic cleanup failure");
          error.status = 128;
          throw error;
        }
        throw new Error("unexpected git operation");
      }
    });
    assert.equal(cleanupAttempted, true);
    assert.equal(result.available, false);
    assert.equal(result.removed, false);
    assert.equal(result.status, "unavailable");
    assert.equal(result.requestDigest, requestDigest);
    assert.equal(result.diagnostic.stage, "review-view-cleanup");
    assert.equal(result.diagnostic.code, "review-worktree-partial-cleanup-failed");
    assert.equal(result.diagnostic.category, "cleanup-failed");
    assert.equal(result.diagnostic.exitCode, 128);
    assert.equal(fs.existsSync(temporaryRoot), true, "failed Git cleanup preserves the owned root for recovery");
  } finally {
    fs.rmSync(source, { recursive: true, force: true });
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
});

test("withDetachedReviewView never masks a failed owned cleanup", () => {
  const source = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "ai-skills-review-wrapper-source-")));
  const temporaryRoot = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "ai-skills-review-wrapper-")));
  const head = "c".repeat(40);
  const requestDigest = "d".repeat(64);
  const reviewPath = path.join(temporaryRoot, "review-session", "repository");
  try {
    const result = withDetachedReviewView({
      repositoryPath: source,
      headCommit: head,
      lifecycleRequestDigest: requestDigest,
      expiresAt: "2026-08-14T00:00:00.000Z"
    }, () => ({ status: "passed" }), {
      now: "2026-08-13T12:00:00.000Z",
      createTemporaryRoot: () => temporaryRoot,
      runGit: (args) => {
        if (args.includes("rev-parse")) return head;
        if (args.includes("symbolic-ref")) throw new Error("detached");
        if (args.includes("add")) {
          fs.mkdirSync(reviewPath, { recursive: true });
          return "";
        }
        if (args.includes("remove")) {
          const error = new Error("synthetic cleanup failure");
          error.status = 128;
          throw error;
        }
        throw new Error("unexpected git operation");
      }
    });
    assert.equal(result.status, "unavailable");
    assert.equal(result.removed, false);
    assert.equal(result.code, "review-worktree-cleanup-failed");
    assert.equal(fs.existsSync(temporaryRoot), true, "cleanup failure preserves the owned root for recovery");
  } finally {
    fs.rmSync(source, { recursive: true, force: true });
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
});

test("archived review view materializes only regular exact-head content without Git metadata", (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ai-skills-review-archive-source-"));
  try {
    git(root, ["init"]);
    git(root, ["config", "user.email", "review@example.invalid"]);
    git(root, ["config", "user.name", "Review Fixture"]);
    fs.writeFileSync(path.join(root, "tracked.txt"), "committed\n");
    git(root, ["add", "tracked.txt"]); git(root, ["commit", "-m", "fixture"]);
    const head = git(root, ["rev-parse", "HEAD"]);
    fs.writeFileSync(path.join(root, "unrelated.txt"), "dirty\n");
    const created = createArchivedReviewView({ repositoryPath: root, headCommit: head });
    assert.equal(created.available, true, JSON.stringify(created));
    assert.equal(created.view.launchPath, path.join(created.view.temporaryRoot, "review-session"));
    assert.equal(created.view.reviewPath, path.join(created.view.launchPath, "repository"));
    assert.equal(fs.readFileSync(path.join(created.view.reviewPath, "tracked.txt"), "utf8"), "committed\n");
    assert.equal(fs.existsSync(path.join(created.view.reviewPath, "unrelated.txt")), false);
    assert.equal(fs.existsSync(path.join(created.view.reviewPath, ".git")), false);
    assert.equal(removeArchivedReviewView({ ...created.view, ownershipToken: "wrong" }).removed, false);
    assert.equal(removeArchivedReviewView(created.view).removed, true);

    try {
      fs.symlinkSync("tracked.txt", path.join(root, "linked.txt"));
    } catch (error) {
      if (["EPERM", "EACCES"].includes(error?.code)) return t.skip("filesystem does not permit symlink fixtures");
      throw error;
    }
    git(root, ["add", "linked.txt"]); git(root, ["commit", "-m", "symlink"]);
    const unsafeHead = git(root, ["rev-parse", "HEAD"]);
    assert.equal(createArchivedReviewView({ repositoryPath: root, headCommit: unsafeHead }).code, "independent-review-view-tree-unsafe");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("capability probe requires runtime enforcement and every prohibited capability", () => {
  const valid = { adapter: "fixture", attestationRef: "fixtures/attestation.json", probeReference: "fixtures/probe.json", runtimeEnforced: true, freshContext: true, readOnlyView: true, nonInteractive: true, denied: denials };
  assert.equal(probeIndependentReviewAdapter(valid).available, true);
  assert.equal(probeIndependentReviewAdapter({ ...valid, denied: { ...denials, externalSend: false } }).available, false);
  assert.equal(probeIndependentReviewAdapter({ ...valid, runtimeEnforced: false }).available, false);
});
