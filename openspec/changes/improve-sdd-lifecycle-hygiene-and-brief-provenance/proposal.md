## Why

Archived OpenSpec changes currently lose their accepted design-brief association,
and local branch/worktree listings can misrepresent squash-delivered history as
active work. Operators need a bounded, read-only way to distinguish delivery
state from ancestry and to retain selected brief provenance without guessing or
deleting anything.

## What Changes

- Add a reusable lifecycle-hygiene capability that captures an explicitly
  selected design brief as immutable, change-local provenance at proposal time.
- Add deterministic related-brief discovery that offers at most three choices
  and supports an explicit no-choice outcome; autonomous runs do not infer a
  source brief.
- Add a read-only reconciliation report that combines local Git, OpenSpec
  archive/spec evidence, and GitHub PR lookup when available, while clearly
  reporting a local-only evidence gap when it is not.
- Add visible Archive cleanup reporting that can recommend exact clean,
  delivered resources but never deletes, rewrites history, or backfills
  ownership.
- Provide validation fixtures, deterministic tests, and thin Claude/Codex
  exposure for the canonical repository-neutral workflow.

## Capabilities

### New Capabilities

- `sdd-lifecycle-hygiene`: safe design-brief provenance capture, lifecycle
  reconciliation, and non-mutating Archive cleanup reporting for OpenSpec SDD
  changes.

### Modified Capabilities

- `sdd-lifecycle`: require visible hygiene reporting at Archive completion
  without weakening the existing exact-owned cleanup safeguards.

## Impact

Affected assets include a new canonical base skill and deterministic SDD
scripts/tests, OpenSpec lifecycle documentation, generated assistant exposure,
and the `sdd-lifecycle` living specification. The convention is additive:
historical archives are not rewritten, briefs remain optional, and no GitHub
or Git mutation is introduced by reconciliation or reporting.
