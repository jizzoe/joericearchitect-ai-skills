# autonomous-sdd-v2-terminalization Specification

## Purpose

Defines evidence-bound closure of an exact completed v2 run so a released
repository claim cannot remain active and block a later autonomous delivery.

## Requirements

### Requirement: V2 terminalization is evidence-bound and exact
The system SHALL terminalize a v2 run only when the request binds one exact
repository identity, parent run, work unit, claim, approved change, and
current delivered lifecycle evidence. It MUST reject missing, stale, foreign,
conflicting, or incomplete evidence without changing the active run, claim,
or archive. It MUST NOT accept a manual durable-state edit or an inferred
target as terminalization evidence. A work unit that predates a later required
admission field MUST remain rejected unless an explicit, expiry-bound bootstrap
compatibility binding identifies that exact run and proves the original record
is preserved unchanged.

#### Scenario: Exact delivered run terminalizes
- **WHEN** an exact completed run has current delivery and cleanup evidence and
  a matching active claim
- **THEN** the system records terminal evidence, releases that claim, archives
  only that run, and rebuilds the repository status index

#### Scenario: Explicit pre-feature bootstrap record terminalizes
- **WHEN** one exact completed bootstrap run predates the configuration
  snapshot field and has a current compatibility binding, delivered Archive
  evidence, and matching active claim
- **THEN** the system terminalizes the original record without adding or
  claiming a configuration snapshot at admission

#### Scenario: Evidence is incomplete or mismatched
- **WHEN** a terminalization request has missing, stale, foreign, conflicting,
  or incomplete evidence, or a missing-snapshot record lacks the exact
  compatibility binding
- **THEN** the system returns a typed pause and leaves the active run and claim
  unchanged

### Requirement: Terminalization is idempotent and preserves audit evidence
The system SHALL return the existing terminal result when the same exact run is
terminalized again. It MUST retain immutable run records, terminal summary,
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

### Requirement: Exceptional bootstrap terminalization requires persisted cleanup attachment
Before terminalizing a bootstrap-compatible pre-feature work unit, the system
MUST verify a persisted cleanup attachment bound to the exact parent run, work
unit, claim, repository, approved change, and compatibility archive head. The
attachment MUST contain a completed or already-completed receipt for every
attached resource and an explicit retained classification for every bound
ineligible resource. A caller-supplied `cleanupCompleted` flag alone MUST NOT
serve as terminalization evidence.

#### Scenario: Attached cleanup permits exceptional terminalization
- **WHEN** the exact bootstrap compatibility binding and persisted cleanup
attachment prove every bound resource has a terminal receipt or retained
classification
- **THEN** the terminalizer may release and archive only that matching active
run without rewriting admission history

#### Scenario: Cleanup flag lacks attached receipts
- **WHEN** a bootstrap terminalization request asserts completed cleanup but
has no matching persisted cleanup attachment and receipts
- **THEN** the terminalizer returns a typed pause and preserves the active run
and claim

#### Scenario: Attachment belongs to another bootstrap run
- **WHEN** a persisted cleanup attachment does not exactly match the requested
bootstrap run or compatibility archive head
- **THEN** the terminalizer rejects it without releasing any claim

### Requirement: Expired unfinished controllers can be cancelled and retired
The system SHALL provide a receipt-backed cancellation/retirement operation for
an exact expired, unfinished controller. It MUST accept only the exact
controller, parent run, work unit, and claim identities, prove the run is
expired and not delivered, record the run as cancelled rather than completed,
preserve immutable history, and release only that exact claim. It MUST NOT
infer authority over another run or fabricate delivery-terminalization
evidence.

#### Scenario: Expired unfinished controller is cancelled
- **WHEN** an exact expired controller has an active claim and no delivered or terminalized evidence
- **THEN** the system records a cancellation receipt, marks the run cancelled, and releases only that exact claim

#### Scenario: Cancellation targets a delivered or unexpired run
- **WHEN** the exact controller is not yet expired or already has delivered or terminalized evidence
- **THEN** the system returns a typed pause and leaves the run and claim unchanged

#### Scenario: Cancellation identity is mismatched
- **WHEN** the cancellation request does not exactly match the controller, parent run, work unit, or claim
- **THEN** the system rejects it without releasing any claim
