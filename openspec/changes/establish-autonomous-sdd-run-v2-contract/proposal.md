## Why

Autonomous SDD currently has incompatible controller and checkpoint records,
location-dependent discovery, and no single durable authority for run history
or repository claims. In particular, the installed controller can construct an
initial record but does not expose a durable initial-record transition, which
prevents a valid autonomous request from establishing its required context.

This change establishes the portable, backend-neutral contract required before
the repository can safely build deterministic single-change execution. The
primary GitHub issue will be created or reused from the exact controller-bound
delivery payload; it remains the authoritative discussion and tracking record.

## What Changes

- Add a durable autonomous-SDD run contract that separates parent runs,
  isolated work units, transition attempts, repository resource claims,
  immutable history, and rebuildable projections.
- Define repository identity, one-active-mutating-run admission, native-lock
  and ownership-generation requirements, safe record publication, archival,
  and explicit takeover/recovery rules for Windows, macOS, and Linux.
- Establish a v2 cutover contract: legacy records remain read-only audit
  inputs, while v2 becomes the sole authority for newly admitted runs.
- Require a durable initial admission transition so a resolved authorization
  and selected work unit are persisted before any lifecycle action.
- Specify portable serializers and migration classifications without selecting
  a workflow backend or executing lifecycle transitions.

## Capabilities

### New Capabilities

- `autonomous-sdd-run-contract`: Backend-neutral durable run, work-unit,
  claim, history, archive, and legacy-cutover behavior for autonomous SDD.

### Modified Capabilities

- `autonomous-sdd-continuation`: Require controller entrypoints to use the v2
  durable admission and work-unit contract rather than creating competing
  authoritative records.

## Impact

- Affected assets: deterministic SDD runtime scripts, controller/checkpoint
  adapters, lifecycle skills, validation fixtures, and their thin Claude/Codex
  exposure.
- Compatibility: existing v1 controller/checkpoint state stays readable but
  cannot advance after v2 cutover; ambiguous legacy state remains immutable
  audit evidence.
- Reuse plan: the contract, validators, serializers, and skill entrypoints are
  product-neutral. Repository remotes, claim-provider configuration, state
  roots, GitHub issue/project details, and credentials remain configured
  product values and are never embedded in reusable assets.
