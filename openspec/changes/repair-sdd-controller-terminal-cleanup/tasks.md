## 1. Repository-scoped controller state

- [x] 1.1 Add a validated repository-common-directory state-root resolver and atomic controller/receipt persistence that rejects path escape, symlink, and unavailable-state-root cases.
  - Depends on: none.
  - Evidence: controller state-root tests in `scripts/sdd/test/autonomous-sdd-controller.test.mjs`.
- [x] 1.2 Extend the versioned controller contract with append-only lifecycle resource registration, ownership tokens, recovery references, and terminal cleanup receipts while classifying earlier records as legacy/ineligible.
  - Depends on: 1.1.
  - Evidence: registration and receipt assertions in `scripts/sdd/test/autonomous-sdd-controller.test.mjs`.
- [x] 1.3 Add focused controller tests for containment, state-root durability after worktree removal, atomic receipt ordering, and resume after interruption.
  - Depends on: 1.1 and 1.2.
  - Evidence: `node --test scripts/sdd/test/autonomous-sdd-controller.test.mjs`.

## 2. Lifecycle resource and delivery evidence

- [x] 2.1 Route implementation, Sync, and Archive worktree/branch selection or creation through pre-creation resource registration.
  - Depends on: 1.1 and 1.2.
  - Evidence: lifecycle fixtures in `evals/workflows/autonomous-sdd-lifecycle/`.
- [x] 2.2 Record the exact per-resource pull-request, topic-head, and delivered default-branch-head binding when each lifecycle checkpoint merges.
  - Depends on: 2.1.
  - Evidence: independently delivered resource assertions in `scripts/sdd/test/sdd-workspace-cleanup.test.mjs`.
- [x] 2.3 Add lifecycle fixtures covering three separately squash-merged checkpoints, distinct delivery heads, missing registration, and unchanged standalone action boundaries.
  - Depends on: 2.2.
  - Evidence: `node --test evals/workflows/autonomous-sdd-lifecycle/run-fixtures.test.mjs`.

## 3. Exact cleanup and legacy migration

- [x] 3.1 Update cleanup planning and execution to consume independently bound resource records, persist started/completed outcomes outside target worktrees, and preserve existing least-destructive ordering.
  - Depends on: 1.2 and 2.2.
  - Evidence: cleanup execution assertions in `scripts/sdd/test/sdd-workspace-cleanup.test.mjs`.
- [x] 3.2 Add a separate owner-authorized, one-resource legacy migration path that requires fresh identity and delivery inspection and cannot delete a resource or expand to other legacy resources.
  - Depends on: 3.1.
  - Evidence: legacy migration refusal and acceptance tests in `scripts/sdd/test/sdd-workspace-cleanup.test.mjs`.
- [x] 3.3 Add cleanup tests for dirty controller checkpoints, incomplete terminal receipts, partial resume, earlier squash-delivered resources, and migration refusal/acceptance.
  - Depends on: 3.1 and 3.2.
  - Evidence: `node --test scripts/sdd/test/sdd-workspace-cleanup.test.mjs`.

## 4. Validation, review, and delivery

- [x] 4.1 Update canonical lifecycle and workspace-cleanup documentation plus thin adapter references to explain controller retention, resource evidence, migration authorization, and recovery without embedding product constants.
  - Depends on: 2.3 and 3.3.
  - Evidence: canonical `skills/base/` and `workflows/autonomous-sdd-lifecycle/` documentation diff and adapter-drift fixtures.
- [x] 4.2 Run focused controller, cleanup, lifecycle, portability, and adapter-drift validation; run `openspec validate --all --strict`; record evidence and conduct the required strict independent review before deliver, Sync, Archive, and cleanup.
  - Depends on: 4.1.
  - Evidence: `evidence/local-code-review.json`, 210 passing focused tests, and 30 passing strict OpenSpec validations; independent-review result required at the delivery gate.

## 5. Strict-review integration corrections

- [x] 5.1 Generate immutable run identities, derive controller checkpoint destinations from them, and reject cross-run checkpoint replacement.
  - Depends on: 1.1 and 1.2.
  - Evidence: controller collision and resume tests in `scripts/sdd/test/autonomous-sdd-controller.test.mjs`.
- [x] 5.2 Add executable controller transitions for durable resource registration, delivery binding, and receipt-coupled cleanup execution.
  - Depends on: 2.1, 2.2, 3.1, and 5.1.
  - Evidence: transition integration tests prove persisted registration, delivery binding, and cleanup receipt outcomes.
- [ ] 5.3 Rerun complete validation and strict isolated review after the correction head is committed.
  - Depends on: 5.1 and 5.2.
  - Evidence: complete validation and a passed strict-review record.
