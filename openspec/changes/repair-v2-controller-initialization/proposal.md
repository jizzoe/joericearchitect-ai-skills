## Why

The released v2 runtime can admit a run (create its exclusive repository
claim) and can perform later controller transitions, but it does not expose a
supported command that creates the durable controller record required before
those transitions. Starting admission by itself could therefore leave another
active claim with no resumable lifecycle checklist. This repair closes that
control-plane gap before another autonomous delivery is started.

## What Changes

- Add one declared runtime operation that initializes an autonomous v2 delivery
  from an exact resolved authorization and creates its derived controller
  record as part of the same recoverable start procedure.
- Ensure that a lifecycle action becomes eligible only after both the v2 run
  and its matching controller record are durably present and mutually bound.
- Make interrupted initialization safe: it must not leave an active repository
  claim without a resumable exact controller record, and it must reject a
  mismatched retry without changing another run.
- Declare the operation in the shared runtime manifest and add installed-
  runtime, interruption, rejection, and recovery coverage.
- Record the repair in the autonomous-SDD blocker handoff and place the
  resulting initialization contract on the M2-S1/M2-S2 roadmap boundary.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `autonomous-sdd-continuation`: Define the executable, durable
  initialization transition that creates the exact controller context required
  before autonomous lifecycle selection.
- `autonomous-sdd-run-contract`: Bind newly admitted v2 runs to their exact
  controller identity and define safe recovery for interrupted initialization.
- `shared-sdd-runtime-distribution`: Declare the initialization operation so
  installed skills can invoke it without importing workspace source files.

## Impact

Affected assets are the v2 admission/controller boundary, repository-common
controller state, local v2 state store, runtime controller wrapper and
manifest, canonical lifecycle documentation, focused Node tests, and OpenSpec
specifications. The reusable behavior remains repository-neutral: repository
identity, authorization, expiry, and run IDs come from typed input and durable
state; credentials and product-specific constants are not stored in reusable
assets.

## Reuse Plan

- **Canonical assets:** the controller initializer, v2 admission contract,
  runtime wrapper, manifest declaration, and lifecycle skill remain shared
  assistant-neutral assets.
- **Configured values:** selected change, repository identity, authorization
  digest, expiry, and generated run ID are supplied at invocation time and are
  recorded only in the corresponding durable state.
- **Assistant exposure:** Claude and Codex continue to invoke the same
  manifest-declared runtime helper through their existing thin skills.
- **Compatibility:** existing archived runs and legacy controller records stay
  read-only; the new operation applies only to a newly authorized v2 delivery
  and must not manufacture a record for historical runs.
