## ADDED Requirements

### Requirement: Legacy bootstrap reconciliation is evidence-bound and non-mutating
The system SHALL allow an explicitly owner-authorized reconciliation of an
identified active legacy bootstrap controller record only by publishing a new,
immutable reconciliation receipt outside the legacy record. The receipt MUST
bind the legacy record's exact path and digest, selected change, repository
identity, authorized reconciliation scope and expiry, and fresh independently
verified issue, implementation, Sync, Archive, and exact-owned cleanup
evidence. Reconciliation MUST preserve the legacy record byte-for-byte, MUST
NOT create, advance, migrate, or claim a v2 run, and MUST reject any record,
authorization, evidence, expiry, or digest mismatch. The receipt MUST be
idempotent for the same input and MUST retain a recovery classification rather
than delete or overwrite audit evidence.

#### Scenario: Exact completed bootstrap record reconciles
- **WHEN** an owner-authorized reconciliation names a legacy record whose exact
  digest and selected change match fresh evidence for its closed issue, merged
  implementation, Sync, and Archive deliveries, and completed owned-resource
  cleanup
- **THEN** the system publishes one immutable terminal-reconciliation receipt
  outside the legacy record and leaves that record unchanged

#### Scenario: Evidence or identity is incomplete
- **WHEN** a proposed reconciliation lacks current evidence, has a mismatched
  record digest, selected change, repository, authorization scope, or expiry,
  or cannot prove exact owned-resource cleanup
- **THEN** the system retains the legacy record unchanged, publishes no
  terminal receipt, and reports a non-mutating pause with recovery evidence

#### Scenario: Reconciliation is retried
- **WHEN** the same authorized legacy record and evidence are submitted after a
  terminal reconciliation receipt already exists
- **THEN** the system returns the existing receipt without duplicating a record
  or changing legacy or v2 authority

### Requirement: V2 admission recognizes only verified terminal legacy reconciliation
The system SHALL continue to pause v2 admission for every active or ambiguous
legacy record unless a current immutable terminal-reconciliation receipt binds
that exact legacy record and proves the required completed lifecycle evidence.
Admission MUST treat the receipt as retirement of legacy blocking authority
only; it MUST NOT treat it as a v2 parent run, work unit, native claim,
transition attempt, or proof of authority for any new lifecycle action.

#### Scenario: Reconciled legacy record no longer blocks admission
- **WHEN** legacy inventory finds an active legacy record with a valid exact
  terminal-reconciliation receipt
- **THEN** it classifies that record as compatible terminal for admission while
  retaining both the legacy record and receipt as audit evidence

#### Scenario: Unrelated legacy record remains active
- **WHEN** legacy inventory finds an active or ambiguous legacy record without
  a valid exact terminal-reconciliation receipt
- **THEN** v2 admission pauses before creating a parent run, work unit, or
  native claim
