---
name: sdd-workspace-cleanup
description: Audit, apply, or resume exact post-Archive cleanup of change-owned local SDD resources. Use only with current selected-entry ownership and delivery evidence.
---

# SDD Workspace Cleanup

Use `scripts/sdd/sdd-workspace-cleanup.mjs` to plan cleanup from durable
selected-entry records. Audit first; apply only exact eligible worktree and
local-branch actions after Archive, delivery, issue, and configured Project
evidence are current.

Never infer ownership, touch legacy or dirty resources, remove a primary or
locked worktree, delete remote branches, reset content, or widen the selected
entry. Resume from recorded outcomes after partial execution.

## Guardrails

See [Shared guardrails](../_shared/guardrails.md).
