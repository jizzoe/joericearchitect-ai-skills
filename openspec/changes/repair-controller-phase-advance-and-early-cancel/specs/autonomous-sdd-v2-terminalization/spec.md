## ADDED Requirements

### Requirement: Exact owner-authorized blocked runs can retire before expiry
The controller SHALL provide a receipt-backed early-retirement transition for
an admitted, undelivered exact run that cannot progress because a required
installed controller transition is unavailable. It MUST require a separate,
unexpired owner authorization bound to the controller run, parent run, work
unit, claim, repository, selected change, blocking reason, and recovery
reference. On success it MUST preserve immutable cancellation history, release
only the matching active claim, and report the run as retired rather than
delivered or complete.

#### Scenario: Exact blocked run retires safely
- **WHEN** a current owner authorization exactly matches an admitted blocked
  run with no delivery evidence
- **THEN** the controller writes a cancellation/retirement receipt, releases
  only that run's claim, and archives the run without delivery completion

#### Scenario: Early retirement authority is missing or mismatched
- **WHEN** early-retirement authorization is missing, expired, broad, or does
  not exactly match the controller, parent, work unit, claim, repository,
  selected change, or blocking reason
- **THEN** the controller pauses without changing the claim or durable records

#### Scenario: Delivered or progressing run cannot use early retirement
- **WHEN** a run has delivery evidence or its required controller transition
  is available
- **THEN** early retirement is rejected and ordinary lifecycle or expired-run
  cancellation behavior remains unchanged
