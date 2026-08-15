# GitHub Flow Standards and Best Practices

Date: 2026-08-09
Status: Accepted
Decision source: [GitHub Workflow Options for Libraries and Deployed Applications](../research/git-workflows/github-workflow-options.md)

## Purpose

Define the authoritative Git and GitHub collaboration standard for this repository and the baseline workflow for related repositories maintained by the owner.

This standard is designed for:

- A mostly solo maintainer.
- Open-source or invited contributors.
- Issue-to-code traceability.
- Lightweight, reviewable delivery.
- Versioned reusable assets and libraries.
- Extension to applications with multiple deployment environments.

Normative terms `SHALL`, `SHALL NOT`, `SHOULD`, `SHOULD NOT`, and `MAY` express required, recommended, discouraged, and optional behavior.

## Standard Workflow

The repositories SHALL use GitHub Flow with pull-request-based, short-lived topic branches:

```text
GitHub issue
  -> short-lived topic branch or contributor fork
  -> draft pull request to main
  -> automated checks and review
  -> ready pull request
  -> squash merge to main
  -> issue closure and Project Done
  -> delete topic branch
```

## Branch Model

### Permanent Branch

- `main` SHALL be the default branch and sole permanent development trunk.
- Normal implementation pull requests SHALL target `main`.
- `development`, `integration`, and `master` SHALL NOT be maintained as permanent environment or integration branches.
- Direct pushes to `main` SHALL be prevented through a repository ruleset except for documented emergency recovery by an authorized owner.

### Topic Branches

Every repository change SHALL use a short-lived topic branch unless it is performed through a GitHub-native administrative operation that changes no repository content.

Branch names SHALL contain the primary issue number and use one of these forms:

```text
feature/<issue-number>-<short-description>
fix/<issue-number>-<short-description>
hotfix/<issue-number>-<short-description>
chore/<issue-number>-<short-description>
```

Examples:

```text
feature/42-bootstrap-openspec
fix/87-preserve-task-status
hotfix/131-redact-action-token
```

Branch names provide human context but SHALL NOT be treated as the authoritative issue relationship.

Topic branches SHOULD:

- Begin from current `main`.
- Contain one coherent issue-oriented change.
- Remain short-lived and converge into `main` promptly.
- Be updated from `main` before merge when needed.
- Be deleted after merge.

Outside contributors MAY work from repository forks. Their pull requests SHALL follow the same issue, base-branch, validation, and review contract.

### Release Branches

Temporary `release/<version>` branches MAY be introduced only when a documented operational need exists, such as:

- Parallel stabilization while new work continues.
- Maintenance of multiple supported versions.
- Mobile-store or regulated release trains.

Release branches SHALL NOT become general development branches. Their creation, allowed changes, backport direction, supported lifetime, and deletion condition SHALL be documented.

## Issue Requirement

- Every code or repository-content change SHALL have a GitHub issue before implementation begins.
- The issue SHALL describe the problem, desired outcome, and applicable acceptance information.
- One OpenSpec change SHALL map to one primary GitHub issue unless an approved exception is documented.
- OpenSpec task checkboxes SHALL remain in `tasks.md`; only independently deliverable slices become GitHub sub-issues.
- Issue and Project status SHALL remain the work-lifecycle source of truth.

Administrative changes that modify no repository content MAY use an approved no-code completion path. Documentation, configuration, workflows, skills, prompts, templates, and tests are repository content and SHALL use normal pull-request delivery.

## Formal Issue and Pull-Request Linkage

Each implementation branch or pull request SHALL be formally connected to its issue through GitHub's Development relationship.

The pull-request body SHALL include:

```markdown
Closes #42
```

when merging the PR means the issue is delivered. Cross-repository issues SHALL use the qualified form:

```markdown
Closes owner/repository#42
```

Because GitHub interprets closing keywords only for pull requests targeting the default branch, normal delivery PRs SHALL target `main`.

Automation SHALL validate the explicit issue relationship and closing keyword. It SHALL NOT infer delivery solely from:

- An issue number in the branch name.
- A plain `#42` mention.
- Similar text in a commit message.
- A Project item with a matching title.

## Pull-Request Contract

Pull requests SHALL target `main` unless an approved temporary release-branch policy applies.

The PR template SHALL require:

- Primary issue-closing reference.
- OpenSpec change name and artifact links when applicable.
- Concise change summary.
- Verification evidence.
- Security and guardrail review status.
- Attribution and licensing status when third-party material is used.
- Known gaps, warnings, or blocked checks.
- Release or deployment impact.

Draft pull requests SHOULD be opened when early collaboration or visibility is useful. A draft PR represents delivery preparation, not completed delivery.

PR state SHALL map to Project status as follows:

| Pull-request event | Issue Project status |
|---|---|
| Draft PR opened | `In Progress` |
| PR marked ready for review | `In Review` |
| PR returned to draft | `In Progress` |
| PR closed without merge | `In Progress` or audited current state |
| PR squash-merged to `main` | Issue closes; `Done` |

Closing an unmerged PR SHALL NOT mark the issue delivered.

## Merge Standard

- Squash merge SHALL be the default merge method.
- The squash commit subject SHALL describe the delivered change clearly.
- GitHub's PR number SHOULD remain in the resulting commit subject or metadata.
- The PR SHALL preserve detailed review, intermediate commits, and verification evidence.
- Merge commits SHOULD be disabled for normal topic PRs when repository settings permit.
- Rebase merge MAY be approved for a repository whose release or history requirements demonstrate a better fit.

The pull request SHALL NOT merge until required checks pass and blocking review comments are resolved.

## `main` Ruleset

The `main` branch SHALL have a GitHub ruleset that, where the repository plan supports it:

- Requires a pull request before merging.
- Requires configured CI and validation checks.
- Requires review conversations to be resolved.
- Blocks force pushes.
- Blocks branch deletion.
- Enforces the selected merge method or linear history where appropriate.
- Applies to outside contributors without bypass.

While the repository is maintained primarily by one person, required human approvals SHALL initially be zero. This avoids a non-existent second reviewer blocking delivery while retaining the PR and automated-check gates.

When another trusted maintainer is consistently available, the repository SHOULD require at least one approval for material changes. Emergency owner bypass, if enabled, SHALL be exceptional and documented.

## GitHub Project Lifecycle

The Project `Status` field SHALL be the sole Kanban lifecycle field:

```text
Backlog -> Ready -> In Progress -> In Review -> Done
```

Status labels SHALL NOT duplicate Project status. The `blocked` label SHALL represent blockage while preserving the underlying lifecycle position.

Built-in Project automation SHALL be used before custom Actions when it can reliably:

- Add matching issues.
- Set new issues to `Backlog`.
- Move closed issues to `Done`.

Custom automation SHALL handle OpenSpec-specific transitions, formal linkage validation, and reconciliation that built-in automation cannot express.

## Lifecycle Automation

Automation SHALL implement this minimum behavior:

| Event | Required result |
|---|---|
| Managed issue opened | Add once to Project as `Backlog` |
| OpenSpec proposal reviewed | Remove `needs:spec`; move to `Ready` |
| Apply begins | Move to `In Progress` |
| Draft PR opened | Formally link PR; remain `In Progress` |
| PR ready for review | Move to `In Review` |
| PR returned to draft | Move to `In Progress` |
| PR merged to `main` | Closing keyword closes issue; move to `Done` |
| PR closed without merge | Do not mark delivered |
| OpenSpec archive | Verify issue closed and Project `Done` before archive |

Automation SHALL:

- Be idempotent.
- Preserve human-authored issue content.
- Use bounded managed blocks for generated issue content.
- Provide read-only audit mode.
- Preview repair or mutation operations.
- Report resulting URLs and state as evidence.
- Fail visibly and provide a safe retry path.
- Avoid relying on recursive workflow events for correctness.

## Hotfixes

Production fixes SHALL follow the same issue and PR discipline:

```text
production issue
  -> hotfix/<issue-number>-<description> from main
  -> accelerated but complete validation
  -> pull request to main
  -> squash merge
  -> release/deploy fixed artifact
```

There is no merge-down step because `main` is the development trunk. If a supported release branch is affected, the fix SHALL land on `main` first and then be backported through a separate reviewed PR unless the documented incident policy explicitly requires another order.

## Releases and Deployments

### Reusable Assets and Libraries

- Versioned reusable assets SHALL be released from verified `main` commits using Git tags and GitHub Releases.
- Published version tags SHALL be treated as immutable.
- Detailed versioning, artifact, and publication rules remain subject to the release-policy decisions derived from [GitHub Releases research](../research/git-workflows/github-releases-for-assets-and-mobile-apps.md).

### Deployed Applications

- Development, staging, and production SHALL be GitHub Environments or equivalent deployment targets, not permanent source branches.
- Deployments SHALL promote the same immutable artifact when the platform permits it.
- Deployment records SHALL identify the source commit and artifact digest/build identifier.
- Detailed Environment names, protections, credentials, and mobile-store mappings remain subject to owner review of [GitHub Environments research](../research/git-workflows/github-environments-for-assets-and-mobile-apps.md).

## Security

- Workflows SHALL declare least-privilege `GITHUB_TOKEN` permissions.
- Project access SHALL use the approved narrowly scoped `PROJECT_TOKEN` until migration to a GitHub App is justified.
- Workflows with secrets SHALL NOT execute untrusted pull-request code.
- `pull_request_target` SHALL NOT check out and run untrusted head content.
- Third-party Actions SHALL be minimized and pinned by immutable commit SHA.
- Secrets SHALL remain outside committed files, issue bodies, PR bodies, logs, and generated artifacts.
- Destructive or unexpected GitHub mutations SHALL require explicit approval.

## Traceability

The target audit chain is:

```text
GitHub issue
  -> OpenSpec change
  -> branch or fork
  -> pull request
  -> squash commit on main
  -> Git tag and GitHub Release, when versioned
  -> artifact digest/build identifier, when built
  -> GitHub deployment and external target record, when deployed
```

Every stage SHALL link to the adjacent durable records rather than duplicating their full contents.

## Current Repository Transition

The initial branch migration is complete:

1. `main` remains the default and sole permanent branch.
2. Draft PR #5 replaces PR #3 and targets `main` from `feature/2-bootstrap-openspec`.
3. PR #5 formally closes issue #2 when merged.
4. Redundant `development`, `developmrnt`, and `master` branches were verified to contain no unique commits or automation dependencies and were deleted locally and remotely.
5. Squash merge is the only enabled merge method, and merged head branches are deleted automatically.

The `main` ruleset, required checks, and Project lifecycle configuration remain follow-up work owned by the planned milestones.

## Exceptions

A deviation SHALL be documented in the relevant issue or OpenSpec design with:

- The standard being waived.
- The operational reason.
- Scope and duration.
- Risks and compensating controls.
- Owner approval.
- Removal or review condition.

Convenience alone is not sufficient justification for a permanent additional branch or bypassing issue/PR traceability.
