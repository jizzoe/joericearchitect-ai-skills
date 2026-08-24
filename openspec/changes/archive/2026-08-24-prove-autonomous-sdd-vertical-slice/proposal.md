## Why

M1 delivered the operation contract, the run/work-unit boundary, and runtime
configuration provenance, but no end-to-end vertical slice has proven that one
change can flow proposal → apply → verify → fresh-review-on-change before the
durable backend is built. M1's earlier activation of admission and claims
before a complete start-to-cleanup lifecycle existed is the exact failure this
slice inverts: prove the product path first, build durability afterward.

## What Changes

- Add a pure next-transition selector that consumes authoritative run state,
  the M1-S2 operation registry, current evidence, live checks, deadline, and
  correction budgets, and returns exactly one legal transition or a typed
  no-op/pause. It performs no I/O and never invents a transition, authority,
  or outcome.
- Add a bounded executor that acquires single-run ownership, persists a
  `prepared` attempt, invokes one fixed adapter, records `in-flight`, observes
  the result, and commits exactly one of `observed`, `committed`, or `in-doubt`
  through a minimal ephemeral store.
- Add fixed simulated (non-mutating) Propose, planning-conformance, Apply, and
  Verify adapters that mirror the `add-typescript-javascript-review` fixture
  template without editing a real repository or mutating GitHub.
- Add a thin sealed review loop that reuses the existing independent-review and
  verification skills and requires fresh review whenever a sealed binding
  changes (fresh-review-on-change; the reviewer never fixes).
- Add narrow role/context manifests for planner, implementer, verification
  worker, independent reviewer, and controller, mapped to existing
  `skills/base/*` skills.
- Add a minimal ephemeral store that records one disposable fixture run without
  writing real controller state and is explicitly distinct from the future
  durable backend.
- Prove both `production` and `prototype` authority profiles produce the same
  lifecycle facts with different approval requirements.
- Cover the selector and review-invalidation rules with a requirement-to-test
  map, an injected clock, and property/symmetry tests; restart, stale-owner,
  exhausted-budget, and malformed-outcome conditions produce exact typed pauses.

## Capabilities

### New Capabilities

- `autonomous-sdd-vertical-slice`: Defines the transition selection, simulated
  adapter, sealed review-invalidation, minimal ephemeral-store, role-manifest,
  and dual-profile behaviors that prove one disposable fixture change flows
  end-to-end before the durable backend is built.

### Modified Capabilities

None. The slice consumes the M1-S2 operation registry and the existing review
and verification skills as fixed authorities without changing their observable
requirements.

## Impact

- Affected assets: a new assistant-neutral vertical-slice module (selector,
  executor, simulated adapters, ephemeral store, review loop, role/context
  manifests), the disposable `add-typescript-javascript-review` fixture
  manifest, and focused unit/property fixtures. No existing runtime helper,
  controller record, or GitHub mutation path changes.
- Compatibility: the slice reuses the M1-S2 operation registry as the sole
  transition authority and the existing review/verification skills as adapters.
- Migration: none. The slice is additive, contract-only/audit, writes no real
  controller state, and is delivered by the pre-v2/interactive lifecycle
  (runtime N-1 delivers N), never by the controller it builds.
- Planning boundary: this proposal creates no implementation authority and does
  not invoke adapters or mutate external systems.
