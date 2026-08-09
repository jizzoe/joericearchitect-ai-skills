## Purpose

Defines pull-request-driven Project status reconciliation for OpenSpec SDD work.

## Requirements

### Requirement: Pull request review state maps to Project status
PR status synchronization SHALL produce deterministic Project status plans from
trusted pull request lifecycle events.

#### Scenario: Draft PR remains in progress
- **WHEN** a pull request is opened or reopened
- **THEN** the linked issue status is planned as `In Progress`

#### Scenario: Ready for review enters review
- **WHEN** a pull request is marked ready for review
- **THEN** the linked issue status is planned as `In Review`

#### Scenario: Draft conversion returns to progress
- **WHEN** a pull request is converted back to draft
- **THEN** the linked issue status is planned as `In Progress`

### Requirement: Pull request closure avoids conflicting completion
PR status synchronization SHALL avoid overriding default-branch merge
completion while still handling abandoned PRs.

#### Scenario: Merged default branch PR defers completion
- **WHEN** a pull request is merged into the default branch
- **THEN** direct Project status mutation is skipped so issue closing keywords
  and built-in Project completion can set `Done`

#### Scenario: Closed unmerged PR returns to progress
- **WHEN** a pull request is closed without merge
- **THEN** the linked issue status is planned as `In Progress` or an audit-only
  result explains why mutation was skipped

### Requirement: Untrusted PR contexts do not receive Project credentials
PR status synchronization SHALL avoid Project credential exposure and mutation
for untrusted pull request contexts.

#### Scenario: Untrusted pull request is audit only
- **WHEN** a pull request event is not a same-repository trusted PR context
- **THEN** the result is audit-only and no Project mutation is planned

### Requirement: PR status workflow avoids event recursion
The PR status workflow SHALL NOT depend on recursively triggered issue, PR, or
Project mutation events to complete its own validation.

#### Scenario: Workflow permissions are inspected
- **WHEN** the Project status sync workflow is read
- **THEN** it uses read-only permissions and does not reference Project tokens

