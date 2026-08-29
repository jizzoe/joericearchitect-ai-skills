## 1. Reconciliation contract

- [x] 1.1 Extend `inventoryLegacyRecords` so a validated reconciliation receipt
  re-classifies a schema-5 `ambiguous` entry as `compatible-terminal`.
  - Evidence: `scripts/sdd/test/autonomous-sdd-legacy-reconciliation.test.mjs`
    verifies schema-5 receipt reconciliation and confirms a forged receipt
    cannot reconcile a future schema.
- [x] 1.2 Confirm the reconciliation transition accepts and validates an
  owner-authorized binding for a schema-5 checkpoint with matching archive
  evidence, and publishes the immutable receipt.
  - Evidence: `reconcileLegacyBootstrapRecord` now inspects the configured v2
    archive, validates the terminalization/cancellation bundle and exact
    controller identity, rejects generic delivery evidence, and publishes a
    schema-2 `legacy-reconciliation-receipt` bound to the controller `runId`.

## 2. Regression coverage

- [x] 2.1 Add tests for terminalized-but-stale and cancelled-but-stale checkpoints
  (reconcile to compatible-terminal with a valid binding; remain ambiguous when
  the binding is missing, expired, or identity-mismatched).
  - Evidence: focused reconciliation tests construct and validate real
    terminalized and cancelled archives, exercise missing and mismatched archive
    state, reject generic delivery evidence and future schemas, and preserve the
    checkpoint bytes.

## 3. Validation, review, and delivery

- [x] 3.1 Run focused tests and `openspec validate --all --strict`.
  - Evidence: `node --test scripts/sdd/test/*.test.mjs` → 410 passed, 0 failed;
    strict OpenSpec validation rerun after the correction.
- [x] 3.2 Complete code/security review and formal Verify.
  - Evidence: bounded review of all five changed paths found and corrected
    symlink traversal, incomplete schema-5 topology validation, an unnecessary
    schema 1–4 output-shape change, and permissive receipt fields. Strict review
    then found an unvalidated parent child list; the correction preserves the
    canonical empty admitted parent while rejecting nonempty archive drift.
    Both delta-spec scenarios map to passing focused tests and the final full
    suite passes.
- [ ] 3.3 Deliver, Sync, Archive, reconcile issue/Project state, and remove only
  exact clean change-owned branches/worktrees.
