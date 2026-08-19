## 1. Shared guidance and adapter contract

- [x] 1.1 Add the root one-line `CLAUDE.md` import and normalize each
  repository-owned Claude/Codex discovery adapter to state the documented
  no-policy-duplication contract.
- [x] 1.2 Replace the fixed adapter inventory with deterministic canonical
  package discovery and precise failures for missing adapters, missing canonical
  references, and non-thin adapters.
- [x] 1.3 Document the canonical catalog boundary, thin-adapter contract, and
  explicit exclusion of OpenSpec-generated assets.

## 2. Regression coverage

- [x] 2.1 Add focused fixtures for a newly added canonical package, a missing
  platform adapter, and an adapter that violates the no-policy-duplication
  contract.
- [x] 2.2 Run focused adapter-drift and relevant lifecycle validation tests.

## 3. Verification evidence

- [x] 3.1 Map every delta requirement scenario to current implementation and
  test evidence, run a bounded local review, and run formal OpenSpec Verify.
- [x] 3.2 Run `openspec validate --all --strict`, inspect the final diff for
  scope and secrets, and record the local delivery evidence required before an
  external transition.
