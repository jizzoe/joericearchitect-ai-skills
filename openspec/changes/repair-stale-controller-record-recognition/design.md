## Context

The initializer's legacy inventory classifies non-terminal schema-5 checkpoints
as `ambiguous` (fail-closed) because the runs were terminalized/cancelled after
manual phase advancement. The existing reconciliation machinery
(`reconcile-legacy-bootstrap-record` + `legacy-reconciliation-receipt`) only
re-classifies schema v1–4 `active-legacy` records, so there is no path to
reconcile these stale schema-5 checkpoints.

## Goals / Non-Goals

**Goals:** a deterministic owner-authorized reconciliation path that re-classifies
a stale schema-5 checkpoint as `compatible-terminal` only when its archived v2
run proves terminalization/cancellation; immutable receipt; no mutation of the
checkpoint or archive.

**Non-Goals:** relaxing the fail-closed gate, auto-advancing checkpoints, or
cleaning up the existing stale checkpoint within this change.

## Decisions

### Extend reconciliation to schema-5 ambiguous checkpoints

In `inventoryLegacyRecords`, extend the receipt-matching branch so an `ambiguous`
schema-5 entry can be re-classified `compatible-terminal` when a schema-2
reconciliation receipt binds the exact reference, record digest, controller
run ID, selected entry, and repository. Schema 1–4 records retain the schema-1
receipt contract. Unknown or future controller schemas are never receipt-
reconcilable.

### Controller transition publishes the receipt

Extend `reconcile-legacy-bootstrap-record` so a validated owner-authorized
binding whose referenced checkpoint is a stale schema-5 record inspects the
configured local v2 state root. It requires exactly one archive for the
checkpoint's admitted parent run, no matching active run, exactly one valid
terminalization or cancellation receipt, and mutually consistent parent,
work-unit, claim, claim-release, projection, and archive-manifest records. The
archive must bind the checkpoint's authorization, deadline, repository ID,
selected entry, admitted identities, provider, and terminal summary. The
configured canonical Git remote must normalize to the checkpoint's textual
repository and derive the same repository ID as the archive; caller-supplied
IDs cannot bridge repositories. Generic delivery evidence cannot satisfy
schema-5 reconciliation. The immutable
admitted parent record must retain its canonical empty `children` list; the
single terminal child summary is owned by `projection.json`, and a nonempty or
conflicting parent child list is rejected.

The published schema-2 reconciliation receipt carries the controller run ID,
terminal evidence kind, and a digest of the validated archive records in
addition to the exact checkpoint reference and byte digest. It remains
`v2Authority: false`, `nativeClaim: false`, `legacyMutation: false` — it never
creates a run, claim, or lifecycle phase.

### Regression tests

Add focused tests that build real archived v2 bundles for both terminalized-
but-stale and cancelled-but-stale schema-5 checkpoints. Confirm reconciliation
from those archives, rejection of generic delivery evidence and mismatched
repository state, refusal to reconcile future schemas, and preservation of the
checkpoint bytes.

## Risks / Trade-offs

- [Weakening fail-closed] → reconciliation is owner-authorized, identity-exact,
  expiry-bound, and archive-verified; unproven checkpoints still pause.
- [Record drift] → the receipt is keyed to the exact reference + record digest.
- [Over-reconciliation] → only the exact referenced record is re-classified.

## Verification Strategy

Focused unit tests for both reconcile and reject paths; `openspec validate
--all --strict`; existing admission tests remain green (fail-closed behavior
unchanged).

## Attribution and Licensing

No third-party code, dependency, or copied asset is introduced.
