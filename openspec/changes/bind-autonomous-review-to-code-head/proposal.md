# Bind Autonomous Review to Code Head

## Why

Review evidence can become stale after code changes, or be redundantly repeated
for unchanged closeout steps. This change binds review and bounded correction to
the exact Apply evidence, package, artifacts, assurance contract, and code head,
so reuse is safe and re-review is triggered only by real change.

## What Changes

- Bind each review to the exact code head plus a defined invalidation set: sealed
  package digest, head, artifact manifest, Apply evidence, findings dispositions,
  policy gates, reviewer identity, and assurance level.
- Allow closeout transitions (merge, Sync, Archive, cleanup, issue-close,
  project-done) to reuse the review when the head and invalidation set are
  unchanged; Sync/Archive are non-code and do not invalidate.
- Bind objective correction to the existing per-signature correction budget: each
  correction changes the head, invalidates the prior review, and requires a fresh
  exact-head rereview.
- Reject wrong-head, wrong-package, self-review, and stale evidence.

## Capabilities

### New Capabilities

- `autonomous-sdd-exact-head-review`: exact-head review binding, invalidation,
  closeout reuse, and correction-to-rereview.

### Modified Capabilities

None.

## Impact

- New `scripts/sdd/autonomous-sdd-exact-head-review.mjs` (plus focused tests).
- Reuses the existing `validateReviewReuse` contract (the base six-field
  invalidation set) and adds reviewer identity + assurance level.
- Wires into the review step and closeout reuse path in the vertical slice and
  independent-review modules.
