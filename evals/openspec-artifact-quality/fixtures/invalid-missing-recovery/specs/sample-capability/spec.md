## Purpose

Invalid missing-recovery fixture spec.

## ADDED Requirements

### Requirement: Fixture still has behavior
The fixture SHALL keep spec content valid while design recovery fails.

#### Scenario: Validator reaches design rule
- **WHEN** the fixture is validated
- **THEN** the missing design recovery rule is expected to fail
