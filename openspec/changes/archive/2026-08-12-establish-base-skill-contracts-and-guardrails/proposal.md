## Why

Canonical base skills currently have no common result/configuration contract or
single enforceable source for safety and authorization policy. Establishing
these foundations now prevents later skills from creating incompatible outputs,
duplicating guardrails, or treating bounded autonomous authorization as a
standing permission.

## What Changes

- Add versioned, strict JSON Schema contracts for reusable skill results and
  optional product-owned, non-secret configuration.
- Add one shared guardrail reference and migrate every canonical
  `skills/base/*/SKILL.md` to link to it through a uniform section.
- Add deterministic validation and synthetic fixtures that reject missing,
  malformed, duplicate, copied, or broken guardrail policy links.
- Extend the existing bounded autonomous execution contract with deterministic
  per-operation checks for fixed profile allowlists, explicitly allowed
  mutation classes, authorized targets, configured adapter capabilities, and
  runtime permissions.
- Define first-release profile boundaries and pause behavior, retaining the
  existing three-attempt behavior-preserving correction limit.
- Add deterministic schema, authorization, portability, and migration evals
  using only synthetic data.

## Non-Goals

- Do not implement `base-skill-authoring`, research/planning skills, or
  implementation-quality skills.
- Do not add product-specific constants, credentials, PII, connector scopes,
  job-search behavior, runtime sandbox changes, or credential operations.
- Do not authorize external send, calendar updates, submissions, releases, or
  deployments in first-release profiles. Merge, OpenSpec Archive, and
  merged-topic-branch deletion remain just-in-time approvals by default and
  are prompt-free only under an exact, time-bounded bounded-autonomous
  authorization or selected `prototype-rapid` one-change delivery
  preapproval, after all existing gates pass.

## Capabilities

### New Capabilities

- `base-skill-contracts`: versioned result and optional configuration
  contracts that make reusable skills portable, strict, and safely
  extensible.
- `shared-skill-guardrails`: a single linked safety-policy reference and
  deterministic migration validator for every canonical base skill.

### Modified Capabilities

- `bounded-autonomous-execution`: deterministic operation-level authorization
  enforcement that narrows existing run authorization without replacing its
  authorization object or human-pause controls.

## Impact

- Primary planning source: `ai-planning/handoff-docs/base-skill-contracts-and-guardrails-proposal-handoff.md`; primary issue: https://github.com/jizzoe/joericearchitect-ai-skills/issues/63.
- Affected assets: `schemas/`, `config/`, canonical `skills/base/` sources,
  deterministic validation helpers, synthetic fixtures/evals, and the current
  autonomous runner contract.
- Affected users: authors and consumers of reusable assistant-neutral skills,
  including later product-specific adapters.
- Compatibility and migration: every existing canonical skill gains the same
  relative guardrail link; the shared directory remains non-discoverable as a
  skill. Consumers must reject unsupported schema versions and unknown
  contract keys rather than guess.
- Security: reusable assets remain product-neutral and contain no credentials,
  PII, external recipient authority, or standing autonomous permissions.
- Approval model: interactive `production-rapid` work requires a just-in-time
  approval before merge, merged-topic-branch deletion, or OpenSpec Archive;
  bounded-autonomous and `prototype-rapid` runs reduce only that routine prompt
  when the exact action, target, evidence, recovery, and expiration are
  preapproved.

## Reuse Plan

- Canonical schemas, guardrails, operation checks, validators, and fixtures
  belong in shared repository assets and accept repository paths, targets, and
  adapter names as validated inputs.
- Product paths, records, adapters, and policies may be supplied only through
  the optional product-owned configuration or a time-bounded run
  authorization; they are never embedded in canonical assets.
- Claude and Codex remain consumers of one canonical `skills/base` source.
  Any platform exposure stays a thin wrapper and does not copy guardrail or
  authorization policy.
