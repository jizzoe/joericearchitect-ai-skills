## Context

The slice runs in the pre-v2/interactive lane and is delivered by the ordinary
OpenSpec lifecycle, never by the v2 controller it builds. It reuses the M1-S2
operation registry (see `openspec/specs/autonomous-sdd-operation-contract/`) as
the sole transition authority and the existing `independent-review` and
`base-verification-loop` skills as the thin review loop. No durable backend
exists yet (that is M2-S2 `add-autonomous-sdd-local-execution-backend`); this
slice must therefore remain contract-only/audit and write no real controller
state. The fixture template `add-typescript-javascript-review` (a planned
non-SDD skill) supplies the proposal/design/tasks shape and the verification
commands that the simulated adapters mirror.

## Goals / Non-Goals

**Goals:**

- Finalize the selector and adapter interface shapes on top of M1-S2.
- Finalize a minimal ephemeral-store schema that cannot be confused with the
  durable backend.
- Prove one fixture change completes proposal → apply → verify →
  fresh-review-on-change with typed stops, for both authority profiles.
- Make the selector and review-invalidation rules deterministically testable.

**Non-Goals:**

- A durable backend, real repository edits, GitHub mutation, strict-review
  upgrade, Sync, Archive, cleanup, or real role execution.

## Decisions

### D1 — Pure selector signature
`selectNextTransition(ctx) -> Transition | Pause`, where `ctx` is the
authoritative state, operation registry, current evidence, precomputed live
checks, deadline, and correction budgets. The selector performs no I/O and
returns at most one transition.
Alternative: a selector with embedded effects was rejected because it is harder
to test and can make replay nondeterministic.

### D2 — Write-ahead executor states
The executor acquires a single-run ownership token, persists `prepared`, records
`in-flight`, observes, and commits exactly one of `observed`, `committed`, or
`in-doubt`. Interrupted external success reconciles before any retry.
Alternative: invoking an adapter without a write-ahead attempt was rejected
because it duplicates mutation on retry.

### D3 — Adapter interface
`{ id, capability, invoke(input) -> output }`. Input is immutable and
capability-scoped (operation ID, target, profile, attempt, evidence references;
no credentials). Output is validated data and cannot select the next transition
or expand authority. The four simulated adapters mirror the fixture template and
are non-mutating.
Alternative: letting a model choose adapters or return transitions was rejected
because it expands authority.

### D4 — Ephemeral store schema
An in-memory map plus a disposable file snapshot for the single fixture run,
with schema: run identity, stage, attempts (operation ID, write-ahead state,
outcome, evidence reference, injected-clock timestamp), and transitions. It is
namespace-isolated from real controller checkpoints (`runs/<id>/controller.json`)
and from the future durable backend (no history, projection, claim, or takeover).
Alternative: reusing the real controller record was rejected because the slice
must not write real controller state and must not be confused with the durable
backend.

### D5 — Thin sealed review loop
Wrap the existing independent-review and verification skills. The sealed package
is the artifact-manifest digest plus exact head/tree, Apply evidence, findings
dispositions, and policy-gate digest. Any change invalidates reuse and requires
fresh review; the reviewer never fixes.
Alternative: a bespoke review engine was rejected because those skills already
own review behavior.

### D6 — Role/context manifests
Data-only manifests for planner, implementer, verification worker, independent
reviewer, and controller, each mapping to an existing `skills/base/*` skill. No
new skill is created.
Alternative: embedding role policy in the selector was rejected because roles
are fixed adapters, not transition authority.

### D7 — Dual profiles on one fixture
`production` and `prototype` run the same fixture and emit the same lifecycle
facts; only approval requirements differ (`prototype` = same-session-local,
`production` = strict independent review, no degradation).
Alternative: separate fixtures per profile was rejected because it would not
prove the facts are profile-independent.

### D8 — Deterministic test strategy
A requirement-to-test map, an injected clock (no calendar-sensitive
authorization tests), and property/symmetry tests for the selector
(determinism) and review invalidation (unchanged → reuse, changed → fresh).
Alternative: wall-clock-dependent tests were rejected because they are flaky
across dates.

### D9 — Delivery lane
Delivered by the pre-v2/interactive lifecycle; runtime N-1 delivers N. The slice
never activates real ownership.
Alternative: routing the slice through the v2 controller was rejected because
that would be self-referential (the controller being proven would run its own
delivery).

## Risks / Trade-offs

- [Recreating the durable backend] → the store is explicitly ephemeral and
  namespace-isolated; tasks forbid durable history, projection, claim, or
  takeover primitives.
- [Activating real ownership] → no real controller, claim, or archive write;
  the result stays contract-only/audit.
- [Selector drifts from the operation registry] → the selector reads the
  registry as data and never hardcodes a transition.
- [Review loop treated as strict review] → the loop is deliberately thin; the
  strict-review upgrade is M3-S1, out of scope here.
- [Fixture embeds a product value] → the fixture template is configuration, not
  a constant in reusable code.

## Migration Plan

No runtime migration. The slice is additive and contract-only. Rollback removes
the slice's module and fixtures without touching existing runtime helpers,
controller records, or history.

## Open Questions

None. The two brief open questions are resolved here: selector and adapter
shapes are D1–D3; the ephemeral-store schema and its separation from the
durable backend are D4.
