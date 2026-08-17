# SDD Post-Archive Workspace Cleanup

Date: 2026-08-14
Status: Owner-approved and ready for OpenSpec Propose.

## Problem And Desired Outcome

The SDD lifecycle delivers implementation, Sync, and Archive pull requests,
but it leaves local topic branches and linked worktrees behind after the
archive is merged to the default branch and the linked issue is closed. The
resulting stale resources obscure active work and require a manual forensic
inventory before they can be removed safely.

Add an authorization-gated local cleanup finalizer that removes only
change-owned, clean worktrees and their confirmed-delivered local branches.
It must be safe for merge strategies that do not preserve branch ancestry,
including squash merges, and it must leave ambiguous or user-owned resources
untouched.

## Evidence And Key Findings

- The current lifecycle ends after Archive; its canonical workflow has no
  post-merge local cleanup step. See
  `workflows/autonomous-sdd-lifecycle/workflow.md`.
- The living `sdd-lifecycle` specification already recognizes a final
  `delete-merged-topic-branch` transition, but no implementation owns branch
  deletion or worktree removal.
- The authorization checker can authorize a recorded exact branch target, but
  it has no resource discovery, cleanliness check, worktree ownership check,
  or Git executor. See `scripts/sdd/check-operation-authorization.mjs` and
  `scripts/sdd/checkpoint.mjs`.
- `tracking.yaml` contains static repository, issue, default-branch, and path
  metadata. Its validator rejects mutable lifecycle-state fields such as merge
  and closure timestamps. It is therefore unsuitable as the durable record of
  local resources and cleanup outcomes. See
  `scripts/validation/lib/tracking.mjs`.
- The 2026-08-14 inventory found all of the relevant failure modes: prunable
  missing worktree registrations, clean linked worktrees for completed changes,
  clean worktrees with branches containing unique commits, a detached worktree,
  a current active worktree, and a dirty primary worktree with untracked work.
  A name-based cleanup rule would risk data loss.
- GitHub PR and Project automation can provide merge and closure evidence, but
  cannot safely remove developer-local worktrees. Local cleanup must run from
  an authorized local lifecycle controller, not from a GitHub Action.

## Options Considered

### Option A: Delete branches from the generated Archive action

Rejected. Archive runs before its archive pull request is merged to the
default branch, so it cannot prove the required post-merge state. Generated
OpenSpec actions are also not the right owner for repository-specific local
resource cleanup.

### Option B: GitHub workflow deletes branches and worktrees

Rejected. GitHub can delete remote PR branches, but has no authority over,
visibility into, or safe access to local developer worktrees.

### Option C: A post-archive cleanup finalizer in the autonomous SDD lifecycle

Selected. A new canonical reusable cleanup skill performs a dry-run inventory
by default and mutates only under the existing bounded `sdd-delivery`
authorization. It consumes durable, exact resource records and current GitHub
and Git evidence after Archive is merged.

### Option D: Infer ownership from branch and directory names

Rejected. Historical and manually created resources can share common naming
patterns. Automated deletion must use durable change-owned records; legacy
resources remain inventory-only.

## Owner Decisions

The owner has selected the following direction:

1. Cleanup is automatic only within an explicitly authorized local SDD
   delivery run. It is not a standing background deletion service.
2. Cleanup runs only after the Archive pull request is merged to the configured
   default branch, the archive is visible in refreshed `origin/<default-branch>`,
   and the linked issue is closed with the Project item at `Done` when a Project
   is configured.
3. Cleanup removes only resources durably recorded as owned by the selected
   change. Legacy resources are reported, never automatically deleted.
4. A dirty, locked, primary, unregistered, ambiguous, or evidence-mismatched
   worktree blocks removal. Cleanup continues only with other independently
   eligible resources and reports every blocked item.
5. Cleanup supports squash and rebase delivery only when exact recorded pull
   request evidence proves the final change-owned head was delivered to the
   configured default branch. A lack of Git ancestry alone is not failure
   evidence, but neither is it permission to delete.
6. Before an autonomous SDD run selects work or changes local or external
   state, the runner collects its complete delivery request. When a required
   value is absent, it asks once, in positive language: “For this run, please
   provide the following,” followed by every missing field, a short purpose,
   and its supported values. It must not first work until it reaches a later
   gate and describe the resulting pause as “I was blocked by” missing input.

## Proposed Behavior

### Durable Resource And Delivery Evidence

Create a versioned delivery-checkpoint/evidence record that moves with the
OpenSpec archive. It records, per selected change and implementation
repository:

- repository identity and configured default branch;
- change-owned local branch records, including branch name, base branch, final
  full head commit, role (`implementation`, `sync`, or `archive`), and the PR
  that delivered that head;
- change-owned worktree records, including canonical path, associated branch or
  detached full head, role, and an ownership token created when the worktree is
  created;
- archive PR delivery evidence, archive path, issue closure evidence, and
  Project completion evidence where configured; and
- per-resource cleanup decision, action, outcome, and recovery reference.

This evidence is separate from `tracking.yaml`. The tracking schema remains
portable static metadata and must not gain timestamps, mutable PR state, local
absolute paths, or persisted approval grants.

### Cleanup Eligibility

The cleanup skill refreshes the configured remote and creates an inventory
before changing anything. A recorded worktree is eligible only when all of the
following are true:

1. the selected change's archive directory exists on the refreshed configured
   default branch;
2. every recorded delivery PR for the resource is merged into that branch and
   the final recorded head is proven delivered either by ancestry or exact
   recorded squash/rebase PR evidence;
3. the linked issue is closed and the configured Project item is `Done`;
4. the worktree is not the primary worktree, is not locked, and matches the
   recorded canonical path and ownership token;
5. `git status --porcelain` reports no staged, unstaged, untracked, conflicted,
   or submodule changes; and
6. no unrelated branch or worktree still references the resource.

A missing worktree path can be pruned only when Git reports its registration as
`prunable`. A missing path is never recreated to make cleanup appear complete.

After successfully removing all eligible registered worktrees for a recorded
branch, the skill deletes the branch. It uses ordinary merged deletion when
Git ancestry proves it. For a squash/rebase delivery, it may use forced local
branch deletion only after all exact resource and PR evidence gates pass. It
must never force-remove a worktree.

### Lifecycle And Authorization

Extend the canonical delivery chain with a distinct cleanup-worktrees
transition before the existing `delete-merged-topic-branch` transition. Both
transitions require exact derived targets, current evidence, recovery behavior,
expiration, runtime permission, and the `sdd-delivery` profile.

### Upfront Autonomous-Run Intake

The autonomous runner treats a request to deliver a named OpenSpec change (or
ordered queue) as an intake boundary, not as permission to begin partial work.
Before selecting the change, it normalizes and reports the effective request:

- target change or ordered queue;
- mode (`autonomous` or `interactive`);
- quality profile (`production-rapid` or `prototype-rapid`);
- authorization profile (`sdd-delivery` for delivery work);
- independent-review policy (`strict-only` or `strict-first-degraded`); and
- a positive-duration or future-timestamp expiration.

When any of these is missing, invalid, or conflicting, the runner sends one
consolidated preflight request beginning “For this run, please provide the
following:” and lists all affected fields. It explains that these inputs set
the scope, quality/review gates, and expiry; it neither selects work nor makes
local or external mutations. Once complete, it reports the resolved
authorization before beginning the lifecycle. This is an explicit user-
experience rule: missing input is detected at intake rather than surfaced
later as a blocked delivery state.

The canonical `autonomous-sdd-lifecycle` workflow invokes the cleanup skill
only after the merged Archive checkpoint. The generated OpenSpec Archive,
Sync, Apply, and Verify skills remain unchanged. Platform wrappers for the new
skill remain thin and point to the canonical `skills/base/` implementation.

The cleanup skill supports:

- `audit`: read-only inventory with eligible, blocked, prunable, and legacy
  classifications;
- `apply`: the exact, authorized cleanup transition; and
- `resume`: idempotent reconciliation after a partial cleanup.

No mode may delete a remote branch, alter GitHub state, delete the primary
worktree, reset a worktree, discard dirty content, or expand a cleanup target
beyond the durable selected-entry record.

### Legacy Resources

Existing branches and worktrees without the new durable resource records are
legacy. The audit reports their branch ancestry, patch-equivalence where useful,
working-tree state, OpenSpec archive state, and suggested manual action. It
does not mark them eligible for automatic deletion. A separate, explicitly
approved migration may create records for a manually reviewed resource, but
the first implementation will not infer or backfill ownership.

## Scope

- Add `skills/base/sdd-workspace-cleanup/` with progressive references and thin
  Codex and Claude wrappers.
- Extend the autonomous-runner authorization vocabulary, delivery request,
  checkpoint schema/validator, and canonical autonomous lifecycle workflow.
- Add a local deterministic cleanup planner/executor and read-only GitHub
  evidence adapter boundary.
- Extend the relevant living OpenSpec specifications and validation/evaluation
  fixtures.
- Document repository cleanup policy inputs in `docs/sdd-project-bootstrap.md`,
  `docs/sdd-workflow.md`, and `docs/sdd-foundation-operations.md`.

## Non-Goals

- No deletion of remote branches, GitHub issues, pull requests, Projects,
  releases, deployments, credentials, or user data.
- No changes to generated OpenSpec lifecycle action content.
- No background daemon, cron job, launch agent, or global machine policy.
- No automatic cleanup of historical resources lacking durable ownership
  evidence.
- No use of worktree or branch naming conventions as authorization.
- No attempt to make a dirty worktree clean through reset, checkout, clean, or
  force removal.

## Constraints, Dependencies, And Risks

- Cleanup is a destructive local mutation and must retain the existing
  high-impact authorization and runtime-permission controls.
- The design must preserve portable global assets: repository names, default
  branch names, local worktree roots, and Project configuration belong in
  product-owned configuration or durable selected-entry records, not reusable
  skill constants.
- Existing `tracking.yaml` validation deliberately disallows mutable state;
  the proposal must define and validate a separate versioned evidence format.
- The lifecycle checkpoint migration must preserve resume safety. Old records
  should classify as legacy/ineligible rather than malformed resources that
  could block unrelated current delivery.
- Git worktree paths can be absent, locked, moved, or dirty. Every such state
  requires a fail-closed result and a precise recovery action.
- A cleanup run needs read access to GitHub state when GitHub lifecycle
  integration is configured. Network or credential unavailability pauses the
  mutating transition but still permits a local audit that clearly reports the
  missing evidence.

## Acceptance Criteria

The OpenSpec proposal must require evidence that:

- a clean, recorded worktree and its confirmed-delivered branch are removed
  after archive/default-branch/issue/Project gates pass;
- an implementation, Sync, or Archive branch cannot be removed until its
  recorded delivery evidence is current;
- squash-merged and rebase-merged branches are handled only through exact PR
  and final-head evidence;
- ordinary ancestry-merged branches use non-forced deletion;
- dirty, untracked, staged, conflicted, locked, primary, unregistered,
  ownership-mismatched, and evidence-mismatched worktrees remain intact and
  produce a blocked result;
- missing worktree registrations are pruned only when Git marks them prunable;
- a branch remains when any attached or recorded worktree cannot be removed;
- a rerun converges after any partial cleanup without deleting another change's
  resources;
- legacy resources are inventory-only and never auto-deleted;
- an autonomous delivery request with missing, invalid, or conflicting
  risk-bearing inputs produces one consolidated, upfront “For this run, please
  provide the following:” request before work selection or mutation, while a
  complete request reports its effective authorization before lifecycle work;
- generated wrappers remain thin, reusable assets contain no product-specific
  constants or secrets, and strict OpenSpec plus focused test/eval validation
  passes.

## Recommended Next Step

Run OpenSpec Propose for a change named
`automate-post-archive-workspace-cleanup`. The proposal should treat this
brief as the owner-approved design input, define the versioned checkpoint
migration and cleanup target schema, and break implementation into planner,
authorization, executor, workflow, documentation, and evaluation tasks.
