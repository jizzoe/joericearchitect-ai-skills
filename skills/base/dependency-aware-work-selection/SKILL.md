---
name: dependency-aware-work-selection
description: Classify OpenSpec SDD work and recommend the next dependency-valid change from explicit repository evidence. Use for planning or triage; do not use it to switch changes or mutate GitHub state without authorization.
---

# Dependency-Aware Work Selection

Use this skill to classify OpenSpec SDD work and recommend the next change from
dependency, status, priority, sequence, and shared-resource evidence.

Canonical scripts:

- `scripts/github/lib/dependencies.mjs`
- `ai-skills-runtime run project-status`
- `ai-skills-runtime run select-next-work`
- `ai-skills-runtime run dependency-report`

The skill is read-only. It reports in-flight, actionable, blocked, parallel,
and next work and never switches changes without an explicit target.

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
