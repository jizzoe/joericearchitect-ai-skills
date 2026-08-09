## 1. Planning and Review

- [x] 1.1 Create and link the M4-C2 issue and Project item.
  - Depends on: M4-C1
  - Evidence: issue #33 exists, parent roadmap #1 is linked, Project item exists, and status is `In Progress`.

- [x] 1.2 Complete planning artifacts and planning review.
  - Depends on: 1.1
  - Evidence: proposal, delta spec, design, tracking metadata, and task plan exist; `openspec validate add-openspec-github-lifecycle-sync --strict` passes; artifact-quality and tracking validation pass.

## 2. Lifecycle Synchronization Helpers

- [x] 2.1 Implement status resolution and transition planning.
  - Depends on: 1.2
  - Evidence: lifecycle helpers resolve configured Project field/status names and produce no-op or minimal update plans.

- [x] 2.2 Implement read-only lifecycle audit.
  - Depends on: 2.1
  - Evidence: audit reports matching state and drift without mutation.

- [x] 2.3 Implement explicit repair mode and CLI helpers.
  - Depends on: 2.2
  - Evidence: repair requires authorization, fails safely when fields are missing, and plans bounded status updates when authorized.

- [x] 2.4 Record historical backfill evidence.
  - Depends on: 2.2
  - Evidence: backfill report records prior foundation issue/Project convergence or explicit compatibility exceptions without rewriting archives.

## 3. Skills, Workflow, and Evals

- [x] 3.1 Add canonical OpenSpec GitHub sync skill.
  - Depends on: 2.3
  - Evidence: `skills/base/openspec-github-sync/SKILL.md` describes audit, dry-run, repair, authorization, and safety boundaries.

- [x] 3.2 Add Claude/Codex exposure and lifecycle workflow.
  - Depends on: 3.1
  - Evidence: assistant wrappers and `workflows/openspec-github-lifecycle/workflow.md` reference canonical helpers without duplicating implementation logic.

- [x] 3.3 Add deterministic lifecycle sync tests and evals.
  - Depends on: 2.4, 3.2
  - Evidence: tests/evals cover propose-to-Ready, apply-to-In Progress, no-op, drift, missing fields, missing authorization, repair, and backfill behavior.

## 4. Verification and Delivery

- [x] 4.1 Run full local verification and review.
  - Depends on: 3.3
  - Evidence: OpenSpec strict validation, artifact-quality validation, tracking validation, lifecycle sync tests/evals, prior focused suites, secret-pattern scan, portability review, attribution review, recovery review, and scope review pass.

- [x] 4.2 Complete formal OpenSpec Verify for M4-C2.
  - Depends on: 4.1
  - Evidence: verification report maps tasks, requirements, scenarios, design decisions, security controls, recovery paths, portability claims, and known limitations to current evidence.

- [ ] 4.3 Deliver, Sync, and Archive through separate authorized checkpoints.
  - Depends on: 4.2
  - Evidence: implementation PR closes issue #33 and reaches `Done`; Sync PR updates living specs; Archive PR preserves the completed change and active change list is empty.
