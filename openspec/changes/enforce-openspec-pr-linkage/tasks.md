## 1. Planning and Review

- [x] 1.1 Create and link the M5-C1 issue and Project item.
  - Depends on: M4-C1, M3-C2
  - Evidence: issue #37 exists, parent roadmap #1 is linked, Project item exists, and status is `In Progress`.

- [x] 1.2 Complete planning artifacts and planning review.
  - Depends on: 1.1
  - Evidence: proposal, delta spec, design, tracking metadata, and task plan exist; `openspec validate enforce-openspec-pr-linkage --strict` passes; artifact-quality and tracking validation pass.

## 2. PR Linkage Validation

- [x] 2.1 Implement PR contract validation.
  - Depends on: 1.2
  - Evidence: validator accepts PR body and changed paths, detects issue/change references, and emits corrective instructions.

- [x] 2.2 Implement OpenSpec linkage validation.
  - Depends on: 2.1
  - Evidence: validator checks change path, tracking metadata, reciprocal issue match, and changed-path routing.

- [x] 2.3 Add advisory GitHub workflows.
  - Depends on: 2.2
  - Evidence: workflows run OpenSpec/linkage validation with read-only permissions and no Project token.

## 3. Skills and Evals

- [x] 3.1 Add canonical PR linkage skill and assistant wrappers.
  - Depends on: 2.3
  - Evidence: base skill and Claude/Codex wrappers reference canonical validators.

- [x] 3.2 Add deterministic PR linkage tests and evals.
  - Depends on: 3.1
  - Evidence: tests/evals cover valid PRs, missing issue, missing change, invalid tracking, path routing, workflow permission safety, and corrective instructions.

## 4. Verification and Delivery

- [x] 4.1 Run full local verification and review.
  - Depends on: 3.2
  - Evidence: OpenSpec strict validation, artifact-quality validation, tracking validation, PR linkage tests/evals, prior focused suites, secret-pattern scan, portability review, attribution review, recovery review, and scope review pass.

- [x] 4.2 Complete formal OpenSpec Verify for M5-C1.
  - Depends on: 4.1
  - Evidence: verification report maps tasks, requirements, scenarios, design decisions, security controls, recovery paths, portability claims, and known limitations to current evidence.

- [ ] 4.3 Deliver, Sync, and Archive through separate authorized checkpoints.
  - Depends on: 4.2
  - Evidence: implementation PR closes issue #37 and reaches `Done`; Sync PR updates living specs; Archive PR preserves the completed change and active change list is empty.
