---
name: sdd-lifecycle-hygiene
description: Capture optional SDD design-brief provenance and produce read-only lifecycle reconciliation and cleanup recommendations.
---

# SDD Lifecycle Hygiene

Use `scripts/sdd/sdd-lifecycle-hygiene.mjs` for optional design-brief capture
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

## Guardrails

See [Shared guardrails](../_shared/guardrails.md).
