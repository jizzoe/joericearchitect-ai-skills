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
ineligible without changing them. A resource record MUST be created before or
when that resource is created or selected; cleanup MUST NOT infer or
post-Archive-backfill ownership. A legacy resource may become eligible only
through a distinct owner-authorized migration record that captures a fresh,
human-reviewed identity and delivery proof before cleanup is planned.
Before each controller-coupled cleanup plan, it MUST obtain a fresh inspection
of every recorded resource for mutable eligibility state, including existence,
worktree primary/lock/registration/cleanliness/checkpoint state, or branch
reachability state. A controller MUST pause rather than classify cleanup as
complete if that inspection is missing, fails, or leaves any resource
ineligible.

#### Scenario: Recorded clean worktree is eligible
- **WHEN** a non-primary registered worktree matches its ownership record and has no changes
- **THEN** cleanup may mark it eligible only after delivery and authorization gates pass

#### Scenario: Legacy or dirty resource is discovered
- **WHEN** inventory finds unrecorded or staged, unstaged, untracked, conflicted, or submodule changes
- **THEN** it reports the resource as ineligible and leaves it intact

#### Scenario: Fresh worktree inspection permits exact cleanup
- **WHEN** a controller-held worktree record has current delivery evidence and
  fresh inspection proves it is non-primary, unlocked, registered, clean, and
  has no unresolved checkpoint-retention boundary
- **THEN** the controller may create its receipt-coupled cleanup plan and remove
  only that exact worktree

#### Scenario: Fresh inspection is incomplete
- **WHEN** controller cleanup lacks fresh inspection or any registered resource
  remains ineligible after that inspection
- **THEN** it pauses without removal and does not report cleanup complete

#### Scenario: Unregistered historical resource is discovered
- **WHEN** a branch or worktree lacks a contemporaneous lifecycle ownership
  record
- **THEN** cleanup classifies it as legacy and does not create ownership data
  from its name, path, history, or prior chat state

#### Scenario: Owner-authorized legacy migration is complete
- **WHEN** an owner-approved migration record binds a freshly inspected legacy
  resource to exact repository, ownership, pull-request, and delivery evidence
- **THEN** cleanup may evaluate that resource under the normal exact-owned
  rules without expanding to any other legacy resource

### Requirement: Cleanup requires current post-Archive delivery evidence
Cleanup SHALL require visible archive, recorded delivery proof, a closed issue,
and configured Project Done evidence. It MUST accept squash or rebase delivery
only through exact pull-request and final-head evidence. Cleanup MUST evaluate
each registered resource against its own current delivery binding and retain a
terminal outcome receipt outside removable worktrees. If a fresh inspection
finds an exactly registered resource already absent, cleanup MUST persist an
`already-completed` receipt rather than treating it as ineligible. If a second
fresh inspection mismatches the planned resource, cleanup MUST persist a
blocked recovery receipt and perform no destructive action.

#### Scenario: Squash-delivered branch is reconciled
- **WHEN** exact merged pull-request evidence proves recorded final-head squash or rebase delivery
- **THEN** cleanup can evaluate the branch without retained ancestry

#### Scenario: Delivery evidence is stale
- **WHEN** archive, issue, Project, or pull-request evidence is absent, stale, or mismatched
- **THEN** cleanup pauses mutation and records the first unmet evidence boundary

#### Scenario: Resource disappeared after an interrupted cleanup
- **WHEN** fresh inspection finds an exact registered resource absent before
  cleanup action execution
- **THEN** cleanup persists an `already-completed` receipt and resumes without
  attempting removal

#### Scenario: Resource changes after cleanup planning
- **WHEN** the second fresh inspection no longer matches the exact planned
  resource
- **THEN** cleanup persists a blocked recovery receipt and leaves the resource
  unchanged

#### Scenario: Multiple lifecycle branches have distinct delivery heads
- **WHEN** registered implementation, Sync, and Archive branches each have a
  different exact merged pull request and default-branch delivery head
- **THEN** cleanup evaluates every resource using its own binding and does not
  reject an otherwise valid earlier resource solely because a later checkpoint
  has a different delivered head

#### Scenario: Controller checkpoint makes a target worktree dirty
- **WHEN** a worktree contains a runtime controller checkpoint but the
  controller cannot prove that a terminal receipt exists outside the worktree
- **THEN** cleanup leaves the worktree intact and reports a checkpoint-retention
  recovery boundary rather than discarding the checkpoint

### Requirement: Cleanup is idempotent and least-destructive
Cleanup SHALL support read-only audit, exact apply, and resume. It MUST remove
eligible worktrees before branches, use non-forced deletion when ancestry
permits, and force-delete local branches only after exact squash or rebase
evidence. It MUST never delete remote branches, force-remove worktrees, reset
a worktree, or expand the selected-entry target.

#### Scenario: Partial cleanup resumes
- **WHEN** earlier cleanup removed one eligible worktree but stopped before branch action
- **THEN** resume rereads its record and converges without repeating or widening removal

### Requirement: Bootstrap cleanup remains exact and staged
An owner-authorized bootstrap cleanup attachment SHALL evaluate only the
resources individually named by its repair binding. It MUST remove an eligible
worktree before considering its dependent branch, require a new fresh
inspection and separately signed migration for that branch after worktree
removal, and retain any resource whose current head lacks exact delivered
pull-request evidence. It MUST not delete remote branches, infer ownership,
force-remove worktrees, or expand to another legacy resource.

#### Scenario: Attached worktree cleans before its branch
- **WHEN** a named migrated worktree passes current delivery and mutable
eligibility checks
- **THEN** cleanup persists its receipt before removing only that worktree and
leaves the associated branch for a later fresh migration and inspection

#### Scenario: Legacy branch has a nonmatching current head
- **WHEN** a named legacy branch head differs from the merged pull request
head in its only delivery record
- **THEN** cleanup records it as retained and performs no branch deletion

#### Scenario: Later branch migration is not fresh
- **WHEN** a branch migration was signed before its dependent worktree was
removed or its fresh inspection no longer matches
- **THEN** cleanup pauses without deleting that branch
