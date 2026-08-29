# Durable review correction and completeness orchestration design brief

Date: 2026-08-26

Status: Architecture recommendation pending owner approval. Depends on the
trusted review-policy design.

## 1. Problem and desired outcome
Problem: Ordinary strict reviews lack durable per-signature correction history, and the completeness hook does not produce the owner-approved same sealed two-pass review.
Desired outcome: Controller-owned correction history and a deterministic two-pass escalation that reports all current findings, correlates signatures centrally, and emits one sealed aggregate review result.

## 2. Evidence and key findings
- [ai-planning/design-briefs/reduce-implementer-reviewer-fix-loops.md](../reduce-implementer-reviewer-fix-loops.md): \# Design Brief: Reduce Implementer–Reviewer Fix Loops Date: 2026-08-25 Status: Direction approved \(owner, 2026-08-25\). Open questions resolved; ready for Propose. \#\# 1. Problem and desired outcome During M4-S4 run \#2, the implementer and the strict reviewer looped ~11 times, exh…
- [ai-planning/handoff-docs/autonomous-sdd-run2-current-state-reconciliation.md](../../handoff-docs/autonomous-sdd-run2-current-state-reconciliation.md): \# Current-state reconciliation: autonomous SDD run \#2 and governance/review work Date: 2026-08-26 Status: Planning baseline. This document supersedes the state assertions in \[\`autonomous-sdd-run2-and-governance-untangling-handoff.md\`\]\(autonomous-sdd-run2-and-governance-untanglin…
- [skills/base/autonomous-goal-runner/references/correction-loop.md](../../../skills/base/autonomous-goal-runner/references/correction-loop.md): \# Correction Loop The runner may correct objective, narrowly scoped failures without routine approval. It must not use correction as a way to change approved behavior or avoid a human decision. \#\# Failure Signatures A failure signature is the stable identity used for retry budge…

## 3. Options considered and tradeoffs
- Keep a global attempt counter and prompt-only completeness hook.
- Inject prior finding content and ask a fresh reviewer not to repeat it, creating suppression and prompt-injection risk.
- Persist canonical signatures in the controller; run two passes over one immutable package with one bound reviewer identity; aggregate and deduplicate after both passes.

## 4. Decisions, assumptions, and owner
- Owner: Joe Rice
- Confirmed decisions: None; recommendation remains pending owner decision.
- Approval evidence: Not supplied.
- Assumptions: Canonical signature derivation can be versioned and migration-tested.; Reviewer identity can be durably bound even where a provider cannot expose a resumable conversational session.

## 5. Scope, non-goals, constraints, dependencies, and risks
- Scope: Strict and degraded per-signature ledger, materially-different-fix accounting, escalation state, same-package reviewer binding, two-pass result aggregation, implementer self-review trigger, recovery semantics, migrations, and tests.
- Non-goals: Changing materiality policy, allowing unresolved findings to disappear, fixing Thread A, or weakening fail-closed behavior.
- Constraints: Three materially different failed corrections per signature then pause.; One immutable package per review round.; No prior-finding suppression instruction.
- Dependencies: Trusted independent-review policy and severity
- Risks: Signature instability can reset or merge budgets incorrectly.; Provider session semantics can make same-reviewer guarantees non-portable.; Partial writes can split ledger and sealed result state.

## 6. Open questions and blocking decisions

### Correction-ledger design

For every strict or authorized degraded result, the controller stores a
versioned canonical signature, first/last seen round, current material status,
ordered correction attempts, evidence digest for each materially different fix,
and terminal pause reason. Global `correctionAttempts` may remain as diagnostic
metadata but is never the enforcement source for per-signature budgets.

The third materially different correction that still leaves the same signature
material causes a fail-closed owner pause. Signature migration, collision, and
split/merge behavior must be deterministic and tested.

### Completeness-escalation design

1. The controller determines escalation after two consecutive rounds with
   material findings and records that decision before invocation.
2. One immutable review package and trusted-policy digest are captured.
3. Pass one runs the full structured review.
4. Pass two runs against the same package with the same provider/model and a
   durably bound reviewer identity or provider-supported continued session. It
   asks for another exhaustive current-state review; it never says to suppress
   or omit prior findings.
5. The controller validates both outputs, canonicalizes signatures, unions and
   correlates them, and seals one aggregate result that preserves per-pass
   provenance.
6. Implementer self-review is a separately evidenced preflight. It cannot
   produce or replace independent-review acceptance.

### Crash and recovery contract

- Package capture, escalation decision, pass receipts, aggregate result, and
  ledger advance are generation-fenced and idempotent.
- A crash after pass one resumes pass two or safely restarts the entire sealed
  operation without double-counting a correction.
- Any package, policy, candidate-head, or reviewer-binding change invalidates
  prior partial evidence.

### Acceptance evidence

- Strict and degraded fixtures share the same per-signature budget behavior.
- Tests cover new, repeated, split, merged, disappeared, and reappeared
  signatures; three materially different failed fixes; and advisory-only rounds.
- Two-pass tests prove identical package/head/policy, reviewer binding, complete
  repeated-finding visibility, deterministic union, and one sealed aggregate.
- Crash injection proves idempotent recovery at every persistence boundary.
- No production call site retains a dead `completenessPass` hook.

### Blocking decisions

- Approve a versioned canonical-signature algorithm and migration behavior.
- Define the portable reviewer-identity guarantee where providers cannot resume
  one conversational session; if equivalence cannot meet the owner's original
  contract, pause rather than weaken the guarantee silently.

## 7. Recommended next step
Recommendation pending owner confirmation: Implement correction and completeness behavior in the controller after trusted review policy is delivered; reviewers always report current findings and the controller owns cross-round correlation.
Recommended workflow action: OpenSpec Explore. No OpenSpec artifacts were created.
