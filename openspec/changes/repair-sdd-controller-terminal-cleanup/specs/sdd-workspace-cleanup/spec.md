## MODIFIED Requirements

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
terminal outcome receipt outside removable worktrees.

#### Scenario: Squash-delivered branch is reconciled
- **WHEN** exact merged pull-request evidence proves recorded final-head squash or rebase delivery
- **THEN** cleanup can evaluate the branch without retained ancestry

#### Scenario: Delivery evidence is stale
- **WHEN** archive, issue, Project, or pull-request evidence is absent, stale, or mismatched
- **THEN** cleanup pauses mutation and records the first unmet evidence boundary

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
