# M4-S3 — Finalization and Cleanup

Date: 2026-08-20
Status: Draft for owner review; blocked on M4-S2 and M2-S1.
Proposed change: `integrate-autonomous-sdd-finalization-and-cleanup`

## 1. Problem and desired outcome
Problem: Closeout and cleanup can falsely complete or damage dirty, unrelated, primary, or ambiguously owned resources.
Desired outcome: Issue, Project, branch, default-branch, run, and exact-owned cleanup state converge through resumable terminal transitions.

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
- [skills/base/sdd-workspace-cleanup/SKILL.md](../../../skills/base/sdd-workspace-cleanup/SKILL.md): --- name: sdd-workspace-cleanup description: Audit, apply, or resume exact post-Archive cleanup of change-owned local SDD resources. Use only with current selected-entry ownership and delivery evidence. --- \# SDD Workspace Cleanup Use \`ai-skills-runtime run sdd-workspace-cleanup…

## 3. Options considered and tradeoffs
- Run broad repository cleanup.
- Leave all resources indefinitely.
- Register ownership at creation and clean only current eligible resources.

## 4. Decisions, assumptions, and owner
- Owner: Initiative owner; ambiguous or dirty resources require an operator decision.
- Confirmed decisions: Resource ownership is registered when created; cleanup
  is exact-owned, recoverable where practical, and part of terminal convergence.
- Approval evidence: The owner accepted a distinct closeout agent and explicit
  preservation of unrelated dirty work.
- Assumptions: Every control-plane-created branch, worktree, temporary artifact,
  and claim can carry durable ownership and eligibility metadata.

## 5. Scope, non-goals, constraints, dependencies, and risks
- Scope: M4-S3 final convergence, resource registration, eligibility, cleanup receipts, partial recovery, and terminal predicates.
- Non-goals: Force removal, reset or clean, inferred legacy ownership, or deleting ambiguous and unrelated resources.
- Constraints: Never use broad reset/clean/delete operations or infer ownership
  from naming alone; partial cleanup remains resumable.
- Dependencies: M4-S2 and M2-S1 durable ownership/claim behavior.
- Risks: Wrong-target cleanup can destroy user work; overly conservative leaks
  can prevent terminal convergence and future runs.

### Proposed finalization model

- Worktree and branch ownership is registered when created with run, work-unit,
  role, head, ownership token, and recovery reference.
- Cleanup eligibility requires exact ownership, delivered current head, clean
  and non-primary/non-locked/non-divergent state, and current terminal evidence.
- Ineligible or ambiguous resources remain intact with a typed recovery result.
- Issue, Project, default branch, archive, run terminal state, claim release,
  and owned cleanup must all converge before complete.
- Finalization is part of the minimum activation bundle, not a later optional
  convenience. A generation cannot own real admission/claims unless the same
  qualified generation can terminalize, release, externally converge, clean
  exact-owned resources, and recover after interruption.
- Claim release is evidence-bound to terminal lifecycle and cleanup outcomes;
  neither a merged PR nor an archived OpenSpec directory alone proves a run is
  safe to release or remove from the active area.

### Acceptance evidence

- Dirty, unrelated, primary, locked, divergent, legacy, remote, and ownership-
  mismatched resources are never removed.
- Process death before/after each cleanup action resumes as completed,
  already-completed, or exact blocked state.
- Partial cleanup cannot release claims or report complete prematurely.
- Final status agrees from every worktree after owned worktree removal because
  authoritative history remains outside it.
- No broad reset, clean, force-removal, or inferred ownership path exists.

## 6. Open questions and blocking decisions
- Finalize terminal convergence predicates and claim-release order.
- Decide retention and operator guidance for permanently ineligible resources.

## 7. Recommended next step
Recommendation pending owner confirmation: After M4-S2 and the local backend, Propose integrate-autonomous-sdd-finalization-and-cleanup.
Recommended workflow action: OpenSpec Explore. No OpenSpec artifacts were created.
