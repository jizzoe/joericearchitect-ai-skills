## 1. Registry and resolver

- [x] 1.1 Add `config/reviewer-providers.json` with the two known adapters.
- [x] 1.2 Add `scripts/sdd/reviewer-providers.mjs` (validate, load, resolve, default path).

## 2. Tests and validation

- [x] 2.1 Add focused tests (validate, resolve, load, default path).
  - Evidence: `node --test scripts/sdd/test/reviewer-providers.test.mjs` → 5 passed, 0 failed.

## 3. Delivery

- [x] 3.1 Deliver, Sync, Archive, reconcile issue/Project state, and remove only
  exact clean change-owned branches/worktrees.
  - Evidence: implementation PR #265 merged as `c2d7174c0efe4393356c47d547d932148488c9fe`; Sync PR #272 merged as `96b765a03e64d7814c4a5702ded6da073f8c23ae`; issue #264 is closed and its Project 1 item is `Done`; exact-head strict review `strict-2dd5cede-9312-4195-bb37-6589f5c6766e` passed with no findings.
