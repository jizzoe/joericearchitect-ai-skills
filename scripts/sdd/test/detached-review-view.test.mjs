import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { createDetachedReviewView, removeDetachedReviewView } from "../detached-review-view.mjs";
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
    const created = createDetachedReviewView({ repositoryPath: root, headCommit: head });
    assert.equal(created.available, true);
    assert.equal(git(created.view.reviewPath, ["rev-parse", "HEAD"]), head);
    assert.equal(fs.existsSync(path.join(created.view.reviewPath, "unrelated.txt")), false);
    assert.throws(() => git(created.view.reviewPath, ["symbolic-ref", "--quiet", "--short", "HEAD"]));
    assert.equal(removeDetachedReviewView({ ...created.view, ownershipToken: "wrong" }).removed, false);
    assert.equal(removeDetachedReviewView(created.view).removed, true);
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
