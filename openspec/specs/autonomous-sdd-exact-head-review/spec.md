# autonomous-sdd-exact-head-review Specification

## Purpose

Binds autonomous review and bounded correction to the exact Apply evidence,
package, artifacts, assurance contract, and code head, so closeout reuses
exact-head assurance while any review-relevant change invalidates it and forces
a fresh exact-head rereview.

## Requirements

### Requirement: Review binds to the exact head and a defined invalidation set
The system SHALL bind each review to the exact code head and to the sealed
package digest, artifact manifest digest, Apply-evidence digest,
findings-dispositions digest, policy-gate digest, reviewer identity, and
assurance level.

#### Scenario: Binding records every review-relevant input
- **WHEN** a review passes on one head
- **THEN** the durable binding records the head plus every invalidation-set
  digest

### Requirement: Any review-relevant change invalidates assurance
The system SHALL invalidate a prior review when the code head or any
invalidation-set digest changes. A changed-head or changed-input fixture MUST
invalidate, and no stale review SHALL satisfy the gate.

#### Scenario: Changed head invalidates
- **WHEN** the code head changes after a review
- **THEN** the prior review is invalidated and a fresh exact-head rereview is
  required

#### Scenario: Changed reviewer or assurance invalidates
- **WHEN** the reviewer identity or assurance level changes
- **THEN** the prior review is invalidated

### Requirement: Closeout reuses review only while the head and set are unchanged
Merge, Sync, Archive, cleanup, issue-close, and project-done SHALL reuse the
review only while the code head and the invalidation set are unchanged. Sync and
Archive move spec/docs/metadata, not production code, and MUST NOT by themselves
invalidate.

#### Scenario: Unchanged non-code closeout does not launch a redundant reviewer
- **WHEN** a closeout transition runs with the head and invalidation set
  unchanged
- **THEN** the system reuses the review and does not launch a new reviewer

#### Scenario: Changed head during closeout invalidates
- **WHEN** a closeout transition runs after a review-relevant change
- **THEN** the system invalidates and requires a fresh exact-head rereview

### Requirement: Correction changes the head and requires fresh rereview
An objective correction SHALL change the head, invalidate the prior review, and
require a fresh exact-head rereview within the existing per-signature correction
budget. An exhausted signature SHALL block rather than reset.

#### Scenario: Correction triggers rereview
- **WHEN** an objective correction is applied within budget
- **THEN** the head changes and a fresh exact-head rereview is required

#### Scenario: Exhausted signature blocks
- **WHEN** a signature reaches its correction budget without resolution
- **THEN** the system blocks and does not reset the budget

### Requirement: Stale, wrong, or self review cannot pass
Wrong-head, wrong-package, self-review, and stale local/CI evidence SHALL NOT
satisfy the gate.

#### Scenario: Wrong-head evidence is rejected
- **WHEN** review evidence binds a head other than the exact sealed head
- **THEN** the system rejects it
