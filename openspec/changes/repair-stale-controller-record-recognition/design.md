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
schema-5 entry can be re-classified `compatible-terminal` when a validated
reconciliation receipt binds the exact reference, record digest, selected
entry, and repository. The existing
`validateLegacyReconciliationReceipt` contract already carries the required
identity fields and the `compatible-terminal` classification.

### Controller transition publishes the receipt

Extend `reconcile-legacy-bootstrap-record` (or add a sibling transition) so a
validated owner-authorized binding whose referenced checkpoint is a stale
schema-5 record with matching archive evidence publishes the receipt. The
receipt remains `v2Authority: false`, `nativeClaim: false`,
`legacyMutation: false` — it never creates a run, claim, or lifecycle phase.

### Regression tests

Add focused tests for: terminalized-but-stale and cancelled-but-stale schema-5
checkpoints reconciling to compatible-terminal with a valid binding, and
remaining ambiguous when the binding is missing, expired, or identity-mismatched.

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
