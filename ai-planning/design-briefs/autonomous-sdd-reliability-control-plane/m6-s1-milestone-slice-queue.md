# M6-S1 — Milestone/Slice Queue

Date: 2026-08-20
Status: Draft for owner review; blocked until M4-S4 qualifies single-change v1.
Proposed change: `add-autonomous-sdd-milestone-slice-adapter`

## 1. Problem and desired outcome
Problem: A milestone cannot yet become dependency-valid isolated child deliveries without duplicating lifecycle policy.
Desired outcome: One parent coordinates immutable child work units while every child uses the already-qualified single-change engine.

## 2. Evidence and key findings
- [Harness research](../../research/autonomous-agent-harness-landscape-2026/findings.md)
  supports deterministic control boundaries, least-authority workers,
  observable evidence, fault injection, and bounded recovery.
- The [main design](../autonomous-sdd-reliability-control-plane.md) supplies
  the shared architecture, invariants, role boundaries, and accepted sequencing
  that this slice must preserve.
- The [roadmap](../../plans/autonomous-sdd-reliability-control-plane-roadmap.md)
  is the authority for this slice's dependencies, readiness, execution order,
  and containing milestone exit evidence.
- The [earlier milestone-delivery brief](../sdd-milestone-slice-delivery-skill.md)
  supplies cadence, dependency selection, and cross-repository inputs to reconcile.

## 3. Options considered and tradeoffs
- Build a second milestone runner.
- Use conversational ordering.
- Add a thin milestone-to-child queue adapter.

## 4. Decisions, assumptions, and owner
- Owner: Initiative owner; milestone cadence and child selection require owner acceptance.
- Confirmed decisions: Queues are deferred until serial single-change v1 passes
  M4-S4; each child remains an isolated work unit with immutable inputs and the
  existing lifecycle contract.
- Approval evidence: The owner explicitly deferred milestone queues until after
  repeated single-change qualification.
- Assumptions: V1 milestone execution remains serial; parallel child work needs
  a future measured decision and is not implicit here.

## 5. Scope, non-goals, constraints, dependencies, and risks
- Scope: M6-S1 parent queue, immutable child inputs, dependency selection, isolation, projections, pause propagation, and rebuild.
- Non-goals: Choosing product priority, parallel children, fine-grained claims, or changing the child lifecycle.
- Constraints: The parent chooses only dependency-valid children, cannot widen
  their grants, and propagates pauses without hiding child evidence.
- Dependencies: M4-S4 qualification and owner acceptance of milestone cadence.
- Risks: A second orchestration authority, mutable child inputs, or hidden
  priority policy would undermine the proven single-change lifecycle.

### Proposed parent/child model

- Admission converts one accepted milestone plan into immutable child entries
  with exact brief, target, dependencies, profile, authorization/configuration,
  deadline, budget, backend, and evidence contract.
- The parent owns dependency order and rebuildable summaries only. Each child
  owns its lifecycle, attempts, roles, artifacts/evidence, claims, result, and
  cleanup through the qualified single-change engine.
- Selection is deterministic: only dependency-satisfied pending children are
  eligible; product priority is already supplied by the accepted plan.
- v1 milestone execution remains serial. A paused/failed/expired child propagates
  a typed parent state and cannot leak evidence or authority to another child.

### Acceptance evidence

- Five-child fixtures run in exact dependency order and preserve isolation.
- Restart, parent/child projection corruption, child pause/expiry/failure, and
  dependency failure rebuild or stop without losing completed child evidence.
- Wrong-child evidence, receipts, claims, or cleanup cannot satisfy another.
- Parent summaries reconstruct entirely from authoritative child histories.
- No duplicate lifecycle policy or hidden parallel path exists in the adapter.

## 6. Open questions and blocking decisions
- Confirm milestone cadence and accepted plan schema after M4-S4 evidence.
- Define parent terminal behavior for permanently blocked optional children.

## 7. Recommended next step
Recommendation pending owner confirmation: Only after M4-S4 qualification and cadence acceptance, Explore add-autonomous-sdd-milestone-slice-adapter.
Recommended workflow action: OpenSpec Explore. No OpenSpec artifacts were created.
