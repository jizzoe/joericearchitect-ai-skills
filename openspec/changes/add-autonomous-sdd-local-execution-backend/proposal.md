## Why

M2-S1 proved one disposable fixture change flows proposal → apply → verify →
fresh-review-on-change, but that slice deliberately used a minimal ephemeral store
with no durable history, claim, or takeover. The durable backend primitives
already exist from M1 and the bootstrap/cutover recovery (local store, run
contract, v2 controller, admission, legacy inventory), but two things are missing
to make them a coherent, proven local durable execution backend:

1. Terminal schema-5 controller compatibility only recognizes a
   `terminalization-receipt` archive, so a controller that was cancelled and
   retired (its run archived with a `cancellation-receipt` and released claim)
   still pauses a future v2 admission. This is exactly the stranded
   `controller-cf2ecbc…` checkpoint left at `propose` by the 2026-08-23 recovery.
2. The backend scope and its fail-closed acceptance evidence (kill/restart,
   second-runner denial, exact takeover, provider-capability fail-closed,
   discovery, legacy inventory) are not yet formalized as one capability.

## What Changes

- Extend terminal v2-controller compatibility to accept a cancelled terminal
  bundle (`cancellation-receipt` plus a `claim-release` with a
  cancellation-receipt digest reference plus a `projection`) as terminal, bound
  to the exact controller run identity. A cancelled-and-retired schema-5
  checkpoint is retired by recognition, never by hand-editing.
- Formalize the local single-writer durable execution backend as one capability:
  storage outside disposable worktrees, authoritative append-only history,
  rebuildable projection, ownership with a generation fence, one coarse
  repository-wide claim, operator-directed conclusive takeover, discovery by
  canonical repository identity, and read-only legacy inventory.
- Prove the acceptance evidence with focused tests: kill/restart preserves or
  reconstructs state, a second runner is denied, exact takeover increments the
  ownership generation and blocks the stale owner, a weaker or different
  provider fails closed, and ambiguous legacy state remains untouched.

## Capabilities

### New Capabilities

- `autonomous-sdd-local-execution-backend`: Defines the local single-writer
  backend's storage, history, projection, ownership, coarse claim, takeover,
  discovery, and legacy-inventory behaviors and their fail-closed acceptance
  evidence.

### Modified Capabilities

- `autonomous-sdd-run-contract`: Terminal v2-controller compatibility now
  recognizes a cancelled terminal bundle (`cancellation-receipt`) as terminal
  alongside a `terminalization-receipt` bundle.

## Impact

- Affected assets: `scripts/sdd/autonomous-sdd-admission.mjs` (terminal
  compatibility), `scripts/sdd/test/autonomous-sdd-admission.test.mjs` (new
  cancellation-retirement test), and the new
  `autonomous-sdd-local-execution-backend` living spec.
- Compatibility: no record schema changes; the `cancellation-receipt` and
  `claim-release` records are already first-class and now gain terminal
  compatibility recognition.
- Migration: none. The result stays contract-only/audit and does not activate
  real lifecycle ownership. The stranded `controller-cf2ecbc…` checkpoint is
  retired by recognition on the next admission.
- Planning boundary: this proposal creates no implementation authority and does
  not activate the v2 controller or real ownership.
