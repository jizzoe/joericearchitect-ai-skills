# Review Artifact Symlink Correction Evidence

## Failure and authorization

- Failure signature:
  `independent-review/high/review-artifact-symlink-read-escape/merge-pr`
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

Package construction now resolves each declared artifact in the exact head's
Git tree, requires a regular `100644` or `100755` blob, and reads the artifact
bytes through `git cat-file`. It rejects unsafe paths, absent entries,
symlinks, directories, submodules, and other non-regular entries before any
artifact bytes can be obtained through the checkout filesystem. This preserves
the exact-package behavior and strengthens its immutable-head binding.

## Correction budget and exact-head rule

- Overall ordered correction chain: attempt 7.
- Attempts for this failure signature: 1 of 3.
- Behavior-preserving: yes.
- Fresh strict-first review: required for the corrected commit and newly sealed
  manifest.

## Verification

- A committed-symlink fixture fails with
  `independent-review-package-artifact-not-regular` and leaves its external
  canary unchanged.
- A regular-blob fixture proves an uncommitted checkout replacement cannot
  change the exact-head artifact digest.
- Focused contract and platform adapter tests — 20 passed.
- `openspec validate add-authorized-degraded-independent-review --strict` —
  passed.
- `git diff --check` — passed.
