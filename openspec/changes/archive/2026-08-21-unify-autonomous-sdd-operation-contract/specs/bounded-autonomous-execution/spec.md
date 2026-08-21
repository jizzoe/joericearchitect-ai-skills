## ADDED Requirements

### Requirement: Bounded execution routes through canonical operation outcomes
An autonomous SDD runner SHALL use the canonical operation-contract registry
to evaluate execution gates and route every operation result. It MUST retain
existing authorization, target, adapter, runtime-permission, evidence,
correction-budget, and human-pause controls; selecting a `single-agent` or
`multi-agent` topology MUST NOT weaken any of those controls.

#### Scenario: Operation outcome is handled during bounded execution
- **WHEN** a registry-defined operation completes or fails during an active
  bounded run
- **THEN** the runner records and follows its sole canonical disposition before
  considering another operation

#### Scenario: Topology selection changes context separation only
- **WHEN** a run uses an explicit or automatically selected agent topology
- **THEN** the runner preserves the same authorization, quality, review, and
  safety gates regardless of the number of agent contexts
