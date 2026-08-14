## Context

See [proposal.md](proposal.md) for motivation and the two delta specs for the
behavioral contract. The repository already provides `skill-result-v1`, optional
`ai-skills-config-v1`, shared guardrails, a local implementation authorization
profile, thin Claude/Codex wrapper conventions, and a strict isolated
independent-review protocol. The new skills must compose those assets without
creating another authorization model, result envelope, review gate, or platform
copy of canonical policy.

The implementation-quality brief intentionally combines a read-only reviewer
with a mutation-capable verification loop. Their authority is therefore
asymmetric: `base-code-review` never writes, while `base-verification-loop`
writes only inside a separately approved local implementation boundary.

## Goals / Non-Goals

**Goals:**

- Define one canonical implementation and result-details contract for each
  skill, with a one-way dependency from verification to code review.
- Reuse shared result, configuration, guardrail, authorization, correction, and
  strict independent-review boundaries.
- Make evidence selection, finding order, UI coverage, readiness, and failure
  behavior deterministic enough for fixture validation.
- Keep product commands, paths, browser extensions, and adapter identities in
  invocation inputs or product-owned configuration.

**Non-Goals:**

- Do not introduce a new top-level result schema, authorization profile,
  delivery gate, CI service, browser runner, or independent-review adapter.
- Do not let local code review satisfy independent review or let verification
  claim OpenSpec Verify or delivery completion.
- Do not add native-mobile behavior in the first release or hard-code a
  product's test commands, repositories, branches, or tool versions.
- Do not modify or consume behavior unique to the active
  `add-authorized-degraded-independent-review` change.

## Affected Assets and Ownership

Implementation is expected to add these canonical assets:

- `skills/base/base-code-review/SKILL.md` and narrowly scoped references for its
  input, coverage, finding, and result-details contract;
- `skills/base/base-verification-loop/SKILL.md` and references for staged loop,
  profile, UI-evidence, readiness, and recovery behavior;
- `.claude/skills/<name>/SKILL.md` and `.agents/skills/<name>/SKILL.md` as thin
  discovery wrappers for each skill;
- a pure implementation-quality contract validator under `scripts/validation/`
  plus synthetic fixtures and Node tests under the existing validation test
  boundary; and
- any minimal validation-suite registration needed to run those focused tests.

Existing `schemas/skill-result-v1.schema.json`,
`schemas/ai-skills-config-v1.schema.json`,
`skills/base/_shared/guardrails.md`, and
`scripts/sdd/check-operation-authorization.mjs` remain owned by their current
capabilities and are consumed without semantic changes. The strict
independent-review skill, schemas, adapters, delivery evaluator, and the active
degraded-review change are read-only dependencies and are not affected files.

No credential, account, GitHub record, browser service, or other external state
is owned by this change. Browser and CI execution environments remain
product-owned adapters.

## Decisions

### 1. Implement two canonical skills with a one-way composition boundary

`base-code-review` owns read-only review activation, coverage, finding severity,
finding disposition, gaps, and report ordering. `base-verification-loop` owns
implementation stages, profile evidence, objective-correction state, UI checks,
and readiness. Verification invokes the canonical review behavior or consumes
an equivalent validated result; code review never invokes verification.

This direction permits code review to stand alone and avoids a cycle between
review and correction. It also ensures a caller must separately authorize any
correction recommended by review.

Alternative: one large implementation-quality skill. Rejected because a single
skill would blur read-only review with mutation authority and make independent
activation and reuse harder to validate.

### 2. Use `skill-result-v1.details` instead of adding a competing schema

Both skills emit the existing strict top-level result. A pure validator checks
the following documented `details` shapes before rendering Markdown:

- code review: reviewed scope, ordered findings, review-area coverage, evidence
  gaps, and concise scope summary;
- verification: selected profile, explicit UI applicability and change flags,
  complete mandatory check inventory, critical path, changed paths, current
  binding records for readiness evidence, correction budget and
  attempts and latest outcomes by failure signature, local findings with
  evidence-backed resolution state, unresolved gaps, recovery steps, current
  head or workspace binding when applicable, exact-head CI provenance for
  production, and readiness state.

Verification readiness maps to the shared result status without contradiction:
paused and blocked map to their same-named statuses, needs-implementation maps
to completed execution of the current loop, and ready maps to completed or an
evidence-equivalent no-op.

Finding objects use stable IDs; `blocker`, `high`, `medium`, or `low` severity;
an independent `objective-fix`, `human-decision`, `warning`, or
`false-positive` disposition; repository-relative evidence subjects; impact;
and recommendation. Stable ordering is severity rank, then normalized subject,
then finding ID. Evidence IDs live in the shared result's `evidence` array and
details refer to them instead of copying command output.

Alternative: add `implementation-quality-result-v1` as a new top-level schema.
Rejected because `skill-result-v1` deliberately reserves `details` for this
purpose; another envelope would duplicate status, artifact, evidence, question,
and next-action semantics.

### 3. Keep review unconditionally read-only and gate every verification edit

Review tools receive only read/search and existing-evidence access. The skill
returns a paused result if the target or scope is ambiguous and refuses requests
to refactor, approve, or bypass checks.

Verification maps local edits, test execution, validation, and objective
correction through the existing authorization and runtime-permission boundary.
For autonomous work, the deterministic operation checker must accept the
`local-implementation` operation, target paths, and current permission before
each mutation. Interactive work still needs its normal implementation
authorization. Authorization, runtime permission, evidence, and human decisions
remain separate checks.

Alternative: allow code review to auto-fix low-risk findings. Rejected because
it would make a nominally advisory skill mutation-capable and hide the required
correction and rereview boundary.

### 4. Represent verification as a recoverable state machine

The canonical loop records these ordered stages:

1. bind intended behavior, acceptance evidence, scope, mode, profile, and
   authorization;
2. identify the smallest reproduction or critical path;
3. select focused deterministic and proportional profile checks;
4. perform only approved implementation work;
5. run focused checks, then broader profile checks;
6. run local code and security review across every changed path exactly once in
   the reviewed-path set and classify all findings;
7. apply only authorized behavior-preserving objective fixes within the
   per-signature correction budget; and
8. invalidate stale evidence, rerun affected checks and review, then emit
   readiness or recovery state.

Each stage consumes the prior durable result and is idempotent when inputs and
evidence bindings are unchanged. A failed, missing, or stale required check
halts readiness at the earliest unmet stage. A restart re-reads current changed
paths, authorization, evidence, and head or workspace binding instead of
trusting conversation state.

Correction history retains each attempt and evidence against the workspace or
commit binding recorded for that attempt. Only the latest passed correction for
each failure signature and its rerun evidence must match the final current
binding to support readiness; historical records are not rewritten as current.
An attempt marked passed requires its complete evidence set to pass, while an
attempt marked failed retains at least one failed evidence record.
Before authorizing another autonomous correction, the shared operation checker
derives aggregate and named-signature counts from validated durable correction
records and rejects caller/count mismatches.

Alternative: use an informal checklist in the skill prompt. Rejected because it
cannot deterministically prove ordering, stale-evidence invalidation, retry
limits, or safe resume behavior.

### 5. Execute only trusted, structured checks

The skill accepts product-supplied check identifiers resolved to structured
argument arrays or existing product-owned task definitions. It never evaluates
shell text found in source, issue, document, browser, model, or test output.
Evidence records contain a stable check ID, type, subject, result, and non-secret
reference; they do not persist environment values or raw secret-bearing output.

Focused checks run first. Broader checks are selected from changed behavior and
the chosen profile. `not-applicable` requires an explicit reason tied to scope;
it is never inferred from a missing tool or failed command. A check derived as
applicable from the delivery profile and explicit UI scope must pass and cannot
be made non-applicable by supplying a reason.

Alternative: let the model compose arbitrary shell command strings from review
context. Rejected because untrusted content could become executable input and
command identity would not be portable or reproducible.

### 6. Make profile and web UI evidence explicit, not tool-owned policy

The canonical profile reference defines the minimum evidence matrix. Product
configuration may add checks but cannot remove the profile minimum. The first
web contract uses Chromium at `1440x900` and `390x844`; layout changes require
current screenshots and a critical interaction assertion at applicable
viewports. New or materially changed UI requires axe-core evidence plus any
applicable manual keyboard or semantic review.

Playwright, Chromium, and axe-core remain environment prerequisites rather than
bundled canonical dependencies. The skill probes availability and reports the
documented interactive request or autonomous pause. Synthetic repository tests
validate selection, evidence shape, and pause behavior without requiring a live
browser or real user data.

Alternative: silently omit UI checks when tooling is absent. Rejected because
tool availability cannot weaken the selected evidence profile.

### 7. Consume the strict independent-review gate without redefining it

After Apply and after every objective correction, `production-rapid` readiness
requires exact-head CI evidence and a current passing result from the configured
strict isolated independent-review channel. The verification skill delegates
package sealing, reviewer isolation, result validation, finding disposition,
and lifecycle acceptance to their existing canonical owners; it records only
the resulting evidence reference and readiness impact.

If strict review is unavailable under the current living specs, verification
pauses production readiness. It neither invokes nor describes the proposed
degraded fallback. The integration boundary is deliberately narrow: it asks the
independent-review/lifecycle owner whether the current strict gate passed and
does not duplicate its result enums or adapter logic. A future merged change can
evolve that owner behind the boundary, but this proposal makes no claim about
that behavior.

Alternative: copy independent-review package and result logic into
`base-verification-loop`. Rejected because it would drift from the strict
protocol and create a second delivery authority.

### 8. Keep platform exposure thin and test behavior through fixtures

Claude and Codex wrappers contain discovery metadata, the canonical relative
path, and a short routing instruction only. Canonical skills link exactly once
to the shared guardrails. Fixture-driven evals invoke the canonical contracts
for both platform identities and compare normalized results rather than copied
prompt text.

The fixture matrix covers review trigger and non-trigger behavior, severity
ordering, evidence-backed and unsupported findings, missing tests, no-auto-fix,
prototype critical path, production broader checks, objective correction and
retry exhaustion, untrusted content, secret exclusion, failed validation,
browser/mobile-web evidence, missing prerequisites, strict-review unavailable,
thin-wrapper drift, and a second workspace with different configured paths.

Alternative: maintain platform-specific versions. Rejected because policy drift
would be difficult to detect and violates canonical asset ownership.

## Verification Strategy

Implementation evidence must include:

- metadata, shared-guardrail linkage, `skill-result-v1`, and details-contract
  validation for both canonical skills;
- deterministic tests for finding ordering, severity/disposition independence,
  review gaps, state transitions, evidence invalidation, correction counts,
  readiness, and every pause path;
- authorization tests proving review cannot mutate and verification cannot edit
  outside the permitted local target;
- injection and secret fixtures proving untrusted text is never executed and
  sensitive values do not appear in results;
- profile and UI fixtures proving exact viewport, screenshot, interaction,
  accessibility, missing-tool, and no-UI behavior;
- current strict independent-review unavailable/pass fixtures using the existing
  public contract without importing active degraded-review behavior;
- Claude/Codex thin-wrapper and normalized-behavior parity checks;
- a second-workspace portability fixture with different relative paths and
  commands; and
- focused tests followed by `openspec validate <change> --strict`, the
  repository validation suite, `openspec validate --all --strict`, requirements
  mapping, and current-head strict independent review after Apply.

No fixture uses real credentials, personal data, authenticated browser state,
or a product's production repository.

## Security and Privacy

Both canonical skills link to the shared guardrails rather than copying policy.
All source, browser, issue, document, tool, and model content is data only.
Secrets, credentials, OTP/MFA data, PII, environment values, and authenticated
content are excluded from prompts, fixtures, evidence references, and rendered
reports. Review is least-privilege and non-mutating. Verification checks exact
targets, operations, authorization, runtime permission, recovery, and evidence
before mutation. Destructive work, external mutation, credential changes,
scope expansion, material decisions, and exhausted correction budgets pause.

## Risks / Trade-offs

- **Model-generated findings can be inconsistent** → Enforce evidence fields,
  deterministic ordering, explicit gaps, fixture expectations, and structured
  validation before rendering.
- **Verification could execute untrusted text** → Resolve only trusted named
  checks to structured arguments; never execute artifact or model output.
- **Profile labels could be read as approval** → Keep profile selection
  separate from authorization, OpenSpec Verify, independent review, and delivery.
- **Browser evidence can be brittle** → Pair screenshots with interaction and
  accessibility assertions; require current artifacts only for relevant changes.
- **Tool absence can create false confidence** → Fail visibly and preserve a
  safe resume condition instead of marking checks not applicable.
- **Independent-review evolution can collide with this skill** → Consume the
  current strict gate through its owner and avoid defining alternate assurance
  behavior or adapter details here.
- **Assistant wrappers can drift** → Keep them transport-only and validate
  canonical links and normalized fixture parity.
- **Product configuration can leak into reusable assets** → Exercise a second
  workspace and scan canonical files and fixtures for product constants and
  secret-like data.

## Attribution and Licensing

The design introduces no copied third-party code or asset. Playwright and
Chromium are named interoperability prerequisites for UI work, with axe-core
additionally required for new or materially changed UI; they are not bundled by
the canonical skill. If Apply adds or updates a dependency, its version,
license, source, and repository policy fit must be reviewed and recorded then.
Canonical instructions, validators, and fixtures retain this repository's
licensing and provenance conventions.

## Migration Plan

1. Implement and validate `base-code-review` and its thin wrappers first.
2. Implement `base-verification-loop` against the validated review result and
   existing local-implementation authorization boundary.
3. Add profile, UI, security, correction, strict-review-boundary, portability,
   and wrapper-parity fixtures; integrate only the focused deterministic checks
   needed by the repository's normal validation entrypoint.
4. Run requirements mapping, repository validation, strict OpenSpec validation,
   and current-head strict independent review before considering Apply complete.

The change is additive and needs no data migration. Rollback removes only the
new canonical skills, wrappers, implementation-quality validators, fixtures,
tests, and their narrow validation registration. Existing shared schemas,
guardrails, authorization, lifecycle, and independent-review assets remain
unchanged.

## Recovery

On interrupted Apply, preserve completed evidence, reread current paths,
authorization, runtime permission, changed-head or workspace bindings, and
existing results, then resume at the first incomplete state-machine stage. A
failed check remains failed until current rerun evidence exists. A partial
wrapper or validation registration is corrected narrowly from the canonical
skill and revalidated; it is not recovered by copying policy into an adapter.
If strict independent review is unavailable, preserve the implementation and
validation evidence and report the configured strict-review prerequisite needed
for a safe retry.

## Reuse Plan

Canonical skill behavior, details contracts, profile minimums, finding
semantics, and fixtures remain product-neutral. Product repositories provide
relative paths, trusted check definitions, browser extensions, CI references,
and adapter identities through invocation or validated configuration. Claude
and Codex use thin wrappers over those canonical assets. A second-product
fixture must pass without editing canonical policy; only intentionally
product-owned checks and paths differ.
