## 1. Planning and Review

- [x] 1.1 Create and link the M4-C1 issue and Project item.
  - Depends on: M2-C1, M3-C2
  - Evidence: issue #29 exists, parent roadmap #1 is linked, Project item exists, and status is `In Progress`.

- [x] 1.2 Complete planning artifacts and planning review.
  - Depends on: 1.1
  - Evidence: proposal, delta spec, design, tracking metadata, and task plan exist; `openspec validate add-github-openspec-intake --strict` passes; artifact-quality and tracking validation pass.

## 2. GitHub Intake Helpers

- [x] 2.1 Implement shared `gh` execution boundary.
  - Depends on: 1.2
  - Evidence: `scripts/github/lib/gh.mjs` supports argument-array execution, dry runs, JSON parsing, and structured failures.

- [x] 2.2 Implement issue create-or-find and managed block helpers.
  - Depends on: 2.1
  - Evidence: issue helpers search by exact title, plan/create issues with configured labels, and replace only marker-bounded issue-block content.

- [x] 2.3 Implement Project operation helpers.
  - Depends on: 2.1
  - Evidence: Project helpers plan add/status operations from configured Project owner, number, field, and status names.

- [x] 2.4 Implement issue-to-OpenSpec intake helper.
  - Depends on: 2.2, 2.3, M3-C2
  - Evidence: fixture output includes conventional OpenSpec paths, managed issue block content, and valid tracking metadata.

## 3. Skills and Evals

- [x] 3.1 Add canonical GitHub issue authoring and issue-to-OpenSpec skills.
  - Depends on: 2.4
  - Evidence: `skills/base/github-issue-authoring/SKILL.md` and `skills/base/github-issue-to-openspec/SKILL.md` describe triggers, inputs, dry-run behavior, and safety boundaries.

- [x] 3.2 Add Claude and Codex skill exposure.
  - Depends on: 3.1
  - Evidence: `.claude/skills/` and `.agents/skills/` wrappers point to canonical skills and scripts without duplicating implementation logic.

- [x] 3.3 Add deterministic GitHub intake tests and evals.
  - Depends on: 2.4, 3.2
  - Evidence: tests/evals cover trigger, non-trigger, success, duplicate, missing-information, dry-run, managed-block preservation, Project operation plans, issue-to-OpenSpec output, and API failure cases.

## 4. Verification and Delivery

- [x] 4.1 Run full local verification and review.
  - Depends on: 3.3
  - Evidence: OpenSpec strict validation, artifact-quality validation, tracking validation, GitHub intake tests/evals, skill exposure checks, secret-pattern scan, portability review, attribution review, recovery review, and scope review pass.

- [x] 4.2 Complete formal OpenSpec Verify for M4-C1.
  - Depends on: 4.1
  - Evidence: verification report maps tasks, requirements, scenarios, design decisions, security controls, recovery paths, portability claims, and known limitations to current evidence.

- [x] 4.3 Deliver, Sync, and Archive through separate authorized checkpoints.
  - Depends on: 4.2
  - Evidence: implementation PR closes issue #29 and reaches `Done`; Sync PR updates living specs; Archive PR preserves the completed change and active change list is empty.
