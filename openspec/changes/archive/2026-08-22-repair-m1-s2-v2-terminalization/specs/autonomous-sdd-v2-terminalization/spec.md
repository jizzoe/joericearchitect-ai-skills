## Purpose

Defines evidence-bound closure of an exact completed v2 run so a released
repository claim cannot remain active and block a later autonomous delivery.

## ADDED Requirements

### Requirement: V2 terminalization is evidence-bound and exact
The system SHALL terminalize a v2 run only when the request binds one exact
repository identity, parent run, work unit, claim, approved change, and
current delivered lifecycle evidence. It MUST reject missing, stale, foreign,
conflicting, or incomplete evidence without changing the active run, claim,
or archive. It MUST NOT accept a manual durable-state edit or an inferred
target as terminalization evidence.

#### Scenario: Exact delivered run terminalizes
- **WHEN** an exact completed run has current delivery and cleanup evidence and
  a matching active claim
- **THEN** the system records terminal evidence, releases that claim, archives
  only that run, and rebuilds the repository status index

#### Scenario: Evidence is incomplete or mismatched
- **WHEN** a terminalization request has missing, stale, foreign, conflicting,
  or incomplete evidence
- **THEN** the system returns a typed pause and leaves the active run and claim
  unchanged

### Requirement: Terminalization is idempotent and preserves audit evidence
The system SHALL return the existing terminal result when the same exact run is
terminalized again. It MUST retain the immutable run records, terminal summary,
archive manifest, and index reference. It MUST NOT create a new v2 run, remove
audit evidence, or mutate an unrelated claim while terminalizing a run.

#### Scenario: Terminalization is retried after success
- **WHEN** the same exact terminalization request is repeated after the run has
  already been archived
- **THEN** the system reports the existing terminal result without duplicating
  history or modifying another run

### Requirement: A terminalized run no longer blocks later admission
The system SHALL treat an exact archived run with released-claim terminal
evidence as non-active for a later v2 admission. It MUST continue to refuse
admission when any other active, paused, ambiguous, or unreconciled run owns
the repository claim.

#### Scenario: Later admission follows terminalization
- **WHEN** a later autonomous delivery is admitted after an exact prior run was
  terminalized and no other active claim exists
- **THEN** admission can proceed without treating the archived run as active

#### Scenario: Another claim remains active
- **WHEN** a later autonomous delivery finds an active, paused, ambiguous, or
  unreconciled claim after a different run was terminalized
- **THEN** admission pauses and preserves the remaining claim as recovery
evidence
