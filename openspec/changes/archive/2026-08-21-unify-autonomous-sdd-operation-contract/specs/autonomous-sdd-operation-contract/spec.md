## Purpose

Defines one portable, typed policy surface for deciding which autonomous SDD
operation may run, which gates it needs, and how its outcome changes the run.

## ADDED Requirements

### Requirement: Canonical operation registry governs admitted work
The system SHALL define one canonical registry for every autonomous SDD
operation. Each registry entry MUST identify its operation name, permitted
compact lifecycle stage, accepted target and durable-record kinds, allowed
profiles, prerequisite gates, required freshness and authorization checks,
claim and runtime-permission requirements, required evidence, write-ahead
behavior, adapter boundary, and terminal outcome dispositions. An admitted run
MUST dispatch only a registry entry whose complete contract matches its
normalized authorization and current durable state.

#### Scenario: Registered operation has current matching inputs
- **WHEN** an admitted run requests an operation whose target, profile, gates,
  evidence, claim, authorization, and runtime permission match one entry
- **THEN** the system evaluates that entry's defined transition and records its
  typed operation attempt

#### Scenario: Operation is unknown or contract inputs conflict
- **WHEN** a caller supplies an unknown operation or an operation whose target
  kind, stage, profile, or required record conflicts with the registry
- **THEN** the system pauses before mutation, retains the observed input and
  gate result, and does not select an alternate operation

### Requirement: Profile and topology inputs normalize deterministically
The system SHALL normalize `reviewPolicy` and `agentPolicy` into the effective
authorization before admission. `reviewPolicy` is canonical; the legacy
`independentReviewPolicy` MAY be accepted only for `strict-only` and
`strict-first-degraded` values, and contradictory dual inputs MUST be rejected.
Autonomous `prototype-rapid` SHALL default to `same-session-local` review and
`auto` topology; `production-rapid` SHALL default to its production-compatible
review policy and `multi-agent` topology. `agentPolicy` SHALL be one of
`auto`, `multi-agent`, or `single-agent`; an explicit `multi-agent` or
`single-agent` choice MUST be bound unchanged and MUST bypass automatic
topology classification. Any automatic classification MUST be deterministic
and conservatively select separated contexts when its input is ambiguous,
complex, risky, or unknown.

#### Scenario: Prototype request omits topology and review fields
- **WHEN** a valid autonomous `prototype-rapid` request omits both fields
- **THEN** its effective authorization binds `same-session-local` review and
  `auto` topology before any lifecycle selection

#### Scenario: Caller explicitly selects one topology
- **WHEN** a valid request explicitly selects `multi-agent` or `single-agent`
- **THEN** the system records that selection and source without running the
  automatic topology classifier

#### Scenario: Legacy and canonical review inputs disagree
- **WHEN** a request supplies contradictory `reviewPolicy` and
  `independentReviewPolicy` values, or supplies `same-session-local` through
  the legacy independent-review field
- **THEN** normalization rejects the request before admission or mutation

### Requirement: Gates separate authority from readiness
The system SHALL evaluate delivery authorization, Apply eligibility, review
readiness, evidence freshness, claim ownership, adapter capability, and runtime
permission as distinct typed gates. A valid delivery authorization MUST NOT
imply Apply eligibility. A production-compatible strict review policy MUST
prove its permitted assurance path before Apply; a local prototype review MUST
NOT satisfy a production independent-review gate. A gate failure MUST produce
the registry-defined non-mutating outcome and safe resume requirement.

#### Scenario: Authorized request lacks Apply eligibility
- **WHEN** a run has current delivery authorization but planning, required
  evidence, or another Apply-eligibility predicate is incomplete
- **THEN** it stops before Apply with the failed eligibility gate recorded

#### Scenario: Strict review path is unavailable before Apply
- **WHEN** a strict-only or strict-first-degraded profile lacks its required
  ready assurance path
- **THEN** the system pauses before Apply and does not substitute local review
  or a weaker profile

### Requirement: Outcomes have one bounded disposition
The system SHALL assign every emitted operation outcome exactly one
machine-readable disposition: continue, objective-correction, human-decision,
terminal-failure, or complete. Correction is permitted only for a current
registry-defined objective failure with an unexhausted canonical failure
signature and all operation gates still passing. Unknown, malformed,
ambiguous, or unregistered outcomes MUST pause with retained evidence and MUST
NOT retry or mutate. Human-only decisions, expired authority, conflicting
records, and exhausted correction budgets MUST NOT be relabeled as objective
corrections.

#### Scenario: Known objective failure remains within its correction budget
- **WHEN** an operation returns a registered objective-correction outcome with
  a current canonical failure signature and remaining budget
- **THEN** the system schedules only the registry-defined bounded correction
  and records its hypothesis and rerun evidence

#### Scenario: Outcome cannot be classified
- **WHEN** an adapter returns an unknown, malformed, or multiply classified
  outcome
- **THEN** the system records a pause outcome and performs no retry, correction,
  or external mutation

### Requirement: Review reuse requires exact current bindings
The system SHALL permit reuse of review evidence for external-only closeout
operations only when the sealed package digest, exact reviewed head or tree,
review-relevant artifact manifest, Apply evidence, finding dispositions, and
required profile gates remain current. A changed code head, review-relevant
artifact, evidence, disposition, or assurance policy MUST invalidate reuse and
require fresh review. Reuse MUST NOT waive each target operation's own current
authorization, external-state, or reconciliation gates.

#### Scenario: Closeout reuses an unchanged exact review
- **WHEN** an external-only closeout operation has all required current review
  bindings and separately passes its own operation gates
- **THEN** it may consume the existing review lineage without launching a
  redundant reviewer

#### Scenario: Review-relevant input changes
- **WHEN** any sealed review binding changes after a review result was accepted
- **THEN** the result is invalid for reuse and the next review-gated operation
  requires fresh review evidence

### Requirement: Canonical contract remains portable across assistant exposure
The canonical operation contract SHALL be assistant-neutral and accept
repository, target, profile, and adapter facts as inputs. Claude and Codex
exposure MUST route equivalent requests to the same normalization, gate, and
outcome behavior without embedding product-specific repositories, credentials,
Projects, branches, or policy copies.

#### Scenario: Equivalent assistant requests are evaluated
- **WHEN** Claude and Codex submit equivalent normalized autonomous requests
- **THEN** both receive the same effective authorization, operation-gate result,
  and outcome disposition
