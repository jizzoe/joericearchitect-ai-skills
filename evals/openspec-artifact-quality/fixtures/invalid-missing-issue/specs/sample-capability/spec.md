## Purpose

Invalid issue-linkage fixture spec.

## ADDED Requirements

### Requirement: Fixture still has behavior
The fixture SHALL keep spec content valid while proposal linkage fails.

#### Scenario: Validator reaches proposal rule
- **WHEN** the fixture is validated
- **THEN** only the proposal linkage rule is expected to fail
