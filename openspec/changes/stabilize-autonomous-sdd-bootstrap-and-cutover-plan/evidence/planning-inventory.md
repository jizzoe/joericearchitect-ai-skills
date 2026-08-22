# Planning inventory

Observed: 2026-08-22

## Authoritative current inputs

- Main base before implementation: `138b2212f33af4dc97abaedff93d3d7e4558c61e`.
- Active controller: `controller-4be6297b1ee9baa567646e25af7c7518`.
- Selected change: `stabilize-autonomous-sdd-bootstrap-and-cutover-plan`.
- Authorization expiry: `2026-08-22T23:37:13Z`.
- Issue: #197; Project 1 status `In Progress`.
- Installed runtime: `runtime-e0e9a50a042b`, source commit
  `138b2212f33af4dc97abaedff93d3d7e4558c61e`, digest
  `e0e9a50a042bae3ba43f842ced29799546860edf09464dc49557a3aed70c274a`.

## Preserved primary-worktree sources

The primary worktree was not edited. These pre-existing bytes were copied into
the isolated delivery worktree before planning edits:

| Source | SHA-256 before planning edits |
|---|---|
| `ai-planning/handoff-docs/autonomous-sdd-blocker-register-and-plain-english-handoff.md` | `474211d4ed9727c10b97b176defead8d5313b40cd4e709c1ee57f93b1ae9c4a5` |
| `ai-planning/handoff-docs/autonomous-sdd-stabilization-and-roadmap-resumption-handoff.md` | `bab376ad3325e43ab8d490ff61851c98051a88a2344f0d7ee775a33fc0241f0b` |
| `ai-planning/notes/autonomous-sdd/milestone-blocker-root-cause-analysis/milestone-blocker-root-cause-analysis-findings.md` | `9ac804fdab8093489fa4b7fed0cf99e2b7b5725229371aefba001535cdfbeb65` |
| `ai-planning/notes/autonomous-sdd/milestone-blocker-root-cause-analysis/sources.md` | `df70593e8d79d00cbfe99e549cf7dce8cdedd8974f97dc132ecafe78b3014254` |

The full source objects remain in the untouched primary worktree and Git diff;
the hashes identify the inspected copies without claiming that later planning
edits retain those hashes.

Issue intake preflight found that the proposed `type:enhancement` label does
not exist. No repository label was created. Issue #197 uses the established
`type:feature` plus `sdd` labels, and the controller evidence records that exact
result.

## Lifecycle and repair evidence

- M1-S1: issue #150; PRs #151/#152/#153.
- M1-S2: issue #158; PRs #159/#160/#161; terminalization repair issue #162
  and PRs #163/#164.
- M1-S3: issue #165; PRs #166/#168/#169 and linked repair lineage in the
  blocker register.
- Final initializer repair: issue #193; PRs #194/#195/#196; final main
  `138b2212f33af4dc97abaedff93d3d7e4558c61e`.

## Scope boundary

No runtime, global-skill, deployment, credential, repository-setting, active
controller, or Jira behavior is changed by the implementation content. Remote
branches are retained; only controller-registered local resources are eligible
for exact cleanup after Archive.
