# Correction disposition: selection-record shape

Disposition of strict review record `strict-f7134521-0624-48f4-b15f-e37e7a4a2f7c`:

- `F001` is corrected by requiring nonempty identifier-only
  `expectedEvidence` and a `gaps` array.
- `F002` is corrected by closed allowlists for every nested object and tests
  covering rejected nested command-like fields.
- `F003` is corrected by requiring a workspace-relative `scope` on each rule,
  documenting the shape, and covering missing scope.

These are behavior-preserving fail-closed validation corrections within the
change scope. The affected focused fixtures and strict OpenSpec validation must
pass before a fresh exact-head strict review.
