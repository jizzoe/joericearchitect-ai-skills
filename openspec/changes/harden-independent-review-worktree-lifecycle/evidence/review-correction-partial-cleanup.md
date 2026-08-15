# Strict Review Correction: Partial Worktree Cleanup

Date: 2026-08-15

## Reviewed state

- Base: `8342a0da642d340fe506ddfb8200ec5427ff295b`.
- Reviewed head: `985ea4d2a9004ce7737822bc469352969c10ad6a`.
- Manifest:
  `d8887a7379032869bf36b40e35b1c7ed49d1254a58fd962885ea3ac6a1df242a`.
- Strict review record:
  `strict-34b59fd9-8033-40e7-a211-4cba326eb804`.
- Strict transport, canonical result validation, and owned-view cleanup: passed.

The validated strict result contained one bounded high-severity finding.

## Finding and disposition

- Finding: `IR-001` — partial detached-worktree construction and verification
  paths suppressed cleanup failures, so callers could receive the original
  construction diagnostic without learning that Git registration or the owned
  temporary root still required recovery.
- Failure signature:
  `independent-review/objective-fix/partial-worktree-cleanup-suppressed/merge-pr`.
- Correction attempt: 1 of 3 for this signature.
- Disposition: `objective-fix`.

## Correction

Partial-view cleanup now returns a structured fail-closed result. If Git
worktree removal fails, cleanup preserves the owned root as recovery evidence
and reports `review-worktree-partial-cleanup-failed`; if removal of the owned
temporary root fails, it reports the same cleanup failure. Construction and
verification paths prefer that cleanup diagnostic over the triggering error so
controllers cannot mistake a partial cleanup for success.

A deterministic regression simulates worktree creation followed by failed Git
cleanup and proves the cleanup attempt is reported, the lifecycle request stays
bound to the diagnostic, and the owned root remains available for recovery.
The complete 261-test Node suite, all 26 strict OpenSpec validations,
adapter-drift validation, shared-guardrail validation, and whitespace review
pass after the correction.

## Required rereview

This correction changes the repository head. Full Apply verification and a new
strict review are required; the failed result above cannot authorize delivery.
