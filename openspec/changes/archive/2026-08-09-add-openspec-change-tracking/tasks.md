## 1. Planning and Review

- [x] 1.1 Create and link the M3-C2 issue and Project item.
  - Depends on: M3-C1
  - Evidence: issue #25 exists, parent roadmap #1 is linked, Project item exists, and status is `In Progress`.

- [x] 1.2 Complete planning artifacts and planning review.
  - Depends on: 1.1
  - Evidence: proposal, delta spec, design, and task plan exist; `openspec validate add-openspec-change-tracking --strict` passes; scope remains M3-C2 only.

## 2. Tracking Contract

- [x] 2.1 Define tracking schema version 1.
  - Depends on: 1.2
  - Evidence: `schemas/openspec-tracking-v1.schema.json` documents required fields, allowed value types, implementation repositories, and forbidden mutable or secret state.

- [x] 2.2 Add valid and invalid tracking fixtures.
  - Depends on: 2.1
  - Evidence: fixtures cover valid, missing-field, invalid-type, unknown-field, mismatched-change, unsafe-field, and multi-repository cases.

- [x] 2.3 Add this change's tracking metadata.
  - Depends on: 2.1
  - Evidence: `openspec/changes/add-openspec-change-tracking/tracking.yaml` validates and links issue #25 without credentials or mutable runtime IDs.

## 3. Validation and Helpers

- [x] 3.1 Implement tracking parser, validator, normalizer, and helpers.
  - Depends on: 2.1, 2.2
  - Evidence: `scripts/validation/lib/tracking.mjs` validates required fields, preserves unknown safe fields during updates, rejects unsafe fields, and normalizes linkage.

- [x] 3.2 Implement the read-only validation CLI.
  - Depends on: 3.1
  - Evidence: `scripts/validation/validate-tracking.mjs` supports human-readable and JSON output, exits nonzero on invalid input, and does not mutate files.

- [x] 3.3 Add deterministic tracking tests.
  - Depends on: 3.1, 3.2
  - Evidence: `scripts/validation/test/tracking.test.mjs` covers valid, invalid, update-preservation, JSON, and multi-repository scenarios.

- [x] 3.4 Validate historical compatibility.
  - Depends on: 3.3
  - Evidence: compatibility report records pre-M3-C2 archived changes that lack tracking metadata and validates any tracked current changes.

## 4. Verification and Delivery

- [x] 4.1 Run full local verification and review.
  - Depends on: 3.4
  - Evidence: OpenSpec strict validation, tracking tests, artifact-quality validation, secret-pattern scan, portability review, attribution review, recovery review, and scope review pass.

- [x] 4.2 Complete formal OpenSpec Verify for M3-C2.
  - Depends on: 4.1
  - Evidence: verification report maps tasks, requirements, scenarios, design decisions, security controls, recovery paths, portability claims, and known limitations to current evidence.

- [x] 4.3 Deliver, Sync, and Archive through separate authorized checkpoints.
  - Depends on: 4.2
  - Evidence: implementation PR closes issue #25 and reaches `Done`; Sync PR updates living specs; Archive PR preserves the completed change and active change list is empty.
