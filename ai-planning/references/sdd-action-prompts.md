# SDD Action Prompt Reference

Date created: 2026-08-09
Status: Living reference

## Purpose

Keep the prompts used to operate this repository's specification-driven
development process, along with concise notes explaining why each action and
checkpoint exists.

Add each recommended action prompt to this document before using it. Preserve
the prompt that was actually used when later refinements are made so the record
shows how the process evolved.

This document is a learning and operational reference. The requirements,
OpenSpec artifacts, implementation plan, dependency plan, GitHub issues, and
pull requests remain the authoritative sources for product and delivery state.

## Entry Format

Each new entry should contain:

1. The action and its intended outcome.
2. Preconditions or required context.
3. The exact prompt to issue.
4. Expected stopping point.
5. Notes explaining the relevant SDD concepts.
6. Observations recorded after the action, including gaps or process changes.

## 1. Start M1-C1: Bootstrap OpenSpec Foundation

### Intended Outcome

Create and review the planning package for OpenSpec change
`bootstrap-openspec-foundation`, including its GitHub work records, without
starting implementation.

### Preconditions

- The foundation requirements, implementation plan, dependency plan, and
  implementation handoff have been reviewed.
- OpenSpec is initialized for Claude and Codex.
- GitHub CLI has local access to repository `jizzoe/joericearchitect-ai-skills`
  and user Project `1`.
- The repository owner's token, live-test, and required-check decisions have
  been recorded.
- Existing uncommitted work will be preserved.

### Prompt

```text
We are starting M1-C1, OpenSpec change `bootstrap-openspec-foundation`.

Use the `openspec-propose` skill and follow the requirements, implementation
plan, dependency plan, and implementation handoff already reviewed.

This is a learning session. Explain each SDD stage and why it is required as
we reach it. I will ask questions and evaluate the workflow along the way.
Capture material decisions, problems, and process observations in the
appropriate planning or handoff document without duplicating authoritative
requirements.

Work in these checkpoints:

1. Reinspect the repository, OpenSpec configuration, GitHub CLI access, and
   GitHub Project state. Preserve all existing uncommitted work. Report any
   discrepancy and do not mutate anything yet.

2. Draft and preview:
   - The roadmap issue: `Establish OpenSpec SDD foundation`
   - The feature issue:
     `[M1-C1] Bootstrap OpenSpec for Claude and Codex`
   - Their relationship and intended Project placement

   Stop and obtain my approval before creating or modifying GitHub records.

3. After approval, create the issues, establish the available relationships,
   and add them to GitHub Project 1. Report the resulting URLs and state.

4. Add the separate OpenSpec `verify` workflow while retaining only the
   streamlined workflows: explore, propose, apply, verify, sync, and archive.
   Do not enable incremental artifact workflows.

5. Invoke `$openspec-propose` for `bootstrap-openspec-foundation`.
   The proposal must reference:
   - `ai-planning/requirements/openspec-sdd-foundation.md`
   - `ai-planning/plans/openspec-sdd-foundation-implementation-plan.md`
   - `ai-planning/plans/openspec-sdd-foundation-dependency-plan.md`

   It must include the GitHub issue reference, a Reuse Plan, stable task IDs,
   dependency annotations, verification evidence, recovery considerations,
   and Claude/Codex portability.

6. Generate planning artifacts only. Do not invoke apply and do not implement
   the proposed change in this session step.

7. Review the generated proposal, delta specs, design, and tasks against the
   M1-C1 requirements. Explain any gaps or corrections and stop for my review
   before proceeding further.
```

### Expected Stopping Point

The proposal, delta specifications, design, and task plan exist and have been
reviewed for gaps. No apply action or implementation work has started.

### Learning Notes

- The sequence is readiness, GitHub issue approval, bootstrap setup, OpenSpec
  proposal, artifact review, and only then a later apply action.
- That separation is central to SDD: we agree on the intended behavior and
  implementation plan before changing the product.
- The GitHub issue owns the problem discussion and lifecycle state. OpenSpec
  owns the durable behavioral requirements, technical design, and detailed
  implementation tasks.
- A proposal is not authorization to implement. Reviewing the planning package
  is a deliberate gate between deciding what should change and changing it.
- Previewing GitHub mutations protects external state and lets the repository
  owner review issue content and relationships before they become public work
  records.
- Objective exit evidence matters. Completing a command is not proof that the
  generated artifacts are correct, linked, portable, or ready to implement.

### Observations

- The readiness checkpoint prevented premature Project configuration. Project 1
  still had GitHub's default `Todo`, `In Progress`, and `Done` statuses and no
  managed SDD labels, so the approved decision was to create and relate the
  issues but defer Project placement and labels to M2.
- Sandboxed `gh auth status` incorrectly reported the keyring credential as
  invalid. The same read-only checks outside the network sandbox confirmed the
  authenticated `jizzoe` account, required scopes, repository, and Project.
  Future sessions should recognize this environment limitation before asking
  for unnecessary reauthentication.
- The first `openspec update --force` refreshed Claude but could not write the
  protected `.agents/` path. A permission-authorized rerun refreshed both
  assistants without losing the valid Claude output. This provided a real
  partial-failure and recovery example for the design.
- OpenSpec 1.8.0 warns that the custom six-action profile omits the core
  `update` workflow. This is an accepted consequence of the approved exact
  selection; the warning is not evidence that generation failed.
- Workflow selection and GitHub intake were intentionally completed before the
  proposal, so tasks 1.1 through 1.3 record verified work as complete. This
  avoids repeating external mutations or misrepresenting known state during
  apply.
- OpenSpec strict validation passed with two new capability deltas,
  `sdd-lifecycle` and `cross-assistant-assets`. OpenSpec reporting the planning
  artifacts as complete means the change is ready for implementation review;
  it does not mean the implementation or GitHub issue is complete.

## 2. Apply M1-C1 Tasks 2.1 and 2.2: Configure OpenSpec Context

### Intended Outcome

Begin the implementation phase for `bootstrap-openspec-foundation` by replacing
the generated OpenSpec configuration scaffold with the approved repository
context, artifact rules, and operation guidance. Stop after this first
implementation slice so its behavior and injected instructions can be reviewed
before contributor documentation and final verification are implemented.

### Preconditions

- The proposal, delta specifications, design, and tasks are complete and pass
  strict OpenSpec validation.
- The repository owner has reviewed the M1-C1 planning package and explicitly
  authorizes apply.
- Tasks 1.1 through 1.3 remain supported by recorded evidence.
- Existing generated workflow changes and unrelated repository work will be
  preserved.

### Prompt

```text
We are beginning the apply phase for OpenSpec change
`bootstrap-openspec-foundation`.

Use the `openspec-apply-change` skill. This request authorizes implementation
of tasks 2.1 and 2.2 only. Do not continue to task group 3 in this step.

This remains a learning session. Explain how the apply workflow uses the
proposal, delta specs, design, and task plan before editing. Capture material
process observations in `ai-planning/references/sdd-action-prompts.md` without
duplicating authoritative requirements.

Before editing:

1. Explicitly select `bootstrap-openspec-foundation`.
2. Run OpenSpec status and apply-instructions commands.
3. Read every context file returned by the apply instructions from disk.
4. Report the schema, current task progress, dynamic apply instruction, and
   the exact files expected to change.
5. Inspect the working tree and preserve all existing generated and
   user-authored changes.

Implement:

- Task 2.1: replace the `openspec/config.yaml` context scaffold with concise
  product boundaries, supported assistants, canonical asset locations, and
  source-of-truth ownership.
- Task 2.2: add proposal, specification, design, task, apply, and archive
  guidance covering quality, evidence, security, attribution, portability,
  recovery, stable task IDs, dependency annotations, and explicit stop
  behavior.

Constraints:

- Follow the approved delta specs and design.
- Keep the injected context concise; link to authoritative documents instead
  of copying the full requirements or plans.
- Do not edit OpenSpec-generated skill or command contents manually.
- Do not modify GitHub records, Project state, global telemetry, or the selected
  workflow profile.
- Do not implement contributor documentation or tasks 3.1 and later.
- Mark a task complete immediately after, and only after, its stated evidence
  is demonstrated.

Verification:

1. Confirm the YAML parses through OpenSpec.
2. Inspect `openspec instructions` output for every configured artifact and
   operation to verify the intended context and rules are active.
3. Run strict validation for `bootstrap-openspec-foundation`.
4. Review the diff for scope, duplication, secrets, and preservation of
   unrelated work.

Stop after tasks 2.1 and 2.2. Report files changed, verification evidence,
overall task progress, warnings or gaps, and what task 3.1 will do next. Do not
start task 3.1 without a new prompt.
```

### Expected Stopping Point

Tasks 2.1 and 2.2 are either complete with evidence or paused on a clearly
reported blocker. No contributor documentation, later verification task, sync,
archive, or GitHub lifecycle mutation has started.

### Learning Notes

- Apply is a separate authorization boundary. A reviewed proposal defines what
  may be implemented, but it does not itself authorize repository edits.
- OpenSpec apply instructions resolve the authoritative context files and
  current task state. They should be read from disk because planning artifacts
  may have changed since proposal generation.
- Implementing one dependency-complete task group provides a small reviewable
  slice. It lets us evaluate how project context affects later artifact
  generation before documenting or relying on that behavior.
- A checked task means its stated evidence exists. Editing the expected file or
  running a command is not sufficient by itself.
- `.openspec.yaml` selects the change schema and records creation metadata. It
  does not contain the requirements, implementation design, or task state.
- `openspec instructions apply` reports 14 parsed tasks: 3 complete and 11
  remaining. This corrected an earlier manual conversational count of 13 and
  demonstrates why CLI-derived task state is authoritative over summaries.

### Observations

- OpenSpec reported `state: ready` with 3 of 14 tasks complete before this
  slice. Its general change status reported all four planning artifacts
  complete; implementation progress came from `instructions apply`, not the
  planning-artifact status.
- Task 2.1 was implemented and verified independently before task 2.2 because
  both edit `openspec/config.yaml` and 2.2 depends on 2.1. OpenSpec returned the
  configured context through proposal instructions, proving that the YAML
  parsed and the prompt-level context was active.
- OpenSpec uses artifact ID `specs` for specification rules. Proposal, specs,
  design, and tasks expose configured entries under `rules`; apply and archive
  expose their entries separately under `operationGuidance`.
- Artifact rules and operation guidance shape assistant behavior but do not
  prove compliance. Later deterministic validation, review, and CI tasks remain
  necessary for enforceable gates.
- Strict validation passed after both configuration tasks. Credential-pattern
  scanning found no token, the diff contained no README or `docs/` change, and
  the pre-existing generated workflow changes remained untouched.
- Tasks 2.1 and 2.2 were checked only after their individual evidence was
  observed. Apply progress is now 5 of 14 tasks complete, with task 3.1 next.

## 3. Resume an Interrupted Apply at Task 3.1

### Intended Outcome

Recover safely after an apply turn is cancelled, determine persisted progress
from OpenSpec and the working tree, and implement task 3.1 without repeating
completed work or discarding a partial edit.

### Preconditions

- OpenSpec change `bootstrap-openspec-foundation` remains active.
- The interrupted turn did not intentionally abandon or redesign the change.
- Existing uncommitted work must be preserved.

### Prompt

```text
Resume the interrupted apply for OpenSpec change
`bootstrap-openspec-foundation` using the `openspec-apply-change` skill.

Do not infer progress from the cancelled conversation. Re-run OpenSpec status
and apply instructions, reread every returned context file from disk, inspect
the working tree, and check whether task 3.1 or `docs/sdd-workflow.md` is
complete, partial, or absent.

Preserve all existing changes. If partial task 3.1 work exists, review and
continue it against the current specs and design; do not delete or replace it
without explaining why. If no partial work exists, implement task 3.1 normally.

Task 3.1 must create `docs/sdd-workflow.md` covering prerequisites, the selected
OpenSpec actions, initialization, assistant discovery, validation, refresh,
permission-failure recovery, and rollback. Keep credentials and product-specific
mutable IDs out of reusable instructions.

Verify the documented commands and required coverage. Mark task 3.1 complete
only when its evidence is demonstrated, record material recovery observations
in `ai-planning/references/sdd-action-prompts.md`, and stop before task 3.2. Do
not modify README, GitHub state, global OpenSpec settings, or generated workflow
contents in this step.
```

### Expected Stopping Point

Task 3.1 is complete with evidence or paused on a specific blocker. Task 3.2
and later work remain untouched.

### Learning Notes

- OpenSpec task checkboxes and repository files persist across chat turns; the
  cancelled conversation is not the source of truth for progress.
- Recovery begins with status, apply instructions, context rereading, and a
  working-tree inspection. This distinguishes absent, partial, complete, and
  blocked work before any edit is made.
- An unchecked task does not prove that no partial file exists. Both task state
  and file evidence must be inspected.

### Observations

- For this interruption, task 3.1 remained unchecked and
  `docs/sdd-workflow.md` was absent. No partial implementation needed repair;
  apply remained ready at 5 of 14 tasks complete.
- The resumed turn reconstructed state from `instructions apply`, reread every
  context artifact, and confirmed the expected guide was still absent before
  editing. No cancelled-turn content was assumed or recovered from chat memory.
- The guide distinguishes normal use from first-time initialization. A clean
  checkout consumes version-controlled generated integrations; adoption of a
  different repository first inventories assistant assets and records the
  user's global workflow selection.
- Read-only commands were executed against the active repository. Commands that
  would mutate global configuration or regenerate files were checked through
  installed CLI help rather than rerun during a documentation-only task.
- Verification confirmed all required guide topics, both generated assistant
  inventories, strict OpenSpec validity, and absence of repository owner,
  Project-number, or credential patterns. Task 3.1 is complete, progress is 6
  of 14, and README remains reserved for task 3.2.

## 4. Apply Batch 1: Contributor Entry Point and Static Integration Evidence

### Intended Outcome

Complete tasks 3.2, 4.1, and 4.2 as one reviewable batch: add the concise
README entry point, verify exact cross-assistant workflow parity, and verify
generated provenance and preservation boundaries without editing generated
workflow contents.

### Learning Notes

- Apply batches may group dependency-complete tasks when their combined scope
  remains easy to review. Each task still needs its own evidence and is checked
  immediately after that evidence succeeds.
- Verification tasks can be implementation work even when they do not create
  product files. Their output establishes whether observable requirements are
  true and prevents a generator's success message from becoming the only
  evidence.
- Generated ownership is a boundary: OpenSpec-managed commands and skills are
  inspected in this batch, while changes to them remain the generator's job.

### Observations

- The README now describes the Claude/Codex asset scope and links to the
  focused SDD guide without repeating its operating procedure.
- Normalized Claude command, Claude skill, and Codex skill inventories each
  contain exactly `apply`, `archive`, `explore`, `propose`, `sync`, and
  `verify`. No incremental or deselected action was present.
- Every generated Claude and Codex skill retains its available MIT license,
  OpenSpec author, and generator 1.8.0 metadata. Claude commands retain their
  OpenSpec name and workflow-category markers; their generated format does not
  expose separate license or generator fields.
- Within generated integration paths, Git history shows that the bootstrap
  commit replaced only `update` exposure with `verify`. The tracked
  `ai-planning/prompts/skill-ideas.txt` is byte-identical to the parent commit.
- `.claude/settings.local.json` is globally ignored, absent from both Git
  trees, and was created after the bootstrap commit, so Git cannot prove a
  pre-bootstrap content comparison. Its current SHA-256 value is recorded in
  task 4.2 as the forward preservation baseline.

### Batch Review Rule

- After each implementation batch, automatically review the batch diff against
  the approved proposal, delta specs, design, and tasks.
- Automatically correct objective, narrowly scoped findings and rerun affected
  checks before reporting the batch complete.
- Request repository-owner approval only when a proposed correction requires
  human judgment, changes approved scope or behavior, mutates external state,
  or conflicts with an authoritative artifact.
- Record material review findings and corrections here, while keeping
  authoritative requirements and implementation decisions in their owning
  artifacts.

### Review Corrections

- Added the omitted `explore` action to the README lifecycle summary.
- Scoped the commit claim to generated integration paths so it does not imply
  that the bootstrap commit changed only workflow exposure.
- Replaced the unsupported claim that an ignored file was byte-identical across
  commits with its observable Git status, creation time, and a forward hash.

## 5. Apply Batch 2: Portability and Assistant Discovery

### Intended Outcome

Complete tasks 4.3 and 4.4 as one verification batch: evaluate reusable
guidance against a second-product, multi-repository scenario and verify that
fresh Claude and Codex sessions discover the generated lifecycle actions and
have an actionable stale-discovery recovery path.

### Learning Notes

- Portability review separates reusable procedure from product-owned context.
  Product-specific values are not defects when they remain in the repository's
  configuration and documentation boundary rather than reusable logic.
- File inventory proves generated assets exist; assistant startup evidence
  proves the runtime actually scans the owning directories. Both are stronger
  together than either check alone.
- Authentication and local discovery are separate concerns. A CLI may discover
  repository commands and skills during startup even when it cannot invoke a
  remote model.

### Observations

- A hypothetical product with a different GitHub owner, Project, and multiple
  implementation repositories can follow the guide without editing reusable
  workflow logic. Repository paths are relative and mutable product values are
  explicitly assigned to product-owned configuration.
- Reusable documentation and generated integrations contain no embedded GitHub
  owner, Project number, credential, branch, or product-domain constant. The
  product purpose, boundary examples, and canonical asset paths in
  `openspec/config.yaml` and `README.md` are intentional product context.
- The active Codex session exposes all six generated OpenSpec skills. A fresh
  Claude Code 2.1.220 startup loaded six project skills and six legacy project
  commands and watched both generated directories.
- Claude model invocation could not enumerate names because the local CLI was
  not logged in. Startup diagnostics nevertheless confirmed local discovery
  before authentication, and the exact on-disk inventories supplied the action
  names without requiring a credential or external mutation.
- The documented stale-discovery sequence is explicit: start a new session or
  reload/restart, then verify the generated file, selected workflow profile,
  and complete normalized inventory before declaring generation invalid.

## 6. Apply Batch 3: Validation and Implementation Review

### Intended Outcome

Complete tasks 5.1 and 5.2 as one internal quality gate: run every available
repository-local validation and map both delta specs and the approved design to
objective implementation evidence before any external closeout mutation.

### Learning Notes

- Validation and review answer different questions. Deterministic checks prove
  parseability, exact inventories, links, formatting, metadata, and secret
  hygiene; qualitative review checks whether the evidence actually satisfies
  each requirement, scenario, and design decision.
- A verification report may find the implemented scope conformant while still
  blocking archival on an incomplete lifecycle task. This prevents technical
  success from being confused with delivery completion.
- Missing repository tooling should be reported as an explicit limitation, not
  replaced with an unapproved dependency or silently treated as a passing test.

### Observations

- OpenSpec status, strict validation, and instructions for every configured
  artifact and operation succeeded. Exact workflow parity, provenance,
  relative links, balanced code fences, whitespace, and credential scans also
  passed.
- The repository has no configured formatter, Markdown linter, package test
  runner, or build target. The batch used dependency-free checks and records
  later validation automation as a suggestion for the planned hardening work.
- `verification-report.md` maps all 19 delta-spec scenarios and all five design
  decisions to files and executed commands. Security, attribution, recovery,
  maintainability, and Claude/Codex portability were reviewed separately.
- No implementation defect requires correction. Task 5.3 remains a critical
  lifecycle gap because issue evidence and pull-request preparation are not yet
  complete; sync and archive therefore remain premature.

## 7. Apply Batch 4: External Evidence and PR Preparation

### Intended Outcome

Complete task 5.3 by publishing reviewed implementation evidence to the
bootstrap issue and preparing a draft pull request, while leaving issue state,
Project state, sync, archive, and delivery completion unchanged.

### Learning Notes

- External evidence should link to committed, pushed artifacts. Posting branch
  links before the files exist remotely would create evidence that reviewers
  cannot inspect.
- A draft pull request is preparation for review, not delivery. Apply can be
  complete while verification, review, merge, issue closure, spec sync, and
  archival remain distinct later actions.
- Expected external mutations may proceed under explicit batch authorization,
  but their exact scope and non-mutations should still be previewed.

### Observations

- Commit `44b188e` published the reviewed Batch 1-3 files to
  `feature/seed-ai-skills`, enabling stable branch links from GitHub records.
- Draft PR #3 links issue #2 and the OpenSpec change and explicitly remains
  pending the separate verify action and delivery review.
- Issue #2 now links the proposal, delta specs, design, tasks, verification
  report, contributor guide, and draft PR. The comment records M2 and M3
  deferrals without copying their authoritative requirements.
- The issue remains open and the PR remains draft. No Project fields, labels,
  telemetry, global workflow selection, living specs, or archive state changed.

## 8. Verify M1-C1 After Apply Completion

### Intended Outcome

Independently verify the completed apply work against the current OpenSpec
tasks, delta specs, and design before changing pull-request readiness, syncing
living specs, or archiving the change.

### Prompt

```text
Resume M1-C1 from the apply-complete checkpoint for OpenSpec change
`bootstrap-openspec-foundation`.

First read:
- `ai-planning/handoff-docs/bootstrap-openspec-foundation-apply-complete-handoff.md`
- the requirements, implementation plan, and dependency plan linked there
- every current change artifact returned by OpenSpec verify instructions

Use the `openspec-verify-change` skill. Reinspect the working tree, branch and
remote state, issue #2, draft PR #3, OpenSpec status, and strict validation.
Preserve concurrent work and treat disk, Git, OpenSpec, and GitHub as the
current sources of truth rather than relying on the previous conversation.

Independently verify:
- all 14 apply tasks and their evidence
- every requirement and scenario in both delta specs
- adherence to all design decisions
- security, attribution, recovery, maintainability, and portability
- exact Claude/Codex lifecycle parity and generated provenance
- documentation links and stale-discovery recovery
- the accuracy of `verification-report.md`

Run the standing automatic code review after verification. Correct objective,
narrowly scoped defects and rerun affected checks. Request my approval before
any fix that requires human judgment, changes approved scope or behavior, or
mutates unexpected external state.

This is verification only. Do not invoke apply unless a correction is later
authorized. Do not sync specs, archive the change, mark PR #3 ready, merge it,
close issue #2, or mutate Project state. Report critical issues, warnings,
suggestions, known limitations, and archival readiness, then stop for my
review.
```

### Expected Stopping Point

Verification reports whether the implementation matches the change artifacts
and whether any defect blocks delivery. PR #3 remains draft, issue #2 remains
open, and sync/archive remain untouched pending repository-owner review.

### Learning Notes

- Apply completion authorizes verification, not delivery or archival.
- Verification must independently inspect current evidence; the implementation
  report is useful input but cannot verify itself.
- A successful verify result still leaves PR review, merge, issue closure,
  living-spec sync, and archive as distinct lifecycle actions.
