## ADDED Requirements

### Requirement: Reconciliation is a controller-gated pre-admission checkpoint
The autonomous SDD controller SHALL expose reconciliation as a distinct,
non-lifecycle pre-admission checkpoint and SHALL require an exact
owner-authorized legacy-record binding before it examines or publishes a
reconciliation receipt. The checkpoint MUST use assistant-neutral canonical
behavior through thin Claude and Codex entrypoints, preserve non-secret
evidence and recovery references, and return control to ordinary v2 admission
only after successful terminal reconciliation. It MUST NOT select an OpenSpec
lifecycle phase, create a v2 run, or perform GitHub mutation as part of the
checkpoint.

#### Scenario: Controller performs a valid reconciliation checkpoint
- **WHEN** Codex or Claude submits the same valid exact reconciliation request
  through the canonical controller entrypoint
- **THEN** both receive the same durable receipt result and neither entrypoint
  creates a lifecycle run or selects a change phase

#### Scenario: Controller receives an unauthorized reconciliation request
- **WHEN** the controller receives a reconciliation request with missing,
  expired, conflicting, or broader-than-bound legacy authority
- **THEN** it pauses before modifying controller state, legacy records, v2
  admission state, or external lifecycle resources
