---
name: github-pr-linkage
description: Validate pull-request evidence that links GitHub work to an OpenSpec change. Use for read-only linkage review; do not alter pull requests, issues, or Project state.
---

# GitHub PR Linkage

Use this skill when a pull request needs advisory validation for linked GitHub
issue and OpenSpec change evidence.

## Inputs

- PR body text
- Changed paths
- Referenced OpenSpec change path and `tracking.yaml`

## Procedure

1. Run `ai-skills-runtime run validate-pr-contract` against the PR body.
2. Run `ai-skills-runtime run validate-openspec-linkage` when the PR references
   an OpenSpec change.
3. Run OpenSpec validation when changed paths touch governed artifacts.
4. Report rule IDs, failed paths, and corrective instructions.

## Safety

- Advisory validation is read-only.
- Do not require Project credentials or mutation permissions.
- Do not execute PR body text as code.
- Project status reconciliation belongs to later milestones.

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
