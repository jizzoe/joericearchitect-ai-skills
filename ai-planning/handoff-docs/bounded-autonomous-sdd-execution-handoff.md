# Bounded Autonomous SDD Execution Handoff

- Date: 2026-08-09
- Status: Ready to begin M1-C2 proposal
- Current milestone/change: M1-C2, `enable-bounded-autonomous-sdd-execution`
- Current issue: [#8](https://github.com/jizzoe/joericearchitect-ai-skills/issues/8)
Current draft PR: [#9](https://github.com/jizzoe/joericearchitect-ai-skills/pull/9)

## 1. Purpose

This document is the checkpoint for a new session that will:

1. Implement M1-C2, the bounded autonomous SDD execution capability.
2. Rehearse and verify that capability using disposable records.
3. After M1-C2 is delivered, synchronized, and archived, use it to execute the
   remaining OpenSpec SDD foundation milestones with bounded autonomy.

The implementation and dependency plans remain authoritative. This handoff
records current state, decisions, sequencing, operating constraints, recovery
information, and ready-to-use prompts. It does not replace requirements,
living specifications, or implementation plans.

## 2. Critical Starting Truth

The bounded autonomy capability is **planned but not implemented**.

The repository currently has:

- the completed and archived M1-C1 foundation;
- a configured, session-specific Codex `goal` profile;
- GitHub issue #8, feature branch, and draft PR #9 for M1-C2;
- an approved detailed M1-C2 implementation plan.

The repository does not yet have:

- an active OpenSpec change named
  `enable-bounded-autonomous-sdd-execution`;
- the autonomous goal runner skill;
- the autonomous SDD lifecycle workflow;
- the deterministic `scripts/sdd` command surface;
- the required evals or disposable end-to-end rehearsal evidence;
- generated Claude and Codex exposure for those assets.

The current `openspec-propose` workflow intentionally stops after planning
artifacts and waits for an explicit Apply request. Therefore M1-C2 must be
bootstrapped through the existing interactive lifecycle. Do not try to bypass
that boundary. Once M1-C2 passes its rehearsal and is delivered, its bounded
runner may execute M2-M7 without routine approvals.

## 3. Read First

Read these files in order before changing anything:

1. This handoff.
2. [OpenSpec SDD foundation requirements](../requirements/openspec-sdd-foundation.md).
3. [Codex Goal autonomy prerequisites plan](../plans/codex-goal-autonomy-prerequisites-implementation-plan.md).
4. [Bounded autonomous SDD execution plan](../plans/bounded-autonomous-sdd-execution-implementation-plan.md).
5. [Foundation implementation plan](../plans/openspec-sdd-foundation-implementation-plan.md).
6. [Foundation dependency plan](../plans/openspec-sdd-foundation-dependency-plan.md).
7. [Cross-assistant assets living spec](../../openspec/specs/cross-assistant-assets/spec.md).
8. [SDD lifecycle living spec](../../openspec/specs/sdd-lifecycle/spec.md).
9. [SDD action prompt reference](../references/sdd-action-prompts.md).

Historical detail is available in:

- [M1-C1 apply-complete handoff](bootstrap-openspec-foundation-apply-complete-handoff.md)
- [Original foundation implementation handoff](openspec-sdd-foundation-implementation-handoff.md)

## 4. Exact Repository State

At this checkpoint:

- Repository: `jizzoe/joericearchitect-ai-skills`
- Workspace:
  `/Users/joerice/git/joericearchitect/joericearchitect-ai-skills`
- Branch: `feature/8-bounded-autonomous-sdd-execution`
- Branch HEAD: `e335d37557fde3846ffdfa61419a6fd32ee3872a`
- HEAD subject: `Prepare bounded Goal autonomy prerequisites`
- Upstream: `origin/feature/8-bounded-autonomous-sdd-execution`
- `origin/main`: `f9e4f91a0d8110a58abcb6a31b9d50dcd94e78e6`
- `origin/main` subject: `Archive OpenSpec foundation change (#7)`
- Working tree: clean before this handoff was added

The feature branch was corrected from the earlier, wrongly associated
`chore/2-prepare-goal-autonomy` branch. Do not recreate or use that old branch.
The issue should exist before a new delivery branch is named so the branch can
carry the correct issue number.

Before starting work in the new session, re-run:

```bash
git status --short --branch
git fetch origin
git rev-parse HEAD
git rev-parse origin/main
```

Preserve any changes that appeared after this checkpoint. Do not reset,
overwrite, or discard user-authored or generated work.

## 5. OpenSpec State

M1-C1, `bootstrap-openspec-foundation`, is complete:

- implementation PR #5 merged at `3b66848`;
- Sync PR #6 merged at `fc035d0`;
- Archive PR #7 merged at `f9e4f91`;
- issue #2 is closed and its Project item is Done;
- the archived change is under
  `openspec/changes/archive/2026-08-09-bootstrap-openspec-foundation/`.

Current validation state:

```text
openspec list --json
  no active changes

openspec validate --all --strict
  cross-assistant-assets: passed
  sdd-lifecycle: passed
  totals: 2 passed, 0 failed
```

The next OpenSpec action is Propose for
`enable-bounded-autonomous-sdd-execution`. Do not invoke Apply before its
proposal, delta specs, design, and stable task plan exist and have passed the
planning review.

## 6. GitHub Delivery State

### Roadmap

- Issue [#1](https://github.com/jizzoe/joericearchitect-ai-skills/issues/1),
  `Establish OpenSpec SDD foundation`, remains open.

### M1-C2

- Issue [#8](https://github.com/jizzoe/joericearchitect-ai-skills/issues/8),
  `[M1-C2] Enable bounded autonomous SDD execution`, is open.
- Its parent is roadmap issue #1.
- It is in the `AI Skills Development` Project with status `Todo`.
- Planning metadata identifies sequence 102, change
  `enable-bounded-autonomous-sdd-execution`, dependency on M1-C1/#2, and PR
  delivery.
- Draft PR [#9](https://github.com/jizzoe/joericearchitect-ai-skills/pull/9)
  targets `main` from `feature/8-bounded-autonomous-sdd-execution`.
- PR #9 is open, draft, mergeable, and has merge state `CLEAN` at this
  checkpoint.
- PR #9 currently says `Related to #8`; it does not close the issue.

Keep PR #9 draft during implementation. After accepted verification, make it
ready and change its delivery relationship to `Closes #8` only when merging
the PR represents completion of M1-C2.

The repository has a `PROJECT_TOKEN` Actions secret, last observed as set on
2026-08-09. GitHub does not reveal the stored value, scopes, or expiration.
The owner must separately confirm that the personal access token has the
required repository and Project scopes and that its expiration and recovery
copy are managed.

## 7. Codex Goal Profile

The session-specific profile is installed at:

```text
/Users/joerice/.codex/goal.config.toml
```

It has file mode `600` and contains:

```toml
approval_policy = "on-request"
approvals_reviewer = "auto_review"
sandbox_mode = "workspace-write"

[sandbox_workspace_write]
network_access = true
```

Codex CLI `0.147.0` accepted the profile during prerequisite validation. The
base `~/.codex/config.toml` was not changed to enable autonomy. Ordinary Codex
sessions therefore retain their normal behavior.

Start the later autonomous session with:

```bash
codex --profile goal \
  --cd /Users/joerice/git/joericearchitect/joericearchitect-ai-skills
```

The `--cd` value makes this repository the Codex workspace, equivalent to
changing into the repository before launching Codex. In the session, run
`/status` and confirm the profile and workspace before starting `/goal`.

Goal mode does not grant arbitrary permissions. It supplies persistence and
an auto-review approval posture; the goal prompt, repository instructions,
tool sandbox, credential scopes, and explicit mutation authorization still
bound execution.

## 8. Completed Prerequisite Work

The following work has already been performed and is committed on the M1-C2
feature branch:

- installed and validated the session-specific Codex `goal` profile;
- preserved normal approval behavior outside sessions launched with that
  profile;
- created issue #8 and connected it to roadmap issue #1 and the Project;
- corrected the feature branch to use issue #8;
- opened draft PR #9 against `main`;
- created the detailed M1-C2 implementation plan;
- reconciled the foundation implementation and dependency plans to add M1-C2
  and its downstream dependency relationships;
- recorded the M1-C1 completion evidence and the USER-005 bounded autonomy
  decision.

The prerequisite plan is marked In Progress because owner-only and
post-implementation checks remain.

## 9. Owner-Only Prerequisites

These cannot be truthfully completed by inspecting the repository alone:

1. Confirm the token behind `PROJECT_TOKEN` has the required classic PAT
   scopes, including `project` and `public_repo`, has an intentional
   expiration, and has a recovery record in the password manager.
2. Enable Codex notifications and `Prevent sleep while running` before a
   multi-hour Goal run.
3. Launch Codex with `--profile goal`, run `/status`, and verify the effective
   settings and workspace.
4. Provide the bounded external-mutation authorization immediately before the
   disposable rehearsal.

Do not store a token value in this repository, planning documents, logs,
issues, PRs, or prompts.

## 10. Resolved Autonomy Decisions

The detailed decisions are authoritative in the M1-C2 implementation plan.
The new session must preserve these core rules:

- Authorization and runtime permission are separate controls.
- A Goal may authorize later Apply only after generated planning artifacts
  pass the required automated planning review.
- Work selection uses a deterministic dependency-ordered queue.
- Implementation proceeds in reviewable batches of approximately three to
  five tasks, adjusted when dependency or risk boundaries require a smaller
  batch.
- Each batch receives tests and validation, code/documentation review,
  security and supply-chain review, requirements and scenario mapping,
  portability and attribution checks, recovery review, and evidence capture.
- Objective, narrowly scoped findings are corrected automatically and affected
  checks are rerun.
- The same failure signature receives no more than three materially different
  correction attempts before a human pause.
- Independent review is preferred when available; fallback self-review must
  remain explicit and evidence-based.
- Expected external mutations may proceed only when they fall inside the
  goal's explicit authorization.
- Archive may proceed automatically only when all objective completion and
  verification evidence is green.
- Every durable checkpoint must be resumable and idempotent.

## 11. Human Pause Boundary

Pause for the owner when execution encounters:

- a material requirements, architecture, behavior, compatibility, data
  ownership, security, licensing, or governance decision not already resolved;
- a destructive or unexpected action outside explicit authorization;
- credential creation, scope changes, rotation, disclosure risk, or missing
  access that requires owner action;
- ambiguity involving shared or external state that cannot be safely and
  idempotently recovered;
- three materially different failed correction strategies for one failure
  signature;
- a persistent tool, authentication, rate-limit, or environment impasse;
- conflicting authoritative sources whose precedence is not established.

Do not pause merely for:

- deterministic formatting, lint, type, link, schema, test, or validation
  failures with a clear scoped correction;
- objective and behavior-preserving review findings;
- expected issue, Project, branch, PR, Sync, or Archive transitions already
  covered by explicit authorization;
- warnings already accepted in authoritative plans or verification evidence.

## 12. Phase A: Bootstrap M1-C2 Interactively

The next session should execute this sequence.

### A1. Reinspect and propose

1. Read the authoritative files listed above.
2. Verify Git, GitHub, Project, OpenSpec, and Goal-profile state.
3. Explicitly select change `enable-bounded-autonomous-sdd-execution`.
4. Invoke `openspec-propose` using issue #8 and the M1-C2 plan.
5. Generate proposal, delta specs, design, and a task plan with stable task
   IDs, dependency annotations, verification evidence, recovery, security,
   attribution, and Claude/Codex portability.
6. Run the standing planning review and automatically correct objective,
   narrowly scoped defects.
7. Stop after planning artifacts for owner review, as required by the current
   Propose workflow.

### A2. Apply in bounded batches

After the owner explicitly authorizes Apply:

1. Run OpenSpec status and apply instructions.
2. Read every context path returned by the instructions.
3. Implement the approved tasks in dependency-ordered batches.
4. After every batch, run the full batch review and validation contract from
   the M1-C2 plan.
5. Auto-correct objective findings, rerun affected checks, and record evidence
   before marking tasks complete.
6. Pause only under the Human Pause Boundary.

The expected implementation assets include:

- `skills/base/autonomous-goal-runner/`
- `workflows/autonomous-sdd-lifecycle/`
- `scripts/sdd`
- focused evals and fixtures
- generated Claude and Codex discovery surfaces

Treat the detailed asset list and batch boundaries in the M1-C2 plan as
authoritative; do not infer behavior from this abbreviated list.

### A3. Verify and deliver

1. Invoke formal OpenSpec Verify for all M1-C2 tasks, requirements, scenarios,
   design decisions, security controls, recovery behavior, evidence, and
   cross-assistant parity.
2. Run the standing automatic review and correction loop.
3. Obtain owner acceptance of formal verification.
4. Make PR #9 ready, audit it, ensure it formally closes issue #8, and
   squash-merge only after the audit passes.
5. Verify the merge, issue closure, feature-branch deletion, Project state,
   and `main` commit.
6. Sync the M1-C2 delta specs into living specs on a short-lived follow-up
   branch and merge the Sync PR after validation.
7. Archive the completed OpenSpec change on a separate short-lived follow-up
   branch and merge the Archive PR after validation.

Do not combine implementation, Sync, and Archive into one unreviewable
checkpoint. Each transition must leave durable evidence and an idempotent
resume point.

### A4. Disposable rehearsal

Before the rehearsal, the owner should provide this bounded authorization:

> I authorize this Goal to create, update, close, and retain disposable
> `[SDD test]` issues in `jizzoe/joericearchitect-ai-skills`; update their
> Project fields; create and merge verified lifecycle PRs; and delete their
> topic branches. This does not authorize repository deletion, secret
> disclosure or rotation, force-pushing shared branches, weakening security
> controls, modifying unrelated records, or inventing missing product
> decisions.

Run the plan's disposable end-to-end rehearsal. Verify normal completion,
checkpoint/resume, idempotent rerun, bounded external mutations, deliberate
human-pause cases, and failure-budget behavior. Clean up only the temporary
artifacts whose removal was explicitly authorized, and preserve audit evidence.

M1-C2 is not ready to govern later milestones until this rehearsal passes.

## 13. Phase B: Execute M2-M7 Autonomously

After M1-C2 is implemented, verified, delivered, synchronized, archived, and
successfully rehearsed, start a fresh Goal-profile session and execute the
remaining queue in dependency order:

1. M2-C1, `establish-github-work-intake`
2. M3-C1, `establish-openspec-quality-rules`
3. M3-C2, `add-openspec-change-tracking`
4. M4-C1, `add-github-openspec-intake`
5. M4-C2, `add-openspec-github-lifecycle-sync`
6. M5-C1, `enforce-openspec-pr-linkage`
7. M5-C2, `reconcile-project-status-from-prs`
8. M6-C1, `add-dependency-aware-work-selection`
9. M7-C1, `verify-sdd-foundation`

M2-C1 and M3-C1 are structurally parallel after M1-C2, but the first
autonomous rollout should process them sequentially under observation. After
that, follow the dependency plan rather than assuming the numerical list alone
defines eligibility.

For each change, the runner must perform the complete lifecycle required by
the authoritative plans: intake and state inspection, Propose and planning
review, Apply batches, formal Verify, delivery audit and merge, Sync, Archive,
Project reconciliation, evidence capture, and idempotent checkpointing. It may
continue through those stages only when their objective gates pass and the
action remains inside the goal authorization.

## 14. Recovery and Resume

On every resume:

1. Treat durable Git, GitHub, Project, and OpenSpec state as authoritative.
2. Re-read the active change status and dynamic instructions.
3. Inspect commits, PR state, issue state, Project fields, task checkboxes, and
   evidence before deciding what remains.
4. Reconcile partially completed external mutations idempotently rather than
   repeating them blindly.
5. Do not infer success from a prior chat message when durable evidence is
   missing.
6. Preserve unrelated work and stop if ownership of conflicting changes cannot
   be established.

A canceled Codex task is not itself a repository lock. A new session can
continue from durable state after checking for a running process, dirty files,
partial GitHub mutations, or an incomplete OpenSpec action.

## 15. Lessons Learned

- A planning document is not an implementation. Verify assets, generated
  surfaces, tests, and active OpenSpec state before claiming a capability
  exists.
- GitHub branch names help humans and automation, but issue-to-PR closure is
  established explicitly in the PR body with a closing keyword.
- Create the issue before naming the branch so the correct issue number is
  used.
- GitHub Project numbers are owner-scoped; refer to the Project title and
  owner when ambiguity is possible.
- OpenSpec Verify is an evidence-based lifecycle stage, not simply a human
  declaration that changes look acceptable.
- Code and documentation review are standing verification activities after
  every implementation batch; objective defects should be fixed without
  routine approval.
- Human acceptance and automated verification are separate: automation proves
  objective gates, while a person decides unresolved material questions.
- Goal mode should be intentional and session-specific. Global defaults should
  not silently make ordinary work autonomous.
- Sync and Archive are post-delivery lifecycle changes that deserve their own
  reviewable checkpoints.

## 16. New Session Opening Prompt

Use this prompt in the next session to begin M1-C2 safely:

```text
We are resuming M1-C2, OpenSpec change
`enable-bounded-autonomous-sdd-execution`.

First read
`ai-planning/handoff-docs/bounded-autonomous-sdd-execution-handoff.md`, then
read every authoritative requirements, plan, and living-spec file listed in
its Read First section. Treat the handoff as current-state and process context;
the requirements, plans, living specs, and OpenSpec-generated instructions
remain authoritative.

Reinspect the repository, branch, working tree, OpenSpec status, GitHub issue
#8, draft PR #9, Project state, GitHub authentication, and the Codex Goal
profile. Preserve all existing work and report material discrepancies before
mutation.

Use the `openspec-propose` skill to create OpenSpec change
`enable-bounded-autonomous-sdd-execution` for M1-C2. Base it on issue #8 and
`ai-planning/plans/bounded-autonomous-sdd-execution-implementation-plan.md`,
with the foundation requirements, implementation plan, dependency plan, and
living specs as context.

Generate planning artifacts only: proposal, delta specs, design, and tasks.
Include stable task IDs, dependency annotations, evidence requirements,
security and abuse controls, recovery and idempotency, human-pause
classification, bounded correction budgets, external-mutation boundaries, and
Claude/Codex portability. Run the standing automated planning review and fix
objective, narrowly scoped findings.

Do not invoke Apply, modify product assets, mark PR #9 ready, merge, Sync,
Archive, or begin M2-M7. Explain the proposal scorecard and stop for my review,
because the currently installed Propose workflow retains its explicit planning
boundary.
```

## 17. Post-M1-C2 Goal Prompt

Use this only after M1-C2 has passed every Phase A gate:

```text
/goal

Execute the remaining OpenSpec SDD foundation program from M2-C1 through
M7-C1 using the delivered bounded autonomous SDD runner.

Read
`ai-planning/handoff-docs/bounded-autonomous-sdd-execution-handoff.md`, the
foundation requirements, implementation plan, dependency plan, current living
specs, and the delivered autonomous-runner instructions. Reinspect durable
Git, GitHub, Project, and OpenSpec state before selecting work.

Build a deterministic dependency-eligible queue and process one OpenSpec
change at a time. For every change, execute the complete approved lifecycle:
intake, Propose with automated planning review, Apply in dependency-ordered
three-to-five-task batches, validation and independent review after every
batch, objective auto-correction with affected-check reruns, formal Verify,
delivery audit and merge, Sync, Archive, Project reconciliation, and durable
evidence capture.

Continue without routine approval when objective gates pass and actions remain
within existing authorization. Pause only for the material human-decision,
destructive-action, credential/security, irrecoverable external-state,
three-strategy correction-budget, or persistent-environment conditions defined
by the runner. Never weaken controls, expose or rotate secrets, force-push a
shared branch, delete a repository, invent missing product decisions, or
modify unrelated records.

On interruption, resume idempotently from authoritative durable state. At the
end, report every change, issue, PR, commit, living spec, archived change,
Project transition, verification result, warning, and remaining limitation.
```

This second prompt is an operating objective, not permission to exceed the
runtime sandbox or any explicit external-mutation authorization. Supply any
required bounded mutation authorization at the start of that Goal run.
