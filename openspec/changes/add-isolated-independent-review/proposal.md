## Why

`production-rapid` delivery already requires independent review evidence, but
the repository has no configured cross-assistant adapter that can create that
evidence in a demonstrably fresh, isolated, read-only execution context. This
leaves otherwise valid autonomous runs unable to pass their delivery gate and
forces a manual exception instead of exercising the intended safety model.

Primary GitHub issue: [#80](https://github.com/jizzoe/joericearchitect-ai-skills/issues/80).
The durable repository-local linkage is recorded in [tracking.yaml](tracking.yaml).

## What Changes

- Add a reusable isolated-independent-review protocol that seals immutable
  review inputs, launches a fresh read-only reviewer, validates a common result
  schema, and records durable evidence for the exact delivery transition.
- Add thin Codex and Claude adapters that enforce platform-specific isolation
  while sharing canonical packaging, validation, findings, and authorization
  behavior.
- Add an evidence-backed finding-disposition loop: objective fixes require
  affected checks and a fresh exact-head review; warnings and false positives
  remain challengeable review evidence; blocker, high, and material findings
  pause delivery.
- Fail closed on stale or malformed evidence, inherited implementation context,
  writable execution, reviewer unavailability, duplicate records, incorrect
  commits or manifests, exhausted correction budgets, and material decisions.
- Add schema, fixture, portability, security, recovery, attribution, and
  cross-adapter parity coverage without adding a hosted service, credentials,
  OAuth scopes, or third-party provider framework.
- Add a user-facing enablement guide that separates one-time platform readiness
  from per-run Codex Goal and Claude noninteractive-review invocation, without
  changing ordinary interactive assistant behavior.

## Non-Goals

- Do not replace deterministic tests, OpenSpec Verify, CI, branch protection,
  or existing authorization and runtime-permission checks.
- Do not grant reviewer access to credentials, mutable Git/GitHub state,
  deployments, releases, external messages, or unrelated worktree content.
- Do not treat a separate prompt, chat, or subagent as proof of isolation
  without enforced fresh context and read-only execution.
- Do not build a hosted service, request OAuth scopes, or introduce arbitrary
  third-party review providers in this change.

## Capabilities

### New Capabilities

- `isolated-independent-review`: Defines sealed review packages, enforced
  reviewer isolation, one cross-platform result contract, feedback and
  correction behavior, validation, and safe recovery.

### Modified Capabilities

- `bounded-autonomous-execution`: Requires the production-rapid runner to
  invoke the configured protocol, durably disposition every finding, obtain a
  fresh review after any new head, and accept only current validated evidence.
- `sdd-lifecycle`: Extends delivery rereview behavior to preserve and
  independently challenge warning and false-positive dispositions as well as
  verify objective corrections before an authorized transition.

## Impact

- **Canonical assets:** new `skills/base/independent-review/` skill,
  protocol/result references, deterministic package/execution/validation
  scripts, JSON Schema, fixtures, and evals.
- **Assistant exposure:** thin Codex and Claude adapters route to the same
  canonical behavior; neither adapter owns authorization or finding policy.
- **Users:** autonomous SDD runners gain a non-human delivery-review path while
  repository owners retain pauses for material decisions and invalid evidence.
  A user-facing guide explains the optional one-time readiness and per-run
  invocation needed to enable that path on Codex and Claude.
- **Compatibility and migration:** existing manual review evidence is not
  silently converted. Product configuration must select an adapter, declare
  its isolation attestation and allowed commands, and produce the new schema
  before automated delivery can use it.
- **Dependencies:** uses existing Git object verification, bounded
  authorization, checkpoint, validation-evidence, and correction-budget
  contracts. No new runtime dependency is intended; any later addition needs
  recorded provenance, license, and integrity evidence.
- **Scope boundary:** planning artifacts only. Apply, issue creation, external
  mutations, and delivery require later explicit authorization.

## Reuse Plan

- Package construction, result validation, finding semantics, security policy,
  correction behavior, and recovery codes remain product-neutral canonical
  assets.
- Repository paths, adapter identity, isolation attestation, allowed review
  commands, evidence locations, and required artifact paths remain
  product-owned configuration.
- Claude and Codex exposures stay thin and equivalent while their adapters own
  only platform transport and enforced-runtime mapping.
- A second-workspace fixture with different configured paths must pass without
  changes to canonical assets.
