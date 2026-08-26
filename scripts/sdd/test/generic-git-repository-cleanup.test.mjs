import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  auditGenericGitRepository, planGenericCleanupApply, discoverDefaultBranch,
  verifyPlanFreshness, buildCleanupReceipt, writeCleanupReceipt, isSpecGovernedPath
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

test("isSpecGovernedPath classifies governed roots and non-spec planning/research", () => {
  assert.equal(isSpecGovernedPath("openspec/changes/foo/design.md"), true);
  assert.equal(isSpecGovernedPath("skills/base/foo/SKILL.md"), true);
  assert.equal(isSpecGovernedPath("scripts/sdd/foo.mjs"), true);
  assert.equal(isSpecGovernedPath("docs/sdd-workflow.md"), true);
  assert.equal(isSpecGovernedPath("docs/research/security/notes.md"), false);
  assert.equal(isSpecGovernedPath("ai-planning/design-briefs/foo.md"), false);
});

test("audit marks non-spec files direct-to-default and spec-governed files as topic-branch", () => {
  const repo = tmpRepo({ after: () => {} });
  fs.mkdirSync(path.join(repo, "ai-planning"), { recursive: true });
  fs.mkdirSync(path.join(repo, "skills"), { recursive: true });
  fs.writeFileSync(path.join(repo, "ai-planning", "brief.md"), "brief");
  fs.writeFileSync(path.join(repo, "skills", "foo.md"), "skill");
  const run = mockRun([
    ["symbolic-ref --quiet refs/remotes/origin/HEAD", { ok: true, stdout: "refs/remotes/origin/main\n" }],
    ["rev-parse --abbrev-ref HEAD", { ok: true, stdout: "main\n" }],
    ["rev-parse --show-toplevel", { ok: true, stdout: repo + "\n" }],
    ["for-each-ref --format=%(refname:short)%09%(objectname) refs/heads", { ok: true, stdout: `main\t${H("a")}\n` }],
    ["worktree list --porcelain", { ok: true, stdout: `worktree ${repo}\nbranch refs/heads/main\n` }],
    ["status --porcelain=v1 --untracked-files=all", { ok: true, stdout: "?? ai-planning/brief.md\n?? skills/foo.md\n" }]
  ]);
  const result = auditGenericGitRepository({ repositoryPath: repo, run });
  const nonSpec = result.audit.commitCandidates.find((c) => c.files.includes("ai-planning/brief.md"));
  const spec = result.audit.commitCandidates.find((c) => c.files.includes("skills/foo.md"));
  assert.equal(nonSpec.directToDefault, true);
  assert.equal(nonSpec.targetBranch, "main");
  assert.equal(spec.directToDefault, false);
  assert.ok(spec.targetBranch.startsWith("topic/"));
});

test("plan-apply commits non-spec files directly on the default branch without a topic branch", () => {
  const audit = {
    remote: "origin",
    defaultBranch: "main",
    retireEligible: [],
    commitCandidates: [{ kind: "commit", id: "working-tree:ai-planning", files: ["ai-planning/brief.md"], message: "docs: brief", targetBranch: "main", directToDefault: true, push: false }],
    unresolved: []
  };
  const result = planGenericCleanupApply({ audit, selection: { retire: [], commitCandidates: [{ id: "working-tree:ai-planning", files: ["ai-planning/brief.md"], message: "docs: brief" }], push: false } });
  assert.equal(result.ok, true);
  assert.equal(result.plan.some((s) => s.kind === "create-topic-branch"), false);
  assert.equal(result.plan[0].kind, "stage-paths");
  assert.equal(result.plan[1].kind, "commit-paths");
});

test("plan-apply emits remote-branch-delete for a branch whose remote counterpart is merged to the remote default", () => {
  const audit = {
    remote: "origin",
    defaultBranch: "main",
    retireEligible: [{ kind: "branch", id: "feature-merged", classification: "retire-eligible", evidence: { remoteCounterpart: { exists: true, mergedToRemoteDefault: true } } }],
    commitCandidates: [],
    unresolved: []
  };
  const result = planGenericCleanupApply({ audit, selection: { retire: ["branch:feature-merged"], commitCandidates: [], push: false } });
  assert.equal(result.ok, true);
  assert.ok(result.plan.some((s) => s.kind === "remote-branch-delete" && s.target === "feature-merged"));
});

test("plan-apply omits remote-branch-delete when the remote counterpart is not merged", () => {
  const audit = {
    remote: "origin",
    defaultBranch: "main",
    retireEligible: [{ kind: "branch", id: "feature-merged", classification: "retire-eligible", evidence: { remoteCounterpart: { exists: true, mergedToRemoteDefault: false } } }],
    commitCandidates: [],
    unresolved: []
  };
  const result = planGenericCleanupApply({ audit, selection: { retire: ["branch:feature-merged"], commitCandidates: [] } });
  assert.equal(result.ok, true);
  assert.equal(result.plan.some((s) => s.kind === "remote-branch-delete"), false);
});

test("verifyPlanFreshness drifts a remote-branch-delete whose remote counterpart is not merged", () => {
  const run = mockRun([
    ["symbolic-ref --quiet refs/remotes/origin/HEAD", { ok: true, stdout: "refs/remotes/origin/main\n" }],
    ["rev-parse --abbrev-ref HEAD", { ok: true, stdout: "main\n" }],
    ["rev-parse --show-toplevel", { ok: true, stdout: "/repo\n" }],
    ["for-each-ref --format=%(refname:short)%09%(objectname) refs/heads", { ok: true, stdout: `main\t${H("a")}\nfeature-merged\t${H("b")}\n` }],
    ["worktree list --porcelain", { ok: true, stdout: "worktree /repo\nbranch refs/heads/main\n" }],
    ["status --porcelain=v1 --untracked-files=all", { ok: true, stdout: "" }],
    ["merge-base --is-ancestor feature-merged refs/remotes/origin/main", { ok: true, stdout: "" }],
    ["merge-base --is-ancestor refs/remotes/origin/feature-merged refs/remotes/origin/main", { ok: false, status: 1, stdout: "" }]
  ]);
  const plan = [{ kind: "branch-delete", target: "feature-merged" }, { kind: "remote-branch-delete", target: "feature-merged" }];
  const result = verifyPlanFreshness({ repositoryPath: "/repo", run, plan });
  assert.equal(result.ok, false);
  assert.equal(result.drifted.some((d) => d.reason === "remote-counterpart-not-merged"), true);
});

test("verifyPlanFreshness drifts a direct-to-default commit when HEAD is not on the default branch", (t) => {
  const repo = tmpRepo(t);
  fs.mkdirSync(path.join(repo, "ai-planning"), { recursive: true });
  fs.writeFileSync(path.join(repo, "ai-planning", "brief.md"), "brief");
  const run = mockRun([
    ["symbolic-ref --quiet refs/remotes/origin/HEAD", { ok: true, stdout: "refs/remotes/origin/main\n" }],
    ["rev-parse --abbrev-ref HEAD", { ok: true, stdout: "feature\n" }],
    ["rev-parse --show-toplevel", { ok: true, stdout: repo + "\n" }],
    ["for-each-ref --format=%(refname:short)%09%(objectname) refs/heads", { ok: true, stdout: `main\t${H("a")}\nfeature\t${H("b")}\n` }],
    ["worktree list --porcelain", { ok: true, stdout: `worktree ${repo}\nbranch refs/heads/feature\n` }],
    ["status --porcelain=v1 --untracked-files=all", { ok: true, stdout: "?? ai-planning/brief.md\n" }],
    ["diff --cached --name-only", { ok: true, stdout: "ai-planning/brief.md\n" }]
  ]);
  const plan = [
    { kind: "stage-paths", files: ["ai-planning/brief.md"], target: "ai-planning/brief.md" },
    { kind: "commit-paths", files: ["ai-planning/brief.md"], target: "ai-planning/brief.md", directToDefault: true, message: "docs: brief" }
  ];
  const result = verifyPlanFreshness({ repositoryPath: repo, run, plan });
  assert.equal(result.ok, false);
  assert.equal(result.drifted.some((d) => d.reason === "commit-target-not-default-branch"), true);
});
