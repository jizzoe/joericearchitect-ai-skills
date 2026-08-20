# M6-S2 — Five-Slice Unattended Qualification

Date: 2026-08-20
Status: Draft for owner review; blocked on M6-S1 and threshold approval.
Proposed change: `qualify-autonomous-sdd-five-slice-soak`

## 1. Problem and desired outcome
Problem: A passing disposable composition suite does not prove repeated real multi-hour five-slice delivery.
Desired outcome: Repeated fresh and resumed five-slice soaks complete through the real engine, reviewer, lifecycle, and cleanup with zero-tolerance safety.

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
- One demonstration run.
- Fake-adapter soaks.
- At least three consecutive real five-slice runs with retained failures and metrics.

## 4. Decisions, assumptions, and owner
- Owner: Initiative owner; the proposed three-run threshold and real slices
  require explicit owner confirmation.
- Confirmed decisions: Qualification uses real serial five-slice deliveries,
  retains failures and timing/intervention metrics, and cannot rerun away flakes.
- Approval evidence: The owner accepted five-slice execution only after the
  single-change and composition gates.
- Assumptions: A disposable end-to-end environment can host multiple long runs
  without contaminating production repositories or credentials.

## 5. Scope, non-goals, constraints, dependencies, and risks
- Scope: M6-S2 end-to-end environment, run selection, three-run threshold, timing and intervention metrics, retries, leaks, isolation, and convergence.
- Non-goals: Rerunning away flakes, lowering gates, default cutover, parallelism, or Temporal.
- Constraints: At least three consecutive runs are proposed; required gates
  remain unchanged; parallelism and Temporal stay out of scope.
- Dependencies: M6-S1, approved threshold, selected five-slice workloads, and
  a disposable end-to-end environment.
- Risks: Qualification can be expensive and slow, but relaxing evidence or
  hiding retries would invalidate the default-cutover decision.

### Soak design

- Run fresh and resumed five-slice milestones through the real local backend,
  multi-agent handoffs, strict reviewer, GitHub delivery, Sync, Archive, and
  exact-owned cleanup in an approved end-to-end environment.
- Proposed release evidence is at least three consecutive successful multi-hour
  runs; every slice retains its own authorization and delivery evidence.
- Record elapsed and transition times, routine prompts, owner interventions,
  retries, corrections, review launches, claims, leaks, role isolation,
  history/projection agreement, and final external convergence.
- Preserve every failed run. A rerun is a new run and cannot erase a flake or
  retroactively satisfy the consecutive threshold.

### Acceptance evidence

- All proposed threshold runs finish with zero routine prompts and zero false
  pass, duplicate/unaccounted mutation, unrelated change, leak, or untyped stop.
- At least one run resumes after an authorized interruption without duplicating
  child work or review.
- Role/work-unit evidence and claims remain isolated across all five slices.
- GitHub, OpenSpec, default branch, issue/Project, cleanup, and terminal status
  converge and agree with authoritative history.
- Failure evidence and harness-health metrics remain queryable after success.

## 6. Open questions and blocking decisions
- Owner must confirm or adjust the proposed three-run threshold.
- Approve the disposable end-to-end environment and eligible five-slice corpus.
- Set timing, retry, availability, and context-drift release thresholds.

## 7. Recommended next step
Recommendation pending owner confirmation: After M6-S1 and threshold confirmation, Propose qualify-autonomous-sdd-five-slice-soak.
Recommended workflow action: OpenSpec Explore. No OpenSpec artifacts were created.
