# Strict Review Correction: Parent Authorization Binding

Date: 2026-08-15

## Reviewed state

- Base: `8342a0da642d340fe506ddfb8200ec5427ff295b`.
- Reviewed head: `7a447880233bbe3f652a348e8071dbbcd61317a2`.
- Manifest:
  `2b93bed747c2e59172fa8a1ea4e2d2905361d87dfd8bb1ed67dc1321a8ba668f`.
- Strict review record:
  `strict-021f62ab-acd0-4ebe-aaaa-84a50dbdf42c`.
- Strict transport, canonical result validation, and owned-view cleanup: passed.

The validated strict result contained one bounded objective finding.

## Finding and disposition

- Finding: `IR-001` — lifecycle request preparation copied a caller-supplied
  parent request digest into the child request, but the lifecycle authorization
  record did not independently bind itself to that parent request.
- Failure signature:
  `independent-review/objective-fix/lifecycle-authorization-parent-binding/merge-pr`.
- Correction attempt: 1 of 3 for this signature.
- Disposition: `objective-fix`.

## Correction

The controller now seals the parent request first and derives one exact
lifecycle authorization whose `sourceRequestDigest` names that request. The
bound authorization is carried in the host request and retained beside the
prepared lifecycle request. Lifecycle preparation rejects an absent, malformed,
or mismatched authorization binding.

To avoid a recursive digest, the parent digest excludes only the lifecycle
authorization's self-referential `sourceRequestDigest`; host and acceptance
validation recompute the parent digest and independently require the excluded
field to equal it. A deterministic regression changes only that binding, proves
the parent digest remains stable, and proves the host rejects the request before
view creation. The focused recovery and lifecycle suites pass after the
correction.
The complete 262-test Node suite, all 26 strict OpenSpec validations,
adapter-drift validation, shared-guardrail validation, and whitespace review
also pass.

## Required rereview

This correction changes the repository head. Full Apply verification and a new
strict review are required; the failed result above cannot authorize delivery.
