## Why

Contributors currently move from an idea to an OpenSpec proposal with no
reusable, assistant-neutral path for durable research, a reviewable decision
brief, or a delivery plan. Without that path, research is ad hoc, design
decisions are undocumented, and OpenSpec Propose work starts from
under-specified requirements. `ai-planning/design-briefs/base-skills-research-and-planning.md`
defines this pre-implementation path as three canonical skills that reuse the
already-implemented `base-skill-contracts`, `shared-skill-guardrails`, and
`bounded-autonomous-execution` foundations rather than redefining them.

## What Changes

- Define the `research-topic-workflow` capability: durable, sourced research
  findings at a selected depth, written to a conventional repository path.
- Define the `design-brief-from-research` capability: one reviewable
  Markdown decision brief synthesized from durable research and project
  context, produced before OpenSpec Explore or Propose.
- Define the `sdd-requirements-to-plan` capability: a reviewable delivery
  plan with outcome-oriented milestones and candidate changes, produced
  before issue, branch, OpenSpec artifact, or implementation mutation.
- Require each skill to consume the existing `skill-result-v1` result
  contract, the optional `ai-skills-config-v1` configuration contract, the
  shared guardrail reference, and the existing bounded-autonomous-execution
  operation checker rather than defining parallel policy.
- Require each skill to define objective evaluation coverage (trigger,
  non-trigger, missing input, untrusted-content handling, autonomous allowed
  action, autonomous pause, output-path safety, and portable second-workspace
  behavior) as a normative requirement, deferring the fixtures themselves to
  implementation.

## Non-Goals

- Do not implement `SKILL.md` files, progressive references, schemas,
  scripts, thin Claude/Codex wrappers, evals, or fixtures. This change is
  proposal-only.
- Do not redefine `skill-result-v1`, `ai-skills-config-v1`, the shared
  guardrail reference, the bounded-autonomous-execution profile vocabulary,
  or the operation checker established by
  `establish-base-skill-contracts-and-guardrails`.
- Do not duplicate `dependency-aware-work-selection` live-state
  classification, or generate OpenSpec proposal/design/spec/task content on
  the plan's behalf.
- Do not create a GitHub issue, branch, commit, or pull request; do not run
  Sync or Archive; do not alter the active
  `add-authorized-degraded-independent-review` change.
- Do not replace OpenSpec Explore or Propose; all three skills produce
  inputs those actions read, not a substitute for them.

## Capabilities

### New Capabilities

- `research-topic-workflow`: turns a defined research topic into durable,
  sourced findings at a selected depth before a design or planning decision
  is made.
- `design-brief-from-research`: turns durable research and project context
  into one reviewable Markdown decision brief before OpenSpec Explore or
  Propose.
- `sdd-requirements-to-plan`: turns accepted requirements and an approved
  design brief into a reviewable delivery plan before issue, branch,
  OpenSpec artifact, or implementation mutation.

### Modified Capabilities

- None.

## Impact

- Primary planning source:
  `ai-planning/design-briefs/base-skills-research-and-planning.md`.
- Primary issue: [#86](https://github.com/jizzoe/joericearchitect-ai-skills/issues/86).
  The implementation lifecycle records its issue-to-OpenSpec linkage in
  `tracking.yaml`; the proposal-only limitation no longer applies after the
  separately authorized Apply and delivery run.
- Affected assets (future implementation only): `skills/base/research-topic-workflow/`,
  `skills/base/design-brief-from-research/`, `skills/base/sdd-requirements-to-plan/`,
  their progressive references, thin Claude/Codex exposures, and
  `evals/skills/<skill-name>/`.
- Affected users: contributors and assistants moving from an idea to an
  OpenSpec proposal, and maintainers who review research, design briefs, and
  delivery plans before authorizing implementation.
- Compatibility: three new opt-in capabilities; no existing skill, contract,
  or guardrail changes.
- Security: reusable assets remain product-neutral; autonomous execution is
  bounded to the existing `research-read-only` or `local-implementation`
  preapproval profiles with a named workspace, permitted paths, expiration,
  evidence, and pause conditions per run.

## Reuse Plan

- All three skills stay assistant-neutral under `skills/base/`; any platform
  exposure is a thin wrapper with no copied policy.
- Product paths for research, design-brief, and plan destinations come from
  explicit inputs or the optional `ai-skills-config-v1` `defaults`
  (`researchRoot`, `designBriefRoot`, `planRoot`); canonical assets embed no
  product-specific path, credential, or connector scope.
- `sdd-requirements-to-plan` reuses `dependency-aware-work-selection` for
  live state rather than re-deriving it, and reuses the existing OpenSpec
  Explore/Propose actions for artifact generation rather than duplicating
  them.
