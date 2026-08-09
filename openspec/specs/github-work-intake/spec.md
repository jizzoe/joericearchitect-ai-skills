## Purpose

Defines standardized GitHub issue intake, Project Kanban visibility, pull
request prompts, and non-secret configuration for SDD foundation work.

## Requirements

### Requirement: Managed issue labels identify work type
The repository SHALL define managed labels for feature work, bug work, SDD
workflow work, and disposable automation tests without using labels as Project
status.

#### Scenario: Managed labels are inspected
- **WHEN** repository labels are listed
- **THEN** feature, bug, SDD, and automation-test work labels are present with
  clear descriptions

#### Scenario: Status labels are absent
- **WHEN** repository labels are compared with Project statuses
- **THEN** `Backlog`, `Ready`, `In Progress`, `In Review`, and `Done` are not
  implemented as labels

### Requirement: Feature and bug forms collect SDD intake data
The repository SHALL provide GitHub issue forms for feature and bug work that
require problem, desired outcome, scope, acceptance, OpenSpec impact, and
verification information.

#### Scenario: Feature issue form is used
- **WHEN** a contributor opens a feature issue through the configured form
- **THEN** the issue contains required SDD intake sections and receives the
  managed feature and SDD labels

#### Scenario: Bug issue form is used
- **WHEN** a contributor opens a bug issue through the configured form
- **THEN** the issue contains required reproduction, expected behavior,
  observed behavior, impact, and verification sections and receives the
  managed bug and SDD labels

### Requirement: Pull requests prompt for SDD evidence
The repository SHALL provide a pull request template that asks for linked
issues or OpenSpec changes, summary, verification, security, recovery,
portability, and known limitations.

#### Scenario: Pull request template is rendered
- **WHEN** a contributor opens a pull request
- **THEN** the template prompts for SDD linkage and objective evidence needed
  by the lifecycle

### Requirement: Project intake statuses are available
The GitHub Project SHALL support the intake status flow `Backlog`, `Ready`,
`In Progress`, `In Review`, and `Done` for managed work.

#### Scenario: Managed issue is added to the Project
- **WHEN** a managed feature or bug issue is added to the Project
- **THEN** the issue appears once and can be assigned to an intake status

#### Scenario: Managed issue is closed
- **WHEN** a managed issue is closed after verification
- **THEN** the Project item can converge to `Done` without duplicate Project
  items

### Requirement: GitHub integration configuration is non-secret and portable
The repository SHALL store non-secret GitHub integration configuration for
repository identity, Project identity, status names, managed labels, default
branch, and managed markers.

#### Scenario: Configuration is inspected
- **WHEN** configuration is read from the repository
- **THEN** it contains no token values, mutable Project item IDs, field IDs,
  PR state, or last-sync timestamps

#### Scenario: Alternate product configuration is evaluated
- **WHEN** a second repository supplies different owner, repository, Project,
  branch, status, and label values
- **THEN** the configuration shape supports those values without changing
  reusable intake behavior

### Requirement: Disposable intake verification preserves evidence
The intake setup SHALL be verified with disposable `[SDD test]` feature and bug
issues that avoid sensitive content and remain available as audit evidence.

#### Scenario: Disposable intake issues are created
- **WHEN** intake verification runs
- **THEN** one disposable feature issue and one disposable bug issue are
  created or reused, added to the Project, moved through expected statuses,
  closed, and retained as evidence

#### Scenario: Disposable verification is rerun
- **WHEN** intake verification is rerun after interruption
- **THEN** it reuses or converges existing disposable records without duplicate
  Project items or loss of human-authored content
