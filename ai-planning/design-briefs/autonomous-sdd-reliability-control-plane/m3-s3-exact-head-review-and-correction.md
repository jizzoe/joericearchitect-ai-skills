# M3-S3 — Exact-Head Review and Correction

Date: 2026-08-20
Status: Draft for owner review; blocked on M3-S2 and review-reuse decision.
Proposed change: `bind-autonomous-review-to-code-head`

## 1. Problem and desired outcome
Problem: Review evidence can become stale after code changes or be redundantly repeated for unchanged closeout steps.
Desired outcome: Review and bounded correction bind to exact Apply evidence, package, artifacts, assurance contract, and code head.

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
- The [independent-review protocol](../../../skills/base/independent-review/references/protocol.md)
  defines immutable package, full-Git-ID, evidence, and reviewer bindings.

## 3. Options considered and tradeoffs
- Review every transition.
- Review once per run.
- Reuse exact-head assurance and invalidate only relevant changes.

## 4. Decisions, assumptions, and owner
- Owner: Initiative owner; exact-head reuse policy requires owner acceptance.
- Confirmed decisions: Strict review binds the immutable package and exact code
  head; production-code changes invalidate it; bounded objective correction
  requires fresh exact-head rereview. The fresh-review-on-change rule is first
  proven in M2-S1's thin review loop; M3-S3 upgrades it to strict exact-head
  binding.
- Approval evidence: The owner accepted the independent-review role and
  questioned whether it belongs in Verify; the master design now places it
  after Apply and before Verify readiness.
- Assumptions: Non-code closeout steps may reuse current review only when the
  accepted invalidation policy proves the reviewed code head unchanged.

## 5. Scope, non-goals, constraints, dependencies, and risks
- Scope: M3-S3 exact-head bindings, invalidation, review reuse, bounded correction, rereview, and human-decision pauses.
- Non-goals: Changing review transport, accepting self-review, or enabling real Apply before the M3 gate.
- Constraints: Self-review, local review, stale-head evidence, and narration
  cannot satisfy the gate; no real Apply adapter is enabled before M3 exits.
- Dependencies: M3-S2 and an explicit exact-head review-reuse decision.
- Risks: Over-invalidation adds needless latency; under-invalidation creates a
  false pass on code the independent reviewer never examined.

### Proposed assurance binding

- Review binds to current Apply evidence, immutable package digest, base/head
  commits, review-relevant artifact digests, assurance policy, and reviewer.
- Later merge, Sync, Archive, and cleanup may reuse that result only while code
  and review-relevant artifacts remain unchanged and their own external evidence
  stays current.
- Any relevant change invalidates the review and affected local/CI evidence.
- Objective findings return to the owning implementation role within the
  durable per-signature correction budget, then rerun affected evidence and a
  fresh exact-head reviewer. Human decisions pause.

### Acceptance evidence

- Changed-head and changed-review-input fixtures always invalidate assurance;
  unchanged non-code closeout does not launch a redundant reviewer.
- Correction records preserve signature, attempt, evidence, head, and outcome;
  exhausted or stagnating signatures block rather than reset.
- Wrong-head, wrong-package, self-review, and stale CI results cannot pass.
- The full live M3 review path passes before any real mutating Apply adapter is
  enabled.

## 6. Open questions and blocking decisions
- Confirm the exact set of review-relevant non-code artifacts.
- Confirm the unchanged-head review reuse boundary for closeout transitions.

## 7. Recommended next step
Recommendation pending owner confirmation: Resolve the review-reuse boundary after M3-S2, then Propose bind-autonomous-review-to-code-head.
Recommended workflow action: OpenSpec Explore. No OpenSpec artifacts were created.
