## Why

The exact M1-S3 bootstrap run now has delivered implementation, Sync, Archive,
repair, closed-issue, and Project-Done evidence, but it predates lifecycle
resource registration. Its signed, freshly inspected legacy-resource
migrations cannot be attached to its durable run state, so the controller
correctly returns `controller-cleanup-resources-missing` and the terminalizer
cannot truthfully release the claim.

## What Changes

- Add an exact bootstrap-only migration-attachment path that accepts only
  owner-signed, freshly matching legacy resources for a named existing run.
- Persist migrated resources and receipt-backed cleanup outcomes outside each
  removable worktree, without editing the admitted work unit or creating a
  new run or claim.
- Require the M1-S3 compatibility terminalizer to verify the persisted cleanup
  attachment before it accepts `cleanupCompleted`.
- Remove only migrated, clean, non-primary worktrees first; require a fresh,
  separately signed branch migration after each dependent worktree is gone.
- Retain resources with nonmatching delivery evidence, including the M1-S3
  Sync branch whose current head no longer matches PR #167.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `autonomous-sdd-continuation`: attach exact, signed legacy-resource
  migrations to one existing bootstrap run and persist receipt-coupled cleanup.
- `sdd-workspace-cleanup`: stage migrated worktree and branch cleanup without
  inferring ownership or widening from a signed resource record.
- `autonomous-sdd-v2-terminalization`: require the exact persisted cleanup
  attachment before an exceptional bootstrap run can terminalize.

## Impact

The repair affects the controller, cleanup helpers, terminalization checks,
runtime entrypoints, focused tests, the three living specifications, and the
plain-English blocker handoff. It is product-local at invocation: the M1-S3
IDs, signed records, paths, GitHub PRs, and unsafe retained Sync branch remain
runtime input or local evidence rather than reusable constants. No credential,
remote-branch deletion, new v2 run, new claim, or mutation of the original
admission record is introduced.
