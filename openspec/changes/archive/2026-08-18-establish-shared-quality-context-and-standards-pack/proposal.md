## Why

Reusable quality skills lack one verifiable way to select standards, record
repository-specific exceptions, or hand the same bounded context from
implementation preparation to review and verification. That can produce
inconsistent advice, unbounded context loading, or accidental application of a
stack rule to an unrelated repository.

## What Changes

- Add a product-neutral `standards-pack` capability for portable selection
  records, source precedence, classification, conflicts, and handoff.
- Add the sole normative shared context-management policy for quality assets.
- Require `base-code-review` and `base-verification-loop` to consume a valid
  selection record for stack-standard coverage and report gaps when absent.
- Add deterministic validation and synthetic fixtures, then a concise README
  link to the canonical policy.

## Scope

This change is limited to the reusable shared selection/context foundation,
its existing base quality consumers, deterministic evaluation, and concise
documentation. It excludes all stack-specific overlays and product behavior.

## Capabilities

### New Capabilities

- `standards-pack`: Select, validate, and hand off a portable quality-standard
  record across implementation preparation, review, and verification.

### Modified Capabilities

- `base-code-review`: Consume the applicable standards selection consistently
  with advisory review.
- `base-verification-loop`: Map the applicable standards selection to evidence
  without inventing tools or weakening production gates.

## Impact

- Affected assets: shared quality references, deterministic validation/evals,
  base quality instructions, and the root README.
- Primary issue: https://github.com/jizzoe/joericearchitect-ai-skills/issues/107
- Compatibility: callers without stack-specific selection stay supported by an
  explicit not-applicable classification; callers claiming coverage need a
  valid record.
- Security: records contain only workspace-relative, non-secret evidence and
  configuration references; commands and credentials stay product-owned.

## Non-Goals

- Stack-specific standard catalogs, overlays, commands, versions, or product
  repositories.
- A generic code-writing workflow, generated OpenSpec edits, credentials,
  account actions, deployments, or release actions.

## Reuse Plan

Canonical behavior remains assistant-neutral under `skills/base`; existing
Claude and Codex exposure stays thin. Repository-specific standards, paths,
commands, toolchains, and overrides are invocation inputs or validated
product configuration, never global constants.
