# Goal Expiration Boundary Correction Evidence

## Failure and disposition

- Review record: `degraded-394b49db-f495-4d8a-9a33-d5ca6b089000`.
- Reviewed head: `cb2a3111a74f8c8083a1410f065b6e88f48fb77b`.
- Reviewed manifest:
  `8f1254fcba26334c1c6c20c98f9c2d2acbc6dfc967fdb0039e7dc4bc81028352`.
- Failure signature:
  `independent-review/degraded-expiration-not-bounded-by-goal/scripts/sdd/degraded-independent-review-authorization.mjs/merge-pr`.
- Severity: `high`.
- Disposition: `objective-fix`; the enclosing expiration comparison is
  deterministic, behavior-preserving, and requires no product or security
  judgment.

## Correction

Degraded authorization now requires a valid enclosing goal expiration and
rejects a fallback expiration later than that boundary. Launcher validation
independently applies the same upper bound to its own expiration. Preparation,
external-host execution, and response acceptance all call these validators
with their current clock, so an expired or over-broad record cannot become a
valid transition through time-of-check/time-of-use drift.

## Correction budget and verification

- Overall ordered correction chain: attempt 14.
- Attempts for this failure signature: 1 of 3.
- Focused authorization tests reject missing and shorter enclosing goal
  expirations.
- Launcher tests reject a launcher record extending beyond the enclosing goal
  and continue to exercise current-clock checks at host and acceptance time.
- A new exact head requires fresh strict-first review.
