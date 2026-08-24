# M2-S3 — Run Status and Recovery

Date: 2026-08-20
Status: Delivered and archived. Issue #215; implementation PR #216, Sync PR
#217, Archive PR #218.
Proposed change: `add-autonomous-sdd-run-status-and-recovery`

## 1. Problem and desired outcome
Problem: Run status and recovery depend on current worktree location and can confuse projections with authoritative execution state.
Desired outcome: Repository-wide read-only status and safe resume always agree from every worktree and rebuild stale projections.

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
- Inspect nearby files.
- Expose raw backend records.
- Provide typed status and recovery decisions over authoritative history.

## 4. Decisions, assumptions, and owner
- Owner: Initiative owner; operator-facing recovery controls require owner acceptance.
- Confirmed decisions: Status is a typed projection of authoritative history;
  resume starts at the first incomplete safe transition; ambiguous recovery
  pauses rather than guessing.
- Approval evidence: The owner accepted explicit pause/resume, actionable stop
  reasons, and preservation of evidence in the master design.
- Assumptions: Operators identify a canonical run and repository before resume,
  takeover, cancellation, or repair.

## 5. Scope, non-goals, constraints, dependencies, and risks
- Scope: M2-S3 discovery, status projection, typed stop reasons, safe resume/no-op/pause, and projection rebuild.
- Non-goals: Mutation, cleanup, claim takeover without permission, or changing lifecycle policy.
- Constraints: Status is read-only; projection repair never rewrites history;
  takeover requires stale-owner proof and explicit authority.
- Dependencies: M2-S1 (transitions/attempt state) and M2-S2 (durable history/backend).
- Risks: A misleading projection or wrong-run operation could cause unsafe
  resumption, so identity, binding, and actionable recovery evidence are gates.

### Proposed status model

- Discovery begins from canonical repository identity and the selected backend,
  never the caller's current directory or nearest checkpoint file.
- Status reports run/work-unit/role/transition, authoritative history revision,
  projection freshness, current evidence, claim/owner, Git/worktree/OpenSpec
  linkage, deadline, and exact stop reason without exposing secrets.
- Classifications include running, retryable infrastructure, quality-blocked,
  waiting-human, configuration-discovery-gap, expired, complete, and ambiguous
  legacy state.
- Resume returns exactly one of safe-resume, no-op, or typed pause. Projection
  rebuild is read-only with respect to authoritative history.

### Acceptance evidence

- Every linked worktree and the primary checkout report identical run status.
- Deleted/moved worktrees and stale/missing projections rebuild from history.
- Wrong-run, wrong-repository, stale-revision, and unauthorized takeover inputs
  cannot resume or release a claim.
- Complete is reported only when terminal predicates and owned cleanup agree.
- Human-readable and machine-readable views preserve the same classification.

## 6. Open questions and blocking decisions
- Choose the stable CLI/API status shape and compatibility versioning policy.
- Define how much evidence detail is summarized versus linked by reference.

## 7. Recommended next step
Recommendation pending owner confirmation: After M2-S1 and M2-S2 pass, Propose add-autonomous-sdd-run-status-and-recovery.
Recommended workflow action: OpenSpec Explore. No OpenSpec artifacts were created.
