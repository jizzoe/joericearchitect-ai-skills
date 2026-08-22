# Objective correction: initializer context predicate

Recorded: 2026-08-22

- Failure signature: `initializer-admission-context-object-predicate-missing`
- Attempt: 1 of 3
- Source: focused domain and staged-runtime reruns after the direct-admission
  boundary correction
- Finding: the new initializer-only entrypoint referenced an object predicate
  that was not defined in the admission module; its fail-closed catch returned
  `initializer-admission-context-invalid` for valid initialization.
- Correction: use the module-local inline non-null, object, non-array shape
  check.
- Required rerun: focused admission suite and staged installed-wrapper critical
  flow, followed by the broader suite after both pass.
