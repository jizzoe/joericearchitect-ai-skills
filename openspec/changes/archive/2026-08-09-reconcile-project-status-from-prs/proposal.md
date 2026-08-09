## Why

OpenSpec lifecycle actions can already plan and audit issue Project status, and
PR linkage checks can verify issue/change references. Pull-request-driven
review state still needs deterministic reconciliation so the Project reflects
`In Progress` and `In Review` without exposing privileged Project credentials
to untrusted PR contexts.

## What Changes

- Add a `project-pr-status-sync` capability for PR event to Project status
  planning.
- Add a deterministic PR status planner and dry-run CLI.
- Add a read-only GitHub Actions workflow that audits PR lifecycle events
  without mutating Project state.
- Add canonical skill exposure for Claude and Codex wrappers.
- Add tests and evals for draft/opened, ready-for-review, converted-to-draft,
  merged, closed-unmerged, no-op, and untrusted PR contexts.

## Non-Goals

- Do not expose Project tokens to pull-request events.
- Do not replace closing keywords or built-in Project completion after merge.
- Do not require recursive issue, PR, or Project mutation events.
- Do not implement dependency-aware work selection; that belongs to M6-C1.

## Capabilities

### New Capabilities

- `project-pr-status-sync`: behavior for mapping trusted PR lifecycle events to
  Project status plans and audit-only outcomes.

### Modified Capabilities

- None.

## Impact

- Primary issue: https://github.com/jizzoe/joericearchitect-ai-skills/issues/41
- Roadmap parent: https://github.com/jizzoe/joericearchitect-ai-skills/issues/1
- Dependencies: M4-C2 and M5-C1 are complete.
- Affected users: maintainers and assistants using PR review state for OpenSpec
  SDD work.
- Affected assets: GitHub scripts, workflow audit, canonical skill wrappers,
  evals, and OpenSpec PR status sync documentation.
- Scope: deterministic planning and read-only workflow audit.
- Compatibility: existing PR linkage and OpenSpec validation workflows remain
  unchanged.
- Security: workflows use read-only permissions and avoid secrets or Project
  credentials in PR-triggered contexts.

## Reuse Plan

- Product-neutral behavior belongs in `scripts/github/lib/pr-status-sync.mjs`,
  the CLI, skill instructions, and eval fixtures.
- Product-specific values remain in `config/sdd-github.json`, issue links, PR
  payloads, and tracking files.
- Claude and Codex consume the same canonical skill through thin wrappers.
- Portability is evaluated with fixtures that avoid live Project item IDs or
  mutable GitHub state.
