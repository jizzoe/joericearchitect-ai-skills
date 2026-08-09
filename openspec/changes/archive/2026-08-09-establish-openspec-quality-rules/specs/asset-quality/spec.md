## Purpose

Defines deterministic quality rules for OpenSpec planning artifacts used by
reusable AI asset work.

## ADDED Requirements

### Requirement: Proposal artifacts describe bounded change intent
OpenSpec proposal artifacts SHALL state the problem, scope, non-goals, issue
linkage, affected assets, compatibility, security posture, and reuse plan for
the proposed change.

#### Scenario: Proposal is reviewed
- **WHEN** a proposal artifact is validated
- **THEN** required intent, boundary, linkage, compatibility, and reuse
  sections are present without implying Apply authorization

#### Scenario: Proposal lacks issue linkage
- **WHEN** a proposal omits its primary issue or approved no-issue exception
- **THEN** local quality validation fails with the proposal path and rule ID

### Requirement: Specification artifacts remain behavioral
OpenSpec delta specifications SHALL express observable behavior with normative
requirements and verifiable acceptance scenarios rather than implementation
tasks.

#### Scenario: Behavioral spec is reviewed
- **WHEN** a delta spec is validated
- **THEN** every requirement uses normative language and includes at least one
  scenario with `WHEN` and `THEN` evidence

#### Scenario: Spec absorbs implementation work
- **WHEN** a requirement is written only as a file-edit task or checklist item
- **THEN** local quality validation fails before the change is delivered

### Requirement: Design artifacts cover review-critical decisions
OpenSpec design artifacts SHALL cover affected files, ownership boundaries,
alternatives, tradeoffs, tests, security, recovery, attribution, portability,
and reuse decisions.

#### Scenario: Design is reviewed
- **WHEN** design validation runs
- **THEN** the artifact identifies relevant decisions, verification strategy,
  risk controls, recovery behavior, and portability boundaries

### Requirement: Task artifacts are stable and evidence-driven
OpenSpec task artifacts SHALL use stable numbered task IDs, dependency
annotations, bounded vertical slices, validation tasks, review tasks, and
evidence requirements before tasks are marked complete.

#### Scenario: Task plan is reviewed
- **WHEN** task validation runs
- **THEN** each task has a stable ID, dependency annotation, and evidence
  statement, and the plan includes verification and delivery work

#### Scenario: Task completion lacks evidence
- **WHEN** a task is marked complete without its required evidence statement
- **THEN** local quality validation fails

### Requirement: Quality validation is local and deterministic
Artifact quality validation SHALL run locally without network access,
credentials, GitHub mutations, custom OpenSpec schema changes, or execution of
untrusted artifact content.

#### Scenario: Validator runs against a change path
- **WHEN** the validator is given an OpenSpec change directory
- **THEN** it reads artifact files, reports deterministic rule results, and
  exits nonzero when required quality evidence is missing

#### Scenario: Standard OpenSpec schema is checked
- **WHEN** artifact quality validation passes for the representative fixture
- **THEN** standard OpenSpec validation also remains sufficient without custom
  schema migration

### Requirement: Representative fixtures prove reusable rules
The repository SHALL include a representative sample OpenSpec change fixture
that demonstrates compliant artifact structure and invalid fixture cases that
prove precise failures.

#### Scenario: Sample fixture is validated
- **WHEN** fixture tests run
- **THEN** the sample fixture passes and invalid fixtures fail with expected
  rule IDs and paths

#### Scenario: Rules are reused by another product
- **WHEN** a fixture uses a different product name, issue URL, change ID, and
  asset paths
- **THEN** artifact quality validation works without modifying canonical rules
