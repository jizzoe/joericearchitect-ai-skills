# Correction disposition: consumer result and CLI failures

Disposition of strict review record `strict-02dd1adc-5125-41fd-8a36-efd6b5b72a06`:

- `IR-001` is corrected by requiring verification results to report selected
  rule IDs, scoped overrides, not-applicable classifications, and evidence gaps.
- `IR-002` is corrected by converting unreadable or malformed CLI input into
  the deterministic `invalid-input` result, with fixtures for both paths.

These bounded corrections require a fresh strict exact-head review before any
delivery operation.
