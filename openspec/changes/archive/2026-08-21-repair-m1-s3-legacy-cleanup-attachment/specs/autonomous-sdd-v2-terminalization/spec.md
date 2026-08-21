## ADDED Requirements

### Requirement: Exceptional bootstrap terminalization requires persisted cleanup attachment
Before terminalizing a bootstrap-compatible pre-feature work unit, the system
MUST verify a persisted cleanup attachment bound to the exact parent run, work
unit, claim, repository, approved change, and compatibility archive head. The
attachment MUST contain a completed or already-completed receipt for every
attached resource and an explicit retained classification for every bound
ineligible resource. A caller-supplied `cleanupCompleted` flag alone MUST NOT
serve as terminalization evidence.

#### Scenario: Attached cleanup permits exceptional terminalization
- **WHEN** the exact bootstrap compatibility binding and persisted cleanup
attachment prove every bound resource has a terminal receipt or retained
classification
- **THEN** the terminalizer may release and archive only that matching active
run without rewriting admission history

#### Scenario: Cleanup flag lacks attached receipts
- **WHEN** a bootstrap terminalization request asserts completed cleanup but
has no matching persisted cleanup attachment and receipts
- **THEN** the terminalizer returns a typed pause and preserves the active run
and claim

#### Scenario: Attachment belongs to another bootstrap run
- **WHEN** a persisted cleanup attachment does not exactly match the requested
bootstrap run or compatibility archive head
- **THEN** the terminalizer rejects it without releasing any claim
