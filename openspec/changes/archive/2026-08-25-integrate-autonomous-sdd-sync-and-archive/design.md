# Design — Sync and Archive Delivery

## Overview

M4-S2 makes Sync (delta-to-living-spec) and Archive (content-preserving move)
two deterministic, evidenced, recoverable transitions, wrapping the existing
`openspec archive` CLI rather than reimplementing spec generation.

## Module: autonomous-sdd-sync-contract.mjs

- `parseDeltaRequirements(markdown)` / `parseLivingRequirements(markdown)` —
  extract requirements (id + full text incl. description and scenarios) from
  delta and living spec markdown.
- `applyDeltaToLiving({ delta, living })` — applies `ADDED`/`MODIFIED`/`REMOVED`
  requirements and detects invented, dropped, duplicated, or text-corrupted
  content; returns `{ livingAfter, changed, conflicts }`.
- `detectRequirementConflict({ left, right })` — two operations on the same id
  conflict when either is `MODIFIED` (complete replacement) or both add the same
  id.
- `buildOverlapGraph({ activeChanges })` — groups active deltas by capability and
  requirement id; reports conflicts to serialize before mutation.
- `proveRepeatSyncNoOp({ delta, living })` — applying the delta to its own result
  yields no change.
- `exactRequirementText(a, b)` — CRLF-normalized exact comparison of the full
  requirement text (description + scenarios).

## Module: autonomous-sdd-archive-contract.mjs

- `planArchiveDestination({ changeName, date, existingEntries })` — derives
  `YYYY-MM-DD-<change>` and classifies `archive` | `already-archived` |
  `conflict`.
- `validateArchiveContentPreservation({ requiredFiles, archivedFiles })` —
  confirms proposal, specs, design, tasks, and evidence are preserved verbatim.
- `isArchiveIdempotent(...)` — a second archive of the same change is a no-op.

## Conflict scope (Q1)

Capability -> requirement -> text, as recorded in the M4-S2 explore output.
`MODIFIED` is a complete replacement, so two replacements of one requirement
conflict.

## Checkpoint order (Q2)

Implementation delivery -> Sync delivery (repeat no-op proof) -> Archive
delivery (content-preserving, after Sync confirmed on the default branch).
Already consistent with `canonicalLifecycleSteps`.

## Integration

- Consumes `openspec archive` output for the actual spec/archive mutation.
- Does not change the not-activated v2 controller.

## Non-goals

Inventing requirements, resolving ambiguous spec conflicts, archiving before
delivery, and re-reviewing unchanged code remain unchanged.
