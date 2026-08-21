## 1. Exact bootstrap attachment contract

- [x] 1.1 Define and validate an immutable, expiry-bound bootstrap cleanup
  attachment that binds only an existing run, compatibility archive head,
  signed migration result, and retained-resource classification.
- [x] 1.2 Add an executable controller transition that attaches only a fresh,
  signed migration result to the named existing run without creating or
  rewriting v2 admission or claim state.

## 2. Receipt-backed staged cleanup

- [x] 2.1 Extend the controller cleanup transition to consume an exact
  bootstrap attachment, persist receipts outside target worktrees, and remove
  eligible worktrees before branches.
- [x] 2.2 Require a separately fresh branch migration after its worktree is
  gone; retain nonmatching or otherwise ineligible resources with a durable
  typed reason.

## 3. Truthful terminalization and regression coverage

- [x] 3.1 Require bootstrap-compatible terminalization to verify the persisted
  cleanup attachment and receipts rather than accept a caller-only cleanup
  flag.
- [x] 3.2 Add focused positive, stale, mismatch, retained-resource,
  no-new-run-or-claim, interrupted-cleanup, and normal-run regression tests.

## 4. Evidence and delivery readiness

- [x] 4.1 Add the repair tracking metadata and update the plain-English
  blocker handoff with the exact pause, temporary versus permanent analysis,
  signed-migration recovery evidence, and retained Sync branch.
- [x] 4.2 Run focused tests, full runtime suite, strict OpenSpec validation,
  same-session local review, formal Verify, and a synthetic portability
  fixture before delivery.
