## ADDED Requirements

### Requirement: Controller transitions bind exact derived records
Derived SDD authorization SHALL require each transition to bind selected entry,
repository, base branch, relevant full head, evidence reference, recovery,
and canonical checkpoint step. It MUST reject stale, duplicate, out-of-order,
or mismatched records.

#### Scenario: Next checkpoint has an exact record
- **WHEN** first incomplete checkpoint has one matching durable record and current evidence
- **THEN** authorization evaluates that exact transition only

#### Scenario: Caller substitutes a lookalike target
- **WHEN** requested target differs from durable selected-entry record
- **THEN** authorization rejects transition without accepting name similarity

### Requirement: Cleanup authorization remains exact and current
The evaluator SHALL require current post-Archive evidence and exact durable
resource record before cleanup. It MUST reject unrecorded paths, branch-only
ownership claims, expired context, and records for another entry.

#### Scenario: Unrecorded local path is supplied
- **WHEN** cleanup supplies a path absent from durable ownership records
- **THEN** authorization denies the cleanup action
