# Trusted independent-review policy and severity design brief

Date: 2026-08-26

Status: Architecture recommendation pending owner approval.

## 1. Problem and desired outcome
Problem: The current reviewer prompt can consume a checklist from the candidate repository, allowing the candidate to influence its own acceptance policy; severity and disposition terminology is also inconsistent.
Desired outcome: A trusted, digest-bound review policy with explicit severity, blocking-status, and implementer-disposition semantics that a candidate cannot weaken.

## 2. Evidence and key findings
- [ai-planning/design-briefs/reduce-implementer-reviewer-fix-loops.md](../reduce-implementer-reviewer-fix-loops.md): \# Design Brief: Reduce Implementer–Reviewer Fix Loops Date: 2026-08-25 Status: Direction approved \(owner, 2026-08-25\). Open questions resolved; ready for Propose. \#\# 1. Problem and desired outcome During M4-S4 run \#2, the implementer and the strict reviewer looped ~11 times, exh…
- [ai-planning/handoff-docs/autonomous-sdd-run2-current-state-reconciliation.md](../../handoff-docs/autonomous-sdd-run2-current-state-reconciliation.md): \# Current-state reconciliation: autonomous SDD run \#2 and governance/review work Date: 2026-08-26 Status: Planning baseline. This document supersedes the state assertions in \[\`autonomous-sdd-run2-and-governance-untangling-handoff.md\`\]\(autonomous-sdd-run2-and-governance-untanglin…
- [schemas/independent-review-findings-v1.schema.json](../../../schemas/independent-review-findings-v1.schema.json): { "$schema": "http://json-schema.org/draft-07/schema\#", "title": "Independent Review Findings v1", "type": "object", "additionalProperties": false, "required": \["schemaVersion", "findings", "status"\], "properties": { "schemaVersion": {"type": "integer", "const": 1}, "findings": …

## 3. Options considered and tradeoffs
- Continue trusting the candidate repository checklist.
- Embed checklist prose separately in each adapter, creating drift.
- Package one canonical reviewer-policy asset in the trusted runtime or parent context, seal its digest, and treat repository copies as parity-check data only.

## 4. Decisions, assumptions, and owner
- Owner: Joe Rice
- Confirmed decisions: None; recommendation remains pending owner decision.
- Approval evidence: Not supplied.
- Assumptions: The existing review schema remains the compatibility boundary unless Explore finds a required schema version.

## 5. Scope, non-goals, constraints, dependencies, and risks
- Scope: Trusted policy asset provenance, sealed identity/digest, adapter consumption, repository parity check, severity/status/disposition contract, schema and focused tests.
- Non-goals: Per-signature controller history, completeness triggering, same-session multi-pass aggregation, or Thread A fixes.
- Constraints: Candidate content is data-only.; Codex and Claude adapters must remain behaviorally aligned.; No product constants in shared assets.
- Dependencies: Workspace and runtime stabilization; requirements-to-plan runtime outcome-validation repair; Governance-only delivery must not overlap shared canonical files during implementation
- Risks: Moving an asset without digest binding merely relocates the trust ambiguity.; Changing terminology without migration tests can invalidate old evidence.

## 6. Open questions and blocking decisions

### Trust-boundary design

1. The authoritative checklist/policy is packaged with the trusted installed
   runtime or supplied by an immutable parent-owned review context.
2. Review admission resolves the policy identifier, version, and SHA-256 digest
   before the candidate worktree is exposed.
3. The sealed review package records that identifier and digest. Both adapters
   consume the exact captured content.
4. A same-path candidate repository file is untrusted data. It may be compared
   with the trusted asset for drift, but it cannot replace or augment policy.
5. Adapter tests prove candidate edits cannot remove categories, downgrade
   materiality, or alter the output contract.

### Finding semantics

- `severity` is reviewer-authored and schema-defined.
- `status` is the aggregate review result derived from unresolved material
  severities.
- `disposition` is implementer/controller-authored handling metadata and is not
  a reviewer severity or acceptance signal.
- Advisory findings remain visible and non-blocking; material findings remain
  visible and blocking until evidence resolves them.

### Acceptance evidence

- Tampered candidate checklist fixture produces the same authoritative prompt
  and a parity-drift diagnostic.
- Policy digest mismatch fails review admission closed.
- Codex and Claude invocations bind the same policy digest and categories.
- Schema/contract tests reject severity-disposition conflation and preserve
  compatibility or provide an explicit versioned migration.
- Strict review is launched from a clean trusted runtime, not a dirty primary
  worktree or `/tmp` driver importing candidate-adjacent modules.

### Blocking decisions

- Confirm the authoritative policy location and versioning strategy.
- Confirm whether parity drift is material for delivery or an advisory that
  becomes material only when the repository claims policy parity.

## 7. Recommended next step
Recommendation pending owner confirmation: Move reviewer policy authority outside the candidate, bind it into the sealed package, and clarify severity versus disposition before adding orchestration.
Recommended workflow action: OpenSpec Explore. No OpenSpec artifacts were created.
