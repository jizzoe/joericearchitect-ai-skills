# autonomous-sdd-run-status-and-recovery Specification

## Purpose

Defines repository-wide, read-only run status and safe recovery over the local
durable execution backend: discovery by canonical repository identity, a
versioned status projection, typed classifications, exact resume decisions, and
read-only projection rebuild.

## Requirements

### Requirement: Discovery is by canonical repository identity, not the current directory
The system SHALL discover active and archived runs by canonical repository
identity and the configured backend, never the caller's current directory or
nearest checkpoint file.

#### Scenario: Discovery ignores the caller's directory
- **WHEN** runs are discovered by canonical repository identity instead of the current directory
- **THEN** the same active and archived runs are found regardless of the caller's location

### Requirement: Status is a versioned, read-only projection that links evidence
The system SHALL emit a `run-status` record with a `schemaVersion`, reporting
run/work-unit identity, classification, stop reason, claim/owner, deadline, and
evidence linked by digest and reference. It MUST NOT inline evidence or secrets,
and a reader that does not recognize the version MUST fail closed.

#### Scenario: Status never inlines secrets or evidence
- **WHEN** a run-status projection is built
- **THEN** it links evidence by digest and reference and exposes no secret values

#### Scenario: An unrecognized status version fails closed
- **WHEN** a reader encounters a run-status version it does not recognize
- **THEN** it treats the status as ambiguous and does not resume

### Requirement: Classification is deterministic and fail-closed
The system SHALL classify a run into exactly one of `running`, `complete`,
`expired`, `waiting-human`, `retryable-infrastructure`, `quality-blocked`,
`configuration-discovery-gap`, or `ambiguous-legacy-state`, derived only from
durable facts. A missing, invalid, or inconsistent record SHALL classify as
`ambiguous-legacy-state`.

#### Scenario: Every durable state maps to exactly one classification
- **WHEN** a run's terminal receipts, claim state, deadline, and stop reason are evaluated
- **THEN** exactly one classification is produced and an inconsistent record fails closed to ambiguous-legacy-state

### Requirement: Complete requires terminal predicates and cleanup agreement
The system SHALL report `complete` only when a terminal receipt, a released
claim, and the matching cleanup disposition all agree.

#### Scenario: Terminal cleanup disagrees
- **WHEN** a terminal receipt exists but the claim disposition or cleanup disposition disagrees
- **THEN** the run is classified as ambiguous-legacy-state, not complete

### Requirement: Resume returns safe-resume, no-op, or a typed pause
The system SHALL return exactly one of `safe-resume`, `no-op`, or a typed pause
from a run-status. Wrong-run, wrong-repository, and unrecognized-status inputs
SHALL pause and MUST NOT resume or release a claim.

#### Scenario: A wrong identity cannot resume
- **WHEN** a resume request names a different repository or run
- **THEN** the system returns a typed pause and releases no claim

### Requirement: Projection rebuild is read-only with respect to history
The system SHALL rebuild stale or missing index projections from authoritative
history, rewriting only the index and never run history records.

#### Scenario: Rebuild never rewrites history
- **WHEN** the index projection is rebuilt from history
- **THEN** run history records are unchanged and only the index is rewritten
