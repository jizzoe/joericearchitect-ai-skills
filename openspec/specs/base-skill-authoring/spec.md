# base-skill-authoring Specification

## Purpose

Defines how reusable assistant-neutral skills are safely specified before they
are implemented, exposed on platforms, or allowed to mutate product state.

## Requirements

### Requirement: Authoring produces a complete contract package
The system SHALL use `base-skill-authoring` to turn complete authoring inputs
into a contract package naming the skill, activation/non-trigger examples,
inputs, `skill-result-v1` output, configuration, allowed operations, approvals,
pause/recovery rules, dependencies, canonical assets, thin adapters, evals,
risks, open decisions, and recommended next action.

#### Scenario: Complete reusable-skill request
- **WHEN** a user supplies all required capability, boundary, mode, dependency,
  and evaluation inputs
- **THEN** the skill returns a contract package without beginning implementation

### Requirement: Missing material inputs produce a structured gap result
The system SHALL return a `skill-result-v1` result with a gap report and a
blocking next action when material authoring inputs are absent or ambiguous,
and MUST NOT invent a contract, approval, target, or configuration value.

#### Scenario: Request omits mutation boundary
- **WHEN** an authoring request lacks allowed mutations or target boundaries
- **THEN** the skill identifies the gap and pauses for the missing decision

### Requirement: Authoring applies shared safety and autonomy controls
The system SHALL require each authored contract to link the shared guardrails,
classify untrusted content and sensitive data, distinguish authorization from
runtime permission and evidence, use the established operation checker for
autonomous actions, and expose only a subset of the first-pass profiles.

#### Scenario: Contract proposes an unapproved external action
- **WHEN** an authoring request includes external communication, credential
  handling, destructive work, or an operation outside its permitted profile
- **THEN** the skill records a pause rather than authorizing that action

### Requirement: Canonical skills remain portable and adapters remain thin
The system SHALL define canonical reusable assets under `skills/base/<name>/`,
use workspace-relative/configured values only, and require Claude/Codex
exposures to route to the canonical source without copied business logic.

#### Scenario: Second product uses different paths
- **WHEN** a valid contract is evaluated with different product-owned paths
- **THEN** its canonical instructions and eval behavior remain valid without
  repository-specific constants

### Requirement: Authoring contracts are objectively evaluable and recoverable
The system SHALL define synthetic checks for metadata, activation and
non-trigger selection, gap behavior, injection and secret exclusion, profile
pauses, recovery instructions, thin-adapter parity, and portability.

#### Scenario: Evaluation finds an unsafe or incomplete contract
- **WHEN** a fixture includes prompt injection, secret-like content, an invalid
  profile, or incomplete recovery data
- **THEN** deterministic evaluation rejects it and reports a safe next action
