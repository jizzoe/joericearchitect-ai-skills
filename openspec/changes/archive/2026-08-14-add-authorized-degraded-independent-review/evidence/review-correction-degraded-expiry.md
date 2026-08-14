# Review Correction: Degraded Authorization Expiry

Status: corrected; fresh exact-head review required

Failure signature: `independent-review/high/degraded-review-expiry-toctou/merge-pr`

Correction attempt: 1 of 3

Reviewed head: `dbe7b2832827a3833e86ee427d1772eeb818a631`

Review record: `degraded-74431c25-e1fd-4d4d-9e16-37e73912c111`

Finding: `degraded-review-expiry-toctou` (`high`). The shared direct degraded-
review execution path validated authorization before awaiting the reviewer but
did not repeat the live expiration check after the reviewer returned.

Human decision: the owner explicitly authorized a behavior-preserving fix,
affected checks, a new commit, and fresh exact-head strict-first review while
retaining all existing scope, risk exceptions, expiration, and safety controls.

Disposition: `objective-fix`. The execution path now repeats the exact
authorization validation with a fresh runtime clock after invocation and before
result acceptance. A deterministic regression test advances the clock to the
expiration boundary during review and requires
`degraded-independent-review-authorization-expired`.

The corrected head and sealed manifest are resolved after this evidence and the
code change are committed; that new head invalidates the review record above
and requires a fresh strict-first review.
