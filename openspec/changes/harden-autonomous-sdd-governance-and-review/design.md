## Context

See `proposal.md` for motivation and the two owner-approved design briefs:
`ai-planning/design-briefs/explore-to-propose-owner-approval.md` and
`ai-planning/design-briefs/reduce-implementer-reviewer-fix-loops.md`. M4-S4 run
#2 resolved a change's open design questions unilaterally and then looped ~11
times with the strict reviewer before failing closed. This change adds the two
missing governance guardrails.

## Goals / Non-Goals

**Goals:**

- Block Propose until every Explore-surfaced open question is owner-approved and
  durably recorded, with a fixed presentation contract.
- Reduce avoidable implementer–reviewer rounds by front-loading a shared
  checklist self-review and making reviewer findings severity-tagged, so only
  material findings consume the correction budget.

**Non-Goals:**

- Changing Explore itself, the strict-review *authority*, or the correction
  budget size.
- Adding controller/admission machinery for the gate (that is Option C, deferred).
- Ending a loop while material findings remain.

## Decisions

### Open-question resolutions (owner-approved, 2026-08-25)

- **Owner-gated Explore → Propose (Option B — all of the above).** Enforced in
  the canonical lifecycle skill, the human-decision list, a new
  `open-question-resolution.md` reference, and a machine-checkable living-spec
  requirement.
- **Recording location.** The OpenSpec change's `design.md` "Open-question
  resolutions" section (each `owner-approved` with a reference) plus a note in
  the controller record.
- **Review loop (refined Option B).** Shared canonical checklist for both
  implementer self-review and reviewer; reviewer adds a *material-only* freeform
  pass; every finding is tagged with the review contract's severity, where
  `blocker`/`high`/`objective-fix` are material and `warning`/`false-positive`
  are advisory. Only material findings drive the loop; advisory findings are
  recorded and non-blocking.
- **Completeness second pass.** Part of the single sealed review (same reviewer,
  same package, an explicit second prompt), used only as an escalation after two
  consecutive rounds still produce material findings.
- **Correction budget.** Three materially-different fixes per failure signature,
  then a fail-closed pause to the owner.

### The review loop (shipped vs deferred)

**Shipped now (code-tested):** the reviewer applies the shared checklist plus a
material-only freeform pass, tagging every finding `material` or `advisory`;
only material findings drive the loop; advisory findings are recorded and
non-blocking; and the budget is three materially-different fixes per failure
signature before a fail-closed pause. The completeness-pass prompt hook is wired
and retains the checklist and carries a sanitized summary of prior findings.

**Deferred to a follow-up controller change (runner-followed prose only):** the
implementer self-review pre-flight before invoking the reviewer, and the
completeness-pass escalation *triggering* (flipping the pass on after two
consecutive material-finding rounds). These are runner-orchestration behaviors,
not review-adapter code paths, so the normative spec does not assert them.

## Risks / Trade-offs

- The prose guardrail is enforced by the runner following it; the living-spec
  requirement makes it checkable but not a hard controller gate (deferred).
- Severity tagging reduces nitpick flooding but relies on the reviewer tagging
  honestly; the shared checklist anchors it to the spec.
- The completeness escalation trades extra reviewer tokens for coverage only
  when the single pass is demonstrably insufficient.

## Migration Plan

1. Update the lifecycle skill and references (prose).
2. Add the two living-spec requirements (machine-checkable).
3. Add tests/validators for the shared checklist and severity classification.
4. Run `openspec validate --all --strict` and the focused suite.

Rollback reverts the skill/reference/spec edits; no external state changes.
