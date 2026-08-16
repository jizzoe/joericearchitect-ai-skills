# design-brief-from-research Specification

## Purpose

Defines how durable research and project context become one reviewable
Markdown decision brief before OpenSpec Explore or Propose.
## Requirements
### Requirement: The brief synthesizes evidence into one reviewable decision record
The system SHALL use `design-brief-from-research` to write one Markdown brief
containing: problem and desired outcome; evidence and key findings with
source links; options considered and tradeoffs; explicit decisions,
assumptions, and decision owner where known; scope, non-goals, constraints,
dependencies, and risks; open questions and blocking decisions; and a
recommended next step of more research, design refinement, OpenSpec Explore,
or OpenSpec Propose. The brief MUST link rather than duplicate large source
material.

#### Scenario: Complete brief request
- **WHEN** research document paths, relevant requirements/plan/context paths,
  and an output path or approved default are supplied
- **THEN** the skill writes one brief containing all seven required sections
  and links to, rather than copies, the supplied source material

### Requirement: Evidence-derived recommendations are labeled separately from owner decisions
The system SHALL visibly distinguish an evidence-derived recommendation from
an explicit owner decision within the brief and MUST NOT present an
unconfirmed recommendation as an approved decision.

#### Scenario: Owner decision is not yet made
- **WHEN** the supplied inputs include a recommendation but no confirmed
  owner decision for a given point
- **THEN** the brief labels that point as a recommendation pending decision,
  not as a decision

### Requirement: Missing or conflicting research produces a paused result
The system SHALL return a paused `skill-result-v1` result identifying the
missing or conflicting evidence, rather than fabricating a decision, when key
research is unavailable or sources conflict without a defensible
interpretation.

#### Scenario: Named research document is unavailable
- **WHEN** a required research document path does not resolve
- **THEN** the skill returns a paused result naming the missing document as a
  blocking open question

#### Scenario: Sources conflict materially
- **WHEN** two or more supplied sources conflict on a point material to the
  brief's recommendation and no defensible interpretation resolves the
  conflict
- **THEN** the skill records the conflict as an open question rather than
  silently choosing one source

### Requirement: The skill stops before OpenSpec artifact generation
The system SHALL recommend OpenSpec Explore or Propose as a next step without
creating OpenSpec proposal, design, delta spec, or task content itself.

#### Scenario: Brief recommends Propose
- **WHEN** the brief's evidence and decisions are sufficient to recommend
  OpenSpec Propose
- **THEN** the skill states that recommendation and does not generate
  `proposal.md`, `design.md`, delta specs, or `tasks.md` content

### Requirement: Material decisions and false-approval claims pause the skill
The system SHALL pause rather than proceed when the requested brief content
requires a material architecture or product decision the owner has not made,
or when asked to represent approval that was not given.

#### Scenario: Request asks the brief to claim unapproved approval
- **WHEN** a request asks the skill to record a decision or approval that the
  supplied inputs do not evidence
- **THEN** the skill pauses and reports the unapproved claim rather than
  writing it into the brief

### Requirement: Autonomous brief writes are operation-authorized
The system SHALL permit autonomous `design-brief-from-research` writes only
under the `local-implementation` bounded-autonomous-execution profile and
only after `scripts/sdd/check-operation-authorization.mjs` validates the
exact workspace, path, and write operation. The skill MUST pause without
writing when that deterministic check denies the operation.

#### Scenario: Autonomous brief write is authorized
- **WHEN** an autonomous request names an authorized local-implementation
  brief path and operation
- **THEN** the skill validates it through the operation checker before writing
  the brief

#### Scenario: Autonomous brief write is denied
- **WHEN** the operation checker denies an autonomous brief write
- **THEN** the skill pauses without writing a brief

### Requirement: Skill behavior is objectively evaluable
The system SHALL define deterministic synthetic scenarios for
`design-brief-from-research` covering trigger selection, non-trigger
rejection, missing input, untrusted-content handling, an autonomous allowed
action, an autonomous pause, output-path safety, and portable second-workspace
behavior.

#### Scenario: Evaluation fixtures cover the required scenario types
- **WHEN** `evals/skills/design-brief-from-research/scenarios.json` and its
  fixtures are run
- **THEN** each of the eight required scenario types has a deterministic,
  synthetic-data-only test

### Requirement: Delivery-scoped brief preparation preserves path bounds
The design-brief workflow SHALL recognize valid `sdd-delivery` authorization
only for one explicitly authorized selected-entry output path. It MUST validate
the path and authorization before writing, preserve local-implementation, and
reject other delivery writes.

#### Scenario: Valid delivery preparation is received
- **WHEN** selected-entry authorization names the requested brief path
- **THEN** workflow may write the brief within that path boundary

#### Scenario: Delivery context lacks a path grant
- **WHEN** delivery context does not authorize requested output path
- **THEN** workflow returns rejection without writing a brief
