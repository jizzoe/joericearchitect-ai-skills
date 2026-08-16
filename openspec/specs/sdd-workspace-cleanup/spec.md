# sdd-workspace-cleanup Specification

## Purpose
Defines safe post-Archive cleanup of change-owned local resources proven
delivered by a bounded autonomous SDD lifecycle.
## Requirements
### Requirement: Cleanup uses exact durable ownership records
Cleanup SHALL inventory and mutate only selected-entry resources with durable
repository identity, role, path or branch, full head, ownership token,
delivery evidence, and recovery reference. It MUST classify legacy, ambiguous,
unregistered, primary, locked, dirty, or ownership-mismatched resources as
ineligible without changing them.

#### Scenario: Recorded clean worktree is eligible
- **WHEN** a non-primary registered worktree matches its ownership record and has no changes
- **THEN** cleanup may mark it eligible only after delivery and authorization gates pass

#### Scenario: Legacy or dirty resource is discovered
- **WHEN** inventory finds unrecorded or staged, unstaged, untracked, conflicted, or submodule changes
- **THEN** it reports the resource as ineligible and leaves it intact

### Requirement: Cleanup requires current post-Archive delivery evidence
Cleanup SHALL require visible archive, recorded delivery proof, a closed issue,
and configured Project Done evidence. It MUST accept squash or rebase delivery
only through exact pull-request and final-head evidence.

#### Scenario: Squash-delivered branch is reconciled
- **WHEN** exact merged pull-request evidence proves recorded final-head squash or rebase delivery
- **THEN** cleanup can evaluate the branch without retained ancestry

#### Scenario: Delivery evidence is stale
- **WHEN** archive, issue, Project, or pull-request evidence is absent, stale, or mismatched
- **THEN** cleanup pauses mutation and records the first unmet evidence boundary

### Requirement: Cleanup is idempotent and least-destructive
Cleanup SHALL support read-only audit, exact apply, and resume. It MUST remove
eligible worktrees before branches, use non-forced deletion when ancestry
permits, and force-delete local branches only after exact squash or rebase
evidence. It MUST never delete remote branches, force-remove worktrees, reset
a worktree, or expand the selected-entry target.

#### Scenario: Partial cleanup resumes
- **WHEN** earlier cleanup removed one eligible worktree but stopped before branch action
- **THEN** resume rereads its record and converges without repeating or widening removal
