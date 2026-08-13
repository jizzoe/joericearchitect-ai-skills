# Autonomous SDD Lifecycle

This workflow composes the existing OpenSpec SDD actions with the bounded
autonomous execution controls from `skills/base/autonomous-goal-runner/`.

Use it only after a user provides explicit bounded authorization covering the
selected change or deterministic selection policy, allowed lifecycle
transitions, local and external mutation boundaries, evidence gates, and
stopping conditions.

For the concise named-delivery form, first apply
`skills/base/autonomous-goal-runner/references/sdd-delivery-request.md`. Resolve
the target, mode, quality profile, authorization profile, independent-review
policy, and expiration before step 1. If any are missing, invalid, or
conflicting, ask once for every affected value with a short meaning and the
published choices, and perform no selection or mutation.

## Lifecycle

1. Inspect durable state: Git, OpenSpec active changes, tasks, issues,
   Projects, pull requests, living specs, archive paths, and current evidence.
2. Select one change through the authorized queue or dependency-aware policy.
3. Run OpenSpec Explore or Propose only when required by the selected state.
4. Stop after Propose unless the delivered bounded runner and active
   authorization permit Apply.
5. Before Apply, run planning review for scope, non-goals, issue linkage,
   requirements, scenarios, design decisions, dependencies, security,
   recovery, attribution, portability, stable task IDs, task dependencies, and
   evidence requirements.
6. Apply tasks in dependency-valid batches. After each batch, run tests,
   OpenSpec validation where applicable, documentation review, security and
   supply-chain review, requirements mapping, portability review, attribution
   review, and recovery review.
7. After current Apply evidence and every behavior-preserving objective fix,
   invoke `skills/base/independent-review/` for `production-rapid`. Preserve
   its sealed v1 package, normalized result, and dispositions in the exact
   durable transition record. A new head invalidates prior review and requires
   affected checks plus a fresh reviewer; unavailable or material outcomes
   pause the lifecycle. Strict OS-isolated review is attempted first. A reduced-
   assurance reviewer is eligible only under an explicit exact active
   degraded-review authorization after durable strict unavailability; its
   evidence remains labelled `authorized-degraded` with the strict precursor
   and capability ledger and is never described as strict isolation. If the
   outer sandbox denies detached-view setup or nested reviewer startup, use the
   fixed external-host review launcher only when the exact run authorization,
   launcher configuration, and runtime permission permit it. The in-sandbox
   controller may only prepare and accept a digest-bound request; retain the
   trusted runtime's outside-sandbox execution evidence and the inner ephemeral
   read-only boundary.
8. Run formal Verify after every task has current evidence.
9. Deliver through a pull request only when the delivery gate passes and the
   active authorization permits the mutation.
10. Sync living specs only after implementation delivery is merged and delta
   operations are proven reflected.
11. Archive only after implementation and Sync are delivered and the archive
    move is content-preserving.

## Required References

- `references/openspec-actions.md`
- `references/delivery.md`
- `references/recovery.md`
- `../../skills/base/autonomous-goal-runner/references/authorization-policy.md`
- `../../skills/base/autonomous-goal-runner/references/human-decision-classification.md`
- `../../skills/base/autonomous-goal-runner/references/correction-loop.md`
- `../../skills/base/autonomous-goal-runner/references/review-matrix.md`

## Completion Rule

Do not claim lifecycle completion from chat history or attempted commands.
Completion requires current durable evidence for the selected transition and
all prior required gates.
