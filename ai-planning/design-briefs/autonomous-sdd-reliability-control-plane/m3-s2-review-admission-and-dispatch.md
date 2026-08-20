# M3-S2 — Review Admission and Dispatch

Date: 2026-08-20
Status: Draft for owner review; blocked on M3-S1 and M1-S3.
Proposed change: `add-autonomous-sdd-review-admission-and-dispatcher`

## 1. Problem and desired outcome
Problem: Strict-review readiness, launch, recovery, and fallback are split across prompts and helpers.
Desired outcome: Admission proves the production review path and one dispatcher owns launch through terminal evidence.

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
- The [configuration-provenance brief](../independent-review-configuration-provenance.md)
  shows why admission must consume the canonical configuration source.
- The [inspection-fallback brief](../independent-review-inspection-environment-fallback.md)
  records degraded-environment limits that the dispatcher must classify explicitly.

## 3. Options considered and tradeoffs
- Probe after Apply.
- Let each skill launch review.
- Use admission preflight plus one typed dispatcher.

## 4. Decisions, assumptions, and owner
- Owner: Initiative owner; review availability and fallback policy are admission controls.
- Confirmed decisions: One typed dispatcher owns review invocation; production
  admission proves strict artifact delivery, credentials, permissions, time,
  worktree, and cleanup viability before Apply can become eligible.
- Approval evidence: The owner accepted strict review as a hard live prerequisite
  for real Apply in the master design.
- Assumptions: Unavailability at admission rejects or pauses the run; mid-run
  unavailability preserves state and an exact retry action.

## 5. Scope, non-goals, constraints, dependencies, and risks
- Scope: M3-S2 readiness checks, dispatcher, receipt recovery, fallback eligibility, deadline, permissions, and cleanup destination.
- Non-goals: Changing strict review assurance, owner command relay, or exact-head correction semantics.
- Constraints: No skill may launch its own competing review path; no degraded
  fallback may satisfy a strict-only production gate.
- Dependencies: M3-S1 artifact delivery and M1-S3 configuration provenance.
- Risks: Stale preflight evidence, duplicate dispatch, or an implicit fallback
  could allow Apply without a viable assurance path.

### Proposed admission and dispatcher

- Admission probes the exact configured executable/adapter identity, parent
  transport, repository/view, multi-step artifact path, inspection capability,
  runtime permission, deadline budget, and cleanup destination.
- Strict-only work pauses before Apply when any mandatory capability is absent;
  successful admission is evidence, not standing permission.
- One dispatcher owns launch, receipt consumption, transport recovery,
  classification, allowed degraded eligibility, and terminal evidence.
- The dispatcher never asks the owner to relay commands and never converts an
  unavailable strict result into success.

### Acceptance evidence

- Live preflight and a genuine multi-step probe pass through the production
  interface before real Apply can be enabled.
- Missing adapter, bad attestation, wrong repository view, inadequate deadline,
  denied runtime permission, and unwritable destination fail at admission.
- Mid-run reviewer loss preserves the attempt and returns an exact resume/pause.
- Degraded behavior occurs only under a separately valid policy and evidence;
  strict-only remains fail closed.
- Inspection-environment fallback stays conditional on observed semantic-tool
  insufficiency rather than becoming a routine second path.

## 6. Open questions and blocking decisions
- Define the minimum live multi-step readiness probe and its freshness window.
- Confirm when the inspection-environment follow-up is actually required.

## 7. Recommended next step
Recommendation pending owner confirmation: After M3-S1 and M1-S3, Propose add-autonomous-sdd-review-admission-and-dispatcher.
Recommended workflow action: OpenSpec Explore. No OpenSpec artifacts were created.
