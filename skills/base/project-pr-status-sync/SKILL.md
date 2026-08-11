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
- CLI: `scripts/github/reconcile-pr-project-status.mjs`
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
