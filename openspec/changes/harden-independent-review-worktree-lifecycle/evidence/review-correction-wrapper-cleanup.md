# Review correction: wrapper cleanup cannot be masked

- Review record: `strict-c7080fe1-045e-460e-b9f4-588e641bdaf2`
- Finding: `IR-001` (`objective-fix`)
- Failure signature:
  `independent-review/IR-001/scripts/sdd/detached-review-view.mjs/merge-pr`
- Correction attempt: 1 of 3 for this signature

## Defect

`withDetachedReviewView` returned its callback result from a `try` block while
calling cleanup only in `finally`. A cleanup failure was therefore discarded,
which could report a successful lifecycle action while its owned worktree and
Git metadata remained registered.

## Correction

The wrapper now captures callback completion, checks the ownership-guarded
cleanup result, returns that safe unavailable outcome unless `removed: true`,
and rethrows a callback failure only after successful cleanup.

## Evidence

- Focused detached-view, lifecycle, and recovery tests cover an otherwise
  successful callback whose cleanup fails and confirm the owned root remains
  available for recovery.
- A fresh strict-isolated review is required for the corrected head before the
  delivery transition resumes.
