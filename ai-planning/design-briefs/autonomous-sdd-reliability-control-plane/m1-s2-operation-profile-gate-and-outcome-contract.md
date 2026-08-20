# M1-S2 — Operation, Profile, Gate, and Outcome Contract

Date: 2026-08-20
Status: Draft for owner review; no OpenSpec artifacts or implementation exist.
Proposed change: `unify-autonomous-sdd-operation-contract`

## 1. Problem and desired outcome
Problem: Operations, profiles, gates, target kinds, and result classifications do not share one executable vocabulary.
Desired outcome: One typed operation graph deterministically maps every emitted outcome to continuation, correction, pause, or terminal behavior.

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
- Keep per-skill policy.
- Centralize only error codes.
- Unify operations, profiles, gates, authorization, evidence, and outcomes.

## 4. Decisions, assumptions, and owner
- Owner: Initiative owner; profile and review-reuse policy require owner acceptance.
- Confirmed decisions: Operations, profiles, authorization, gates, evidence, and
  outcome disposition use one typed vocabulary; unknown production outcomes
  pause safely with retained evidence; `deliveryAuthorization` and
  `applyEligibility` are separate controls.
- Approval evidence: The owner accepted the shared-control-plane direction and
  requested this brief; the profile and reuse decisions below remain open.
- Assumptions: Existing lifecycle skills become fixed adapters rather than
  alternate policy owners.

## 5. Scope, non-goals, constraints, dependencies, and risks
- Scope: M1-S2 operation graph, profile semantics, gate predicates, correction paths, and outcome registry.
- Non-goals: Invoking adapters, redesigning review transport, or performing external mutations.
- Constraints: Every emitted outcome must have one machine-readable disposition;
  correction budgets and human-only decisions cannot be inferred by a model.
- Dependencies: M1-S1 contract boundaries; prototype-profile and exact-head
  review-reuse decisions are required before Propose.
- Risks: A registry that is too broad becomes brittle, while gaps or competing
  vocabularies recreate unsafe conversational routing.

### Proposed contract

- One registry defines operation name, target/record kinds, allowed profiles,
  prerequisites, freshness, authorization, runtime permission, required claim,
  adapter, write-ahead behavior, evidence, and terminal disposition.
- The compact lifecycle remains admitted, planned, evidence-ready, applied,
  reviewed, verified, closing, and complete; helper steps are not new states.
- `deliveryAuthorization` seals conditional lifecycle authority at admission;
  deterministic `applyEligibility` evaluates post-planning readiness.
- Every emitted production outcome maps once to retry, objective correction,
  human decision, terminal failure, or completion. Unknown outcomes pause and
  cannot retry or mutate.

### Acceptance evidence

- Contract tests reject wrong target kinds, stale evidence, missing claims,
  expired authority, invalid profile combinations, and out-of-order operations.
- Every external operation has exactly one observe-before-retry path.
- Correction paths are reachable and bounded per canonical failure signature.
- Prototype and production profiles yield one documented quality/review policy,
  with zero routine prompts inside a valid autonomous grant.

## 6. Open questions and blocking decisions
- Confirm the canonical `prototype-rapid` review policy.
- Confirm which unchanged-head closeout operations may reuse strict review.
- Finalize exact operation and outcome names during OpenSpec Explore.

## 7. Recommended next step
Recommendation pending owner confirmation: Resolve prototype-profile and review-reuse decisions, then Propose unify-autonomous-sdd-operation-contract.
Recommended workflow action: OpenSpec Explore. No OpenSpec artifacts were created.
