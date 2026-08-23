## ADDED Requirements

### Requirement: Expired unfinished controllers can be cancelled and retired
The system SHALL provide a receipt-backed cancellation/retirement operation for
an exact expired, unfinished controller. It MUST accept only the exact
controller, parent run, work unit, and claim identities, prove the run is
expired and not delivered, record the run as cancelled rather than completed,
preserve immutable history, and release only that exact claim. It MUST NOT
infer authority over another run or fabricate delivery-terminalization
evidence.

#### Scenario: Expired unfinished controller is cancelled
- **WHEN** an exact expired controller has an active claim and no delivered or terminalized evidence
- **THEN** the system records a cancellation receipt, marks the run cancelled, and releases only that exact claim

#### Scenario: Cancellation targets a delivered or unexpired run
- **WHEN** the exact controller is not yet expired or already has delivered or terminalized evidence
- **THEN** the system returns a typed pause and leaves the run and claim unchanged

#### Scenario: Cancellation identity is mismatched
- **WHEN** the cancellation request does not exactly match the controller, parent run, work unit, or claim
- **THEN** the system rejects it without releasing any claim
