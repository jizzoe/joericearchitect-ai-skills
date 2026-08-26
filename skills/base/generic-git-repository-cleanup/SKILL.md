---
name: generic-git-repository-cleanup
description: Audit a repository for delivered local branches/worktrees and out-of-scope dirty work, then apply only explicitly confirmed, freshly re-inspected retirement and commit actions.
---

# Generic Git Repository Cleanup

Use `ai-skills-runtime run generic-git-repository-cleanup` with the `audit`
operation to produce a read-only, deterministic classification into three lists:
retire-eligible branches/worktrees, plausible commit candidates, and unresolved
entries. Use the `plan-apply` operation to build the exact, confirmation-gated
command plan from an audit and an explicit selection, the `verify-plan` operation
immediately before any mutation to re-inspect the targets and stop on drift, and
the `build-receipt` operation to record a durable, non-sensitive receipt of the
plan and its outcomes. Present the plan for user confirmation before any
mutation; a previous audit or chat approval never authorizes a later apply.

Never rewrite history, force-remove a worktree, reset, stash, check out over, or
use `git clean`. Delete a remote branch only after confirming its changes are
merged into the remote default branch; otherwise leave the remote branch intact.
Re-run `verify-plan` immediately
before every individual mutation: re-audit the target, re-check the branch after
any worktree removal, and confirm the remote and push target only after a
successful commit. Retire clean non-primary worktrees before their local
branches; use non-forced local branch deletion when ancestry permits, and forced
deletion only with exact squash/rebase evidence and confirmation. Commit only
explicitly selected paths, and push only after a successful local commit and a
separate push-target check. Never commit or push spec-governed content (OpenSpec
changes/specs and governed skills, scripts, schemas, and workflow docs) directly
onto the default branch — route it through a topic branch/worktree; non-spec
files (design briefs, research, notes) may be committed directly to the default
branch. Discover protected-branch and validation policy from
repository configuration; never push to a protected branch. Detected or
uncertain secret-like content is blocked for human handling.

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
