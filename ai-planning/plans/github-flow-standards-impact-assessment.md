# GitHub Flow Standards Planning Impact Assessment

Date: 2026-08-09
Status: Accepted decision reconciliation
Standard: [GitHub Flow Standards and Best Practices](../standards-and-best-practices/github-flow-standards.md)

## Purpose

Assess whether the accepted GitHub Flow decisions change the existing OpenSpec SDD foundation requirements, implementation plan, dependency plan, completed M1-C1 implementation, or future issue-lifecycle automation.

## Conclusion

The accepted decisions do not invalidate the SDD foundation architecture or completed M1-C1 implementation. They refine GitHub behavior that is primarily scheduled for M2, M4, and M5.

The milestone dependency graph remains valid. The material changes are:

- Make `main` explicit instead of merely configurable as an unspecified default branch for this product.
- Require every normal implementation PR to target `main`.
- Require formal GitHub Development/PR linkage; branch-name issue numbers are context, not linkage.
- Validate issue-numbered topic-branch names.
- Make squash merge the standard completion merge.
- Add `main` ruleset and merge-setting work.
- Remove any implied need for `development`/`integration` promotion or hotfix merge-down automation.

## Requirements Impact

The requirements baseline now explicitly records:

- `main` as sole permanent development branch.
- Short-lived issue-numbered branches or forks.
- Formal Development relationship and closing keyword.
- Squash merge.
- `main` ruleset expectations.
- Zero required human approvals during solo maintenance.
- PR-base and branch-name validation.

The following existing requirements remain unchanged:

- One primary issue per OpenSpec change.
- GitHub Project as lifecycle source of truth.
- OpenSpec as requirements/design/task source of truth.
- Local lifecycle synchronization plus GitHub Actions reconciliation.
- Idempotency, managed blocks, audit, repair, and safe failure.
- Untrusted-PR credential boundaries.
- Release automation remains a first-pass non-goal.

## Implementation Milestone Impact

| Milestone/change | Impact |
|---|---|
| M1-C1 bootstrap | No implementation change; current delivery PR must eventually conform to `main` target before merge |
| M2-C1 work intake | Add `main` config, PR-template wording, squash setting, and initial ruleset setup |
| M3-C1 quality rules | Designs and tasks should reference the accepted standard; no dependency change |
| M3-C2 tracking | Existing default-branch/config model remains valid; active config value becomes `main` |
| M4-C1 intake | Add issue-number branch planning and formal Development linkage behavior |
| M4-C2 lifecycle sync | Audit the formal link and `main` delivery expectation; no new lifecycle status |
| M5-C1 PR linkage | Validate `main` base, formal issue relationship, closing keyword, and branch convention |
| M5-C2 PR reconciliation | Treat squash merge to `main` as delivery; closed-unmerged remains incomplete |
| M6-C1 navigation | No branch-model-specific dependency change |
| M7-C1 hardening | Require hardened checks on `main` and exercise outside-contributor/fork behavior |

## Issue Lifecycle Automation

### Authoritative Relationship

Automation SHALL use the GitHub Development relationship and PR body closing keyword. It SHALL NOT treat this as sufficient:

```text
feature/42-some-change
```

The number helps humans and validation correlate records, but GitHub's formal relationship is authoritative.

### State Mapping

The existing five-state Project model remains correct:

```text
Backlog -> Ready -> In Progress -> In Review -> Done
```

The accepted flow removes ambiguity from completion:

```text
draft PR to main       -> In Progress
ready PR to main       -> In Review
returned to draft      -> In Progress
closed without merge   -> not Done
squash-merged to main  -> issue closes -> Done
```

### Built-In Versus Custom Automation

Use built-in Project automation for the closed-issue-to-`Done` transition. Use custom Actions for:

- Formal issue/OpenSpec/PR linkage validation.
- Draft/ready/draft Project transitions.
- Detecting a non-`main` base for normal delivery.
- Detecting branch-name/formal-link disagreement.
- Drift audit and repair.

Do not depend on a second `development -> main` PR to close the issue. Every normal issue-delivering PR targets `main` directly, so the original PR can contain the closing keyword and create the native closure event.

### Squash Merge

Lifecycle automation SHALL key completion from the PR's merged state and base branch, not from a guessed commit topology. Squash merge changes commit history but does not change the PR event contract.

The resulting squash commit should retain the PR number. The PR remains the source for review discussion, linked issue, OpenSpec references, and verification evidence.

### Hotfixes

No merge-down automation is required. A hotfix issue produces a `hotfix/<issue>-<slug>` branch from `main`, a reviewed PR to `main`, and normal release/deployment follow-through. Supported temporary release branches, if introduced later, require explicit backport PRs.

### External Contributors

Fork PRs SHALL run validation without Project or deployment credentials. A trusted event path may reconcile Project status without checking out or executing the contributor's head content.

## Repository Migration Status

The repository was aligned with the accepted branch model after this assessment:

- GitHub default branch remains `main`.
- Draft PR #5 replaces PR #3, targets `main`, and formally closes issue #2.
- M1-C1 branch `feature/2-bootstrap-openspec` includes its primary issue number.
- Redundant `development`, `developmrnt`, and `master` branches were verified to match `main` and were deleted locally and remotely.
- Squash merge is the only enabled merge method, and merged head branches are deleted automatically.

The `main` ruleset, required checks, and Project lifecycle configuration remain owned by their planned milestones.

## Releases and Environments Scope

The accepted workflow standard establishes these directions:

- This AI-assets repository uses tags and GitHub Releases for versioned distribution.
- Deployed applications use GitHub Environments and immutable artifact promotion instead of permanent stage branches.

The first SDD foundation pass still SHALL NOT implement release automation. Detailed versioning, release assets, Environment topology, store mapping, and deployment protection decisions remain follow-up work after owner review of:

- [GitHub Releases research](../research/git-workflows/github-releases-for-assets-and-mobile-apps.md)
- [GitHub Environments research](../research/git-workflows/github-environments-for-assets-and-mobile-apps.md)

## Dependency Plan Impact

No change to milestone dependencies or parallel windows is required. The accepted standard adds acceptance behavior within existing changes rather than creating a new prerequisite capability.

If branch cleanup or repository settings are implemented as repository content or material external configuration, track that work under M2-C1 or a separately approved maintenance issue without changing the M2 -> M4 -> M5 dependency sequence.
