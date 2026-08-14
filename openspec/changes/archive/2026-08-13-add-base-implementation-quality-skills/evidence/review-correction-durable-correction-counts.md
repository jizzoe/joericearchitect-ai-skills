# Strict Review Correction: Durable Correction Counts

Date: 2026-08-13

## Reviewed state

- Base: `019ce930cbc5b8dc99fff7cd53e08738b0ac871b`
- Reviewed head: `debc8d16bc424be7bbfdf57a34ee7fc1b5afd1df`
- Manifest:
  `421d671a310061411c38346b1aa774f099423c76626768ab6a133f3bfd57b8b5`
- Review record: `codex-review-421d671a31006141`
- Result validation and detached-view cleanup: passed.

The validated result contained one high finding. Under the owner's continuing
authorization, it is a behavior-preserving objective fix and requires no
product, architecture, security-risk, governance, credential, or other human
decision.

## Correction

Failure signature:
`independent-review/high/authorization-trusts-caller-correction-count/merge-pr`

Correction attempt: 1 of 3 for this signature.

Disposition: `objective-fix`.

Objective-correction authorization validates the selected entry's durable,
ordered correction records and derives the aggregate and named-signature counts
from them. Caller counts are required only as an exact consistency assertion;
missing, malformed, mismatched, or non-durable history fails closed.

## Correction verification

- Focused durable-count and forged-count authorization regressions: 29 passed,
  0 failed.
- Complete Node test suite: 192 passed, 0 failed.
- Metadata, shared-guardrail, adapter-drift, tracking, and artifact-quality
  validation: passed.
- Selected-change and repository-wide strict OpenSpec validation: 22 items
  passed, 0 failed.
- Whitespace and changed-path secret-pattern checks: passed.

A fresh sealed strict review remains required for the corrected exact head.
