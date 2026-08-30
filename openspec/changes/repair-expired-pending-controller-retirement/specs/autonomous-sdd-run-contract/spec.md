## ADDED Requirements

### Requirement: Expired never-admitted controller retirement is exact and non-mutating
The system SHALL allow an explicitly owner-authorized retirement of one expired
schema-5 controller checkpoint whose admission remains `pending` only when the
authorization binds the exact checkpoint path and byte digest, controller and
derived v2 identities, repository, selected change, provider, original expiry,
and a future retirement-authority expiry. Before publishing retirement evidence,
the system MUST prove that the checkpoint has no lifecycle progress or owned
resources and that no matching active or archived v2 parent run, work unit,
claim, cancellation, or terminalization exists. Retirement MUST publish an
immutable sidecar receipt, preserve the checkpoint byte-for-byte, create no v2
record or claim, and grant no lifecycle authority.

#### Scenario: Exact expired pending checkpoint retires
- **WHEN** an expired never-admitted pending checkpoint matches current exact
  owner authority and the configured repository state proves that none of its
  derived v2 records exists
- **THEN** the system publishes one immutable non-authority retirement receipt
  and leaves the checkpoint unchanged

#### Scenario: Pending checkpoint is not safe to retire
- **WHEN** the checkpoint is current, admitted, progressed, malformed,
  identity-mismatched, or has matching active or archived v2 state
- **THEN** the system publishes no receipt, changes no controller or v2 state,
  and reports a typed pause with recovery evidence

#### Scenario: Exact retirement is retried
- **WHEN** the identical exact retirement request is retried after its immutable
  receipt exists
- **THEN** the system returns the existing receipt without duplicating or
  replacing evidence

### Requirement: Inventory recognizes only evidenced pending-controller retirement
Legacy inventory SHALL classify an expired schema-5 `pending` checkpoint as
compatible terminal only when a valid immutable pending-controller retirement
receipt binds its exact path, byte digest, run identity, selected change, and
repository. The receipt MUST remain non-authoritative for v2 admission and MUST
NOT operate as a caller-selected inventory exclusion.

#### Scenario: Retired pending checkpoint no longer blocks admission
- **WHEN** inventory finds an expired pending checkpoint and its exact valid
  immutable retirement receipt
- **THEN** it retains both records as audit evidence and classifies that
  checkpoint compatible terminal before ordinary v2 admission checks

#### Scenario: Pending retirement evidence is absent or mismatched
- **WHEN** a pending checkpoint has no receipt or its receipt conflicts with the
  path, bytes, identity, selected change, or repository
- **THEN** inventory preserves the checkpoint, classifies it ambiguous, and
  blocks admission before a claim is created
