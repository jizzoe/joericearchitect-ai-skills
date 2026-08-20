# Design Brief: Generic Git Repository Cleanup

Date: 2026-08-18
Status: Requested direction recorded; ready for OpenSpec Explore or Propose after review.

## 1. Problem and desired outcome

The existing `sdd-workspace-cleanup` capability protects completed, change-owned
SDD resources. It intentionally does not resolve general repository hygiene:
old merged branches and worktrees that predate the durable SDD record, or
uncommitted work that is outside an active OpenSpec change. Consequently, a
repository can remain confusing or dirty even when no OpenSpec lifecycle action
is active.

Create one reusable, interactive generic Git-cleanup capability that audits a
repository without changing it, then presents three explicit lists:

1. branches and worktrees that are demonstrably delivered to the configured
   default branch, are not associated with an active OpenSpec change, and are
   eligible to retire;
2. working-tree changes outside active OpenSpec change scope that are plausible
   commit candidates; and
3. resources and files for which safe disposition cannot be determined.

The desired steady state is understandable Git state: no forgotten merged
branches or worktrees and no unexplained dirty files. It is not an objective to
make `git status` empty by discarding, guessing at, or automatically committing
work.

## 2. Evidence and key findings

- [SDD post-Archive workspace cleanup](archived/sdd-post-archive-workspace-cleanup.md)
  provides exact-owned local cleanup after Archive, but explicitly treats
  historical or unregistered resources as inventory-only and never deletes
  remote branches.
- [SDD lifecycle hygiene and brief provenance](sdd-lifecycle-hygiene-and-brief-provenance.md)
  establishes that ancestry alone is insufficient: squash merges can deliver a
  branch while leaving its commits outside `main`, and dirty worktrees must be
  protected.
- [Global skill master inventory](../research/global-skill-master-inventory.md)
  already identifies `git-change-inspection`, `git-topic-branch-management`,
  `dirty-worktree-to-topic-branch`, `git-commit-authoring`, and
  `git-topic-branch-cleanup` as related capabilities that need one clear owner
  and composition boundary.
- [Catch-all Git-health idea](ideas/catch-all.md) calls for a read-only summary
  covering stale, merged, unpushed, untracked, upstream-diverged branches and
  worktrees, while separating safe observations from confirmation-gated action.
- The requesting user has specified the essential interaction: identify the two
  actionable lists, pause for permission before branch/worktree deletion or
  commit-and-push, allow a subset selection, and surface unresolved cases.

## 3. Options considered and tradeoffs

### Option A — One generic interactive audit-and-cleanup skill (recommended)

Add a reusable skill with a read-only `audit` phase and a separately
confirmation-gated `apply` phase. It composes existing Git inspection,
topic-branch, commit-authoring, and SDD lifecycle evidence rather than
replacing them.

This directly addresses non-SDD and legacy resources while keeping each
destructive action selected, previewed, and re-checked. The tradeoff is that
some repositories will appropriately return an unresolved list instead of a
fully clean state.

### Option B — Extend `sdd-workspace-cleanup`

Rejected. That skill's exact selected-entry ownership record is a deliberate
safety boundary. Broadening it to legacy and non-SDD resources would weaken its
post-Archive guarantees and contradict its current contract.

### Option C — General `git clean`, reset, or one-command prune workflow

Rejected. These commands cannot determine business ownership, active-change
scope, commit intent, secret exposure, or squash-merge delivery. They can make
a tree look clean by losing or misclassifying work.

## 4. Decisions, assumptions, and owner

### Requested direction

- Decision owner: Joe Rice.
- The capability audits every accessible local branch, registered worktree, and
  porcelain-status path; it does not limit discovery to an OpenSpec change.
- It must identify delivered, inactive branches/worktrees and separately
  identify commit candidates outside an open OpenSpec change.
- It must pause and show the eligible-retirement list, commit-candidate list,
  and unresolved list before any mutation.
- The user may authorize all, select exact entries from either list, provide a
  different disposition, or decline. A previous audit or chat approval does
  not authorize a later apply.
- Branch/worktree deletion and commit-and-push are separate mutation classes.
  Permission must name the selected targets and whether pushing is included.

These are recorded from the request, not represented as a cryptographically
bound approval record. The implementation proposal must preserve the interactive
just-in-time confirmation gate.

### Assumptions

- Git is available locally; remote and pull-request evidence are optional
  inputs that improve classification but must never be invented when unavailable.
- Repositories may use OpenSpec, another specification system, or neither.
  An active OpenSpec change is authoritative where present; otherwise, the tool
  reports the absence of comparable active-change evidence.
- The configured default branch is discovered from `origin/HEAD`, repository
  configuration, or an explicit user choice. It must not assume `main`.

## 5. Scope, non-goals, constraints, dependencies, and risks

### In scope

- A deterministic, read-only audit of local branches, remote-tracking refs,
  worktrees, current status, active OpenSpec changes, archive state, and—when
  available—read-only pull-request delivery evidence.
- Classification of branch/worktree candidates only when all relevant evidence
  supports delivery to the configured default branch, no active change claims
  the resource, the worktree is non-primary, unlocked, registered, clean, and
  no remaining worktree or local ref requires it.
- Recognition of ordinary ancestry merges and squash/rebase delivery only with
  exact merged-PR/default-branch evidence. A stale remote-tracking ref is a
  distinct finding, never proof that a remote branch can be deleted.
- Path-level status inventory and conservative grouping into proposed commits.
  A group is a commit candidate only when its files are outside active change
  scope, are not conflicted or submodule changes, have no detected secret or
  credential pattern, have an intelligible common purpose, and are reviewed by
  the user before commit.
- A final interactive confirmation screen that shows exact commands/targets,
  selected commit message(s), target branch, push remote, expected validation,
  and recovery notes. It permits independent choices: retire resources only,
  commit/push only, both selected sets, a subset, or no action.
- Apply only after fresh reinspection. Remove clean non-primary worktrees
  before their local branches; use non-forced local branch deletion when Git
  proves ancestry. Use forced local deletion only when exact squash/rebase
  delivery evidence and the selected confirmation permit it. Commit only the
  explicitly selected paths and push only after a successful local commit and
  a separate current push target check.
- A durable, non-sensitive audit/apply receipt sufficient to explain which
  entries were selected, skipped, completed, or blocked.

### Non-goals

- Automatically deleting remote branches, rewriting history, force-removing a
  worktree, resetting, checking out over, stashing, or using `git clean` to
  remove content.
- Treating a clean status as proof that a change should be committed, or
  treating untracked/ignored content as safe by default.
- Committing changes in an active OpenSpec change, crossing repository
  boundaries, or bundling unrelated groups solely to clear a dirty status.
- Resolving merge conflicts, modifying generated OpenSpec assets, changing
  GitHub settings, or creating pull requests.
- Promising an empty worktree when evidence is missing, a user declines an
  action, or a resource remains unsafe.

### Required unresolved/blocked classifications

The audit must list rather than act on: the primary worktree; any dirty,
locked, missing, detached, unregistered, or mismatched worktree; a branch with
unique commits or no proven delivery; a branch/ref still used by another
worktree; an unpushed or upstream-diverged branch; an unknown/protected default
branch; unavailable or ambiguous pull-request evidence; active-change
association ambiguity; conflicted, submodule, binary/large, ignored, or
secret-like files; files that overlap an active change; unclear commit grouping
or message; failing required checks; unavailable credentials; and protected or
rejected push targets.

Every unresolved entry must include the evidence gap, why no safe default is
available, and the smallest user decision or recovery action that could resolve
it.

### Constraints, dependencies, and risks

- Preserve unrelated work and use no destructive command in audit mode.
- Repository-specific policies, default branch, remote, validation commands,
  active-change location, and protected-branch rules must come from inspected
  local configuration or explicit user input, never reusable skill constants.
- GitHub/forge reads may be unavailable. The audit may still classify only
  ancestry-proven local cases; it must label squash/rebase and remote state as
  unproven rather than infer success.
- Secret-pattern checks reduce risk but cannot prove content is safe; detected
  or uncertain sensitive material remains blocked for human handling.
- A reinspection immediately before each mutation is required because branch,
  worktree, index, remote, and protection state can change after the audit.
- Commit/push needs an author identity, compatible hooks, and a valid upstream;
  failure after a local commit must report the exact recovery state and must not
  retry or rewrite without a new user instruction.

## 6. Open questions and blocking decisions

- What configuration contract should declare active work in repositories that
  do not use OpenSpec? Recommendation: support OpenSpec discovery first and a
  repository-local, explicit adapter/configuration rather than heuristic branch
  names.
- Should a confirmed clean, ancestry-merged local branch be eligible when its
  remote counterpart still exists? Recommendation: list it as a local-retire
  candidate but make remote deletion an explicitly separate, opt-in action in a
  later scope.
- Which secret and large/binary detectors are sufficient for a generic skill?
  Recommendation: define a conservative baseline and require repository
  validation/security adapters before broadening commit eligibility.
- Should commits be allowed directly on a default branch? Recommendation: the
  initial version should report such changes and require an explicit
  repository-policy decision before proposing a direct commit/push.
- How should the receipt be stored without making a temporary audit artifact
  itself become an uncommitted cleanup candidate? Recommendation: define a
  configurable external or Git metadata location with privacy-safe retention.

## 7. Recommended next step

Recommendation pending owner confirmation: run OpenSpec Explore to resolve the
non-OpenSpec active-work contract, receipt location, commit-safety baseline,
and default-branch direct-commit policy. Then run OpenSpec Propose for one
bounded generic interactive Git-cleanup capability. The proposal should define
the audit schema, classifications, user-selection protocol, fresh-inspection
rules, exact Git command adapters, receipts, fixtures for squash merges and
dirty/ambiguous resources, and validation evidence. No cleanup mutation should
be performed by this design brief.
