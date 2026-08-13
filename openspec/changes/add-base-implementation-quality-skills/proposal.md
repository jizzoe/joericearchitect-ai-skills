## Why

Implementers currently lack reusable, assistant-neutral skills for reviewing a
bounded change and for driving proportional implementation evidence to a stable
result. Adding these two capabilities turns the accepted implementation-quality
brief into explicit behavioral contracts while preserving OpenSpec Verify, CI,
and strict independent review as separate gates.

Approved no-issue exception: the owner-authorized proposal request dated
2026-08-13 explicitly prohibits creating a GitHub issue for this planning-only
change.

## What Changes

- Add `base-code-review`, an advisory, read-only-by-default review capability
  that reports evidence-backed findings by severity and disposition without
  changing the reviewed work.
- Add `base-verification-loop`, a bounded implementation-evidence capability
  that selects focused and profile-proportional checks, records results through
  `skill-result-v1`, and pauses rather than skipping required evidence.
- Define `prototype-rapid` and `production-rapid` verification expectations,
  including the initial web UI viewport, screenshot, interaction, and
  accessibility evidence contract when applicable.
- Compose the capabilities so verification may consume local code-review
  findings while keeping local review distinct from the current strict,
  isolated independent-review gate for `production-rapid` delivery.
- Add synthetic evaluation and portability expectations for activation,
  evidence quality, correction limits, security boundaries, UI checks, thin
  assistant exposure, and second-workspace reuse.

## Scope

This change is limited to the canonical `base-code-review` and
`base-verification-loop` capabilities, their eventual thin Claude/Codex
exposure, and the deterministic contracts, fixtures, and evaluation evidence
needed to implement them.

## Non-Goals

- Do not replace or weaken OpenSpec Verify, CI, delivery authorization, shared
  guardrails, or independent review.
- Do not add production code, schemas, scripts, wrappers, tests, issues,
  branches, commits, pull requests, Sync, or Archive during Propose.
- Do not modify the current independent-review, autonomous-runner, lifecycle,
  or shared-contract requirements.
- Do not depend on or claim the unmerged authorized-degraded-review fallback;
  strict isolated independent review remains the current `production-rapid`
  rule, and its unavailability pauses that gate.
- Do not introduce native-mobile verification, product-specific commands,
  tool versions, repository constants, or credentials as reusable policy.

## Capabilities

### New Capabilities

- `base-code-review`: Defines bounded, evidence-backed, advisory review behavior,
  severity and disposition semantics, safety boundaries, and structured output.
- `base-verification-loop`: Defines profile-proportional implementation evidence,
  bounded objective correction and retry, web UI verification, and readiness
  reporting.

### Modified Capabilities

None. The new capabilities consume existing contracts without changing their
requirements.

## Impact

- **Canonical assets:** future `skills/base/base-code-review/` and
  `skills/base/base-verification-loop/` skills, shared result validation,
  deterministic helpers, references, fixtures, and evals.
- **Assistant exposure:** future Claude and Codex wrappers remain thin and point
  to the canonical skills without duplicating policy.
- **Dependencies:** the implemented `base-skill-contracts`,
  `shared-skill-guardrails`, `base-skill-authoring`, and current strict
  `isolated-independent-review` contracts remain authoritative.
- **Users:** implementers and reviewers gain consistent local evidence and
  readiness reports; delivery authorities retain their existing gates.
- **Compatibility and migration:** additive only. Existing callers are
  unaffected, and adoption is explicit per invocation or workflow composition.
- **Security:** both skills inherit the shared treatment of untrusted content,
  secrets, authorization, runtime permission, evidence, and pause boundaries.

## Reuse Plan

Keep behavior, result semantics, fixture shapes, and evaluation rules in
assistant-neutral canonical assets. Supply repositories, paths, commands,
delivery configuration, browser tooling, and adapter identities through
product-owned configuration or invocation inputs. Claude and Codex exposure
must remain thin routing layers over the same canonical behavior.
