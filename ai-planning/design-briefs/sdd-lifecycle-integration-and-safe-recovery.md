# SDD lifecycle integration and safe recovery

Date: 2026-08-17

Status: Canonical lifecycle-architecture brief. It describes delivered
behavior and remaining composition work; it does not reopen delivered repairs.

## 1. Problem and desired outcome

The repository has durable lifecycle, GitHub synchronization, continuation,
review, and workspace-cleanup contracts, but those capabilities remain exposed
through multiple helpers and projections. Reliable autonomous delivery needs
one typed lifecycle composition that inspects current Git, GitHub, OpenSpec,
review, and owned-resource evidence before selecting a transition, then
reconciles partial effects on resume.

The desired outcome is an outer lifecycle graph whose adapters are idempotent,
exact-target, evidence-gated, and recoverable. It should preserve current
phase/action authorization, use the runtime kernel for selection and status,
and never infer completion or cleanup eligibility from chat memory, a branch
name, or one worktree's filesystem view.

## 2. Evidence and current state

The primary behavior owners are:

- [SDD lifecycle](../../openspec/specs/sdd-lifecycle/spec.md): planning/apply
  separation, phase evidence, bounded continuation, restart, review/rereview,
  and final resource reconciliation;
- [autonomous continuation](../../openspec/specs/autonomous-sdd-continuation/spec.md):
  target-explicit intake, schema-v4 controller context, first-incomplete-phase
  resume, resource registration, delivery binding, and cleanup receipts;
- [derived target authorization](../../openspec/specs/derived-sdd-target-authorization/spec.md):
  deterministic exact targets and checkpoint binding;
- [OpenSpec/GitHub lifecycle sync](../../openspec/specs/openspec-github-lifecycle-sync/spec.md)
  and [Project/PR status sync](../../openspec/specs/project-pr-status-sync/spec.md):
  configured, idempotent external reconciliation; and
- [workspace cleanup](../../openspec/specs/sdd-workspace-cleanup/spec.md):
  exact ownership, current delivery evidence, fresh inspection, idempotency,
  and least-destructive cleanup.

Delivered historical decisions include target-explicit continuation
([continuation](archived/autonomous-sdd-continuation-default.md)), post-Archive
cleanup ([cleanup](archived/sdd-post-archive-workspace-cleanup.md)), and the
schema-v4/common-Git-dir terminal cleanup repair
([terminal cleanup](archived/autonomy/sdd-controller-terminal-cleanup.md)).
Those are current foundations, not pending problem statements.

## 3. Lifecycle model

The outer path remains:

```text
intake/admission
  -> Propose -> planning review
  -> Apply -> Verify -> independent review when required
  -> implementation delivery
  -> Sync delivery
  -> Archive delivery
  -> issue/Project convergence
  -> exact-owned workspace cleanup
```

A generated standalone OpenSpec action retains its ordinary boundary. Only a
resolved, target-explicit `sdd-delivery` authorization plus a valid durable
controller context may continue through later phases without another routine
prompt. A concise request never supplies authority by implication; target,
mode, profile, review policy, expiry, mutation boundary, and stop conditions
must normalize before selection or mutation.

Every adapter exposes the same logical shape:

- `inspect(exactTarget)` obtains current, source-specific evidence;
- `apply(exactTarget, authorization, idempotencyKey)` performs only the named
  transition when both workflow authority and runtime permission allow it; and
- `reconcile(exactTarget, priorIntent)` determines whether an interrupted
  transition is incomplete, already complete, conflicting, or unsafe to
  resume.

Git, GitHub, Project, PR, OpenSpec, review, and cleanup evidence must retain
their own identifiers and freshness rules. A local snapshot is not allowed to
declare an external state current without inspection. Partial external state
is a recovery input, not an excuse to repeat the mutation or claim completion.

## 4. Ownership, cleanup, and pause behavior

Branches and worktrees are registered before creation/selection and bind role,
canonical path/name, head, repository, run, and ownership evidence. Each
implementation, Sync, and Archive delivery head records its PR/default-branch
evidence separately, including squash/rebase delivery where ancestry alone is
insufficient.

After Archive and configured issue/Project convergence, cleanup audits first.
It may mutate only clean, non-primary, unlocked, registered, exact-matching,
confirmed-delivered resources. Dirty, ambiguous, legacy, unregistered,
ownership-mismatched, missing-evidence, or changed-after-plan resources remain
intact with a durable classification. Cleanup resumes idempotently and records
started/terminal receipts before deleting a branch or worktree. It never
deletes remote branches, force-removes worktrees, or makes a dirty tree clean.

Outcome classification must distinguish objective retry/correction from a real
human pause. Material product/architecture/security/legal decisions, scope
expansion, destructive unexpected targets, unavailable credentials/runtime
permission, and conflicting durable evidence pause. Objective local failures
within the correction envelope do not become routine owner prompts.

The runtime kernel owns the aggregate status projection. Lifecycle adapters
contribute typed evidence and classifications; they must not create another
authoritative status record.

## 5. Scope, non-goals, constraints, dependencies, and risks

This brief owns the composition and recovery boundary among Git, GitHub,
OpenSpec, review, delivery, and cleanup. It does not own planning-brief
provenance (see [SDD design-brief provenance](sdd-design-brief-provenance.md)),
work-unit internals, milestone handoffs, or generic durable storage.

It does not weaken phase gates, infer external state, broaden credentials,
delete unowned/dirty resources, edit generated OpenSpec behavior manually, or
turn historical repair briefs into new pending work.

Key risks are vocabulary/schema drift, repeated external effects, stale review
or delivery evidence, worktree-local discovery, and destructive cleanup based
on inference. Use one typed operation/outcome registry, exact idempotency keys,
fresh adapter inspection, common-Git-dir run discovery, immutable bindings, and
fail-closed cleanup.

## 6. Open questions and remaining design work

- Define the single generated/validated operation vocabulary shared by the
  resolver, authorization checker, lifecycle graph, adapters, and tests.
- Decide how the successor runtime projects schema-v4 controller records
  without breaking valid in-flight runs.
- Define which current exact-head review may be reused across delivery, Sync,
  Archive, and cleanup; the review brief owns assurance inputs, while this
  graph owns invalidation points.
- Add composition evidence for interruption at every transition, partial
  GitHub state, linked-worktree discovery, exact prompt counts, and terminal
  cleanup—component tests alone are insufficient.

## 7. Recommended next step

Treat delivered continuation and cleanup behavior as the baseline. After the
runtime kernel contract is confirmed, compile the existing lifecycle onto its
typed operation/outcome registry and adapters, then prove restart and
reconciliation at each external boundary before adding milestone queues.
