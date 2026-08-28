import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  auditGenericGitRepository, planGenericCleanupApply, discoverDefaultBranch,
  verifyPlanFreshness, buildCleanupReceipt, writeCleanupReceipt, isSpecGovernedPath,
  discoverProtectedBranches, discoverValidationCommands
} from "../generic-git-repository-cleanup.mjs";

const H = (c) => c.repeat(40);

function mockRun(responses) {
  return (args, options = {}) => {
    const key = args.join(" ");
    if (key === "remote") return { ok: true, status: 0, stdout: "origin\n", stderr: "" };
    if (key === "rev-parse --git-common-dir") return { ok: true, status: 0, stdout: ".git\n", stderr: "" };
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

test("audit emits one commit candidate per dirty file and blocks renames", () => {
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
  assert.deepEqual(groups, ["working-tree:alpha/one.txt:new", "working-tree:beta/two.txt:new"]);
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
  assert.match(receipt.digest, /^[0-9a-f]{64}$/);
});

test("buildCleanupReceipt digest changes when plan content changes", () => {
  const a = buildCleanupReceipt({ plan: [{ kind: "branch-delete", target: "feature" }], outcomes: [] });
  const b = buildCleanupReceipt({ plan: [{ kind: "branch-delete", target: "other" }], outcomes: [] });
  assert.notEqual(a.digest, b.digest);
});

test("discoverProtectedBranches and discoverValidationCommands read config or explicit input", () => {
  const run = mockRun([
    ["config --get-regexp ^branch", { ok: true, stdout: "branch.main.protected true\nbranch.release.protected true\n" }],
    ["config --get sdd.validation", { ok: true, stdout: "npm test\n" }]
  ]);
  assert.deepEqual(discoverProtectedBranches({ run }), ["main", "release"]);
  assert.deepEqual(discoverProtectedBranches({ run: mockRun([]), explicit: ["main", "hotfix"] }), ["main", "hotfix"]);
  assert.equal(discoverValidationCommands({ run }), "npm test");
  assert.equal(discoverValidationCommands({ run: mockRun([]) }), null);
  assert.equal(discoverValidationCommands({ explicit: "make verify" }), "make verify");
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

test("plan-apply emits remote-branch-delete only on explicit remote selection", () => {
  const audit = {
    remote: "origin",
    defaultBranch: "main",
    retireEligible: [{ kind: "branch", id: "feature-merged", classification: "retire-eligible", evidence: { remoteCounterpart: { exists: true, mergedToRemoteDefault: true } } }],
    commitCandidates: [],
    unresolved: []
  };
  // Selecting only the local branch must not auto-append remote deletion.
  const localOnly = planGenericCleanupApply({ audit, selection: { retire: ["branch:feature-merged"], commitCandidates: [], push: false } });
  assert.equal(localOnly.ok, true);
  assert.equal(localOnly.plan.some((s) => s.kind === "remote-branch-delete"), false);
  // Explicit remote selection plans the deletion after the local branch.
  const withRemote = planGenericCleanupApply({ audit, selection: { retire: ["branch:feature-merged", "remote:feature-merged"], commitCandidates: [], push: false } });
  assert.equal(withRemote.ok, true);
  assert.ok(withRemote.plan.some((s) => s.kind === "remote-branch-delete" && s.target === "feature-merged"));
});

test("plan-apply rejects remote-branch-delete when the remote counterpart is not merged", () => {
  const audit = {
    remote: "origin",
    defaultBranch: "main",
    retireEligible: [{ kind: "branch", id: "feature-merged", classification: "retire-eligible", evidence: { remoteCounterpart: { exists: true, mergedToRemoteDefault: false } } }],
    commitCandidates: [],
    unresolved: []
  };
  const result = planGenericCleanupApply({ audit, selection: { retire: ["remote:feature-merged"], commitCandidates: [] } });
  assert.equal(result.ok, false);
  assert.equal(result.reason, "remote-counterpart-not-merged:feature-merged");
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

test("verifyPlanFreshness binds a topic push to the exact commit OID", () => {
  const run = mockRun([
    ["symbolic-ref --quiet refs/remotes/origin/HEAD", { ok: true, stdout: "refs/remotes/origin/main\n" }],
    ["rev-parse --abbrev-ref HEAD", { ok: true, stdout: "feature\n" }],
    ["rev-parse HEAD", { ok: true, stdout: `${H("b")}\n` }],
    ["rev-parse --show-toplevel", { ok: true, stdout: "/repo\n" }],
    ["for-each-ref --format=%(refname:short)%09%(objectname) refs/heads", { ok: true, stdout: `main\t${H("a")}\nfeature\t${H("b")}\n` }],
    ["worktree list --porcelain", { ok: true, stdout: "worktree /repo\nbranch refs/heads/feature\n" }],
    ["status --porcelain=v1 --untracked-files=all", { ok: true, stdout: "" }],
    ["check-ref-format --branch feature", { ok: true, stdout: "" }]
  ]);
  const plan = [{ kind: "push-topic-branch", target: "feature", committedFiles: ["scripts/x.md"] }];
  const result = verifyPlanFreshness({ repositoryPath: "/repo", run, plan });
  assert.equal(result.ok, true, JSON.stringify(result));
  assert.deepEqual(result.verifiedPlan[0].command, ["git", "push", "origin", `${H("b")}:refs/heads/feature`]);
  assert.equal(result.verifiedPlan[0].commit, H("b"));
});

test("verifyPlanFreshness drifts a push to a protected branch", () => {
  const run = mockRun([
    ["symbolic-ref --quiet refs/remotes/origin/HEAD", { ok: true, stdout: "refs/remotes/origin/main\n" }],
    ["rev-parse --abbrev-ref HEAD", { ok: true, stdout: "release\n" }],
    ["rev-parse --show-toplevel", { ok: true, stdout: "/repo\n" }],
    ["for-each-ref --format=%(refname:short)%09%(objectname) refs/heads", { ok: true, stdout: `main\t${H("a")}\nrelease\t${H("b")}\n` }],
    ["worktree list --porcelain", { ok: true, stdout: "worktree /repo\nbranch refs/heads/release\n" }],
    ["status --porcelain=v1 --untracked-files=all", { ok: true, stdout: "" }],
    ["config --get-regexp ^branch", { ok: true, stdout: "branch.release.protected true\n" }],
    ["check-ref-format --branch release", { ok: true, stdout: "" }]
  ]);
  const plan = [{ kind: "push-topic-branch", target: "release" }];
  const result = verifyPlanFreshness({ repositoryPath: "/repo", run, plan });
  assert.equal(result.ok, false);
  assert.equal(result.drifted.some((d) => d.reason === "push-target-protected"), true);
});

test("audit does not combine unrelated dirty files into a single candidate", () => {
  const repo = tmpRepo({ after: () => {} });
  fs.mkdirSync(path.join(repo, "scripts", "sdd"), { recursive: true });
  fs.mkdirSync(path.join(repo, "scripts", "runtime"), { recursive: true });
  fs.writeFileSync(path.join(repo, "scripts", "sdd", "a.md"), "a");
  fs.writeFileSync(path.join(repo, "scripts", "runtime", "b.md"), "b");
  const run = mockRun([
    ["symbolic-ref --quiet refs/remotes/origin/HEAD", { ok: true, stdout: "refs/remotes/origin/main\n" }],
    ["rev-parse --abbrev-ref HEAD", { ok: true, stdout: "main\n" }],
    ["rev-parse --show-toplevel", { ok: true, stdout: repo + "\n" }],
    ["for-each-ref --format=%(refname:short)%09%(objectname) refs/heads", { ok: true, stdout: `main\t${H("a")}\n` }],
    ["worktree list --porcelain", { ok: true, stdout: `worktree ${repo}\nbranch refs/heads/main\n` }],
    ["status --porcelain=v1 --untracked-files=all", { ok: true, stdout: "?? scripts/sdd/a.md\n?? scripts/runtime/b.md\n" }]
  ]);
  const result = auditGenericGitRepository({ repositoryPath: repo, run });
  assert.deepEqual(result.audit.commitCandidates.map((c) => c.id).sort(), ["working-tree:scripts/runtime/b.md:new", "working-tree:scripts/sdd/a.md:new"]);
});

test("verifyPlanFreshness ignores a forged directToDefault for spec-governed files", () => {
  const repo = tmpRepo({ after: () => {} });
  fs.mkdirSync(path.join(repo, "skills"), { recursive: true });
  fs.writeFileSync(path.join(repo, "skills", "foo.md"), "skill");
  const run = mockRun([
    ["symbolic-ref --quiet refs/remotes/origin/HEAD", { ok: true, stdout: "refs/remotes/origin/main\n" }],
    ["rev-parse --abbrev-ref HEAD", { ok: true, stdout: "main\n" }],
    ["rev-parse --show-toplevel", { ok: true, stdout: repo + "\n" }],
    ["for-each-ref --format=%(refname:short)%09%(objectname) refs/heads", { ok: true, stdout: `main\t${H("a")}\n` }],
    ["worktree list --porcelain", { ok: true, stdout: `worktree ${repo}\nbranch refs/heads/main\n` }],
    ["status --porcelain=v1 --untracked-files=all", { ok: true, stdout: "?? skills/foo.md\n" }],
    ["diff --cached --name-only", { ok: true, stdout: "skills/foo.md\n" }]
  ]);
  const plan = [{ kind: "commit-paths", files: ["skills/foo.md"], target: "skills/foo.md", directToDefault: true, message: "chore: forged" }];
  const result = verifyPlanFreshness({ repositoryPath: repo, run, plan });
  assert.equal(result.ok, false);
  assert.equal(result.drifted.some((d) => d.reason === "commit-target-branch-mismatch"), true);
});

test("audit reports archived changes and surfaces an unresolved remote-branch entry", () => {
  const repo = tmpRepo({ after: () => {} });
  fs.mkdirSync(path.join(repo, "openspec", "changes", "archive", "2026-08-01-example-change"), { recursive: true });
  const run = mockRun([
    ["symbolic-ref --quiet refs/remotes/origin/HEAD", { ok: true, stdout: "refs/remotes/origin/main\n" }],
    ["rev-parse --abbrev-ref HEAD", { ok: true, stdout: "main\n" }],
    ["rev-parse --show-toplevel", { ok: true, stdout: repo + "\n" }],
    ["for-each-ref --format=%(refname:short)%09%(objectname) refs/heads", { ok: true, stdout: `main\t${H("a")}\nfeature-merged\t${H("b")}\n` }],
    ["worktree list --porcelain", { ok: true, stdout: `worktree ${repo}\nbranch refs/heads/main\n` }],
    ["status --porcelain=v1 --untracked-files=all", { ok: true, stdout: "" }],
    ["merge-base --is-ancestor feature-merged refs/remotes/origin/main", { ok: true, stdout: "" }],
    ["merge-base --is-ancestor refs/remotes/origin/feature-merged refs/remotes/origin/main", { ok: false, status: 1, stdout: "" }]
  ]);
  const result = auditGenericGitRepository({ repositoryPath: repo, run });
  assert.deepEqual(result.audit.archivedChanges, ["2026-08-01-example-change"]);
  assert.equal(result.audit.unresolved.some((e) => e.kind === "remote-branch" && e.reason === "remote-counterpart-unmerged"), true);
});

test("audit classifies a squash-merged branch as retire-eligible via pull-request evidence", () => {
  const run = mockRun([
    ["symbolic-ref --quiet refs/remotes/origin/HEAD", { ok: true, stdout: "refs/remotes/origin/main\n" }],
    ["rev-parse --abbrev-ref HEAD", { ok: true, stdout: "main\n" }],
    ["rev-parse --show-toplevel", { ok: true, stdout: "/repo\n" }],
    ["for-each-ref --format=%(refname:short)%09%(objectname) refs/heads", { ok: true, stdout: `main\t${H("a")}\nfeature-squashed\t${H("c")}\n` }],
    ["worktree list --porcelain", { ok: true, stdout: "worktree /repo\nbranch refs/heads/main\n" }],
    ["status --porcelain=v1 --untracked-files=all", { ok: true, stdout: "" }],
    ["merge-base --is-ancestor feature-squashed refs/remotes/origin/main", { ok: false, status: 1, stdout: "" }]
  ]);
  const pullRequestEvidence = (branch) => branch === "feature-squashed" ? { merged: true, branch, headCommit: H("c"), defaultBranch: "main", reference: "https://github.com/org/repo/pull/1" } : null;
  const result = auditGenericGitRepository({ repositoryPath: "/repo", run, pullRequestEvidence });
  assert.equal(result.audit.retireEligible.some((e) => e.kind === "branch" && e.id === "feature-squashed" && e.reason === "delivered-via-pull-request"), true);
});

test("audit rejects stale or unbound pull-request evidence", () => {
  const run = mockRun([
    ["symbolic-ref --quiet refs/remotes/origin/HEAD", { ok: true, stdout: "refs/remotes/origin/main\n" }],
    ["rev-parse --abbrev-ref HEAD", { ok: true, stdout: "main\n" }],
    ["rev-parse --show-toplevel", { ok: true, stdout: "/repo\n" }],
    ["for-each-ref --format=%(refname:short)%09%(objectname) refs/heads", { ok: true, stdout: `main\t${H("a")}\nfeature-squashed\t${H("c")}\n` }],
    ["worktree list --porcelain", { ok: true, stdout: "worktree /repo\nbranch refs/heads/main\n" }],
    ["status --porcelain=v1 --untracked-files=all", { ok: true, stdout: "" }],
    ["merge-base --is-ancestor feature-squashed refs/remotes/origin/main", { ok: false, status: 1, stdout: "" }]
  ]);
  const pullRequestEvidence = () => ({ merged: true, reference: "https://github.com/org/repo/pull/1" });
  const result = auditGenericGitRepository({ repositoryPath: "/repo", run, pullRequestEvidence });
  assert.equal(result.audit.unresolved.some((e) => e.reason === "pull-request-evidence-stale"), true);
});

test("audit surfaces active-change-scope status entries as unresolved instead of dropping them", () => {
  const repo = tmpRepo({ after: () => {} });
  fs.mkdirSync(path.join(repo, "openspec", "changes", "active-change"), { recursive: true });
  fs.writeFileSync(path.join(repo, "openspec", "changes", "active-change", "design.md"), "d");
  const run = mockRun([
    ["symbolic-ref --quiet refs/remotes/origin/HEAD", { ok: true, stdout: "refs/remotes/origin/main\n" }],
    ["rev-parse --abbrev-ref HEAD", { ok: true, stdout: "main\n" }],
    ["rev-parse --show-toplevel", { ok: true, stdout: repo + "\n" }],
    ["for-each-ref --format=%(refname:short)%09%(objectname) refs/heads", { ok: true, stdout: `main\t${H("a")}\n` }],
    ["worktree list --porcelain", { ok: true, stdout: `worktree ${repo}\nbranch refs/heads/main\n` }],
    ["status --porcelain=v1 --untracked-files=all", { ok: true, stdout: "?? openspec/changes/active-change/design.md\n" }]
  ]);
  const result = auditGenericGitRepository({ repositoryPath: repo, run });
  assert.equal(result.audit.unresolved.some((e) => e.kind === "file" && e.reason === "active-change-scope"), true);
  assert.equal(result.audit.commitCandidates.length, 0);
});

test("plan-apply includes discovered validation commands in the result and confirmation", () => {
  const audit = {
    remote: "origin",
    defaultBranch: "main",
    validationCommands: "npm test",
    retireEligible: [],
    commitCandidates: [],
    unresolved: []
  };
  const result = planGenericCleanupApply({ audit, selection: { retire: [], commitCandidates: [], push: false } });
  assert.equal(result.ok, true);
  assert.equal(result.validationCommands, "npm test");
  assert.equal(result.confirmation.validationCommands, "npm test");
});

test("plan-apply uses -D for a squash/rebase-delivered branch", () => {
  const audit = {
    remote: "origin",
    defaultBranch: "main",
    retireEligible: [{ kind: "branch", id: "feature-squashed", classification: "retire-eligible", reason: "delivered-via-pull-request", evidence: { pullRequestMerged: true } }],
    commitCandidates: [],
    unresolved: []
  };
  const result = planGenericCleanupApply({ audit, selection: { retire: ["branch:feature-squashed"], commitCandidates: [] } });
  assert.equal(result.ok, true);
  const step = result.plan.find((s) => s.kind === "branch-delete");
  assert.deepEqual(step.command, ["git", "branch", "-D", "--", "feature-squashed"]);
});

test("audit classifies an ancestry-merged branch against the local default when no remote exists", () => {
  const run = (args) => {
    const key = args.join(" ");
    if (key === "remote") return { ok: true, status: 0, stdout: "", stderr: "" };
    if (key === "symbolic-ref --quiet refs/remotes/origin/HEAD") return { ok: false, status: 1, stdout: "", stderr: "" };
    if (key === "config --get init.defaultBranch") return { ok: true, status: 0, stdout: "main\n", stderr: "" };
    if (key === "config --get sdd.validation") return { ok: false, status: 1, stdout: "", stderr: "" };
    if (key.startsWith("config --get-regexp")) return { ok: false, status: 1, stdout: "", stderr: "" };
    if (key === "rev-parse --abbrev-ref HEAD") return { ok: true, status: 0, stdout: "main\n", stderr: "" };
    if (key === "rev-parse --show-toplevel") return { ok: true, status: 0, stdout: "/repo\n", stderr: "" };
    if (key.startsWith("for-each-ref")) return { ok: true, status: 0, stdout: `main\t${H("a")}\nfeature-merged\t${H("b")}\n`, stderr: "" };
    if (key.startsWith("worktree list")) return { ok: true, status: 0, stdout: "worktree /repo\nbranch refs/heads/main\n", stderr: "" };
    if (key.startsWith("status")) return { ok: true, status: 0, stdout: "", stderr: "" };
    if (key === "merge-base --is-ancestor feature-merged refs/heads/main") return { ok: true, status: 0, stdout: "", stderr: "" };
    return { ok: false, status: 1, stdout: "", stderr: "" };
  };
  const result = auditGenericGitRepository({ repositoryPath: "/repo", run });
  assert.equal(result.audit.retireEligible.some((e) => e.kind === "branch" && e.id === "feature-merged"), true);
});

test("buildCleanupReceipt records selected and skipped entries", () => {
  const receipt = buildCleanupReceipt({
    plan: [{ kind: "branch-delete", target: "feature" }],
    outcomes: [{ kind: "branch-delete", target: "feature", status: "completed" }],
    selected: [{ kind: "branch-delete", target: "feature" }],
    skipped: [{ kind: "branch", target: "other" }]
  });
  assert.deepEqual(receipt.selected, [{ kind: "branch-delete", target: "feature" }]);
  assert.deepEqual(receipt.skipped, [{ kind: "branch", target: "other" }]);
  assert.match(receipt.digest, /^[0-9a-f]{64}$/);
});

test("audit from a linked worktree never classifies the primary worktree as retire-eligible", () => {
  const repo = tmpRepo({ after: () => {} });
  const run = mockRun([
    ["symbolic-ref --quiet refs/remotes/origin/HEAD", { ok: true, stdout: "refs/remotes/origin/main\n" }],
    ["rev-parse --abbrev-ref HEAD", { ok: true, stdout: "main\n" }],
    ["for-each-ref --format=%(refname:short)%09%(objectname) refs/heads", { ok: true, stdout: `main\t${H("a")}\n` }],
    ["worktree list --porcelain", { ok: true, stdout: `worktree ${repo}\nbranch refs/heads/main\n\nworktree ${repo}/linked\nbranch refs/heads/main\n` }],
    ["status --porcelain=v1 --untracked-files=all", { ok: true, stdout: "" }],
    ["merge-base --is-ancestor main refs/remotes/origin/main", { ok: true, stdout: "" }]
  ]);
  // repositoryPath points at the primary repo, but the common dir resolves the
  // primary worktree from authoritative Git data regardless of cwd.
  const result = auditGenericGitRepository({ repositoryPath: repo, run });
  assert.equal(result.audit.retireEligible.some((e) => e.kind === "worktree" && e.id === repo), false);
  assert.equal(result.audit.unresolved.some((e) => e.kind === "worktree" && e.id === repo && e.reason === "primary-worktree"), true);
});
