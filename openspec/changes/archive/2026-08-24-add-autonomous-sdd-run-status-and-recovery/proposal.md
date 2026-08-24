## Why

Run status and recovery currently depend on the current worktree location and can
confuse projections with authoritative execution state. M2-S2 delivered the
durable backend (authoritative history, one coarse claim, ownership, takeover),
but there is no repository-wide, read-only status view that agrees from every
worktree, rebuilds stale projections from history, and returns an exact
safe-resume/no-op/pause decision.

## What Changes

- Add a read-only, repository-wide run-status and recovery module that discovers
  active and archived runs by canonical repository identity (never the caller's
  current directory).
- Emit a versioned `run-status` projection (`schemaVersion: 1`) that reports
  run/work-unit identity, a typed classification, the exact stop reason,
  claim/owner, deadline, and linked (never inlined) evidence.
- Classify each run into exactly one of `running`, `complete`, `expired`,
  `waiting-human`, `retryable-infrastructure`, `quality-blocked`,
  `configuration-discovery-gap`, or `ambiguous-legacy-state`.
- Return exactly one of `safe-resume`, `no-op`, or a typed pause; wrong-run,
  wrong-repository, and stale inputs always pause.
- Rebuild the repository index projection from authoritative history without
  rewriting run records.

## Capabilities

### New Capabilities

- `autonomous-sdd-run-status-and-recovery`: Defines repository-wide discovery,
  the versioned status projection, the typed classification set, safe
  resume/no-op/pause semantics, and read-only projection rebuild.

### Modified Capabilities

None.

## Impact

- Affected assets: a new assistant-neutral `autonomous-sdd-run-status.mjs`
  module and its focused test suite. No existing runtime helper, controller
  record, or GitHub mutation path changes.
- Compatibility: composes the M2-S2 local store and the run contract primitives
  as fixed authorities without changing them.
- Migration: none. The slice is additive, read-only, and delivered by the
  pre-v2/interactive lifecycle (runtime N-1 delivers N).
- Planning boundary: this proposal creates no implementation authority and does
  not activate the v2 controller or real ownership.
