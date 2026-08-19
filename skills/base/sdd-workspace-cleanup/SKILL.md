---
name: sdd-workspace-cleanup
description: Audit, apply, or resume exact post-Archive cleanup of change-owned local SDD resources. Use only with current selected-entry ownership and delivery evidence.
---

# SDD Workspace Cleanup

Use `ai-skills-runtime run sdd-workspace-cleanup` to plan cleanup from durable
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
and bind every cleanup-relevant freshly inspected resource field; construct the
migrated record from that inspection rather than legacy values. An approval
flag, digest, or chat reference alone is not authorization. Resume from
recorded outcomes after partial execution.

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
