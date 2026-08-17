---
name: sdd-workspace-cleanup
description: Audit, apply, or resume exact post-Archive cleanup of change-owned local SDD resources. Use only with current selected-entry ownership and delivery evidence.
---

# SDD Workspace Cleanup

Use `scripts/sdd/sdd-workspace-cleanup.mjs` to plan cleanup from durable
selected-entry records. Audit first; apply only exact eligible worktree and
local-branch actions after Archive, delivery, issue, and configured Project
evidence are current. Each resource needs its own registered pull-request and
delivery binding; persist cleanup receipts outside target worktrees before any
destructive local action.

Never infer ownership, touch legacy or dirty resources, remove a primary or
locked worktree, delete remote branches, reset content, or widen the selected
entry. A legacy resource may be considered only after a separate exact
owner-authorized migration and fresh inspection. A migration authorization must
be an exact signed owner record verified against a controlled trusted-owner key
and bind the inspected resource's kind, identity, head, ownership/recovery
tokens, and delivery evidence; an approval flag, digest, or chat reference
alone is not authorization. Resume from recorded outcomes after partial
execution.

## Guardrails

See [Shared guardrails](../_shared/guardrails.md).
