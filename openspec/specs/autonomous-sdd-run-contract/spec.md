# autonomous-sdd-run-contract Specification

## Purpose

Defines a backend-neutral, durable and isolated run/work-unit contract that
lets autonomous SDD safely admit, resume, archive, and audit one change.

## Requirements

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
worktree move, removal, or fresh clone. A newly admitted v2 run MUST be bound
to one immutable controller run identity and its derived checkpoint before it
is eligible for lifecycle selection. The supported initialization transition
MUST retain enough typed, non-secret evidence to resume or reject an
interrupted exact request; it MUST NOT create an active claim that has no
matching recoverable controller context, and it MUST NOT attach a controller
record to a historical, foreign, or differently authorized v2 run.

#### Scenario: Fresh clone resolves the existing identity
- **WHEN** a fresh clone uses the same configured canonical remote as an
  existing repository state directory
- **THEN** it resolves to the same repository ID and conflicts with an active
  mutating claim rather than creating another active run

#### Scenario: Remote identity is unsafe or changed
- **WHEN** admission encounters a credential-bearing, missing, ambiguous, or
  unapproved changed canonical remote identity
- **THEN** it pauses before creating a mutating work unit or claim

#### Scenario: Initialization cannot persist controller context
- **WHEN** a new authorized v2 delivery cannot durably verify its exact
  controller context during initialization
- **THEN** it leaves no active repository claim, records only recoverable
  non-secret initialization evidence, and makes no lifecycle selection

#### Scenario: Retry names a different v2 run
- **WHEN** an initialization retry presents a controller identity, selected
  entry, repository, authorization digest, or expiry that differs from its
  persisted exact initialization evidence
- **THEN** it rejects the retry without modifying the existing run, claim, or
  controller context

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

### Requirement: Cutover preserves legacy audit evidence without dual authority
The system SHALL inventory only legacy controller and checkpoint candidates
before v2 admission is enabled for a repository. Candidate discovery MUST
exclude unrelated JSON and MAY exclude only the initializer's exact current
pending controller checkpoint through an internally derived path binding; a
caller MUST NOT be able to nominate another legacy record for exclusion. The
system MUST classify compatible legacy records deterministically and leave
malformed, unknown-schema, or otherwise ambiguous records at genuine legacy
controller locations immutable and actionable. After v2 enablement, legacy
creation and advancement MUST be disabled, legacy records remain read-only,
and no run MAY have both a legacy and v2 official record. Rollback MUST preserve
that single-authority rule.

#### Scenario: Ambiguous legacy record is discovered
- **WHEN** inventory cannot map a record at a genuine legacy controller or
  checkpoint location unambiguously
- **THEN** the system preserves it unchanged, reports an actionable migration
  classification, and refuses automatic migration

#### Scenario: Unrelated JSON is present in controller state
- **WHEN** repository-common controller state contains an initializer request,
  receipt, or other JSON that is not a legacy controller candidate
- **THEN** legacy inventory excludes it from classification without deleting or
  rewriting it

#### Scenario: Initializer excludes its exact pending controller
- **WHEN** controller-first initialization persists its schema-5 pending
  checkpoint before invoking v2 admission
- **THEN** legacy inventory excludes only that internally derived exact path and
  continues to inspect every other genuine legacy controller candidate

#### Scenario: Caller attempts to exclude a legacy controller
- **WHEN** a direct admission caller supplies an exclusion for an active,
  ambiguous, or unrelated legacy controller record
- **THEN** the public admission boundary ignores or rejects that exclusion and
  retains the normal fail-closed legacy classification

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

### Requirement: Legacy bootstrap reconciliation is evidence-bound and non-mutating
The system SHALL allow an explicitly owner-authorized reconciliation of an
identified active legacy bootstrap controller record only by publishing a new,
immutable reconciliation receipt outside the legacy record. The receipt MUST
bind the legacy record's exact path and digest, selected change, repository
identity, authorized reconciliation scope and expiry, and fresh independently
verified issue, implementation, Sync, Archive, and exact-owned cleanup
evidence. Reconciliation MUST preserve the legacy record byte-for-byte, MUST
NOT create, advance, migrate, or claim a v2 run, and MUST reject any record,
authorization, evidence, expiry, or digest mismatch. The receipt MUST be
idempotent for the same input and MUST retain a recovery classification rather
than delete or overwrite audit evidence.

#### Scenario: Exact completed bootstrap record reconciles
- **WHEN** an owner-authorized reconciliation names a legacy record whose exact
  digest and selected change match fresh evidence for its closed issue, merged
  implementation, Sync, and Archive deliveries, and completed owned-resource
  cleanup
- **THEN** the system publishes one immutable terminal-reconciliation receipt
  outside the legacy record and leaves that record unchanged

#### Scenario: Evidence or identity is incomplete
- **WHEN** a proposed reconciliation lacks current evidence, has a mismatched
  record digest, selected change, repository, authorization scope, or expiry,
  or cannot prove exact owned-resource cleanup
- **THEN** the system retains the legacy record unchanged, publishes no
  terminal receipt, and reports a non-mutating pause with recovery evidence

#### Scenario: Reconciliation is retried
- **WHEN** the same authorized legacy record and evidence are submitted after a
  terminal reconciliation receipt already exists
- **THEN** the system returns the existing receipt without duplicating a record
  or changing legacy or v2 authority

### Requirement: V2 admission recognizes only verified terminal legacy reconciliation
The system SHALL continue to pause v2 admission for every active or ambiguous
legacy record unless a current immutable terminal-reconciliation receipt binds
that exact legacy record and proves the required completed lifecycle evidence.
Admission MUST treat the receipt as retirement of legacy blocking authority
only; it MUST NOT treat it as a v2 parent run, work unit, native claim,
transition attempt, or proof of authority for any new lifecycle action.

#### Scenario: Reconciled legacy record no longer blocks admission
- **WHEN** legacy inventory finds an active legacy record with a valid exact
  terminal-reconciliation receipt
- **THEN** it classifies that record as compatible terminal for admission while
  retaining both the legacy record and receipt as audit evidence

#### Scenario: Unrelated legacy record remains active
- **WHEN** legacy inventory finds an active or ambiguous legacy record without
  a valid exact terminal-reconciliation receipt
- **THEN** v2 admission pauses before creating a parent run, work unit, or
  native claim

### Requirement: Terminal v2 controller compatibility is archive-bound
The system SHALL derive terminal compatibility for a schema-5 controller only
from validated immutable domain records in the configured repository's contained
archive. The evidence MUST include the archived parent run, work unit, resource
claim, claim release, and terminal projection, plus exactly one terminal receipt:
either a `terminalization-receipt` or a `cancellation-receipt`. A terminalization
bundle MUST additionally require the controller's checkpoint to be terminal-looking
(no current phase and every step complete); a cancellation bundle MUST instead
bind the receipt's controller run identity and expiry to the controller while the
checkpoint remains at its cancelled phase. The system MUST verify record digests
and mutual identities, and MUST bind the controller's repository, authorization
digest, expiry, selected change, provider, parent run, work unit, claim, final
status, and released cleanup disposition. Files outside the derived repository
archive, symbolic-link escapes, mutable active records, and caller-supplied
compatibility assertions MUST NOT establish terminal compatibility.

#### Scenario: Exact immutable terminal bundle is compatible
- **WHEN** a schema-5 controller and one contained archived v2 bundle validate and agree on every required identity, digest, completion, release, and cleanup field
- **THEN** inventory reports the controller as compatible terminal audit evidence without granting authority to a new run

#### Scenario: Cancelled terminal bundle is compatible
- **WHEN** a schema-5 controller's run was cancelled and retired, and the contained archive binds a `cancellation-receipt` and released claim to the exact controller run identity and expiry
- **THEN** inventory reports the controller as compatible terminal audit evidence without granting authority to a new run

#### Scenario: Archive evidence is partial or conflicting
- **WHEN** any required archived record is absent, invalid, outside the derived archive, symlinked, duplicated, or inconsistent with the controller or another archived record
- **THEN** inventory reports the controller as ambiguous and admission remains fail closed

#### Scenario: Compatibility classification is read-only
- **WHEN** terminal schema-5 compatibility is evaluated successfully or unsuccessfully
- **THEN** the system changes no controller, archive, reconciliation, index, claim, or terminalization record

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

### Requirement: Expired never-admitted controller retirement is exact and non-mutating
The system SHALL allow an explicitly owner-authorized retirement of one expired
schema-5 controller checkpoint whose admission remains `pending` only when the
authorization binds the exact checkpoint path and byte digest, controller and
derived v2 identities, repository, selected change, provider, original expiry,
and a future retirement-authority expiry. Before publishing retirement evidence,
the system MUST prove that the checkpoint has no lifecycle progress or owned
resources and that no matching active or archived v2 parent run, work unit,
claim, cancellation, or terminalization exists. Retirement MUST publish an
immutable sidecar receipt, preserve the checkpoint byte-for-byte, create no v2
record or claim, and grant no lifecycle authority.

#### Scenario: Exact expired pending checkpoint retires
- **WHEN** an expired never-admitted pending checkpoint matches current exact
  owner authority and the configured repository state proves that none of its
  derived v2 records exists
- **THEN** the system publishes one immutable non-authority retirement receipt
  and leaves the checkpoint unchanged

#### Scenario: Pending checkpoint is not safe to retire
- **WHEN** the checkpoint is current, admitted, progressed, malformed,
  identity-mismatched, or has matching active or archived v2 state
- **THEN** the system publishes no receipt, changes no controller or v2 state,
  and reports a typed pause with recovery evidence

#### Scenario: Exact retirement is retried
- **WHEN** the identical exact retirement request is retried after its immutable
  receipt exists
- **THEN** the system returns the existing receipt without duplicating or
  replacing evidence

### Requirement: Inventory recognizes only evidenced pending-controller retirement
Legacy inventory SHALL classify an expired schema-5 `pending` checkpoint as
compatible terminal only when a valid immutable pending-controller retirement
receipt binds its exact path, byte digest, run identity, selected change, and
repository. The receipt MUST remain non-authoritative for v2 admission and MUST
NOT operate as a caller-selected inventory exclusion.

#### Scenario: Retired pending checkpoint no longer blocks admission
- **WHEN** inventory finds an expired pending checkpoint and its exact valid
  immutable retirement receipt
- **THEN** it retains both records as audit evidence and classifies that
  checkpoint compatible terminal before ordinary v2 admission checks

#### Scenario: Pending retirement evidence is absent or mismatched
- **WHEN** a pending checkpoint has no receipt or its receipt conflicts with the
  path, bytes, identity, selected change, or repository
- **THEN** inventory preserves the checkpoint, classifies it ambiguous, and
  blocks admission before a claim is created
