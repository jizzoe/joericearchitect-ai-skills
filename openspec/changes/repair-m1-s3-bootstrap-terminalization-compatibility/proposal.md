## Why

M1-S3 added a stricter immutable work-unit format that includes a sealed
configuration snapshot. Its own already-admitted bootstrap run predates that
field, so the released terminalizer rejects the record before it can release
the claim. The run must close without rewriting history or falsely claiming
that it had the new snapshot at admission.

## What Changes

- Add a narrow, evidence-bound compatibility terminalization path for one
  pre-configuration-snapshot bootstrap work unit.
- Require explicit bootstrap compatibility evidence that binds the exact run,
  approved change, branch, released archive head, and expiry.
- Preserve the original work-unit bytes and record terminal evidence that
  truthfully distinguishes the legacy configuration shape.
- Reject every other missing-snapshot record, forged compatibility binding,
  stale evidence, or attempt to create a new run.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `autonomous-sdd-v2-terminalization`: allow one explicitly bound pre-feature
  work-unit record to terminalize without retroactively changing its admission.

## Impact

Changes the terminalization controller, its fixtures, the v2 terminalization
living specification, and the autonomous-blocker handoff. It adds no
credentials, dependencies, or new cross-assistant policy. The compatibility
binding remains product-local, expiry-bound, and is not reusable for later
runs.
