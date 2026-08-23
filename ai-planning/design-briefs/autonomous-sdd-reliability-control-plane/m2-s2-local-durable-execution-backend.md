# M2-S2 — Local Durable Execution Backend

Date: 2026-08-20
Status: Second M2 slice; follows `prove-autonomous-sdd-vertical-slice` and is
scoped by the transition set and record shapes that slice proved. Its delivery
still requires separate authorization.
Proposed change: `add-autonomous-sdd-local-execution-backend`

## 1. Problem and desired outcome
Problem: The current checkpoint is crash-resistant but does not prove authoritative history, exclusive ownership, stale-owner rejection, or safe takeover.
Desired outcome: A deliberately small one-host local backend provides durable history, atomic advancement, one coarse claim, and exact recovery.

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
- The [earlier durability brief](../autonomous-sdd-durable-execution-and-isolated-work-units.md)
  supplies the crash, receipt-loss, takeover, isolation, and portability requirements.

## 3. Options considered and tradeoffs
- Extend atomic JSON only.
- Build a general local workflow engine.
- Implement the smallest single-writer substrate under the explicit complexity tripwire.

## 4. Decisions, assumptions, and owner
- Owner: Initiative owner; the final local substrate choice and complexity
  tripwire disposition require owner acceptance.
- Confirmed decisions: Build only the smallest local, single-writer backend
  needed for serial single-change v1; Temporal remains a later adapter, not a
  reason to build a general workflow platform now.
- Approval evidence: The owner explicitly accepted a lightweight custom local
  start with an anti-reinvention guardrail; the concrete substrate is open.
- Assumptions: One host and one canonical repository claim cover the v1 threat
  model; crash recovery and operator takeover are required.

## 5. Scope, non-goals, constraints, dependencies, and risks
- Scope: M2-S2 local storage, history, projection, ownership, claim, takeover, discovery, and legacy inventory, scoped by the proven M2-S1 vertical slice.
- Non-goals: Daemons, queues, distributed workers, generalized timers, arbitrary workflows, Temporal, or real lifecycle adapters.
- Constraints: History lives outside disposable worktrees; advancement is
  atomic and generation-fenced; one coarse claim prevents overlapping mutation;
  the design pauses if the estimated core exceeds the agreed complexity budget.
- Dependencies: Delivered M1 slices, accepted bootstrap/cutover stabilization, and the M2-S1 vertical slice.
- Risks: The main risk is accidentally rebuilding Temporal features. A second
  authority, unsafe stale-owner takeover, or optimistic line estimate blocks
  Propose and triggers a build-vs-buy reassessment.

### Proposed backend boundary

- One local host, local filesystem, canonical repository, and active mutating
  run are supported. Resume/takeover is operator-invoked.
- Authoritative history lives outside removable worktrees; current state and
  repository-visible indexes are rebuildable projections.
- One exclusive transition-ownership mechanism also backs the coarse
  repository claim. Every commit verifies current run, revision, and owner
  generation so a stale process cannot advance state.
- Replay rebuilds state from records; deadlines are checked when the runner is
  invoked; the current runner directly selects and invokes fixed adapters.
- No daemon, automatic restart, general queue/timer service, multi-host worker,
  arbitrary workflow graph, HA, clustering, or search/retention service is added.
- M2-S2 publishes and proves backend behavior in `contract-only` or
  `audit/shadow` mode. It does not replace the existing real lifecycle owner,
  even if initialization and claims are executable. Operational activation
  waits for the complete vertical bundle and M4-S4 qualification.

### Acceptance evidence

- Kill/restart at each storage boundary preserves or reconstructs valid state.
- A second runner is denied; exact takeover increments ownership and causes the
  old owner to fail every later write.
- Provider switching while claims or runs exist fails closed.
- Status/history remain discoverable from linked worktrees after a worktree is
  moved or removed; ambiguous legacy state remains untouched.
- Crossing any complexity tripwire returns to owner build-versus-adopt review;
  the approximate 1,000-1,200 production-line range is not a test target.

## 6. Open questions and blocking decisions
- Select the smallest storage and locking substrate compatible with Node 20.19.
- Define same-host liveness, stale-owner proof, and explicit takeover procedure.
- Confirm filesystem classes that are supported or rejected at admission.

## 7. Recommended next step
After the M2-S1 vertical slice passes, create a fresh authorized M2-S2
delivery. Then continue to M2-S3 without activating real ownership.
