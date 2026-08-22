# M1-S2 — Operation, Profile, Gate, and Outcome Contract

Date: 2026-08-20
Status: Delivered and archived. Issue #158; implementation, Sync, and Archive
PRs #159, #160, and #161. Exact bootstrap terminalization repair: issue #162
and PRs #163/#164.
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
- Keep per-skill policy. Rejected because it preserves competing authorities.
- Centralize only error codes. Rejected because target, evidence, authorization,
  correction, and transition rules could still disagree.
- Unify operations, profiles, gates, authorization, evidence, and outcomes.
  Selected and delivered as the one executable policy surface.

## 4. Decisions, assumptions, and owner
- Owner: Initiative owner; Q1-Q6 decisions were accepted before delivery.
- Confirmed decisions: Operations, profiles, authorization, gates, evidence, and
  outcome disposition use one typed vocabulary; unknown production outcomes
  pause safely with retained evidence; `deliveryAuthorization` and
  `applyEligibility` are separate controls.
- Approval evidence: The owner accepted Q1-Q6 on 2026-08-20. The detailed
  decision record was preserved on planning commit `2929d82` and is reconciled
  below; implementation and Archive evidence is linked in the status line.
- Assumptions: Existing lifecycle skills become fixed adapters rather than
  alternate policy owners.

## 5. Scope, non-goals, constraints, dependencies, and risks
- Scope: M1-S2 operation graph, profile semantics, gate predicates, correction paths, and outcome registry.
- Non-goals: Invoking adapters, redesigning review transport, or performing external mutations.
- Constraints: Every emitted outcome must have one machine-readable disposition;
  correction budgets and human-only decisions cannot be inferred by a model.
- Dependencies: M1-S1 contract boundaries. Satisfied for the delivered change.
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

## 6. Accepted Q1-Q6 decision record

The following still-current decisions are deliberately recovered from planning
commit `2929d82`; stale proposal-readiness language from that branch is not.

1. **Prototype review:** autonomous `prototype-rapid` uses
   `same-session-local`. It is lower assurance and never satisfies a production
   independent-review gate.
2. **Canonical request field:** `reviewPolicy` is authoritative. The legacy
   `independentReviewPolicy` name has only bounded strict-policy compatibility;
   contradictory inputs and local review under the legacy name are rejected.
3. **Exact-head review reuse:** reuse requires the sealed package digest, exact
   head/tree, artifact manifest, Apply evidence, dispositions, and assurance
   gates to remain current. Any review-relevant change invalidates reuse.
4. **Pre-Apply readiness:** mandatory production review capability is proven
   before Apply; unavailable strict review never silently degrades to local
   review.
5. **Lifecycle vocabulary:** public state remains compact—admitted, planned,
   evidence-ready, applied, reviewed, verified, closing, complete—while helper
   work is represented by typed internal operations and immutable attempts.
6. **Agent topology:** canonical `agentPolicy` values are `auto`,
   `multi-agent`, and `single-agent`. Autonomous `prototype-rapid` defaults to
   `auto`; `production-rapid` defaults to `multi-agent`; an explicit user value
   overrides classification and becomes immutable at admission. Topology never
   weakens mutation, review, authorization, or evidence gates.

The owner also confirmed that one bounded full-lifecycle request may traverse
multiple internal phases without routine prompts, while Propose and Apply
remain distinct typed gates. A standalone Propose request stays planning-only.

### Activation clarification

The delivered operation contract is a contract publication, not authority for
partial v2 ownership. Runtime N-1 releases N, and a generation may own real
work only after initialize, fence/claim, advance, recover, terminalize, release,
external convergence, exact cleanup, and rollback are complete and qualified.
No release task may require the same newly installed generation to prove its
own completion.

## 7. Recommended next step

M1-S2 is complete. Preserve these decisions as inputs to M2 and keep their
runtime generation contract-only/audit until the vertical activation bundle is
qualified.
