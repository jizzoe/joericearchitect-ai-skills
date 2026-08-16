## Purpose

Defines durable, authorization-bound continuation for complete autonomous SDD
delivery without broadening ordinary standalone lifecycle actions.

## ADDED Requirements

### Requirement: Complete delivery intake creates durable controller context
The system SHALL accept autonomous continuation only after resolving an explicit
change or ordered queue, mode, quality profile, authorization profile,
independent-review policy, and expiry. Before it selects work or mutates state,
it MUST persist a portable selected-entry record binding authorization digest,
selected entry, repository, expiry, lifecycle chain, phase, and checkpoint
location, without credentials or standing approval grants.

#### Scenario: Complete target-explicit delivery starts
- **WHEN** a valid autonomous `sdd-delivery` request names one change or queue
- **THEN** the controller reports normalized authorization and persists context before lifecycle selection

#### Scenario: Intake is incomplete or invalid
- **WHEN** a delivery request lacks, conflicts on, or invalidly formats required input
- **THEN** the controller makes no selection or mutation and returns one consolidated clarification

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
