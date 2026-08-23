# M8-S1 — Optional Temporal Execution Backend

Date: 2026-08-20
Status: Draft for owner review; optional and blocked until after M7.
Proposed change: `add-autonomous-sdd-temporal-execution-backend`

## 1. Problem and desired outcome
Problem: Later scale or operating needs may justify Temporal, but early adoption would add deployment and workflow concerns before the domain contract is proven.
Desired outcome: An optional Temporal adapter runs the qualified contracts without changing SDD policy or creating a second authority.

## 2. Evidence and key findings
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
- Make Temporal mandatory now.
- Never support another backend.
- Adopt Temporal conditionally after local qualification through the backend seam.

## 4. Decisions, assumptions, and owner
- Owner: Initiative owner; Temporal adoption, deployment, data, versioning, and
  operations choices require explicit owner approval.
- Confirmed decisions: Temporal is optional and deferred until after M7; it
  implements the qualified backend-neutral contract and never becomes a second
  SDD policy authority.
- Approval evidence: The owner explicitly chose future Temporal expandability
  while avoiding setup and learning cost in the first release.
- Assumptions: A fresh official-source assessment after M7 can evaluate current
  Temporal capabilities, costs, and operational fit.

## 5. Scope, non-goals, constraints, dependencies, and risks
- Scope: M8-S1 workflow and activity mapping, workers, task queues, retries, heartbeats, signals, queries, versioning, Continue-As-New, payload safety, projections, and shared claims.
- Non-goals: Automatic live migration, credentials or raw repository content in history, domain-policy changes, mandatory Temporal, or bypassing the parallelism gate.
- Constraints: Preserve domain gates and outcomes; minimize/redact history
  payloads; never store secrets or raw repository content; share claim authority
  with local runs; do not use Temporal to bypass the parallelism decision.
- Dependencies: All M7 qualification/cutover work, current sourced research,
  deployment/data/versioning/ownership decisions, and explicit owner adoption.
- Risks: Workflow replay/versioning errors, history growth, payload leakage,
  operational burden, or dual authority could outweigh the scaling benefit.

### Proposed Temporal mapping

- Parent runs map to parent Workflows; work units map to child Workflows;
  bounded external operations map to idempotent Activities with stable IDs.
- Temporal Event History is authoritative for Temporal runs. Local registry and
  status remain projections and never duplicate scheduling, retry, or ownership.
- Task queues bind to admitted worker capabilities; Activities use bounded
  retry/heartbeat policies and domain observe-before-retry reconciliation.
- Authorized Signals or Updates carry control actions; Queries expose safe
  status; Continue-As-New bounds long histories; versioning preserves replay.
- Payloads contain minimized/redacted references, never credentials, raw
  repository content, secret-bearing output, or mutable standing authority.
- Local and Temporal workers share the one repository claim authority. No live
  backend migration or parallelism shortcut is introduced.

### Acceptance evidence

- Backend parity runs the same lifecycle, role, handoff, exact-prompt, security,
  fault, and five-child outcome suites as qualified local execution.
- Workflow replay/versioning, duplicate Activity delivery, worker/service loss,
  Continue-As-New, projection rebuild, and payload-safety tests pass.
- Local and Temporal runs cannot both acquire an overlapping repository claim.
- Domain gates and outcome classifications are identical across backends.
- Adoption and rollback documentation covers deployment, data, upgrades,
  ownership, monitoring, and cost without making Temporal mandatory.

## 6. Open questions and blocking decisions
- Perform a fresh official-source Temporal assessment after M7.
- Decide Cloud versus production self-hosting, data residency, encryption,
  retention, versioning, operations ownership, and cost.
- Obtain explicit owner adoption; the development server is not production.

## 7. Recommended next step
Recommendation pending owner confirmation: After M7 and a fresh sourced assessment plus explicit owner adoption, Explore add-autonomous-sdd-temporal-execution-backend.
Recommended workflow action: OpenSpec Explore. No OpenSpec artifacts were created.
