# generic-git-repository-cleanup Specification

## Purpose
Defines the interactive generic Git-cleanup capability that audits a repository
without changing it and applies only explicitly confirmed, freshly re-inspected
retirement and commit actions.
## Requirements
### Requirement: Audit is read-only and produces three classified lists
The generic cleanup audit SHALL inspect local branches, remote-tracking refs,
registered worktrees, current status, active OpenSpec changes, archive state,
and available read-only pull-request evidence without mutating the repository,
and SHALL report three explicit lists: retire-eligible branches/worktrees,
plausible commit candidates, and unresolved/blocked entries.

#### Scenario: Audit runs with no destructive command
- **WHEN** an audit executes against any repository state
- **THEN** it performs only read-only Git inspection and produces a deterministic report

#### Scenario: Unavailable remote evidence is labeled
- **WHEN** remote or pull-request evidence is unavailable
- **THEN** the audit classifies only ancestry-proven local cases and labels squash, rebase, and remote state as unproven rather than inferring success

### Requirement: Retire eligibility requires complete delivery evidence
A branch or worktree SHALL be a retire-eligible candidate only when all relevant
evidence proves delivery to the configured default branch, no active OpenSpec
change claims the resource, the worktree is non-primary, unlocked, registered,
and clean, and no remaining worktree or local ref requires it.

#### Scenario: Delivered inactive branch is eligible
- **WHEN** a local branch is proven merged to the configured default branch, is not claimed by an active change, and no worktree references it
- **THEN** it is listed as a retire-eligible local candidate

#### Scenario: Unproven delivery is blocked
- **WHEN** a branch has unique commits, no proven delivery, or only a stale remote-tracking ref
- **THEN** it is listed unresolved and never treated as delivered

### Requirement: Commit candidates are conservatively grouped
A working-tree change SHALL be a commit candidate only when its files are
outside active OpenSpec change scope, are not conflicted or submodule changes,
have no detected secret or credential pattern, and share an intelligible common
purpose. The audit MUST NOT group unrelated changes solely to clear a dirty
status.

#### Scenario: Out-of-scope dirty files group into a candidate
- **WHEN** working-tree changes lie outside active change scope with a common purpose
- **THEN** they are grouped into a proposed commit candidate for user review

#### Scenario: Secret-like content is blocked
- **WHEN** a file matches a detected secret or credential pattern, or its safety is uncertain
- **THEN** it is listed unresolved and blocked from commit eligibility

### Requirement: Spec-governed content is never committed directly to the default branch
OpenSpec changes, living specs, and the governed reusable assets (skills,
scripts, schemas, and workflow docs) SHALL NOT be committed or pushed directly
onto the configured default branch; such content SHALL reach the default branch
only by merging from a branch or worktree. Non-spec-change files (e.g., design
briefs, research, notes) MAY be committed directly to the default branch.

#### Scenario: Non-spec files may commit directly to the default branch
- **WHEN** working-tree changes are non-spec files (design briefs, research, notes) outside active change scope
- **THEN** they may be grouped into a commit candidate targeting the default branch directly, without a topic branch

#### Scenario: Spec-governed files route through a topic branch
- **WHEN** working-tree changes touch spec-governed content outside active change scope
- **THEN** they are grouped into a commit candidate targeting a topic branch, never a direct default-branch commit

### Requirement: Unresolved entries surface the evidence gap
Every unresolved or blocked entry SHALL include the specific evidence gap, why no
safe default is available, and the smallest user decision or recovery action that
could resolve it. The audit MUST list rather than act on the primary worktree and
any dirty, locked, missing, detached, unregistered, or mismatched resource.

#### Scenario: Primary worktree is never mutated
- **WHEN** the primary worktree is dirty or otherwise unsafe
- **THEN** it is listed unresolved and never selected for removal or commit

### Requirement: Apply is confirmation-gated and freshly re-inspected
Apply SHALL require a fresh reinspection immediately before each mutation, and
SHALL present the exact commands, targets, commit messages, target branch, push
remote, expected validation, and recovery notes for confirmation. A previous
audit or approval SHALL NOT authorize a later apply.

#### Scenario: Selection authorizes a subset
- **WHEN** the user selects exact entries from either actionable list, or declines
- **THEN** apply mutates only the selected targets after fresh reinspection

#### Scenario: Stale audit does not authorize apply
- **WHEN** branch, worktree, index, remote, or protection state changed after audit
- **THEN** apply pauses or reclassifies rather than using stale evidence

### Requirement: Apply is least-destructive and ordered
Apply SHALL remove clean non-primary worktrees before their local branches, use
non-forced local branch deletion when ancestry permits, use forced local
deletion only with exact squash/rebase delivery evidence and confirmation,
commit only explicitly selected paths, and push only after a successful local
commit and a separate current push-target check.

#### Scenario: Worktree removal precedes branch deletion
- **WHEN** an eligible worktree and its local branch are both selected
- **THEN** the worktree is removed first and the branch is re-inspected before deletion

#### Scenario: Push follows a successful commit
- **WHEN** a commit succeeds and the push target remains valid
- **THEN** the push proceeds; a commit failure reports exact recovery state without retry or rewrite

### Requirement: Repository policy is discovered, not constant
The configured default branch, remote, validation commands, active-change
location, and protected-branch rules SHALL come from inspected local
configuration or explicit user input, never reusable skill constants. The default
branch MUST be discovered from origin/HEAD, repository configuration, or an
explicit user choice.

#### Scenario: Default branch is not assumed
- **WHEN** the repository default branch is not main
- **THEN** the audit uses the discovered default branch rather than assuming main

### Requirement: Apply deletes remote branches only on proven remote merge
The capability SHALL NOT rewrite history, force-remove a worktree, reset, check
out over, stash, or use `git clean` to remove content. A confirmed clean,
ancestry-merged local branch MAY be a local-retire candidate. When a remote
counterpart exists, apply SHALL delete it only after confirming the remote
branch's changes are merged into the remote default branch; otherwise the remote
branch SHALL be left intact and reported as unresolved.

#### Scenario: Remote branch deleted only when merged to the remote default
- **WHEN** a retire-eligible local branch has a remote counterpart whose changes are proven merged into the remote default branch
- **THEN** apply may delete the remote branch after the local branch

#### Scenario: Unmerged remote branch is left intact
- **WHEN** a retire-eligible local branch has a remote counterpart whose changes are not proven merged into the remote default branch
- **THEN** apply retires only the local branch and leaves the remote branch intact, reporting it as unresolved

### Requirement: Receipt is durable and non-sensitive
A durable, non-sensitive audit/apply receipt SHALL record which entries were
selected, skipped, completed, or blocked, and SHALL be stored in a configurable
location that does not itself become an uncommitted cleanup candidate.

#### Scenario: Receipt is stored outside the worktree
- **WHEN** an audit or apply completes
- **THEN** its receipt is written to the configured external or Git metadata location with privacy-safe retention

### Requirement: The capability composes existing Git skills
The capability SHALL compose the existing Git inspection, topic-branch,
commit-authoring, and SDD lifecycle evidence capabilities rather than replacing
them or duplicating their policy.

#### Scenario: Audit composes existing Git evidence
- **WHEN** the audit classifies branches, worktrees, and working-tree changes
- **THEN** it reuses the existing Git inspection, topic-branch, commit-authoring, and SDD lifecycle evidence capabilities without duplicating their policy

