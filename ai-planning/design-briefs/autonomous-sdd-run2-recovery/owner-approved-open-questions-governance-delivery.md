# Owner-approved open-questions governance delivery design brief

Date: 2026-08-26

Status: Delivery boundary recommendation pending owner approval. The underlying
governance behavior was approved on 2026-08-25 in the source brief.

## 1. Problem and desired outcome
Problem: The approved Explore-to-Propose owner gate is entangled with an unfinished review redesign and therefore has no independently trustworthy delivery path.
Desired outcome: Deliver only the owner-approved governance gate through a complete tracked SDD lifecycle, without importing Thread C review machinery.

## 2. Evidence and key findings
- [ai-planning/design-briefs/explore-to-propose-owner-approval.md](../explore-to-propose-owner-approval.md): \# Design Brief: Owner-Approved Explore → Propose Transition Date: 2026-08-25 Status: Direction approved \(owner, 2026-08-25\). Open questions resolved; ready for Propose. \#\# 1. Problem and desired outcome During M4-S4 run \#2, the autonomous runner resolved a change's open design q…
- [ai-planning/handoff-docs/autonomous-sdd-run2-current-state-reconciliation.md](../../handoff-docs/autonomous-sdd-run2-current-state-reconciliation.md): \# Current-state reconciliation: autonomous SDD run \#2 and governance/review work Date: 2026-08-26 Status: Planning baseline. This document supersedes the state assertions in \[\`autonomous-sdd-run2-and-governance-untangling-handoff.md\`\]\(autonomous-sdd-run2-and-governance-untanglin…
- [docs/sdd-workflow.md](../../../docs/sdd-workflow.md): \# Specification-Driven Development Workflow \#\# Purpose This guide explains how contributors operate and recover the repository's OpenSpec workflow through Claude and Codex. It covers the local foundation; GitHub lifecycle automation is introduced by later changes. Authoritative …

## 3. Options considered and tradeoffs
- Deliver the combined Thread C branch, accepting unresolved review architecture.
- Cherry-pick selected combined commits, retaining opaque history and accidental coupling risk.
- Create a fresh governance-only change from the approved brief and use the combined branch solely as implementation reference.

## 4. Decisions, assumptions, and owner
- Owner: Joe Rice
- Confirmed decisions: None; recommendation remains pending owner decision.
- Approval evidence: Not supplied.
- Assumptions: The 2026-08-25 approved brief remains authoritative.

## 5. Scope, non-goals, constraints, dependencies, and risks
- Scope: Canonical lifecycle gate, human-decision pause classification, open-question presentation and durable recording reference, living-spec requirement, tests, and thin wrappers only if canonical references require them.
- Non-goals: Review checklist, severity redesign, completeness escalation, correction ledger, Thread A fixes, or runtime stabilization.
- Constraints: No review adapter or controller changes.; Prototype and production profiles share the gate.; Owner approval must be durably referenced.
- Dependencies: Workspace and runtime stabilization; requirements-to-plan runtime outcome-validation repair
- Risks: Copying from Thread C can accidentally reintroduce review-loop scope.

## 6. Open questions and blocking decisions

### Design contract

The fresh change implements exactly four owner-approved surfaces:

1. The canonical autonomous SDD lifecycle blocks Explore → Propose while any
   material open question lacks owner approval.
2. Human-decision classification treats that state as a mandatory pause for
   both production and prototype profiles.
3. A canonical reference requires jargon, plain-English explanation, options,
   tradeoffs, recommendation, owner response, and durable recording.
4. A living-spec requirement and scenarios make the transition gate reviewable
   and machine-checkable.

The durable record is the change `design.md` open-question-resolution section,
with each answer marked owner-approved and referenced by the controller record.
Thin Claude/Codex wrappers continue to point at canonical skills; no behavior is
duplicated into wrappers.

### Acceptance evidence

- Requirement-to-test mapping covers approval, owner-supplied answer, unresolved
  question, prototype parity, and durable recording.
- Tests prove Propose cannot start from runner-authored recommendations alone.
- Diff contains no review checklist, review adapter, severity, correction-loop,
  or completeness-pass change.
- Issue, Project item, `tracking.yaml`, branch, strict review, PR, merge, Sync,
  Archive, and installed-runtime provenance all identify the same change/head.

### Blocking decision

- Approve creation of a fresh governance-only change rather than delivery of the
  combined Thread C branch.

## 7. Recommended next step
Recommendation pending owner confirmation: Create a fresh governance-only production-rapid change after stabilization and the planning-runtime repair, with its own issue, tracking, Project, branch, strict review, PR, sync, and archive evidence.
Recommended workflow action: OpenSpec Explore. No OpenSpec artifacts were created.
