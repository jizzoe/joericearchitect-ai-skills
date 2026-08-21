## ADDED Requirements

### Requirement: Autonomous continuation consumes normalized operation-contract inputs
Before lifecycle selection, autonomous continuation SHALL obtain the effective
authorization, profile, review policy, agent topology, allowed operation set,
and typed gate/outcome contract from the canonical autonomous SDD operation
contract. It MUST bind the normalized values and their source to durable
admission evidence. The controller MUST use compact public lifecycle stages and
registry-defined internal operations rather than inferring policy from a
skill name, caller, or free-form model output.

#### Scenario: Controller begins an admitted run
- **WHEN** v2 admission accepts a target-explicit autonomous request
- **THEN** the controller persists and uses the matching normalized
  operation-contract inputs before selecting its first lifecycle checkpoint

#### Scenario: Continuation input conflicts with the operation contract
- **WHEN** a requested profile, review policy, topology, stage, or operation
  conflicts with the canonical normalized contract
- **THEN** the controller pauses before lifecycle selection and preserves the
  conflicting durable evidence
