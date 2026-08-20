## Purpose

Defines a backend-neutral, durable and isolated run/work-unit contract that
lets autonomous SDD safely admit, resume, archive, and audit one change.

## ADDED Requirements

### Requirement: Run history has one authoritative and isolated ownership model
The system SHALL model a parent run, work units, transition attempts, resource
claims, immutable history, and rebuildable projections as distinct contract
records. A parent run MUST bind approved intent, deadline, history provider,
claim provider, and only an allowlisted terminal summary for each child. A work
unit MUST own its authorization/configuration digests, role handoffs, evidence
namespace, attempts, derived resources, and cleanup. A parent projection MUST
NOT copy child evidence, authorization, configuration, attempts, resources,
tokens, or role handoffs.

#### Scenario: Rebuildable parent projection
- **WHEN** a completed work unit has isolated history and a terminal summary
- **THEN** the system rebuilds the parent projection from its allowlisted
  summary without treating that projection as authoritative history

#### Scenario: Cross-work-unit field is supplied
- **WHEN** a parent record or another work unit supplies child-owned evidence,
  resources, authorization, configuration, attempts, tokens, or handoffs
- **THEN** validation rejects the record before it becomes authoritative

### Requirement: Admission derives stable repository identity and a singular claim authority
The system SHALL derive a repository ID from the configured canonical remote's
normalized credential-free fetch identity. A mutating v1 admission MUST pause
when that identity or the configured singular claim provider is missing,
ambiguous, or changes while a run or claim remains active. At most one
mutating v1 run MAY hold the repository claim at a time, independent of a
worktree move, removal, or fresh clone.

#### Scenario: Fresh clone resolves the existing identity
- **WHEN** a fresh clone uses the same configured canonical remote as an
  existing repository state directory
- **THEN** it resolves to the same repository ID and conflicts with an active
  mutating claim rather than creating another active run

#### Scenario: Remote identity is unsafe or changed
- **WHEN** admission encounters a credential-bearing, missing, ambiguous, or
  unapproved changed canonical remote identity
- **THEN** it pauses before creating a mutating work unit or claim

### Requirement: Claims use native exclusion and generation fencing
The system SHALL require equivalent native exclusive repository-lock and
generation-fencing semantics on supported Windows, macOS, and Linux hosts. It
MUST reject admission when the selected local provider cannot prove those
semantics. It MUST NOT use timeout-based stale reclamation, PID-only locking,
or a weaker platform-specific mode. An unclean claim owner MAY be replaced
only by explicit takeover after conclusive recorded host/boot/PID-start
absence and reconciliation of every in-flight external attempt; unresolved
attempts remain in-doubt and block mutation.

#### Scenario: Delayed former owner attempts a write
- **WHEN** an explicit takeover advances the repository ownership generation
  and a former owner later attempts a state mutation
- **THEN** the mutation is rejected by the current generation check

#### Scenario: Owner liveness is uncertain
- **WHEN** a claimant cannot conclusively establish the recorded owner's
  absence or reconcile an in-flight external attempt
- **THEN** it preserves recovery evidence and refuses takeover or mutation

### Requirement: State advancement is immutable, durable, and attempt-bound
The system SHALL publish each authoritative record as a new immutable record.
A transition attempt MUST have a unique identity, idempotency key,
precondition/target digests, ownership generation, write-ahead state, receipt,
and result. Publication MUST provide an atomic same-directory visibility
boundary using platform-supported durable-write primitives. A record MUST be
rejected when its backend/history or claim-provider binding is mutable, its
identity is duplicated, its kind is unknown, or its evidence belongs to
another work unit.

#### Scenario: Retried external transition has the same idempotency key
- **WHEN** a work unit resumes a prepared transition attempt after interruption
- **THEN** it reconciles the attempt using its stable identity and idempotency
  key before it can create another external mutation

#### Scenario: Unknown record kind is encountered
- **WHEN** an authoritative history reader encounters an unsupported record kind
- **THEN** it rejects continuation and retains the record as audit evidence

### Requirement: Only reconciled terminal bundles can archive
The system SHALL retain active, paused, and unreconciled runs in the active
run area. It MUST archive a run only while the repository claim is held, all
work units are terminal, no claim, cleanup, recovery, prepared, in-flight, or
in-doubt attempt remains, and a projection rebuilt from history matches the
stored projection. Archive output MUST preserve an immutable manifest, record
digests, reason, time, and archive reference. It MUST NOT automatically delete
archived audit evidence.

#### Scenario: Fully reconciled terminal run archives
- **WHEN** every work unit is terminal and history reconstruction matches its
  projection with no unresolved claim, cleanup, recovery, or attempt
- **THEN** the verified bundle moves to its date-partitioned archive and the
  repository index is rebuilt

#### Scenario: Paused run is considered for archive
- **WHEN** a run remains paused, ambiguous, cleanup-pending, or has an
  unresolved transition attempt
- **THEN** it remains active and no archive or evidence deletion occurs

### Requirement: Cutover preserves legacy audit evidence without dual authority
The system SHALL inventory legacy controller and checkpoint records before v2
admission is enabled for a repository. It MUST classify compatible legacy
records deterministically and leave ambiguous records immutable and
actionable. After v2 enablement, legacy creation and advancement MUST be
disabled, legacy records remain read-only, and no run MAY have both a legacy
and v2 official record. Rollback MUST preserve that single-authority rule.

#### Scenario: Ambiguous legacy record is discovered
- **WHEN** inventory cannot map a legacy record unambiguously
- **THEN** the system preserves it unchanged, reports an actionable migration
  classification, and refuses automatic migration

### Requirement: Domain serialization remains backend-neutral
The system SHALL define portable domain records independently of local or
future workflow-backend serialization. A supported backend adapter MUST prove
round-trip preservation of domain content and digest-relevant fields without
adding backend-specific fields to the domain schema.

#### Scenario: Local and mock future-backend serialization
- **WHEN** the same valid domain record is serialized and read by local and
  mock future-backend adapters
- **THEN** both yield the same validated domain content and digest-relevant
  fields without backend-specific domain fields
