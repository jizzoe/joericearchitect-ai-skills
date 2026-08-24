## ADDED Requirements

### Requirement: Strict review terminalizes exactly once
The system SHALL terminalize every strict review deterministically and exactly
once across success, failure, timeout, and crash. A reviewer process that exits
before creating its owned result artifact and one that exits after creating it
SHALL each yield one deterministic terminal record for the exact sealed package
and transition. The system MUST NOT emit duplicate or conflicting terminal
records.

#### Scenario: Exit before result creation
- **WHEN** the reviewer process exits before creating its owned result artifact
- **THEN** the system records one deterministic terminal unavailable record and no conflicting result

#### Scenario: Exit after result creation
- **WHEN** the reviewer process exits after creating its owned result artifact
- **THEN** the system records exactly one terminal record and never a second duplicate

#### Scenario: Timeout or crash still terminalizes once
- **WHEN** the reviewer transport times out or the process crashes
- **THEN** the system records exactly one deterministic terminal record for that sealed package and transition

### Requirement: Wrong-package review results are rejected
The system SHALL reject a review result whose sealed package digest, base, or
head binding does not match the exact sealed package for the transition. A
result produced for a different package or head SHALL NOT satisfy the review
gate and MUST NOT be accepted as evidence.

#### Scenario: Result for a different package is rejected
- **WHEN** a result binds a package digest or base/head other than the exact sealed package
- **THEN** the system rejects the result and does not treat it as review evidence

### Requirement: Temporary review resources clean exactly or retain an actionable recovery record
The system SHALL remove every owned temporary review resource exactly once on
completion. When removal cannot be confirmed, the system SHALL retain an
actionable recovery record that identifies the owned resource and the required
cleanup without retaining review content, credentials, or secrets.

#### Scenario: Successful cleanup removes the owned view exactly once
- **WHEN** a review completes and its owned view is removed successfully
- **THEN** no owned temporary resource remains and no duplicate removal is attempted

#### Scenario: Cleanup failure retains an actionable recovery record
- **WHEN** owned temporary resource removal cannot be confirmed
- **THEN** the system retains an actionable recovery record identifying the resource and cleanup action, without review content or secrets
