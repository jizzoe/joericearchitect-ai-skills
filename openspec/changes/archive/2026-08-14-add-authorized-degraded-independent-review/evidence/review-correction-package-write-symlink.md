# Review Package Write Symlink Correction Evidence

## Failure and authorization

- Failure signature:
  `independent-review/high/review-package-write-symlink-escape/merge-pr`
- Failed review head: `b83e57d4cbbe47f034c59b6c13e46e418187af3b`
- Failed review manifest:
  `503f7a6cbb365d545b47915f02bec6efdd9975d3e89c17b0f0622c6ef7945478`
- Failed review record:
  `degraded-bfbdc0b4-cd29-4987-94ce-8ca92f9a269c`
- Finding severity: `high`.
- Authorization: the owner explicitly authorized the behavior-preserving fix,
  affected checks, commit, and fresh exact-head strict-first review under the
  existing scope, accepted risks, expiration, per-failure-signature correction
  limit, and safety controls.

## Disposition

Disposition: `objective-fix`.

The host launcher now creates `.ai-independent-review-package.json` with
exclusive-create semantics. A committed file or symlink at that reserved path
causes a fail-closed `EEXIST` result; the launcher does not follow or replace
the entry. This preserves the sealed-package behavior while preventing a
detached-view path from redirecting the host-owned write.

## Correction budget and exact-head rule

- Overall ordered correction chain: attempt 6.
- Attempts for this failure signature: 1 of 3.
- Behavior-preserving: yes.
- Fresh strict-first review: required for the corrected commit and newly sealed
  manifest.

## Verification

- Regression test pre-creates the package path as a symlink to an external
  canary, proves the write fails with `EEXIST`, and proves the canary is
  unchanged.
- Focused platform review adapter tests — 15 passed.
- `git diff --check` — passed.
