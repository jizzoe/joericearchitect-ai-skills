## Purpose

Defines how accepted requirements and an approved design brief become a
reviewable delivery plan before issue, branch, OpenSpec artifact, or
implementation mutation.

## ADDED Requirements

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
