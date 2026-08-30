## Why

Independent-review selection is hardcoded: `strict-isolated` is bound to the
Codex parent-capture transport and `authorized-degraded` to the Claude
subprocess adapter. There is no config-driven way to select which reviewer
executable or adapter a driver uses, which blocks running the framework under
multiple models (Claude Code, Codex, DeepSeek, others) and launching multiple
reviewer models.

## What Changes

- Add a config-driven reviewer-provider registry
  (`config/reviewer-providers.json`) plus a deterministic validator/resolver
  (`scripts/sdd/reviewer-providers.mjs`). Each provider maps a logical name to a
  known adapter, executable, assurance level, and transport
  (`parent-capture` or `subprocess`).
- Add focused tests for validation, resolution, and loading.

## Scope

Limited to the registry + resolver. Wiring the review gate to consume the
registry is a follow-on. The portable `strict-isolated` OS-sandbox option and a
DeepSeek/HTTP adapter are separate, deferred changes.

## Capabilities

### Modified Capabilities

- `isolated-independent-review`: add a config-driven reviewer-provider registry.

## Impact

- Affected assets: `config/reviewer-providers.json`,
  `scripts/sdd/reviewer-providers.mjs`, and its focused tests.
- Compatibility: additive; no existing selection behavior changes.

## Non-Goals

- Portable `strict-isolated` OS-sandbox isolation (deferred).
- A DeepSeek/HTTP reviewer adapter (deferred).
- Rewiring `executeReviewLauncherHost` to consume the registry (follow-on).
