# autonomous-sdd-continuation Specification

## Purpose
Defines durable, authorization-bound continuation for complete autonomous SDD
delivery without broadening ordinary standalone lifecycle actions.
## Requirements

### Requirement: Complete delivery intake creates durable controller context
The system SHALL accept autonomous continuation only after resolving an explicit
change or ordered queue, mode, quality profile, authorization profile,
independent-review policy, and expiry. Before it selects work or mutates state,
it MUST persist a portable selected-entry record binding authorization digest,
selected entry, repository, expiry, lifecycle chain, phase, and checkpoint
location, without credentials or standing approval grants. The controller and
its terminal cleanup receipts MUST reside in a repository-scoped local state
location outside every removable lifecycle worktree. Before creating or
selecting a non-primary lifecycle branch or worktree, the controller MUST
durably register its exact repository, lifecycle role, identity, full head,
ownership token, recovery reference, and pending delivery binding. A registered
resource MUST retain its own delivery evidence as the corresponding lifecycle
pull request is merged; the controller MUST NOT substitute one global final
head for distinct resource deliveries.
Each controller record MUST have an immutable generated run identity and a
checkpoint location derived from that identity; persistence MUST reject
replacement by a different recorded run. The controller MUST expose executable
registration, delivery-binding, and receipt-coupled cleanup transitions so
required resource evidence is produced by lifecycle work rather than tests. It
MUST NOT report a controller or ordered queue entry complete unless at least one
resource was registered and every registered resource has a current delivery
binding plus a terminal completed or already-completed cleanup receipt.

#### Scenario: Complete target-explicit delivery starts
- **WHEN** a valid autonomous `sdd-delivery` request names one change or queue
- **THEN** the controller reports normalized authorization and persists context before lifecycle selection

#### Scenario: Intake is incomplete or invalid
- **WHEN** a delivery request lacks, conflicts on, or invalidly formats required input
- **THEN** the controller makes no selection or mutation and returns one consolidated clarification

#### Scenario: Lifecycle resource is registered before creation
- **WHEN** the controller is about to create an implementation, Sync, or Archive
  worktree or local branch for its selected entry
- **THEN** it persists an exact pending ownership record before the resource is
  eligible for a later cleanup transition

#### Scenario: Separate lifecycle deliveries are squash merged
- **WHEN** implementation, Sync, and Archive each merge through distinct
  squash pull requests
- **THEN** the controller binds each registered resource to its own exact topic
  head, pull request, and delivered default-branch head without relying on
  ancestry to a later lifecycle merge

#### Scenario: Lifecycle worktree is removed after Archive
- **WHEN** a registered worktree passes the exact post-Archive cleanup gate
- **THEN** its controller and terminal cleanup receipt remain recoverable from
  repository-scoped state outside that worktree

#### Scenario: Controller checkpoint collides with another run
- **WHEN** persistence targets a checkpoint owned by a different run identity
- **THEN** it rejects the replacement and preserves the existing record

#### Scenario: Executable cleanup transition completes
- **WHEN** registered resources pass exact post-Archive cleanup gates
- **THEN** the controller persists each receipt outside the target worktree and
  returns the updated record

#### Scenario: Cleanup evidence is incomplete
- **WHEN** a caller tries to complete cleanup or advance an ordered queue with
  no registered resource or without a terminal receipt for every resource
- **THEN** the controller pauses or rejects the transition and retains the
  recoverable records

### Requirement: Controller resumes at first incomplete evidenced phase
The controller SHALL re-read its durable record, checkpoint, OpenSpec state,
Git state, and configured external evidence on every phase entry. It MUST run
only the first incomplete or stale authorized phase and pause on expired,
forged, conflicting, or unverifiable context.

#### Scenario: Interrupted valid run resumes
- **WHEN** a valid unexpired record has complete planning but no current Apply evidence
- **THEN** the controller resumes at Apply after its planning gate

#### Scenario: Context no longer matches durable state
- **WHEN** selected entry, authorization digest, repository, expiry, or checkpoint conflicts
- **THEN** the controller pauses before the affected phase and infers no replacement target

### Requirement: Standalone phases retain ordinary boundaries
A generated or ordinary lifecycle phase SHALL remain at its phase-local boundary
unless it discovers valid controller context for the exact selected entry. A
valid context MUST return control to the controller rather than grant a phase
new authority.

#### Scenario: Standalone Propose is invoked
- **WHEN** Propose is invoked without validated active delivery context
- **THEN** it creates only planning artifacts and stops before Apply

#### Scenario: Valid controller invokes a phase
- **WHEN** a validated controller context reaches a lifecycle phase
- **THEN** phase work completes and the controller evaluates the next authorized checkpoint

### Requirement: Controller context persists reviewed issue-intake binding and evidence
The run-specific autonomous SDD controller SHALL persist one exact reviewed
issue-intake binding for its selected entry before issue publication. The
binding MUST include the canonical payload digest, configured repository,
title, managed labels, managed block, operation, expiry, ownership and recovery
reference, and MUST contain no credential. After create-or-reuse, the
controller MUST bind the returned issue number, URL, state, labels, and current
evidence to the same payload digest. Resume MUST reread that durable record and
reconcile the first incomplete intake action without inferring a replacement
payload or re-requesting a skill-level approval when the exact binding and
runtime permission remain current.

#### Scenario: Reviewed intake is registered before publication
- **WHEN** planning produces the exact issue payload for an autonomous
  prototype selected entry
- **THEN** the controller persists the reviewed pending binding before any
  issue mutation occurs

#### Scenario: Issue evidence is bound after create-or-reuse
- **WHEN** configured intake creates or finds the exact bound issue
- **THEN** the controller persists the issue identity and current evidence
  against the same selected entry and payload digest

#### Scenario: Interrupted intake resumes
- **WHEN** a run resumes with a valid unexpired pending or delivered issue
  binding
- **THEN** the controller reconciles the exact issue action and proceeds from
  its first incomplete evidenced state without generating a different payload

#### Scenario: Intake record conflicts on resume
- **WHEN** the current payload, selected entry, repository, title, digest,
  issue identity, or expiry conflicts with the durable intake record
- **THEN** the controller pauses before external mutation and preserves the
  original binding and recovery evidence

### Requirement: GitHub lifecycle actions retain authentication-context recovery evidence
Before an autonomous SDD lifecycle action invokes GitHub CLI, the controller
SHALL obtain current non-secret authentication-context evidence for its exact
authorized operation. On an authentication-shaped restricted-runtime failure,
the controller MUST use the canonical contrast diagnostic before classifying
the action as an invalid credential or a runtime-permission gap. It MUST retain
the normalized result and recovery reference in durable controller evidence
and MUST pause when the result is invalid-or-expired, host-denied, unknown,
expired, or mismatched.

#### Scenario: Exact issue intake encounters a restricted-runtime 401
- **WHEN** a current controller-bound issue intake probe fails with a
  normalized authentication-shaped restricted-runtime result
- **THEN** the controller performs only the bound read-only contrast path and
  preserves its safe recovery class before reconsidering the exact intake
  operation

#### Scenario: Authentication context does not authorize a new action
- **WHEN** host-context preflight succeeds for an autonomous lifecycle run
- **THEN** the controller still requires the selected-entry authorization,
  exact target binding, active runtime permission, and all lifecycle evidence
  before invoking a GitHub mutation
