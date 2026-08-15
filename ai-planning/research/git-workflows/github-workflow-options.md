# GitHub Workflow Options for Libraries and Deployed Applications

Date: 2026-08-09

## Purpose

Select a recognizable Git workflow that:

- Is lightweight for a solo maintainer but safe for outside contributors.
- Associates every code change with a GitHub issue.
- Works for this versioned AI-assets repository.
- Extends cleanly to a full-stack application with multiple deployable units and environments.
- Provides traceability from issue through code review, release, and deployment.
- Avoids a repository-specific branching model that contributors must first learn.

## Executive Recommendation

Use one shared core model in both repositories:

> **GitHub Flow with a protected `main` branch, short-lived issue branches, and pull requests.**

Apply it through two standard operating profiles:

1. **Versioned library/assets repository:** merge reviewed changes to `main`, then publish versions with Git tags and GitHub Releases.
2. **Deployed application:** merge reviewed changes to `main`, build immutable artifacts, and promote those artifacts through GitHub Environments such as development, staging, and production.

Add temporary `release/<version>` branches only when a real need develops for parallel release stabilization, app-store release trains, or maintenance of older supported versions.

This recommendation is close to pull-request-based trunk development. GitHub describes GitHub Flow as a lightweight branch-based workflow: create a branch, make changes, open a pull request, address review, merge into the default branch, and delete the branch. See [GitHub flow](https://docs.github.com/en/get-started/using-github/github-flow). Trunk-based development likewise permits short-lived pull-request branches while avoiding multiple permanent development branches. See [Trunk-Based Development](https://trunkbaseddevelopment.com/) and [short-lived feature branches](https://trunkbaseddevelopment.com/short-lived-feature-branches/).

The two profiles are not bespoke workflows. They use the same common source-control model and vary only in what happens after integration: create a versioned release, or promote a deployable artifact.

For the runtime controls that allow incomplete or gradually released work to coexist safely on `main`, see the companion research document [Feature Flags in a Modern GitHub Workflow](feature-flags-in-modern-github-workflows.md).

For versioning, release artifacts, mobile-store coordination, and release-to-deployment traceability, see [GitHub Releases for AI Assets and Full-Stack Mobile Applications](github-releases-for-assets-and-mobile-apps.md).

For deployment targets, environment protections, credentials, approvals, and promotion topology, see [GitHub Environments for AI Assets and Full-Stack Mobile Applications](github-environments-for-assets-and-mobile-apps.md).

## What Changes From the Previous Mental Model

GitHub does not require different branch names from Bitbucket, and Bitbucket could also support the recommended model. The important change is how responsibility is divided:

| Previous responsibility | Recommended GitHub owner |
|---|---|
| Work identity | GitHub issue |
| Isolated developer work | Short-lived branch or contributor fork |
| Review and integration gate | Pull request into `main` |
| Integrated source of truth | Protected default branch, `main` |
| Development, staging, production state | GitHub Environments and deployment records |
| Versioned distribution | Git tag and GitHub Release |
| Audit trail | Issue -> PR -> commit -> artifact/release -> deployment |

The main conceptual change is:

> **An environment is deployment state, not a source branch.**

Your former `development` and `integration` branches answered two questions at once: which code had been integrated, and where it had been deployed. Keeping those questions separate allows the same tested artifact to move through development, staging, and production without repeated source merges or rebuilds.

GitHub Actions supports deployments through environments, concurrency controls, protection rules, environment secrets, approvals, and deployment history. See [Configuring and managing deployments](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments).

## Workflow Options

### Option 1: GitHub Flow

**Shape**

```text
issue
  -> feature/123-short-description
  -> pull request to main
  -> checks and review
  -> merge to main
  -> delete feature branch
```

**Permanent branches:** `main` only.

**Strengths**

- GitHub's documented, lightweight workflow.
- Natural for solo work, forks, and outside contributors.
- Pull requests provide a durable review and decision record.
- Closing keywords work naturally because pull requests target the default branch.
- Minimal branch drift and merge-forward administration.

**Limitations**

- It does not itself define release cadence or environment promotion.
- Incomplete work must remain off `main`, be split into smaller deliverable changes, or be protected by feature flags.

**Fit:** Best default for this AI-assets repository and the common foundation for the deployed application.

### Option 2: Trunk-Based Development With Environment Promotion

**Shape**

```text
issue -> short-lived branch -> PR -> main
                                  |
                                  +-> build immutable artifacts
                                      -> development
                                      -> staging
                                      -> production
```

**Permanent source branches:** `main` only.

**Strengths**

- Keeps source integration frequent and branch divergence low.
- Represents development, staging, and production explicitly as deployments.
- Promotes the same artifact instead of rebuilding different code from different branches.
- Provides commit, workflow, environment, approval, and deployment-history traceability.
- Supports multiple independently deployable components from one commit.

**Limitations**

- Requires CI/CD automation and artifact/version discipline.
- Larger unfinished features may need feature flags or incremental delivery.
- Mobile-store promotion has platform-specific steps beyond GitHub.

**Fit:** Recommended deployment profile for the full-stack bookkeeping application.

This is not a second branching model. It is GitHub Flow plus a disciplined delivery pipeline.

### Option 3: Trunk-Based Development With Temporary Release Branches

**Shape**

```text
issue branches -> PRs -> main -> release/1.4 -> tag/release/deploy
                              \
                               -> continued work on main
```

**Permanent branches:** `main`; release branches exist only while supported or stabilizing.

Production fixes should normally be made on a short-lived branch from `main`, merged to `main`, and then backported to the affected release branch when necessary. Microsoft's published Release Flow is a recognizable example of trunk development with release branches and a "main first" hotfix policy. See [Release Flow](https://devblogs.microsoft.com/devops/release-flow-how-we-do-branching-on-the-vsts-team/).

**Strengths**

- Supports a stabilization window while new development continues on `main`.
- Supports multiple maintained versions.
- Can fit scheduled mobile releases and store-certification delays.

**Limitations**

- Introduces cherry-picks/backports and the risk that fixes diverge.
- Requires an explicit support and deletion policy for release branches.
- Is unnecessary when every release can be made directly from `main`.

**Fit:** Add later only when release operations demonstrate the need.

### Option 4: Git Flow or Permanent Environment Branches

**Shape**

```text
feature/* -> development -> integration -> master
hotfix/* --------------------------------> master
        \--------------------------------> development
```

**Permanent branches:** `development`, `integration`, and `master`, often with additional release branches.

**Strengths**

- Closely matches the prior company workflow.
- Makes environment promotion visible as branch merges.
- Can suit infrequent, manually controlled releases in organizations already built around it.

**Costs for these repositories**

- Every change passes through repeated merges and long-lived divergence points.
- A branch name conflates source integration with deployment state.
- Hotfixes require merging or backporting across several permanent branches.
- Contributors must learn which long-lived branch is the correct pull-request target.
- GitHub issue-closing keywords are interpreted only for pull requests targeting the default branch. A PR into `development` therefore does not get the simplest native issue-linking and closing behavior when `main` is default.
- It adds substantial process for a solo maintainer without increasing the quality of the code or artifact.

**Fit:** Not recommended unless compliance, release ownership, or legacy deployment tooling requires permanent stage branches.

## Decision Matrix

| Criterion | GitHub Flow | Trunk + environments | Temporary release branches | Git Flow |
|---|---:|---:|---:|---:|
| Solo-maintainer overhead | Low | Low to moderate | Moderate | High |
| Familiar to GitHub contributors | High | High | High | Moderate |
| Native issue/PR behavior | Excellent | Excellent | Good | Awkward before default-branch merge |
| Versioned library fit | Excellent | Unnecessary | Sometimes | Poor |
| Multi-environment app fit | Needs delivery layer | Excellent | Good when release trains exist | Works, with high overhead |
| Merge/backport burden | Low | Low | Moderate | High |
| Deployment traceability | Release-focused | Environment-focused | Environment-focused | Often inferred from branches |
| Recommended now | Yes | For deployed app | Not yet | No |

## Recommended Branch and Pull-Request Policy

### Default and Permanent Branches

- Use `main` as the default and only permanent development branch.
- Keep `main` releasable and protect it with a GitHub ruleset.
- Do not use both `main` and `master`; they represent the same trunk role.
- Do not create permanent `development` or `integration` branches merely to represent environments.
- Create temporary release branches only under a documented release policy.

GitHub rulesets can require pull requests, passing status checks, resolved review conversations, linear history, and successful deployments, while blocking force pushes. See [Available rules for rulesets](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets).

For a solo-owned repository, start with:

- Pull request required for `main`.
- Required CI and validation checks.
- All review conversations resolved.
- Force pushes and deletion blocked on `main`.
- Zero mandatory human approvals until another trusted maintainer is consistently available.
- No contributor bypass; reserve any emergency owner bypass for exceptional recovery and document its use.

This preserves the PR and automated review gate without making solo work wait for a reviewer who does not exist.

### Short-Lived Branches

Use a simple human-readable convention:

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

This convention resembles the previous Jira naming scheme and helps humans search, but it is not the authoritative GitHub relationship. A branch named `feature/42-...` does not, by its name alone, create the full issue-to-PR relationship.

Keep one logical change per branch. Open a draft PR early when feedback or visibility is useful. Delete the branch after merge; GitHub retains the PR discussion and commits.

### Merge Method

Prefer **squash merge** for this repository:

- One issue-oriented PR becomes one coherent commit on `main`.
- Intermediate corrections remain visible in the PR without cluttering the default branch.
- Reverts are straightforward.

Use the final squash commit subject to describe the delivered change and include the PR number that GitHub supplies. The PR remains the detailed audit record.

## Issue-to-Code Traceability

Use GitHub's explicit relationships, not branch-name inference alone.

### Required Change Chain

```text
GitHub issue
  -> connected branch
  -> pull request
  -> merged commit on main
  -> release or built artifact
  -> deployment record, when applicable
```

For every code change:

1. Create or select the GitHub issue before implementation.
2. Create a short-lived branch containing the issue number.
3. Connect the branch or PR in the issue's **Development** section.
4. Put `Closes #<number>` in the PR body when the PR targets the default branch.
5. Include the requirement/design links and verification evidence in the PR.
6. Merge only after required checks pass.
7. Carry the source commit SHA and PR/issue references into release and deployment metadata.

GitHub supports manual links through the Development sidebar and closing keywords such as `Closes #42`. A linked issue closes when the PR is merged into the default branch. Critically, closing keywords are ignored when the PR targets a non-default branch. See [Linking a pull request to an issue](https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/linking-a-pull-request-to-an-issue).

For a cross-repository issue, use the qualified form:

```text
Closes owner/repository#42
```

### Suggested Pull-Request Body Fields

```markdown
## Summary

## Issue
Closes #42

## Specification and design

## Verification

## Release or deployment impact
```

Automate a check that rejects a ready-for-review PR without an explicit issue reference. Keep the manual Development relationship as the GitHub-visible link and the closing keyword as the default-branch completion mechanism.

## Profile A: This Versioned AI-Assets Repository

Use:

```text
issue -> short-lived branch -> draft PR -> checks/review -> main
                                                     -> tag -> GitHub Release
```

Recommended release behavior:

- Treat `main` as the latest accepted source.
- Use semantic version tags when a consumable version is ready, for example `v1.2.0`.
- Use prerelease tags such as `v1.3.0-beta.1` when downstream users need a preview.
- Create GitHub Releases from tags, with generated or curated notes linking included PRs and issues.
- Do not create environment branches because this repository has no server deployment lifecycle.

GitHub Releases are based on Git tags and package a specific repository state with release notes and downloadable assets. See [About releases](https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases).

### Current Repository Transition Note

At the time of this research, this repository has `main`, `development`, and `master`, and PR #3 targets `development`. No branch or PR changes are part of this research task.

If the recommendation is adopted, handle the transition as an explicit follow-up decision:

1. Confirm `main` is the intended default and release branch.
2. Retarget or replace open PRs so their final integration target is `main`.
3. Add the `main` ruleset and required checks.
4. Merge accepted work.
5. Delete `development` and `master` locally and remotely only after confirming neither contains unique commits and no automation depends on them.

PR #3 currently targeting `development` is especially relevant: a `Closes #2` keyword will not create the native closing relationship while the PR targets a non-default branch. It can still be manually linked through the Development sidebar, but merging it into `development` will not close issue #2. To use native automatic closure, either retarget PR #3 to `main` and include the closing keyword, or explicitly link/close issue #2 from the later PR that merges the completed work into `main`.

## Profile B: Deployed Full-Stack Bookkeeping Application

Use the same source workflow, then add artifact promotion:

```text
issue -> branch -> PR -> main -> build once
                              -> deploy to development
                              -> promote to staging
                              -> promote to production
```

### Multiple Deployable Units

For an API, web application, background workers, and mobile application:

- Build only affected units using path filters or a workflow matrix.
- Give every artifact an immutable version or digest.
- Record the source commit SHA, PR, and issue with each artifact.
- Promote the same artifact between environments; do not rebuild from a different branch for each environment.
- Use component-specific GitHub Environments only where secrets, approvers, or protection rules differ, for example `api-production` and `mobile-production`.
- For mobile, connect the GitHub build record to the TestFlight or Play Console build/version and preserve store approval as deployment evidence.

### Environment Policy

| Environment | Trigger | Typical gate |
|---|---|---|
| Development | Automatic after merge to `main` | Build, unit, integration, security, and deployment smoke checks |
| Staging | Promote successful development artifact | Automated end-to-end checks; optional manual approval |
| Production | Promote successful staging artifact | Required approval, release evidence, and production protection rules |

Use GitHub environment protection rules and approvals for stage gates. Use deployment history to answer which commit and workflow run reached each environment. Roll back by redeploying a previously verified artifact, not by moving source between environment branches.

### Hotfixes

The streamlined hotfix flow is:

```text
production issue
  -> hotfix/<issue-number>-<description> from main
  -> accelerated but complete PR checks
  -> merge to main
  -> build and promote the fixed artifact
```

There is no separate "merge down to development" step because all normal development already starts from `main`. If a supported `release/<version>` branch is affected, merge the fix to `main` first and then backport it to that release branch through a separate PR.

## Adoption Decisions

Status: **Accepted by the repository owner on 2026-08-09.**

The authoritative policy derived from these research decisions is [GitHub Flow Standards and Best Practices](../../standards-and-best-practices/github-flow-standards.md).

The accepted policy changes are:

1. Make or retain `main` as the default and sole permanent trunk.
2. Use GitHub Flow for both repositories.
3. Use tags and GitHub Releases for the AI-assets repository.
4. Use GitHub Environments and immutable artifact promotion for the deployed application.
5. Permit temporary release branches only when a documented operational need exists.
6. Standardize issue-number branch names and require explicit Development/PR links.
7. Prefer squash merge.
8. Add the proposed `main` ruleset and issue-link validation.

These decisions are to be recorded in contributor documentation and automated where GitHub supports enforcement. This research document retains the rationale and option comparison; the standards document owns the normative policy. Acceptance alone does not mutate repository settings, branches, pull requests, or deployment workflows.

## Sources

- [GitHub flow](https://docs.github.com/en/get-started/using-github/github-flow)
- [Linking a pull request to an issue](https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/linking-a-pull-request-to-an-issue)
- [Creating a branch to work on an issue](https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/creating-a-branch-for-an-issue)
- [Available rules for rulesets](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets)
- [Configuring and managing deployments](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments)
- [About releases](https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases)
- [Trunk-Based Development](https://trunkbaseddevelopment.com/)
- [Short-Lived Feature Branches](https://trunkbaseddevelopment.com/short-lived-feature-branches/)
- [Release Flow: How We Do Branching on the VSTS Team](https://devblogs.microsoft.com/devops/release-flow-how-we-do-branching-on-the-vsts-team/)
