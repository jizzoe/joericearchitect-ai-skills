## ADDED Requirements

### Requirement: Cancellation receipts are first-class run-contract records
The run contract SHALL model a `cancellation-receipt` record bound to the exact
controller run, parent run, work unit, claim, repository, approved change,
request digest, and expiry. A `claim-release` record MUST reference exactly one
receipt digest, either a terminalization receipt or a cancellation receipt. A
terminal summary MAY record `terminalStatus: cancelled` with a null final head
and null child-history fields, and MUST still bind the exact work unit, ordinal,
approved change, start and terminal timestamps, attempt and correction counts,
release disposition, cleanup disposition, and summary digest.

#### Scenario: Cancellation receipt validates and round-trips
- **WHEN** a cancellation-receipt record binds the exact identities and digests
- **THEN** the record validates, serializes, and round-trips like other contract records

#### Scenario: Claim release references exactly one receipt
- **WHEN** a claim-release record omits both receipt digests or supplies both a terminalization and a cancellation digest
- **THEN** validation rejects it

#### Scenario: Cancelled summary omits completed-head fields
- **WHEN** a terminal summary records `terminalStatus: cancelled`
- **THEN** it carries a null final head and null child-history fields while retaining the exact run identity, dispositions, and summary digest
