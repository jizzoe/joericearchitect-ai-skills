## Context

M6-C1 operationalizes the foundation dependency plan. The system must choose
work from explicit evidence: issue dependencies, lifecycle status, priority,
sequence, and shared-resource data. It must not treat the most recently edited
change as selected.

## Goals / Non-Goals

Goals:

- Classify in-flight, actionable, blocked, parallel, and next work.
- Detect unresolved blockers, missing references, dependency cycles, and
  explicit conflicts.
- Recommend next work by explicit selection, status, priority, and sequence.
- Report parallel candidates only when no dependency path or shared-resource
  conflict exists.
- Support explicit switch reporting by named change.

Non-goals:

- No live GitHub mutation from selection commands.
- No automatic switching between multiple eligible changes.
- No Project field creation or schema migration in this implementation.
- No M7 foundation hardening.

## Decisions

### DEC-001: Use fixture-shaped work items as the script contract

The planner accepts JSON work items with `change`, `status`, `sequence`,
`priority`, `blockedBy`, `sharedFiles`, `sharedState`, and `conflicts`.

Rationale: the logic stays testable and portable while GitHub adapters can
populate the shape from Project and issue APIs later.

### DEC-002: Priority applies only after dependency eligibility

Blocked work is excluded before priority and sequence sorting.

Rationale: priority must not override unresolved hard dependencies.

### DEC-003: Switching requires explicit target

The selector accepts an explicit change and reports it separately from automatic
next-work selection.

Rationale: assistants must not infer active work from recency or local file
modification order.

## Affected Files and Interfaces

- `scripts/github/lib/dependencies.mjs`
- `scripts/github/project-status.mjs`
- `scripts/github/select-next-work.mjs`
- `scripts/github/dependency-report.mjs`
- `scripts/github/test/dependencies.test.mjs`
- `scripts/github/test/work-selection.test.mjs`
- `workflows/openspec-github-lifecycle/references/work-selection.md`
- `skills/base/dependency-aware-work-selection/SKILL.md`
- `.claude/skills/dependency-aware-work-selection/SKILL.md`
- `.agents/skills/dependency-aware-work-selection/SKILL.md`
- `evals/workflows/openspec-github-lifecycle/dependency-selection/`

## Verification Strategy

- Run OpenSpec strict validation.
- Run artifact-quality and tracking validation for this change.
- Run dependency and work-selection tests for cycles, unresolved blockers,
  priority, sequence, parallel candidates, explicit switch, and task parsing.
- Run existing focused suites for intake, lifecycle, PR linkage, project status
  sync, tracking, artifact quality, and bounded autonomous behavior.
- Run security and portability review for read-only commands and fixture-based
  inputs.

## Attribution and Licensing

M6-C1 uses repository-authored Markdown, JSON, and dependency-free Node.js code.
No third-party runtime package or copied external implementation is added.

## Recovery

- Invalid or missing input files fail locally without mutation.
- Dependency cycles return complete cycle paths for correction.
- Missing references and unresolved blockers are reported in blocked reasons.
- Explicit switch with an unknown change returns `unknown-explicit-change`.

## Reuse Plan

- Canonical behavior: dependency library, CLIs, workflow reference, and base
  skill.
- Product configuration: Project fields and live issue data are supplied as
  input records.
- Claude/Codex exposure: wrappers point to canonical skill and scripts.
- Portability: tests use fixture queues and do not require GitHub credentials.

