## Why

The released installed-runtime initializer writes its schema-5 pending
controller checkpoint and then recursively submits the entire controller-state
tree to the legacy inventory gate. Because that gate treats every JSON file as
a legacy controller and recognizes only schemas 1–4, it classifies the
initializer's own checkpoint as ambiguous and prevents every real v2 delivery
from starting. Primary issue: [#187](https://github.com/jizzoe/joericearchitect-ai-skills/issues/187).

## What Changes

- Define a typed legacy-inventory candidate boundary that admits only actual
  legacy controller records from the configured legacy checkpoint tree.
- Exclude the current schema-5 controller checkpoint and unrelated JSON inputs
  from legacy classification without deleting, rewriting, or treating them as
  terminal legacy evidence.
- Preserve fail-closed pauses for malformed or unknown-schema records that are
  actual legacy-controller candidates and for unreconciled active legacy
  controllers.
- Add an installed-wrapper regression that initializes against a real Git
  common controller-state directory, proves mutually matching controller/run/
  work-unit/claim identities, and proves an exact retry resumes them.
- Keep the repair on the approved pre-v2 bridge: it creates no v2 or legacy
  claim for itself and installs only the final mainline runtime afterward.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `autonomous-sdd-run-contract`: Constrain legacy inventory to typed legacy
  controller candidates while preserving strict ambiguous and active legacy
  authority refusal.
- `autonomous-sdd-continuation`: Require the installed initializer to exclude
  its own current controller checkpoint and non-controller JSON from legacy
  admission input, with real Git-common integration evidence.

## Impact

Affected assets are the legacy-inventory decoder/walker, installed controller
wrapper boundary if needed, admission/initializer tests, runtime integration
tests, canonical lifecycle guidance, and the autonomous blocker register. No
dependency, credential, provider, runtime-manifest verb, product-specific
constant, or public command shape changes.

Compatibility is fail-closed: genuine legacy controller records retain their
existing schema, active/terminal/ambiguous classification, reconciliation, and
read-only behavior. Current schema-5 controller records remain governed by the
controller validator rather than being silently reclassified as legacy.

## Reuse Plan

- **Canonical assets:** candidate selection and legacy classification remain
  assistant-neutral under `scripts/sdd`; the installed wrapper remains a thin
  manifest-declared adapter.
- **Configured values:** repository paths, Git common directory, selected
  change, authorization, and provider bindings remain invocation/runtime
  inputs rather than reusable constants.
- **Assistant exposure:** Claude and Codex continue using the same canonical
  lifecycle skill and installed runtime helper; no wrapper-specific policy is
  introduced.
- **Portable evidence:** fixtures use temporary repositories and arbitrary
  remotes; no issue number, user path, or repository identity is committed to
  reusable code or tests.
