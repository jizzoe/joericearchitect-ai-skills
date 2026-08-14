# Durable Correction Counter Evidence

## Failure and authorization

- Failure signature:
  `independent-review/high/caller-controlled-correction-counter/merge-pr`.
- Failed review head: `34943ca50208d81f0b5e3fd5a856330b162ada8b`.
- Failed review manifest:
  `432434b497495f8552fae867f07264ff3e2cf810b6bf5e9af6459c7bd0fe7409`.
- Failed review record:
  `degraded-4f0e3872-049f-407f-b750-977bdd8a9158`.
- Previous correction head: `db4d1c9b6557de9aea8c4025b892df0cc9b448fd`.
- Previous correction manifest:
  `961c4db89fce7cf51fd85c4a5fd25a609399be3f9e467d6359525321519e013f`.
- Finding severity: `high`.
- Authorization: the owner explicitly authorized this behavior-preserving
  correction-counter fix, affected checks, commit, and fresh exact-head strict-
  first review under the unchanged scope, accepted risks, expiration, per-
  failure-signature limit, and safety controls.

## Disposition

Disposition: `objective-fix`.

Objective-correction authorization now validates the selected entry's durable
checkpoint, binds it to the resolved authorized target, counts prior records
for the named immutable failure signature, and enforces the authorization's
per-signature budget. Caller-supplied per-signature and total counters are
accepted only when they exactly match the derived values.

## Correction budget and exact-head rule

- Overall ordered correction chain: attempt 11.
- Attempts for this failure signature: 1 of 3.
- Behavior-preserving: yes.
- Fresh strict-first review: required for the corrected commit and newly sealed
  manifest.

## Verification

- Regression tests prove different signatures remain independent, three
  attempts for one signature block, missing durable context fails closed, and
  understated caller counters are rejected.
- Focused authorization tests, repository-wide tests, strict OpenSpec
  validation, adapter drift, metadata, shared guardrails, artifact quality,
  security/secret review, and `git diff --check` are required before sealing
  the corrected package.
