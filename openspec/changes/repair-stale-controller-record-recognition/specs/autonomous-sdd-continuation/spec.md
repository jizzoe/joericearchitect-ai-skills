## ADDED Requirements

### Requirement: Stale schema-5 checkpoint reconciliation requires owner authorization and archive evidence

The system SHALL reconcile a non-terminal schema-5 controller checkpoint as
compatible terminal only when an exact owner-authorized reconciliation binding
and immutable local v2 archive evidence bind the same repository, selected
change, run identity, and expiry. Reconciliation MUST publish an immutable
receipt and MUST NOT mutate or delete the checkpoint or its archive. An
unauthorized, expired, or mismatched binding MUST leave the checkpoint ambiguous
and pause initialization without mutation.

#### Scenario: Owner-authorized stale checkpoint reconciles

- **WHEN** a stale schema-5 checkpoint matches an exact owner-authorized
  reconciliation binding and its archived v2 run contains a matching
  terminalization or cancellation receipt
- **THEN** initialization classifies the checkpoint compatible terminal and
  continues ordinary admission without rewriting the checkpoint or archive

#### Scenario: Unauthorized or mismatched reconciliation is rejected

- **WHEN** a reconciliation binding is missing, expired, or does not match the
  checkpoint's repository, selected change, record digest, or expiry
- **THEN** the checkpoint remains ambiguous and initialization pauses without
  mutation
