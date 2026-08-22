## Why

M1-S2 completed its OpenSpec and GitHub delivery, but its bootstrap v2 run
remained in the active-run area with an unreleased repository claim. The next
autonomous run correctly refuses to begin, yet the installed controller offers
no evidence-checked terminalization operation for this exact completed run.

## What Changes

- Add one controller-gated v2 terminalization operation for an exact, already
  delivered run.
- Require terminal delivery, cleanup, identity, and claim evidence before the
  operation can write a terminal summary, release the claim, archive the run,
  and rebuild the repository index.
- Expose the operation through the declared shared runtime, with no direct
  module import or manual state editing path.
- Add regression tests for success, incomplete/mismatched evidence, duplicate
  attempts, and subsequent admission after convergence.

## Capabilities

### New Capabilities

- `autonomous-sdd-v2-terminalization`: Evidence-bound closure of an exact v2
  run so a completed run cannot indefinitely retain the repository claim.

### Modified Capabilities

- `autonomous-sdd-run-contract`: Define the supported terminalization behavior
  required before a completed v2 run may leave active state.
- `shared-sdd-runtime-distribution`: Make the controller terminalization
  operation dispatchable only through the declared installed runtime.

## Impact

Affected assets are the v2 run contract, local state store, autonomous SDD
controller entrypoint and runtime manifest, focused Node tests, and the
corresponding OpenSpec specifications. The one-time use is limited by the
separate bootstrap authorization to M1-S2's exact parent run, work unit, and
claim; the reusable operation itself remains configuration-neutral and does
not store credentials or alter GitHub data.
