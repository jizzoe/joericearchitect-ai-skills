## Context

M5-C2 follows M4-C2 lifecycle sync and M5-C1 PR linkage validation. PRs can now
declare their issue and OpenSpec change linkage, but review state still needs a
bounded path to Project status convergence. The design must preserve security
and portability by keeping PR-triggered workflows read-only.

## Goals / Non-Goals

Goals:

- Map trusted PR lifecycle events to deterministic Project status plans.
- Keep draft/opened work `In Progress`.
- Move ready-for-review work to `In Review`.
- Move converted-to-draft or closed-unmerged work back to `In Progress`.
- Defer merged default-branch completion to closing keywords and built-in
  Project automation.
- Provide audit-only behavior for untrusted PR contexts.

Non-goals:

- No Project credential exposure to PR-triggered workflow code.
- No workflow-driven Project mutation in this change.
- No branch-protection or required-check configuration.
- No dependency-aware work selection.

## Decisions

### DEC-001: Separate planning from mutation

The planner returns `set-status`, `noop`, or `audit-only` results. The workflow
prints the result and does not mutate Project fields.

Rationale: PR events are an unsafe place to expose Project credentials, and
mutation can be performed only by separately authorized repair flows.

### DEC-002: Trust only same-repository `pull_request` events

The trust classifier rejects `pull_request_target` and cross-repository head
repos for mutation planning.

Rationale: untrusted PR contexts must not receive credentials or influence
privileged Project updates.

### DEC-003: Defer merged completion

Merged default-branch PRs return no direct status update.

Rationale: issue closing keywords and built-in Project completion should set
`Done` without a competing status write.

## Affected Files and Interfaces

- `scripts/github/lib/pr-status-sync.mjs`
- `scripts/github/reconcile-pr-project-status.mjs`
- `scripts/github/test/pr-status-sync.test.mjs`
- `.github/workflows/project-status-sync.yml`
- `skills/base/project-pr-status-sync/SKILL.md`
- `.claude/skills/project-pr-status-sync/SKILL.md`
- `.agents/skills/project-pr-status-sync/SKILL.md`
- `evals/workflows/project-pr-status-sync/`
- `openspec/changes/reconcile-project-status-from-prs/tracking.yaml`

## Verification Strategy

- Run OpenSpec strict validation.
- Run artifact-quality and tracking validation for this change.
- Run PR status sync tests and evals for draft/opened, ready, converted to
  draft, merged, closed-unmerged, untrusted, workflow permissions, and wrapper
  exposure.
- Run existing focused suites for intake, lifecycle, linkage, tracking,
  artifact-quality, and bounded-autonomous behavior.
- Run security and secret-pattern scans across workflows, scripts, skills,
  evals, and change artifacts.

## Attribution and Licensing

M5-C2 uses repository-authored YAML, Markdown, JSON, and dependency-free Node.js
code. No third-party runtime package or copied external implementation is added.

## Recovery

- Planner failures are deterministic and return structured errors for missing
  Project fields or status options.
- Workflow failures can be rerun after correcting config, payload shape, or
  observed Project metadata.
- Untrusted PR contexts recover by producing audit-only output rather than
  attempting mutation.
- Live Project mutation remains outside this workflow and requires separate
  authorization.

## Reuse Plan

- Canonical behavior: PR status planner, CLI, and base skill.
- Product configuration: repository owner/name, default branch, and status
  options stay in `config/sdd-github.json`.
- Claude/Codex exposure: wrappers point to canonical skill and scripts.
- Portability: workflow and evals avoid Project credentials and mutable item
  IDs.
