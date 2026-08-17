## Context

See `proposal.md` for motivation. The current controller persists under the
change worktree and its cleanup model accepts only one delivered head across a
resource collection. That cannot clean a run with separately squash-merged
implementation, Sync, and Archive branches, and its own checkpoint makes the
implementation worktree dirty.

## Goals / Non-Goals

**Goals:**

- preserve a portable, local, durable controller after a temporary worktree is
  removed;
- capture ownership before resource creation and delivery evidence per resource;
- keep cleanup fail-closed, resumable, and capable of exact partial recovery;
- supply a narrow, owner-authorized migration path for resources stranded by
  older controller versions.

**Non-Goals:**

- delete remote branches, reset or force-remove worktrees, infer ownership, or
  weaken review, issue, Project, or Archive gates;
- store credentials, account identifiers, repository-specific paths, or
  standing authorization in reusable assets;
- alter ordinary standalone OpenSpec action boundaries.

## Decisions

### Repository-scoped controller state outside lifecycle worktrees

Store controller records and cleanup receipts in a repository-scoped state root
resolved from the Git common directory, under a generated run identity. The
state-root resolver validates the canonical repository and containment, creates
only request-owned paths, uses atomic writes, and records no credentials or
untrusted input.

This is preferred to a primary-worktree runtime directory because it does not
dirty user work, and to a versioned archive record because final cleanup must
not require a post-Archive content change. A generic temporary directory is
rejected because it cannot provide durable local recovery.

### Register resources before creation and bind them independently

Extend the controller record with an append-only resource registry. Before an
implementation, Sync, or Archive worktree/branch is created or selected, write
its immutable ownership fields and a generated ownership token. When its PR
merges, update only that resource's delivery binding with its exact topic head,
merged PR, and delivered default-branch head.

The cleanup planner consumes this registry and evaluates resources separately.
This is preferred to one global final delivery head, which fails valid earlier
squash merges, and to reusing one worktree, which conflicts with separate PR
checkpoints.

### Terminal receipt before destructive cleanup

Before each remove-worktree or delete-branch operation, atomically persist a
started receipt in repository-scoped state; persist the outcome immediately
afterward. Cleanup rereads the registry and receipts on resume. A controller
cannot be removed from a worktree unless its terminal receipt and recovery
reference are already available outside it.

### Explicit migration for prior stranded resources

Provide a separate migration input that requires explicit owner authorization
and fresh local/GitHub inspection of an exact legacy resource. The migration
creates one bounded record only; discovery, branch names, and conversation
history never create records automatically.

## Risks / Trade-offs

- [Git common-directory state is unavailable or not writable] → fail closed
  before resource creation or cleanup and retain the existing resources.
- [Receipt write fails around a destructive action] → do not perform the action;
  if a process interruption occurs after a recorded start, resume with fresh
  inspection and preserve the recovery record.
- [A legacy migration wrongly expands scope] → validate one exact resource,
  selected entry, owner authorization, and delivery binding per record.
- [Platform worktree layouts differ] → use Git-derived common-directory
  resolution and portable fixtures rather than absolute paths.

## Migration Plan

1. Add versioned controller resource and terminal-receipt fields while treating
   records from earlier versions as legacy/ineligible.
2. Route all new lifecycle resource creation through registration and all
   cleanup through resource-specific evidence evaluation.
3. Add a separately invoked, owner-authorized migration operation for stranded
   resources; it performs no deletion itself.
4. Exercise a complete fresh lifecycle and cleanup resume path in fixtures.
5. Roll back by retaining the state records and resources; no cleanup action is
   reversible once a local worktree or branch has been deleted, so mutation is
   gated on persisted receipts and fresh inspection.

## Verification Strategy

- Add deterministic unit and workflow fixtures for state-root containment,
  atomic receipt persistence, resource registration, multiple squash-delivery
  bindings, dirty checkpoint refusal, migration scope, partial removal, and
  idempotent resume.
- Run the focused controller and cleanup tests, lifecycle evaluator fixtures,
  adapter-drift checks, and `openspec validate --all --strict`.
- Keep canonical behavior in `scripts/sdd/` and `skills/base/`; retain thin
  Claude/Codex adapters. Test a fixture whose repository and worktree paths
  differ from this repository to demonstrate no product-specific constants.
- No third-party dependency or external service is required; licensing and
  attribution impact is therefore unchanged.

## Attribution and Licensing

The implementation uses repository-owned code and built-in Git and Node.js
capabilities. No external code, dependency, or service is introduced. Any
future migration integration that needs an external source must record its
attribution, compatible license, integrity evidence, and security impact
before adoption.

## Recovery

Controller state and cleanup receipts remain in the repository Git common
directory after a temporary worktree is removed. If state-root resolution,
receipt persistence, ownership inspection, or delivery evidence fails, cleanup
stops before mutation and retains the resource for exact recovery. Legacy
resources require a new, one-resource owner authorization and fresh inspection;
the migration operation itself cannot delete a resource.

## Reuse Plan

The controller contract, receipt persistence, resource binding, cleanup policy,
and migration validation are portable canonical assets. Repository paths,
issue/Project values, credentials, and owner approvals remain caller-owned
inputs. Portability is verified using a distinct disposable repository layout;
security and recovery behavior is shared by all thin assistant adapters.
