# Correction disposition: drive-relative paths and review selection results

Disposition of strict review record `strict-44e1e15e-8075-4201-9726-7f49cfd2328d`:

- `F001` is corrected by rejecting every drive-prefixed Windows path, including
  drive-relative forms, in targets, scopes, and local sources; focused fixtures
  cover all three locations.
- `F002` is corrected by adding a closed `standardsSelection` result field to
  the base-code-review contract and validator. It carries selected rule IDs,
  scoped overrides, and not-applicable rule IDs, with empty arrays when that
  coverage is not requested; the canonical valid and invalid fixtures now bind
  the shape.

These bounded corrections require a fresh strict exact-head review before any
delivery operation.
