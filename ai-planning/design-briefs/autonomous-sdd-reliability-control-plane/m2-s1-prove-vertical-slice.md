# M2-S1 — Prove the Vertical Slice

Date: 2026-08-23
Status: Next dependency-valid slice after the bootstrap/cutover stabilization
Archive; its delivery still requires separate authorization.
Proposed change: `prove-autonomous-sdd-vertical-slice`

## 1. Problem and desired outcome
Problem: No end-to-end vertical slice has proven that one change can flow
through proposal, Apply, Verify, and fresh review under the accepted contracts
before the durable backend is built.
Desired outcome: One disposable fixture change completes proposal → apply →
verify → fresh-review-on-change with typed stops under both `production` and
`prototype` authority profiles, using simulated adapters and a minimal
ephemeral store.

## 2. Evidence and key findings
- The [milestone-blocker root-cause analysis](../../../notes/autonomous-sdd/milestone-blocker-root-cause-analysis/milestone-blocker-root-cause-analysis-findings.md)
  found M1 activated admission/claims before a complete start-to-cleanup
  lifecycle existed. Proving a vertical slice first inverts that failure.
- The [SDD harness refactor recommendation](../../../research/deepseek-cline-continue/recommended-sdd-harness-refactor-plan.md)
  argues a general workflow engine must not be built before one vertical slice
  proves the product.
- The [main design](../autonomous-sdd-reliability-control-plane.md) supplies
  the shared architecture, invariants, role boundaries, and accepted sequencing.

## 3. Options considered and tradeoffs
- Build the durable backend first (rejected: repeats M1's horizontal activation).
- Prove the vertical slice with simulated adapters first (selected).

## 4. Decisions, assumptions, and owner
- Owner: Initiative owner.
- Confirmed decisions: the pure next-transition selector, fixed simulated
  adapters, thin sealed review loop, and minimal ephemeral store from the
  superseded transition-engine brief are absorbed here.
- Assumptions: the fixture mirrors a planned non-SDD skill; no real repository
  edit or GitHub mutation occurs.

## 5. Scope, non-goals, constraints, dependencies, and risks
- Scope: M2-S1 pure selector, simulated Propose/planning/Apply/Verify adapters,
  thin sealed review loop, role/context manifests, minimal ephemeral store, and
  both authority profiles on a disposable fixture.
- Non-goals: durable backend, real repository edits, GitHub mutation, strict
  review upgrade, Sync, Archive, or cleanup.
- Constraints: simulated adapters are non-mutating; the ephemeral store never
  writes real controller state; no model may invent transitions or authority.
- Dependencies: delivered M1 slices and accepted bootstrap/cutover stabilization.
- Risks: recreating the durable backend; activating real ownership before M4-S4.

### Fixture template
`add-typescript-javascript-review` (a planned non-SDD skill) supplies the
proposal/design/tasks shape and verification commands the simulated adapters
mirror.

### Delivery lane
Delivered by the pre-v2/interactive lifecycle (runtime N-1 delivers N), never
by the controller this slice builds.

### Acceptance evidence
- One fixture change completes proposal → apply → verify → fresh-review-on-change
  with no conversational re-entry or routine prompt.
- Both `production` and `prototype` profiles produce the same lifecycle facts
  with different approval requirements.
- A requirement-to-test map, an injected clock (no calendar-sensitive
  authorization tests), and property/symmetry tests cover the selector and
  review-invalidation rules.
- Restart, stale-owner, exhausted-budget, and malformed-outcome scenarios
  produce exact typed pauses.

## 6. Open questions and blocking decisions
- Finalize the selector and adapter interface shapes after M1-S2.
- Confirm the minimal ephemeral-store schema is not confused with the durable backend.

## 7. Recommended next step
After `stabilize-autonomous-sdd-bootstrap-and-cutover-plan` completes Archive,
create a fresh authorized M2-S1 delivery. Recommended workflow action: OpenSpec
Explore. No OpenSpec artifacts were created.
