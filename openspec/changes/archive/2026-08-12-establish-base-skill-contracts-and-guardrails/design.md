## Context

See [proposal.md](proposal.md) for motivation. The repository has canonical
assistant-neutral skills under `skills/base/`, a current metadata validator,
and a bounded autonomous runner with authorization-policy, run-policy, result,
checkpoint, and adapter-drift helpers. It does not yet provide a shared result
schema, product configuration contract, centralized guardrail reference, or
operation-level authorization checker. This change is a prerequisite for all
later base-skill changes and uses the `production-rapid` delivery profile.

## Goals / Non-Goals

**Goals:**

- Add strict, portable contracts and deterministic validation interfaces that
  later canonical skills can consume without redefining them.
- Make the shared guardrail source mandatory and mechanically verifiable for
  every canonical base skill.
- Narrow bounded-autonomous execution through deterministic checks without
  changing the runner's existing authorization object or runtime permission
  boundary.
- Prove behavior with synthetic fixtures, including a second workspace.

**Non-Goals:**

- Create any of the later user-invoked base skills or alter product workflows.
- Select a real connector, persist authorization, widen sandbox permissions, or
  create credentials.
- Create a generic parser or executor for untrusted content.

## Decisions

### Use JSON Schema draft 2020-12 as the contract boundary

Add `schemas/skill-result-v1.schema.json` and
`schemas/ai-skills-config-v1.schema.json`, each with a strict version-one
envelope. Implement local validation behind one deterministic helper/command
that returns stable issue codes and structured blocked output for unsupported
versions. Validate relative paths semantically after schema shape validation so
absolute and upward traversal are rejected consistently.

The result schema will make required common fields closed, permit only the
optional `details` object as a skill-specific extension, and require reports to
render from the same result object. The configuration schema permits only
non-secret defaults, named paths, adapter capability declarations, policy names,
and flags. A missing configuration file remains valid; callers then require
explicit destinations.

Alternatives considered:

- Unversioned Markdown conventions would be easy to start but cannot give
  deterministic compatibility or unknown-key behavior.
- Permissive JSON with arbitrary common fields would make consumers infer
  semantics and leak product-specific behavior.
- A required global config would make portable use unnecessarily dependent on
  one repository layout.

### Centralize guardrails and verify a constrained relative link

Create `skills/base/_shared/guardrails.md` without `SKILL.md`. Dynamically
discover canonical `skills/base/*/SKILL.md` sources and require each to have
one `## Guardrails` section containing exactly one relative Markdown link to
the shared reference. The validator will reject missing, malformed, duplicate,
broken, or copied guardrail content, expose deterministic rule IDs, and have no
baseline exception.

The shared reference defines the policy content: untrusted-data handling,
secret/PII exclusion, authorization versus runtime permission versus evidence
gates, least privilege, pre/post-mutation checks and recovery, and pause
conditions. Platform wrappers reference their canonicals rather than copying
this policy.

Alternatives considered:

- Per-skill guardrail text causes inevitable drift and makes policy review
  incomplete.
- An allowlist of current skills would miss new canonicals and grandfather
  existing gaps.
- A discoverable `base-guardrails` skill conflicts with the approved design:
  this is a mandatory module, not a new user trigger.

### Layer operation checks over existing run authorization

Retain `autonomous-goal-runner` as the only run-authorization model. Add a
deterministic operation checker called before each requested action. It
evaluates a fixed profile operation allowlist, `allowedMutations`, a typed
target match (workspace path, exact record, or configured adapter), configured
adapter capability, active runtime permission, expiration, and the existing
three-attempt correction policy. The checker returns an allow or structured
pause result; it never requests, creates, or broadens permissions.

Use the same deterministic boundary evaluation for a recorded interactive
`prototype-rapid` one-change delivery preapproval, but do not treat that record
as an autonomous-runner invocation. Its evaluator accepts only the named
high-impact transition and the required target, evidence, recovery, and
expiration fields; it returns a pause for an omitted or mismatched field.

Define four first-release profiles: `research-read-only`,
`local-implementation`, `tracker-maintenance`, and `sdd-delivery`. The profile
definitions are fixed policy, while real paths, records, adapter names, and
run expiration stay in product-owned config or per-run authorization. Reserved
external send, calendar update, submission, release, and deployment always
pause in this release. Merge, OpenSpec Archive, and merged-topic-branch
deletion remain just-in-time approvals for interactive `production-rapid`
work. The only prompt-reduction exceptions are an active bounded autonomous
authorization or selected `prototype-rapid` one-change delivery that names the
exact transition, target, evidence, recovery behavior, and expiration. The
prototype preapproval is a recorded interactive delivery authorization using
those same required fields; it is not a standing grant or an autonomous-runner
invocation. Both exceptions preserve every lifecycle, adapter-capability, and
runtime-permission gate.

Alternatives considered:

- Adding a second authorization object would split durable authority and
  violate the current runner contract for autonomous work; a prototype
  preapproval is instead a narrowly typed interactive delivery record.
- Matching free-form shell text cannot safely establish an operation class or
  target.
- Treating profile selection as unrestricted consent would weaken runtime and
  mandatory human gates.

### Use deterministic synthetic evals and integration wiring

Place valid/invalid schema, guardrail-link, operation-check, and portability
fixtures under a focused `evals/skills/` area. Add Node tests that exercise
every enum, path and unknown-key rejection, missing-config explicit-input
behavior, profile allow/deny decisions, unauthorized targets, adapter mismatch,
expiry, reserved operations, and correction-budget pause. Wire the new
validators into the repository's normal validation boundary after inspecting
existing ownership, so local and CI behavior invoke the same checks.

No external connectors, accounts, production paths, or sensitive values appear
in fixtures. Schema implementation uses only repository-supported Node tooling
or a reviewed, license-compatible validator dependency selected during Apply.

Implementation boundary: repository validation uses standalone Node ESM scripts,
focused `node --test` files, and the `openspec-validate.yml` workflow; there is
no package manifest or general test runner. New reusable validation functions
will live under `scripts/validation/`, runner-specific operation checks under
`scripts/sdd/`, focused fixtures under `evals/skills/`, and the OpenSpec CI
workflow will invoke the same standalone validators and focused tests as local
verification. Existing `validate-run-policy.mjs` remains the canonical
authorization-envelope validator and is extended rather than replaced.

## Affected Boundaries

- New shared assets: `schemas/`, `skills/base/_shared/`, deterministic
  validation helpers, and synthetic fixtures/evals.
- Migrated assets: every current canonical `skills/base/*/SKILL.md`; their
  substantive behavior and thin platform wrappers remain unchanged.
- Modified integration: `skills/base/autonomous-goal-runner/` and its current
  deterministic helper/test surfaces.
- External state: none. The design validates declared adapter capabilities but
  neither invokes a connector nor changes runtime sandbox/approval settings.

## Risks / Trade-offs

- [A strict schema blocks a legitimate later field] → confine common-field
  additions to a new schema version and use `details` for scoped skill data.
- [A link validator rejects harmless Markdown variation] → define and test the
  exact accepted structure with readable diagnostics before wiring it broadly.
- [Operation vocabulary is too narrow for a later domain skill] → add only an
  evidence-backed vocabulary/profile extension through a separate approved
  change; do not fall back to free-form operations.
- [Existing runner behavior regresses] → retain its authorization object and
  fixture suite, then add focused regression tests for the checker boundary.
- [Fixtures accidentally include sensitive/product data] → use synthetic
  names/paths only and run secret/product-constant review before delivery.

## Security

The implementation accepts only structured, locally validated inputs. It does
not execute skill, issue, pull-request, web, or model-generated content; it
rejects secret-like configuration values and unsafe paths; and it preserves
explicit authorization, runtime-permission, evidence, and recovery gates for
every higher-impact lifecycle transition.

## Attribution and Licensing

This change uses repository-authored JSON Schema documents, Node standard
library modules, and synthetic fixtures only. It introduces no third-party
runtime dependency, copied external policy text, or new license obligation.

## Recovery

If a schema, guardrail migration, or operation-check regression is found,
revert the affected repository-local assets as one coherent correction and
rerun the focused validation suite plus strict OpenSpec validation. Never
recover by weakening authorization, sandbox, credential, or lifecycle gates.

## Migration Plan

1. Inventory canonical base skills and existing autonomous-runner interfaces.
2. Add schemas, local validation, and valid/invalid fixtures before migrating
   consumers.
3. Add the shared reference and migrate every discovered canonical skill in one
   change; enable link validation only after all are conforming.
4. Add the operation checker and profiles as a layer over the existing runner;
   prove current authorization, correction, and runtime-permission behavior
   remains intact.
5. Run focused tests, normal validation, strict change validation, all-change
   strict validation, portability review, secret scan, and diff review.

Rollback is code/configuration-local: revert the new assets and canonical link
migration together, then restore the prior runner helper behavior. No external
state or standing permission is created, so rollback does not mutate accounts,
records, or credentials.

## Verification Strategy

- Unit fixtures validate all schema enums, required values, unknown keys,
  unsafe paths, duplicate IDs/operations, unsupported versions, and missing
  optional config behavior.
- Guardrail fixtures validate dynamic discovery plus valid, missing, malformed,
  duplicate, copied, and broken-link outcomes.
- Operation fixtures cover each profile's allow and deny cases, target and
  adapter mismatch, runtime denial, expiration, reserved external actions,
  interactive production just-in-time approval, bounded-autonomous/prototype
  exact delivery authorization, and three-attempt correction pause.
- Integration checks prove every current canonical skill is migrated, existing
  runner tests still pass, wrappers remain thin, and a second workspace uses
  different configured paths without canonical edits.
- Delivery evidence includes focused Node tests, normal repository validation,
  `openspec validate establish-base-skill-contracts-and-guardrails --strict`,
  `openspec validate --all --strict`, `git diff --check`, reviewed diffs, and
  secret/product-constant inspection.

## Reuse Plan

- Canonical schemas, shared policy, checker, validators, tests, and fixtures
  remain assistant-neutral under repository-controlled paths.
- Per-product paths, records, adapters, policy values, and time-bounded
  authorizations remain validated inputs; no product constants are committed to
  global assets.
- Claude/Codex wrappers remain thin canonically pointing adapters. A second
  product/workspace fixture verifies the shared assets require no repository
  rename or personal path.
- Product-specific adapter calls and higher-impact operation profiles are
  intentionally deferred to their domain changes.
