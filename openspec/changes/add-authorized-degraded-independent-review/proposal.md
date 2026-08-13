## Why

Strict, OS-isolated independent review must remain the standard for
`production-rapid` delivery, but a bounded owner-authorized run may need an
explicitly lower-assurance signal when that adapter is objectively unavailable.
The current protocol correctly pauses; it cannot record or safely use that
specific risk acceptance without weakening its default.

Primary GitHub issue: [#84](https://github.com/jizzoe/joericearchitect-ai-skills/issues/84).

## What Changes

- Add an opt-in, transition- and change-bound degraded independent-review
  authorization that expires no later than its enclosing autonomous goal.
- Require strict review to be attempted and durably recorded as unavailable
  before a fresh, separate, non-mutating degraded reviewer can be invoked.
- Add a named SDD-delivery request preset that expands concise user input into
  the complete production, authorization, review, expiration, and correction
  boundaries; consolidate any missing required inputs into one pre-mutation
  clarification with meanings and allowed values.
- Extend sealed result and delivery evidence with an unambiguous assurance
  level, a capability ledger, the authorization/risk record, and exact
  package/base/head bindings.
- Add deterministic schema, authorization, adapter, delivery-gate, recovery,
  portability, command-injection, secret, and thin-adapter-drift tests.
- Support equivalent configured external-host degraded recovery through Codex
  and Claude while preserving one assistant-neutral result and authorization
  contract.
- Record the owner's explicit acceptance that degraded parent-launch evidence
  is forgeable and reviewer executable identity is basename-checked rather than
  security-verified; retain these as known risks, not resolved findings.
- Preserve existing finding disposition, correction-budget, verification,
  recovery, and strict fail-closed behavior for all un-authorized runs.
- Make human-pause behavior disposition-driven: high-severity objective fixes
  use the same bounded correction and rereview loop, while findings requiring
  product, security, architecture, compatibility, licensing, governance,
  data-ownership, or scope judgment pause for the owner.

## Scope

The scope is the canonical independent-review, autonomous authorization, and
lifecycle evidence boundary.

## Non-Goals

This change excludes standing fallback permission,
credentials, external messages, deployment, release, and model selection.
It also excludes silently guessing a missing risk-bearing delivery input or
granting runtime elevation that the active execution environment has not
permitted. Authenticated host IPC, OS-protected signing capabilities, and
host-owned executable pinning are deferred because of their machine/CI setup
and lifecycle cost.

## Capabilities

### New Capabilities

- `authorized-degraded-independent-review`: Defines the narrow opt-in fallback
  and its authorization, evidence, assurance, and recovery contract.

### Modified Capabilities

- `isolated-independent-review`: Adds the explicit strict-first fallback path
  while preserving strict isolation as the default and non-equivalent evidence.
- `bounded-autonomous-execution`: Allows the runner to evaluate only a
  time-bounded degraded-review authorization for the selected derived delivery
  transition and defines the concise SDD-delivery request contract.
- `sdd-lifecycle`: Requires lifecycle evidence and reports to retain the
  selected strict or authorized-degraded assurance level.

## Impact

- **Canonical assets:** independent-review schemas, deterministic package/result
  validation and adapter orchestration, the autonomous authorization checker,
  durable checkpoints, and focused fixtures/evaluations.
- **Assistant exposure:** existing Claude and Codex wrappers remain thin and
  delegate to the canonical skill; neither chooses a reviewer or fallback.
- **Compatibility:** an absent, malformed, expired, mismatched, or broad
  authorization retains the present fail-closed pause. No existing strict
  result is converted to degraded evidence. Existing fully specified run
  authorizations remain valid; the concise request resolver is additive.
- **Security:** strict review retains its verified boundary. Degraded reviewers
  are configured without Git, repository-write, GitHub, credential,
  network-mutation, deployment, release, external-send, or delegated-mutation
  tools, but the external launch evidence and executable identity are not
  cryptographically verifiable against an adversarial implementation process.
  Product-specific values remain in run records, never reusable assets.
- **Reuse plan:** the contracts and validators are product-neutral; exact
  change, transition, SHA, expiration, reviewer identity, and risk reason are
  runtime evidence. Platform wrappers provide transport and accurately report
  restrictions only.

## Reuse Plan

Canonical contracts, validators, and tests remain reusable; repository-specific
issue, Project, branch, transition, reviewer, expiry, and risk-acceptance data
are carried only in product-owned run records and evidence.
