## Purpose

Defines deterministic dependency-aware work selection for OpenSpec SDD work.

## Requirements

### Requirement: Work items are classified from dependency evidence
Dependency-aware selection SHALL classify work as in-flight, actionable,
blocked, parallel candidates, and next from status, dependency, priority,
sequence, and shared-resource data.

#### Scenario: In-flight work is reported
- **WHEN** work items have `In Progress` or `In Review` status
- **THEN** they are included in the in-flight report

#### Scenario: Blocked work is excluded from next
- **WHEN** a work item has an unresolved blocker, missing dependency reference,
  dependency cycle, or explicit conflict
- **THEN** it is excluded from automatic next-work selection and the blocker is
  reported

### Requirement: Next work selection is deterministic
Dependency-aware selection SHALL recommend next work by explicit selection,
actionable status, priority, and sequence.

#### Scenario: Priority applies after dependencies
- **WHEN** a blocked high-priority item and actionable lower-priority item both
  exist
- **THEN** the actionable item is selected

#### Scenario: Sequence orders otherwise equivalent work
- **WHEN** multiple actionable items have the same priority
- **THEN** the lowest sequence value is selected

### Requirement: Parallel candidates are reported conservatively
Dependency-aware selection SHALL report parallel candidates only when actionable
items have no dependency path and no known shared-resource conflict.

#### Scenario: Independent ready changes are parallel candidates
- **WHEN** two actionable changes have no dependency path or shared conflict
- **THEN** they are reported as parallel candidates

#### Scenario: Shared-resource conflict prevents parallel recommendation
- **WHEN** two actionable changes share a configured file or external state
- **THEN** they are not reported as safe parallel candidates

### Requirement: Switching requires explicit target
Dependency-aware selection SHALL NOT infer selected work from recency or local
modification order.

#### Scenario: Explicit switch selects named change
- **WHEN** a target change is provided explicitly
- **THEN** the selector reports that change and its selection reason

### Requirement: Dependency reporting is read-only
Dependency-aware status, next, and dependency reporting SHALL NOT mutate GitHub
or local artifacts.

#### Scenario: Reporting commands are inspected
- **WHEN** status, next, and dependency CLIs are run with fixture input
- **THEN** they emit JSON reports and do not require credentials

