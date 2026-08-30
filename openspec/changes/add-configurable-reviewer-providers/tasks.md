## 1. Registry and resolver

- [x] 1.1 Add `config/reviewer-providers.json` with the two known adapters.
- [x] 1.2 Add `scripts/sdd/reviewer-providers.mjs` (validate, load, resolve, default path).

## 2. Tests and validation

- [x] 2.1 Add focused tests (validate, resolve, load, default path).
  - Evidence: `node --test scripts/sdd/test/reviewer-providers.test.mjs` → 5 passed, 0 failed.

## 3. Delivery

- [ ] 3.1 Deliver, Sync, Archive, reconcile issue/Project state, and remove only
  exact clean change-owned branches/worktrees.
