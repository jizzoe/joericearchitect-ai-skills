# Unresolved Finding Disposition Gate Correction Evidence

## Failure and disposition

- Review record: `degraded-8bab692b-d15d-4beb-babd-59546bfcab90`.
- Reviewed head: `9b81ffb14601402e8ce7befd746c2c2575af57a1`.
- Reviewed manifest:
  `493894d723784d59cded35697975f141e2b69208b1c4bd50b1e6a6c3bb22a4d3`.
- Finding: `finding-disposition-allows-unresolved-delivery` (`high`).
- Disposition: `objective-fix`; the finding identifies a deterministic delivery-
  gate error and requires no product, architecture, security-posture, scope, or
  other owner judgment.
- Behavior-preserving: yes. The correction enforces the existing requirement
  that unresolved objective fixes stop delivery and that a corrected head must
  receive fresh exact-head review.

## Correction

Finding disposition validation now has an explicit severity/disposition
compatibility matrix. `blocker`, `high`, and `objective-fix` findings can route
only to a bounded objective correction or a human decision; they cannot be
relabelled as warnings or false positives. Warning and false-positive findings
retain their matching evidence-backed disposition paths, and every finding must
map to exactly one disposition.

An in-budget `objective-fix` disposition now returns the distinct
`objective-fix` classification with
`independent-review-objective-fix-required`. It never returns delivery-ready on
the reviewed head. The review state machine converts that outcome to
`correction-required`; after the correction changes the head, the existing
exact-head rule requires affected validation and a fresh strict-first review.
Human decisions and exhausted correction budgets still pause.

## Correction budget and verification

- Overall ordered correction chain: attempt 16.
- Attempts for this failure signature: 1 of 3.
- Focused finding-policy, v1 delivery-gate, and legacy review tests: 16 passed.
- Regression coverage proves a passed result with a high objective finding
  cannot authorize delivery, high/blocker findings cannot be relabelled as
  warning or false-positive, dispositions map exactly once, and an objective
  fix routes to correction rather than a conversational pause or delivery.
- The corrected commit and package require fresh exact-head strict-first
  review.
