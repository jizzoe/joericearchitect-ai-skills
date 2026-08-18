## ADDED Requirements

### Requirement: Same-session review workers produce local-review evidence
The `base-code-review` capability SHALL support a bounded same-session worker
for an explicitly authorized autonomous `prototype-rapid` quality loop. The
worker MUST remain read-only, receive only the bounded review scope and current
evidence needed for that review, return the existing structured findings
contract, and label its result `local-review`. The result MUST NOT be described
or accepted as independent, isolated, strict, production, approval, CI, test,
or OpenSpec Verify evidence. The implementing controller, not the review
worker, SHALL own any separately authorized correction and SHALL request fresh
local review after affected changes.

#### Scenario: Autonomous prototype requests bounded local review
- **WHEN** an authorized autonomous `prototype-rapid` loop supplies a bounded
  change scope, requirements, current tests, and execution identity
- **THEN** the worker returns read-only `local-review` evidence with ordered
  findings, gaps, assumptions, reviewed artifacts, and next action

#### Scenario: Objective finding is returned
- **WHEN** same-session review identifies a clear behavior-preserving defect
- **THEN** it classifies the finding `objective-fix` and leaves correction to
  the controller before a fresh review of the affected state

#### Scenario: Local evidence is presented as independent assurance
- **WHEN** a caller attempts to use same-session `local-review` evidence for a
  production independent-review gate or delivery approval
- **THEN** validation rejects the assurance mismatch and preserves the required
  production gate
