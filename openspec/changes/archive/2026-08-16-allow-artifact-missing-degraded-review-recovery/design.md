## Context

See `proposal.md` for motivation. The Codex launcher currently has a fixed
recoverable-failure allowlist. It validates all other recovery bindings after
checking that list, so the typed missing-owned-artifact strict result stops
before it can create a degraded detached view.

## Goals / Non-Goals

**Goals:**

- Add exactly one stable strict transport code to the Codex launcher’s
  recoverable-failure set.
- Preserve strict-only fail-closed behavior and all existing degraded-review
  preflight and acceptance validation.
- Prove the positive and negative eligibility matrix through deterministic
  adapter tests.

**Non-Goals:**

- Repair the strict artifact transport, parse transcript output, or broaden the
  fallback to arbitrary unavailable codes.
- Alter reviewer permissions, runtime approval, credentials, external state, or
  generated platform adapters.

## Decisions

1. Extend the existing `codex-detached-read-only-v1` recoverable-failures
   constant rather than special-casing preflight logic. This keeps the
   allowlist declarative and applies the same exact binding checks to every
   eligible typed failure.
2. Leave the Claude recovery set unchanged. The observed code is emitted by
   Codex parent-artifact consumption, so granting it to Claude would be an
   unreviewed policy expansion.
3. Treat the prior strict unavailable result as immutable evidence. No code
   path may derive a strict result from degraded output; existing result
   validation and capability-ledger requirements remain authoritative.
4. Normalize a structurally valid parent-strict unavailable receipt into the
   existing canonical unavailable-result contract using the sealed request
   package, configured strict reviewer, and execution identifiers. This makes
   the typed precursor durable without interpreting transcript output.

## Risks / Trade-offs

- [A broader fallback surface masks strict transport defects] → permit one
  named stable code only; retain the strict precursor and explicit degraded
  label.
- [A refactor permits unrelated codes] → add direct preflight tests for the
  selected code and a nearby nonrecoverable code.
- [Strict transport remains unreliable] → preserve the separate strict
  artifact-delivery repair as an independent follow-up.

## Migration Plan

No migration or rollout is required. Existing strict-only requests remain
ineligible for degraded recovery. An authorized strict-first-degraded run may
resume only when its current package and all existing preflight bindings pass.

## Reuse Plan

The canonical behavior remains in the assistant-neutral review launcher and
its OpenSpec capability. No product configuration, repository identity,
credential, absolute path, or Claude/Codex wrapper duplication is introduced.
The shared contract continues to select the platform adapter from configured
reviewer data.
