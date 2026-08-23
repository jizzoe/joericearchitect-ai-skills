## ADDED Requirements

### Requirement: Installed controller cleanup executes canonical local operations
The installed autonomous-SDD controller wrapper SHALL provide the canonical
fresh local-resource inspection, exact worktree removal, and exact local-branch
delete operations to the controller cleanup transition. It MUST use repository
Git-common state, retain remote branches, persist outcomes through the
controller record, and return a typed pause instead of substituting an
unverified manual cleanup path.

#### Scenario: Installed wrapper cleans a complete delivery
- **WHEN** the installed wrapper receives an exact completed controller record with eligible local resources and current Archive convergence evidence
- **THEN** it executes the controller cleanup transition and returns the persisted receipt-coupled outcomes

#### Scenario: Installed wrapper cannot inspect a safe resource
- **WHEN** the wrapper cannot freshly establish the required local eligibility for a registered resource
- **THEN** it returns a typed paused result and performs no removal
