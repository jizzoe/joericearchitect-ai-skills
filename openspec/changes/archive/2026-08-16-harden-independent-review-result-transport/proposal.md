## Why

The authorized-degraded Codex review transport can display a schema-valid
`passed` message in its transcript while the parent gate rejects the separately
captured final-output artifact with one generic unavailable code. This prevents
safe diagnosis and blocks delivery even though the protocol correctly refuses
to treat transcript text as evidence.

The transport must make the final owned artifact and each fail-closed stage
observable without retaining review content or weakening strict-first review.

## What Changes

- Split Codex parent-transport consumption into explicit, stable failure stages
  for receipt validation, result-artifact inspection, parsing, findings-payload
  validation, normalized-result validation, binding validation, and cleanup.
- Retain only non-sensitive diagnostic metadata—such as file presence, byte
  count, digest, parse classification, and stable failure code—until durable
  unavailable or accepted evidence is recorded.
- Bind degraded-review acceptance exclusively to the final bytes in the owned
  result artifact, never to stdout, a transcript, or an intermediate structured
  message.
- Provide a minimal deterministic command path for the restricted Codex
  reviewer without restoring ambient credentials, network access, mutation
  authority, or arbitrary environment inheritance.
- Add deterministic transport fixtures covering intermediate structured output,
  valid final captures, every rejected artifact/binding/cleanup condition, and
  portable restricted-environment behavior.

## Non-Goals

- Accept transcript content as review evidence, relax fail-closed unavailable
  handling, or alter strict-first-degraded policy.
- Add credentials, network access, arbitrary environment inheritance, package
  content logging, or product-specific runtime configuration.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `isolated-independent-review`: Make final-result transport evidence and
  unavailable diagnostics explicit while preserving fail-closed review
  validation and cleanup.

## Impact

- Scope: Codex parent-result transport and its deterministic fixtures only.
- Affects `scripts/sdd/platform-review-adapters.mjs`, the review-launcher
  recovery boundary, independent-review result handling, and their deterministic
  tests/evals.
- May add narrowly scoped diagnostic fields or codes to durable review evidence;
  no raw reviewer output, credentials, or package contents are retained.
- Compatibility: preserves the accepted normalized-result shape and strict-only
  behavior; no API, model-routing, dependency, or product-specific
  configuration change is intended.
- Security: preserves credential scrubbing, network denial, read-only runtime
  constraints, and final-artifact-only acceptance.
- Primary issue: https://github.com/jizzoe/joericearchitect-ai-skills/issues/93.

## Reuse Plan

- Extend the existing assistant-neutral independent-review contract and Codex
  platform adapter rather than introducing a parallel transport or validator.
