## 1. Exact-head binding module

- [x] 1.1 Create `scripts/sdd/autonomous-sdd-exact-head-review.mjs` with `exactHeadReviewBinding` computing the canonical invalidation-set digest
- [x] 1.2 Implement `reviewExactHeadReuse` composing the base `validateReviewReuse` with reviewer identity + assurance level, returning a typed reuse/invalidate decision
- [x] 1.3 Implement `correctionRequiresRereview` binding correction to head-change plus the existing per-signature budget

## 2. Integration

- [x] 2.1 Wire the exact-head reuse check into the review step and closeout reuse path (reuse `validateCloseoutReviewReuse` where applicable)

## 3. Tests

- [x] 3.1 Add focused tests: changed head and each changed invalidation field invalidate; unchanged closeout reuses; Sync/Archive are non-code and do not invalidate; correction changes head and requires rereview; an exhausted signature blocks

## 4. Verification

- [x] 4.1 Run the focused test file and the full `scripts/sdd/test` suite
- [x] 4.2 Run `openspec validate --all --strict` and confirm the new delta validates

