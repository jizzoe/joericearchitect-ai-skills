## Why

The delivered M1-S3 bootstrap-cleanup attachment correctly plans two exact,
eligible worktree removals, then incorrectly blocks both at final execution
with `fresh-resource-mismatch`. The final comparison retains a historical
`exists: true` field on the stored migration record while omitting that field
from the newly inspected resource, so it rejects identical safe resources and
leaves the original M1-S3 run unable to terminalize.

## What Changes

- Normalize the stored resource and fresh inspection consistently for the
  final receipt-backed cleanup comparison; existence remains an explicit
  eligibility condition, not an accidental structural difference.
- Add a regression test proving a signed, exact bootstrap worktree migration
  with `exists: true` can receive a started/completed receipt and be removed
  after fresh inspection, while a real field mismatch remains blocked.
- Add the observed runtime-only activation and cleanup pause to the
  plain-English blocker handoff, including its permanent-repair assessment and
  safe resume path.
- Preserve the existing narrow boundary: no new v2 run or claim, no work-unit
  rewrite, no remote branch deletion, no unsafe Sync-branch cleanup, and no
  global-skill update.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. This repair restores the existing `sdd-workspace-cleanup` requirement
that an exactly recorded and freshly eligible worktree can be removed with a
receipt; it does not change externally specified behavior. `skip_specs: true`
is set for that reason.

## Impact

- `scripts/sdd/sdd-workspace-cleanup.mjs` final fresh-resource comparison.
- Focused controller/cleanup regression tests and runtime build verification.
- `ai-planning/handoff-docs/autonomous-sdd-blocker-register-and-plain-english-handoff.md`.
- The already active M1-S3 attachment may resume only after this repair is
  delivered and its released runtime is activated; no current legacy resource
  is removed by planning work.

## Reuse Plan

The normalization belongs in the reusable cleanup helper and is reached by the
existing thin controller runtime wrapper. Product-specific M1-S3 IDs, paths,
signatures, GitHub records, and retention reason remain runtime input and local
evidence rather than reusable constants.
