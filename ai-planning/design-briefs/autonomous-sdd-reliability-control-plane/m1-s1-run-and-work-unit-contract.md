# M1-S1 — Run and Isolated Work-Unit Contract

Date: 2026-08-20
Status: Draft for owner review; no OpenSpec artifacts or implementation exist.
Proposed change: `establish-autonomous-sdd-run-v2-contract`

## 1. Problem and desired outcome
Problem: Autonomous SDD has competing durable state shapes and unclear ownership boundaries.
Desired outcome: One backend-neutral run and isolated work-unit contract owns durable identity, history binding, claims, attempts, evidence, and cleanup.

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
- Keep existing records and translate at runtime.
- Adopt a vendor workflow schema as the domain model.
- Define a small SDD-owned portable contract.

## 4. Decisions, assumptions, and owner
- Owner: Initiative owner; contract boundaries require owner acceptance before Propose.
- Confirmed decisions: The SDD domain contract stays backend-neutral; one
  authoritative history owns a run; single-change v1 admits one active mutating
  run per canonical repository; registries are projections, not authorities.
- Approval evidence: The owner accepted the big-picture direction and requested
  this slice brief; slice-specific open decisions below remain unapproved.
- Assumptions: V1 runs on one local host and supports operator-directed resume
  or takeover after process death, not multi-host failover.

## 5. Scope, non-goals, constraints, dependencies, and risks
- Scope: M1-S1 run, work-unit, transition-attempt, resource-claim, projection, and migration contracts.
- Non-goals: Executing transitions, selecting a Temporal deployment, or migrating ambiguous legacy state automatically.
- Constraints: Preserve audit evidence, reject ambiguous migration, avoid
  backend-specific fields in the domain model, and keep claim authority singular.
- Dependencies: None; this is the first roadmap slice, but its named ownership,
  threat-model, substrate, and claim-provider decisions block Propose.
- Risks: Redundant authority, over-generalized schema, or premature storage
  mechanics could make local recovery unsafe and Temporal portability costly.

### Proposed contract

- `parentRun` owns approved intent, global deadline, immutable backend/history
  and claim-provider bindings, and child terminal summaries. Single-change v1
  has exactly one child.
- `workUnit` owns one change, its authorization/configuration digests, role
  handoffs, lifecycle state, evidence namespace, derived resources, and cleanup.
- `transitionAttempt` owns a stable ID and idempotency key, precondition and
  target digests, ownership generation, write-ahead state, receipt, and result.
- `resourceClaim` owns canonical repository conflict scope, owner identity,
  stale-owner proof, acquisition, release, and recovery evidence.
- One authoritative backend history controls a run. Registries and status are
  rebuildable projections; claim authority remains separate and singular.

### Acceptance evidence

- Schema fixtures reject redundant parent/child state, cross-work-unit evidence,
  mutable backend bindings, duplicate identities, and unknown record kinds.
- Compatible v1 records migrate deterministically; ambiguous records remain
  immutable audit-only evidence with an actionable classification.
- Local and mock-Temporal serializers prove the domain schema does not depend
  on either runtime.
- The accepted threat model and local-backend complexity tripwire are recorded
  before M2-S1 can become Propose-ready.

## 6. Open questions and blocking decisions
- Where does the authoritative run registry live?
- Which summaries may the parent project from child-owned history?
- What exact one-host process-death and takeover threat model applies?
- Where does the repository-wide claim provider live and how is it discovered?

## 7. Recommended next step
Recommendation pending owner confirmation: Use OpenSpec Explore to resolve the named ownership and substrate decisions, then Propose establish-autonomous-sdd-run-v2-contract.
Recommended workflow action: OpenSpec Explore. No OpenSpec artifacts were created.
