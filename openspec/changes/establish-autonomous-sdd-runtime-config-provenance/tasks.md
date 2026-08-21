## 1. Configuration contract

- [ ] 1.1 Define the versioned runtime configuration schema, canonical resolver,
  redaction, precedence, and digest behavior with focused fixtures.
- [ ] 1.2 Extend v2 admission and domain records to persist the sealed snapshot
  provenance without credentials or absolute user paths.

## 2. Runtime behavior and quality

- [ ] 2.1 Expose the resolver through the declared runtime and document the
  source-authority and live-probe boundary.
- [ ] 2.2 Add conflict, unknown-field, unsafe-path, secret-shaped, stale-proof,
  portability, and no-reread regression tests.
- [ ] 2.3 Run focused and full tests, strict validation, same-session review,
  and OpenSpec Verify.
