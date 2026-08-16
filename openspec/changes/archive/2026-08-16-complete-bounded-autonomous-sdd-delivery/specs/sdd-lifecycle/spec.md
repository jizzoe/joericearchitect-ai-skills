## ADDED Requirements

### Requirement: Autonomous phase entry is controller-routed
The SDD lifecycle SHALL allow complete valid autonomous delivery context to
continue through planning review, Apply, Verify, delivery, Sync, Archive, and
exact owned cleanup. It MUST preserve evidence and authorization gates and
retain standalone phase boundaries when no valid context exists.

#### Scenario: Valid request begins at a later phase entry
- **WHEN** valid selected-entry context is presented after interruption
- **THEN** lifecycle routes it to controller and runs only its first incomplete checkpoint

#### Scenario: Bare phase action is used
- **WHEN** a lifecycle phase has no valid delivery context
- **THEN** that phase remains bounded and grants no downstream delivery authority

### Requirement: Lifecycle completion includes owned-resource reconciliation
The lifecycle SHALL not report autonomous delivery complete until Archive,
configured issue and Project convergence, and finalizer outcomes are current.
Every ineligible or blocked exact resource MUST have durable classification and
recovery evidence.

#### Scenario: Finalization finds an ineligible resource
- **WHEN** finalization cannot safely remove an exact resource
- **THEN** lifecycle records its classification and recovery evidence
