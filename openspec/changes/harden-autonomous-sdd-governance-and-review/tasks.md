## 1. Owner-gated Explore → Propose

- [x] 1.1 Add the owner-approval gate to the canonical
  `skills/base/autonomous-sdd-lifecycle/SKILL.md` Explore/Propose step: Explore
  may recommend, Propose requires owner-approved open-question resolutions,
  durably recorded. Depends on: none.
- [x] 1.2 Add "unapproved open questions" to
  `skills/base/autonomous-goal-runner/references/human-decision-classification.md`
  under "Pause For Human Decision." Depends on: none.
- [x] 1.3 Add
  `skills/base/autonomous-goal-runner/references/open-question-resolution.md`
  defining the presentation contract (jargon + plain English + options +
  tradeoffs + recommendation) and the approval + recording rule. Depends on:
  none.

## 2. Comprehensive review loop

- [x] 2.1 Update `skills/base/autonomous-goal-runner/references/review-matrix.md`
  with the shared canonical checklist, the `material`/`advisory` finding
  classes, the self-review pre-flight, and the completeness-pass escalation.
  Depends on: none.
- [x] 2.2 Add the shared checklist as a canonical asset consumed by both the
  implementer self-review and the reviewer. Depends on: 2.1.

## 3. Living-spec requirements

- [x] 3.1 Add the two `bounded-autonomous-execution` requirements via the delta
  in `specs/` (owner-gated Explore → Propose; shared checklist + severity-tagged
  review loop). Depends on: 1.1, 2.1.

## 4. Verification evidence

- [x] 4.1 Add focused validation for the checklist/severity classification
  (`scripts/sdd/test/review-severity-classification.test.mjs`) and map every
  delta scenario to implementation and test evidence. Depends on: 2.2, 3.1.
- [x] 4.2 Run `openspec validate --all --strict`, run the focused test suite, and
  inspect the final diff for scope and secrets. Depends on: 4.1.
