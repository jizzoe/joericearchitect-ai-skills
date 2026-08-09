## 1. Planning and Review

- [x] 1.1 Create and link the M3-C1 issue and Project item.
  - Depends on: M1-C2
  - Evidence: issue #21 exists, parent roadmap #1 is linked, Project item exists, and status is `In Progress`.

- [x] 1.2 Complete planning artifacts and planning review.
  - Depends on: 1.1
  - Evidence: proposal, delta spec, design, and task plan exist; `openspec validate establish-openspec-quality-rules --strict` passes; scope remains M3-C1 only.

## 2. Rule Contract and Fixture

- [x] 2.1 Add machine-readable OpenSpec artifact quality rules.
  - Depends on: 1.2
  - Evidence: `quality/openspec-artifact-rules.json` defines proposal, spec, design, task, fixture, portability, and schema-sufficiency rules without credentials or product-specific mutable IDs.

- [x] 2.2 Add a representative compliant sample change fixture.
  - Depends on: 2.1
  - Evidence: `evals/openspec-artifact-quality/fixtures/sample-change/` contains proposal, design, tasks, and delta spec files demonstrating required sections and no GitHub mutation automation.

- [x] 2.3 Add invalid fixture cases for precise failures.
  - Depends on: 2.1
  - Evidence: invalid fixtures cover missing issue linkage, non-behavioral spec content, missing design recovery, and completed task without evidence.

## 3. Local Validation

- [x] 3.1 Implement dependency-free artifact quality validation.
  - Depends on: 2.1, 2.2, 2.3
  - Evidence: `scripts/validation/validate-openspec-artifacts.mjs` validates a supplied change directory and emits deterministic rule IDs, paths, and messages.

- [x] 3.2 Add deterministic validator tests.
  - Depends on: 3.1
  - Evidence: `scripts/validation/test/openspec-artifacts.test.mjs` proves the sample fixture passes and invalid fixtures fail with expected rule IDs.

- [x] 3.3 Validate M3-C1 artifacts and standard schema sufficiency.
  - Depends on: 3.2
  - Evidence: the validator passes against `openspec/changes/establish-openspec-quality-rules`; `openspec validate --all --strict` passes without custom schema changes.

## 4. Verification and Delivery

- [x] 4.1 Run full local verification and review.
  - Depends on: 3.3
  - Evidence: OpenSpec strict validation, validator tests, fixture checks, secret-pattern scan, portability review, attribution review, recovery review, and scope review pass.

- [x] 4.2 Complete formal OpenSpec Verify for M3-C1.
  - Depends on: 4.1
  - Evidence: verification report maps tasks, requirements, scenarios, design decisions, security controls, recovery paths, portability claims, and known limitations to current evidence.

- [x] 4.3 Deliver, Sync, and Archive through separate authorized checkpoints.
  - Depends on: 4.2
  - Evidence: implementation PR closes issue #21 and reaches `Done`; Sync PR updates living specs; Archive PR preserves the completed change and active change list is empty.
