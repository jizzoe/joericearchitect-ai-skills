## 1. Planning and proposal

- [x] 1.1 Confirm the expired controller identity, expiry, and active claim; run `ai-skills-runtime doctor`. Depends on: none. Evidence: controller.json inspection, doctor output.
- [x] 1.2 Complete proposal, design, tasks, issue linkage, and strict OpenSpec validation. Depends on: 1.1. Evidence: issue #203, `openspec validate --strict`.

## 2. Implementation (four capabilities)

- [x] 2.1 Add runtime-only installation mode with manifest/digest/contract verification, prior-runtime retention, and rollback. Depends on: 1.2. Evidence: focused tests.
- [x] 2.2 Complete installed-wrapper cleanup repair (worktree-before-branch, retain remote). Depends on: 1.2. Evidence: installed-wrapper integration tests.
- [x] 2.3 Complete host-context issue-intake handoff (current/matching/non-secret contrast evidence). Depends on: 1.2. Evidence: focused tests.
- [x] 2.4 Add receipt-backed expired-controller cancellation/retirement operation. Depends on: 1.2. Evidence: controller cancellation fixtures + tests.

## 3. Verification and delivery

- [ ] 3.1 Run focused + installation tests, strict validation, and local review. Depends on: 2.4. Evidence: test output, review record.
- [ ] 3.2 Deliver implementation, Sync, and Archive through distinct PRs. Depends on: 3.1. Evidence: PRs + delivered heads.

## 4. Recovery execution (after Archive)

- [ ] 4.1 Install the released runtime runtime-only (verify manifest/digest/contract, retain prior). Depends on: 3.2. Evidence: install receipt.
- [ ] 4.2 Invoke cancellation for the exact expired controller and verify the cancellation receipt + claim release. Depends on: 4.1. Evidence: cancellation receipt.
- [ ] 4.3 Run exact owned-resource cleanup of the cancelled controller's branch and worktree. Depends on: 4.2. Evidence: cleanup receipts.
- [ ] 4.4 Run planning-only M2-S1 Explore and finish with a Propose-ready design + single implementation authorization request. Depends on: 4.3. Evidence: M2-S1 Explore output.
