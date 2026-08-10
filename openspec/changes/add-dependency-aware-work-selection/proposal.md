## Why

The SDD foundation can now intake, track, validate, deliver, sync, and archive
OpenSpec work. Assistants still need deterministic navigation across multiple
changes so they can report current, blocked, actionable, parallel, and next work
without relying on recency or implicit selection.

## What Changes

- Add a `dependency-aware-work-selection` capability.
- Add read-only dependency classification and next-work selection scripts.
- Add dependency cycle, unresolved blocker, priority/sequence, and shared
  resource conflict handling.
- Add workflow reference and canonical skill wrappers for status, next,
  switch, and dependency reporting.
- Add deterministic tests and evals for the foundation queue.

## Non-Goals

- Do not mutate GitHub Project fields from selection commands.
- Do not silently switch active changes.
- Do not replace native GitHub issue dependency relationships.
- Do not perform final M7 foundation verification.

## Capabilities

### New Capabilities

- `dependency-aware-work-selection`: behavior for read-only work
  classification, dependency validation, parallel candidate reporting, and
  deterministic next-work selection.

### Modified Capabilities

- None.

## Impact

- Primary issue: https://github.com/jizzoe/joericearchitect-ai-skills/issues/45
- Roadmap parent: https://github.com/jizzoe/joericearchitect-ai-skills/issues/1
- Dependencies: M5-C2 is complete.
- Affected users: maintainers and assistants selecting OpenSpec SDD work.
- Affected assets: GitHub scripts, lifecycle workflow reference, skill wrappers,
  eval fixtures, and OpenSpec dependency-aware selection documentation.
- Scope: read-only planning and reporting.
- Compatibility: existing lifecycle, PR linkage, and Project status scripts
  remain unchanged.
- Security: commands do not use secrets, write GitHub data, or mutate local
  artifacts.

## Reuse Plan

- Product-neutral logic belongs in `scripts/github/lib/dependencies.mjs`.
- Product-specific queue evidence remains in JSON inputs, Project fields, and
  OpenSpec tracking artifacts.
- Claude and Codex consume the same canonical skill through wrappers.
- Portability is evaluated with fixture queues rather than live GitHub state.

