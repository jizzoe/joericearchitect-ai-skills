---
name: sdd-lifecycle-hygiene
description: Capture optional SDD design-brief provenance and produce read-only lifecycle reconciliation and cleanup recommendations.
---

# SDD Lifecycle Hygiene

Use `ai-skills-runtime run sdd-lifecycle-hygiene` for optional design-brief capture
and non-mutating lifecycle reconciliation. Capture only an explicitly selected
in-workspace Markdown brief; preserve the copied brief and digest-bound sidecar
through Archive. When no source is supplied, offer at most three deterministic
candidates in interactive work and accept no selection. Autonomous delivery
must not infer a source brief.

Reconciliation is read-only. It may use GitHub pull-request evidence when
available and must label local-only evidence gaps when it is not. It can
recommend exact clean, delivered resources, but `sdd-workspace-cleanup` remains
the only path for separately authorized removal. Never delete, reset, rewrite,
backfill ownership, expose credentials, or treat a branch name or ancestry as
delivery proof.

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
