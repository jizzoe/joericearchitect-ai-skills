# Strict Review Correction: Executable Synthetic Fixtures

Date: 2026-08-15

## Reviewed state

- Base: `8342a0da642d340fe506ddfb8200ec5427ff295b`.
- Reviewed head: `104cccceebeb0b7e60d813ffabd51860c1bc75db`.
- Manifest:
  `14741096e13fe2c1784263b3e9537bf8c1b3091f1c2ce280af2b6f1b3334eee7`.
- Strict review record:
  `strict-1d4297eb-96a7-4678-8c74-8e04d492bac7`.
- Strict transport, canonical result validation, and owned-view cleanup: passed.

The validated strict result contained one high-severity objective finding.

## Finding and disposition

- Finding: `IR-001` — the three research/planning scenario suites asserted
  only that phrases existed in `SKILL.md`; they did not execute trigger,
  missing-input, untrusted-content, authorization, output-path, or portability
  behavior and would pass an implementation that ignored the requirements.
- Failure signature:
  `independent-review/high/non-executable-research-planning-fixtures/merge-pr`.
- Correction attempt: 1 of 3 for this signature.
- Disposition: `objective-fix`.

## Correction

The three canonical skills now name a shared deterministic runtime seam for
trigger selection, required-input and readiness checks, safe path resolution,
and operation authorization. That runtime emits schema-valid `skill-result-v1`
outcomes and exposes only fixed, bounded artifact operations to its writer;
untrusted source or requirement text cannot add an operation or destination.

The former wording checks are replaced by executable synthetic fixtures. They
invoke the runtime and assert positive and negative trigger handling,
structured blocked/paused results, untrusted-content containment, autonomous
allow/deny outcomes through the real operation checker, exact safe output
paths, and different paths under a second workspace configuration for all
three skills.

The complete 271-test Node suite, all 26 strict OpenSpec validations,
adapter-drift validation, shared-guardrail validation, tracking validation,
and whitespace review pass after the correction.

## Required rereview

This correction changes the repository head. Full Apply verification and a new
strict review are required; the failed result above cannot authorize delivery.
