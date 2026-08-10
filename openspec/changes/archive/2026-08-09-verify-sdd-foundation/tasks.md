## 1. Planning and Review

- [x] 1.1 Create and link the M7-C1 issue and Project item.
  - Depends on: M2-C1, M3-C1, M3-C2, M4-C1, M4-C2, M5-C1, M5-C2, M6-C1
  - Evidence: issue #49 exists, Project item exists, and status is `In Progress`.

- [x] 1.2 Complete planning artifacts and planning review.
  - Depends on: 1.1
  - Evidence: proposal, delta spec, design, tracking metadata, and task plan exist.

## 2. Foundation Verification Assets

- [x] 2.1 Add non-mutating multi-repository product fixture.
  - Depends on: 1.2
  - Evidence: mobile-bookkeeping multi-repository fixture exists under `evals/fixtures/products/`.

- [x] 2.2 Add foundation baseline tests.
  - Depends on: 2.1
  - Evidence: tests inspect living specs, canonical skills, workflow trust boundaries, and global asset portability.

- [x] 2.3 Add operation, recovery, token rotation, notices, and agent guidance.
  - Depends on: 2.2
  - Evidence: `docs/sdd-foundation-operations.md`, `AGENTS.md`, and `THIRD_PARTY_NOTICES.md` exist.

## 3. Verification and Delivery

- [x] 3.1 Run full local verification and review.
  - Depends on: 2.3
  - Evidence: OpenSpec strict validation, artifact-quality validation, tracking validation, foundation baseline tests, focused suite, security review, portability review, and scope review pass.

- [x] 3.2 Complete formal OpenSpec Verify for M7-C1.
  - Depends on: 3.1
  - Evidence: verification report maps requirements, scenarios, design decisions, security controls, recovery paths, portability claims, known limitations, and remaining governance decisions to evidence.

- [x] 3.3 Deliver, Sync, and Archive through separate authorized checkpoints.
  - Depends on: 3.2
  - Evidence: implementation PR closes issue #49 and reaches `Done`; Sync PR updates living specs; Archive PR preserves the completed change and active change list is empty.
