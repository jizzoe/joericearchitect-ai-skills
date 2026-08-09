## Context

See `proposal.md` for motivation. The current repository has a working
OpenSpec foundation with generated Claude and Codex lifecycle actions, two
valid living specs, issue #8, draft PR #9, and a session-specific Codex
`goal` profile. It does not yet have a reusable autonomous runner, an
autonomous SDD lifecycle workflow, deterministic SDD helper commands, evals,
or generated platform exposure for those assets.

The design must preserve three boundaries:

- The existing generated OpenSpec Propose workflow remains planning-only until
  M1-C2 is implemented and explicitly authorized in a later Goal run.
- Runtime permissions are not workflow authorization. A skill may inspect and
  report sandbox, approval, credential, and tool gaps, but it must not silently
  change them.
- Canonical reusable behavior belongs in assistant-neutral assets. Claude and
  Codex adapters expose that behavior without duplicating policy.

## Goals / Non-Goals

**Goals:**

- Implement a reusable bounded autonomous execution contract for long-running
  work.
- Compose the existing OpenSpec actions into an autonomous SDD lifecycle
  adapter without copying OpenSpec artifact-generation logic.
- Add deterministic helpers for policy validation, checkpoint inspection, and
  result classification where model judgment alone is too fragile.
- Add evals and fixtures for authorization, triggers, non-triggers, human
  pauses, correction budgets, idempotent recovery, OpenSpec lifecycle gates,
  external mutation boundaries, and Claude/Codex parity.
- Generate or package equivalent Claude and Codex exposure from canonical
  source assets.
- Prove portability through a second-repository fixture and a non-OpenSpec
  generic-work fixture.

**Non-Goals:**

- Changing global Codex approval behavior, creating credentials, rotating
  secrets, or broadening token scopes.
- Replacing OpenSpec's generated `explore`, `propose`, `apply`, `verify`,
  `sync`, or `archive` workflows.
- Implementing M2-M7, marking PR #9 ready, merging, syncing living specs, or
  archiving during this proposal step.
- Building product-specific job-search, bookkeeping, deployment, or release
  behavior.
- Introducing third-party runtime dependencies unless a later Apply batch
  proves a concrete need and records attribution.

## Decisions

### DEC-001: Canonical assets are assistant-neutral

Implement the core policy under `skills/base/autonomous-goal-runner/` and the
OpenSpec adapter under `workflows/autonomous-sdd-lifecycle/`. Platform-specific
Claude and Codex exposure will be generated or packaged from those canonical
assets.

Affected paths:

```text
skills/base/autonomous-goal-runner/
workflows/autonomous-sdd-lifecycle/
.claude/skills/...
.agents/skills/...
evals/skills/autonomous-goal-runner/
evals/workflows/autonomous-sdd-lifecycle/
```

Rationale: This follows the foundation plan's source-of-truth model and avoids
manual divergence between Claude and Codex.

Alternative considered: maintain separate Claude and Codex skill copies. That
would be simpler initially, but it would make policy drift likely and would
conflict with the existing cross-assistant living spec.

### DEC-002: Authorization, permission, and evidence are separate records

The runner will model four separate concepts:

- workflow authorization from the user's run prompt or approved plan;
- runtime permission from active assistant sandbox, approvals, tools, and
  credentials;
- evidence gates from tests, validators, reviews, PR state, and OpenSpec
  status;
- human decisions that cannot be resolved from approved artifacts.

The runner may continue only when all applicable controls allow the action. It
must report a missing permission as a runtime blocker rather than rewriting the
authorization or weakening controls.

Alternative considered: treat Codex Goal mode as full workflow permission. This
was rejected because Goal mode supplies persistence and approval posture, not
product authorization or external mutation consent.

### DEC-003: OpenSpec remains the artifact generator

The autonomous SDD lifecycle will call and validate the existing OpenSpec
actions and artifact instructions. It will not implement a second proposal,
spec, design, task, sync, or archive generator.

Affected paths:

```text
workflows/autonomous-sdd-lifecycle/workflow.md
workflows/autonomous-sdd-lifecycle/references/openspec-actions.md
```

Rationale: This satisfies the built-in-first requirement and keeps schema
behavior owned by OpenSpec.

Alternative considered: create a custom schema or custom artifact generator for
autonomy metadata. The standard schema can express the current planning
artifacts through proposal, specs, design, and stable task annotations, so a
custom schema is not justified now.

### DEC-004: Deterministic helpers own machine-checkable policy

Use dependency-free Node.js ESM scripts under `scripts/sdd/` for policy and
checkpoint checks that should not rely on model judgment:

```text
scripts/sdd/validate-run-policy.mjs
scripts/sdd/classify-result.mjs
scripts/sdd/checkpoint.mjs
```

The scripts will parse structured inputs from fixtures or future workflow
state, return JSON-capable output, and avoid shell evaluation of untrusted
content. They will not call GitHub directly in M1-C2 unless a later task proves
that an existing or planned GitHub boundary cannot express the required check.

Rationale: deterministic validation is easier to test and safer for
authorization, pause classification, and idempotent resume decisions.

Alternative considered: encode all rules only in `SKILL.md`. That would be
portable but too weak for correction-budget and policy validation evidence.

### DEC-005: Batches are selected by dependency and risk, not just count

Apply will normally group three to five dependency-valid tasks, but the runner
must reduce the batch when a task crosses a high-risk boundary such as
credentials, security posture, generated platform exposure, external mutation,
or shared state. Every batch ends with focused tests, OpenSpec validation when
applicable, code/documentation review, security review, requirements mapping,
portability review, attribution review, and recovery review.

Rationale: fixed-size batches are easy to state but unsafe when the next task
changes a sensitive boundary.

Alternative considered: one task per batch. That maximizes isolation but makes
the remaining foundation too slow and does not add value for cohesive low-risk
documentation and fixture slices.

### DEC-006: Correction budgets use failure signatures

The runner will classify failures by stable signatures, such as command/check
name plus normalized error class and affected artifact. It may attempt at most
three materially different corrections for one signature. After that it records
the attempts and pauses.

Rationale: this prevents infinite retry loops while still allowing normal
objective fixes.

Alternative considered: count every failed command globally. That would block
unrelated progress too early and would make recovery brittle.

### DEC-007: External mutation boundaries are explicit and narrow

The autonomous assets will require exact repository, issue, Project, branch,
PR, Sync, Archive, and cleanup targets before external mutation. They will
allow expected mutations only when covered by the active authorization and
objective preconditions. They will stop for force-push, hard reset, repository
deletion, secret disclosure or rotation, security-control weakening,
unrelated-record mutation, or unexpected targets.

Rationale: later unattended execution must be useful without becoming
unbounded authority over GitHub or the local machine.

Alternative considered: require human approval before every external mutation.
That preserves safety but defeats the specific M1-C2 objective. The selected
approach allows only named expected and recoverable mutations.

### DEC-008: Checkpoints prefer authoritative durable state

Checkpoint logic will derive state from Git, OpenSpec status and tasks, issue
and Project state, PR state, living specs, archive paths, and validation
evidence. Transient logs may be written under `.sdd-test-output/` for rehearsal
debugging but must not become a source of truth.

Rationale: durable records survive session interruption and can be inspected by
humans and other tools.

Alternative considered: maintain a complete runner-owned state file. That risks
drift from OpenSpec and GitHub. A small transient checkpoint aid is acceptable
only when it can be reconciled against authoritative state.

### DEC-009: Security review is built into every transition

Security and abuse controls apply to planning, Apply batches, delivery, Sync,
Archive, and rehearsal. The runner must treat issue, PR, web, document, and
model-generated content as untrusted data; keep credentials out of prompts,
logs, fixtures, diffs, and checkpoints; avoid executing untrusted content as
shell input; and refuse to weaken controls to make progress.

Rationale: M1-C2 specifically enables longer runs and external mutations, so
security checks must be part of the lifecycle, not a final checklist.

Alternative considered: defer security review to M5/M7 CI hardening. That
would leave the autonomous runner unsafe during the very milestones it is
intended to execute.

### DEC-010: Rehearsal is required before M2-M7 autonomy

M1-C2 is not complete until a disposable end-to-end rehearsal demonstrates
normal completion, objective correction, human pause, idempotent resume,
external mutation boundaries, Project/PR/issue convergence, Sync, and Archive
behavior. The rehearsal requires separate owner authorization for disposable
external mutations.

Rationale: unit tests and evals are necessary but insufficient for a workflow
whose purpose is long-running lifecycle execution across tools.

Alternative considered: begin M2-M7 after unit and fixture tests only. That
would skip the first real integration proof and contradict the owner-approved
plan.

## Risks / Trade-offs

- Autonomous wording could be mistaken for unrestricted permission -> Mitigate
  by separating authorization, runtime permission, evidence, and human
  decisions in specs, skill text, workflow text, and evals.
- The runner could duplicate OpenSpec behavior -> Mitigate by delegating
  artifact generation and lifecycle instructions to OpenSpec and testing that
  the adapter composes rather than replaces those actions.
- Planning artifacts could become too large to review -> Mitigate with stable
  task IDs, dependency annotations, explicit evidence fields, and batch
  grouping that keeps Apply reviewable.
- Platform adapters could drift -> Mitigate with generated or packaged thin
  exposure and drift/parity evals for Claude and Codex.
- External mutation recovery could be ambiguous -> Mitigate with exact target
  matching, idempotent operations, dry-run or preview where practical, and
  human pauses when durable state cannot establish safe recovery.
- Rehearsal could mutate real records unexpectedly -> Mitigate with disposable
  `[SDD test]` records, owner-provided bounded authorization, exact target
  checks, and explicit exclusions for secrets, force-push, security weakening,
  repository deletion, and unrelated records.
- Deterministic helpers might grow into a competing framework -> Mitigate by
  keeping scripts narrow, dependency-free, and focused on validation,
  classification, and checkpoint inspection.

## Migration Plan

1. Land the planning artifacts for review.
2. After explicit Apply authorization, implement in the approved dependency
   batches:
   - authorization and classification;
   - generic iteration and correction loop;
   - OpenSpec action adapter;
   - GitHub delivery boundary;
   - portability, documentation, and rehearsal.
3. Generate or package Claude and Codex exposure from canonical source and run
   drift checks.
4. Run strict OpenSpec validation, focused tests, evals, security review,
   portability review, and attribution review after each batch.
5. Run the disposable end-to-end rehearsal only after owner authorization for
   the specific disposable external mutations.
6. Verify, deliver PR #9 when ready, then perform Sync and Archive as separate
   later checkpoints.

Rollback and recovery:

- Before merge, revert or edit the M1-C2 branch and rerun affected checks.
- After merge but before Sync, repair implementation through a follow-up PR;
  do not archive until verification is accepted.
- If platform exposure generation creates stale or invalid adapters, regenerate
  from canonical source or remove only the generated adapter change and rerun
  drift checks.
- If rehearsal partially mutates GitHub state, reconcile by exact issue, PR,
  branch, and Project identifiers; pause if the target or intended state is
  ambiguous.

## Reuse Plan

- Product-neutral behavior is owned by `skills/base/autonomous-goal-runner/`,
  `workflows/autonomous-sdd-lifecycle/`, and `scripts/sdd/`.
- Product configuration owns repository names, Project identity, status names,
  branch names, issue numbers, path roots, authorization text, and disposable
  rehearsal targets.
- Claude and Codex consume the same canonical behavior through generated or
  packaged thin adapters. The adapters may describe platform-specific
  invocation and discovery but must not fork authorization, correction, pause,
  recovery, or security policy.
- Portability will be tested with a second-repository fixture and a
  non-OpenSpec generic-work fixture. Both must pass without embedding this
  repository's owner, Project number, issue numbers, branch names, or another
  product's domain constants in canonical assets.
- Product-specific behavior intentionally remains in issue #8, draft PR #9,
  this OpenSpec change, the M1-C2 run authorization, and the disposable
  rehearsal records.
