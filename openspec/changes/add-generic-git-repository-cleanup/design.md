## Context

See `proposal.md` for motivation and the design brief
(`ai-planning/design-briefs/generic-git-repository-cleanup.md`) for the full
evidence and option analysis. `sdd-workspace-cleanup` deliberately scopes itself
to exact-owned post-Archive cleanup of change-owned SDD resources and classifies
historical or unregistered resources as inventory-only. This change adds the
complementary generic capability for legacy branches/worktrees and out-of-scope
dirty work.

## Goals / Non-Goals

**Goals:**

- Provide one read-only audit that classifies every accessible local branch,
  registered worktree, and porcelain-status path into retire-eligible,
  commit-candidate, and unresolved lists.
- Gate every mutation behind a fresh reinspection and an explicit per-target
  confirmation naming the selected entries and mutation class.
- Compose the existing Git inspection, topic-branch, commit-authoring, and SDD
  lifecycle evidence capabilities.

**Non-Goals:**

- Deleting remote branches whose changes are not proven merged to the remote
  default branch, rewriting history, force-removing worktrees, resetting,
  stashing, or running `git clean`.
- Making `git status` empty by discarding or auto-committing work.
- Committing inside an active OpenSpec change, crossing repository boundaries,
  or creating pull requests.

## Decisions

### Open-question resolutions (owner-approved 2026-08-25)

- **Non-OpenSpec active-work contract.** v1 discovers active work from OpenSpec
  first (`openspec/changes/<name>`), and accepts a repository-local explicit
  adapter/configuration for repositories that do not use OpenSpec. It never
  infers active work from heuristic branch names, and reports the absence of
  comparable active-change evidence when none exists. *(owner-approved)*
- **Local branch with an existing remote counterpart.** A confirmed clean,
  ancestry-merged local branch is a local-retire candidate. When the remote
  counterpart still exists, v1 additionally retires the remote branch only after
  confirming its changes are merged into the remote default branch; otherwise
  the remote branch is left intact and reported as unresolved. *(owner-approved)*
- **Secret and large/binary detectors.** v1 defines a conservative baseline
  (fixed secret/credential patterns plus large/binary detection). Detected or
  uncertain sensitive content is surfaced as unresolved and blocked from commit
  eligibility; repository validation/security adapters are required before
  broadening. *(owner-approved)*
- **Direct commits on the default branch.** v1 never commits or pushes
  OpenSpec/spec-change content (spec deltas and their code/files) directly onto
  the default branch; such content always reaches the default branch by merging
  from a branch or worktree. Non-spec-change files (e.g., design briefs,
  research docs) are not blocked from committing directly to the default branch.
  *(owner-approved)*
- **Receipt storage.** The receipt is written to a configurable, privacy-safe
  external or Git metadata location outside the worktree so it never becomes an
  uncommitted cleanup candidate. *(owner-approved)*

### Audit schema

The audit result is a deterministic, non-secret structure with three lists:
`retireEligible`, `commitCandidates`, and `unresolved`, each entry carrying
identity, classification reason, evidence, and (for unresolved) the evidence gap
and smallest recovery action.

### Classification and selection protocol

- Retire eligibility requires delivery to the discovered default branch, no
  active-change claim, and (for worktrees) non-primary, unlocked, registered,
  and clean state. A retire-eligible local branch whose remote counterpart's
  changes are proven merged to the remote default branch also becomes a
  remote-retire candidate; otherwise the remote branch is left intact and
  reported as unresolved.
- Commit eligibility requires out-of-scope, non-conflicted, non-submodule,
  no-secret, common-purpose grouping. Spec-governed files route through a topic
  branch; non-spec files may commit directly to the default branch.
- The apply confirmation names the selected targets, mutation class
  (retire-only, commit-only, or both), commit message(s), target branch, push
  remote, expected validation, and recovery notes.

### Fresh-inspection and Git adapters

- Every mutation is preceded by a fresh reinspection of branch, worktree, index,
  remote, and protection state.
- Git operations are expressed as small, exact command adapters: worktree
  removal before local branch deletion, `git branch -d` when ancestry permits,
  `git branch -D` only with exact squash/rebase evidence, `git push --delete`
  only after the remote counterpart's changes are proven merged to the remote
  default branch, commit of only selected paths (on the default branch for
  non-spec files, or on a topic branch for spec-governed files), and push only
  after a successful commit and a current push-target check.

## Risks / Trade-offs

- Some repositories will return a non-empty unresolved list rather than a clean
  state; that is intended and safer than guessing.
- Secret-pattern detection cannot prove content is safe; it can only block
  detected or uncertain content.
- State can change between audit and apply; the fresh-reinspection gate is
  mandatory, not optional.

## Migration Plan

1. Add the canonical skill, thin adapters, and the runtime helper.
2. Add fixtures for squash-merge delivery and dirty/ambiguous resources.
3. Run focused tests, repository validation, and strict OpenSpec validation.

Rollback reverts the new skill, helper, spec delta, and fixtures; no external
state is changed.
