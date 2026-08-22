# M4-S4 — Single-Change Reliability Qualification

Date: 2026-08-20
Status: Draft for owner review; blocked on M4-S3 and qualification approvals.
Proposed change: `qualify-autonomous-sdd-single-change-reliability`

## 1. Problem and desired outcome
Problem: A complete single-change path is not trustworthy until it succeeds repeatedly and survives disruptive recovery scenarios without contaminating real work.
Desired outcome: Ten consecutive approved real completions and an independently counted disposable fault matrix qualify serial single-change v1.

## 2. Evidence and key findings
- [Harness research](../../research/autonomous-agent-harness-landscape-2026/findings.md)
  supports deterministic control boundaries, least-authority workers,
  observable evidence, fault injection, and bounded recovery.
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
- Use unit tests only.
- Inject all faults into real backlog runs.
- Separate real completion and disposable fault gates with zero-tolerance criteria.

## 4. Decisions, assumptions, and owner
- Owner: Initiative owner; thresholds, environments, and each real backlog run
  require explicit owner approval.
- Confirmed decisions: Real-work qualification and disruptive fault injection
  are separate gates; ten consecutive real completions are proposed; disposable
  faults never count toward or run inside the real streak.
- Approval evidence: The owner explicitly selected “prove one approved change
  safely and repeatedly first” as the release boundary.
- Assumptions: M4-S3 provides the first complete real lifecycle and a sufficient
  varied backlog exists for individually authorized qualification runs.

## 5. Scope, non-goals, constraints, dependencies, and risks
- Scope: M4-S4 qualification corpus, counters, scenario-to-environment matrix, evidence, thresholds, fault injection, and release decision.
- Non-goals: Standing authorization, fault injection into real backlog work, milestone queues, parallelism, five-slice delivery, or Temporal.
- Constraints: Zero false passes, unaccounted mutations, unrelated changes,
  routine prompts, unresolved leaks, or untyped stops; retain every failed run.
- Dependencies: M4-S3, approved thresholds and scenario matrix, proven disposable
  environments, and individually approved eligible backlog changes.
- Risks: Mixing environments could damage real work; weak counters or discarded
  failures could turn a demanding gate into misleading evidence.

### Qualification design

- The real-change gate requires ten consecutive individually approved eligible
  backlog changes to complete through closeout with no deliberate corruption.
- An authorized pause/restart between completed transitions counts only after
  the same run completes; a terminal/incomplete run or discovered invariant
  defect breaks the streak.
- The disposable fault gate uses an approved scenario-to-environment matrix.
  Every row names environment, target/isolation proof, injection boundary,
  allowed mutations, expected outcome, evidence, cleanup, bound, and counters.
- Disruptive receipt, process, review, permission, policy, worktree, conflict,
  wrong-run, injection, secret, and unknown-outcome faults are disposable-only.
- Disposable rows and expected pauses never increment the real-run counter.

### Acceptance evidence

- Both gates pass independently with retained immutable run and counter records.
- Zero false passes, duplicate/unaccounted mutations, unrelated/dirty changes,
  routine prompts, unresolved terminal leaks, or untyped stops are allowed.
- A failed matrix row blocks qualification; a defect that could affect prior
  real runs makes those runs stale and restarts the streak.
- Backlog membership never grants standing authorization; every real run has
  its own accepted brief, exact grant, profile, evidence, and stop conditions.
- Passing qualifies opt-in serial single-change v1 and is the hard gate for M5.
- Passing moves the complete vertical bundle from `contract-only`/`audit/shadow`
  to `qualified-opt-in` only. Each real run still needs exact authorization and
  one immutable mutating owner; default routing remains forbidden until M6-S3.

## 6. Open questions and blocking decisions
- Owner must confirm or adjust the ten-run threshold before Propose.
- Approve the full scenario-to-environment and counter matrix.
- Identify a varied set of independently approved eligible backlog changes.

## 7. Recommended next step
Recommendation pending owner confirmation: After M4-S3 and explicit threshold and environment approval, Propose qualify-autonomous-sdd-single-change-reliability.
Recommended workflow action: OpenSpec Explore. No OpenSpec artifacts were created.
