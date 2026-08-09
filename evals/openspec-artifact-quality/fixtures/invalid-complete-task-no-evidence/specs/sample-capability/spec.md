## Purpose

Invalid task-evidence fixture spec.

## ADDED Requirements

### Requirement: Fixture still has behavior
The fixture SHALL keep spec content valid while task evidence fails.

#### Scenario: Validator reaches task rule
- **WHEN** the fixture is validated
- **THEN** the missing completed-task evidence rule is expected to fail
