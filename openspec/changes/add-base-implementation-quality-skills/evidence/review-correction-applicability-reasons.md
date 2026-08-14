# Strict Review Correction: Applicability Reasons

Date: 2026-08-13

## Reviewed state

- Base: `019ce930cbc5b8dc99fff7cd53e08738b0ac871b`
- Reviewed head: `6d5b989a86f079d71f989dcca72858e7bb84f791`
- Manifest:
  `387caba7128cc36d5c70e57f1cb361cec03771596cf5b51f8ea9e59f7669d3a3`
- Review record: `codex-review-387caba7128cc36d`
- Result validation and detached-view cleanup: passed.

The validated result contained one objective-fix finding. Under the owner's
continuing authorization, it is a behavior-preserving correction and requires
no product, architecture, security-risk, governance, credential, or other human
decision.

## Correction

Failure signature:
`independent-review/objective-fix/required-check-not-applicable-without-reason/merge-pr`

Correction attempt: 1 of 3 for this signature.

Disposition: `objective-fix`.

Every selected check with a `not-applicable` result now requires a non-empty
reason tied to explicit scope, and the reason is rejected for other results. A
check derived as applicable from the delivery profile and UI scope must pass;
supplying a reason cannot bypass that minimum. Genuinely out-of-scope optional
evidence may remain explicitly not applicable with a current binding and reason.

## Correction verification

- Focused applicability regressions: 21 passed, 0 failed.
- Complete Node test suite: 189 passed, 0 failed.
- Metadata, shared-guardrail, adapter-drift, tracking, and artifact-quality
  validation: passed.
- Selected-change and repository-wide strict OpenSpec validation: 22 items
  passed, 0 failed.
- Whitespace and changed-path secret-pattern checks: passed.

A fresh sealed strict review remains required for the corrected exact head.
