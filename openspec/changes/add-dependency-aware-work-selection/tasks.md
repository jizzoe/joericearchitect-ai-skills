## 1. Planning and Review

- [x] 1.1 Create and link the M6-C1 issue and Project item.
  - Depends on: M5-C2
  - Evidence: issue #45 exists, Project item exists, and status is `In Progress`.

- [x] 1.2 Complete planning artifacts and planning review.
  - Depends on: 1.1
  - Evidence: proposal, delta spec, design, tracking metadata, and task plan exist.

## 2. Dependency-Aware Selection

- [x] 2.1 Implement dependency classification and cycle detection.
  - Depends on: 1.2
  - Evidence: dependency library classifies in-flight, actionable, blocked, cycles, and parallel candidates.

- [x] 2.2 Implement read-only status, next, and dependency reporting CLIs.
  - Depends on: 2.1
  - Evidence: CLIs consume fixture-shaped queue JSON and emit deterministic JSON reports.

- [x] 2.3 Implement explicit switch support.
  - Depends on: 2.2
  - Evidence: selector accepts explicit change and does not rely on recency.

## 3. Skills and Evals

- [x] 3.1 Add workflow reference and canonical skill wrappers.
  - Depends on: 2.3
  - Evidence: workflow reference, base skill, and Claude/Codex wrappers reference canonical scripts.

- [x] 3.2 Add deterministic tests and evals.
  - Depends on: 3.1
  - Evidence: tests/evals cover cycles, unresolved blockers, priority, sequence, parallel candidates, explicit switching, and M6/M7 foundation queue selection.

## 4. Verification and Delivery

- [x] 4.1 Run full local verification and review.
  - Depends on: 3.2
  - Evidence: OpenSpec strict validation, artifact-quality validation, tracking validation, tests/evals, read-only review, portability review, and scope review pass.

- [x] 4.2 Complete formal OpenSpec Verify for M6-C1.
  - Depends on: 4.1
  - Evidence: verification report maps tasks, requirements, scenarios, design decisions, security controls, recovery paths, portability claims, and known limitations to current evidence.

- [ ] 4.3 Deliver, Sync, and Archive through separate authorized checkpoints.
  - Depends on: 4.2
  - Evidence: implementation PR closes issue #45 and reaches `Done`; Sync PR updates living specs; Archive PR preserves the completed change and active change list is empty.
