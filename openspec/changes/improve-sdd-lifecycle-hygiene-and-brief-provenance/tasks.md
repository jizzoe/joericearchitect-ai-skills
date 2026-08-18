## 1. Provenance and reconciliation core

- [x] 1.1 Implement a portable lifecycle-hygiene module with safe
  workspace-relative brief validation, atomic immutable sidecar capture, and
  deterministic candidate ranking. Depends on: proposal/design/specs.
- [x] 1.2 Implement normalized read-only reconciliation and exact cleanup
  recommendation reporting with explicit local-only GitHub evidence gaps.
- [x] 1.3 Add deterministic Node tests for capture success/failure,
  no-choice/autonomous selection behavior, squash-delivery classification,
  dirty-resource protection, and second-workspace portability.

## 2. Reusable assistant surface

- [x] 2.1 Add the canonical `sdd-lifecycle-hygiene` base skill that routes to
  the module and preserves the read-only/explicit-cleanup boundary.
- [x] 2.2 Add thin Claude and Codex adapters and extend base-skill contract
  coverage to verify canonical linkage. Depends on: 2.1.

## 3. Lifecycle integration and documentation

- [x] 3.1 Add lifecycle documentation for optional brief provenance,
  deterministic no-choice behavior, local-only reporting, and visible Archive
  hygiene reports.
- [x] 3.2 Add a strict-validation fixture proving the supplemental context
  layout is compatible and update applicable validation coverage. Depends on:
  1.1.

## 4. Evidence and delivery readiness

- [x] 4.1 Run focused tests, strict OpenSpec validation, requirements mapping,
  security/secret review, portability review, and documentation review.
- [x] 4.2 Perform bounded same-session local code review; correct any scoped
  objective findings and rerun affected evidence. Depends on: 4.1.
