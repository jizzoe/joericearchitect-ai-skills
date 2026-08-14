# Review correction: synthesized strict-unavailable timestamp

## Finding

The exact-head independent reviewer reported
`strict-unavailable-epoch-timestamp` at high severity. When strict review failed
before producing its own result, the orchestrator synthesized durable
strict-unavailable evidence with epoch timestamps. The delivery gate correctly
requires strict-unavailable and degraded review attempts to begin after current
Apply evidence, so the synthesized record made the authorized degraded path
unusable.

## Correction

`executeAuthorizedIndependentReview` now captures the runtime clock once at the
strict failure and uses that value for both `startedAt` and `completedAt` on the
synthesized record. The executor test persists that exact record, resumes the
degraded path, and passes the production `validateIndependentReviewV1` gate
against Apply evidence completed before the failed strict attempt.

This is a deterministic objective correction. It does not broaden the degraded
reviewer's guarantees or alter the accepted limitations: the outcome remains
`authorized-degraded`, and parent-launch evidence and executable identity remain
non-security-verifiable.
