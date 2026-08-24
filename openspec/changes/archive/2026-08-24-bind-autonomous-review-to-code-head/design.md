# Design — Exact-Head Review and Correction

## Overview

M3-S3 adds one pure, deterministic module that owns exact-head review binding,
invalidation, closeout reuse, and the correction-to-rereview rule, on top of the
M2-S1 review-reuse contract and the M3-S1/M3-S2 strict review transport.

## Module: autonomous-sdd-exact-head-review.mjs

- `exactHeadReviewBinding({ reviewPackage, headCommit, artifactManifestDigest,
  applyEvidenceDigest, dispositionsDigest, policyGateDigest, reviewerIdentity,
  assuranceLevel })` — a single canonical digest of the full invalidation set.
- `reviewExactHeadReuse({ previous, current })` — composes the existing
  `validateReviewReuse` (six base fields) with the two added fields (reviewer
  identity, assurance level) and returns one typed decision: `reusable`,
  `invalidated` (with the changed-field list), or `invalid`.
- `correctionRequiresRereview({ headChanged, attempts, budget })` — the
  correction-to-rereview rule: a correction changes the head, so it invalidates
  and requires fresh rereview; the existing per-signature budget bounds it.

## Invalidation set (canonical)

1. sealed package digest, 2. code head, 3. artifact manifest digest, 4. Apply
evidence digest, 5. findings-dispositions digest, 6. policy-gate digest,
7. reviewer identity, 8. assurance level.

Items 1–6 are already enforced by `validateReviewReuse`; M3-S3 adds 7 and 8.

## Closeout reuse

`reviewExactHeadReuse` is the canonical reuse check for merge, Sync, Archive,
cleanup, issue-close, and project-done. Sync/Archive move spec/docs/metadata,
not production code, so those files sit outside the invalidation set and do not
force a re-review.

## Correction

Correction binds to the existing `correctionBudgetPerFailureSignature` (default
3, only narrowable, already enforced in `check-operation-authorization.mjs` and
the bounded-execution specs). Each objective correction changes the head →
invalidates → fresh exact-head rereview. Exhaustion blocks; stagnation does not
reset.

## Integration

`autonomous-sdd-vertical-slice.mjs` review step and the independent-review
closeout-reuse wrapper consume the new module. No change to the review transport
or to the not-activated v2 controller.

## Non-goals

Review transport, self-review policy, and enabling real Apply before the M3 gate
are unchanged.
