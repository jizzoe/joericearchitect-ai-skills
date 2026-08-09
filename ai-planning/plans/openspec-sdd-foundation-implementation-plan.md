# OpenSpec SDD Foundation Implementation Plan

Date: 2026-08-08
Status: Proposed
Requirements baseline: [OpenSpec SDD Foundation Requirements](../requirements/openspec-sdd-foundation.md)

## 1. Outcome

Implement a lightweight specification-driven development foundation for this repository that connects:

- OpenSpec planning and living specifications.
- GitHub Issues for feature and bug work.
- A GitHub Project Kanban board for lifecycle status.
- Pull requests for reviewed delivery.
- GitHub Actions for validation and state reconciliation.
- Claude and Codex through assistant-neutral repo-owned skills and thin platform exposure.

The completed foundation will support this path:

```text
Feature or bug issue
  -> OpenSpec change
  -> reviewed proposal/spec/design/tasks
  -> implementation
  -> pull request
  -> verification and review
  -> merge and issue closure
  -> living spec sync and change archive
```

## 2. Planning Rules

The implementation will follow these rules:

1. One independently deliverable slice maps to one primary GitHub issue and one OpenSpec change.
2. Milestones group outcomes; they do not duplicate OpenSpec task lists.
3. OpenSpec `tasks.md` contains implementation steps. GitHub sub-issues are used only for independently deliverable work.
4. Each milestone ends with demonstrated behavior and objective evidence.
5. Local automation provides immediate GitHub synchronization; GitHub Actions validates and reconciles pushed state.
6. Built-in OpenSpec, Claude, Codex, and GitHub capabilities are used before repo-owned replacements.
7. Bootstrap work may use temporary manual linkage until the automation exists. That state will be reconciled later.
8. Common SDD capabilities are implemented as reusable global AI assets from the start, with product-specific values supplied through configuration rather than embedded in skills, workflows, scripts, or templates.

## 3. Current State

As of 2026-08-08:

| Item | State |
|---|---|
| Repository remote | `https://github.com/jizzoe/joericearchitect-ai-skills.git` |
| Node.js | Installed: `v26.7.0` |
| npm | Installed: `11.19.0` |
| OpenSpec CLI | Installed: `1.8.0` |
| OpenSpec initialized | Complete at repository root for Claude and Codex using OpenSpec `1.8.0` and the standard `spec-driven` schema |
| Installed OpenSpec workflows | Exact custom selection generated for Claude and Codex: `explore`, `propose`, `apply`, `verify`, `sync`, and `archive` |
| GitHub CLI | Installed and authenticated as `jizzoe` with Project access |
| GitHub issue forms | Not present |
| GitHub Project | Public user Project `AI Skills Development`, number `1`: https://github.com/users/jizzoe/projects/1 |
| GitHub Project integration | Project exists; fields, views, built-in workflows, and repository automation are not configured |
| GitHub Actions | Not present |
| Repo-owned SDD skills | Not present |
| Repository worktree | Contains existing uncommitted planning and IDE files; implementation must preserve unrelated changes |

## 4. Resolved Decisions

These decisions are made for the implementation based on the stated preference for low overhead, useful rigor, clean boundaries, and cross-assistant portability.

### DEC-001: Streamlined OpenSpec Workflow

Use the streamlined core workflow without incremental artifact commands.

Daily actions will be:

```text
explore
propose
apply
verify
sync
archive
```

OpenSpec's official core profile will be the initialization baseline. Because verification is mandatory and may not be included in the installed version's core profile, configure a minimal custom workflow selection that adds `verify` while retaining the core flow.

Do not enable `new`, `continue`, `ff`, `bulk-archive`, or `onboard` initially. Planning artifacts remain editable after generation, so review can still refine proposal, specs, design, and tasks before implementation.

### DEC-002: Standard Schema First

Start with OpenSpec's standard spec-driven schema and project-level context/rules.

Do not fork a custom schema during bootstrap. Reconsider only if repeated use demonstrates that required artifacts, dependencies, or formats cannot be enforced reliably through configuration and validation.

### DEC-003: One Parameterized Lifecycle Workflow

Create one repo-owned workflow, `openspec-github-lifecycle`, that composes the lifecycle actions with deterministic GitHub scripts.

Thin assistant-facing entry points may call this workflow with an action such as `propose`, `apply`, `verify`, `sync`, or `archive`. Lifecycle state-transition rules will remain centralized rather than duplicated across several skills.

### DEC-004: Canonical Skills and Platform Exposure

Canonical repo-owned skills will live under:

```text
skills/base/<skill-name>/
```

Claude and Codex exposure will be generated from the canonical source:

- Claude: `.claude/skills/`.
- Codex: `.agents/skills/`.

Use a deterministic synchronization script that copies or generates thin platform entries and a CI drift check. Do not use repository symlinks because cross-platform behavior and packaging support vary. Do not manually maintain two complete copies.

OpenSpec-generated assistant files remain owned by OpenSpec and will be refreshed with `openspec update`; repo-owned skill generation will not overwrite those files.

### DEC-005: Node.js Scripts With No Initial Runtime Dependencies

Implement deterministic automation as Node.js ESM scripts using `.mjs` and the Node standard library.

Reasons:

- Node is already required by OpenSpec and installed.
- JSON parsing and `node:test` are built in.
- Child processes can invoke `gh` with argument arrays without shell interpolation.
- The same scripts can run locally and in GitHub Actions.

The GitHub CLI will be the authenticated API boundary. Scripts may use `gh api graphql` where Project v2 operations require GraphQL.

No project package manager or third-party runtime dependency will be introduced until a concrete need is demonstrated.

### DEC-006: Versioned JSON Tracking Metadata

Each active change will have:

```text
openspec/changes/<change-name>/tracking.json
```

Version 1 will contain only durable linkage and delivery data:

```json
{
  "schemaVersion": 1,
  "change": "add-example-capability",
  "planning": {
    "milestone": "M1",
    "changeId": "M1-C1",
    "sequence": 101
  },
  "github": {
    "repository": "jizzoe/joericearchitect-ai-skills",
    "issueNumber": 42,
    "issueUrl": "https://github.com/jizzoe/joericearchitect-ai-skills/issues/42",
    "projectNumber": 1
  },
  "delivery": {
    "mode": "pull-request"
  }
}
```

Project item IDs, field IDs, PR state, timestamps, and last-sync results will not be committed. They are mutable external state and will be resolved at runtime.

### DEC-007: Checked-In Non-Secret GitHub Configuration

Store non-secret integration configuration in:

```text
config/sdd-github.json
```

It will define:

- Repository owner and name.
- User or organization Project ownership.
- Project number.
- Status field and option names.
- Managed labels.
- Managed issue-block markers.
- Default branch.

The initial Project identity is fixed:

```text
Owner: jizzoe
Owner type: user
Project number: 1
Title: AI Skills Development
Visibility: public
URL: https://github.com/users/jizzoe/projects/1
```

Repository and Actions variables may override environment-specific values. Secrets and tokens will never be committed.

The duplicated `projectNumber` in `tracking.json` preserves the historical project association. Validation will require it to match active configuration for active changes, while archived changes retain their original value.

### DEC-008: Personal Project Token First

Use the following authentication model:

- Local issue, PR, and Project operations: authenticated `gh` session with Project access.
- Actions issue and PR operations: repository `GITHUB_TOKEN` with explicit least privilege.
- Actions Project operations: `PROJECT_TOKEN` secret for the user-owned Project.

Start with the smallest GitHub-supported personal token that can perform the required user-Project mutations. If the available fine-grained token model cannot perform them, use a classic token with the documented `project` and required repository scopes, record the limitation, and rotate it periodically.

Move to a GitHub App if the repository moves to an organization or the Project spans multiple repositories.

### DEC-009: Built-In Project Automation First

Use GitHub Project built-in workflows for:

- Auto-adding managed issue types when possible.
- Setting newly added items to `Backlog`.
- Moving closed issues and merged PRs to `Done`.
- Archiving old completed items later if needed.

Custom Actions will handle only OpenSpec linkage validation and PR-state transitions that built-in workflows cannot express.

### DEC-010: No-Code Exemption

Default delivery mode is `pull-request`.

A change may use `delivery.mode: "no-code"` only when it changes no repository content or records an administrative completion. It requires a human-authored completion reason in tracking metadata and an issue comment.

Documentation edits, skill instructions, configuration, templates, and specs are repository changes and therefore use pull-request delivery. Typographical fixes that do not change intended behavior may omit an OpenSpec change but still use normal PR review when submitted through a PR.

Small bugs that change behavior are not exempt; they use a small OpenSpec change.

### DEC-011: Live Test in This Repository

Use disposable test issues in this repository rather than creating a separate test repository.

Test issues will:

- Use a clearly marked `[SDD test]` title.
- Receive a `test:automation` label.
- Avoid sensitive content.
- Be closed after the scenario.
- Remain available as evidence unless there is a specific reason to delete them.

External mutations will be previewed and require authorization before the first live run.

### DEC-012: Advisory Checks Before Required Checks

New CI workflows will run as advisory checks until they pass representative bootstrap and failure scenarios. After hardening, OpenSpec validation and linkage validation should become required merge checks.

This prevents immature automation from blocking bootstrap while still establishing the intended final guardrail.

### DEC-013: Quality Checks Before Standalone Quality Skills

Acceptance criteria, testing, clean-code review, security, attribution, and portability will begin as:

- OpenSpec artifact rules.
- Pull request checklist items.
- Deterministic validation.
- Milestone exit criteria.

Standalone skills for these concerns remain deferred until repeated use clarifies their boundaries. The four first-pass SDD integration skills remain the only new skills in scope.

### DEC-014: One-Based Milestone and Change Identifiers

Use `M#/C#` as the human shorthand and `M#-C#` as the machine-friendly planning identifier.

GitHub issue titles will include the planning identifier, while OpenSpec directories retain semantic names:

```text
Human: M4/C2
Issue: [M4-C2] Synchronize OpenSpec and GitHub lifecycle
OpenSpec change: add-openspec-github-lifecycle-sync
```

Milestones are numbered `M1` through `M7`. Change numbering restarts within each milestone.

### DEC-015: Multiple In-Flight Changes With Explicit Selection

Do not enforce a work-in-progress limit of one. Multiple changes may be `In Progress` or `In Review` when their hard dependencies are satisfied and no known shared-resource conflict makes concurrent work unsafe.

Each assistant session will select one active OpenSpec change explicitly. Switching changes will report the current change state, load the target change artifacts and tasks, and identify blockers before work resumes.

Cross-change hard dependencies will use GitHub issue dependency relationships. Within-change task dependencies will use stable task IDs and dependency annotations in `tasks.md`. Detailed rules are in the [dependency plan](openspec-sdd-foundation-dependency-plan.md).

### DEC-016: Global Reuse Is an Implementation Requirement

Every milestone change SHALL distinguish reusable SDD behavior from configuration specific to this product.

Reusable behavior SHALL be implemented in the appropriate global asset form:

- Skills for reasoning-heavy procedures and operational guidance.
- Workflows for lifecycle orchestration.
- Scripts for deterministic validation and external mutations.
- Templates for repeatable product scaffolding and metadata.
- Platform adapters for Claude- or Codex-specific exposure.

In this repository, “global skill” may refer to any of these reusable AI asset types. Reuse does not mean forcing deterministic scripts or configuration into `SKILL.md`.

Each OpenSpec proposal and design in this plan SHALL include a **Reuse Plan** identifying:

1. Which behavior is product-neutral and reusable.
2. Which canonical global assets will own that behavior.
3. Which values remain in product configuration.
4. How Claude and Codex consume the capability without duplicating canonical logic.
5. How portability will be evaluated against a second-product fixture.
6. Any behavior intentionally left product-specific and why.

The next planned consumer is a multi-repository, full-stack mobile bookkeeping product. Its likely implementation repositories include mobile UI, services/APIs, and infrastructure, with product-level specifications coordinating work across them.

Global foundations created here SHALL therefore:

- Avoid assuming a product has only one implementation repository.
- Model repositories as a configured collection, even when this product uses a single repository.
- Accept configured repository, Project, branch, status, label, and path values.
- Support a product-level specification context that can link issues and PRs across implementation repositories.
- Keep credentials and mutable GitHub IDs outside reusable assets.
- Avoid embedding `jizzoe`, Project `1`, this repository name, or bookkeeping-specific domain behavior in global logic.
- Preserve single-repository operation as the simplest supported configuration.

This first implementation SHALL build reusable interfaces and configuration boundaries now. It SHALL NOT expand scope into implementing the bookkeeping application or product-specific mobile architecture.

## 5. Delivery Structure

The foundation will be delivered through seven milestones and ten primary issues/OpenSpec changes.

```text
M1 Bootstrap
  |
  +--> M2 GitHub intake
  |
  +--> M3 OpenSpec quality and tracking
          |
          v
      M4 Local lifecycle integration
          |
          v
      M5 Pull request and CI integration
          |
          v
      M6 Dependency-aware project navigation
          |
          v
      M7 Verification and hardening
```

M2 and M3 may proceed in parallel after M1, but M4 requires both. M4-C2 and M5-C1 may proceed in parallel after M4-C1 stabilizes the shared GitHub interfaces. The full dependency graph and parallel-work windows are defined in the [dependency plan](openspec-sdd-foundation-dependency-plan.md).

## 6. Milestone 1: Tool and OpenSpec Bootstrap

Progress: OpenSpec initialization, the exact Claude/Codex workflow selection,
manual roadmap/issue linkage, and the first planning package are complete.
Project context, artifact rules, contributor documentation, and final assistant
discovery/verification checks remain for apply.

### Outcome

Claude and Codex can discover and use the repository's streamlined OpenSpec workflow, and the first linked change can be created without overwriting existing assistant configuration.

### Bootstrap Note

The first issue and links will be created manually because issue forms, tracking validation, and lifecycle automation do not yet exist. They will be reconciled after Milestone 4.

### Issue and OpenSpec Change

| ID | Issue | OpenSpec change |
|---|---|---|
| M1-C1 | Bootstrap OpenSpec for Claude and Codex | `bootstrap-openspec-foundation` |

### Work

1. Create the roadmap issue `Establish OpenSpec SDD foundation` manually.
2. Create the bootstrap feature issue manually and link it to the roadmap issue.
3. Verify the installed GitHub CLI authentication and Project access without exposing credentials.
4. Inventory existing assistant files, prompts, skills, and OpenSpec legacy artifacts.
5. Record the OpenSpec version and initialization output.
6. Initialize OpenSpec at the repository root for Claude and Codex using the core profile.
7. Configure the minimal workflow selection to add `verify` without incremental artifact actions.
8. Add concise repository context and initial artifact rules to `openspec/config.yaml`.
9. Create the first proposal and link it manually to the bootstrap issue.
10. Verify generated OpenSpec workflow discovery in both assistants.
11. Document update and recovery commands.

### Expected Files

```text
openspec/config.yaml
openspec/specs/
openspec/changes/bootstrap-openspec-foundation/
AGENTS.md or OpenSpec-managed equivalent
.claude/... OpenSpec-managed workflow files
.agents/... OpenSpec-managed workflow files
```

Exact generated paths will follow OpenSpec `1.8.0`; the implementation will verify rather than assume them.

### Verification

- `openspec --version` reports the recorded version.
- OpenSpec initialization completes without deleting user-authored content.
- OpenSpec status and validation commands run successfully.
- Claude and Codex can each identify the available streamlined actions.
- The bootstrap issue and change link to one another, initially through manual links.
- The bootstrap design identifies reusable OpenSpec setup behavior and isolates this product's context in configuration.
- Setup and recovery are documented.

### Exit Gate

Do not begin automated integration until the generated files and update behavior are understood and committed as an intentional bootstrap change.

## 7. Milestone 2: GitHub Work Intake and Kanban

### Outcome

Feature and bug work can be created consistently and viewed on a basic Kanban board.

### Issue and OpenSpec Change

| ID | Issue | OpenSpec change |
|---|---|---|
| M2-C1 | Establish GitHub issue intake and Kanban | `establish-github-work-intake` |

### Work

1. Create the managed label set and descriptions.
2. Add feature and bug issue forms.
3. Add issue-template configuration.
4. Add the pull request template.
5. Verify the existing public user-owned Project `AI Skills Development` (`jizzoe`, project `1`).
6. Configure `Backlog`, `Ready`, `In Progress`, `In Review`, and `Done`.
7. Create and save the Kanban board view.
8. Enable built-in auto-add and completed-to-`Done` workflows where supported.
9. Add `config/sdd-github.json` with the existing Project identity and non-secret configuration.
10. Create one feature-form issue and one bug-form issue to verify intake behavior.

### Expected Files

```text
.github/ISSUE_TEMPLATE/feature.yml
.github/ISSUE_TEMPLATE/bug.yml
.github/ISSUE_TEMPLATE/config.yml
.github/pull_request_template.md
config/sdd-github.json
```

### Verification

- Forms require the intended information and apply the correct labels.
- New managed issues appear once on the Project in `Backlog`.
- Closing a test issue moves it to `Done`.
- No status labels exist.
- The Project board shows the five required columns.
- GitHub setup assets can render or validate against an alternate product configuration without containing this product's fixed repository or Project values.

### Exit Gate

Developers can create and find work without knowing OpenSpec internals, and the board reflects issue state without custom code.

## 8. Milestone 3: OpenSpec Quality and Tracking Baseline

### Outcome

OpenSpec changes have consistent quality rules and machine-valid issue linkage metadata before GitHub mutations are automated.

### Issues and OpenSpec Changes

| ID | Issue | OpenSpec change |
|---|---|---|
| M3-C1 | Establish OpenSpec artifact quality rules | `establish-openspec-quality-rules` |
| M3-C2 | Add versioned OpenSpec change tracking | `add-openspec-change-tracking` |

### M3-C1: Quality Rules

1. Refine proposal rules for scope, non-goals, issue linkage, affected assets, and compatibility.
2. Refine spec rules for observable behavior and acceptance scenarios.
3. Refine design rules for tests, security, portability, attribution, and recovery.
4. Refine task rules for vertical slices, stable task IDs, dependency annotations, known-safe parallel work, validation, review, and evidence.
5. Add a representative sample change fixture.
6. Confirm the standard schema remains sufficient.

### M3-C2: Tracking

1. Define tracking schema version 1.
2. Add valid, missing-field, invalid-type, unknown-field, and mismatched-change fixtures.
3. Implement deterministic tracking validation.
4. Add creation and update helpers that preserve unknown safe fields.
5. Add a read-only command that prints normalized linkage as JSON.
6. Validate the bootstrap and Milestone 2 changes or record a bootstrap compatibility exception.

### Expected Files

```text
openspec/config.yaml
schemas/openspec-tracking-v1.schema.json
scripts/validation/validate-tracking.mjs
scripts/validation/lib/tracking.mjs
scripts/validation/test/tracking.test.mjs
scripts/validation/fixtures/tracking/
```

The JSON Schema documents the contract. The no-dependency Node validator enforces the required subset explicitly and is tested against the schema fixtures.

### Verification

- OpenSpec artifacts generated from a representative prompt contain the required sections.
- Specifications remain behavioral and do not absorb implementation tasks.
- Valid tracking files normalize successfully.
- Invalid files fail with precise field paths and nonzero exit status.
- Validator output supports human-readable and JSON modes.
- Tracking and configuration contracts can represent one or several implementation repositories without changing their core schema shape.
- No GitHub mutation occurs in this milestone.

### Exit Gate

The repository can determine locally and deterministically whether an OpenSpec change is sufficiently structured and linked for later automation.

## 9. Milestone 4: Local GitHub Lifecycle Integration

### Outcome

An assistant can create or consume a GitHub issue, connect it to an OpenSpec change, and synchronize lifecycle state immediately from a local session.

### Issues and OpenSpec Changes

| ID | Issue | OpenSpec change |
|---|---|---|
| M4-C1 | Add GitHub issue authoring and OpenSpec intake | `add-github-openspec-intake` |
| M4-C2 | Synchronize OpenSpec and GitHub lifecycle | `add-openspec-github-lifecycle-sync` |

### M4-C1: Intake

1. Implement a shared `gh` execution boundary with safe argument passing and JSON results.
2. Implement duplicate search and create-or-find behavior.
3. Implement label and Project membership operations.
4. Implement managed issue-block rendering and replacement.
5. Build `github-issue-authoring`.
6. Build `github-issue-to-openspec`.
7. Generate Claude and Codex exposure from canonical skills.
8. Add trigger, non-trigger, success, missing-information, and API-failure evals.

### M4-C2: Lifecycle Synchronization

1. Implement Project and status resolution by configured names.
2. Implement idempotent status transitions.
3. Implement read-only lifecycle audit.
4. Implement explicit repair mode.
5. Build `openspec-github-sync`.
6. Build `openspec-github-lifecycle` orchestration.
7. Integrate propose-to-`Ready` and apply-to-`In Progress` transitions.
8. Backfill and reconcile bootstrap changes.

### Expected Files

```text
skills/base/github-issue-authoring/
skills/base/github-issue-to-openspec/
skills/base/openspec-github-sync/
workflows/openspec-github-lifecycle/
scripts/github/lib/gh.mjs
scripts/github/lib/issues.mjs
scripts/github/lib/projects.mjs
scripts/github/create-or-find-issue.mjs
scripts/github/update-managed-issue-block.mjs
scripts/github/set-project-status.mjs
scripts/github/audit-lifecycle.mjs
scripts/github/test/
evals/skills/
evals/workflows/openspec-github-lifecycle/
```

### Verification

- Dry runs show intended operations without external mutation.
- Repeated create-or-find returns the same issue.
- Managed-block updates preserve human-authored text.
- Repeated Project add/status operations do not duplicate items.
- Missing authorization and missing Project fields fail safely.
- Issue-to-OpenSpec creation produces reciprocal links and valid tracking.
- Starting apply moves the linked issue to `In Progress`.
- Audit detects intentionally inconsistent fixture state.
- Repair restores expected state and reports resulting URLs/status.
- Canonical skills and scripts operate from injected product configuration and pass an alternate multi-repository fixture.

### Exit Gate

Local lifecycle synchronization is reliable, idempotent, and recoverable before remote Actions are allowed to mutate the same state.

## 10. Milestone 5: Pull Request and GitHub Actions Integration

### Outcome

Pull request state drives review and completion status, while CI validates OpenSpec and linkage contracts securely.

### Issues and OpenSpec Changes

| ID | Issue | OpenSpec change |
|---|---|---|
| M5-C1 | Enforce OpenSpec and PR linkage | `enforce-openspec-pr-linkage` |
| M5-C2 | Reconcile Project status from pull requests | `reconcile-project-status-from-prs` |

### M5-C1: Linkage and Validation

1. Build `github-pr-linkage`.
2. Implement PR contract validation.
3. Add OpenSpec validation for relevant changed paths.
4. Add tracking and reciprocal-link validation.
5. Add canonical-skill/platform-exposure drift validation.
6. Configure advisory GitHub checks.
7. Ensure failure output links to corrective instructions.

### M5-C2: Project Reconciliation

1. Handle draft PR opened: remain `In Progress`.
2. Handle ready-for-review: move to `In Review`.
3. Handle conversion back to draft: move to `In Progress`.
4. Handle merged-to-default: allow closing keyword to close issue and built-in workflow to set `Done`.
5. Handle closed-unmerged: return to `In Progress` or retain current state with an explanatory audit result.
6. Verify no event-recursion dependency.
7. Test untrusted pull request behavior without exposing Project credentials.

### Expected Files

```text
skills/base/github-pr-linkage/
scripts/validation/validate-openspec-linkage.mjs
scripts/validation/validate-pr-contract.mjs
.github/workflows/openspec-validate.yml
.github/workflows/openspec-linkage.yml
.github/workflows/project-status-sync.yml
```

Workflow names may be consolidated if doing so reduces duplicated setup without mixing trust boundaries.

### Verification

- PRs with missing issue or change links fail the advisory check.
- A valid draft PR leaves the issue `In Progress`.
- Marking the PR ready moves the issue to `In Review`.
- Returning it to draft moves the issue back to `In Progress`.
- Merging into the default branch closes the issue and moves it to `Done`.
- Closing without merge does not mark delivery complete.
- Fork/untrusted-content scenarios cannot access `PROJECT_TOKEN`.
- Re-running workflows converges without duplicate updates.
- Reusable workflows can route issue and PR linkage using configured repositories rather than assuming the current repository.

### Exit Gate

Repository events and local actions agree on state, and CI can detect or repair drift without creating a credential or untrusted-code path.

## 11. Milestone 6: Dependency-Aware Project Navigation

### Outcome

Developers and assistants can see all work in flight, determine what is blocked or actionable, identify changes and tasks that can proceed in parallel, select the next recommended change, and switch explicitly between multiple active OpenSpec changes.

### Issue and OpenSpec Change

| ID | Issue | OpenSpec change |
|---|---|---|
| M6-C1 | Add dependency-aware project work selection | `add-dependency-aware-work-selection` |

### Dependency Plan Requirements

The change SHALL implement and enforce the conventions in the [SDD foundation dependency plan](openspec-sdd-foundation-dependency-plan.md).

It SHALL:

1. Use GitHub issue `blocked by` and `blocking` relationships as the source of truth for cross-change hard dependencies.
2. Require every OpenSpec design to identify upstream changes, downstream changes, shared files, shared interfaces, and shared external state when relevant.
3. Require stable task IDs in `tasks.md` and explicit `Depends on` annotations when task order is not obvious.
4. Support optional `Parallel with` annotations for known-safe task concurrency.
5. Validate that a task-level dependency on another change corresponds to a GitHub issue dependency.
6. Detect dependency cycles, missing change references, completed blockers, and contradictory dependency records.
7. Treat absence of a hard dependency as necessary but not sufficient evidence of safe parallel work; shared-file and shared-state conflicts must also be considered.

### Project Planning Fields

Add and backfill these Project fields:

| Field | Type | Purpose |
|---|---|---|
| `Milestone` | Single select | `M1` through `M7` outcome grouping |
| `Change` | Text | Planning identifier such as `M4-C2` |
| `Sequence` | Number | Stable planned order among otherwise eligible changes |
| `Priority` | Single select | Explicit `P0` through `P3` override |

`Status` remains the lifecycle field. Dependencies remain native issue relationships and are not replaced by Project fields.

### Work Selection Requirements

The workflow SHALL classify work as:

- **In flight:** `In Progress` or `In Review`.
- **Actionable:** in-flight or `Ready`, with every hard dependency satisfied.
- **Blocked:** at least one unresolved blocker or known dependency conflict.
- **Parallel candidates:** multiple actionable changes without a dependency path or known shared-resource conflict.
- **Next:** highest-priority actionable change, then lowest `Sequence` value.

Selection SHALL follow this order:

1. An explicit user-selected change.
2. An actionable `In Progress` change.
3. `In Review` work requiring review or merge action.
4. The highest-priority, lowest-sequence `Ready` change.
5. The lowest-sequence `Backlog` change needing specification.

When more than one change can proceed safely, the workflow SHALL show the parallel candidates and recommend one. It SHALL NOT silently start or switch work.

### Multiple Active Changes and Switching

Add lifecycle operations equivalent to:

```text
status       Show in-flight, actionable, blocked, and parallel work
next         Recommend the next change and exact OpenSpec action
switch       Select a named M#/C# or semantic OpenSpec change for this session
dependencies Show the dependency graph, blockers, and parallel candidates
```

Switching SHALL:

1. Report the current change, incomplete task IDs, and working-tree concerns.
2. Require an explicit target change.
3. Load the target change's proposal, specs, design, tasks, and tracking metadata.
4. Report unresolved dependencies and the next actionable task.
5. Avoid treating the most recently modified change as implicitly selected.

### Expected Files

```text
workflows/openspec-github-lifecycle/references/work-selection.md
scripts/github/project-status.mjs
scripts/github/select-next-work.mjs
scripts/github/dependency-report.mjs
scripts/github/lib/dependencies.mjs
scripts/github/test/dependencies.test.mjs
scripts/github/test/work-selection.test.mjs
evals/workflows/openspec-github-lifecycle/dependency-selection/
```

Existing workflow and script boundaries MAY absorb these files when that produces a cleaner implementation without duplicating policy.

### Verification

- Two independent `Ready` changes are reported as parallel candidates.
- A blocked change is excluded from `Next` and reports its unresolved blocker.
- Priority overrides sequence only among actionable changes.
- A dependency cycle fails validation with the complete cycle path.
- Multiple changes can remain `In Progress` and be listed accurately.
- Switching changes reloads the correct OpenSpec artifacts and reports the next incomplete actionable task.
- Shared-file or shared-state conflicts produce a warning or block parallel recommendation according to configured severity.
- Read-only `status`, `next`, and dependency reporting do not mutate GitHub or local artifacts.
- Dependency reporting can represent changes whose implementation work spans multiple configured repositories.

### Exit Gate

The workflow can answer “Where are we?”, “What is blocked?”, “What can proceed in parallel?”, and “What should I work on next?” from GitHub Project and OpenSpec evidence.

## 12. Milestone 7: Verification, Hardening, and Handoff

### Outcome

The complete foundation is evaluated, documented, and made reliable enough to govern subsequent skill development.

### Issue and OpenSpec Change

| ID | Issue | OpenSpec change |
|---|---|---|
| M7-C1 | Verify and harden the SDD foundation | `verify-sdd-foundation` |

### Work

1. Execute the full feature lifecycle with a disposable issue.
2. Execute the bug lifecycle, including missing-spec and already-specified behavior paths.
3. Test duplicate issue detection.
4. Test idempotent re-runs at each transition.
5. Test invalid tracking, missing auth, missing Project fields, API failure, and partial failure.
6. Test drift audit and repair.
7. Review all Actions permissions and trust boundaries.
8. Review canonical skills for Claude/Codex portability and drift.
9. Review third-party Actions and licenses; create attribution records where needed.
10. Document setup, normal operation, recovery, token rotation, and OpenSpec updates.
11. Verify dependency-aware status, next-work selection, parallel-candidate reporting, and change switching.
12. Test dependency cycles, stale blockers, shared-resource conflicts, and concurrent change updates.
13. Run the reusable SDD assets against a non-mutating multi-repository bookkeeping-product fixture.
14. Confirm global assets contain no current-product or bookkeeping-domain constants.
15. Promote stable validation checks from advisory to required after user approval.
16. Sync living specs and archive completed changes.
17. Reconcile all bootstrap issues and Project statuses.

### Expected Files

```text
README.md
AGENTS.md
docs/ or repository contributor guidance as selected during design
evals/workflows/openspec-github-lifecycle/
evals/fixtures/products/mobile-bookkeeping-multi-repo/
THIRD_PARTY_NOTICES.md when required
openspec/specs/sdd-lifecycle/spec.md
openspec/specs/github-work-tracking/spec.md
openspec/specs/cross-assistant-assets/spec.md
openspec/specs/asset-quality/spec.md
```

Living spec paths will emerge through archived change deltas and will not be created empty in advance.

### Verification

All 16 acceptance-baseline items in the requirements document and all M6 dependency-navigation verification criteria are demonstrated or have an explicit approved exception with evidence.

### Exit Gate

The foundation can govern its next change without manual status maintenance, duplicate planning data, or hidden platform assumptions.

## 13. Issue and Change Creation Order

Create work in this sequence:

| Order | Milestone | Issue | OpenSpec change | Depends on |
|---:|---:|---|---|---|
| 1 | M1-C1 | Bootstrap OpenSpec for Claude and Codex | `bootstrap-openspec-foundation` | Manual bootstrap |
| 2 | M2-C1 | Establish GitHub issue intake and Kanban | `establish-github-work-intake` | M1-C1 |
| 3 | M3-C1 | Establish OpenSpec artifact quality rules | `establish-openspec-quality-rules` | M1-C1 |
| 4 | M3-C2 | Add versioned OpenSpec change tracking | `add-openspec-change-tracking` | M3-C1 |
| 5 | M4-C1 | Add GitHub issue authoring and OpenSpec intake | `add-github-openspec-intake` | M2-C1, M3-C2 |
| 6 | M4-C2 | Synchronize OpenSpec and GitHub lifecycle | `add-openspec-github-lifecycle-sync` | M4-C1 |
| 7 | M5-C1 | Enforce OpenSpec and PR linkage | `enforce-openspec-pr-linkage` | M4-C1, M3-C2 |
| 8 | M5-C2 | Reconcile Project status from pull requests | `reconcile-project-status-from-prs` | M4-C2, M5-C1 |
| 9 | M6-C1 | Add dependency-aware project work selection | `add-dependency-aware-work-selection` | M5-C2 |
| 10 | M7-C1 | Verify and harden the SDD foundation | `verify-sdd-foundation` | All prior changes |

The roadmap issue `Establish OpenSpec SDD foundation` will be the parent issue for these ten issues. Hard dependencies and safe parallel-work windows are defined in the [dependency plan](openspec-sdd-foundation-dependency-plan.md).

## 14. Definition of Ready

An issue may move to `Ready` when:

- The desired outcome is clear.
- Scope and non-goals are explicit.
- The OpenSpec proposal, delta specs, design, and tasks are reviewable.
- Acceptance evidence is identified.
- Required dependencies are complete or explicitly handled.
- The dependency plan identifies upstream changes, downstream impact, shared resources, and known parallel work.
- The Reuse Plan identifies global assets, product configuration, and the portability verification approach.
- Security and credential implications are understood.
- No unresolved decision would materially change the implementation.

## 15. Definition of Done

An issue may move to `Done` when:

- Required implementation and documentation are complete.
- Relevant tests and evals pass.
- OpenSpec and linkage validation pass.
- Security, portability, attribution, and maintainability reviews are complete.
- Reusable capabilities are implemented in canonical global asset locations, with product-specific values isolated in configuration.
- The relevant assets pass both the current-product fixture and the non-mutating multi-repository portability fixture.
- Known gaps are recorded.
- The PR is merged into the default branch, or an approved `no-code` completion is recorded.
- The GitHub issue is closed.
- The Project item is `Done`.
- Delta specs are synced and the OpenSpec change is archived.
- Final evidence is linked from the issue or PR.

## 16. Risk Controls

| Risk | Control |
|---|---|
| OpenSpec update overwrites custom work | Keep repo-owned skills separate; inspect generated changes; use drift checks |
| Duplicate issue or Project records | Create-or-find semantics, managed markers, idempotency tests |
| Local and Action logic diverge | Shared Node modules and one transition table |
| Project field IDs change | Resolve by configured names at runtime; fail on ambiguity |
| Token exposure | Least privilege, explicit workflow permissions, no secret output, no untrusted checkout |
| Action recursion assumptions | Direct reconciliation and explicit events; do not rely on token-triggered chained workflows |
| Issue body corruption | Replace only bounded managed blocks and test preservation |
| Skill copies drift across assistants | Canonical source, generated exposure, CI comparison |
| Dependency cycles or stale blockers | Native issue dependencies, cycle validation, dependency audit, actionable blocker reports |
| Unsafe parallel changes | Explicit task/change dependencies plus shared-file and shared-state conflict checks |
| Ambiguous active change | Explicit session selection and switch workflow; never infer from modification time |
| Reusable assets become product-coupled | Mandatory Reuse Plan, configurable repository collection, alternate-product fixture, and hard-coded-value checks |
| Premature bookkeeping scope expansion | Test only generic multi-repository portability; defer bookkeeping domain behavior to that product's own specs |
| Too much initial process | Seven outcome milestones, ten vertical changes, no per-checkbox issues, standard schema first |
| Checks block bootstrap | Advisory checks until representative tests pass |
| Third-party supply-chain risk | Minimize dependencies, pin Actions by SHA, document licenses and provenance |

## 17. User Decisions

The technical plan is otherwise resolved. The Project identity decision is complete; the remaining decisions affect credentials, external test mutations, or repository governance and require the repository owner's choice.

### USER-001: GitHub Project Name and Visibility

Status: **Resolved**

- Name: `AI Skills Development`.
- Owner: personal account `jizzoe`.
- Project number: `1`.
- Visibility: public.
- URL: https://github.com/users/jizzoe/projects/1.
- Description: `Plan and track reusable AI skills, OpenSpec changes, issues, pull requests, and SDD automation.`

### USER-002: Project Token

Status: **Resolved**

- Use a user Project-capable token stored as the Actions secret `PROJECT_TOKEN`.
- Use the narrowest supported permissions.
- Prefer a fine-grained token if it supports the required user-Project mutations; otherwise use the documented classic `project` plus required repository scope.
- Replace it with a GitHub App if the project moves into an organization.

### USER-003: First Live Automation Test

Status: **Resolved**

- Use disposable `[SDD test]` issues in this repository.
- Preserve closed issues as an audit trail.
- Store transient local test logs and scratch output under `.sdd-test-output/`, which is excluded from Git.
- Keep deterministic fixtures and durable test assets version controlled under `evals/` or the applicable test directory.
- Ask for authorization immediately before the first external mutation.

### USER-004: Required Merge Checks

Status: **Resolved**

- Run checks as advisory through Milestones 1-6.
- At Milestone 7, make OpenSpec validation and issue/change/PR linkage required checks on the default branch.
- Keep full lifecycle reconciliation non-blocking but visible until it has additional operating history.

## 18. Next Execution Step

Completed bootstrap and proposal work:

- GitHub CLI authentication and Project access verified.
- Existing assistant/OpenSpec files inventoried.
- OpenSpec initialized with the core profile for Claude and Codex.
- Repository-owner decisions recorded.
- Roadmap issue #1 and M1-C1 issue #2 created and related.
- Exact six-action workflow generated for Claude and Codex.
- Proposal, delta specs, design, and tasks generated and strictly validated.

Review the `bootstrap-openspec-foundation` planning package. After a separate
explicit apply request, begin implementation at task 2.1. No other milestone
should begin until M1-C1 passes its exit gate and OpenSpec-generated file
ownership is understood.
