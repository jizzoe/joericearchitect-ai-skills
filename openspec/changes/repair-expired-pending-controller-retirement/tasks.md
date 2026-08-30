## 1. Retirement contract and immutable evidence

- [x] 1.1 Define exact schemas and deterministic validation for the owner
  authorization and `pending-controller-retirement-receipt`, including
  checkpoint bytes, controller/v2 identities, provider binding, expiries, and
  explicit non-authority fields.
- [x] 1.2 Implement contained local-state inspection that accepts only the
  expired non-progressed pending baseline and proves the matching active and
  archived v2 identities are absent before atomically publishing an immutable,
  idempotent receipt.
- [x] 1.3 Add focused positive and negative tests for exact retirement,
  idempotency, unchanged checkpoint bytes, current/admitted/progressed records,
  identity or digest mismatch, unreadable state, and active/archive/projection
  conflicts.

## 2. Inventory and installed transition

- [x] 2.1 Extend reconciliation receipt inventory and legacy classification so
  only an exact valid pending-controller retirement receipt reclassifies its
  schema-5 checkpoint as compatible terminal; forged, unrelated, or future
  schema evidence remains ambiguous.
- [x] 2.2 Expose `retire-expired-pending-controller` through the canonical
  controller and manifest-declared installed runtime without a workspace
  fallback, and add runtime registry/completeness coverage.
- [ ] 2.3 Add a real Git-common integration test proving admission first pauses,
  the installed-shaped transition retires only the old pending checkpoint, and
  retry admits the new exact controller while preserving both checkpoint and
  receipt audit evidence.

## 3. Canonical lifecycle contract and portability

- [ ] 3.1 Update the canonical autonomous SDD lifecycle skill with the exact
  pending-retirement boundary, typed pauses, installed-runtime invocation, and
  prohibition on checkpoint deletion/editing or fabricated v2 evidence; keep
  Claude/Codex exposures thin.
- [ ] 3.2 Validate the reusable-skill contract and synthetic eval matrix for
  trigger/non-trigger behavior, missing or mismatched authority, untrusted
  input, sensitive-data exclusion, disallowed mutation, recovery instructions,
  adapter parity, and a second repository with different configured paths.
- [ ] 3.3 Confirm no product-specific path, repository, account, Project,
  credential, or external endpoint enters canonical reusable assets and record
  attribution/licensing as not applicable.

## 4. Verification and delivery

- [ ] 4.1 Run focused tests, full Node regression coverage, runtime build and
  installed completeness checks, strict change validation, and
  `openspec validate --all --strict`; record objective evidence.
- [ ] 4.2 Complete requirements mapping, local code/security review, formal
  OpenSpec Verify, exact-head CI, and strict independent review; correct and
  rerun affected evidence for every objective finding.
- [ ] 4.3 Deliver implementation, Sync, and Archive through separate linked
  pull requests; reconcile issue #274 and Project state; install the delivered
  runtime; publish the exact retirement receipt for the blocking checkpoint;
  and clean only exact confirmed-delivered owned resources.
