# Strict Review Correction: Trusted Candidate Resolution

Date: 2026-08-15

## Reviewed state

- Base: `8342a0da642d340fe506ddfb8200ec5427ff295b`.
- Reviewed head: `440e4e9aa533dc9117f28c3ff7737ab49867c4b3`.
- Manifest:
  `8c23c25d1bb928968ba30d9aa21844e931aeffe8c77ced773f5f5beda97fafb8`.
- Strict review record:
  `strict-07fd11a9-1c59-4df1-b33d-81f88c0fdba1`.
- Strict transport, canonical result validation, and owned-view cleanup: passed.

The validated strict result contained one bounded objective finding.

## Finding and disposition

- Finding: `IR-001` — executable resolution selected the first existing fixed
  installation candidate before completing its trust validation, so an invalid
  higher-priority candidate could mask a valid trusted candidate later in the
  allowlist.
- Failure signature:
  `independent-review/objective-fix/fixed-candidate-short-circuit/merge-pr`.
- Correction attempt: 1 of 3 for this signature.
- Disposition: `objective-fix`.

## Correction

The resolver now evaluates every fixed candidate in order through canonical
root containment, executable type and access, mutation denial, path identity,
content hashing, platform trust, and post-trust identity revalidation. A
missing or invalid candidate is skipped; the first candidate that completes
the entire validation chain is selected. Caller-supplied executable paths
remain ineligible.

A deterministic regression supplies an existing invalid candidate followed by
a valid candidate and proves the resolver selects the latter. The focused
adapter suite passes after the correction.

## Required rereview

This correction changes the repository head. Full Apply verification and a new
strict review are required; the failed result above cannot authorize delivery.
