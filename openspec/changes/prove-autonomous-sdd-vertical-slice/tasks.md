## 1. Vertical-slice foundation

- [x] 1.1 Scaffold the assistant-neutral vertical-slice module and change-local
  config; register the disposable `add-typescript-javascript-review` fixture
  directory.
- [x] 1.2 Implement the pure next-transition selector that reads the M1-S2
  operation registry and returns one transition or a typed pause, with no I/O.
- [x] 1.3 Add selector fixtures covering single-reachable-transition, unknown
  operation, stage/target conflict, and typed pause. Depends on: 1.2.

## 2. Ephemeral store and executor

- [x] 2.1 Implement the minimal ephemeral store (run identity, stage, attempts,
  transitions) with a disposable snapshot and no durable history, projection,
  claim, or takeover. Depends on: 1.1.
- [x] 2.2 Implement the write-ahead executor (prepared → in-flight →
  observed/committed/in-doubt) with single-run ownership token and
  observe-before-retry. Depends on: 2.1.
- [x] 2.3 Add executor/store tests for restart, stale-owner, receipt-loss, and
  no-real-controller-write. Depends on: 2.2.

## 3. Simulated adapters and fixture template

- [x] 3.1 Implement the simulated, non-mutating Propose, planning-conformance,
  Apply, and Verify adapters over the fixture template. Depends on: 2.2.
- [x] 3.2 Add the `add-typescript-javascript-review` fixture manifest
  (proposal/design/tasks shape and verification commands). Depends on: 1.1.
- [x] 3.3 Add adapter tests for non-mutation, capability-scoped input, and
  unknown/malformed outcome pause. Depends on: 3.1, 3.2.

## 4. Thin sealed review loop and role/context manifests

- [x] 4.1 Implement the thin sealed review loop wrapping the existing
  independent-review and verification skills, with fresh-review-on-change
  invalidation. Depends on: 3.1.
- [x] 4.2 Add role/context manifests for planner, implementer, verification
  worker, independent reviewer, and controller mapped to `skills/base/*`
  skills. Depends on: 1.1.
- [x] 4.3 Add review-invalidation tests for unchanged reuse, changed-binding
  fresh review, and reviewer-never-fixes. Depends on: 4.1.

## 5. Dual-profile proof and typed pauses

- [x] 5.1 Wire `production` and `prototype` profiles through the same fixture
  with their distinct approval requirements. Depends on: 3.1, 4.1.
- [x] 5.2 Add typed-pause tests for restart, stale-owner, exhausted-budget, and
  malformed-outcome. Depends on: 5.1.
- [x] 5.3 Add the requirement-to-test map, injected clock, and
  property/symmetry tests for the selector and review-invalidation rules.
  Depends on: 5.1.

## 6. Validation, documentation, and evidence

- [x] 6.1 Run the focused vertical-slice suite, `openspec validate
  prove-autonomous-sdd-vertical-slice --strict`, and `openspec validate --all
  --strict`. Depends on: 5.2, 5.3.
- [ ] 6.2 Record completion evidence and update the M2-S1 brief status to
  delivered; keep the result contract-only/audit and do not activate real
  ownership. Depends on: 6.1.
