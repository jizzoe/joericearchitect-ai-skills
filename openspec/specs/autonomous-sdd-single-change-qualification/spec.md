# autonomous-sdd-single-change-qualification Specification

## Purpose
Records and gates the two independent single-change qualification gates: a
ten-run real-completion streak and a disposable fault-matrix gate, and grants
qualified-opt-in only when both pass.
## Requirements
### Requirement: Real-completion streak counts consecutive completions
The system SHALL count the trailing run of `completed` real runs and meet the
threshold only when that streak reaches the configured threshold (default 10).

#### Scenario: Streak meets threshold
- **WHEN** the last ten real runs are all `completed`
- **THEN** the streak reports met at ten

#### Scenario: Break resets the streak
- **WHEN** a non-`completed` run follows completed runs
- **THEN** the streak resets and does not meet the threshold

### Requirement: Defect-staled runs restart the streak
A discovered defect that could affect prior real runs SHALL mark those runs
stale and restart the streak.

#### Scenario: Defect affects prior runs
- **WHEN** a defect could have affected prior real runs
- **THEN** those runs are classified stale-prior-runs and the streak restarts

### Requirement: Matrix rows declare the full scenario contract
Each fault-matrix row SHALL declare scenario, environment, isolation proof,
injection boundary, allowed mutations, expected outcome, evidence, cleanup
contract, bound, and counter effect. The counter effect MUST be
`fault-matrix-only`.

#### Scenario: Missing field is rejected
- **WHEN** a matrix row omits a required field
- **THEN** the row is invalid and names the missing fields

#### Scenario: Non-fault counter effect is rejected
- **WHEN** a matrix row declares a counter effect other than `fault-matrix-only`
- **THEN** the row is invalid

### Requirement: Matrix outcome must match expectation
A fault-matrix row SHALL pass only when its actual outcome equals its expected
outcome.

#### Scenario: Mismatched outcome fails
- **WHEN** a row's actual outcome differs from its expected outcome
- **THEN** the row fails and blocks qualification

### Requirement: Fault-matrix gate passes only with no failed rows
The fault-matrix gate SHALL pass only when every row passes. A failed row SHALL
block qualification.

#### Scenario: A failed row blocks
- **WHEN** any matrix row fails
- **THEN** the fault-matrix gate does not pass

### Requirement: Release requires both gates
Qualified-opt-in SHALL be granted only when the real-completion gate and the
fault-matrix gate both pass. Fault-matrix rows SHALL NOT count toward the
real-run streak.

#### Scenario: Both gates pass
- **WHEN** the real-completion streak meets the threshold and the fault-matrix
  gate passes
- **THEN** the release decision is qualified-opt-in

#### Scenario: One gate missing
- **WHEN** either gate has not passed
- **THEN** the release decision names the missing gates and is not qualified

