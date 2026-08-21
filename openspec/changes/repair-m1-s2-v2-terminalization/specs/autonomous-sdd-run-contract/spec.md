## MODIFIED Requirements

### Requirement: Only reconciled terminal bundles can archive
The system SHALL retain active, paused, and unreconciled runs in the active
run area. It MUST archive a run only while the repository claim is held, all
work units are terminal, no claim, cleanup, recovery, prepared, in-flight, or
in-doubt attempt remains, and a projection rebuilt from history matches the
stored projection. A supported terminalization operation MUST verify and record
the run's terminal summary and released-claim disposition before archive. Archive
output MUST preserve an immutable manifest, record digests, reason, time, and
archive reference. It MUST NOT automatically delete archived audit evidence.

#### Scenario: Fully reconciled terminal run archives
- **WHEN** every work unit is terminal and history reconstruction matches its
  projection with no unresolved claim, cleanup, recovery, or attempt
- **THEN** the verified bundle moves to its date-partitioned archive and the
  repository index is rebuilt

#### Scenario: Supported terminalization closes an exact delivered run
- **WHEN** a controller verifies exact delivery, cleanup, identity, and claim
  evidence for an active completed run
- **THEN** it records a terminal summary and released-claim disposition before
  moving only that verified bundle to the archive

#### Scenario: Paused run is considered for archive
- **WHEN** a run remains paused, ambiguous, cleanup-pending, or has an
  unresolved transition attempt
- **THEN** it remains active and no archive or evidence deletion occurs
