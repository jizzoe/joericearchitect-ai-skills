# Objective correction: Windows checkpoint relative format

Recorded: 2026-08-22

- Failure signature: `windows-checkpoint-relative-format-v1`
- Attempt: 1 of 3
- Source: PR #188 second exact-head `runtime (windows-latest)` check
- Symptom: persistence succeeded, but initializer admission returned
  `initializer-admission-context-invalid`; the other 66 Windows runtime tests
  passed.
- Root cause: controller records deliberately store the portable relative
  checkpoint `runs/<run-id>/controller.json`, while the new validator used
  platform-native `path.join`, producing backslashes on Windows.
- Correction: compare the durable contract value with `path.posix.join` and
  continue using native resolved paths only for actual filesystem access.
- Required rerun: focused initializer/admission suite, staged wrapper test,
  full local Node suite, strict OpenSpec, fresh local review, and exact-head
  Ubuntu/Windows runtime checks.
