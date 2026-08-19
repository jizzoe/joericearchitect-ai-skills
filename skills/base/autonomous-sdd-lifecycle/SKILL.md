---
name: autonomous-sdd-lifecycle
description: Orchestrate one explicitly authorized autonomous OpenSpec SDD delivery through evidenced lifecycle checkpoints. Use only with a resolved delivery request and durable controller context; do not use for standalone phase actions or unbounded work.
---

# Autonomous SDD Lifecycle

This skill composes the existing OpenSpec SDD actions with the bounded
autonomous execution controls from `skills/base/autonomous-goal-runner/`.

Use it only after a user provides explicit bounded authorization covering the
selected change or deterministic selection policy, allowed lifecycle
transitions, local and external mutation boundaries, evidence gates, and
stopping conditions.

For the concise named-delivery form, first apply
`../autonomous-goal-runner/references/sdd-delivery-request.md`. Resolve the
target, mode, quality profile, authorization profile, review policy, and
expiration before step 1. If any are missing, invalid, or
conflicting, ask once for every affected value with a short meaning and the
published choices, and perform no selection or mutation.

## Lifecycle

1. Inspect durable state: Git, OpenSpec active changes, tasks, issues,
   Projects, pull requests, living specs, archive paths, and current evidence.
2. Select one change through the authorized queue or dependency-aware policy.
3. Create or resume the versioned selected-entry controller record before a
   lifecycle action. Persist it in the repository's Git common-directory state
   root, not in a removable worktree. It binds normalized authorization,
   selected entry, repository, expiry, immutable unique run ID, derived
   run-specific checkpoint reference, and current phase; never overwrite a
   checkpoint whose stored run identity differs. Use
   `registerControllerLifecycleResource` to register each resource before
   selection or creation, and persist its returned controller record. It
   contains no credentials or standing approval. Before selecting or creating
   each non-primary implementation, Sync, or Archive worktree or branch,
   durably register its exact identity, role, head, ownership token, and
   recovery reference.
   For autonomous prototype intake, persist the exact reviewed issue binding
   with `persistControllerIssueIntake` before publication and bind the returned
   issue evidence with `persistControllerIssueIntakeEvidence`. If the payload,
   selected entry, repository, digest, or expiry conflicts on resume, pause
   before mutation. A current exact binding plus host runtime permission removes
   the second skill-level publication prompt; it does not override the host.
   Before every GitHub CLI lifecycle operation, create or reuse an exact,
   non-secret authentication-context binding for its selected entry, operation,
   repository, optional payload digest, command kind, and expiry. Persist the
   binding through `persistControllerAuthContext` before a host contrast retry,
   and persist the terminal normalized result through
   `persistControllerAuthContextEvidence`. Run the declared
   `github-cli-auth-context` helper's fixed read-only probe in the current
   context. A restricted authentication-shaped result may request the existing
   host permission only for that same probe; host success classifies restricted
   credential unavailability, host authentication failure classifies invalid or
   expired credentials, and a denied retry classifies host-permission denial.
   Do not retain raw CLI output or credential data, substitute a different host
   command, self-escalate, or treat successful host preflight as authorization
   for a GitHub mutation. Unknown, stale, expired, or mismatched evidence
   pauses the affected operation.
4. Run OpenSpec Explore or Propose only when required by the first incomplete
   evidenced controller checkpoint. Generated phases retain their ordinary
   boundary without a valid controller context; a valid context returns control
   to this skill for the next authorized checkpoint.
5. Before Apply, run planning review for scope, non-goals, issue linkage,
   requirements, scenarios, design decisions, dependencies, security,
   recovery, attribution, portability, stable task IDs, task dependencies, and
   evidence requirements.
6. Apply tasks in dependency-valid batches. After each batch, run tests,
   OpenSpec validation where applicable, documentation review, security and
   supply-chain review, requirements mapping, portability review, attribution
   review, and recovery review.
   Under exact `autonomous` plus `prototype-rapid`, planning review may flow
   directly into Apply and verified evidence may flow toward closure without a
   routine Plan-to-Apply or Verified-to-Close prompt. These are continuation
   rules inside the active grant, not omitted quality gates.
7. After current Apply evidence and every behavior-preserving objective fix,
   invoke `../independent-review/` for `production-rapid`. Preserve its sealed
   v1 package, normalized result, and dispositions in the exact durable
   transition record. A new head invalidates prior review and requires affected
   checks plus a fresh reviewer; unavailable or material outcomes pause the
   lifecycle. Strict OS-isolated review is attempted first. A reduced-assurance
   reviewer is eligible only under an explicit exact active degraded-review
   authorization after durable strict unavailability; its evidence remains
   labelled `authorized-degraded` with the strict precursor and capability
   ledger and is never described as strict isolation. If the outer sandbox
   denies detached-view setup or nested reviewer startup, use the configured
   Codex or Claude external-host review launcher only when the exact run
   authorization, launcher configuration, and runtime permission permit it.
   The in-sandbox controller may only prepare and accept a digest-bound request.
   The production orchestrator must consume that request through its configured
   parent-runtime transport in the same bounded run, capture the response
   directly, and return terminal unavailable evidence on denial or failure; it
   never delegates execution, approval, payload relay, evidence attestation, or
   a changed-head retrigger to the owner. Retain the runtime's outside-sandbox
   execution receipt and the inner Codex read-only or Claude read/search-only
   boundary. Treat the degraded launch evidence and executable identity as
   best-effort rather than security-verifiable.
   For `prototype-rapid` with `reviewPolicy: same-session-local`, use the
   bounded `base-code-review` worker instead. Preserve `assurance:
   local-review`, route an `objective-fix` back to the implementing controller,
   rerun affected checks, and request a fresh local review without owner
   retrigger. Stop on a material decision, unavailable authority, permission
   denial, unsafe action, expiry, exhausted signature, stale conflict, or
   unrepairable external failure. Never pass local-review evidence to the
   production independent-review gate.
8. Run formal Verify after every task has current evidence.
9. Deliver through a pull request only when the delivery gate passes and the
   active authorization permits the mutation. Bind that resource's exact topic
   head, merged pull request, and delivered default-branch head with
   `bindControllerLifecycleDelivery`, then carry its persisted returned record
   before moving to a later checkpoint.
10. Sync living specs only after implementation delivery is merged and delta
    operations are proven reflected. Register Sync resources before creation
    and bind their delivery evidence independently of implementation delivery.
11. Archive only after implementation and Sync are delivered and the archive
    move is content-preserving. Register Archive resources before creation and
    bind their delivery evidence independently of earlier checkpoints.
12. Run exact owned-resource finalization only after Archive, issue, Project,
    default-branch, and delivery evidence are current. Evaluate each registered
    resource against its own evidence through
    `executeControllerLifecycleCleanup`, which persists every started,
    terminal, or already-completed receipt outside target worktrees and returns
    the updated controller record before removal. Supply a fresh inspection for
    each resource's mutable eligibility state; if any resource remains
    ineligible, pause rather than treating an empty action list as complete.
    Record ineligible resources with their recovery state. Never infer or
    backfill ownership; a stranded legacy resource requires a separately
    owner-authorized migration before audit. The migration must verify an exact
    signed owner record against the configured trusted owner key; a
    caller-computed digest is not sufficient.

## Required References

- [OpenSpec actions](references/openspec-actions.md)
- [Delivery](references/delivery.md)
- [Recovery](references/recovery.md)
- [External mutations](references/external-mutations.md)
- `../autonomous-goal-runner/references/authorization-policy.md`
- `../autonomous-goal-runner/references/human-decision-classification.md`
- `../autonomous-goal-runner/references/correction-loop.md`
- `../autonomous-goal-runner/references/review-matrix.md`

## Shared Runtime

Invoke the authentication-context helper through the installed runtime, never
by importing a workspace script:

```
ai-skills-runtime run github-cli-auth-context --repository <absolute-target-repository> -- <helper args>
```

Required runtime contract version: 1. The launcher validates the declared
helper and target shape; it does not grant operation authority or host
permission.

## Result Contract

Return one schema-valid `skill-result-v1` result for the attempted checkpoint.
Set `skill` to `autonomous-sdd-lifecycle`; use `completed`, `paused`, `blocked`,
or `no-op` only as supported by current durable evidence. Include portable
artifact and evidence references, assumptions, blocking open questions, and
the next action. Do not report lifecycle completion from chat history, an
attempted command, or one completed phase.

## Completion Rule

Completion requires current durable evidence for the selected transition and
all prior required gates. For an autonomous prototype, evaluate every required
quality action and terminal evidence predicate against one final target,
package digest, workspace, and head. An attempted command, stale earlier head,
skipped required action, unresolved objective finding, or unreconciled issue,
Project, Archive, cleanup, or residual state prevents completion.

## Guardrails

See [Shared guardrails](../_shared/guardrails.md).
