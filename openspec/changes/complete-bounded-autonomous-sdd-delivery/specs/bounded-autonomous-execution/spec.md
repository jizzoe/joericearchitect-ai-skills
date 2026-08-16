## ADDED Requirements

### Requirement: Target-explicit SDD shorthand resolves fixed profiles
The runner SHALL accept `ship-sdd <change-or-ordered-queue> prod` or
`prototype`, with optional explicit duration override, only when target is
explicit. It MUST report every effective authorization field before selection
or mutation and MUST not infer risk-bearing targets from aliases.

#### Scenario: Production shorthand is complete
- **WHEN** a user provides one explicit change with the `prod` alias
- **THEN** the runner resolves a four-hour autonomous production-rapid strict-only sdd-delivery authorization

#### Scenario: Shorthand target is omitted
- **WHEN** a user provides a profile alias without explicit change or queue
- **THEN** the runner requests the target and performs no lifecycle work

### Requirement: Delivery preparation writes are narrowly authorized
Within a valid selected-entry delivery run, the runner SHALL permit a
design-brief preparation write only when its exact output path is authorized.
It MUST preserve local-implementation behavior and reject arbitrary
workspace-write expansion.

#### Scenario: Unlisted path is requested
- **WHEN** delivery preparation targets a path absent from its record
- **THEN** the runner rejects the write before filesystem mutation
