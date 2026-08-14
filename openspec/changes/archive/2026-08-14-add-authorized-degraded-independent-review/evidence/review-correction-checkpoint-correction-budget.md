# Checkpoint Correction Budget Correction Evidence

## Failure and authorization

- Failure signature:
  `independent-review/high/checkpoint-global-correction-cap-conflicts-with-per-signature-budget/merge-pr`
- Failed review head: `b04c92dd926b871671a937851104d15ec7a7ad43`
- Failed review manifest:
  `87d4c83bf503da93e2e21cdfbf75e9af4a91acbd1a18d87b2f65be701a58fc70`
- Failed review record:
  `degraded-c9300310-7f59-42c3-844c-f85517b7ca49`
- Finding severity: `high`.
- Authorization: the owner explicitly authorized behavior-preserving correction-
  budget enforcement matching the original limit of three corrections per
  failure signature, affected checks, commit, and fresh exact-head strict-first
  review.

## Disposition

Disposition: `objective-fix`.

Checkpoint inspection now counts corrections by immutable
`failureSignature`, rejects a fourth correction for one signature, and permits
more than three globally when each distinct signature stays within its own
three-correction budget. Sequential total attempt numbering and all existing
record-shape checks remain unchanged.

## Correction budget and exact-head rule

- Overall ordered correction chain: attempt 8.
- Attempts for this failure signature: 1 of 3.
- Behavior-preserving: yes.
- Fresh strict-first review: required for the corrected commit and newly sealed
  manifest.

## Verification

- Regression covers three attempts for one signature plus a fourth global
  attempt for another signature, and rejects four attempts for one signature.
- Focused checkpoint, authorization, finding, and delivery-gate tests — 32
  passed.
- `node --test` — 206 passed.
- `openspec validate --all --strict` — 22 passed, 0 failed.
- `git diff --check` — passed.
