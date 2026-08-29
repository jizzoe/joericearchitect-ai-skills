## 1. Fix parsing

- [x] 1.1 Parse Codex subprocess stdout with `parseCodexReviewEventStream`.
- [x] 1.2 Update the focused adapter test to emit realistic JSONL.
  - Evidence: `node --test scripts/sdd/test/platform-review-adapters.test.mjs`
    -> 29 passed, 0 failed.

## 2. Delivery

- [x] 2.1 Deliver, merge (PR #269), sync, archive, reconcile issue/Project state.
