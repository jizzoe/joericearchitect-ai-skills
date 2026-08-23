# M7-S1 — Composition and Fault Qualification

Date: 2026-08-20
Status: Draft for owner review; blocked on M6.
Proposed change: `qualify-autonomous-sdd-composition-reliability`

## 1. Problem and desired outcome
Problem: Single-change evidence does not prove parent-child composition, dependency failure, queue recovery, or child isolation.
Desired outcome: Disposable milestone faults prove dependency ordering, isolation, projection rebuild, pause propagation, and exact evidence ownership.

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

## 3. Options considered and tradeoffs
- Repeat single-change tests.
- Rely on the soak alone.
- Add a composition-specific fault suite before real five-slice runs.

## 4. Decisions, assumptions, and owner
- Owner: Initiative owner; the composition matrix requires owner acceptance.
- Confirmed decisions: Composition testing extends rather than repeats M4-S4;
  it targets parent/child ordering, isolation, rebuild, pause propagation,
  claims, and durable role handoffs in disposable environments.
- Approval evidence: The owner accepted qualification before five-slice real
  execution and default cutover.
- Assumptions: M5 supplies the final parent/child queue contracts to test.

## 5. Scope, non-goals, constraints, dependencies, and risks
- Scope: M7-S1 milestone and child fault matrix, dependency order, corruption, rebuild, pause and failure propagation, claims, prompts, and role handoffs.
- Non-goals: Replacing real qualification with fake adapters, overlapping parallel runs, or re-counting M4 single-change gates.
- Constraints: Fake or disposable evidence cannot substitute for the later real
  five-slice soak; no overlapping parallel runs are introduced.
- Dependencies: All M5 slices and their final contracts.
- Risks: Reusing only single-change tests can miss dependency corruption,
  cross-child leakage, and incorrect parent convergence.

### Composition matrix

- Extend M4-S4 rather than rerunning it: dependency ordering, parent/child
  history corruption, projection rebuild, queue interruption, child pause,
  expiry/failure propagation, claim isolation, wrong-child evidence, prompt
  counts, and every durable role handoff become matrix rows.
- Every row runs in a disposable repository/fixture and specifies injection
  boundary, expected completion/recovery/pause, evidence, cleanup, and bound.
- Real engine, storage, dispatcher, and lifecycle adapters are used where the
  behavior is under qualification; fake adapters may isolate a lower-level
  fault but cannot establish end-to-end readiness.
- Fine-grained claims and overlapping parallel execution remain excluded.

### Acceptance evidence

- All matrix rows reach their exact expected outcome with no unexplained retry,
  prompt, leaked child state, resource leak, or projection/history disagreement.
- Completed children remain immutable through later child failure and restart.
- Dependency-invalid children never start or acquire mutation claims.
- Parent status reconstructs after projection loss and reports the exact child,
  role, transition, and stop reason.
- Failures remain visible and cannot be rerun away or counted as M4 evidence.

## 6. Open questions and blocking decisions
- Finalize the composition matrix after M6 contracts are implemented.
- Set non-safety harness-health thresholds for timing and retries.

## 7. Recommended next step
Recommendation pending owner confirmation: After M6, Propose qualify-autonomous-sdd-composition-reliability.
Recommended workflow action: OpenSpec Explore. No OpenSpec artifacts were created.
