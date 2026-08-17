# Bounded Autonomous SDD Execution Implementation Plan

Date: 2026-08-09
Status: Proposed
Primary change: `enable-bounded-autonomous-sdd-execution`
Planning identifier: `M1-C2`
Sequence: `102`
Depends on: M1-C1
Related plans:

- [OpenSpec SDD Foundation Implementation Plan](openspec-sdd-foundation-implementation-plan.md)
- [OpenSpec SDD Foundation Dependency Plan](openspec-sdd-foundation-dependency-plan.md)
- [Codex Goal Autonomy Prerequisites](../codex-goal-autonomy-prerequisites-implementation-plan.md)

## 1. Outcome

Create a portable, bounded autonomous execution capability that can run a
pre-authorized queue of SDD changes from planning through archival while
preserving small reviewable steps, objective evidence, automatic defect
correction, independent reviews, recovery checkpoints, and human control over
material or destructive decisions.

The capability SHALL support:

- A generic long-running work loop usable outside OpenSpec.
- An OpenSpec adapter for Explore, Propose, Apply, Verify, Sync, and Archive.
- Claude and Codex exposure from one assistant-neutral canonical source.
- Explicit per-run authorization rather than permanent elevated authority.
- Automated review and repair after every planning action and implementation
  batch.
- Idempotent resumption after interruption, timeout, denial, or partial failure.

## 2. Problem

The current foundation supports reliable individual OpenSpec actions but cannot
complete an unattended multi-change lifecycle because:

- Propose requires a later explicit Apply request.
- Apply pauses on any error rather than retrying objective corrections.
- Archive always requests a user choice when delta specs exist.
- Work selection cannot silently choose or switch changes.
- First live external mutation requires immediate authorization.
- Runtime permissions, workflow authorization, and destructive-action approval
  are not modeled as separate concerns.
- Iterative code and security reviews are established by session practice but
  are not yet a durable, reusable workflow contract.

## 3. Scope

### In Scope

- OpenSpec proposal, delta specifications, design, and tasks for M1-C2.
- A canonical global `autonomous-goal-runner` skill or equivalent workflow.
- A canonical OpenSpec lifecycle adapter that composes built-in OpenSpec
  behavior without copying OpenSpec artifact logic.
- Run authorization, change queue, checkpoints, retries, reviews, correction,
  delivery, Sync, and Archive policy.
- Deterministic helpers for checkpoint state and validation where needed.
- Evals for triggers, non-triggers, pause conditions, recovery, and portability.
- Thin generated or packaged exposure for Claude and Codex.
- Contributor and recovery documentation.

### Out of Scope

- Removing the sandbox or disabling all approvals.
- Automatically resolving missing product, legal, security, or governance
  decisions.
- Bypassing failed tests, reviews, CI, OpenSpec validation, or branch policy.
- Force-pushing shared branches, hard resets, repository deletion, credential
  rotation, or security weakening.
- Treating self-review as proof when independent automated or deterministic
  evidence is available.
- Product-specific job-search, bookkeeping, or deployment-domain behavior.
- A custom OpenSpec schema unless the standard schema demonstrably cannot
  express the required artifacts and tasks.

## 4. Capability Model

### Capability A: Bounded Autonomous Work Execution

Define assistant-neutral behavior for:

- Explicit run authorization and expiration.
- Ordered work queues and dependency-aware selection.
- Small bounded batches.
- Checkpointing and idempotent resume.
- Objective correction loops.
- Human-decision classification.
- External side-effect boundaries.
- Completion and blocked-state evidence.

This capability must be reusable by future job-search, research, document,
release, and other long-running workflows.

### Capability B: Autonomous SDD Lifecycle

Modify the living `sdd-lifecycle` behavior so that one explicit bounded Goal
authorization may cover multiple lifecycle actions only when:

- The exact changes or deterministic selection policy are stated.
- Automated planning review finds no material unresolved decision.
- Every transition's prerequisites and evidence pass.
- The runner reports each transition and retains recovery checkpoints.
- Human-only and destructive gates remain active.

### Capability C: Cross-Assistant Autonomous Exposure

Extend `cross-assistant-assets` behavior so Claude and Codex expose equivalent
autonomous-runner semantics from one canonical asset, while platform permission
mechanisms remain adapters rather than duplicated policy.

## 5. Resolved Design Decisions

### AUTO-DEC-001: Authorization Is Not Permission

The runner SHALL distinguish:

- **Workflow authorization:** what the owner asked this run to accomplish.
- **Runtime permission:** what the active Codex/Claude sandbox and tools allow.
- **Evidence gate:** what tests and validations must pass.
- **Human decision:** what cannot be decided from approved artifacts.

A skill SHALL NOT change sandbox or approval settings. It SHALL inspect and
report insufficient permissions and provide a safe resume path.

### AUTO-DEC-002: One Goal May Authorize Later Apply

The existing planning/implementation separation remains. A bounded Goal may
continue from Propose to Apply without a new interactive message only after a
separate automated planning review confirms:

- Proposal scope and non-goals are explicit.
- Every behavioral requirement has verifiable scenarios.
- Design decisions, dependencies, external state, security, recovery,
  attribution, and portability are addressed.
- Tasks have stable IDs, evidence, dependencies, and reviewable batch size.
- No unresolved decision would materially change behavior or architecture.
- The initial Goal explicitly authorized this transition policy.

Failure of this gate pauses before implementation. It never silently edits the
plan to make itself pass when human judgment is required.

### AUTO-DEC-003: Deterministic Ordered Queue

The Goal SHALL explicitly provide either:

- A named ordered list of changes, or
- A deterministic policy based on approved dependency, priority, and sequence
  data.

The runner may automatically select the next uniquely eligible item. It pauses
when multiple choices remain materially equivalent or shared-resource analysis
cannot establish safety.

### AUTO-DEC-004: Small Iterative Batches

Implementation SHALL run in batches of approximately three to five cohesive
tasks, reduced when risk or shared-state impact is high. Each batch must be
independently reviewable and recoverable.

After every batch, the runner SHALL:

1. Run task-specific tests and validation.
2. Run the standing code/documentation review.
3. Run the proportional security and supply-chain review.
4. Check requirements, scenarios, design, dependency, portability,
   attribution, and recovery evidence affected by the batch.
5. Correct objective, narrowly scoped defects.
6. Re-run every affected check.
7. Mark tasks complete only after evidence passes.
8. Commit a checkpoint only when the batch is coherent and clean.

### AUTO-DEC-005: Bounded Automatic Correction

The runner SHALL diagnose and correct failures that have one evidence-backed,
behavior-preserving resolution. Examples include formatting, lint, type,
deterministic test, stale generated exposure, broken internal link, missing
scenario test, accidental secret-like fixture, and narrowly scoped code-review
findings.

It SHALL attempt at most three materially different corrections for the same
failure signature. It then records the attempts and pauses as blocked rather
than looping or weakening a check.

Corrections requiring a new requirement, changed observable behavior, material
architecture choice, data loss, broader credential access, or governance change
require human judgment.

### AUTO-DEC-006: Independent Review Where Available

Self-review is necessary but correlated. The runner SHALL prefer:

- Deterministic tests, linters, validators, and evals.
- Codex Auto-review for eligible permission escalation.
- A separate code/security reviewer agent or non-interactive review when
  available.
- CI evidence on the exact PR head.

Review findings SHALL be classified as objective-fix, human-decision,
non-blocking warning, or false positive with evidence.

### AUTO-DEC-007: Expected External Mutations May Be Pre-authorized

The Goal authorization may cover named, expected lifecycle mutations such as:

- Creating or updating the specified issue and Project item.
- Creating topic branches and commits.
- Pushing topic branches and creating PRs.
- Marking a draft PR ready after formal verification.
- Squash-merging a clean, linked PR after required checks pass.
- Closing the linked issue through the PR contract.
- Setting the Project item to the documented lifecycle state.
- Deleting the merged topic branch.
- Committing, delivering, and archiving synchronized specifications.

The runner pauses for unexpected targets, unrelated records, branch divergence,
force push, overwrite, deletion beyond merged topic branches, credential or
permission changes, required-check changes, or uncertain mutation scope.

### AUTO-DEC-008: Archive Auto-selection Is Evidence-Based

The runner may select `Archive now` without a new human response only when:

- All artifacts and tasks are complete.
- Formal verification has no critical issues.
- Accepted warnings are documented by policy or the Goal authorization.
- The implementation PR is merged.
- The issue is closed and Project item is `Done`.
- Every delta capability exactly matches its living spec.
- Repeat Sync is a no-op.
- The archive target is available and the move is content-preserving.

Any incomplete, divergent, ambiguous, or conflicting state pauses before the
move.

### AUTO-DEC-009: Checkpoints Are Durable and Resumable

Checkpoint state SHALL be derived from authoritative records where possible:

- Git commits and PR state for implementation delivery.
- OpenSpec status and tasks for artifact and implementation progress.
- GitHub issue and Project state for lifecycle progress.
- Living-spec comparison for Sync state.
- Archived paths for Archive state.

Transient runner logs MAY live under `.sdd-test-output/` and SHALL NOT become a
competing source of truth. Re-running any completed transition must converge to
a no-op or report drift.

## 6. OpenSpec Action Validation Matrix

### Explore

Before:

- Confirm repository root, clean/known worktree state, and selected product
  boundary.
- Inventory existing requirements, research, issues, and active changes.
- Identify unknowns and external-state boundaries.

After:

- Confirm no implementation or external mutation occurred unless explicitly
  authorized.
- Record material decisions and unresolved questions without duplicating
  authoritative requirements.
- Stop only when exploration exposes a human decision; otherwise continue to
  the authorized planning action.

### Propose

Before:

- Select the issue and semantic OpenSpec change explicitly.
- Confirm dependencies are complete and shared resources are safe.
- Run OpenSpec status and load the artifact instructions from disk.

After artifact generation:

- Run strict OpenSpec validation.
- Verify proposal scope, non-goals, issue linkage, affected users/assets,
  compatibility, migration, and Reuse Plan.
- Verify every requirement uses normative observable behavior and has positive,
  negative, failure, retry/no-op, and stop scenarios where relevant.
- Verify design ownership, affected paths, dependencies, credentials, external
  state, security, attribution, portability, alternatives, recovery, and
  verification evidence.
- Verify stable task IDs, dependency annotations, batch boundaries, and stated
  evidence.
- Confirm planning generated no product implementation changes.
- Run an independent planning review and automatically correct objective
  artifact defects.
- Re-run validation and review until clean or blocked.

### Apply

Before each batch:

- Explicitly select the change.
- Run status and apply instructions.
- Read every returned context file from disk.
- Confirm task dependencies, expected files, current diff, and recovery point.

After each task or cohesive batch:

- Run focused unit, integration, eval, schema, formatting, lint, and type checks
  applicable to the changed behavior.
- Run OpenSpec strict validation when artifacts or governed behavior changed.
- Map changed behavior to requirements and scenarios.
- Review scope, maintainability, duplicated logic, failure handling, recovery,
  documentation, secrets, untrusted input, least privilege, action pinning,
  licensing, attribution, and Claude/Codex portability.
- Inspect the diff for unrelated files and generated/user-authored ownership.
- Run independent code/security review where available.
- Apply objective corrections and rerun affected checks.
- Mark tasks complete only after their evidence exists.
- Commit a coherent checkpoint; do not commit known broken state.

### Verify

- Read all context returned by apply instructions.
- Score completeness, correctness, and coherence.
- Verify every task, requirement, scenario, design decision, test/eval,
  security control, attribution record, recovery path, and portability claim.
- Validate documentation links, generated provenance, stale-discovery recovery,
  whitespace, secret patterns, and unrelated changes.
- Compare GitHub issue, Project, branch, and PR linkage with repository state.
- Run the standing automatic code and security review.
- Correct objective defects, rerun affected checks, and regenerate the report.
- Pause for behavior-changing or judgment-based corrections.
- Do not claim readiness with critical, unknown, or unevidenced state.

### Delivery

- Confirm the PR targets the approved base and formally links/closes the primary
  issue only when merge means delivery.
- Confirm the exact verified head commit is present.
- Require applicable CI, OpenSpec, linkage, test, eval, and security checks.
- Review all comments and findings; correct objective issues and rerun checks.
- Squash-merge only when clean, mergeable, and authorized.
- Verify the PR merged, issue closed, Project status converged, remote topic
  branch was deleted, and the default branch contains the delivery commit.

### Sync

- Start from the delivered default branch on a short-lived follow-up branch.
- Use only `artifactPaths.specs.existingOutputPaths` as delta sources.
- Fetch artifact instructions once and read every delta and living spec.
- Intelligently merge without delta-operation headers or loss of unaffected
  requirements/scenarios.
- Run `openspec validate --specs` and strict change validation.
- Prove every delta operation is reflected in each living spec.
- Prove repeat Sync is a no-op.
- Run documentation, scope, whitespace, secret, and portability review.
- Deliver the Sync checkpoint through a clean PR before Archive.

### Archive

- Confirm all artifacts/tasks complete and formal verification acceptable.
- Confirm implementation and Sync delivery are merged.
- Confirm issue closed and Project `Done`.
- Recompare every delta capability with living specs.
- Confirm archive target does not exist.
- Move the full change bundle with provenance and verification evidence intact.
- Run `openspec validate --specs`, strict applicable validation, and confirm the
  active change list no longer contains the change.
- Verify a pure content-preserving move, clean whitespace, no secrets, and no
  living-spec edits.
- Deliver the Archive checkpoint through a clean PR and verify branch cleanup.

## 7. Human Pause Classification

Pause only for:

- Missing or conflicting observable requirements.
- A choice that changes approved behavior, architecture, compatibility, data
  ownership, security posture, licensing, or governance.
- Destructive or irreversible actions outside explicitly authorized lifecycle
  transitions.
- New credentials, broader token scopes, secret rotation, or access-control
  changes.
- Legal, contractual, employment, financial, medical, demographic, or identity
  assertions that cannot be derived from approved facts.
- Unresolved dependency or shared-state conflict.
- External system ambiguity, unexpected target, or partial mutation that cannot
  be repaired idempotently.
- Three unsuccessful materially different correction attempts for the same
  failure.
- Tool, service, authentication, rate-limit, or environment failure that
  prevents meaningful safe progress.

Do not pause merely for:

- Formatting, lint, deterministic test, type, link, or schema failures with an
  evidence-backed correction.
- Narrow code-review findings that preserve approved behavior.
- Expected branch, issue, Project, PR, Sync, or Archive transitions explicitly
  authorized by the Goal and verified by preconditions.
- Warnings already covered by a documented acceptance policy.

## 8. Proposed Implementation Assets

Final paths may be refined during design, but ownership should remain:

```text
skills/base/autonomous-goal-runner/
├── SKILL.md
└── references/
    ├── authorization-policy.md
    ├── correction-loop.md
    ├── human-decision-classification.md
    └── review-matrix.md

workflows/autonomous-sdd-lifecycle/
├── workflow.md
└── references/
    ├── openspec-actions.md
    ├── delivery.md
    └── recovery.md

scripts/sdd/
├── checkpoint.mjs
├── classify-result.mjs
└── validate-run-policy.mjs

evals/skills/autonomous-goal-runner/
evals/workflows/autonomous-sdd-lifecycle/
```

Platform exposure SHALL be generated or packaged as thin adapters under the
established Claude and Codex locations. Canonical policy must not be copied
manually into both platforms.

## 9. Safe Implementation Batches

### Batch 1: Authorization and Classification

- Specify the run authorization contract.
- Implement human-decision and destructive-action classification.
- Implement policy validation and no-op checkpoint schema.
- Add unit tests and trigger/non-trigger evals.

### Batch 2: Generic Iteration and Correction Loop

- Implement bounded task batches and checkpoint/resume behavior.
- Implement review result classification and three-attempt correction limit.
- Add interruption, repeated-failure, and stale-checkpoint tests.
- Review for prompt injection, secret handling, and arbitrary command risk.

### Batch 3: OpenSpec Action Adapter

- Compose Explore, Propose, Apply, Verify, Sync, and Archive contracts.
- Implement planning-review and transition gates.
- Add fixtures for complete, incomplete, ambiguous, divergent, and no-op state.
- Verify standard-schema compatibility.

### Batch 4: GitHub Delivery Adapter

- Implement expected issue, Project, branch, PR, merge, and cleanup transitions
  through deterministic existing or planned GitHub boundaries.
- Add dry-run, idempotency, unauthorized, partial-failure, and untrusted-content
  tests.
- Verify no token or external content becomes executable shell input.

### Batch 5: Portability, Documentation, and Rehearsal

- Generate or package Claude and Codex exposure.
- Add global installation and repository-use documentation.
- Run alternate-repository and non-OpenSpec generic-work fixtures.
- Execute the disposable end-to-end rehearsal.
- Complete formal Verify, delivery, Sync, and Archive.

Every batch ends with the full applicable validation and automatic correction
loop from Section 6. Human approval is needed only if review identifies a
Section 7 decision.

## 10. Security and Abuse Controls

- Treat issue, PR, web, email, document, and model-generated content as
  untrusted data, never shell instructions.
- Keep credentials out of prompts, logs, checkpoints, fixtures, and diffs.
- Use least privilege and separate read-only research from write transitions.
- Require exact repository, owner, Project, branch, issue, and PR targets before
  external mutation.
- Use dry-run or preview before new mutation classes.
- Never weaken a test, validator, branch rule, or security control merely to
  make progress.
- Pin third-party Actions and dependencies; record attribution and licenses.
- Detect data exfiltration, credential probing, persistent security weakening,
  force push, destructive Git, and unrelated-record mutation as stop behavior.
- Keep concurrent writers in separate worktrees and prohibit shared external
  state unless explicitly isolated.

## 11. Verification and Evals

Required scenarios include:

- Named queue completes without routine human prompts.
- Deterministic selection chooses one uniquely eligible change.
- Parallel or conflicting candidates cause a human decision.
- Objective test failure is corrected and revalidated.
- Three failed correction strategies produce a blocked checkpoint.
- Material requirement ambiguity pauses before implementation.
- Destructive action remains blocked despite broad Goal wording.
- Expected PR merge and merged-branch deletion proceed when authorized.
- Unexpected repository or Project target pauses before mutation.
- Interrupted Apply resumes at the first incomplete evidenced task.
- Repeated issue, Project, PR, Sync, and Archive operations converge without
  duplicates or content loss.
- Missing `PROJECT_TOKEN` fails safely before an Action mutation.
- Untrusted PR content cannot access Project credentials or execute commands.
- Claude and Codex normalize to equivalent lifecycle behavior.
- A second repository can use the generic runner without this product's owner,
  Project, paths, or issue numbers.
- A non-OpenSpec workflow can reuse batching, review, correction, checkpoint,
  and human-decision behavior through its own adapter.

## 12. Definition of Done

M1-C2 is complete when:

- Proposal, delta specs, design, and stable task plan pass automated planning
  review and strict OpenSpec validation.
- Generic and OpenSpec-specific assets are canonical, portable, and exposed to
  Claude and Codex without duplicated policy.
- All unit tests, integration fixtures, evals, documentation checks, security
  reviews, attribution checks, and portability checks pass.
- The disposable end-to-end lifecycle completes with one demonstrated
  automatic correction and one demonstrated human-only pause.
- The implementation PR is merged, the issue is closed, and the Project item
  is `Done`.
- Delta specs are synced, repeat Sync is a no-op, and the change is archived.
- Ordinary Codex sessions retain normal approval behavior.
- A Goal-profile run can continue unattended until completion or a documented
  human/destructive/unrecoverable gate.

## 13. Rollout

1. Run the generic runner in report-only mode.
2. Enable local file edits with external mutations disabled.
3. Enable disposable GitHub mutations under bounded authorization.
4. Run the complete M1-C2 rehearsal.
5. Execute M2-C1 and M3-C1 sequentially under observation.
6. After both pass, allow the remaining dependency-ordered queue to run
   unattended with the same checkpoints and pause policy.
7. Keep full-access modes disabled and review Auto-review denials and runner
   evidence after each long Goal.
