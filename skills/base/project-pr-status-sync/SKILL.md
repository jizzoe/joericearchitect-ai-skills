---
name: project-pr-status-sync
description: Plan or audit configured GitHub Project status changes from pull-request lifecycle events. Use for trusted status reconciliation; do not expose Project credentials or mutate untrusted pull-request workflows.
---

# Project PR Status Sync

Use this skill when reconciling GitHub Project status from pull request
lifecycle events for OpenSpec SDD work.

## Canonical Inputs

- Repository configuration: `config/sdd-github.json`
- Planner: `scripts/github/lib/pr-status-sync.mjs`
- CLI: `ai-skills-runtime run reconcile-pr-project-status`
- Workflow: `.github/workflows/project-status-sync.yml`

## Required Behavior

- Draft/opened or reopened PRs keep the linked issue `In Progress`.
- `ready_for_review` moves the linked issue to `In Review`.
- `converted_to_draft` moves the linked issue back to `In Progress`.
- Merged default-branch PRs defer to closing keywords and built-in Project
  completion behavior.
- Closed-unmerged PRs plan a return to `In Progress`, or emit an audit-only
  result when mutation is not trusted.
- Untrusted pull request contexts must not expose Project credentials or mutate
  Project state.

## Verification

Run:

```bash
node --test scripts/github/test/pr-status-sync.test.mjs evals/workflows/project-pr-status-sync/run-fixtures.test.mjs
```

## Shared runtime

Shared helpers are invoked through the installed launcher, never through a
path in the active workspace:

```
ai-skills-runtime run <helper> [verb] --repository <absolute-target-repository> [-- <helper args>]
```

Required runtime contract version: 1. The launcher validates the runtime, the
declared helper and verb, and the mechanical shape of the target repository. It
makes no authorization decision, and a missing, incompatible, or drifted runtime
is a classified pause rather than a workspace fallback. Run
`ai-skills-runtime doctor` once per session to detect skill and runtime drift.

## Guardrails

See [Shared guardrails](../_shared/guardrails.md).
