## Context

M4-C2 follows M4-C1 issue intake. The repository has local GitHub helpers and
tracking metadata, but no deterministic way to audit or repair lifecycle state
between OpenSpec actions and GitHub Project status.

The design must preserve these boundaries:

- Tracking metadata identifies the linked issue and repository.
- Config identifies Project/status names.
- Read-only audit never mutates GitHub.
- Repair mode mutates only when explicitly requested and authorized.
- Later M5 work owns PR linkage and PR-driven reconciliation.

## Goals / Non-Goals

Goals:

- Resolve Project/status fields from configured names and injected state.
- Plan lifecycle transitions idempotently.
- Audit linked OpenSpec/GitHub state without mutation.
- Provide explicit repair plans and fixture execution.
- Expose canonical sync skill and lifecycle workflow docs to Claude and Codex.

Non-goals:

- No PR enforcement.
- No GitHub Actions mutation.
- No branch protection or required status checks.
- No schema changes to tracking v1.

## Decisions

### DEC-001: Model lifecycle transitions as named local rules

The lifecycle maps `propose-reviewed` to `Ready` and `apply-started` to
`In Progress` in data-driven local rules.

Rationale: M5 can add PR transitions later without changing the audit model.

### DEC-002: Separate audit from repair

Audit reports observed and expected state. Repair requires an explicit mode and
authorization flag before planning mutation.

Rationale: read-only checks must stay safe in review contexts.

### DEC-003: Use injected Project state for deterministic tests

Tests provide issue, Project item, field, and status state as fixtures instead
of calling GitHub.

Rationale: fixture validation is repeatable and avoids accidental external
mutation.

## Affected Files and Interfaces

- `scripts/github/lib/lifecycle.mjs`
- `scripts/github/set-project-status.mjs`
- `scripts/github/audit-lifecycle.mjs`
- `scripts/github/test/lifecycle-sync.test.mjs`
- `skills/base/openspec-github-sync/SKILL.md`
- `.claude/skills/openspec-github-sync/SKILL.md`
- `.agents/skills/openspec-github-sync/SKILL.md`
- `workflows/openspec-github-lifecycle/workflow.md`
- `evals/workflows/openspec-github-lifecycle/`
- `openspec/changes/add-openspec-github-lifecycle-sync/tracking.yaml`

## Verification Strategy

- Run `openspec validate add-openspec-github-lifecycle-sync --strict`.
- Run `openspec validate --all --strict`.
- Run artifact-quality and tracking validation for this change.
- Run lifecycle sync tests for status resolution, idempotent transitions,
  missing fields, missing authorization, read-only audit, repair plans, and
  backfill fixtures.
- Run existing GitHub intake, tracking, artifact-quality, and autonomous
  lifecycle tests.
- Run security and secret-pattern scans across scripts, skills, workflows,
  evals, and change artifacts.

## Attribution and Licensing

M4-C2 uses repository-authored Markdown, JSON, and dependency-free Node.js code.
No third-party runtime package or copied external implementation is added.

## Recovery

- Audit can be rerun safely without mutation.
- Repair plans are idempotent and no-op when observed state already matches
  expected state.
- Missing Project fields or authorization return structured failures before any
  mutation is planned.
- Backfill evidence records prior foundation changes without rewriting their
  archive content.

## Reuse Plan

- Canonical behavior: lifecycle module, scripts, workflow, and base skill.
- Product configuration: Project owner/number/status names and tracking issue
  links are supplied through config and tracking files.
- Claude/Codex exposure: wrappers reference canonical assets.
- Portability: fixtures use injected state so other repositories can reuse the
  same lifecycle rules with different status names and issue URLs.
