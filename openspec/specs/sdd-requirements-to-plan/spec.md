# sdd-requirements-to-plan Specification

## Purpose

Defines how accepted requirements and an approved design brief become a
reviewable delivery plan before issue, branch, OpenSpec artifact, or
implementation mutation.

## Requirements

### Requirement: The plan organizes accepted requirements into reviewable delivery work
The system SHALL use `sdd-requirements-to-plan` to write a plan with
outcome-oriented milestones, semantically named candidate changes,
scope/non-goals, dependencies, shared-resource hazards, candidate parallel
work, acceptance evidence, evaluation needs, and a recommended first change,
from requirements and approved design-brief paths, target
repository/workspace context, known constraints and dependencies, a delivery
profile, and an output destination. Any proposed issue or change identifier
MUST be explicitly marked proposed rather than created.

#### Scenario: Complete planning request
- **WHEN** requirements and design-brief paths, target-workspace context, and
  an output destination are supplied
- **THEN** the skill writes a plan with all required elements and marks any
  named issue or change identifier as proposed, not created

#### Scenario: Missing requirements or design-brief input
- **WHEN** a planning request omits its requirements or approved design-brief
  path
- **THEN** the skill returns a paused `skill-result-v1` result naming the
  missing input rather than inventing requirements

### Requirement: The plan delegates live state and does not duplicate OpenSpec generation
The system SHALL delegate in-flight, actionable, blocked, parallel, and next
work classification to `dependency-aware-work-selection` rather than
re-deriving it, and MUST NOT generate OpenSpec proposal, design, delta spec,
or task content. The plan MUST recommend whether the next action is OpenSpec
Explore or Propose and list the exact source paths that action must read.

#### Scenario: Plan needs current dependency state
- **WHEN** the plan requires in-flight, blocked, or next-work classification
- **THEN** it delegates that classification to
  `dependency-aware-work-selection` rather than re-implementing dependency,
  priority, sequence, or shared-resource analysis

#### Scenario: Plan recommends the next OpenSpec action
- **WHEN** a candidate change is ready for further OpenSpec work
- **THEN** the plan states whether Explore or Propose is the recommended
  action and lists the exact source paths that action must read, without
  producing OpenSpec artifact content itself

### Requirement: A candidate change is Propose-ready only under the full readiness contract
The system SHALL recommend OpenSpec Propose for a candidate change only when
it has: an outcome; scope and non-goals; observable acceptance evidence;
named source requirements/design; a selected delivery profile; known hard
dependencies and shared-resource hazards; test/eval and guardrail needs; and a
clear first action. For missing or conflicting material input, the returned
`skill-result-v1` MUST have top-level `status: paused` and an `openQuestions`
entry containing `id`, `question`, and `blocking: true`, rather than a guessed
task or an unsupported status field on the `openQuestions` entry.

#### Scenario: Candidate change satisfies the readiness contract
- **WHEN** a candidate change has all readiness-contract elements present and
  consistent
- **THEN** the plan recommends it as Propose-ready

#### Scenario: Candidate change is missing a readiness element
- **WHEN** a candidate change lacks observable acceptance evidence or a
  selected delivery profile
- **THEN** the returned `skill-result-v1` has top-level `status: paused` and
  an `openQuestions` entry containing `id`, `question`, and `blocking: true`
  instead of a guessed task

### Requirement: Delivery profile is selected per candidate change with a stated rationale
The system SHALL select `prototype-rapid` or `production-rapid` per candidate
change rather than once for the entire plan. A plan mixing profiles across
candidates MUST explain, per mixed candidate, why the selected profile
matches that candidate's data, exposure, and recovery risk.

#### Scenario: Plan mixes delivery profiles
- **WHEN** a plan proposes `prototype-rapid` for one candidate and
  `production-rapid` for another
- **THEN** the plan states the data/exposure/recovery-risk rationale for each
  selected profile

### Requirement: High-impact delivery authority is named, never implied by profile alone
For any candidate change that can reach delivery, the system SHALL state
whether normal interactive just-in-time approval applies for merge,
merged-topic-branch deletion, and OpenSpec Archive, or whether a
`prototype-rapid` one-change preapproval is proposed. A proposed preapproval
MUST name the exact target, action, evidence, recovery behavior, and
expiration; selecting a delivery profile alone MUST NOT be treated as
granting that authority.

#### Scenario: Candidate uses normal interactive approval
- **WHEN** a candidate change selects `production-rapid` with no proposed
  preapproval
- **THEN** the plan states that normal interactive just-in-time approval
  applies before merge, branch deletion, or Archive

#### Scenario: Candidate proposes a one-change preapproval
- **WHEN** a candidate change proposes a `prototype-rapid` one-change
  preapproval for a named high-impact transition
- **THEN** the plan names the exact target, action, evidence, recovery
  behavior, and expiration for that preapproval rather than relying on the
  profile alone

### Requirement: Defined conditions pause planning
The system SHALL pause `sdd-requirements-to-plan` when requirements lack
observable outcomes, dependencies are unresolved, the requested delivery
profile conflicts with risk or data constraints, or a plan would need a new
product, architecture, legal, security, or governance decision.

#### Scenario: Requested profile conflicts with risk constraints
- **WHEN** a requested `prototype-rapid` profile conflicts with a candidate's
  data-sensitivity or recovery constraints
- **THEN** the skill pauses and reports the conflict rather than selecting
  the requested profile

### Requirement: Autonomous plan writes are operation-authorized
The system SHALL permit autonomous `sdd-requirements-to-plan` writes only
under the `local-implementation` bounded-autonomous-execution profile and
only after `scripts/sdd/check-operation-authorization.mjs` validates the
exact workspace, path, and write operation. The skill MUST pause without
writing when that deterministic check denies the operation.

#### Scenario: Autonomous plan write is authorized
- **WHEN** an autonomous request names an authorized local-implementation
  plan path and operation
- **THEN** the skill validates it through the operation checker before writing
  the plan

#### Scenario: Autonomous plan write is denied
- **WHEN** the operation checker denies an autonomous plan write
- **THEN** the skill pauses without writing a plan

### Requirement: Skill behavior is objectively evaluable
The system SHALL define deterministic synthetic scenarios for
`sdd-requirements-to-plan` covering trigger selection, non-trigger rejection,
missing input, untrusted-content handling, an autonomous allowed action, an
autonomous pause, output-path safety, and portable second-workspace behavior.

#### Scenario: Evaluation fixtures cover the required scenario types
- **WHEN** `evals/skills/sdd-requirements-to-plan/scenarios.json` and its
  fixtures are run
- **THEN** each of the eight required scenario types has a deterministic,
  synthetic-data-only test

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
