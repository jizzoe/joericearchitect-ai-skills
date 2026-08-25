# Integrate Autonomous SDD Sync and Archive Delivery

## Why

Sync (delta-to-living-spec) and Archive (content-preserving move) are currently
bundled into one `openspec archive` call and can diverge from the delivered
implementation or duplicate shared-state mutations. This change makes them two
separately delivered, evidenced, recoverable lifecycle transitions with
deterministic conflict detection and repeat no-op proof.

## What Changes

- Add a delta-to-living-spec Sync contract that applies only the authorized
  delta, proves a repeat Sync is a no-op, and rejects invented, dropped,
  duplicated, or text-corrupted requirement descriptions or scenarios.
- Add an active-delta overlap graph (capability -> requirement -> operation) so
  a shared capability with a `MODIFIED` replacement conflict is serialized or
  reconciled before mutation; an unresolved overlap pauses fail-closed.
- Add an Archive contract that is content-preserving, idempotent, and
  destination-unique, running only after implementation and Sync are confirmed
  on the default branch.
- Encode the Sync-before-Archive checkpoint order (already present in
  `canonicalLifecycleSteps`).

## Capabilities

### New Capabilities

- `autonomous-sdd-sync-and-archive`: deterministic delta-to-living-spec Sync
  with repeat no-op proof, active-delta overlap/conflict detection, and
  content-preserving idempotent Archive planning.

### Modified Capabilities

None.

## Impact

- New `scripts/sdd/autonomous-sdd-sync-contract.mjs` and
  `scripts/sdd/autonomous-sdd-archive-contract.mjs` (plus focused tests).
- Wraps the existing `openspec archive` CLI deterministically rather than
  reimplementing it.
- Contract-only/audit; does not activate real ownership or production Apply.
