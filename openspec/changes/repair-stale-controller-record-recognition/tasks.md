## 1. Reconciliation contract

- [x] 1.1 Extend `inventoryLegacyRecords` so a validated reconciliation receipt
  re-classifies a schema-5 `ambiguous` entry as `compatible-terminal`.
  - Evidence: `scripts/sdd/test/autonomous-sdd-legacy-reconciliation.test.mjs`
    "schema-5 stale checkpoint reconciles to compatible-terminal via a receipt
    and stays ambiguous otherwise" passes.
- [x] 1.2 Confirm the reconciliation transition accepts and validates an
  owner-authorized binding for a schema-5 checkpoint with matching archive
  evidence, and publishes the immutable receipt.
  - Evidence: `reconcileLegacyBootstrapRecord` already handles non-terminal
    schema-5 records (verified; no code change required) and publishes a
    `legacy-reconciliation-receipt` with `v2Authority/nativeClaim/legacyMutation`
    all `false`.

## 2. Regression coverage

- [x] 2.1 Add tests for terminalized-but-stale and cancelled-but-stale checkpoints
  (reconcile to compatible-terminal with a valid binding; remain ambiguous when
  the binding is missing, expired, or identity-mismatched).
  - Evidence: new schema-5 regression test passes; cancelled-but-stale path is
    already covered by `validTerminalV2Controller` (verified-terminal).

## 3. Validation, review, and delivery

- [x] 3.1 Run focused tests and `openspec validate --all --strict`.
  - Evidence: `node --test scripts/sdd/test/*.test.mjs` → 409 passed, 0 failed;
    `openspec validate --all --strict` → 49 passed, 0 failed.
- [ ] 3.2 Complete code/security review and formal Verify.
- [ ] 3.3 Deliver, Sync, Archive, reconcile issue/Project state, and remove only
  exact clean change-owned branches/worktrees.
