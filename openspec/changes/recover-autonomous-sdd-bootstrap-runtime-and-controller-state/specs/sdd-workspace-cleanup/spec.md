## ADDED Requirements

### Requirement: Controller cleanup stages dependent local resources
When one exact controller cleanup record contains both clean owned worktrees and
their attached owned local branches, cleanup SHALL remove or durably reconcile
the eligible worktrees before evaluating branch eligibility. It MUST re-inspect
each branch after that worktree stage and preserve receipt-coupled, exact-owned,
least-destructive behavior. It MUST leave a dirty, locked, primary,
unregistered, delivery-mismatched, or remotely scoped resource untouched.

#### Scenario: Attached branches follow completed worktree cleanup
- **WHEN** an exact completed controller record contains clean registered worktrees and their locally attached branches with current delivery evidence
- **THEN** cleanup records each worktree outcome, re-inspects the branches after the worktree stage, and deletes only the now-unreferenced eligible local branches

#### Scenario: Unsafe resource stops its own cleanup stage
- **WHEN** a registered worktree or branch is dirty, locked, primary, mismatched, or otherwise ineligible during its applicable fresh inspection
- **THEN** cleanup records the recovery boundary and does not remove that resource or widen to another resource

#### Scenario: Remote branch remains out of scope
- **WHEN** controller cleanup reconciles a matching local branch after its worktree is gone
- **THEN** it does not delete, force-push, or otherwise mutate the corresponding remote branch
