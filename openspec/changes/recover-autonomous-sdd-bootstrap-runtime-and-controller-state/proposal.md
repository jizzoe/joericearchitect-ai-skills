## Why

A stranded pre-v2 controller (`controller-cf2ecbc380a3ee49a2fe23768951f7cf`)
is stuck at `propose` with an active exclusive claim and expired at
2026-08-23T00:00:00Z. The installed runtime (`runtime-e0e9a50a042b`, source
revision `138b2212…`) has terminalization for completed runs but no canonical
cancellation/retirement operation for an unfinished, expired controller, and
the paired installer has no runtime-only installation mode. Ordinary closeout
cannot retire the expired controller without changing global skills, so the
repository claim remains blocked.

Primary issue: [#203](https://github.com/jizzoe/joericearchitect-ai-skills/issues/203).

## What Changes

1. Add a supported runtime-only installation mode that builds, verifies,
   retains, activates, and rolls back the shared runtime without invoking or
   changing global skills. The paired installer remains the default.
2. Complete the cleanup repair: inject installed-wrapper Git cleanup
   operations, remove exact owned worktrees before evaluating attached local
   branches, and retain remote branches.
3. Complete the host-context issue-intake handoff: accept only current,
   matching, non-secret host-contrast evidence.
4. Add a canonical, receipt-backed expired-controller cancellation/retirement
   operation that retires only the exact expired controller, its parent run,
   work unit, and claim after expiry, records the run as cancelled rather than
   completed, and releases only that claim.

This delivery creates no v2 or legacy claim for itself.

## Non-Goals

- Changing global skills, credentials, credential scopes, deployments, or
  unrelated repositories or local files.
- Force-pushing or deleting remote branches.
- Beginning M2 implementation.
- Retiring any run other than the exact expired controller listed above.

## Capabilities

### New Capabilities

- `shared-sdd-runtime-distribution`: runtime-only installation mode.
- `autonomous-sdd-v2-terminalization`: expired-controller cancellation/retirement.

### Modified Capabilities

None. Cleanup and host-context are implementation fixes against existing
`sdd-workspace-cleanup` and `github-cli-auth-context-detection` requirements.

## Impact

Affected assets are the runtime installer, cleanup wrapper, GitHub issue
helper, and the autonomous SDD controller. No global skill, credential, or
external deployment changes.

## Reuse Plan

- Runtime-only installation and cancellation remain repository-neutral and
  configuration-free; no product constants or credentials are embedded.
- Claude and Codex continue to consume the same canonical contracts.
