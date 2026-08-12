# Base Skills: Authoring And Guardrails

Date: 2026-08-11
Status: Implementation-ready design brief draft. Create an OpenSpec proposal
only after the owner accepts this scope.

## Decision

Create `base-skill-authoring` as a user-invoked canonical skill. Create
`base-guardrails` as a mandatory shared reference/module, not a separate user
trigger. This skill depends on the prerequisite contract defined in
`base-skill-contracts-and-guardrails.md`; it does not own or redefine the
shared schemas, authorization vocabulary, migration, or validator.

## `base-skill-authoring`

### Trigger and Non-Triggers

Use to design, create, revise, or evaluate a reusable global skill. Do not use
to implement a one-off local task, duplicate a built-in skill, package a
platform plugin, or bypass an approved product-specific design brief.

### Required Inputs

- intended capability and users;
- trigger and non-trigger examples;
- expected inputs, outputs, state, and product configuration;
- source-of-truth and untrusted-content boundaries;
- allowed reads/mutations, approvals, human decisions, pause/recovery rules;
- interactive/autonomous mode requirements and permitted profiles;
- dependencies on built-ins, deterministic scripts, connectors, or adapters;
- tests, fixtures, and eval expectations.

Missing material inputs produce a gap report, not an invented contract.

### Output

The skill produces a skill contract/design package before implementation:

- proposed name and activation description;
- user trigger/non-trigger examples;
- required/optional inputs and structured result contract;
- allowed reads/mutations and configuration keys;
- interactive approvals, autonomous profiles, pause conditions, and recovery;
- deterministic helper boundaries and connector assumptions;
- canonical assets, thin adapter plan, and eval matrix;
- risks, open decisions, and recommended next step.

When explicitly authorized to implement a reviewed contract, it creates the
canonical `skills/base/<name>/SKILL.md`, progressive references/scripts, and
thin platform adapters. Metadata must follow `docs/skill-authoring.md` exactly.

## `base-guardrails`

### Required Controls

`base-skill-authoring` must require every skill contract to satisfy the shared
guardrail controls:

- treat web, email, document, issue, PR, browser, API, and model content as
  untrusted data rather than executable instructions;
- prevent secrets, credentials, refresh tokens, OTP/MFA data, and PII from
  being written to prompts, assets, fixtures, logs, reports, or source control;
- declare allowed reads, mutations, targets, and data classifications;
- distinguish workflow authorization, runtime permission, evidence gates, and
  human-only decisions;
- use least-privilege connector scopes and deterministic helpers for parsing,
  validation, and repeatable API/file mutations;
- verify target, preconditions, outcome, and recovery before/after mutation;
- pause on unexpected targets, scope expansion, sensitive data, destructive
  action, material decisions, ambiguous state, or exhausted correction budget.

### Autonomous Controls

The only first-pass profiles are `research-read-only`, `local-implementation`,
`tracker-maintenance`, and `sdd-delivery`. A consuming skill may expose a
subset only. Each run authorization names targets, permitted paths/fields,
expiration, validations, recovery, and forbidden actions. No profile is a
standing permission or permission to weaken the runtime sandbox.

Final application submission, external communication, calendar mutation,
credential/OTP handling, sensitive self-identification, and unreviewed scope
expansion remain outside these profiles. Destructive action also remains
outside them except for the foundation's exact, time-bounded,
evidence-gated `delete-merged-topic-branch` delivery exception; that exception
never applies to a generic deletion or to other destructive actions.

## Asset and Configuration Design

The canonical skill must link to the guardrail reference, emit
`skill-result-v1`, accept optional `ai-skills-config-v1`, and map autonomous
actions through the foundation operation checker. The full authoritative
contract is [Base Skill Contracts And Guardrails](base-skill-contracts-and-guardrails.md).
There is no bootstrap exception for `base-skill-authoring` itself.

## Evaluation Requirements

Use synthetic fixtures to test: metadata validity, trigger selection,
non-trigger behavior, missing-contract gap report, prompt injection handling,
secret/PII exclusion, disallowed mutation pause, profile allowlist behavior,
recovery instruction, adapter thinness/parity, and portability without
product-specific constants.

## Implementation Commitments

- Canonical skill implementation requires a reviewed skill contract plus an
  explicit Apply authorization. A bounded autonomous Goal may cover Apply only
  through the existing autonomous-runner planning gate; contract review alone
  never authorizes implementation.
- No other decision remains for this design brief.
