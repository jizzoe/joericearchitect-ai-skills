## Purpose

Defines local OpenSpec/GitHub lifecycle synchronization behavior for linked
SDD work.

## Requirements

### Requirement: Project and status data are resolved by configured names
Lifecycle synchronization SHALL resolve Project, status field, and status
options from configured names and observed GitHub state before planning a
transition.

#### Scenario: Project status is resolved
- **WHEN** observed Project state contains the configured status field and
  status option
- **THEN** lifecycle synchronization returns the matching identifiers and names

#### Scenario: Project field is missing
- **WHEN** observed Project state lacks the configured status field or option
- **THEN** synchronization fails safely before planning mutation

### Requirement: Lifecycle transitions are idempotent
Lifecycle synchronization SHALL plan no mutation when observed issue Project
status already matches the expected lifecycle status.

#### Scenario: Transition is already complete
- **WHEN** an issue already has the expected Project status for the lifecycle
  event
- **THEN** synchronization reports a no-op result

#### Scenario: Transition is needed
- **WHEN** an issue has a different Project status from the expected lifecycle
  event
- **THEN** synchronization plans the minimal status update

### Requirement: Lifecycle audit is read-only
Lifecycle audit SHALL compare tracking metadata, issue state, Project item
state, and expected lifecycle status without mutating GitHub.

#### Scenario: Audit detects drift
- **WHEN** observed issue or Project state differs from expected tracked state
- **THEN** audit reports the drift with issue URL, current status, expected
  status, and repair action

### Requirement: Repair mode is explicit and bounded
Lifecycle repair SHALL require explicit repair mode and authorization before
planning or executing a mutation.

#### Scenario: Repair is not authorized
- **WHEN** drift exists but repair authorization is absent
- **THEN** synchronization reports the needed repair without mutation

#### Scenario: Repair is authorized
- **WHEN** drift exists and repair mode is authorized
- **THEN** synchronization plans or performs the bounded status update and
  reports the resulting expected state

### Requirement: Lifecycle workflow composes local helpers
The OpenSpec/GitHub lifecycle workflow SHALL compose tracking validation,
artifact-quality validation, issue intake helpers, status synchronization, and
audit/repair steps without duplicating their implementation logic.

#### Scenario: Propose review completes
- **WHEN** proposal, design, spec, tasks, tracking, and artifact-quality checks
  pass for a linked issue
- **THEN** the workflow can plan the linked issue transition to `Ready`

#### Scenario: Apply starts
- **WHEN** Apply begins for a linked issue
- **THEN** the workflow can plan the linked issue transition to `In Progress`

### Requirement: Historical lifecycle backfill is evidenced
Prior foundation changes SHALL be audited or recorded with explicit
compatibility evidence rather than silently rewritten.

#### Scenario: Prior change is inspected
- **WHEN** a pre-M4-C2 archived change lacks lifecycle-sync records
- **THEN** verification records its existing issue and Project convergence
  evidence or an explicit compatibility exception
