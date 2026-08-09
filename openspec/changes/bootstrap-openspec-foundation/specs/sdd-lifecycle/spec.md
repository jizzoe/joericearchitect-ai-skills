## Purpose

Defines the repository's reviewable OpenSpec lifecycle, quality context, and
safe operating boundaries from exploration through verified archival.

## ADDED Requirements

### Requirement: Streamlined lifecycle actions
The repository SHALL expose exactly the selected OpenSpec lifecycle actions
`explore`, `propose`, `apply`, `verify`, `sync`, and `archive` for supported
assistants.

#### Scenario: Selected actions are available
- **WHEN** a supported assistant reloads the repository after OpenSpec generation
- **THEN** all six selected lifecycle actions are discoverable

#### Scenario: Incremental actions remain unavailable
- **WHEN** the generated OpenSpec actions are inspected
- **THEN** `new`, `continue`, `ff`, `bulk-archive`, `onboard`, and the deselected `update` workflow are not exposed

### Requirement: Planning and implementation remain separate
The proposal action SHALL generate planning artifacts without applying the
change, and implementation SHALL require a later explicit apply action.

#### Scenario: Proposal completes
- **WHEN** an assistant completes a proposal, delta specifications, design, and task plan
- **THEN** it stops for artifact review without starting implementation

#### Scenario: Apply has not been authorized
- **WHEN** a proposal request also contains language asking to build or implement the change
- **THEN** the proposal action treats the request as planning-only and does not edit product implementation files

### Requirement: Repository context guides generated artifacts
OpenSpec project context and artifact rules SHALL concisely define the product
boundary, supported assistants, canonical asset locations, source-of-truth
model, quality and testing expectations, security and attribution constraints,
portability requirements, and built-in-first policy.

#### Scenario: A proposal is generated
- **WHEN** OpenSpec generates planning artifacts for this repository
- **THEN** the artifacts follow the configured repository context without copying the context block into artifact content

#### Scenario: A behavioral requirement is specified
- **WHEN** a delta specification is generated
- **THEN** it uses normative language and contains at least one verifiable acceptance scenario per requirement

### Requirement: Verification reports objective gaps
The verification action SHALL compare implementation evidence with the selected
change's tasks, specifications, and design and SHALL report incomplete,
divergent, or unevidenced behavior without claiming success.

#### Scenario: Implementation evidence is complete
- **WHEN** completed tasks, requirement coverage, scenario coverage, and design adherence are supported by evidence
- **THEN** verification reports the evidence and whether the change is ready for archival

#### Scenario: Required work is incomplete
- **WHEN** a task is incomplete or a required behavior lacks implementation evidence
- **THEN** verification identifies the gap with an actionable recommendation and does not report an all-clear result

### Requirement: Setup and refresh are recoverable
The repository SHALL document the tested OpenSpec version, initialization,
workflow refresh, assistant discovery, validation, and recovery procedures.

#### Scenario: Generated workflows become stale
- **WHEN** the configured workflow selection changes or OpenSpec is updated
- **THEN** a contributor can regenerate both assistant integrations and verify the selected actions using documented commands

#### Scenario: Generation partially fails
- **WHEN** OpenSpec updates one assistant integration but cannot write the other
- **THEN** existing valid planning artifacts remain intact and the recovery guidance provides a safe retry and verification path

### Requirement: Bootstrap linkage is explicit
The bootstrap change SHALL reference its primary GitHub issue and roadmap while
automated tracking metadata is not yet available.

#### Scenario: Bootstrap artifacts are reviewed
- **WHEN** a reviewer opens the bootstrap proposal
- **THEN** the reviewer can navigate to the primary issue and its roadmap parent
