## Context

The expired controller holds an active exclusive claim that blocks later v2
admission. The recovery must (a) deliver the four scoped capabilities, (b)
install the released runtime runtime-only, (c) retire the exact expired
controller, and (d) leave M2-S1 Propose-ready.

## Decisions

- Runtime-only installation: a separate installer path that builds the
  manifest-verified runtime, retains the prior runtime, and supports rollback
  without global skills. The paired installer stays the default.
- Cancellation/retirement: a declared subcommand distinct from terminalization.
  It requires exact controller/parent/workunit/claim identity, expiry proof,
  and receipt/archive consistency; it records a `cancelled` (not `delivered`)
  terminal outcome and releases only the exact claim.
- Cleanup repair: wire installed-wrapper Git cleanup so worktree removal
  precedes branch evaluation and remote branches are always retained.
- Host-context handoff: accept only current, matching, non-secret
  host-contrast evidence for the exact issue operation.

## Alternatives

- Terminalizing the expired controller as delivered: rejected; it was never
  completed and would fabricate delivery evidence.
- Hand-editing the controller/claim records: rejected; violates immutable
  history and the exact-identity safety boundary.
- Broadening cancellation to other runs: rejected; the operation is exact and
  single-target.
