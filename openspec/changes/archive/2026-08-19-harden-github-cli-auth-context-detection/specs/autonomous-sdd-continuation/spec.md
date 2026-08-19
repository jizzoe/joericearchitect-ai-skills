## ADDED Requirements

### Requirement: GitHub lifecycle actions retain authentication-context recovery evidence
Before an autonomous SDD lifecycle action invokes GitHub CLI, the controller
SHALL obtain current non-secret authentication-context evidence for its exact
authorized operation. On an authentication-shaped restricted-runtime failure,
the controller MUST use the canonical contrast diagnostic before classifying
the action as an invalid credential or a runtime-permission gap. It MUST retain
the normalized result and recovery reference in durable controller evidence
and MUST pause when the result is invalid-or-expired, host-denied, unknown,
expired, or mismatched.

#### Scenario: Exact issue intake encounters a restricted-runtime 401
- **WHEN** a current controller-bound issue intake probe fails with a
  normalized authentication-shaped restricted-runtime result
- **THEN** the controller performs only the bound read-only contrast path and
  preserves its safe recovery class before reconsidering the exact intake
  operation

#### Scenario: Authentication context does not authorize a new action
- **WHEN** host-context preflight succeeds for an autonomous lifecycle run
- **THEN** the controller still requires the selected-entry authorization,
  exact target binding, active runtime permission, and all lifecycle evidence
  before invoking a GitHub mutation
