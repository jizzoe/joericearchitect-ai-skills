## Purpose

Defines deterministic, validated, redacted configuration provenance sealed at
autonomous SDD admission.

## Requirements

### Requirement: Admission seals one validated runtime configuration snapshot
The system SHALL resolve only a versioned product runtime namespace and the
sealed request in fixed precedence before admission. It MUST persist a canonical
redacted snapshot and digest, reject unknown fields, conflicts, unsafe paths,
secret-shaped values, and unapproved sources, and MUST NOT reread configuration
to alter the admitted run.

#### Scenario: Safe defaults fill an absent request field
- **WHEN** a validated allowlisted product default is absent from sealed intent
- **THEN** admission seals the resolved value and its safe provenance

#### Scenario: Unsafe or conflicting source is supplied
- **WHEN** configuration contains an unknown field, secret-shaped value,
  unsafe path, or conflicts with sealed authority
- **THEN** admission pauses before persisting a run or claim

### Requirement: Live facts cannot rewrite sealed configuration
The system SHALL recheck live capability and permission facts before external
actions without allowing those facts to modify the sealed configuration,
authority, identity, policy, provider, or reviewer selection.

#### Scenario: A later environment value changes
- **WHEN** a later gate observes a changed ambient environment value
- **THEN** it reports live availability separately and retains the admitted
  snapshot unchanged
