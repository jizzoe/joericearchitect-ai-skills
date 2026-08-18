# Correction disposition: selection precedence and consumer binding

Disposition of strict review record `strict-21f1b9b5-5c09-4558-a8b5-6dcfb2bfaa54`:

- `verification-result-cannot-report-standards-selection` is corrected by
  requiring the closed `standardsSelection` result field for verification and
  by adding a valid populated verification fixture.
- `standards-precedence-is-not-validated` is corrected by validating the
  declared repository-selected, required, recommended, and not-applicable
  classification order and by adding a misordered-record fixture.
- `review-selection-can-claim-unvalidated-rules` is corrected by validating
  review and verification reports against the supplied validated selection
  record. Rule identifiers, duplicate entries, override rule/scope pairs, and
  not-applicable classifications must exactly match that record.

The exact current head must receive a fresh strict isolated review before any
delivery transition.
