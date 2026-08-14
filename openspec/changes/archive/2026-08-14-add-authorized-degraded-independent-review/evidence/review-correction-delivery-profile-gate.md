# Delivery Profile Gate Correction Evidence

## Failure and authorization

- Failure signature:
  `independent-review/high/delivery-profile-gate-bypass/merge-pr`.
- Failed review head: `34943ca50208d81f0b5e3fd5a856330b162ada8b`.
- Failed review manifest:
  `432434b497495f8552fae867f07264ff3e2cf810b6bf5e9af6459c7bd0fe7409`.
- Failed review record:
  `degraded-4f0e3872-049f-407f-b750-977bdd8a9158`.
- Finding severity: `high`.
- Authorization: the owner explicitly authorized this behavior-preserving
  gate correction, affected checks, commit, and fresh exact-head strict-first
  review under the unchanged scope, accepted risks, expiration, per-signature
  limit, and safety controls.

## Disposition

Disposition: `objective-fix`.

Every high-impact SDD transition now requires a supported request delivery
profile that exactly matches the quality profile in the durable resolved
authorization. The checker uses the durable value to select the production
independent-review gate; omission, an unsupported value, or a caller-selected
prototype value cannot bypass a production authorization.

## Correction budget and exact-head rule

- Overall ordered correction chain: attempt 10.
- Attempts for this failure signature: 1 of 3.
- Behavior-preserving: yes.
- Fresh strict-first review: required for the corrected commit and newly sealed
  manifest.

## Verification

- Regression tests cover omitted, unsupported, and mismatched delivery
  profiles and prove a matching production authorization reaches the review
  gate.
- Focused authorization and delivery tests must pass before commit.
- Repository-wide tests, strict OpenSpec validation, adapter drift, metadata,
  shared guardrails, artifact quality, and `git diff --check` are required
  before sealing the corrected package.
