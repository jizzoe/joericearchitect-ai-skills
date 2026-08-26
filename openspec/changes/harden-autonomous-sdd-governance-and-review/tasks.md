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

## 5. Option A scope decision (owner-approved 2026-08-25)

- [x] 5.1 Ship the severity model, shared checklist, and completeness-pass prompt
  hook; move the implementer self-review pre-flight and the completeness-pass
  escalation triggering out of the normative spec to runner-followed prose,
  deferred to a follow-up controller change. Depends on: 3.1.
- [x] 5.2 Fix the completeness prompt to retain the shared checklist and carry a
  sanitized summary of prior findings. Depends on: 2.1, 5.1.

## 6. Strict-review findings fixes (2026-08-26)

- [x] 6.1 Enforce bidirectional status↔findings consistency in
  `independent-review-contract.mjs` (`failed` requires a material finding;
  `passed` requires none), with regression tests for both directions. Depends on:
  3.1.
- [x] 6.2 Align the review prompt's checklist with the canonical
  `review-matrix.md` dimensions (failure recovery, untrusted input, durable-state
  precedence, no product constants) and carry only trusted finding ids +
  severities in the completeness pass. Depends on: 2.1.
