# SDD controller terminal-cleanup recovery

## Problem and desired outcome

An autonomous SDD run can complete implementation delivery, Sync, Archive,
issue closure, and Project `Done`, yet be unable to remove its own temporary
worktrees and local branches. The current controller is persisted inside the
implementation worktree but does not record the exact ownership and
per-delivery evidence required by the cleanup finalizer.

The desired outcome is a finalization contract that preserves durable recovery
evidence while permitting only clean, explicitly recorded, confirmed-delivered
resources to be removed.

## Evidence and key findings

- The completed `allow-artifact-missing-degraded-review-recovery` run reached
  merged implementation PR #112, Sync PR #113, and Archive PR #114; issue #111
  is closed and its Project item is `Done`.
- Its controller at
  `openspec/changes/.delivery-runs/allow-artifact-missing-degraded-review-recovery/controller.json`
  records lifecycle phases but no `cleanupRecords` for its implementation,
  Sync, or Archive worktrees and branches.
- `skills/base/sdd-workspace-cleanup/SKILL.md` and
  `scripts/sdd/sdd-workspace-cleanup.mjs` require exact, durable ownership and
  delivery evidence; the documented policy forbids inferring or backfilling
  such records and forbids discarding dirty content.
- The implementation worktree contains only its target-owned runtime controller
  checkpoint, but that still makes it dirty under the cleanup contract.

## Options considered and tradeoffs

1. Delete or force-remove the worktrees now. This would violate the
   no-discard/no-force cleanup boundary and loses recovery evidence.
2. Backfill cleanup ownership records after Archive. This makes cleanup appear
   eligible without proving ownership was captured at resource creation.
3. Make resource registration and controller finalization first-class lifecycle
   operations. This preserves fail-closed cleanup while making successful runs
   terminally clean. This is the recommended direction.

## Decisions, assumptions, and decision owner

No architecture decision is approved by this brief. The observed run is
paused at Cleanup with `cleanup-resource-records-missing`.

Assumption: a later implementation may add durable records only when a
worktree/branch is created or selected, never by post-Archive inference.
Decision owner: repository owner.

## Scope, non-goals, constraints, dependencies, and risks

Scope for a follow-on change:

- record exact resource ownership and each PR's delivery evidence at creation;
- distinguish implementation, Sync, and Archive delivery heads for
  squash-merged branches;
- define a controller terminalization/transfer mechanism that leaves an owned
  worktree clean before removal;
- add recovery fixtures for partial cleanup and checkpoint retention.

Non-goals: deleting remote branches, broad cleanup, resetting worktrees,
relaxing independent review, or changing the already archived recovery change.

Constraints: preserve unrelated dirty work; never infer ownership; maintain
durable outcome receipts before destructive local mutations.

Risk: storing the controller in a removable worktree without a defined
terminal handoff can permanently block otherwise eligible cleanup.

## Open questions and blocking decisions

- Where should a terminal controller receipt live after its owned worktree is
  removed: a primary-worktree runtime area, a separately owned run directory,
  or an archived immutable evidence artifact?
- Should each lifecycle PR own a separately registered cleanup resource, or
  should Sync and Archive run on one registered delivery worktree?
- What retention period and deletion rule applies to terminal controller
  receipts?

## Recommended next step

Run OpenSpec Explore, then Propose, for a narrowly scoped controller and
workspace-cleanup terminality repair. Keep the currently paused worktrees and
branches intact until that change supplies current cleanup evidence.
