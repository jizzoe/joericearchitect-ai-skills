# Strict Review Correction: Per-Signature Correction Budget

Date: 2026-08-13

## Reviewed state

- Base: `019ce930cbc5b8dc99fff7cd53e08738b0ac871b`
- Reviewed head: `fb6fc57ec7641f970331c3feb113e008c2f11f5b`
- Manifest:
  `d5d191d95f95af52ada4d6b4fea99d7cb48a0b5d6d7d46630463c329285b7e3e`
- Review record: `codex-review-fb6fc57ec764-20260814T004448Z`
- Result validation and detached-view cleanup: passed.

The validated result contained one objective-fix finding. Under the owner's
continuing authorization, it is a behavior-preserving correction and requires
no product, architecture, security-risk, governance, credential, or other human
decision.

## Correction

Failure signature:
`independent-review/objective-fix/correction-budget-wrong-counter/merge-pr`

Correction attempt: 1 of 3 for this signature.

Disposition: `objective-fix`.

The shared local-implementation operation checker now requires the failure
signature and its non-negative attempt count for every objective correction.
An optional aggregate count must be a valid integer no lower than the named
signature count. The fixed three-attempt ceiling is enforced against the named
signature, not unrelated corrections.

## Correction verification

- Focused verification and operation-authorization regressions: 26 passed, 0
  failed.
- Complete Node test suite: 189 passed, 0 failed.
- Metadata, shared-guardrail, adapter-drift, tracking, and artifact-quality
  validation: passed.
- Selected-change and repository-wide strict OpenSpec validation: 22 items
  passed, 0 failed.
- Whitespace and changed-path secret-pattern checks: passed.

A fresh sealed strict review remains required for the corrected exact head.
