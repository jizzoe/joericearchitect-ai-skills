# Independent review correction: owner decisions and time validation

- Review record: `strict-f68ed1e9-0eee-4b4f-9e34-2f9c93416d9e`
- Reviewed head: `d661d16c3bf61e0ea794340db366b5b7f9ccaba3`
- Manifest digest: `07c49db23c833cdfd1a02fb6c61e876172549900d4464fce00df010db45b2aaf`
- Assurance: `strict-isolated`; canonical result validation and cleanup passed
- Correction attempt: 1 of 3 for each failure signature

## Confirmed owner-decision evidence

- Failure signature: `independent-review/high/F-001/merge-pr`
- Disposition: objective fix
- Correction: `ownerDecisionConfirmed` is no longer sufficient. Confirmation
  requires a named owner, nonempty decisions, non-future approval time, and a
  SHA-256 bound to the owner, decisions, and recommendation. Invalid evidence
  pauses, while absent confirmation remains visibly pending.

## Fail-closed clock validation

- Failure signature: `independent-review/objective-fix/F-002/merge-pr`
- Disposition: objective fix
- Correction: design-decision approvals, approved-design evidence, and
  proposed delivery preapprovals reject a supplied current time whose parse is
  not finite before performing future-date or expiration comparisons.
