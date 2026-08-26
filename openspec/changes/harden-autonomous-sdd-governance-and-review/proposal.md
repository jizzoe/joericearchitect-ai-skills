## Why

M4-S4 run #2 exposed two governance gaps in the autonomous SDD runner:

1. **Open questions were resolved unilaterally.** The runner wrote its own
   "recommended resolutions" for a change's open design questions into
   `design.md` and proceeded straight to implementation, even though the source
   brief marked those resolutions "pending owner confirmation." The owner never
   saw the questions, approved the recommendations, or supplied answers.
2. **The implementer–reviewer loop exhausted the correction budget.** The
   implementer and the strict reviewer iterated ~11 times and failed closed.
   Most loops traced back to the unresolved decisions above; the remainder were
   genuine defects found one pass at a time.

## What Changes

- **Owner-gated Explore → Propose.** Explore may run with open questions and
  produce recommendations, but Propose is blocked until the owner explicitly
  approves each recommendation or supplies an answer, durably recorded. Each
  question is presented in official terminology plus a plain-English
  explanation, with options, tradeoffs, and a recommendation.
- **Severity-tagged review loop.** The reviewer applies a shared canonical
  checklist plus a material-only freeform pass and tags every finding `material`
  or `advisory`. Only material findings drive a correction loop, and the
  three-fixes-per-signature budget still ends in a fail-closed pause. The
  implementer self-review pre-flight and the completeness-pass escalation
  triggering are documented as runner-followed prose and deferred to a
  follow-up controller change.

## Capabilities

### Modified Capabilities

- `bounded-autonomous-execution`: Require owner-approved open-question
  resolutions before Propose, and require a shared-checklist, severity-tagged,
  budget-bounded review loop.

## Impact

- `skills/base/autonomous-sdd-lifecycle/SKILL.md` (Explore/Propose gate and loop).
- `skills/base/autonomous-goal-runner/references/human-decision-classification.md`
  (unapproved open questions = pause).
- New `skills/base/autonomous-goal-runner/references/open-question-resolution.md`.
- `skills/base/autonomous-goal-runner/references/review-matrix.md` (shared
  checklist, severity classes, escalation).
- `scripts/sdd/platform-review-adapters.mjs` (shared checklist + severity prompt,
  and a completeness-pass hook that retains the checklist and carries only
  trusted finding ids + severities).
- `scripts/sdd/independent-review-contract.mjs` (bidirectional status↔findings
  consistency: `passed` requires no material finding, `failed` requires one).
- `scripts/sdd/review-findings.mjs` (correction budget reads only own, finite,
  non-negative integer counters so inherited object keys cannot bypass it).
- `scripts/sdd/test/review-severity-classification.test.mjs` and
  `scripts/sdd/test/independent-review-contract.test.mjs` (regression coverage).
- Living spec `bounded-autonomous-execution` (two new requirements).
- Primary issue: to be linked at intake (see `tracking.yaml`).

## Reuse Plan

Both rules reuse the existing canonical reference and living-spec structure
rather than adding new machinery. The shared checklist is a single canonical
asset used by both the implementer self-review and the reviewer, so the two stay
aligned. No controller/admission change is required in v1.
