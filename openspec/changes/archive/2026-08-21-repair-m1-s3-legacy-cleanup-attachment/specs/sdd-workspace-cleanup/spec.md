## ADDED Requirements

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
