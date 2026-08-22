# Objective correction: Windows controller directory fsync

Recorded: 2026-08-22

- Failure signature: `windows-controller-directory-fsync-v1`
- Attempt: 1 of 3
- Source: PR #188 exact-head `runtime (windows-latest)` check
- Symptom: the staged real Git-common initializer returned
  `controller-record-persist-failed`; the other 66 Windows runtime tests passed.
- Root cause: after file `fsync` and atomic rename, controller persistence used
  `fs.openSync(directory, "r")` for directory `fsync`. Node rejects opening a
  directory this way on Windows.
- Correction: skip only that unsupported directory open/fsync on `win32`;
  retain checkpoint file `fsync`, atomic rename, POSIX directory `fsync`, and
  the validated provider's directory-metadata durability requirement.
- Required rerun: focused initializer/admission suite, staged wrapper test,
  full local Node suite, strict OpenSpec, fresh local review, and exact-head
  Ubuntu/Windows runtime checks.
