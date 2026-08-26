## Why

An admitted autonomous delivery can remain permanently at `propose`: the
controller has an internal phase-advance function but no installed,
receipt-backed transition that persists it. If such a run is blocked before
work begins, cancellation also requires waiting for expiry, unnecessarily
holding its repository claim and preventing safe recovery.

## What Changes

- Expose one validated installed-controller transition that records current
  evidence for only the first incomplete lifecycle phase and persists the
  resulting immutable run checkpoint.
- Add a separately authorized early-retirement transition for an exact,
  admitted, undelivered blocked run; it must release only its matching claim
  and preserve cancellation—not delivery—history.
- Add direct, installed-wrapper, interruption, identity-mismatch, and
  idempotency regression coverage for both transitions.

## Scope and Non-Goals

Scope is controller checkpoint advancement and recovery of a run that cannot
legitimately progress. It does not weaken delivery gates, permit direct
checkpoint editing, create a replacement claim, alter unrelated runs, or
change normal completed-run terminalization.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `autonomous-sdd-continuation`: An admitted controller must expose a durable,
  evidence-bound first-incomplete-phase transition through its installed API.
- `autonomous-sdd-v2-terminalization`: An exact owner-authorized blocked run
  may be retired before expiry without being represented as delivered.

## Impact

- Affected assets: canonical controller and admission/terminalization logic,
  the installed controller entrypoint, lifecycle guidance, and focused runtime
  tests.
- This is assistant-neutral: Claude and Codex use the same declared helper and
  thin wrappers, with repository identity and exact run IDs supplied as inputs.
- GitHub issue #245 tracks the separately authorized bootstrap delivery; its
  linkage is recorded in `tracking.yaml`.
- Reuse plan: retain canonical controller behavior in `scripts/sdd/`, preserve
  product values in typed request records, and avoid credentials or raw
  external evidence in checkpoints.
