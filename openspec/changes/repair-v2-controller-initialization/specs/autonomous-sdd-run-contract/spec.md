## MODIFIED Requirements

### Requirement: Admission derives stable repository identity and a singular claim authority
The system SHALL derive a repository ID from the configured canonical remote's
normalized credential-free fetch identity. A mutating v1 admission MUST pause
when that identity or the configured singular claim provider is missing,
ambiguous, or changes while a run or claim remains active. At most one mutating
v1 run MAY hold the repository claim at a time, independent of a worktree move,
removal, or fresh clone. A newly admitted v2 run MUST be bound to one immutable
controller run identity and its derived checkpoint before it is eligible for
lifecycle selection. The supported initialization transition MUST retain enough
typed, non-secret evidence to resume or reject an interrupted exact request;
it MUST NOT create an active claim that has no matching recoverable controller
context, and it MUST NOT attach a controller record to a historical, foreign,
or differently authorized v2 run.

#### Scenario: Fresh clone resolves the existing identity
- **WHEN** a fresh clone uses the same configured canonical remote as an
  existing repository state directory
- **THEN** it resolves to the same repository ID and conflicts with an active
  mutating claim rather than creating another active run

#### Scenario: Remote identity is unsafe or changed
- **WHEN** admission encounters a credential-bearing, missing, ambiguous, or
  unapproved changed canonical remote identity
- **THEN** it pauses before creating a mutating work unit or claim

#### Scenario: Initialization cannot persist controller context
- **WHEN** a new authorized v2 delivery cannot durably verify its exact
  controller context during initialization
- **THEN** it leaves no active repository claim, records only recoverable
  non-secret initialization evidence, and makes no lifecycle selection

#### Scenario: Retry names a different v2 run
- **WHEN** an initialization retry presents a controller identity, selected
  entry, repository, authorization digest, or expiry that differs from its
  persisted exact initialization evidence
- **THEN** it rejects the retry without modifying the existing run, claim, or
  controller context
