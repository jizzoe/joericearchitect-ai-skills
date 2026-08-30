## Why

Prior autonomous runs terminalized or cancelled their v2 runs but advanced the
controller checkpoint manually (via `gh` + parent scripts instead of
`advanceControllerLifecyclePhase` / `bindControllerLifecycleDelivery`), leaving
stale non-terminal schema-5 checkpoints under `.git/sdd-delivery-runs/runs/`.
The initializer correctly fails closed on those checkpoints
(`legacy-inventory-ambiguous`, per `autonomous-sdd-continuation` "Pending or
active schema-5 controller remains authoritative"), but there is no supported
path to reconcile a stale checkpoint whose archived v2 run already proves
terminalization or cancellation. The next run is therefore blocked.

## What Changes

- Extend legacy reconciliation to schema-5 controller checkpoints: a
  reconciliation receipt may re-classify a stale schema-5 checkpoint as
  `compatible-terminal` only when an exact owner-authorized binding and
  immutable local v2 archive evidence (terminalization or cancellation receipt)
  match the checkpoint's repository, selected change, run identity, and expiry.
- Expose a declared controller reconciliation transition (extending
  `reconcile-legacy-bootstrap-record`) that validates the binding and archive
  and publishes the reconciliation receipt.
- Add regression tests for terminalized-but-stale and cancelled-but-stale
  schema-5 checkpoints.

## Scope

Limited to the legacy reconciliation path for schema-5 checkpoints. The
fail-closed behavior for checkpoints whose terminal state is not proven remains
unchanged.

## Capabilities

### Modified Capabilities

- `autonomous-sdd-continuation`: add an owner-authorized reconciliation
  transition for stale schema-5 checkpoints that is verified against immutable
  archive evidence.

## Impact

- Affected assets: `scripts/sdd/autonomous-sdd-legacy-reconciliation.mjs`,
  `scripts/sdd/autonomous-sdd-legacy.mjs`, `scripts/sdd/autonomous-sdd-admission.mjs`,
  and their focused tests.
- Compatibility: unchanged fail-closed behavior for unproven checkpoints.
- Security: reconciliation requires an exact owner-authorized binding (approved
  scope digest, repository, selected change, record digest, future expiry) and
  publishes an immutable receipt; it never mutates or deletes the checkpoint or
  archive.

## Non-Goals

- Relaxing the fail-closed gate for checkpoints that are not proven terminal.
- Auto-advancing checkpoints from archives without owner authorization.
- Cleaning up the existing stale terminalized checkpoint (`controller-3f48e2d4…`,
  Run #2), applied after this repair through the new reconciliation path.
