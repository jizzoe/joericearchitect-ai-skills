## ADDED Requirements

### Requirement: Controller phase advancement is an executable durable transition
The installed autonomous SDD controller SHALL expose a transition that advances
only the first incomplete lifecycle phase of an admitted exact run. It MUST
require current evidence whose exact phase, reference, relative artifact paths,
and SHA-256 digests validate against regular, non-metadata files beneath the
target repository; validate the selected entry, authorization, repository, checkpoint
identity, expiry, and phase order; and persist the updated checkpoint before
reporting success. The transition MUST reject a skipped, stale, conflicting,
expired, caller-substituted, malformed, or artifact-mismatched phase without
changing the record.

#### Scenario: Completed proposal advances to planning review
- **WHEN** an admitted controller has `propose` as its first incomplete phase
  and receives current evidence bound to its exact proposal artifacts
- **THEN** the controller persists `propose` as complete and reports
  `planning-review` as the next phase

#### Scenario: Caller attempts to skip or replace a phase
- **WHEN** a request names any phase other than the record's first incomplete
  phase or supplies stale/conflicting evidence
- **THEN** the controller returns a typed pause and preserves the checkpoint

#### Scenario: Phase evidence does not bind exact artifacts
- **WHEN** evidence has missing, extra, phase-mismatched, unsafe, metadata,
  symlinked, or digest-mismatched artifacts
- **THEN** the controller returns a typed pause and preserves the checkpoint

#### Scenario: Equivalent Claude and Codex requests use one transition
- **WHEN** equivalent valid phase-evidence requests are submitted through
  Claude and Codex installed exposure
- **THEN** both use the same canonical controller transition and only the
  first idempotent persistence changes the exact checkpoint
