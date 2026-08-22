# Failing-first test evidence

Recorded: 2026-08-22

Command:

```text
node --test --test-reporter=spec scripts/sdd/test/autonomous-sdd-admission.test.mjs
```

Result: 15 tests, 13 passed, 2 failed. The two failures were the intended
pre-fix symptoms:

- `legacy directory inventory ignores non-controller JSON and keeps unknown
  controller schemas ambiguous` received `ambiguous` instead of `compatible`
  after placing a non-controller `initializer-request.json` under the legacy
  root.
- `controller initialization persists exact pending context before admitting
  and resumes only its matching v2 run` received `valid: false` after the
  initializer persisted its schema-5 controller checkpoint inside the real
  Git-common legacy directory.

The genuine unknown-controller and caller-selected exclusion assertions are
also present in the focused suite. The latter already failed closed before the
implementation change, preserving the non-bypass baseline.
