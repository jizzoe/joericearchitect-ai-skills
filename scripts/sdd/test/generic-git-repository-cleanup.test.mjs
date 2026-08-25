import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  auditGenericGitRepository, planGenericCleanupApply, discoverDefaultBranch,
  verifyPlanFreshness, buildCleanupReceipt, writeCleanupReceipt
} from "../generic-git-repository-cleanup.mjs";

const H = (c) => c.repeat(40);

function mockRun(responses) {
  return (args, options = {}) => {
    const key = args.join(" ");
    if (key === "remote") return { ok: true, status: 0, stdout: "origin\n", stderr: "" };
    if (key.startsWith("rev-parse --verify refs/remotes/")) return { ok: true, status: 0, stdout: `${H("a")}\n`, stderr: "" };
    for (const [pattern, response] of responses) {
      if (key.startsWith(pattern)) return typeof response === "function" ? response(args, options) : response;
    }
    return { ok: false, status: 1, stdout: "", stderr: "" };
  };
}

function tmpRepo(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "grc-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return dir;
}

test("discoverDefaultBranch resolves origin/HEAD then falls back to config", () => {
  assert.equal(discoverDefaultBranch({ run: mockRun([["symbolic-ref --quiet refs/remotes/origin/HEAD", { ok: true, stdout: "refs/remotes/origin/main\n" }]]) }), "main");
  assert.equal(discoverDefaultBranch({ run: mockRun([["symbolic-ref --quiet refs/remotes/origin/HEAD", { ok: false, stdout: "" }], ["config --get init.defaultBranch", { ok: true, stdout: "develop\n" }]]) }), "develop");
  assert.equal(discoverDefaultBranch({ explicit: "trunk" }), "trunk");
});

test("audit classifies a merged inactive branch as retire-eligible and an unmerged branch as unresolved", () => {
  const run = mockRun([
    ["symbolic-ref --quiet refs/remotes/origin/HEAD", { ok: true, stdout: "refs/remotes/origin/main\n" }],
    ["rev-parse --abbrev-ref HEAD", { ok: true, stdout: "main\n" }],
    ["rev-parse --show-toplevel", { ok: true, stdout: "/repo\n" }],
    ["for-each-ref --format=%(refname:short)%09%(objectname) refs/heads", { ok: true, stdout: `main\t${H("a")}\nfeature-merged\t${H("b")}\nfeature-unmerged\t${H("c")}\n` }],
    ["worktree list --porcelain", { ok: true, stdout: "worktree /repo\nbranch refs/heads/main\n" }],
    ["status --porcelain=v1 --untracked-files=all", { ok: true, stdout: "" }],
    ["merge-base --is-ancestor feature-merged refs/remotes/origin/main", { ok: true, stdout: "" }],
    ["merge-base --is-ancestor feature-unmerged refs/remotes/origin/main", { ok: false, status: 1, stdout: "" }]
  ]);
  const result = auditGenericGitRepository({ repositoryPath: "/repo", run });
  assert.equal(result.ok, true);
  assert.deepEqual(result.audit.retireEligible.filter((e) => e.kind === "branch").map((e) => e.id), ["feature-merged"]);
  assert.deepEqual(result.audit.unresolved.filter((e) => e.kind === "branch").map((e) => e.id), ["feature-unmerged"]);
});

test("audit lists primary worktree as unresolved and clean non-primary as retire-eligible", () => {
  const run = mockRun([
    ["symbolic-ref --quiet refs/remotes/origin/HEAD", { ok: true, stdout: "refs/remotes/origin/main\n" }],
    ["rev-parse --abbrev-ref HEAD", { ok: true, stdout: "main\n" }],
    ["rev-parse --show-toplevel", { ok: true, stdout: "/repo\n" }],
    ["for-each-ref --format=%(refname:short)%09%(objectname) refs/heads", { ok: true, stdout: `main\t${H("a")}\nfeature-merged\t${H("b")}\n` }],
    ["worktree list --porcelain", { ok: true, stdout: "worktree /repo\nbranch refs/heads/main\n\nworktree /repo-other\nbranch refs/heads/feature-merged\n" }],
    ["status --porcelain=v1 --untracked-files=all", { ok: true, stdout: "" }],
    ["merge-base --is-ancestor feature-merged refs/remotes/origin/main", { ok: true, stdout: "" }]
  ]);
  const result = auditGenericGitRepository({ repositoryPath: "/repo", run });
  assert.equal(result.ok, true);
  assert.equal(result.audit.unresolved.find((e) => e.kind === "worktree" && e.id === "/repo")?.reason, "primary-worktree");
  assert.equal(result.audit.retireEligible.find((e) => e.kind === "worktree" && e.id === "/repo-other")?.classification, "retire-eligible");
});

test("audit marks a worktree-referenced branch and secret-like files as unresolved", () => {
  const repo = tmpRepo({ after: () => {} });
  const run = mockRun([
    ["symbolic-ref --quiet refs/remotes/origin/HEAD", { ok: true, stdout: "refs/remotes/origin/main\n" }],
    ["rev-parse --abbrev-ref HEAD", { ok: true, stdout: "main\n" }],
    ["rev-parse --show-toplevel", { ok: true, stdout: repo + "\n" }],
    ["for-each-ref --format=%(refname:short)%09%(objectname) refs/heads", { ok: true, stdout: `main\t${H("a")}\ninuse\t${H("b")}\n` }],
    ["worktree list --porcelain", { ok: true, stdout: `worktree ${repo}\nbranch refs/heads/main\n\nworktree ${repo}-other\nbranch refs/heads/inuse\n` }],
    ["status --porcelain=v1 --untracked-files=all", { ok: true, stdout: "?? secret.txt\n" }],
    ["merge-base --is-ancestor inuse refs/remotes/origin/main", { ok: true, stdout: "" }]
  ]);
  const result = auditGenericGitRepository({ repositoryPath: repo, run });
  assert.equal(result.ok, true);
  assert.equal(result.audit.unresolved.find((e) => e.kind === "branch" && e.id === "inuse")?.reason, "worktree-references-branch");
});

test("plan-apply orders worktree removal before branch deletion and rejects non-eligible selections", () => {
  const audit = {
    defaultBranch: "main",
    retireEligible: [
      { kind: "worktree", id: "/repo-other", classification: "retire-eligible" },
      { kind: "branch", id: "feature-merged", classification: "retire-eligible" }
    ],
    commitCandidates: [],
    unresolved: []
  };
  const result = planGenericCleanupApply({ audit, selection: { retire: ["worktree:/repo-other", "branch:feature-merged"], commitCandidates: [], push: false } });
  assert.equal(result.ok, true);
  assert.equal(result.plan[0].kind, "worktree-remove");
  assert.equal(result.plan[1].kind, "branch-delete");
  assert.equal(planGenericCleanupApply({ audit, selection: { retire: ["branch:unknown"], commitCandidates: [] } }).ok, false);
});

test("audit marks a worktree whose branch is unmerged as unresolved", () => {
  const run = mockRun([
    ["symbolic-ref --quiet refs/remotes/origin/HEAD", { ok: true, stdout: "refs/remotes/origin/main\n" }],
    ["rev-parse --abbrev-ref HEAD", { ok: true, stdout: "main\n" }],
    ["rev-parse --show-toplevel", { ok: true, stdout: "/repo\n" }],
    ["for-each-ref --format=%(refname:short)%09%(objectname) refs/heads", { ok: true, stdout: `main\t${H("a")}\nfeature-unmerged\t${H("b")}\n` }],
    ["worktree list --porcelain", { ok: true, stdout: "worktree /repo\nbranch refs/heads/main\n\nworktree /repo-other\nbranch refs/heads/feature-unmerged\n" }],
    ["status --porcelain=v1 --untracked-files=all", { ok: true, stdout: "" }],
    ["merge-base --is-ancestor feature-unmerged refs/remotes/origin/main", { ok: false, status: 1, stdout: "" }]
  ]);
  const result = auditGenericGitRepository({ repositoryPath: "/repo", run });
  assert.equal(result.audit.unresolved.find((e) => e.kind === "worktree" && e.id === "/repo-other")?.reason, "delivery-unproven");
});

test("audit groups eligible dirty files by top-level directory and blocks renames", () => {
  const repo = tmpRepo({ after: () => {} });
  fs.mkdirSync(path.join(repo, "alpha"), { recursive: true });
  fs.mkdirSync(path.join(repo, "beta"), { recursive: true });
  fs.writeFileSync(path.join(repo, "alpha", "one.txt"), "one");
  fs.writeFileSync(path.join(repo, "beta", "two.txt"), "two");
  const run = mockRun([
    ["symbolic-ref --quiet refs/remotes/origin/HEAD", { ok: true, stdout: "refs/remotes/origin/main\n" }],
    ["rev-parse --abbrev-ref HEAD", { ok: true, stdout: "main\n" }],
    ["rev-parse --show-toplevel", { ok: true, stdout: repo + "\n" }],
    ["for-each-ref --format=%(refname:short)%09%(objectname) refs/heads", { ok: true, stdout: `main\t${H("a")}\n` }],
    ["worktree list --porcelain", { ok: true, stdout: `worktree ${repo}\nbranch refs/heads/main\n` }],
    ["status --porcelain=v1 --untracked-files=all", { ok: true, stdout: "?? alpha/one.txt\n?? beta/two.txt\nR  old.txt -> alpha/renamed.txt\n" }],
    ["merge-base --is-ancestor main refs/remotes/origin/main", { ok: true, stdout: "" }]
  ]);
  const result = auditGenericGitRepository({ repositoryPath: repo, run });
  const groups = result.audit.commitCandidates.map((c) => c.id).sort();
  assert.deepEqual(groups, ["working-tree:alpha:new", "working-tree:beta:new"]);
  assert.equal(result.audit.unresolved.some((e) => e.reason === "renamed-or-copied"), true);
});

test("plan-apply emits a create-topic-branch step before staging", () => {
  const audit = {
    defaultBranch: "main",
    retireEligible: [],
    commitCandidates: [{ kind: "commit", id: "working-tree:alpha", files: ["alpha/one.txt"], message: "chore: alpha", targetBranch: "topic/main-alpha-cleanup", push: false }],
    unresolved: []
  };
  const result = planGenericCleanupApply({ audit, selection: { retire: [], commitCandidates: [{ id: "working-tree:alpha", files: ["alpha/one.txt"], message: "chore: alpha", targetBranch: "topic/main-alpha-cleanup" }], push: false } });
  assert.equal(result.ok, true);
  assert.equal(result.plan[0].kind, "create-topic-branch");
  assert.equal(result.plan[1].kind, "stage-paths");
});

test("verifyPlanFreshness stops on drift and returns a receipt", () => {
  const run = mockRun([
    ["symbolic-ref --quiet refs/remotes/origin/HEAD", { ok: true, stdout: "refs/remotes/origin/main\n" }],
    ["rev-parse --abbrev-ref HEAD", { ok: true, stdout: "main\n" }],
    ["rev-parse --show-toplevel", { ok: true, stdout: "/repo\n" }],
    ["for-each-ref --format=%(refname:short)%09%(objectname) refs/heads", { ok: true, stdout: `main\t${H("a")}\n` }],
    ["worktree list --porcelain", { ok: true, stdout: "worktree /repo\nbranch refs/heads/main\n" }],
    ["status --porcelain=v1 --untracked-files=all", { ok: true, stdout: "" }]
  ]);
  const plan = [{ kind: "branch-delete", target: "feature-gone", command: ["git", "branch", "-d", "--", "feature-gone"] }];
  const result = verifyPlanFreshness({ repositoryPath: "/repo", run, plan });
  assert.equal(result.ok, false);
  assert.equal(result.reason, "fresh-inspection-drift");
  assert.ok(result.receipt.nonSensitive === true);
});

test("buildCleanupReceipt is non-sensitive and records outcomes", () => {
  const receipt = buildCleanupReceipt({ plan: [{ kind: "branch-delete", target: "feature", command: ["git", "branch", "-d", "--", "feature"] }], outcomes: [{ kind: "branch-delete", target: "feature", status: "completed" }] });
  assert.equal(receipt.nonSensitive, true);
  assert.equal(receipt.outcomes[0].status, "completed");
});

test("writeCleanupReceipt persists atomically to a configurable location", (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "grc-receipt-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const outputPath = path.join(dir, "receipt.json");
  const result = writeCleanupReceipt({ receipt: buildCleanupReceipt({ plan: [], outcomes: [] }), outputPath });
  assert.equal(result.ok, true);
  const written = JSON.parse(fs.readFileSync(outputPath, "utf8"));
  assert.equal(written.nonSensitive, true);
});

test("writeCleanupReceipt rejects paths inside the repository", (t) => {
  const repo = tmpRepo({ after: () => {} });
  const result = writeCleanupReceipt({ receipt: buildCleanupReceipt({ plan: [], outcomes: [] }), outputPath: path.join(repo, "receipt.json"), repositoryPath: repo });
  assert.equal(result.ok, false);
  assert.equal(result.reason, "receipt-path-inside-worktree");
});

test("verifyPlanFreshness flags a branch-delete whose dependency worktree is still present", () => {
  const run = mockRun([
    ["symbolic-ref --quiet refs/remotes/origin/HEAD", { ok: true, stdout: "refs/remotes/origin/main\n" }],
    ["rev-parse --abbrev-ref HEAD", { ok: true, stdout: "main\n" }],
    ["rev-parse --show-toplevel", { ok: true, stdout: "/repo\n" }],
    ["for-each-ref --format=%(refname:short)%09%(objectname) refs/heads", { ok: true, stdout: `main\t${H("a")}\nfeature-merged\t${H("b")}\n` }],
    ["worktree list --porcelain", { ok: true, stdout: "worktree /repo\nbranch refs/heads/main\n\nworktree /repo-other\nbranch refs/heads/feature-merged\n" }],
    ["status --porcelain=v1 --untracked-files=all", { ok: true, stdout: "" }],
    ["merge-base --is-ancestor feature-merged refs/remotes/origin/main", { ok: true, stdout: "" }]
  ]);
  const plan = [
    { kind: "worktree-remove", target: "/repo-other" },
    { kind: "branch-delete", target: "feature-merged" }
  ];
  const result = verifyPlanFreshness({ repositoryPath: "/repo", run, plan });
  assert.equal(result.ok, false);
  assert.equal(result.drifted.some((d) => d.reason === "dependency-worktree-still-present"), true);
});

test("verifyPlanFreshness authorizes a single step via stepIndex", () => {
  const run = mockRun([
    ["symbolic-ref --quiet refs/remotes/origin/HEAD", { ok: true, stdout: "refs/remotes/origin/main\n" }],
    ["rev-parse --abbrev-ref HEAD", { ok: true, stdout: "main\n" }],
    ["rev-parse --show-toplevel", { ok: true, stdout: "/repo\n" }],
    ["for-each-ref --format=%(refname:short)%09%(objectname) refs/heads", { ok: true, stdout: `main\t${H("a")}\nfeature-merged\t${H("b")}\n` }],
    ["worktree list --porcelain", { ok: true, stdout: "worktree /repo\nbranch refs/heads/main\n\nworktree /repo-other\nbranch refs/heads/feature-merged\n" }],
    ["status --porcelain=v1 --untracked-files=all", { ok: true, stdout: "" }],
    ["merge-base --is-ancestor feature-merged refs/remotes/origin/main", { ok: true, stdout: "" }]
  ]);
  const plan = [{ kind: "worktree-remove", target: "/repo-other" }];
  const result = verifyPlanFreshness({ repositoryPath: "/repo", run, plan, stepIndex: 0 });
  assert.equal(result.ok, true, JSON.stringify(result));
  assert.equal(result.verifiedPlan[0].kind, "worktree-remove");
});
