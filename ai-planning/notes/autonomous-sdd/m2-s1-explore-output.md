# M2-S1 Explore Output — Prove the Vertical Slice

Date: 2026-08-23
Change: `prove-autonomous-sdd-vertical-slice` (fixture template
`add-typescript-javascript-review`)
Workflow action: OpenSpec Explore (planning-only; no OpenSpec artifacts created).

## Selected design

Prove the vertical slice with simulated (non-mutating) adapters first, not the
durable backend. One disposable fixture change flows proposal → apply → verify →
fresh-review-on-change under a pure next-transition selector, a thin sealed
review loop, a minimal ephemeral store, and role/context manifests. Both
`production` and `prototype` authority profiles produce the same lifecycle facts
with different approval requirements. Delivery runs in the pre-v2/interactive
lane (runtime N-1 delivers N), never by the controller this slice builds.

## Scope

- M2-S1 pure next-transition selector.
- Simulated Propose / planning / Apply / Verify adapters (non-mutating).
- Thin sealed review loop and its invalidation rules.
- Role and context manifests.
- Minimal ephemeral store (never writes real controller state).
- Both authority profiles on the disposable `add-typescript-javascript-review`
  fixture.

Non-goals: durable backend, real repository edits, GitHub mutation, strict
review upgrade, Sync, Archive, or cleanup.

## Dependencies

- Delivered M1 slices.
- Accepted bootstrap/cutover stabilization (just Archived).

## Risks

- Recreating the durable backend too early (rejected by this selection).
- Activating real ownership before M4-S4.
- Open: finalize selector and adapter interface shapes after M1-S2; keep the
  minimal ephemeral-store schema distinct from the durable backend.

## Single implementation authorization request

Authorize the `prove-autonomous-sdd-vertical-slice` delivery through the
pre-v2/interactive lane, gated on finalizing the selector and adapter interface
shapes (M1-S2) and confirming the minimal ephemeral-store schema is not confused
with the durable backend. No implementation begins in this recovery; M2-S1
remains Propose-ready.
