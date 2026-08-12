## Why

Reusable skills need a consistent way to turn an approved capability into a
portable, safe, testable skill contract before implementation. The shared
contracts and guardrails now exist, so this change can make that authoring
workflow available without duplicating foundation policy.

## What Changes

- Add the user-invoked canonical `base-skill-authoring` skill.
- Define its contract-package and structured gap-result behavior.
- Require use of the established shared guardrails, result/config contracts,
  and deterministic operation authorization checker.
- Add synthetic evals for activation, safety, pause/recovery, adapter thinness,
  and portability.

## Non-Goals

- Redefining schemas, shared guardrails, authorization vocabulary, migration,
  or validators from `establish-base-skill-contracts-and-guardrails`.
- Building a platform plugin, implementing a one-off task, or adding product
  configuration, credentials, connector scopes, deployments, or messaging.

## Capabilities

### New Capabilities

- `base-skill-authoring`: creates a safe, portable reusable-skill contract
  package or a structured gap result before implementation.

### Modified Capabilities

- None.

## Impact

- Primary issue: https://github.com/jizzoe/joericearchitect-ai-skills/issues/76.
- Affected assets: canonical skill instructions, progressive references,
  synthetic evals/fixtures, and thin Claude/Codex exposures only when required.
- Compatibility: new opt-in capability; existing base skills remain unchanged.
- Security: consumes existing guardrails and never stores secrets or
  product-specific constants in reusable assets.

## Reuse Plan

- The canonical skill remains assistant-neutral under `skills/base/`; platform
  wrappers only route to it.
- Product paths, targets, adapters, approvals, and policy values come from
  explicit inputs or optional product-owned `ai-skills-config-v1`.
