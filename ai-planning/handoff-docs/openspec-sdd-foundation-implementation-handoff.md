# OpenSpec SDD Foundation Implementation Handoff

Date: 2026-08-08
Handoff status: Ready for a new implementation session

## Purpose

Provide session-specific operational context for the next LLM session implementing the SDD foundation. Do not use this document as a replacement for the requirements, implementation plan, dependency plan, or research documents.

The next session should assume all files under `ai-planning/` are available and read the relevant source documents directly.

## Product Goal

Build a reusable global AI asset repository supporting Claude and Codex, with one consistent but configurable SDD process that can later be applied across multiple independent products.

This repository is the first product receiving that SDD process and is also the eventual home of generalized SDD skills, workflows, scripts, templates, and platform adapters.

Each future product will own its specifications and GitHub work state. The global repository will provide reusable process behavior without hard-coding a product's repository, Project, milestones, paths, or credentials.

## Read First

Read these in order before changing files or GitHub state:

1. [Foundation requirements](../requirements/openspec-sdd-foundation.md)
2. [Implementation plan](../plans/archive/openspec-sdd-foundation-implementation-plan.md)
3. [Dependency plan](../plans/archive/openspec-sdd-foundation-dependency-plan.md)
4. [GitHub Issues and OpenSpec research](../research/github-issues.md)
5. [Cross-assistant asset practices](../research/cross-assistant-ai-assets-best-practices.md)

Use the remaining research documents when implementing a related asset. Do not ingest every cloned external repository again unless a task requires source-level comparison.

## Current Operational State

### Repository

- Workspace: `/Users/joerice/git/joericearchitect/joericearchitect-ai-skills`
- GitHub repository: `jizzoe/joericearchitect-ai-skills`
- Remote: `https://github.com/jizzoe/joericearchitect-ai-skills.git`
- The worktree is intentionally dirty with planning work and IDE files.
- Preserve all unrelated changes. In particular, `.idea/` and modified prompt files predate implementation work and must not be removed or reverted.
- Planning directories and OpenSpec-generated files are currently untracked or modified; no implementation commit was created in this session.

### OpenSpec

- OpenSpec CLI version: `1.8.0`.
- Initialized successfully at the repository root for Claude and Codex.
- Schema: `spec-driven`.
- Active OpenSpec change: `bootstrap-openspec-foundation`. Its proposal, two
  delta specs, design, and tasks are complete, and strict validation passes.
  Three bootstrap tasks are complete; implementation has not been applied.
- `openspec/config.yaml` is still the generated commented scaffold. Product context, artifact rules, and operation guidance have not been populated.
- Claude integration exists under `.claude/`.
- Codex integration exists under `.agents/skills/`.
- Generated workflows: `explore`, `propose`, `apply`, `verify`, `sync`, and
  `archive` for Claude and Codex. The deselected `update` workflow was removed.
- `openspec config list --json` reports global profile `custom` with the exact
  approved workflow selection. OpenSpec warns that the custom profile omits
  core workflow `update`; this is intentional. Do not reset the global profile
  merely to remove the warning or change the profile label.
- OpenSpec telemetry displayed its default anonymous-usage notice. No decision was made about opting out; ask before changing the user's global telemetry setting.

Initialization first succeeded for Claude but failed to create `.agents` because the workspace sandbox denied that protected path. Re-running `openspec init --tools claude,codex --profile core --no-animation` with elevated filesystem permission completed Codex setup. This was a sandbox issue, not an OpenSpec configuration defect.

### GitHub CLI and Project

- GitHub CLI version: `2.97.0`.
- Authenticated account: `jizzoe`, stored in the macOS keyring.
- Active token scopes verified outside the sandbox: `admin:public_key`, `gist`, `project`, `read:org`, and `repo`.
- Git operations protocol reported by `gh`: SSH. The repository remote itself is HTTPS; this is not currently blocking work.
- Sandboxed `gh auth status` can falsely report the token as invalid because the sandbox cannot reach GitHub. Re-run important GitHub checks with network permission before asking the user to re-authenticate.

GitHub Project created during this session:

- Name: `AI Skills Development`
- Owner: `jizzoe`
- Number: `1`
- Visibility: public
- URL: https://github.com/users/jizzoe/projects/1
- Description: `Plan and track reusable AI skills, OpenSpec changes, issues, pull requests, and SDD automation.`
- The Project still has no items because its default three statuses are not the
  required SDD status model; issue placement and label backfill are deferred to
  M2.
- Required custom fields, the five-status Kanban model, views, auto-add rules, and Project automation have not been configured.
- Roadmap issue #1 and M1-C1 issue #2 are open. Issue #2 is a native sub-issue
  of #1. Managed labels, milestones, issue forms, and pull requests do not yet
  exist.

Local `gh` authentication is separate from GitHub Actions Project authentication. The repository owner selected a personal Project-capable token stored as the Actions secret `PROJECT_TOKEN`; token creation and configuration can wait until Actions require Project write access.

## Activities Completed in This Conversation

Formal findings and decisions are already captured in the linked planning documents. The activity history below exists only to orient the next session.

1. Researched current Claude and Codex built-in assets and identified capabilities not to duplicate.
2. Cloned and reviewed public SDLC skill repositories; detailed results are in the research documents.
3. Selected per-product specification ownership rather than one specification repository for unrelated products.
4. Chose OpenSpec as the lightweight SDD framework, with repo-owned additions for quality and GitHub integration.
5. Defined attribution and licensing expectations for copied or adapted assets.
6. Researched GitHub Issues, Projects, PR linkage, Actions, and OpenSpec integration.
7. Created the consolidated SDD foundation requirements baseline.
8. Created the milestone-oriented implementation plan.
9. Created the milestone/change dependency plan and safe parallel-work windows.
10. Standardized human terminology on `M#/C#`, machine identifiers on `M#-C#`, and semantic OpenSpec change names.
11. Added a future dependency-aware Project navigation milestone supporting multiple in-flight changes and explicit switching.
12. Installed/verified OpenSpec and GitHub CLI, initialized OpenSpec, and created the public GitHub Project.

## Session-Specific Outcomes Not to Rediscover

- OpenSpec core `propose` creates the complete planning package in one action: proposal, delta specs, design, and tasks. It stops before implementation.
- The current Codex invocation is `$openspec-propose`; Claude Code uses `/opsx:propose`.
- Generated OpenSpec skills are available only after the assistant reloads/restarts and discovers repo-local skills.
- OpenSpec alone can report active changes and artifact/task status, but it does not determine cross-change product priority. GitHub Project and issue dependencies supply that layer.
- GitHub issue dependencies should own cross-change hard blocking. OpenSpec `tasks.md` should own within-change task dependencies. Project fields should provide ordering and priority, not duplicate blocking relationships.
- Multiple changes may be in flight. Each assistant session must explicitly select one active change and must not infer selection from the most recently modified directory.
- Absence of a dependency path does not prove safe concurrency. Designs must also identify shared files, interfaces, credentials, environments, and external state.

## Immediate Next Work

Review the complete planning package under
`openspec/changes/bootstrap-openspec-foundation/`. Resolve any requested
artifact changes before implementation. Do not invoke apply until the
repository owner issues a new explicit implementation request.

When approved, use the apply workflow for `bootstrap-openspec-foundation` and
start at task 2.1. Preserve all existing uncommitted work and the current
`ai-planning/prompts/skill-ideas.txt` content/history. Project placement and
managed-label backfill remain M2 work.

## Guiding Principles

Use these principles when the documents leave room for judgment:

- Prefer lightweight, flexible process over ceremony, while retaining acceptance criteria, tests, guardrails, review, and evidence.
- Specifications follow product boundaries; implementation documentation follows code boundaries.
- Use platform and OpenSpec built-ins before creating repo-owned duplicates.
- Keep canonical skills assistant-neutral; isolate Claude and Codex adapters.
- Skills explain reasoning-heavy workflows; workflows compose steps; scripts enforce deterministic behavior; Actions reconcile GitHub events.
- Keep one source of truth for each fact and link systems rather than copying content.
- Keep skills small, operationally triggered, and progressively disclosed.
- Use objective evidence for completion and report unknown or blocked states honestly.
- Preview external mutations, use least privilege, preserve human-authored content, and make synchronization idempotent.
- Plan vertical changes that deliver useful outcomes. Do not create an issue for every OpenSpec task checkbox.
- Allow parallel delivery only when explicit dependencies and shared-resource analysis support it.
- Make the process reusable through configuration, not assumptions embedded in skills or scripts.

## Reusable Global SDD Skill Opportunities

These are recommendations for the global `joericearchitect-ai-skills` product. They do not all belong in the first implementation milestone.

### 1. `sdd-product-bootstrap`

Initialize or adopt OpenSpec in a product repository:

- Inspect existing assistant and legacy OpenSpec files.
- Initialize selected assistants safely.
- Create product context from a requirements baseline.
- Configure the chosen workflow profile.
- Verify assistant discovery.
- Document update, recovery, and ownership boundaries.

This should be parameterized by product repository and assistant set. It should never silently alter global assistant configuration.

### 2. `sdd-requirements-to-plan`

Convert a PRD-like requirements document into:

- Outcome-oriented milestones.
- Independently deliverable OpenSpec changes.
- Scope and non-goals.
- Acceptance evidence.
- Initial issue/change identifiers.
- Candidate parallel work.

This generalizes the reasoning used to create the current requirements and implementation plan.

### 3. `sdd-dependency-planning`

Build and maintain milestone/change/task dependency plans:

- Identify hard dependencies, soft conflicts, and blocking outputs.
- Find the critical path.
- Identify safe parallel windows.
- Detect dependency cycles and stale blockers.
- Generate GitHub issue dependency operations.
- Require stable task IDs and task-level dependency annotations.

This should reason about both logical dependencies and shared files/interfaces/external state.

### 4. `github-sdd-project-bootstrap`

Create or adopt a GitHub Project for a product:

- Labels and issue forms.
- Status, milestone, change, sequence, and priority fields.
- Kanban and roadmap views.
- Built-in Project workflows.
- Non-secret product configuration.
- Least-privilege authentication guidance.

Project creation and mutation should use deterministic scripts and explicit preview/confirmation.

### 5. `github-issue-authoring`

Create high-quality feature and bug issues, search for duplicates, apply product configuration, and keep intake details distinct from durable specifications.

This is already in first-pass scope.

### 6. `github-issue-to-openspec`

Translate an issue into an OpenSpec change while preserving the issue as the lifecycle record and delegating artifact generation to OpenSpec.

This is already in first-pass scope.

### 7. `openspec-github-sync`

Audit and repair reciprocal links, managed issue blocks, Project membership, and lifecycle status. It should support read-only audit and explicit repair modes.

This is already in first-pass scope.

### 8. `github-pr-linkage`

Prepare and validate issue-closing keywords, OpenSpec change references, verification evidence, and no-code completion rules.

This is already in first-pass scope.

### 9. `sdd-project-navigation`

Answer:

- Where are we?
- What is in flight?
- What is blocked and by what?
- What can proceed in parallel?
- What should be worked on next?
- What exact OpenSpec action or task is next?

It should read GitHub Project state, native issue dependencies, OpenSpec changes, and task metadata without mutating state by default.

### 10. `sdd-change-switching`

Safely switch an assistant session among multiple active changes:

- Summarize incomplete current work.
- Check working-tree and shared-resource hazards.
- Explicitly select the target change.
- Load target artifacts and task state.
- Report blockers and the next actionable task.

This can eventually be a capability within `sdd-project-navigation` if separate triggers do not improve selection reliability.

### 11. `sdd-change-readiness-review`

Evaluate Definition of Ready before implementation:

- Scope and non-goals.
- Requirements and acceptance scenarios.
- Design and dependency plan.
- Test/eval evidence plan.
- Security, attribution, portability, and rollback considerations.

It should report gaps and avoid silently promoting an issue to `Ready`.

### 12. `sdd-verification-and-closeout`

Verify implementation against specs/tasks, collect evidence, confirm issue/PR/Project state, sync living specs, and archive the OpenSpec change.

This should compose OpenSpec built-ins rather than duplicate their artifact logic.

### 13. `sdd-session-handoff`

Generate a compact new-session handoff:

- Current operational state.
- Active/selected changes and incomplete tasks.
- External state and authentication caveats.
- Uncommitted work that must be preserved.
- Blockers, next action, and evidence.
- Links to authoritative plans/specs without copying them.

This conversation demonstrates the need for this skill across long-running multi-session implementations.

## Recommended Generalization Structure

```text
skills/base/
├── sdd-product-bootstrap/
├── sdd-requirements-to-plan/
├── sdd-dependency-planning/
├── github-sdd-project-bootstrap/
├── github-issue-authoring/
├── github-issue-to-openspec/
├── openspec-github-sync/
├── github-pr-linkage/
├── sdd-project-navigation/
├── sdd-change-readiness-review/
├── sdd-verification-and-closeout/
└── sdd-session-handoff/

workflows/
└── openspec-github-lifecycle/

scripts/github/
scripts/validation/

templates/sdd/
├── product-config.json
├── tracking.json
├── dependency-plan.md
└── handoff.md
```

Keep product-specific values in checked-in product configuration:

- Repository owner/name.
- Project owner/number.
- Status and field names.
- Milestone/change numbering policy.
- Default branch.
- Required checks.
- No-code exemption policy.

Global skills and scripts must not hard-code this repository's `jizzoe`, Project `1`, milestone names, or token model.

## Suggested Global Skill Build Order

Build only when the corresponding process is exercised and understood:

1. `sdd-product-bootstrap` from M1 experience.
2. `sdd-requirements-to-plan` and `sdd-dependency-planning` from the current planning artifacts.
3. The four first-pass GitHub/OpenSpec integration skills during M4/M5.
4. `sdd-project-navigation` during M6.
5. `sdd-change-readiness-review` and `sdd-verification-and-closeout` during M7.
6. `sdd-session-handoff` after at least one more implementation-session handoff validates this format.

Do not build all recommendations upfront. First use this product as the reference implementation, then extract stable behavior into configurable global skills.

## Recommended Opening Prompt for the Next Session

```text
Read these files before taking action:

- ai-planning/handoff-docs/openspec-sdd-foundation-implementation-handoff.md
- ai-planning/requirements/openspec-sdd-foundation.md
- ai-planning/plans/archive/openspec-sdd-foundation-implementation-plan.md
- ai-planning/plans/archive/openspec-sdd-foundation-dependency-plan.md

We are starting M1/C1, OpenSpec change `bootstrap-openspec-foundation`.

First inspect the current repository, OpenSpec, GitHub CLI, and GitHub Project
state. Preserve all existing uncommitted work. Report any discrepancy from the
handoff before mutating files or GitHub.

Then confirm which unresolved user decisions block M1/C1. Create or propose the
manual roadmap and bootstrap issues as required, and use the generated OpenSpec
proposal workflow to create planning artifacts only. Do not apply the change in
the same step.
```
