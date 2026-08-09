## Why

The repository can create linked issues and synchronize local lifecycle state,
but pull requests still rely on reviewers to notice missing issue links,
OpenSpec change references, tracking metadata, and corrective instructions.
M5-C1 adds advisory validation so PRs can prove linkage before later Project
reconciliation depends on PR events.

## What Changes

- Add a `github-pr-linkage` capability for PR contract and OpenSpec linkage
  validation.
- Add dependency-free validators for PR body contract, changed-path routing,
  tracking metadata, reciprocal links, and skill exposure drift.
- Add advisory GitHub workflows that run validation without Project credentials
  or write permissions.
- Add canonical `github-pr-linkage` skill with Claude and Codex wrappers.
- Add fixtures for valid PRs, missing issue links, missing change links,
  invalid tracking, untrusted fork context, and corrective output.

## Non-Goals

- Do not reconcile Project status from PR events.
- Do not require branch protection or mandatory checks.
- Do not expose Project tokens to pull-request code.
- Do not change lifecycle transition rules from M4-C2.

## Capabilities

### New Capabilities

- `github-pr-linkage`: behavior for advisory validation of PR issue linkage,
  OpenSpec change linkage, tracking metadata, reciprocal references, changed
  paths, and corrective instructions.

### Modified Capabilities

- None.

## Impact

- Primary issue: https://github.com/jizzoe/joericearchitect-ai-skills/issues/37
- Roadmap parent: https://github.com/jizzoe/joericearchitect-ai-skills/issues/1
- Dependencies: M4-C1 and M3-C2 are complete.
- Affected users: maintainers and assistants opening PRs for OpenSpec changes.
- Affected assets: validation scripts, advisory workflows, skills, evals, and
  OpenSpec PR linkage documentation.
- Scope: advisory validation only.
- Compatibility: existing PR template sections remain valid.
- Security: workflows use read-only permissions and do not require Project
  credentials for untrusted pull requests.

## Reuse Plan

- Product-neutral behavior belongs in validators, workflow structure, skill
  instructions, and fixtures.
- Product-specific values remain in PR bodies, tracking files, and config.
- Claude and Codex consume the same canonical skill and scripts through thin
  wrappers.
- Portability is evaluated with fixtures that avoid current Project item IDs or
  mutable PR state.
