## Why

An autonomous SDD run can complete delivery, Sync, Archive, issue closure, and
Project completion but still be unable to clean its own temporary worktrees and
branches. The current controller is stored inside a removable worktree and does
not register the exact, resource-specific delivery evidence that post-Archive
cleanup requires.

This repair makes successful delivery terminally recoverable and clean without
weakening the existing fail-closed protections against deleting dirty, legacy,
or ambiguously owned local resources.

## What Changes

- Persist each autonomous-run controller and terminal cleanup receipt in a
  repository-scoped state location outside removable worktrees.
- Register each selected implementation, Sync, and Archive worktree or branch
  at creation with exact ownership, lifecycle role, and recovery data.
- Bind each registered resource to its own merged pull-request and delivered
  head evidence so separate squash-merged checkpoints can be evaluated
  independently.
- Require cleanup to consume the registered resource collection, preserve
  partial outcomes, and remove only resources that pass fresh inspection.
- Define a reviewed, explicitly owner-authorized migration procedure for
  stranded legacy resources; automatic cleanup MUST continue to reject inferred
  or post-Archive-backfilled ownership.
- Add deterministic fixtures for terminal controller retention, multi-PR
  resource delivery, dirty controller worktrees, partial cleanup, and migration
  refusal or acceptance.

## Non-Goals

- Do not infer ownership, delete remote branches, force-remove worktrees, or
  weaken strict review, issue, Project, Sync, or Archive gates.
- Do not store credentials, repository-specific account identifiers, or
  standing authorization in reusable assets.
- Do not change the scope of standalone OpenSpec actions.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `autonomous-sdd-continuation`: controller state and phase handoff must
  register lifecycle resources and remain available after their worktrees are
  removed.
- `sdd-workspace-cleanup`: cleanup must evaluate independently delivered
  registered resources and support an explicit, non-inferred legacy migration
  path.

## Impact

- Primary issue: https://github.com/jizzoe/joericearchitect-ai-skills/issues/115
- Delivery linkage: `tracking.yaml` binds this change to the issue and Project.
- Affected assets: autonomous SDD controller/checkpoint code, workspace-cleanup
  planner and executor, lifecycle orchestration, tests/evals, and the related
  canonical documentation and thin Claude/Codex exposure where needed.
- Users: autonomous SDD operators gain deterministic cleanup receipts and
  recoverable close-out; ordinary standalone OpenSpec actions retain their
  existing boundaries.
- Compatibility: existing controllers and unregistered local resources remain
  ineligible by default. A separately authorized migration is required before
  an existing stranded resource can be considered for cleanup.
- Reuse plan: retain the assistant-neutral controller and cleanup policy under
  `scripts/sdd/` and `skills/base/`; expose any user-facing behavior through
  existing thin Claude/Codex adapters without repository-specific paths,
  credentials, Projects, or branch constants.
- Source decision record:
  `ai-planning/design-briefs/sdd-controller-terminal-cleanup.md`.

## Reuse Plan

- Keep controller and cleanup security policy in the canonical `scripts/sdd/`
  and `skills/base/` assets; assistant adapters remain thin references.
- Preserve portability by deriving Git paths from repository metadata and
  exercising a second-workspace lifecycle fixture.
- Preserve compatibility by classifying existing controller records and
  unregistered resources as legacy until a separately authorized migration.
