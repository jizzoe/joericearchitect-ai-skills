## Why

`sdd-workspace-cleanup` protects completed, change-owned SDD resources and
intentionally treats historical or unregistered resources as inventory-only.
General repository hygiene — merged branches and worktrees that predate the
durable SDD record, and uncommitted work outside an active OpenSpec change — has
no owner. A repository can remain confusing or dirty even when no OpenSpec
lifecycle action is active.

## What Changes

- Add one reusable, interactive generic Git-cleanup capability with a read-only
  `audit` phase and a separately confirmation-gated `apply` phase.
- The audit produces three explicit lists: (1) delivered, inactive branches and
  worktrees eligible to retire; (2) working-tree changes outside active change
  scope that are plausible commit candidates; and (3) resources and files for
  which safe disposition cannot be determined.
- Compose the existing Git inspection, topic-branch, commit-authoring, and SDD
  lifecycle evidence capabilities rather than replacing them.

## Capabilities

### New Capabilities

- `generic-git-repository-cleanup`: Interactive audit plus confirmation-gated
  apply for delivered local branches/worktrees and out-of-scope dirty work.

### Modified Capabilities

- None.

## Impact

- New canonical skill under `skills/base/generic-git-repository-cleanup/`, its
  thin Claude and Codex discovery adapters, a runtime helper and its focused
  tests, and fixtures for squash-merge delivery and dirty/ambiguous resources.
- Primary issue: https://github.com/jizzoe/joericearchitect-ai-skills/issues/243.
- No remote branches are deleted, no history is rewritten, and no `git clean`,
  reset, stash, or checkout-over is used.

## Reuse Plan

The capability composes the existing `git-change-inspection`,
`git-topic-branch-management`, `dirty-worktree-to-topic-branch`,
`git-commit-authoring`, and `git-topic-branch-cleanup` capabilities. Repository
policy, default branch, remote, validation commands, active-change location, and
protected-branch rules come from inspected local configuration or explicit user
input, never reusable skill constants.
