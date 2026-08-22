# M4-S2 — Sync and Archive Delivery

Date: 2026-08-20
Status: Draft for owner review; blocked on M4-S1.
Proposed change: `integrate-autonomous-sdd-sync-and-archive`

## 1. Problem and desired outcome
Problem: Sync and Archive can diverge from delivered implementation or duplicate shared-state mutations.
Desired outcome: Exact Sync and content-preserving Archive run as separately delivered, recoverable lifecycle transitions.

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
- The [SDD workflow](../../../docs/sdd-workflow.md) defines Sync and Archive as
  evidenced lifecycle checkpoints rather than an implicit closeout step.

## 3. Options considered and tradeoffs
- Archive immediately after Verify.
- Treat Sync as an in-memory update.
- Deliver Sync and Archive as evidenced operations with shared-destination claims.

## 4. Decisions, assumptions, and owner
- Owner: Initiative owner; ambiguous specification conflicts remain human decisions.
- Confirmed decisions: Sync and Archive are separate evidenced deliveries;
  repeat Sync must prove a no-op; Archive preserves accepted artifacts and runs
  only after delivery and default-branch evidence are current.
- Approval evidence: The owner accepted a dedicated closeout role after Verify
  rather than treating closeout as narration.
- Assumptions: Accepted delta operations can be applied deterministically to
  living specs when no semantic conflict exists.

## 5. Scope, non-goals, constraints, dependencies, and risks
- Scope: M4-S2 delta-to-living-spec Sync, repeat no-op proof, Archive preservation, delivery, default-branch confirmation, and reconciliation.
- Non-goals: Inventing requirements, resolving ambiguous spec conflicts, archiving before delivery, or re-reviewing unchanged code.
- Constraints: Shared living-spec destinations require a claim; Archive cannot
  silently rewrite artifacts or reuse stale merge evidence.
- Dependencies: M4-S1 and current Verify/delivery evidence for the same change.
- Risks: Early Archive, lost delta content, or concurrent Sync could corrupt the
  durable specification record while appearing complete.

### Proposed lifecycle transitions

- Sync deterministically applies only the authorized delta to its living-spec
  capability and proves a repeat invocation is a no-op.
- Sync delivery is a distinct exact-head PR/merge checkpoint before Archive.
- Archive preserves proposal, specs, design, tasks, evidence, and provenance;
  it runs only after implementation and Sync delivery are confirmed on the
  default branch.
- Shared spec and archive destinations require the active repository claim and
  operation-specific reconciliation after partial external success.
- Before creating a Sync branch, changing a living spec, or opening a Sync PR,
  enumerate every active OpenSpec change and build a graph of capability,
  requirement, and operation overlap. Because `MODIFIED` is a complete
  requirement replacement, any active replacement that overlaps the proposed
  living result must be serialized or reconciled under authority covering all
  affected changes. An unresolved overlap pauses before mutation.
- Sync and pre-Archive comparison includes each accepted requirement's
  description and scenarios, not only Markdown structure or scenario titles.
  The living result must exactly reflect the authorized delta in context, and
  a repeated Sync must produce no change.

### Acceptance evidence

- Exact delta-to-living comparison proves no invented, dropped, duplicated, or
  text-corrupted requirement descriptions or scenarios, and a second Sync
  produces no change.
- Active-delta fixtures include two complete replacements of one requirement,
  a newer living scenario absent from an older delta, disjoint capabilities,
  shared-authority reconciliation, and pre-mutation fail-closed behavior.
- Ambiguous spec conflicts pause for a material decision.
- Archive is content-preserving and idempotent; partial move/delivery failures
  resume without duplicate paths or lost history.
- A conflicting second run cannot mutate the same spec/archive destination.
- Unchanged code reuses current M3 review while Sync/Archive delivery evidence
  remains separately current.

## 6. Open questions and blocking decisions
- Define the canonical conflict scope for shared capability and archive paths.
- Confirm required delivery checkpoints between Sync and Archive.

## 7. Recommended next step
Recommendation pending owner confirmation: After M4-S1, Propose integrate-autonomous-sdd-sync-and-archive.
Recommended workflow action: OpenSpec Explore. No OpenSpec artifacts were created.
