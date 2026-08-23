# M7-S3 — Default Control-Plane Cutover

Date: 2026-08-20
Status: Draft for owner review; conditional on M7-S2 and owner approval.
Proposed change: `enable-autonomous-sdd-control-plane-default`

## 1. Problem and desired outcome
Problem: Making run-v2 the default too early could strand legacy runs or remove rollback before qualification is trustworthy.
Desired outcome: Thin entrypoints switch to qualified local execution with audit-mode compatibility and a tested rollback.

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
- The [SDD workflow](../../../docs/sdd-workflow.md) is the compatibility baseline
  that default routing and assistant parity must preserve.

## 3. Options considered and tradeoffs
- Immediate replacement.
- Keep opt-in forever.
- Owner-approved staged cutover with retained legacy audit and rollback.

## 4. Decisions, assumptions, and owner
- Owner: Initiative owner; default routing and rollback/removal criteria require
  explicit owner approval.
- Confirmed decisions: Cutover is staged and reversible; legacy state remains
  auditable; ambiguous migration never becomes silent success.
- Approval evidence: The owner accepted proof-before-default sequencing, not
  immediate replacement.
- Assumptions: M7-S2 produces objective reliability, intervention, recovery,
  and leak metrics suitable for a go/no-go decision.

## 5. Scope, non-goals, constraints, dependencies, and risks
- Scope: M7-S3 routing switch, audit mode, compatibility diagnostics, rollback, removal criteria, assistant parity, and cache refresh.
- Non-goals: Deleting ambiguous legacy state, weakening gates, removing rollback early, or enabling parallelism.
- Constraints: Audit and opt-in stages precede default routing; rollback stays
  available until explicit removal criteria pass; all assistant entrypoints agree.
- Dependencies: Passing M7-S2 evidence and explicit owner cutover approval.
- Risks: Premature defaulting can strand legacy runs or amplify rare failures;
  indefinite dual routing can create competing authorities and drift.

### Proposed cutover

- Switch only thin entrypoints to run-v2; the qualified engine and contracts do
  not fork for default mode.
- Begin with audit/diagnostic routing, compare legacy discovery and run-v2
  classification, then enable default mutation only after explicit owner
  approval and M7-S2 evidence.
- Implement the same five-mode state machine used by the planning contract:
  `contract-only`, `audit/shadow`, `bootstrap-hybrid`, `qualified-opt-in`, and
  `default`. M7-S3 is the only slice allowed to select `default` for new runs.
  Every mode names exactly one mutating generation; audit/shadow never writes,
  and in-flight runs retain their immutable generation binding through a mode
  or rollback change.
- Retain legacy-state inventory, read-only recovery, compatibility diagnostics,
  and a tested routing rollback until published removal criteria are satisfied.
- Regenerate Claude/Codex adapters from canonical assets and verify discovery,
  parity, runtime installation, and cache refresh.

### Acceptance evidence

- Default and rollback routing tests preserve the same exact request and never
  weaken authorization, review, evidence, or cleanup gates.
- Ambiguous legacy runs stay audit-only and are never deleted or auto-migrated.
- A rollback during an admitted run preserves its immutable backend binding;
  only new runs change routing.
- Cutover refuses when any repository has ambiguous legacy state, an
  unreconciled active owner, an incomplete activation-bundle capability, stale
  qualification evidence, or an untested rollback path.
- Documentation, help/status output, generated wrappers, and runtime manifests
  agree on the active default and recovery path.
- Removal cannot begin until retained-state and rollback criteria are met.

## 6. Open questions and blocking decisions
- Owner approval is required after reviewing M7-S2 evidence.
- Define the observation period and legacy-removal criteria.

## 7. Recommended next step
Recommendation pending owner confirmation: After M7-S2 meets its threshold and the owner approves cutover, Propose enable-autonomous-sdd-control-plane-default.
Recommended workflow action: OpenSpec Explore. No OpenSpec artifacts were created.
