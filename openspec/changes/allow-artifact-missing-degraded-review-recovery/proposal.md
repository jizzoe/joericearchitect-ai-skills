## Why

An owner-authorized `strict-first-degraded` review cannot currently recover
from the typed strict Codex result-artifact failure even when the strict
precursor, exact package, and all recovery bindings are durable. This leaves a
safe reduced-assurance path unusable for one known transport failure while
strict-only correctly remains fail-closed.

## What Changes

- Extend the Codex detached-review launcher’s fixed recoverable-failure set
  with `review-launcher-codex-result-artifact-missing`.
- Preserve every existing degraded-review authorization, exact package,
  lifecycle, identity, runtime-permission, capability-ledger, and cleanup
  validation.
- Add regression coverage proving this one code can prepare recovery and
  unrelated strict unavailable codes remain rejected.
- Document that an accepted fallback is `authorized-degraded`, retains the
  immutable strict precursor, and never substitutes for `strict-only` review.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `isolated-independent-review`: permit the exact durable strict
  result-artifact-missing outcome to use an otherwise authorized,
  fresh-separated degraded launcher recovery.

## Impact

Affected assets are the independent-review recovery adapter, its deterministic
tests, the reusable isolated-review specification, and user-facing recovery
guidance. No external API, credential, Project, deployment, or release
behavior changes.
