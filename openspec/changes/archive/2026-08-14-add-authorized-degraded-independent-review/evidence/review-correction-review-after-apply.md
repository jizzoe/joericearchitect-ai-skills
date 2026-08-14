# Review Correction: Review-After-Apply Ordering

- Review record: `degraded-9016eeb8-e609-420f-b179-8b21e4d44f3f`.
- Reviewed head: `e64beaec64af9b84c43fa41f7eb7c2b7dbfa21ff`.
- Reviewed manifest:
  `667c019b2d6797a7b83d5c0cf5a23c22178bebc6a73aa4979e5488e9e1b92972`.
- Finding: `review-after-apply-not-enforced`.
- Classification: `objective-fix`.
- Failure signature:
  `independent-review/review-after-apply-not-enforced/scripts/sdd/independent-review.mjs/merge-pr`.
- Attempt for this signature: 1 of 3.

The zero-touch reviewer found that exact head/evidence equality did not prove
the review occurred after the current Apply validation. The correction rejects
any result whose completion precedes its start and makes the delivery gate
require both the selected result and an authorized-degraded strict-unavailable
precursor to start no earlier than the durable Apply completion time.

Regression coverage rejects reversed result timestamps and a review starting
one millisecond before Apply completion while preserving the valid ordered
path. The correction is behavior-preserving, is the first attempt for this
signature, and requires a fresh exact-head review.
