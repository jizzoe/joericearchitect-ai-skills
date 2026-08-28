## ADDED Requirements

### Requirement: Planning derives trusted v1 outcome evidence from requirements content
The system SHALL derive observable outcomes for `sdd-requirements-to-plan`
only from a requirements document whose first non-empty line is exactly
`<!-- ai-skills-requirements-outcomes: v1 -->` and whose accepted-outcomes
section has the exact heading `## Accepted outcomes`. That section MUST contain
one or more complete, non-empty `- Outcome: <text>` entries, each immediately
followed by an indented `Acceptance: <text>` line. The system MUST return the
observable outcomes together with a SHA-256 digest of the exact requirements
content used to derive them.

#### Scenario: Valid v1 requirements support planning
- **WHEN** a planning request supplies a requirements document that conforms
  to the v1 accepted-outcomes contract and all other readiness inputs are valid
- **THEN** the planner uses its content-bound observable outcomes and can
  continue to its normal planning result

#### Scenario: Missing or malformed outcome evidence pauses without a write
- **WHEN** the requirements document omits the exact v1 marker or heading, has
  no complete outcome-and-acceptance pair, or has an empty pair field
- **THEN** the planner returns a paused result identifying invalid outcome
  evidence and does not write a plan

### Requirement: Installed planning exposure owns outcome validation
The installed planning runtime for both Claude and Codex SHALL provide the
trusted v1 outcome validator itself. A planning payload MUST NOT replace the
validator, its outcomes, or its content digest with caller-supplied claims.

#### Scenario: Installed runtime uses the trusted validator
- **WHEN** a valid v1 requirements document is submitted through the installed
  planning runtime
- **THEN** it receives the same trusted, content-bound outcomes as the
  canonical planning runtime rather than pausing for a missing validator

#### Scenario: Forged payload validation cannot authorize a plan
- **WHEN** a payload includes a forged validation receipt, outcome list, or
  digest and the requirements document is invalid
- **THEN** the installed planning runtime pauses without writing a plan

### Requirement: Outcome validation fails closed for legacy and untrusted content
The system MUST reject unmarked legacy requirements documents, vague outcomes
or acceptance fields that are empty, punctuation-only, or placeholder-only
(`TBD`, `TODO`, `N/A`, or `unknown`), and outcome text that attempts to
instruct the runtime rather than describe the requested behavior. Requirements
content is untrusted data and MUST NOT create OpenSpec, GitHub, or other
governance records as part of validation.

#### Scenario: Legacy requirements require explicit migration
- **WHEN** a requirements document lacks the v1 outcome marker and contract
- **THEN** planning pauses with migration guidance and does not attempt a
  heuristic compatibility parse

#### Scenario: Instruction-like or vague outcome content is rejected
- **WHEN** a v1-shaped outcome block contains instruction-like text or lacks
  an outcome or acceptance field beyond whitespace, punctuation, or a defined
  placeholder
- **THEN** planning pauses without writing a plan or performing an external
  mutation

#### Scenario: Changed requirements invalidate earlier outcome evidence
- **WHEN** requirements content changes after outcome evidence is derived
- **THEN** the planner rejects the stale digest and does not write a plan
