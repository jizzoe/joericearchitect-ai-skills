## Purpose

Defines portable advisory review behavior for bounded code, documentation, and
configuration changes, producing evidence-backed findings without granting
approval or mutation authority.

## ADDED Requirements

### Requirement: Review activation is bounded and advisory
The `base-code-review` capability SHALL accept an explicit repository or
workspace, bounded change scope, relevant requirement, design, task, or brief
paths, available test and validation evidence, optional risk areas and delivery
profile, and execution mode. It MUST remain read-only in both interactive and
autonomous modes, MUST NOT approve delivery, and MUST NOT act as a substitute
for tests, OpenSpec Verify, CI, or independent review.

#### Scenario: Bounded review is requested
- **WHEN** a caller supplies a review target, bounded scope, relevant context,
  available evidence, and execution mode
- **THEN** the capability reviews only that scope and returns advisory evidence
  without changing workspace or external state

#### Scenario: Request asks review to mutate or approve
- **WHEN** a caller asks the capability to refactor code, apply a finding,
  bypass an evidence gate, or approve delivery
- **THEN** it refuses that operation, identifies the separate authorization or
  lifecycle action required, and preserves the reviewed state

### Requirement: Findings are evidence-backed, ordered, and independently classified
The capability SHALL report findings before summary material and order them by
`blocker`, `high`, `medium`, then `low` severity. Every finding MUST have a
stable identifier, repository-relative file or artifact evidence when
applicable, impact, corrective recommendation, severity, and an independent
disposition of `objective-fix`, `human-decision`, `warning`, or
`false-positive`. Findings with equal severity MUST use a deterministic order.

#### Scenario: Review finds multiple defects
- **WHEN** the review identifies findings at different severities
- **THEN** the result lists them in descending severity with evidence, impact,
  recommendation, and disposition for each finding

#### Scenario: Finding lacks support
- **WHEN** a suspected defect cannot be tied to repository-relative evidence or
  an explicit evidence gap
- **THEN** the capability reports the uncertainty as a gap or assumption rather
  than presenting an unsupported defect as established fact

### Requirement: Severity and disposition retain distinct meanings
The capability SHALL classify `blocker` as preventing the selected verification
or delivery profile from passing, `high` as likely material correctness,
security, or data-integrity impact, `medium` as a credible defect or risk
requiring follow-up, and `low` as a limited improvement. It MUST keep severity
separate from disposition, MUST preserve every finding, and MUST treat material
requirements, architecture, compatibility, security, licensing, governance,
data-ownership, or scope decisions as `human-decision` findings.

#### Scenario: Objective bounded correction exists
- **WHEN** a finding has a clear behavior-preserving correction but the review
  capability has no mutation authority
- **THEN** it classifies the finding `objective-fix` and recommends a separately
  authorized correction followed by new focused evidence and review

#### Scenario: Finding requires product judgment
- **WHEN** resolving a finding could change approved behavior, architecture,
  compatibility, security posture, licensing, governance, data ownership, or
  scope
- **THEN** it classifies the finding `human-decision` and does not prescribe or
  apply a risk-bearing choice

### Requirement: Review coverage is proportional and explicit
The capability SHALL evaluate relevant requirements and observable behavior,
regression and edge-case risk, test or eval coverage and quality, input
validation, error handling, data integrity and recovery, secrets and sensitive
data, authorization, untrusted input, dependencies and supply chain,
portability, configuration ownership, generated artifacts, and unrelated
changes. When applicable, it MUST also evaluate mobile or web accessibility,
responsive layout, and interaction risk, and MUST explicitly report review
areas that were not applicable or lacked evidence.

#### Scenario: Change has security and UI impact
- **WHEN** the bounded scope includes untrusted input and user-interface changes
- **THEN** the review covers the relevant security, accessibility, responsive,
  and interaction risks and reports any missing evidence

#### Scenario: Evidence for an applicable area is absent
- **WHEN** an applicable review area lacks tests, artifacts, or other evidence
- **THEN** the result reports the missing-test or risk gap without claiming the
  area passed

### Requirement: Review results use the shared result contract
The capability SHALL emit `skill-result-v1` with `skill` set to
`base-code-review`, the actual execution mode and status, reviewed artifacts,
stable review evidence identifiers, assumptions, open questions, and a next
action. Skill-specific details MUST contain the ordered findings, evidence
gaps, reviewed scope, and concise summary without adding a competing top-level
contract.

#### Scenario: Review completes with findings
- **WHEN** the capability finishes reviewing the bounded scope
- **THEN** its JSON result validates against `skill-result-v1` and a rendered
  report presents findings first followed by gaps, assumptions, and scope

#### Scenario: Review cannot safely proceed
- **WHEN** the target is ambiguous, required content is sensitive, or a shared
  guardrail pause condition occurs
- **THEN** the capability returns a structured paused or blocked result with no
  mutation and a safe next action

### Requirement: Canonical review behavior remains portable
The capability SHALL keep review policy in one canonical assistant-neutral
skill, link the shared guardrails, accept product-specific paths and commands
through invocation or validated configuration, and expose Claude and Codex only
through thin adapters that do not duplicate review logic.

#### Scenario: Another workspace uses the review capability
- **WHEN** a second product supplies different repository paths, validation
  evidence, and configured conventions
- **THEN** the same canonical finding and result behavior works without
  product-specific edits

#### Scenario: Platform wrappers are compared
- **WHEN** Claude and Codex exposure is inspected
- **THEN** both route to the canonical capability and preserve equivalent
  activation, read-only, severity, disposition, and result behavior
