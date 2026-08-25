# Integrate Autonomous SDD Finalization and Cleanup

## Why

Closeout and exact-owned cleanup can falsely report completion, release a claim
too early, or damage dirty, unrelated, primary, or ambiguously owned resources.
This change codifies the terminal convergence predicates, claim-release order,
and exact resource-eligibility classification as deterministic, evidenced,
resumable transitions.

## What Changes

- Add a terminal-convergence contract that requires implementation, Sync, and
  Archive delivery plus issue close, Project Done, and cleanup completion before
  a run is terminal.
- Add a claim-release order contract: cleanup converges first, then terminal
  evidence completes, then the claim releases; partial cleanup cannot release.
- Add exact resource-eligibility classification that retains dirty, unrelated,
  primary, locked, divergent, legacy, remote, and ownership-mismatched resources
  with a typed recovery reason.

## Capabilities

### New Capabilities

- `autonomous-sdd-finalization-and-cleanup`: terminal convergence predicates,
  claim-release ordering, and exact resource-eligibility classification.

### Modified Capabilities

None.

## Impact

- New `scripts/sdd/autonomous-sdd-finalization.mjs` (plus focused tests).
- Builds on the existing `sdd-workspace-cleanup` engine and the controller
  terminalization predicates (contract-only).
- Contract-only/audit; does not activate real ownership or production Apply.
