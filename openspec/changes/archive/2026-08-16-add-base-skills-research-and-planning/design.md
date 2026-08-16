## Context

See `proposal.md` for motivation. The prerequisite change
`establish-base-skill-contracts-and-guardrails` (archived
`2026-08-12-establish-base-skill-contracts-and-guardrails`) already delivered
`skill-result-v1`, `ai-skills-config-v1`, the shared guardrail reference, and
the deterministic operation checker with its `research-read-only`,
`local-implementation`, `tracker-maintenance`, and `sdd-delivery` profiles.
`add-base-skill-authoring` (archived `2026-08-12-add-base-skill-authoring`)
already delivered the `base-skill-authoring` meta-skill that turns approved
authoring inputs into a contract package before implementation. This change
therefore only defines the observable behavior of the three research-and-
planning skills from
`ai-planning/design-briefs/base-skills-research-and-planning.md`; it does not
redefine or re-derive any prerequisite contract.

## Goals / Non-Goals

**Goals:** specify observable, evaluable requirements for
`research-topic-workflow`, `design-brief-from-research`, and
`sdd-requirements-to-plan` that a later Apply can implement without further
product decisions; keep every requirement consumable by `base-skill-authoring`
as authoring input.

**Non-Goals:** write `SKILL.md` files, progressive references, schemas,
scripts, wrappers, or evals; select exact model names (that remains a runtime,
staleness-checked lookup per `docs/research-topic-workflow-notes.md`); decide
product-specific research/design-brief/plan destinations beyond the standard
defaults already named in the design brief.

## Decisions

- **One change, three capabilities.** The three skills form one ordered
  pre-implementation path (`research-topic-workflow` ->
  `design-brief-from-research` -> `sdd-requirements-to-plan`) and share one
  contract and one guardrail source, so they are proposed together the way
  `establish-base-skill-contracts-and-guardrails` proposed
  `base-skill-contracts` and `shared-skill-guardrails` together. A separate
  change per skill was rejected: it would triple review overhead for three
  capabilities that are meaningless without each other and that make no
  independent product decision.
- **Consume, never redefine, the prerequisite foundation.** Each delta spec
  requires `skill-result-v1` output, optional `ai-skills-config-v1`
  configuration, the shared guardrail link, and the existing operation
  checker profiles. Defining parallel result/config/guardrail shapes was
  rejected because it would immediately diverge from the enforced foundation
  and duplicate `establish-base-skill-contracts-and-guardrails` decisions.
- **Bound autonomy to the two profiles the design brief names.**
  `research-topic-workflow` autonomous mode is bounded to
  `research-read-only`; `design-brief-from-research` and
  `sdd-requirements-to-plan` are interactive-by-default and, when autonomous,
  bounded to `local-implementation` (local file writes only, no tracker or
  delivery mutation). None of the three skills is granted `tracker-maintenance`
  or `sdd-delivery` operations; issue, Project, branch, and OpenSpec-artifact
  mutation stay with `github-issue-authoring`, `github-issue-to-openspec`, and
  OpenSpec Propose/Apply.
- **`sdd-requirements-to-plan` delegates live state instead of re-deriving
  it.** The plan skill's delta spec requires delegation to
  `dependency-aware-work-selection` for in-flight/blocked/next
  classification. Re-implementing that classification inside the plan skill
  was rejected: `dependency-aware-work-selection` is already the deterministic,
  read-only source of truth and duplicating it risks drift between the two
  skills' views of the same state.
- **The plan never substitutes for OpenSpec artifact generation.** The delta
  spec requires the plan to recommend Explore or Propose and name the exact
  source paths that action must read, but forbids generating
  proposal/design/spec/task content itself. This keeps the proposal authority
  boundary from `docs/sdd-workflow.md` intact: "Proposal and apply are
  separate authorization boundaries."
- **Readiness is evaluated per candidate change, not once per plan.** The
  design brief's Plan Readiness Contract and per-candidate delivery-profile
  selection are both encoded as requirements so a plan cannot mark a
  candidate Propose-ready by inheriting a plan-wide default; each candidate
  must independently satisfy outcome, scope, evidence, dependency, profile,
  and first-action fields, and missing/conflicting fields become
  `openQuestions` with `status: paused` rather than a guessed task.
- **Delivery authority is named per candidate, never implied by profile
  alone.** Mirroring `base-skill-contracts`'s existing high-impact-delivery
  requirement, the `sdd-requirements-to-plan` delta spec requires the plan to
  state explicitly whether normal interactive just-in-time approval applies
  or whether a `prototype-rapid` one-change preapproval is proposed, and
  requires that proposal to name the exact target, action, evidence, recovery
  behavior, and expiration. A plan that only selects a delivery profile
  grants no standing authority.
- **Evaluation coverage is a normative requirement, not only a task.** Each
  delta spec includes a requirement that the skill's behavior be objectively
  evaluable through the eight scenario types the design brief lists (trigger,
  non-trigger, missing input, untrusted-content handling, autonomous allowed
  action, autonomous pause, output-path safety, portable second-workspace
  behavior), matching the precedent set by the `base-skill-authoring` delta
  spec. The fixtures themselves remain implementation, tracked in
  `tasks.md`.
- **Issue linkage follows creation.** `tracking.yaml` is added only after
  `github-issue-authoring` creates or reuses the primary issue and
  `github-issue-to-openspec` validates its number and URL. That preserves the
  proposal boundary without fabricating GitHub state.

## Verification Strategy

- Validate each canonical skill's metadata and one shared-guardrail link, then
  run its synthetic scenario suite for trigger, non-trigger, missing-input,
  untrusted-content, authorization, pause, path-safety, and portability
  coverage.
- Run the shared contract validator, adapter-drift check, OpenSpec artifact
  quality validation, strict change validation, and repository-wide strict
  OpenSpec validation. Map every delta-spec requirement and scenario to the
  canonical instruction or deterministic fixture that demonstrates it.
- Review the staged diff for security boundaries, product constants, absolute
  paths, secrets, portability, attribution, and recovery behavior. A
  `production-rapid` delivery additionally requires current-head independent
  review with immutable base/head evidence before a pull request is merged.

## Attribution and Licensing

This change introduces original Markdown instructions and synthetic fixtures
only; it imports no third-party code or source text. No additional license or
attribution notice is required. Any future sourced research output belongs in
the skill's `sources.md` rather than in this reusable asset.

## Recovery

If a validation or review gate fails, preserve the branch and its evidence,
correct only the objective in-scope defect, rerun affected validation, and
obtain a fresh current-head review before delivery. If GitHub linkage or
delivery cannot run, preserve local OpenSpec artifacts and resume by
re-reading Git, issue, tracking, pull-request, and validation state; do not
fabricate a tracking record or weaken security boundaries to recover.

## Risks / Trade-offs

- [Three capabilities proposed together could be harder to review as one
  unit] → each capability keeps its own delta spec file and its own
  requirements, so review and later Apply/Verify can still address them
  individually even though they share one change.
- [Deferred issue linkage means this change has no `tracking.yaml` until a
  later step] → `proposal.md` records this explicitly as a scope decision
  rather than a gap discovered during review.
- [Bounding autonomy to `research-read-only`/`local-implementation` may be
  narrower than a future workflow wants] → widening autonomy to
  `tracker-maintenance` or `sdd-delivery` for these skills is a distinct,
  separately authorized decision, not an implicit default.
- [Delegating to `dependency-aware-work-selection` and OpenSpec Propose
  creates a hard dependency on both existing capabilities] → both are already
  implemented and archived; the delta specs cite them by name rather than
  reimplementing a fallback.

## Migration Plan

1. Review and accept this proposal, its delta specs, and `tasks.md`.
2. Author each skill's contract package with `base-skill-authoring`, reusing
   the prerequisite contracts and guardrails.
3. Implement `skills/base/research-topic-workflow/`,
   `skills/base/design-brief-from-research/`, and
   `skills/base/sdd-requirements-to-plan/`, their progressive references,
   thin Claude/Codex exposures, and `evals/skills/<skill-name>/` fixtures in
   a later, separately authorized Apply.
4. Rollback removes only the change-owned proposal artifacts; no schema,
   guardrail, or existing-skill state is touched by this change.

## Reuse Plan

Canonical assets described by these delta specs will contain no repository
owner, issue, Project, absolute path, or credential value. Product research,
design-brief, and plan destinations come from explicit inputs or the optional
`ai-skills-config-v1` `defaults`; the standard defaults are `docs/research`,
`ai-planning/design-briefs`, and `ai-planning/plans`.
