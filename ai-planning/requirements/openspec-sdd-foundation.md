# OpenSpec SDD Foundation Requirements

Date: 2026-08-08
Status: Planning baseline

## 1. Purpose

This document consolidates the requirements for the first implementation pass of this repository's specification-driven development (SDD) foundation.

It is the starting point for milestone planning and OpenSpec change creation. It intentionally focuses on:

- OpenSpec repository scaffolding.
- A lightweight, reviewable SDD lifecycle.
- GitHub Issues, Projects, pull requests, and Actions integration.
- Cross-assistant operation in Claude and Codex.
- The minimum repo-owned skills and deterministic tooling needed to operate that lifecycle.

Detailed research remains in the source documents linked throughout this document. Requirements that materially affect implementation are stated here; supporting rationale and broader future recommendations are referenced rather than duplicated.

## 2. Product Boundary

This repository is the product boundary for the reusable AI asset library. Its specifications, work tracking, implementation, tests, and release history SHALL remain in this repository.

The mobile application and job-search workflow products are independent. Their specifications, issues, Projects, and implementation plans are outside this foundation and SHALL NOT be incorporated into this repository's OpenSpec system.

Within this repository, "AI asset" includes:

- Skills.
- Workflows and commands.
- Hooks.
- Agents and subagents.
- Templates and references.
- Deterministic scripts.
- Evals and fixtures.
- Platform adapters and packaging metadata.

## 3. Goals

The first pass SHALL provide a working path from an idea or bug through specification, implementation, review, verification, and archival:

```text
Issue intake
  -> OpenSpec proposal/spec/design/tasks
  -> Ready
  -> implementation
  -> pull request and review
  -> verification
  -> merge and issue closure
  -> OpenSpec sync/archive
```

The foundation SHALL:

1. Keep requirements and acceptance behavior durable and reviewable.
2. Keep work status visible in GitHub without duplicating detailed OpenSpec content.
3. Automate expected issue and Project transitions from SDD actions and repository events.
4. Work with both Claude and Codex while keeping canonical assets assistant-neutral.
5. Require objective verification evidence and explicit reporting of gaps.
6. Begin with low process overhead and add structure only when it provides clear value.

## 4. Non-Goals for the First Pass

The first pass SHALL NOT attempt to:

- Build the full reusable skill catalog.
- Build stack-specific Java, Spring, TypeScript, React, mobile, or infrastructure skills.
- Build job-search workflows.
- Duplicate built-in Claude, Codex, or OpenSpec capabilities.
- Add an MCP server when GitHub CLI and GitHub APIs are sufficient.
- Create a custom OpenSpec schema unless project configuration and repo-owned wrappers prove insufficient.
- Build roadmap forecasting, estimates, iterations, release automation, or portfolio reporting.
- Convert every OpenSpec task checkbox into a GitHub issue.
- Install or vendor large third-party skill collections wholesale.

Deferred assets include generic code review, debugging, TDD, grounded research, threat modeling, ADR, stack review, and MCP design skills. Their practices MAY be represented as lightweight SDD checklists now, but standalone skills belong to later milestones.

## 5. Governing Principles

### 5.1 Use Built-Ins Before Repo-Owned Assets

The implementation SHALL use OpenSpec's generated workflows for exploration, proposal, specification, design, tasks, implementation, verification, synchronization, and archival.

The implementation SHALL use Claude and Codex built-in skill-creation capabilities when authoring the small number of repo-owned skills required by this foundation.

The repository SHALL NOT create first-pass replacements for:

- OpenSpec proposal, apply, verify, sync, or archive workflows.
- Claude or Codex skill creators.
- Generic document, PDF, spreadsheet, presentation, browser, site, image, plugin-creation, or platform-documentation skills.

See [Built-In AI Assets: Claude vs Codex](../research/builtin-ai-assets-claude-vs-codex.md).

### 5.2 Separate Reasoning From Enforcement

- Skills SHALL describe reasoning-heavy procedures and tool-use policy.
- Workflows SHALL compose multiple steps and lifecycle actions.
- Scripts SHALL perform deterministic parsing, validation, and GitHub mutations.
- GitHub Actions SHALL enforce repository-event rules and reconcile external state.
- Hooks SHALL be reserved for non-negotiable local guardrails that cannot be enforced effectively through scripts or CI.

The first pass SHOULD avoid hooks unless a concrete enforcement gap is demonstrated.

See [Cross-Assistant AI Asset Best Practices](../research/cross-assistant-ai-assets-best-practices.md#3-separate-reusable-knowledge-from-executable-enforcement).

### 5.3 Progressive Disclosure

Canonical skills SHALL use the open `SKILL.md` format and keep primary instructions concise. Detailed decision rules, examples, scripts, and templates SHALL be placed in dedicated folders and loaded only when relevant.

Skill descriptions SHALL state:

- What the skill does.
- When it should be used.
- When it should not be used.

### 5.4 Evidence-Based Gates

Every completion claim SHALL be supported by evidence such as:

- OpenSpec validation output.
- File paths and artifact links.
- GitHub issue, Project, and pull request URLs.
- Test or eval results.
- Review results.
- An explicit blocked reason or known gap.

The lifecycle SHALL never infer success from an attempted command alone.

## 6. Source-of-Truth Model

The following ownership SHALL be preserved:

| Information | Source of truth |
|---|---|
| Problem statement, discussion, ownership, and lifecycle status | GitHub issue and Project |
| Observable requirements and acceptance scenarios | OpenSpec delta specs and living specs |
| Technical approach, tradeoffs, and implementation decisions | OpenSpec `design.md` and linked ADRs when needed |
| Detailed implementation checklist | OpenSpec `tasks.md` |
| Code and asset changes | Git repository and pull request |
| Review discussion | Pull request review |
| Automated verification evidence | CI checks, eval output, and OpenSpec verification |
| Historical change intent and implementation record | Archived OpenSpec change |

Information SHALL be linked across systems rather than copied in full.

## 7. Required Repository Scaffolding

The first-pass target structure SHALL support the following boundaries:

```text
.
├── AGENTS.md
├── README.md
├── openspec/
│   ├── config.yaml
│   ├── specs/
│   └── changes/
├── ai-planning/
│   ├── requirements/
│   ├── milestones/
│   ├── decisions/
│   ├── prompts/
│   └── research/
├── skills/
│   ├── base/
│   ├── stacks/
│   ├── repo-specific/
│   └── platform/
│       ├── claude/
│       └── codex/
├── workflows/
├── hooks/
│   ├── claude/
│   └── codex/
├── agents/
├── templates/
├── scripts/
│   ├── github/
│   └── validation/
├── evals/
│   ├── skills/
│   └── workflows/
└── .github/
    ├── ISSUE_TEMPLATE/
    ├── workflows/
    └── pull_request_template.md
```

Empty directories SHOULD NOT be committed solely to match the target tree. They SHOULD be added when the first owned artifact requires them.

OpenSpec-generated Claude and Codex integration files SHALL follow OpenSpec's supported locations. Repo-owned skills SHALL have one canonical source, with thin generated or platform-specific adapters where required. The implementation design SHALL prevent silent divergence between canonical skills and assistant installation locations.

## 8. Tooling Requirements

### TOOL-001: Required Local Tools

The foundation SHALL use:

- Git.
- Node.js 20.19 or newer.
- OpenSpec CLI.
- GitHub CLI.

Current environment discovery found Node.js `v26.7.0` and npm `11.19.0`. OpenSpec CLI and GitHub CLI were not installed at discovery time.

Expected installation commands are:

```bash
npm install -g @fission-ai/openspec@latest
brew install gh
```

The implementation plan SHALL include version verification, authentication, and a record of the tested OpenSpec version. It SHOULD avoid adding a project package manager solely to invoke globally managed CLIs during the first pass.

### TOOL-002: GitHub Authentication

Local automation SHALL use an authenticated GitHub CLI session with Project authorization.

```bash
gh auth login
gh auth refresh -s project
gh auth status
```

Authentication checks SHALL fail safely without exposing token values.

### TOOL-003: Structured Data

Automation SHALL use structured APIs and parsers. It SHALL NOT parse GitHub API responses or tracking metadata with fragile regular expressions.

The implementation SHOULD use JSON tracking metadata because Node.js can parse it without another dependency. This refines the provisional `tracking.yaml` recommendation in the GitHub research document.

## 9. OpenSpec Foundation Requirements

### SDD-001: Initialization

OpenSpec SHALL be initialized at the repository root for both Claude and Codex.

Before initialization, the implementation SHALL inspect existing `AGENTS.md`, Claude/Codex configuration, commands, prompts, and skills that OpenSpec could update or replace. Existing user-authored content SHALL be preserved.

### SDD-002: Workflow Profile

The installed OpenSpec workflow set SHALL support:

- Explore without creating artifacts or mutating GitHub by default.
- Propose a change.
- Apply a change.
- Verify a change.
- Sync delta specs into living specs.
- Archive a completed change.

Incremental artifact creation MAY be enabled if it improves reviewability without adding ongoing overhead.

### SDD-003: Project Context

`openspec/config.yaml` SHALL provide concise repository context covering:

- The repository's purpose and product boundary.
- Supported assistants: Claude and Codex.
- Canonical asset types and locations.
- The source-of-truth model in Section 6.
- Quality, testing, security, attribution, and portability expectations.
- The rule to use platform built-ins before creating duplicates.

Context SHALL be short enough to remain useful when injected into every artifact.

### SDD-004: Artifact Rules

OpenSpec artifact rules SHALL require the following.

For proposals:

- Problem and desired outcome.
- Scope and non-goals.
- Affected asset types and users.
- GitHub issue reference.
- Compatibility and migration impact when relevant.

For specifications:

- Observable behavior rather than implementation details.
- Normative requirement language.
- At least one acceptance scenario per requirement.
- Positive, negative, failure, and stop behavior where relevant.
- Claude/Codex portability behavior when the asset is cross-assistant.

For designs:

- Affected files and ownership boundaries.
- Alternatives and important tradeoffs.
- Test and eval strategy.
- Security and guardrail considerations.
- Attribution and licensing impact.
- Rollback or recovery considerations for automation changes.

For task plans:

- Small, ordered, verifiable implementation slices.
- Tests/evals alongside the behavior they verify.
- Validation, review, and documentation work.
- Explicit evidence expected at completion.
- No duplication of the task list into the primary GitHub issue.

### SDD-005: Living Specifications

Living specs SHALL be organized by durable capability rather than milestone, sprint, or implementation component.

The first likely capability specs are:

- `sdd-lifecycle`.
- `github-work-tracking`.
- `cross-assistant-assets`.
- `asset-quality`.

These names are planning candidates, not a requirement to create empty specs. Living specs SHOULD emerge from completed changes.

### SDD-006: Change Tracking Metadata

Each active OpenSpec change SHALL have exactly one machine-readable tracking file at:

```text
openspec/changes/<change-name>/tracking.json
```

Minimum content SHALL include:

```json
{
  "github": {
    "repository": "jizzoe/joericearchitect-ai-skills",
    "issue": 42,
    "issueUrl": "https://github.com/jizzoe/joericearchitect-ai-skills/issues/42",
    "projectNumber": 1
  }
}
```

The exact schema SHALL be versioned and validated. Unknown fields SHALL be preserved when safe. Missing or invalid required fields SHALL produce an actionable error.

### SDD-007: Custom Schema Decision

The first pass SHALL begin with OpenSpec project configuration and the standard spec-driven schema.

A custom schema SHALL be introduced only if at least one of these is demonstrated:

- Required quality information cannot be expressed reliably through artifact rules.
- Tracking metadata must become a first-class OpenSpec artifact.
- Additional artifact dependencies are needed to prevent invalid implementation flow.
- Generated artifacts repeatedly require the same manual structural correction.

Any custom schema SHALL be forked into `openspec/schemas/`, version controlled, validated, and documented. Generated OpenSpec internals SHALL NOT be patched in place because updates could overwrite them.

## 10. GitHub Work-Tracking Requirements

Detailed rationale and platform behavior are in [GitHub Issues, Projects, and OpenSpec Integration](../research/github-issues.md).

### GH-001: Issue Types Through Labels

Because the repository is currently under the personal GitHub account `jizzoe`, the first pass SHALL use labels rather than organization-managed issue types.

Required labels:

- `type:feature`.
- `type:bug`.
- `type:maintenance`.
- `type:roadmap`.
- `needs:spec`.
- `blocked`.
- `security`.

Status labels SHALL NOT be created.

### GH-002: Issue Forms

The repository SHALL provide:

- A feature issue form.
- A bug report form.
- Issue template configuration.

The feature form SHALL capture problem, desired outcome, consumer, initial acceptance criteria, scope constraints, affected asset types, and related links. It SHALL apply `type:feature` and `needs:spec`.

The bug form SHALL capture observed behavior, expected behavior, reproduction, evidence, environment/platform, regression status, and security impact. It SHALL apply `type:bug`. It SHALL use `needs:spec` only when expected behavior is missing or must change.

### GH-003: Project and Kanban

The first pass SHALL use one user-owned GitHub Project with a board grouped by a single-select `Status` field.

Required statuses:

- `Backlog`.
- `Ready`.
- `In Progress`.
- `In Review`.
- `Done`.

The `blocked` label SHALL represent blockage without replacing the underlying status.

Priority, estimate, iteration, start date, target date, and area fields SHALL be deferred until milestone planning demonstrates a need.

### GH-004: Roadmap Representation

Roadmap outcomes SHALL use `type:roadmap` parent issues or GitHub milestones. Committed roadmap work SHALL use real issues rather than Project draft items.

Roadmap and timeline views are supported but SHALL be deferred until the basic board lifecycle is working.

### GH-005: Issue Granularity

One OpenSpec change SHALL map to one primary GitHub issue unless a documented exception is approved.

OpenSpec task checkboxes SHALL remain in `tasks.md`. A task SHALL become a GitHub sub-issue only when it is independently assignable, deliverable, reviewable, blockable, or closable.

### GH-006: Pull Request Contract

The pull request template SHALL require:

- A closing reference such as `Closes #42` when merge delivers the issue.
- The OpenSpec change name and artifact link.
- A concise change summary.
- Verification evidence.
- Security/guardrail review status.
- Attribution/licensing status when third-party material is used.
- Known gaps or blocked checks.

The workflow SHALL account for GitHub closing keywords only closing issues automatically when the PR targets and merges into the default branch.

## 11. OpenSpec-to-GitHub Integration Requirements

### INT-001: Reciprocal Links

Every active OpenSpec change SHALL reference its primary issue through `tracking.json`.

Every linked issue SHALL contain an automation-managed block with:

- OpenSpec change name.
- Proposal link.
- Delta spec link.
- Design link.
- Task-plan link.

Automation SHALL update only the managed block and preserve all human-authored issue content.

### INT-002: Lifecycle Mapping

The following transitions SHALL be automated:

| Event | Required result |
|---|---|
| Feature or bug issue opened | Add to Project in `Backlog` |
| Explore | No mutation by default |
| Propose from an existing issue | Create/link change and tracking metadata; keep `needs:spec` until readiness criteria pass |
| Propose without an issue | Create an issue first, then create/link the OpenSpec change |
| Proposal, specs, design, and tasks reviewed | Remove `needs:spec`; move to `Ready` |
| Apply begins | Move to `In Progress` |
| Draft PR opened | Link PR; remain `In Progress` |
| PR marked ready for review | Move to `In Review` |
| PR returned to draft | Move to `In Progress` |
| PR merged into default branch | Close through PR closing keyword; move to `Done` |
| Sync | Update links if needed; do not imply delivery |
| Archive | Verify issue is closed and Project status is `Done`; record archive path |
| Change abandoned | Close as `not planned` with a reason |

For documentation-only or no-code changes, an explicit completion reason SHALL replace the merged-PR requirement.

### INT-003: Local and Remote Coordination

The integration SHALL use two layers:

1. Local SDD workflow automation updates GitHub immediately when an OpenSpec action occurs.
2. GitHub Actions validates and reconciles state after issue, push, and pull request events.

The GitHub Action layer SHALL NOT be the only synchronization mechanism because it cannot observe local OpenSpec actions before changes are pushed.

### INT-004: Idempotency and Recovery

All state-changing operations SHALL be idempotent.

Re-running an operation SHALL NOT:

- Create duplicate issues.
- Add duplicate Project items.
- Duplicate managed issue blocks or status comments.
- Re-close an already closed issue unnecessarily.
- Lose human-authored content.

The integration SHALL provide a read-only audit mode that reports drift. Repair mode SHALL state intended mutations and report resulting URLs and statuses.

### INT-005: Failure Behavior

If a GitHub mutation fails, the workflow SHALL:

- Preserve valid local OpenSpec artifacts.
- Report the failed operation and actionable cause.
- Avoid claiming the systems are synchronized.
- Provide a safe retry path.
- Avoid partially applying later dependent transitions.

Irreversible or unexpected mutations SHALL require explicit confirmation. Invoking a lifecycle action authorizes only the documented state transitions for that action.

## 12. GitHub Actions Requirements

### CI-001: Initial Workflows

The first pass SHALL implement or configure these responsibilities:

| Responsibility | Preferred mechanism |
|---|---|
| Add matching issues to Project as `Backlog` | Built-in Project auto-add first; Action only if insufficient |
| Closed issue or merged PR to `Done` | Built-in Project workflow |
| Validate OpenSpec changes | GitHub Action |
| Validate issue/change/PR linkage | GitHub Action |
| Reconcile draft, ready-for-review, and merged PR statuses | GitHub Action |

Workflow filenames MAY differ, but ownership SHALL remain clear and each workflow SHALL have one primary purpose.

### CI-002: Validation Gate

Pull requests that change `openspec/**`, `skills/**`, `workflows/**`, `hooks/**`, `agents/**`, `scripts/**`, or `evals/**` SHALL run applicable validation.

Validation SHALL include:

- OpenSpec structural validation.
- Tracking metadata schema validation.
- Reciprocal issue/change linkage.
- PR issue-closing linkage when merge means delivery.
- Relevant tests and evals.
- Repository formatting/link checks when available.

### CI-003: Permissions

Workflows SHALL declare least-privilege permissions explicitly.

Repository issue and PR operations SHOULD use `GITHUB_TOKEN`. Project operations for the current user-owned Project SHALL use a narrowly scoped secret because repository `GITHUB_TOKEN` cannot access Projects.

The design SHALL evaluate a fine-grained token where supported. If required Project operations cannot use it, a classic token with only necessary scopes MAY be used and SHALL be documented as technical debt. A GitHub App SHALL be preferred if the project later moves to an organization or spans repositories.

### CI-004: Untrusted Content

Workflows with secrets SHALL NOT execute untrusted pull request code. `pull_request_target` SHALL NOT check out and run untrusted head content.

External Actions SHALL be minimized and pinned to immutable commit SHAs. Dependency update automation SHOULD be configured for pinned Actions.

### CI-005: Event Recursion

The implementation SHALL account for GitHub's rule that most events caused by `GITHUB_TOKEN` do not trigger another workflow run. Workflows SHALL not depend on recursive events for correctness.

Reconciliation SHALL converge through direct state updates and explicit supported events rather than chained implicit workflow triggers.

## 13. Minimum Repo-Owned SDD Skills

Only the following repo-owned skills are in scope for this foundation. Their core instructions SHALL be assistant-neutral.

### SKILL-001: `github-issue-authoring`

Purpose:

- Turn a concrete feature request or bug report into a complete, correctly classified GitHub issue.
- Search for likely duplicates before creation.
- Distinguish intake details from durable OpenSpec requirements.
- Preview intended issue fields before mutation when context is ambiguous.

It SHALL use deterministic scripts for creation and metadata application.

### SKILL-002: `github-issue-to-openspec`

Purpose:

- Read an existing issue and create or initiate the corresponding OpenSpec change.
- Preserve the issue as the lifecycle record.
- Produce reciprocal links and tracking metadata.
- Identify missing information rather than invent requirements.

It SHALL delegate artifact generation to OpenSpec rather than reimplementing proposal, spec, design, or task generation.

### SKILL-003: `openspec-github-sync`

Purpose:

- Synchronize an OpenSpec change, its issue, Project status, and managed links.
- Support read-only audit and explicit repair modes.
- Apply the lifecycle mapping in Section 11.
- Report evidence for every successful or failed mutation.

It SHALL delegate API operations to deterministic scripts.

### SKILL-004: `github-pr-linkage`

Purpose:

- Prepare or validate PR linkage to the primary issue and OpenSpec change.
- Apply the correct closing keyword only when merge means delivery.
- Ensure required verification and attribution sections are present.
- Prevent archival from being treated as delivery before merge or an approved no-code completion.

Deterministic CI SHALL enforce the contract; the skill SHALL assist authors and explain failures.

### Skills Explicitly Deferred

The following SHALL NOT be built in this first pass:

- `skill-authoring`: use Claude/Codex built-ins initially.
- `implementation-planning`: use OpenSpec design/tasks initially.
- `verification-loop`: use OpenSpec verify plus first-pass quality gates initially.
- `code-review`.
- `systematic-debugging`.
- `test-driven-development`.
- `grounded-research`.
- `security-review` and `threat-modeling`.
- `architecture-decision-record`.
- `mcp-workflow-design`.
- Stack-specific skills.
- Backlog grooming, release readiness, dependency mapping, and work-summary skills.

This deferral does not remove the corresponding quality requirements. It avoids creating standalone skills before repeated use demonstrates the right boundaries.

## 14. Supporting Workflows and Scripts

The first pass SHALL include one repo-owned lifecycle workflow that composes OpenSpec actions with the four SDD skills and deterministic scripts. It SHALL NOT fork or duplicate OpenSpec's internal artifact logic.

Expected script capabilities are:

```text
scripts/github/
├── create-or-find-issue
├── update-managed-issue-block
├── add-project-item
├── set-project-status
├── link-pr
└── audit-lifecycle

scripts/validation/
├── validate-tracking
├── validate-openspec-linkage
└── validate-pr-contract
```

The exact language and file extensions are design decisions. The implementation SHOULD prefer the repository's existing runtime and standard libraries, keep API calls centralized, and expose machine-readable output for skills and Actions.

All mutation scripts SHALL support dry-run or preview behavior where practical.

## 15. Quality and Guardrail Requirements

### QUAL-001: Acceptance Criteria

Every behavioral requirement SHALL include at least one verifiable acceptance scenario. Negative, permission, failure, retry, and no-op scenarios SHALL be included when relevant.

### QUAL-002: Test and Eval Proportionality

Tests SHALL scale with risk:

- Pure validation logic SHALL have deterministic unit tests.
- GitHub API integration SHALL use fixtures or mocked responses for normal, missing, duplicate, unauthorized, and partial-failure cases.
- SDD skills SHALL have trigger and non-trigger evals.
- Lifecycle integration SHALL have end-to-end dry-run fixtures covering feature, bug, PR, merge, archive, and drift-repair paths.
- Live GitHub mutation tests SHALL be limited, explicit, and use disposable test issues where needed.

### QUAL-003: Clean Implementation

Implementation SHALL:

- Keep GitHub API access behind a small boundary.
- Avoid duplicated status-transition logic across local scripts and Actions.
- Use names rather than hard-coded mutable node IDs where possible and resolve IDs safely.
- Preserve human-authored content.
- Produce actionable errors.
- Keep generated files distinguishable from canonical source files.
- Avoid unrelated framework or dependency additions.

### QUAL-004: Review Gates

Before a change is marked ready or complete, review SHALL cover:

- Requirements and acceptance scenarios.
- Test/eval adequacy.
- Clean-code and maintainability concerns.
- Security, token, and untrusted-input handling.
- Claude/Codex portability.
- Attribution and licensing.
- Documentation and recovery behavior.

These checks MAY begin as OpenSpec and PR checklists. They SHOULD become standalone reusable skills only after the foundation is operational.

### QUAL-005: Security and Supply Chain

The foundation SHALL:

- Keep tokens out of skills, scripts, logs, fixtures, and committed configuration.
- Use least-privilege permissions.
- Redact sensitive command output.
- Avoid executing untrusted issue or PR content as shell code.
- Inspect and pin third-party Actions and dependencies.
- Treat copied scripts and hooks as supply-chain code requiring review.
- Require explicit approval for destructive or unexpected state changes.

### QUAL-006: Attribution

Any copied or adapted third-party asset SHALL be license-compatible and SHALL record:

- Original project and URL.
- Original license.
- Retrieval date.
- Upstream commit.
- Local modifications.

The repository SHALL eventually provide root-level third-party notices and per-asset attribution where needed. The first pass SHALL at minimum establish the required convention before any third-party implementation is copied.

## 16. Acceptance Baseline for the Foundation

The SDD foundation is complete when all of the following are demonstrated:

1. OpenSpec is installed, initialized at the root, and usable from both Claude and Codex.
2. Repository context and artifact rules generate reviewable proposals, specs, designs, and task plans.
3. Feature and bug issue forms create correctly labeled issues.
4. A GitHub Project board displays the five required statuses.
5. One real or disposable feature issue can be converted into a linked OpenSpec change.
6. The change and issue contain reciprocal, machine-verifiable links.
7. Starting implementation moves the issue to `In Progress`.
8. A draft PR remains `In Progress`; a ready PR moves to `In Review`.
9. Merging the PR closes the issue and moves it to `Done`.
10. OpenSpec verification reports objective evidence and known gaps.
11. Archival verifies delivery state and records the archived path.
12. Re-running synchronization creates no duplicate issue, Project item, block, or comment.
13. A drift audit detects at least one deliberately inconsistent fixture and repair restores the expected state.
14. GitHub Actions validate OpenSpec and linkage rules without exposing Project credentials to untrusted code.
15. The four initial SDD skills pass representative trigger, non-trigger, success, failure, and no-op evals.
16. Setup, authentication, recovery, and contributor workflow are documented sufficiently for a clean environment.

## 17. Candidate Planning Slices

This section suggests boundaries for milestone and story planning. It is not the implementation plan.

### Slice A: Tool and Repository Bootstrap

- Install and verify OpenSpec and GitHub CLI.
- Inspect existing assistant files.
- Initialize OpenSpec for Claude and Codex.
- Establish project context and the target directory boundaries.

### Slice B: GitHub Work Intake

- Create labels, feature form, bug form, and PR template.
- Create the Project and Kanban status model.
- Enable supported built-in Project workflows.

### Slice C: OpenSpec Quality Baseline

- Add artifact rules for requirements, acceptance scenarios, design, testing, security, portability, and attribution.
- Add `tracking.json` schema and validation.
- Prove one proposal-to-task artifact path without GitHub mutation.

### Slice D: Local Lifecycle Integration

- Build issue authoring and issue-to-OpenSpec skills.
- Build deterministic GitHub mutation scripts.
- Build synchronization audit and repair.
- Demonstrate issue-to-`Ready` and apply-to-`In Progress` transitions.

### Slice E: Pull Request and CI Integration

- Add linkage and validation Actions.
- Add PR state reconciliation.
- Demonstrate draft, ready-for-review, merge, closure, and `Done` transitions.

### Slice F: Verification and Hardening

- Add skill and lifecycle evals.
- Test idempotency, partial failure, unauthorized access, and drift repair.
- Complete security, portability, attribution, and recovery review.
- Archive the foundation change and verify the complete audit trail.

## 18. Decisions to Resolve During Design

The implementation plan SHALL resolve these without expanding first-pass scope:

1. The exact OpenSpec workflow profile and whether incremental artifact commands are enabled.
2. Whether repo-owned lifecycle commands are one parameterized workflow or several thin action-specific wrappers.
3. How canonical repo-owned skills are exposed to Claude and Codex without duplication or drift.
4. The versioned JSON schema for `tracking.json`.
5. Whether Project configuration belongs in a committed JSON file, repository variables, or both.
6. The smallest safe token model for the user-owned Project.
7. Which built-in Project workflows remove the need for custom Actions.
8. The script implementation language and machine-readable result contract.
9. The approved exemption format for no-code changes and very small bug fixes.
10. Whether the first live lifecycle test uses a disposable issue in this repository or a dedicated test repository.

## 19. Research Traceability

| Source | Details carried into this baseline |
|---|---|
| [GitHub Issues, Projects, and OpenSpec Integration](../research/github-issues.md) | Issue model, Kanban statuses, issue forms, lifecycle mapping, local/Actions synchronization, authentication, security, and initial GitHub skills |
| [Cross-Assistant AI Asset Best Practices](../research/cross-assistant-ai-assets-best-practices.md) | Assistant-neutral `SKILL.md`, progressive disclosure, asset boundaries, quality gates, evidence, MCP separation, script supply-chain review, and eval expectations |
| [Built-In AI Assets: Claude vs Codex](../research/builtin-ai-assets-claude-vs-codex.md) | Built-in capability reuse, non-duplication boundary, common skill format, and platform adapter separation |
| [SDLC Skills Repository Review](../research/sdlc-skills-repo-review.md) | Small triggerable skills, deterministic scripts, quality-gate sequencing, read-before-edit guardrails, layered organization, and recommended repo structure |
| [Initial Skill Foundation Prompt](../prompts/create-skill-foundations) | Product terminology, base-skill intent, cross-assistant goal, repo research mandate, and security/guardrail emphasis |

Where this baseline makes a narrower choice than the research, this document controls the first implementation pass. In particular:

- `tracking.json` supersedes the provisional `tracking.yaml` suggestion for the first pass.
- Only four GitHub/OpenSpec integration skills are initially in scope.
- Broad SDLC skills remain deferred while their essential checks are represented in OpenSpec and PR gates.
- The standard OpenSpec schema is the default starting point; customization is evidence-driven.
