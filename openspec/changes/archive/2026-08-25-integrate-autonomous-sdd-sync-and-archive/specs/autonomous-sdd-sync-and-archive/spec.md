# autonomous-sdd-sync-and-archive Specification

## Purpose

Makes Sync (delta-to-living-spec) and Archive (content-preserving move) two
separately delivered, evidenced, recoverable lifecycle transitions with
deterministic conflict detection and repeat no-op proof.

## ADDED Requirements

### Requirement: Sync applies only the authorized delta
Sync SHALL apply only the authorized delta to its living-spec capability and
MUST NOT invent, drop, duplicate, or text-corrupt any requirement description or
scenario.

#### Scenario: Invented requirement is rejected
- **WHEN** a delta adds a requirement whose text differs from the authorized
  delta content
- **THEN** the sync reports a conflict and does not write the living spec

#### Scenario: Dropped or duplicated requirement is rejected
- **WHEN** a `MODIFIED` replacement drops a prior scenario or duplicates a
  requirement id
- **THEN** the sync reports a conflict and does not write the living spec

### Requirement: Repeat Sync is a no-op
Applying a delta to a living spec that already reflects the delta SHALL produce
no change, and a second Sync SHALL be provably a no-op.

#### Scenario: Second sync changes nothing
- **WHEN** a delta is applied to a living spec that already contains its result
- **THEN** the system reports no change and writes nothing

### Requirement: MODIFIED is a complete replacement
A `MODIFIED` requirement SHALL replace the entire prior requirement. Two active
changes that both `MODIFIED` the same requirement, or one that `MODIFIED` while
another `ADDED` the same id, SHALL conflict and be serialized or reconciled
before any mutation.

#### Scenario: Two replacements of one requirement conflict
- **WHEN** two active deltas both replace the same requirement id
- **THEN** the overlap graph reports a conflict and mutation is paused

### Requirement: Overlap graph pauses fail-closed before mutation
The system SHALL build an active-delta graph by capability, requirement, and
operation before Sync. An unresolved overlap SHALL pause before mutation.
Disjoint capabilities SHALL NOT conflict.

#### Scenario: Disjoint capabilities do not conflict
- **WHEN** two active deltas touch different capabilities
- **THEN** the overlap graph reports no conflict

#### Scenario: Unresolved overlap pauses
- **WHEN** a shared capability has an unresolved requirement-level conflict
- **THEN** the system pauses and performs no Sync mutation

### Requirement: Archive is content-preserving
Archive SHALL preserve the proposal, specs, design, tasks, and evidence of the
change bundle verbatim, and SHALL NOT run before implementation and Sync are
confirmed on the default branch.

#### Scenario: Missing artifact blocks archive
- **WHEN** a required artifact is absent from the archived bundle
- **THEN** the archive plan reports the missing artifact and does not archive

### Requirement: Archive is idempotent and destination-unique
Archive SHALL derive a `YYYY-MM-DD-<change>` destination and treat a second
archive of the same change as a no-op. A destination held by a different change
SHALL be a conflict.

#### Scenario: Already-archived change is a no-op
- **WHEN** a change already exists at its derived archive destination
- **THEN** the archive plan reports `already-archived` without moving anything

#### Scenario: Different change at destination conflicts
- **WHEN** the derived destination is held by a different change
- **THEN** the archive plan reports a conflict and does not move anything

### Requirement: Sync precedes Archive
Archive SHALL follow a delivered Sync checkpoint, consistent with
`canonicalLifecycleSteps` (sync-change before archive-change).

#### Scenario: Archive before Sync is rejected
- **WHEN** Archive is requested before the Sync checkpoint is delivered
- **THEN** the system rejects it and requires Sync first
