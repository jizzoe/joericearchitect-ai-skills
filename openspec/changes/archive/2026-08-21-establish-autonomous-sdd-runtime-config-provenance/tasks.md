## 1. Configuration contract

- [x] 1.1 Define the versioned runtime configuration schema, canonical resolver,
  redaction, precedence, and digest behavior with focused fixtures.
- [x] 1.2 Extend v2 admission and domain records to persist the sealed snapshot
  provenance without credentials or absolute user paths.

## 2. Runtime behavior and quality

- [x] 2.1 Expose the resolver through the declared runtime and document the
  source-authority and live-probe boundary.
- [x] 2.2 Add conflict, unknown-field, unsafe-path, secret-shaped, stale-proof,
  portability, and no-reread regression tests.
- [x] 2.3 Run focused and full tests, strict validation, same-session review,
  and OpenSpec Verify.
