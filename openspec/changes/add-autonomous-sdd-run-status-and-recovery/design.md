## Context

M2-S2 delivered the durable backend and M2-S1 the transition/attempt state. This
slice adds a read-only status and recovery layer over them. It composes
`autonomous-sdd-local-store.mjs` (state paths, index rebuild) and
`autonomous-sdd-run-contract.mjs` (record validation) without changing either.
The v2 controller is not activated; delivery is the pre-v2/interactive lane.

## Goals / Non-Goals

**Goals:**

- Repository-wide discovery by canonical identity.
- A versioned, read-only status projection with typed classifications.
- Exact safe-resume/no-op/pause decisions.
- Read-only projection rebuild from history.

**Non-Goals:**

- Mutation, cleanup, claim takeover without permission, or lifecycle policy
  changes.

## Decisions

### D1 — Status shape and versioning

`run-status` record with `schemaVersion: 1`. The version is the compatibility
contract; an unrecognized version is treated as ambiguous and fails closed. The
human-readable view is derived from the same machine record.

Alternative: a bespoke unstructured report was rejected (no stable compatibility
contract).

### D2 — Typed classifications

Eight classifications derived only from durable facts (terminal receipts, claim
state/disposition, cleanup disposition, deadline, stop reason, projection
freshness). Unknown stop reasons are not guessed.

Alternative: a free-form status string was rejected (not machine-comparable).

### D3 — Resume semantics

`safe-resume` for running and retryable-infrastructure; `no-op` for complete;
typed pause for expired, waiting-human, quality-blocked,
configuration-discovery-gap, and ambiguous-legacy-state. Wrong-run and
wrong-repository always pause.

Alternative: auto-resuming on quality-blocked was rejected (unsafe).

### D4 — Projection rebuild is read-only

Rebuild rewrites only the index (runs/*.json and repository-status.json); it
never rewrites run history records.

Alternative: rewriting history to fix a projection was rejected (unsafe).

## Risks / Trade-offs

- [Misclassifying an active run] → classification reads only durable facts and
  fails closed to ambiguous-legacy-state on any missing/inconsistent record.
- [Leaking secrets in status] → status links evidence by digest and reference,
  never inlines evidence or secrets.
- [Activating real ownership] → the slice is read-only and stays contract-only.

## Migration Plan

No migration. The slice is additive and read-only. Rollback removes the module
and its tests without touching existing records.

## Open Questions

None. The two brief open questions are resolved: Q1 status shape/versioning =
D1; Q2 evidence summary versus reference = D2 (linked by reference).
