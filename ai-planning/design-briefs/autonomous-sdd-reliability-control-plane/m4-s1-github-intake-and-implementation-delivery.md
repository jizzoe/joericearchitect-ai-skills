# M4-S1 — GitHub Intake and Implementation Delivery

Date: 2026-08-20
Status: Draft for owner review; blocked on M3 and disposable GitHub fixtures.
Proposed change: `integrate-autonomous-sdd-github-delivery`

## 1. Problem and desired outcome
Problem: GitHub intake and implementation delivery are not one idempotent, recoverable transition chain.
Desired outcome: Exact issue, Project, branch, PR, check, merge, closure, and status operations converge without duplicate or unrelated mutation.

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
- The [SDD workflow](../../../docs/sdd-workflow.md) defines the current lifecycle
  checkpoints and recovery behavior that the GitHub adapters must preserve.

## 3. Options considered and tradeoffs
- Keep manual GitHub steps.
- Use best-effort API calls.
- Wrap exact operations in write-ahead attempts and observe-before-retry reconciliation.

## 4. Decisions, assumptions, and owner
- Owner: Initiative owner; real GitHub mutation requires per-run delivery authorization.
- Confirmed decisions: External mutations use typed fixed adapters, write-ahead
  attempts, stable idempotency keys, observe-before-retry reconciliation, and
  explicit field ownership.
- Approval evidence: The owner accepted the real single-change lifecycle as the
  first useful release, but no specific GitHub run is authorized by this brief.
- Assumptions: A disposable GitHub fixture can prove failure and receipt-loss
  behavior before approved backlog work is admitted.

## 5. Scope, non-goals, constraints, dependencies, and risks
- Scope: M4-S1 GitHub intake and implementation-delivery adapters, preflight, records, receipts, ownership, and recovery.
- Non-goals: Credential changes, protection changes, releases, deployments, Sync, Archive, or broad content ownership.
- Constraints: Revalidate live credentials, permissions, repository policy,
  target head, and claim ownership before every mutation; preserve human fields.
- Dependencies: All M3 slices and an approved disposable GitHub fixture strategy.
- Risks: Partial external success, changed branch protection, or broad content
  replacement could duplicate work or overwrite human-owned state.

### Proposed adapter set

- Exact adapters cover issue create/reuse, Project binding/status, topic branch,
  PR create/update, exact-head checks, merge, issue closure, and delivery status.
- Each request declares stable identity, target/precondition digest, capability,
  authorization, ownership scope, idempotency key, and observe-before-retry.
- Managed fields are updated without overwriting human-owned content; derived
  issue, branch, PR, and Project records bind to the selected work unit.
- Live credential, repository permission, branch policy, and target existence
  are revalidated immediately before every external mutation.

### Acceptance evidence

- Disposable GitHub fixtures cover new and reused issues, PR update/retry,
  check failure, policy drift, merge conflict, closure, and status convergence.
- Remote-success/local-receipt-loss at every mutation converges without a
  duplicate or pauses `in-doubt` when observation cannot prove the result.
- Wrong repository, issue, Project, branch, PR, head, or ownership is rejected.
- Unrelated human issue/PR text and repository settings remain unchanged.
- No credentials, raw CLI output, or secret-bearing diagnostics enter history.

## 6. Open questions and blocking decisions
- Select and prove a disposable GitHub repository/account strategy.
- Finalize field-level ownership for issue, PR, and Project updates.

## 7. Recommended next step
Recommendation pending owner confirmation: After M3 and a disposable GitHub fixture strategy, Propose integrate-autonomous-sdd-github-delivery.
Recommended workflow action: OpenSpec Explore. No OpenSpec artifacts were created.
