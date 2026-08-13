# Finding Severity and Disposition Decision

## Owner decision

On 2026-08-13, the owner authorized the runner to stop treating `blocker` or
`high` severity as an automatic conversational pause. Severity describes the
finding's potential impact; disposition controls the next action.

- `objective-fix`: continue autonomously only when the correction is in scope,
  behavior-preserving, evidence-backed, and inside the per-signature budget;
  rerun affected evidence and obtain a fresh exact-head strict-first review.
- `human-decision`: pause when product, architecture, security posture,
  compatibility, licensing, governance, data ownership, scope, credentials, or
  other owner judgment is required.
- `warning` or `false-positive`: require durable evidence and remain
  challengeable by a fresh reviewer.

This decision does not allow unresolved findings through the delivery gate,
weaken independent-review isolation, broaden mutation authority, override an
expired authorization, or bypass correction limits. It removes unnecessary
human pauses for corrections an autonomous runner can make safely under the
existing bounded correction contract.
