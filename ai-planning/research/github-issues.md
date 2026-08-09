# GitHub Issues, Projects, and OpenSpec Integration

Date: 2026-08-08

## Purpose

Define a lightweight GitHub work-tracking model for this repository that:

- Tracks feature development and bugs as issues.
- Connects implementation work and pull requests to issues.
- Supports a simple Kanban board now and roadmap planning later.
- Keeps GitHub issue and Project status synchronized with OpenSpec actions.
- Uses GitHub Actions to validate and reconcile the workflow.
- Remains transparent to developers without duplicating the full specification or implementation plan in GitHub.

## Recommendation

Use four connected GitHub capabilities:

1. **GitHub Issues** are the work records developers discover, discuss, assign, and close.
2. **GitHub Projects** is the Kanban and roadmap presentation layer over issues and pull requests.
3. **Pull requests** link implementation to issues and close completed issues when merged.
4. **GitHub Actions** validates links and reconciles issue and Project state after repository events.

OpenSpec remains the source of truth for requirements, design, and detailed implementation tasks. GitHub remains the source of truth for work ownership and lifecycle status.

The central mapping should be:

> One OpenSpec change has one primary GitHub issue. Independently deliverable slices may have sub-issues. OpenSpec checklist items do not automatically become separate issues.

This avoids maintaining the same task list in both `tasks.md` and GitHub.

## What GitHub Issues Are

A GitHub issue is a repository-scoped work item. It has a title and Markdown body, plus comments and metadata such as labels, assignees, milestones, relationships, and Projects membership.

Issues can represent:

- Feature work.
- Bugs.
- Tasks and maintenance.
- Larger initiatives with sub-issues.
- Design discussions with a concrete outcome.
- Release or roadmap work.

Important relationships include:

- **Issue to pull request:** A PR can reference or close an issue.
- **Parent to sub-issue:** A larger issue can track independently deliverable child issues.
- **Blocked by / blocking:** Dependencies can be represented explicitly.
- **Issue to milestone:** Milestones group issues and PRs around a target outcome or release.
- **Issue to Project:** Projects adds configurable status, dates, priority, views, and automation.

GitHub Issues is not a full specification system. Long-lived requirements, acceptance scenarios, design decisions, and detailed implementation checklists belong in OpenSpec. The issue should summarize the work and link to those artifacts.

## Issues, Projects, and Milestones

These features have distinct jobs:

| Capability | Recommended use |
|---|---|
| Issue | A trackable feature, bug, or independently deliverable task |
| Sub-issue | A slice that can be assigned, implemented, reviewed, or closed independently |
| Project | Kanban board, filtered views, custom fields, and roadmap visualization |
| Milestone | A release, meaningful delivery target, or time-bounded outcome |
| OpenSpec change | Requirements, acceptance scenarios, design, and implementation plan for an issue |
| Pull request | Reviewed implementation that resolves one or more issues |

GitHub Projects supports table, board, and roadmap views over the same items. A board can group items by a `Status` field. A roadmap can position work using start date, target date, or iteration fields and can display milestone markers.

Roadmap planning is therefore supported. It does not require a separate issue system. Start with a board view and add a roadmap view when dates or milestones become useful.

## Minimal Issue Model

This repository is currently hosted under the personal GitHub account `jizzoe`, not a GitHub organization. GitHub's first-class issue types are managed at the organization level. Use labels for type classification unless the repository is moved into an organization later.

### Labels

Start with a small controlled set:

| Label | Meaning |
|---|---|
| `type:feature` | New or changed user-visible/reusable capability |
| `type:bug` | Behavior that differs from the specification or expected behavior |
| `type:maintenance` | Refactoring, dependency, documentation, or operational work |
| `type:roadmap` | Parent issue representing a milestone or larger outcome |
| `needs:spec` | Work is understood enough to track but has no approved OpenSpec change |
| `blocked` | Progress requires another decision or work item |
| `security` | Work has a material security or guardrail concern |

Do not use labels to duplicate Kanban status. Project `Status` should be the only status field.

### Kanban Status

Use one Project single-select field named `Status`:

| Status | Meaning |
|---|---|
| `Backlog` | Captured but not ready to implement |
| `Ready` | Scope, acceptance criteria, and implementation plan are sufficient |
| `In Progress` | Active implementation has started |
| `In Review` | A non-draft PR is awaiting review or required checks |
| `Done` | The issue is closed because the change was delivered |

Use the `blocked` label rather than adding a sixth status. This allows a blocked item to retain its underlying lifecycle position.

### Optional Fields

Do not add these until they solve a real planning problem:

- `Priority`: `P0`, `P1`, `P2`, `P3`.
- `Start date` and `Target date` for roadmap layout.
- `Estimate` for rough relative sizing.
- `Area` for base skills, workflows, hooks, agents, evals, or infrastructure.

## Issue Templates

Use GitHub issue forms so feature and bug reports consistently collect the information needed to decide whether to create an OpenSpec change.

Recommended files:

```text
.github/
├── ISSUE_TEMPLATE/
│   ├── feature.yml
│   ├── bug.yml
│   └── config.yml
└── pull_request_template.md
```

### Feature Form

Collect:

- Problem or need.
- Desired outcome.
- Who or what uses the capability.
- Initial acceptance criteria.
- Non-goals or constraints.
- Relevant skills, workflows, hooks, agents, or other assets.
- Links to related issues or research.

Automatically apply `type:feature` and `needs:spec`.

The feature issue is an intake record, not the final specification. `/opsx:propose` should turn the issue into an OpenSpec change and update the issue with links to the proposal, delta specs, design, and tasks.

### Bug Form

Collect:

- Observed behavior.
- Expected behavior.
- Reproduction steps or triggering prompt.
- Relevant output, logs, screenshots, or fixture.
- Environment and assistant/platform.
- Regression status, if known.
- Security or data-exposure impact.

Automatically apply `type:bug`. A bug should receive `needs:spec` only when fixing it changes or clarifies expected behavior. A small implementation defect with already-specified behavior can use a lightweight OpenSpec change or an explicitly documented exemption.

## Feature Work and Task Breakdown

Use this hierarchy:

```text
Roadmap issue or milestone
└── Feature issue / OpenSpec change
    ├── OpenSpec tasks.md checklist
    ├── Optional independently deliverable sub-issue
    └── Pull request that closes the issue
```

Create a sub-issue when the slice:

- Can be assigned or delivered independently.
- Will have its own PR.
- Can be blocked or prioritized independently.
- Produces a useful intermediate outcome.

Keep a task only in OpenSpec when it is a step such as creating a file, adding a fixture, running validation, or performing review. Creating one issue per checkbox would add substantial administrative overhead.

## Roadmap Planning

Use either a milestone or a `type:roadmap` parent issue for each meaningful delivery outcome.

Examples:

- Repository foundation.
- Skill authoring and evaluation foundation.
- Core SDLC skill set.
- Security and portability guardrails.
- Java/Spring and TypeScript overlays.

Recommended progression:

1. Start with roadmap parent issues and sub-issues on the Kanban board.
2. Add milestones when work is grouped into a release or target date.
3. Add Project `Start date` and `Target date` fields only when a timeline view becomes useful.
4. Create a roadmap Project view over the same issues; do not create duplicate roadmap records.

Avoid GitHub Project draft items for committed work. Real issues are easier to search, link to specs and PRs, automate, and preserve as history.

## OpenSpec and GitHub Lifecycle

### Ownership of Information

| Information | Source of truth |
|---|---|
| Problem, discussion, owner, and current status | GitHub issue and Project |
| Observable requirements and acceptance scenarios | OpenSpec delta and living specs |
| Technical approach and decisions | OpenSpec `design.md` |
| Detailed implementation checklist | OpenSpec `tasks.md` |
| Code changes and review | Pull request |
| Automated evidence | GitHub Actions checks and eval/test output |

### Required Mapping

Each active OpenSpec change should contain machine-readable tracking metadata. Add a custom `tracking.yaml` file that OpenSpec ignores as an extra file or model it as a custom schema artifact later:

```yaml
github:
  repository: jizzoe/joericearchitect-ai-skills
  issue: 42
  issue_url: https://github.com/jizzoe/joericearchitect-ai-skills/issues/42
  project_number: 1
```

The issue body should contain a reciprocal managed block:

```markdown
<!-- openspec:start -->
OpenSpec change: `add-code-review-skill`

- Proposal: `openspec/changes/add-code-review-skill/proposal.md`
- Specifications: `openspec/changes/add-code-review-skill/specs/`
- Design: `openspec/changes/add-code-review-skill/design.md`
- Tasks: `openspec/changes/add-code-review-skill/tasks.md`
<!-- openspec:end -->
```

Automation may replace only the managed block. It must preserve human-written issue content and comments.

### Action-to-Status Mapping

| Event or action | GitHub behavior |
|---|---|
| Feature or bug issue opened | Add to Project as `Backlog` |
| `/opsx:explore` | No issue mutation by default |
| `/opsx:propose` from an existing issue | Create the OpenSpec change, write `tracking.yaml`, link artifacts, remove `needs:spec` when artifacts are ready |
| `/opsx:propose` without an issue | Create a feature or bug issue first, add it to the Project, then create the OpenSpec change |
| Proposal/spec/design/tasks ready and reviewed | Move issue to `Ready` |
| `/opsx:apply` begins | Move issue to `In Progress`; add a concise progress comment only when useful |
| Draft PR opened | Link the PR; keep `In Progress` |
| PR marked ready for review | Move issue to `In Review` |
| PR returned to draft | Move issue to `In Progress` |
| PR merged into the default branch | Close linked issue through `Closes #N`; built-in Project automation moves it to `Done` |
| `/opsx:sync` | Update links or comment only; do not imply delivery |
| `/opsx:archive` | Verify the issue is closed and Project status is `Done`; record the archived change path |
| Change abandoned | Close issue as `not planned` and add an explanatory comment |

Archiving should not silently close an issue whose implementation has not been merged. For documentation-only or no-code changes, require an explicit completion note before closing.

## Automation Architecture

Use two cooperating automation layers.

### Local Spec Workflow Automation

OpenSpec actions happen in a developer's local AI session, before GitHub can observe them. A local workflow skill or wrapper script must perform immediate GitHub updates.

Recommended components:

```text
skills/base/github-issue-workflow/
workflows/openspec-github-lifecycle/
scripts/github/
├── create-or-link-issue
├── update-managed-block
├── set-project-status
└── verify-change-linkage
```

The wrapper should:

1. Read the active OpenSpec change and `tracking.yaml`.
2. Use `gh` to create or update the issue.
3. Add the issue to the configured Project.
4. Update the Project status for the action.
5. Write the issue number and URL back to `tracking.yaml`.
6. Fail visibly if GitHub cannot be updated; never claim synchronization succeeded without evidence.

OpenSpec custom schemas can add required artifacts and artifact rules, but they should not be treated as a general external-event engine. The integration should compose OpenSpec-generated skills/actions with deterministic GitHub scripts.

### GitHub Actions Reconciliation

GitHub Actions should enforce and repair state after files or PRs reach GitHub:

```text
.github/workflows/
├── issue-intake.yml
├── openspec-validate.yml
├── openspec-linkage.yml
└── project-status-sync.yml
```

Suggested responsibilities:

| Workflow | Trigger | Responsibility |
|---|---|---|
| `issue-intake.yml` | Issue opened or labeled | Add matching issues to Project as `Backlog` |
| `openspec-validate.yml` | PR changes `openspec/**` or AI assets | Run OpenSpec validation and repository-specific checks |
| `openspec-linkage.yml` | PR opened, edited, synchronized | Require each active change to reference an open issue and require the PR to reference that issue |
| `project-status-sync.yml` | PR opened, converted to draft, ready for review, closed | Reconcile linked issue status with PR state |

Use GitHub's built-in Project workflows where they are sufficient:

- Automatically add matching issues to the Project.
- Set new items to `Backlog`.
- Set closed issues and merged PRs to `Done`.
- Optionally archive old completed items.

Use custom Actions only for OpenSpec-specific transitions and validation. This keeps the custom automation small.

### Pull Request Contract

Every implementation PR should include:

```markdown
Closes #42

OpenSpec change: `add-code-review-skill`

## Verification

- [ ] OpenSpec validation passes
- [ ] Skill/eval tests pass
- [ ] Security and guardrail review completed
- [ ] Attribution reviewed when third-party material was used
```

Closing keywords such as `Closes #42`, `Fixes #42`, and `Resolves #42` link the PR and close the issue when the PR is merged into the default branch. Merely mentioning `#42` links context but does not close it.

## Authentication and Security

### Local Development

Install GitHub CLI and authenticate:

```bash
brew install gh
gh auth login
gh auth refresh -s project
gh auth status
```

GitHub CLI is not currently installed in this environment.

The local integration should use the authenticated `gh` session. It must ask before creating, closing, or materially changing issues unless the invoked spec action explicitly defines that state transition.

### GitHub Actions

Repository-level issue and PR operations can generally use `GITHUB_TOKEN` with explicit least-privilege permissions such as:

```yaml
permissions:
  contents: read
  issues: write
  pull-requests: write
```

The repository-scoped `GITHUB_TOKEN` cannot access GitHub Projects. GitHub recommends:

- A personal access token for a user-owned Project.
- A GitHub App installation token for an organization-owned Project.

Because this repository is currently under a personal account, start with a narrowly scoped Project token stored as an Actions secret such as `PROJECT_TOKEN`. If this workflow moves to an organization or spans several repositories, replace it with a GitHub App.

Never place tokens, Project node IDs, or mutable credentials in a skill or committed script. Store non-secret configuration such as owner and project number in repository variables or a checked-in configuration file; store credentials only in GitHub secrets or the local GitHub CLI credential store.

Actions that update issues must be idempotent. Re-running a workflow should not duplicate comments, issue links, or Project items.

## Recommended Productivity Skills

### Build First

| Skill | Value |
|---|---|
| `github-issue-authoring` | Create a well-scoped feature or bug issue from a conversation, with correct labels and acceptance information |
| `github-issue-to-openspec` | Turn an existing issue into a linked OpenSpec change without losing issue context |
| `openspec-github-sync` | Create or repair reciprocal links, update Project status, and report synchronization evidence |
| `github-pr-linkage` | Generate or verify PR metadata, closing keywords, OpenSpec links, and verification evidence |

### Add After the Basic Lifecycle Works

| Skill | Value |
|---|---|
| `github-bug-triage` | Check reproducibility, severity, duplicates, evidence, and whether behavior is already specified |
| `github-issue-decomposition` | Recommend OpenSpec tasks versus independently deliverable sub-issues |
| `github-backlog-grooming` | Find stale, duplicate, blocked, underspecified, or misclassified work and propose updates |
| `github-project-status-audit` | Compare issue, PR, OpenSpec, and Project state and repair inconsistencies |
| `github-work-summary` | Produce a concise summary of completed, active, blocked, and upcoming work |
| `github-release-readiness` | Check milestone scope, open blockers, merged PRs, validation evidence, and incomplete specs |
| `github-duplicate-detection` | Search open and closed issues before creating a new feature or bug |
| `github-dependency-mapping` | Create or validate blocked-by relationships and surface the critical sequence |

Skills that create or mutate GitHub state should separate planning from execution. They should preview intended changes, make deterministic API calls through `gh`, and report issue URLs and resulting status as evidence.

## Suggested Rollout

### Phase 1: Basic Tracking

- Install and authenticate GitHub CLI.
- Create feature and bug issue forms.
- Create the user-level GitHub Project.
- Add the five `Status` values and a Kanban view.
- Enable built-in auto-add and closed-to-`Done` workflows.
- Add a PR template with `Closes #N` and OpenSpec change fields.

### Phase 2: OpenSpec Linkage

- Add `tracking.yaml` to the OpenSpec change convention.
- Build `github-issue-to-openspec` and `openspec-github-sync`.
- Add artifact rules requiring issue links and acceptance criteria.
- Add local scripts for issue creation, managed-block updates, and Project status.

### Phase 3: Repository Enforcement

- Add OpenSpec validation on PRs.
- Validate reciprocal issue/change/PR links.
- Synchronize `In Progress` and `In Review` from PR events.
- Add a status-audit command that detects drift without mutating anything by default.

### Phase 4: Roadmap and Reporting

- Add roadmap parent issues or milestones.
- Add start and target dates only when needed.
- Add roadmap and milestone views.
- Add backlog grooming and work-summary skills.

## Decisions to Carry Into the Specification

The initial implementation specification should make these requirements explicit:

1. Every active OpenSpec change has exactly one primary GitHub issue unless marked with a documented exemption.
2. Every issue-linked implementation PR references the OpenSpec change and uses an issue-closing keyword when merge means delivery.
3. OpenSpec `tasks.md` is not duplicated into GitHub; only independently deliverable slices become sub-issues.
4. Project status is the canonical lifecycle status; status labels are prohibited.
5. Spec actions update GitHub locally, and GitHub Actions reconcile the state after pushes and PR events.
6. Automation is idempotent, preserves human-authored content, uses managed blocks, and reports failures visibly.
7. `/opsx:archive` verifies delivery state rather than silently declaring an issue complete.
8. All tokens use least privilege and remain outside committed assets.

## Sources

### GitHub

- [About issues](https://docs.github.com/en/issues/tracking-your-work-with-issues/learning-about-issues/about-issues)
- [Planning and tracking work](https://docs.github.com/en/issues/tracking-your-work-with-issues/learning-about-issues/planning-and-tracking-work-for-your-team-or-project)
- [Planning and tracking with Projects](https://docs.github.com/en/issues/planning-and-tracking-with-projects)
- [Changing a Project view layout](https://docs.github.com/en/issues/planning-and-tracking-with-projects/customizing-views-in-your-project/changing-the-layout-of-a-view)
- [Customizing the roadmap layout](https://docs.github.com/en/issues/planning-and-tracking-with-projects/customizing-views-in-your-project/customizing-the-roadmap-layout)
- [Adding sub-issues](https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/adding-sub-issues)
- [Managing issue types in an organization](https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/managing-issue-types-in-an-organization)
- [Syntax for issue forms](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/syntax-for-issue-forms)
- [Linking a pull request to an issue](https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/linking-a-pull-request-to-an-issue)
- [Using built-in Project automations](https://docs.github.com/en/issues/planning-and-tracking-with-projects/automating-your-project/using-the-built-in-automations)
- [Adding Project items automatically](https://docs.github.com/en/issues/planning-and-tracking-with-projects/automating-your-project/adding-items-automatically)
- [Automating Projects using Actions](https://docs.github.com/en/issues/planning-and-tracking-with-projects/automating-your-project/automating-projects-using-actions)
- [Using the API to manage Projects](https://docs.github.com/en/issues/planning-and-tracking-with-projects/automating-your-project/using-the-api-to-manage-projects)
- [Using `GITHUB_TOKEN`](https://docs.github.com/en/actions/tutorials/authenticate-with-github_token)
- [Events that trigger workflows](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows)
- [GitHub CLI issue commands](https://cli.github.com/manual/gh_issue)
- [GitHub CLI Project item editing](https://cli.github.com/manual/gh_project_item-edit)

### OpenSpec

- [OpenSpec concepts](https://github.com/Fission-AI/OpenSpec/blob/main/docs/concepts.md)
- [OpenSpec workflows](https://github.com/Fission-AI/OpenSpec/blob/main/docs/workflows.md)
- [OpenSpec commands](https://github.com/Fission-AI/OpenSpec/blob/main/docs/commands.md)
- [OpenSpec customization and schemas](https://github.com/Fission-AI/OpenSpec/blob/main/docs/customization.md)
