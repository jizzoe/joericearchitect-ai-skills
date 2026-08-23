# M2-S2 — Deterministic Transition Engine

Date: 2026-08-20
Status: Draft for owner review; blocked on M2-S1.
Proposed change: `add-autonomous-sdd-transition-engine`

## 1. Problem and desired outcome
Problem: No executable controller deterministically selects, invokes, and commits exactly one permitted transition.
Desired outcome: A pure next-transition function and bounded adapter executor complete a simulated single-change run with durable recovery.

## 2. Evidence and key findings
- [Build-vs-buy research](../../research/reliability-engineering/durable-execution-build-vs-buy/durable-execution-build-vs-buy-findings.md)
  supports a small local first substrate, a portable domain contract, and
  later reevaluation of Temporal or another established backend.
- The [main design](../autonomous-sdd-reliability-control-plane.md) supplies
  the shared architecture, invariants, role boundaries, and accepted sequencing
  that this slice must preserve.
- The [roadmap](../../plans/autonomous-sdd-reliability-control-plane-roadmap.md)
  is the authority for this slice's dependencies, readiness, execution order,
  and containing milestone exit evidence.

## 3. Options considered and tradeoffs
- Let agents select tools.
- Encode the lifecycle in one monolith.
- Separate domain transition selection, backend persistence, and fixed adapters.

## 4. Decisions, assumptions, and owner
- Owner: Initiative owner; transition policy is governed by the accepted M1 contracts.
- Confirmed decisions: A pure selector chooses the next legal operation; fixed
  adapters execute it; write-ahead attempts and authoritative observations
  determine retry, pause, failure, or commit.
- Approval evidence: The owner accepted deterministic orchestration and durable
  role handoffs in the master design; adapter implementation is not authorized.
- Assumptions: M2 uses simulated adapters only, so engine mechanics can be
  qualified without repository or external mutation.

## 5. Scope, non-goals, constraints, dependencies, and risks
- Scope: M2-S2 deterministic transition engine, attempt envelopes, simulated adapters, retry/correction/pause handling, and replay convergence.
- Non-goals: Real repository edits, GitHub mutations, strict review, Sync, Archive, or cleanup.
- Constraints: No model may invent transitions, authority, outcomes, or recovery;
  interrupted external success must reconcile before retry.
- Dependencies: M2-S1 and all accepted M1 contracts.
- Risks: Mixing selection, effects, and persistence could make replay
  nondeterministic or duplicate mutations when real adapters arrive.

### Proposed engine

- A pure selector consumes authoritative state, operation graph, current
  evidence, live checks, deadline, and budgets, and returns one transition or a
  typed no-op/pause. It performs no I/O.
- The executor acquires ownership, persists `prepared`, invokes one fixed
  adapter, records `in-flight`, observes external state where applicable, and
  commits `observed`, `committed`, or `in-doubt` through the backend.
- Adapter input is immutable and capability-scoped. Adapter output is validated
  data and cannot select the next transition or expand authority.
- M2 adapters simulate Propose, planning conformance, Apply, and Verify without
  editing a real repository or claiming production evidence.

### Acceptance evidence

- A complete simulated run needs no conversational re-entry or routine prompt.
- Restart at every transition/attempt boundary converges without duplicate work.
- Receipt-loss tests observe before retry and pause when the result is unknowable.
- Stale owners, expired authority, exhausted budgets, malformed outcomes, and
  material decisions produce exact typed pauses.
- Table tests prove at most one reachable next transition for each valid state
  and no mutation from an invalid state.

## 6. Open questions and blocking decisions
- Finalize selector and adapter interface shapes after M1-S2.
- Decide which retry scheduling remains synchronous versus persisted for resume.

## 7. Recommended next step
Recommendation pending owner confirmation: After M2-S1 passes, Propose add-autonomous-sdd-transition-engine.
Recommended workflow action: OpenSpec Explore. No OpenSpec artifacts were created.
