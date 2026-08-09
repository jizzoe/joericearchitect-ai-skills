## Why

The repository now has GitHub intake configuration and versioned OpenSpec
tracking metadata, but assistants still need a deterministic local way to
create or reuse issues, render managed issue blocks, add Project membership,
and connect an issue to a new OpenSpec change without losing human-authored
content.

## What Changes

- Add a shared `gh` execution boundary that accepts argument arrays, supports
  dry runs, and returns structured JSON results.
- Add local issue helpers for duplicate search, create-or-find behavior, label
  operations, Project membership, and managed issue-block replacement.
- Add an issue-to-OpenSpec intake helper that creates conventional planning
  paths and tracking metadata in dry-run fixtures.
- Add canonical `github-issue-authoring` and `github-issue-to-openspec` skill
  assets plus thin Claude and Codex exposure.
- Add trigger, non-trigger, success, missing-information, duplicate, dry-run,
  and API-failure evals.

## Non-Goals

- Do not implement lifecycle status synchronization after Propose or Apply.
- Do not enforce PR linkage or CI checks.
- Do not use GitHub Actions to mutate remote state.
- Do not store credentials, mutable Project item IDs, field IDs, PR state, or
  timestamps.

## Capabilities

### New Capabilities

- `github-openspec-intake`: behavior for local GitHub issue authoring and
  issue-to-OpenSpec intake using configured repository and tracking contracts.

### Modified Capabilities

- None.

## Impact

- Primary issue: https://github.com/jizzoe/joericearchitect-ai-skills/issues/29
- Roadmap parent: https://github.com/jizzoe/joericearchitect-ai-skills/issues/1
- Dependencies: M2-C1 and M3-C2 are complete.
- Affected users: assistant sessions preparing GitHub-backed OpenSpec work.
- Affected assets: local GitHub scripts, canonical skills, assistant exposure,
  evals, and OpenSpec tracking conventions.
- Scope: local deterministic helpers and dry-run/test behavior; live mutation
  requires explicit authorization and `gh` availability.
- Compatibility: existing issue forms, Project status names, and tracking v1
  remain authoritative inputs.
- Security: commands pass arguments as arrays, never execute issue text as
  shell code, and support dry-run inspection before mutation.

## Reuse Plan

- Product-neutral behavior belongs in shared GitHub helper modules, managed
  block rendering, issue-to-change intake logic, skills, and evals.
- Product-specific values remain in `config/sdd-github.json`, tracking files,
  issue content, and command arguments.
- Claude and Codex consume the same canonical skill instructions and scripts
  through thin platform exposure.
- Portability is evaluated with injected configuration and fixtures rather than
  hard-coded repository, Project, branch, issue, or path values.
