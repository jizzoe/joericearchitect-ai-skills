# Owner-Gated SDD Slice Entry

Date: 2026-08-17

Status: Propose-ready design brief. It records a user-directed interaction
contract and a narrow integration fix. OpenSpec proposal remains the next
step; this brief is not itself an Apply, delivery, or external-mutation
approval.

Portfolio role: this brief implements the entry and routing gap between the
existing [SDD milestone/slice delivery cadence](sdd-milestone-slice-delivery-skill.md)
and the lower-level autonomous SDD lifecycle. It does not replace either the
milestone/slice cadence or the autonomous runtime kernel.

## 1. Problem and desired outcome

The current `autonomous-sdd-delivery` entrypoint interprets a resolved
`autonomous` `sdd-delivery` request as permission to continue through the
selected change's lifecycle without routine owner prompts. That is correct for
an explicitly continuous autonomous run, but it is not the interaction a
repository owner expects when asking to start the next slice of a roadmap.

In particular, a direct invocation can select and persist a controller before
the owner has seen a plain-language summary of the slice. It also has no
required owner-facing checkpoint between Propose and Apply, or between Verify
and close-out. The result is an avoidable mismatch: the runtime is safe and
evidence-gated, but the person directing the work is not given the two moments
needed to review intent and the exact delivery effects.

The desired outcome is a clear, default **owner-gated slice cadence**:

1. identify and briefly explain the selected slice and its planned outcome;
2. create and review its OpenSpec plan, then pause for explicit approval before
   implementation begins;
3. Apply and Verify continuously once that implementation approval is granted;
   and
4. present a precise close-out summary and pause for explicit approval before
   Sync, Archive, merge, issue/Project convergence, or change-owned cleanup.

The existing explicit `ship-sdd <target> prod|prototype [duration]` path
remains available for a truly continuous bounded autonomous delivery. It must
say plainly that it skips the two owner gates before accepting that scope.

## 2. Evidence and key findings

- The lower-level [autonomous SDD lifecycle](../../skills/base/autonomous-sdd-lifecycle/SKILL.md)
  resolves authorization, selects work, persists a controller, and then runs
  the first incomplete evidenced phase. With valid controller context it
  returns from generated OpenSpec actions to later authorized checkpoints; it
  has no owner-summary or confirmation requirement.
- The [concise delivery request](../../skills/base/autonomous-goal-runner/references/sdd-delivery-request.md)
  defines `autonomous` as a complete bounded delivery and permits planning,
  implementation, pull-request delivery, merge, Sync, Archive, and
  change-owned cleanup for the selected work. This is deliberately not a
  checkpointed collaboration mode.
- The canonical [SDD milestone/slice delivery cadence](sdd-milestone-slice-delivery-skill.md)
  already defines the needed model: slice briefing, a plan gate after Propose
  and before Apply, and an implementation/close-out gate after Verify and
  before Sync. It also states that the two gates are preserved in
  checkpointed work and that a slice-autonomous grant intentionally skips
  them.
- The current entrypoint selection does not bind a natural-language request
  such as “implement the next slice” to that cadence. It can therefore invoke
  the lower-level autonomous delivery path directly, even when the owner has
  not chosen continuous execution.
- Existing runtime safety controls still matter: all selection must derive
  from durable roadmap/OpenSpec evidence; generated OpenSpec actions own their
  artifacts; exact-target authorization, fresh evidence, recovery, and
  independent review remain separate from conversational confirmation.

## 3. Options considered and tradeoffs

1. **Leave routing to agent judgment.** This preserves the current code but
   repeats the ambiguity that caused the gap: “autonomous” can be interpreted
   as either background execution or owner-gated execution between reviews.
2. **Make every `autonomous-sdd-delivery` run pause at owner gates.** This
   would make the desired cadence automatic, but would break the established
   meaning of an explicit, bounded continuous `ship-sdd` delivery.
3. **Require ordinary generated OpenSpec actions for all slice work.** This
   restores their separate boundaries but discards the durable controller,
   recovery, and bounded-run composition that continuous delivery needs.
4. **Add an owner-gated slice-entry router and compose the existing milestone
   cadence around the existing lifecycle.** This preserves both modes: the
   default roadmap-facing entrypoint is checkpointed, while an exact,
   unmistakable autonomous command remains continuous. This is the selected
   approach.

## 4. Selected design

### Entry modes and unambiguous routing

Introduce an assistant-neutral `owner-gated-sdd-slice-entry` capability (or a
small, explicitly named extension of `sdd-milestone-slice-delivery`) as the
required conversational entrypoint for requests to start, implement, or
continue a roadmap slice.

It resolves the milestone/slice source, current archived and in-flight
OpenSpec state, target repository, delivery profile, and the next eligible
slice from durable evidence. A request that says “next slice” never silently
becomes a `ship-sdd` request. If the source cannot choose one candidate
deterministically, the entrypoint presents the ambiguity and stops without
creating a controller, OpenSpec change, branch, worktree, issue, Project item,
or pull request.

The only path that bypasses the owner gates is an exact continuous-delivery
request: a target-explicit `ship-sdd <change-or-ordered-queue> prod|prototype
[duration]`, or equivalent fully resolved structured authorization that
expressly declares `slice-autonomous` or `milestone-autonomous`. Before
admission it displays the selected target, expiry, profile, mutation scope,
and the statement that Plan and Close-out approval gates will not pause the
run. This notice is confirmation of the requested mode, not a weaker
replacement for the required exact authorization.

### Owner-gated lifecycle cadence

The default cadence has exactly two approval gates. Its read-only slice
briefing is narration, not a third gate.

```text
read-only selection and slice briefing
  -> Propose and planning review
  -> Gate 1: plan / implementation approval
  -> Apply -> Verify -> required review and evidence
  -> Gate 2: close-out approval
  -> Sync -> Archive -> merge -> issue/Project convergence -> owned cleanup
  -> slice-exit summary and next-slice choice
```

**Slice briefing.** Before Propose, show the selected milestone and slice,
outcome, scope, non-goals, dependencies, repository boundary, delivery
profile, known risks, expected evidence, and whether the selection is new or
resumed. State that the next action is planning, not implementation. This
briefing is read-only and does not authorize or create a lifecycle resource.

**Gate 1 — implementation approval.** After Propose and the planning review,
show a concise, source-linked summary of the observable requirements,
scenarios, design decisions, ordered tasks, intended file/path scope,
tests/evals, safety boundaries, known assumptions, and any unresolved gap.
Pause until the owner explicitly approves Apply for the exact change and
current proposal digest. Approval authorizes Apply and Verify for that change
only; it does not authorize external delivery or a different proposal revision.
A changed proposal, delta specification, design, task list, target repository,
or expiry invalidates this approval and reissues the Gate 1 summary.

**Gate 2 — close-out approval.** After all tasks have current evidence and
formal Verify passes, show the exact changes about to occur: current
base/head, reviewed path/diff summary, test and validation results, review
findings and dispositions, residual limitations, the proposed pull request
and merge target when applicable, Sync delta-to-living-spec effects, Archive
move, issue/Project state changes, and every registered change-owned branch or
worktree eligible for cleanup. Pause until the owner explicitly approves this
exact close-out package. Approval authorizes only the listed, current,
idempotent close-out operations; a changed head, failed/re-run evidence,
changed target, changed archive content, or changed cleanup eligibility
invalidates the approval and reissues the Gate 2 summary.

The gate record must be durable, workspace/repository-relative, versioned, and
bound to the selected change, lifecycle phase, source/proposal or close-out
package digest, current head where applicable, expiry, and allowed operation
set. It must never persist credentials, free-form conversational transcripts,
standing approval, or authority for another slice. On resume, the router reads
the durable record and either continues the approved current phase or presents
the corresponding summary again; it never assumes a prior chat confirmation.

### Composition boundaries

`sdd-milestone-slice-delivery` remains the owner of user-facing cadence,
milestone/slice narration, gate placement, and post-slice progression.
`autonomous-sdd-delivery` and `autonomous-sdd-lifecycle` remain the owners of
resolved continuous-run admission, first-incomplete-phase execution,
controller/resource evidence, recovery, delivery binding, and cleanup
finalization. OpenSpec remains the owner of proposal, delta specs, design, and
tasks; generated files are not manually edited.

The new entry capability must call—not duplicate—the lower-level lifecycle,
OpenSpec actions, `base-verification-loop`, and `independent-review`. The
selected delivery profile affects evidence requirements, not the presence of
the two owner gates in checkpointed mode.

## 5. Scope, non-goals, constraints, dependencies, and risks

In scope:

- deterministic routing between roadmap-facing checkpointed entry and exact
  continuous `ship-sdd` delivery;
- read-only slice briefing and two digest-bound, durable owner gates;
- summary schemas, invalidation, resume behavior, and deterministic fixtures;
- composition with the existing milestone/slice cadence, OpenSpec lifecycle,
  controller, verification, independent-review, GitHub delivery, Sync,
  Archive, and cleanup evidence; and
- assistant-neutral Claude/Codex parity.

Out of scope:

- redefining continuous `ship-sdd` semantics;
- creating a second controller, review system, OpenSpec artifact generator, or
  GitHub lifecycle implementation;
- broadening credentials, deployment, release, external messaging, candidate
  actions, or unrelated repository authority;
- automatic approval, inferred consent, or a third close-out prompt; and
- changing cross-repository collaboration, handoff, or component-boundary
  rules already owned by `sdd-milestone-slice-delivery`.

Dependencies include the canonical milestone/slice cadence brief, the
autonomous runtime/lifecycle contracts, durable controller storage, the
OpenSpec generated actions, and the existing exact-target authorization and
review gates. The implementation must preserve active in-flight runs: legacy
controller records remain resumable through their established continuous
semantics unless an owner explicitly starts a new owner-gated run. It must not
reinterpret or retroactively constrain a valid previously admitted continuous
authorization.

The chief risks are prompt-like text being mistaken for approval, stale
approvals surviving a changed plan/head, duplicate lifecycle resources on
resume, routing a continuous request to checkpointed mode or vice versa, and
summary output accidentally becoming unbounded private data. Mitigate with a
closed approval-record schema; explicit command grammar; digest, target, and
expiry binding; fresh durable-state inspection; idempotent controller
transitions; strict workspace-relative path validation; and synthetic fixtures
only.

## 6. Open questions and blocking decisions

No product-direction decision remains: the owner-gated interaction contract
and the preservation of explicit continuous `ship-sdd` delivery are selected
by this brief.

Proposal work must resolve these implementation details without changing the
selected behavior:

- whether gate records extend the successor runtime record or use a narrowly
  scoped, versioned companion record in the Git common directory;
- the exact normalized approval command/response grammar for Claude and Codex;
- how the entrypoint discovers a milestone/slice plan in repositories that
  have only an ordered roadmap and no dedicated milestone manifest; and
- the smallest supported summary schema that remains readable while proving
  all approval-relevant targets and invalidation inputs.

If any answer would alter gate count, continuous-delivery compatibility,
authority boundaries, or durable approval binding, return to the owner before
implementation.

## 7. Recommended next step

Create one focused OpenSpec change, `owner-gated-sdd-slice-entry`, sourced
from this brief and the canonical milestone/slice cadence. Its proposal should
define the observable routing, summary, approval-record, invalidation, resume,
and parity behavior; its deterministic tests should cover:

1. a roadmap “next slice” request yields a read-only briefing and cannot create
   lifecycle state before a deterministic selection is established;
2. a checkpointed change pauses after Propose until Gate 1 approves the exact
   planned change, then reaches Verify without a routine pause;
3. a changed proposal or task/design/spec artifact invalidates Gate 1;
4. a passing Verify yields the Gate 2 close-out summary and cannot Sync,
   Archive, merge, change issue/Project state, or clean a resource before Gate
   2 approval;
5. any changed head, evidence, target, archive move, or cleanup eligibility
   invalidates Gate 2;
6. a fresh session resumes from durable records without duplicating a
   controller, branch, PR, Sync, Archive, or cleanup effect;
7. an exact continuous `ship-sdd` request displays its no-pause scope and
   retains current continuous semantics; and
8. Claude and Codex expose equivalent summaries, pause points, acceptance
   rules, and durable effects using synthetic repositories and fixtures.
