## ADDED Requirements

### Requirement: Autonomous continuation persists v2 admission before lifecycle selection
The system SHALL persist a v2 parent run and isolated selected work unit before
it selects an OpenSpec lifecycle phase for an autonomous `sdd-delivery`
request. The persisted admission MUST bind the normalized authorization digest,
repository identity, history provider, claim provider, immutable run identity,
derived checkpoint reference, selected change, expiry, and initial ownership
generation without credentials or standing approval. Controller entrypoints
MUST expose a durable initial-admission operation and MUST reject a request
whose existing durable identity, authorization, repository, provider binding,
expiry, or selected work unit conflicts.

#### Scenario: Valid target-explicit autonomous request begins
- **WHEN** a valid unexpired autonomous `sdd-delivery` request names one
  change and its repository passes v2 admission
- **THEN** the system durably records the parent run and selected work unit
  before it reports or executes the first lifecycle checkpoint

#### Scenario: Controller only constructs an ephemeral record
- **WHEN** a controller entrypoint can construct an admission record but cannot
  durably persist the exact v2 admission transition
- **THEN** it reports admission unavailable and does not select or execute a
  lifecycle phase

#### Scenario: Resume conflicts with immutable admission
- **WHEN** a resumed request conflicts with durable run identity,
  authorization, selected work unit, repository identity, provider binding, or
  expiry
- **THEN** the system pauses before lifecycle selection and preserves the
  original records for recovery

### Requirement: Cross-assistant entrypoints use the same v2 admission contract
The system SHALL expose the same v2 admission, inspection, and recovery
behavior through assistant-neutral canonical assets and thin Claude/Codex
wrappers. A wrapper MUST NOT create a competing run record, infer a worktree
location as repository identity, or relax v2 claim and history checks.

#### Scenario: Codex and Claude submit equivalent requests
- **WHEN** equivalent valid autonomous requests are submitted through Codex and
  Claude entrypoints against the same repository
- **THEN** both resolve the same contract behavior and the second mutating
  admission is rejected while the first repository claim remains active
