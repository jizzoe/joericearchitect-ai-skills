# Autonomous SDD Delivery Continuation Default

Date: 2026-08-16
Status: Decision-ready and ready for OpenSpec Propose.

## 1. Problem And Desired Outcome

An explicitly bounded autonomous SDD delivery can currently enter the generated
OpenSpec Propose workflow and stop after planning, even when the user's
authorization intended a full production delivery through branch cleanup. The
same handoff ambiguity can occur at any lifecycle phase: a valid run needs to
resume from durable state rather than letting the named phase action become an
unintended terminal boundary. The result is an unsafe mismatch in control flow:
the right evidence gates exist, but the autonomous lifecycle context is not
reliably carried into every phase entry point.

Make a fully resolved autonomous `sdd-delivery` request, invoked at any
lifecycle step, identify the first incomplete evidenced checkpoint and continue
through planning review where applicable, Apply, Verify, delivery, Sync,
Archive, and exact change-owned cleanup. It must resume idempotently after
interruption and pause only when a real authorization, evidence,
runtime-permission, or material-decision gate fails. A bare phase action,
including OpenSpec Propose, remains scoped to its ordinary non-autonomous
boundary.

## 2. Evidence And Key Findings

- The generated [`openspec-propose` skill](../../.agents/skills/openspec-propose/SKILL.md)
  unconditionally treats its triggering request as planning-only and says to
  stop after artifacts. That is correct for a standalone proposal but loses the
  enclosing autonomous-run context.
- The canonical
  [`autonomous-sdd-lifecycle` workflow](../../workflows/autonomous-sdd-lifecycle/workflow.md)
  already says to stop after Propose *unless* a delivered bounded runner and
  active authorization permit Apply. It does not define a durable handoff that
  prevents a standalone phase instruction from winning at Propose or any later
  resume point.
- The living [`sdd-lifecycle` specification](../../openspec/specs/sdd-lifecycle/spec.md)
  permits one explicit bounded authorization to span the lifecycle, including
  a derived delivery chain through cleanup. Its current prose does not make the
  autonomous entry-point routing and context propagation observable enough to
  prevent this failure.
- The concise request resolver
  [`resolve-sdd-delivery-request.mjs`](../../scripts/sdd/resolve-sdd-delivery-request.mjs)
  already normalizes a named target, mode, quality profile, authorization
  profile, independent-review policy, expiration, ordinary lifecycle actions,
  and a three-attempt objective-correction budget. The original run had the
  profile values but did not preserve an effective authorization record for the
  selected proposal.
- The operation checker
  [`check-operation-authorization.mjs`](../../scripts/sdd/check-operation-authorization.mjs)
  admits high-impact delivery only from exact durable targets. That conservative
  rule must remain; new issue, branch, PR, Sync, Archive, and cleanup targets
  need to be deterministically derived and recorded before each transition,
  not assumed from a name.
- The existing [post-archive cleanup brief](sdd-post-archive-workspace-cleanup.md)
  establishes the right cleanup safety model: only clean, durably owned,
  confirmed-delivered resources are eligible; legacy or ambiguous resources
  are inventory-only.
- `design-brief-from-research` currently permits autonomous brief writes only
  under `local-implementation`, while delivery intake uses `sdd-delivery`.
  The profile gap is another example of workflow phase rules not recognizing a
  valid enclosing delivery authorization.

## 3. Options Considered And Tradeoffs

### A. Change standalone Propose to always continue

Rejected. It would erase the valuable planning/implementation boundary for
normal interactive and unbounded requests, and would make a single ambiguous
word (`propose`) capable of initiating external delivery.

### B. Ask again after every Propose

Rejected. It defeats the purpose of a valid bounded autonomous run and creates
the exact routine-prompt behavior the authorization was intended to remove.

### C. Route only a complete autonomous delivery request into a durable
canonical lifecycle controller

Selected. The controller normalizes and records the effective authorization
before it chooses work, creates or resumes a durable selected-entry checkpoint,
then resumes from the first incomplete evidenced phase. Generated OpenSpec
skills keep their standalone safety rule, but detect the validated active
context and return control to the controller rather than terminating the run.

### D. Use the current goal text as implicit authority

Rejected. Goal text is useful input but cannot replace the resolved target,
mutation boundary, expiry, exact derived targets, and evidence records required
for high-impact operations.

## 4. Explicit Decisions, Assumptions, And Owner Record

**Owner direction (recorded 2026-08-16T06:46:00Z):** a fully resolved bounded
autonomous `sdd-delivery` run may be invoked at any lifecycle step and resumes
from the first incomplete evidenced checkpoint through authorized completion
and exact cleanup; bare phase actions remain scoped. The shorthand trigger is
`ship-sdd`, with `prod` for 4h autonomous production-rapid strict-only
sdd-delivery and `prototype` for 4h autonomous prototype-rapid
strict-first-degraded sdd-delivery.

**Decision owner:** `joerice` (current repository owner).
**Decision-record SHA-256:**
`0c870a907796fd8a5d8095eabe50f3b2fa6b498cf15dea6efb6794e259140e1e`

**Selected design:**

1. Add one canonical autonomous-SDD entrypoint that accepts only a complete
   concise delivery request or an equivalent validated structured authorization.
   It resolves and reports the effective authorization before selection or
   mutation.
2. Persist a versioned, selected-entry run record before the first lifecycle
   action. It carries
   the authorization digest, selected change/queue entry, expiry, allowed
   lifecycle chain, completion boundary, checkpoint location, and current
   phase. It must never contain credentials or a standing approval grant.
3. Route every lifecycle phase started inside that active record through the
   canonical controller. The controller re-reads durable state, identifies the
   first incomplete or stale checkpoint, performs planning review when it is
   next, and advances only through the next authorized phase. Generated phase
   actions still stop at their ordinary boundary when no validated active record
   exists.
4. Derive issue, branch, PR, Sync, Archive, and cleanup records only as each is
   created, bind them to the selected entry, repository, base branch, current
   head, recovery behavior, and evidence, and reuse the existing exact-target
   checker for high-impact actions.
5. Complete only when the archive is merged, linked issue/Project state has
   converged where configured, and the post-archive finalizer has either
   removed every exact eligible change-owned resource or durably reported an
   ineligible/blocked resource. Do not call legacy, dirty, ambiguous, primary,
   or unowned resources cleanup candidates.
6. Permit autonomous design-brief writing as a narrowly scoped preparation
   operation within a valid `sdd-delivery` run only when its output path is
   explicitly authorized. Preserve the existing `local-implementation` case;
   do not make all delivery runs able to write arbitrary briefs.
7. Support a concise, target-explicit request form:

   ```text
   ship-sdd <change-or-[ordered-queue]> <profile>
   ```

   `prod` expands to `4h`, `autonomous`, `production-rapid`, `strict-only`,
   and `sdd-delivery`. `prototype` expands to `4h`, `autonomous`,
   `prototype-rapid`, `strict-first-degraded`, and `sdd-delivery`. An explicit
   duration remains available as an override, for example `ship-sdd
   <change> prod 8h`. The parser reports the complete expanded authorization
   before it selects or mutates anything.

**Assumptions:** the selected change/queue is explicit in every shorthand
request before mutation; GitHub and Project configuration remain product-owned;
strict-only review remains a hard pause if strict isolation is unavailable; and
the current user’s authorization does not authorize deployments, releases,
credentials, external messaging, or cleanup outside the durable selected-entry
record.

## 5. Scope, Non-Goals, Constraints, Dependencies, And Risks

**Scope**

- Extend `skills/base/autonomous-goal-runner/`,
  `workflows/autonomous-sdd-lifecycle/`, the request resolver, checkpoint
  schema/validator, and operation checker with an explicit controller-to-phase
  context contract.
- Update every canonical lifecycle-phase integration boundary so a validated
  active run returns to the controller instead of stopping at a phase-local
  completion boundary.
- Add the `ship-sdd` target-explicit shorthand, `prod` and `prototype` profile
  aliases, resolver output, invalid-alias handling, and duration override.
- Add the smallest compatible `sdd-delivery` authorization for a single
  explicit design-brief output and preserve the mandatory bounded path check.
- Implement the post-Archive owned-resource finalizer described in the existing
  cleanup brief, including deterministic dry-run, exact cleanup, and resume.
- Update relevant living specs, user documentation, thin Claude/Codex exposure,
  and portable deterministic fixtures.

**Non-Goals**

- No automatic continuation from normal interactive or standalone Propose.
- No relaxing planning review, strict-only independent review, tests, Verify,
  PR review, Sync, Archive, or exact-target authorization.
- No remote-branch deletion, force push, hard reset, credential change,
  deployment, release, or generic repository cleanup.
- No historical provenance backfill or inferred ownership for legacy branches
  or worktrees.

**Constraints and dependencies**

- The proposed change must compose with the earlier lifecycle-hygiene and
  design-brief-provenance proposal, which supplies the optional brief sidecar
  and reconciliation reports. It must not duplicate that contract.
- Existing generated OpenSpec workflows cannot be edited as canonical behavior;
  the controller/adapters must preserve their regeneration boundary.
- All reusable assets must stay product-neutral, and durable records must be
  portable and secret-free.

**Risks and mitigations**

- [Context is forged or stale] → validate its version, authorization digest,
  selected entry, expiry, current repository, and checkpoint on every phase
  transition; stale or conflicting records pause.
- [Continuation bypasses a gate] → model the first incomplete canonical phase
  explicitly; every transition still calls the existing authorization and
  evidence checks.
- [A phase tool silently stops again] → add end-to-end fixtures that begin at
  each lifecycle phase and assert either terminal lifecycle completion or a
  classified genuine pause, never an unclassified phase-local stop.
- [A shorthand obscures a risk-bearing target] → require an explicit change or
  ordered queue after `ship-sdd`; aliases may fill only fixed profile fields.
- [Cleanup destroys local work] → retain the existing cleanup brief’s durable
  ownership, clean-state, exact-delivery, and primary/locked-worktree guards.
- [`sdd-delivery` becomes a broad write grant] → admit only an explicitly
  authorized single brief path and fixed lifecycle operations; reject arbitrary
  workspace writes.

## 6. Open Questions And Blocking Decisions

No owner answer is needed to begin OpenSpec Propose. The selected behavior is
fully bounded: it applies only to a complete autonomous `sdd-delivery` request
and preserves all existing objective and human-pause gates. The request must
name its target, for example `ship-sdd complete-bounded-autonomous-sdd-delivery
prod`; the target is the one risk-bearing field an alias must not infer.

The proposal must resolve implementation details, not product policy:

- whether the selected-entry run record is stored beside the change, in the
  lifecycle evidence area, or in both as an immutable reference plus mutable
  checkpoint; and
- the exact compatibility mechanism by which generated phase skills discover a
  validated controller context without modifying generated content manually.

Either choice is acceptable only if the resulting record remains durable,
portable, idempotent, and compatible with OpenSpec regeneration.

## 7. Recommended Next Step

Run OpenSpec Propose for `complete-bounded-autonomous-sdd-delivery`. The
proposal should use this brief and the linked cleanup brief as design inputs,
create or reuse the primary GitHub issue through the configured lifecycle, and
define requirements for target-explicit shorthand expansion, intake/context
propagation, resumption from every lifecycle phase, exact derived targets,
post-Archive cleanup, sdd-delivery brief writing, recovery, and end-to-end
evaluation. It is ready to propose; no additional answer is required.
