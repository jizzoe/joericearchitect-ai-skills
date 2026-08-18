# SDD Milestone/Slice Delivery Cadence Skill

Date: 2026-08-15 (revised 2026-08-15 to add cross-repository slices)
Status: Implementation-ready design brief draft. Create an OpenSpec proposal only after the owner accepts this scope. This brief is expected to change as the workflow is tuned in practice; edit it in place rather than forking a new file.

Portfolio role: this is the canonical milestone and cross-repository
coordination brief in the [design-brief portfolio](README.md). It consumes the
[single-repository runtime](autonomous-sdd-runtime-kernel.md) and lifecycle
evidence; it does not define a second runner or broaden repository authority.

## Decision

Create `sdd-milestone-slice-delivery`, a reusable, assistant-neutral skill that runs OpenSpec/SDD work one slice at a time inside a milestone-based delivery plan, with a fixed conversational cadence: milestone briefing, slice briefing, confirmed lifecycle execution, slice summary, next-step approval, milestone summary. It resolves an explicit collaboration profile before a cross-repository slice begins. It also answers on-demand, read-only status queries about the plan (current milestone, last slice/milestone worked on, plan-wide progress, an arbitrary milestone's summary or slice list) at any time, without requiring the cadence's approval gates — see Status Queries below.

The skill is a conversational orchestration layer. It does not reimplement:

- OpenSpec lifecycle actions (Explore/Propose/Apply/Verify/Sync/Archive) — owned by the target repository's generated `openspec-*` / `opsx:*` integrations;
- implementation or verification of a slice — owned by `base-verification-loop`;
- the production-rapid independent review gate — owned by `independent-review`;
- GitHub-Issue/Project-driven work selection — owned by `dependency-aware-work-selection`;
- GitHub issue, pull-request, and Project record management, used only if the issue-linked handoff transport is separately authorized — owned by `github-issue-authoring`, `github-issue-to-openspec`, `github-pr-linkage`, and `openspec-github-sync`; or
- bounded autonomous-run authorization mechanics — owned by `autonomous-goal-runner`.

`sdd-milestone-slice-delivery` calls these skills at the right moments and adds the milestone/slice-level narration, pacing, and approval gates around them. It assumes the global skill set and its guardrails already define what an authorized bounded autonomous run requires (exact target, mutation boundary, deterministic selection, validation evidence, stopping condition); this skill does not redefine that contract, it binds to it.

The skill runs in one of two **roles**, determined by the repository it is invoked in:

- **central-coordinator** — delivering slices in a planning/specification repository that owns product contracts and cross-component requirements but no implementation code;
- **component-implementer** — delivering one already-approved slice inside a component repository that owns code.

A single-repository slice uses one role and is otherwise unaffected by everything below. A cross-repository slice is delivered by both roles, in separate sessions, by potentially different people and different agents that never share conversational state. Every fact one role needs from the other must therefore travel in a durable written handoff record — never in session memory, and never by one agent reaching into another repository.

Because no tooling standard exists for that record, this brief also decides one: a **linkage ledger** at `openspec/changes/<change-id>/linkage.md` in the central change package, with a normative set of sections and a closed status vocabulary. It is an invention, adopted deliberately rather than left to improvisation, and the reasoning and rejected alternatives are recorded under Handoff record below.

Derived from a pattern run manually in `home-roots-reinvest-in-growth` (Home Roots Foundation's Invest in Growth / Enterprise Growth App), where V1 delivery is organized as `ai-planning/design-briefs/V1 Scope Map and Milestone Plan.md` plus one design brief per milestone, and OpenSpec changes are archived one slice at a time under `openspec/changes/archive/`.

## Definitions

These are the concrete definitions established in `home-roots-reinvest-in-growth`. The skill treats them as the portable, repository-agnostic vocabulary for this delivery pattern.

### Milestone

A named phase of a larger initiative-level plan (for example, `M0: SDD and Product Foundation`, `M5: Business Journal Core Transactions`) that groups related slices under one goal. A milestone record, held in a durable planning artifact that precedes and outranks any individual OpenSpec change, states:

- goal — the one-sentence purpose of the milestone;
- outcome — the observable state of the product/system once the milestone is done;
- candidate slices — an ordered list of slice names expected to satisfy the milestone (the list may be revised as slices are proposed, but the order is the default execution sequence);
- dependencies — which prior milestones (or specific accepted specs) must be done first;
- acceptance criteria — the conditions that close the milestone, independent of any one slice;
- blocking questions — open decisions that must be resolved before slices in the milestone can be proposed, distinct from ordinary per-slice open questions.

A milestone is done when every candidate slice it still requires is archived and its acceptance criteria hold; candidate slices can be added, split, or dropped as scope is learned, but that revision is itself a visible, called-out change to the milestone record, not a silent drift.

### Slice

The smallest independently reviewable unit of change that delivers one observable outcome inside a milestone, carried through Explore (optional), Propose, Apply, Verify, Sync, and Archive.

In a **single-repository slice** this is exactly one OpenSpec/SDD change package. In a **cross-repository slice** it is one central change package plus one component change package per participating component repository — all delivering the same outcome and closing as one slice (see Central and component changes below).

Each slice is specified with a fixed shape:

- Outcome (one or two sentences);
- Responsible repositories (the central repository, plus each component repository expected to implement part of the slice — or an explicit declaration that the slice has none);
- End-to-end verification owner (cross-repository slices only — who executes the assembled vertical-slice run, in what environment, and where its evidence is recorded; see End-to-end verification below);
- User value (who benefits — end user, staff, or platform foundation);
- Scope (exactly what is included);
- Non-goals (what is intentionally excluded, often deferred to a later slice or milestone);
- Requirements (observable behavior);
- Scenarios (concrete Given/When/Then acceptance examples);
- Data impact (entities, fields, migrations, audit implications, if applicable);
- API impact (endpoints/contracts/events, if applicable);
- UX impact (screens/states/copy principles, if applicable);
- Offline/sync impact (local persistence, queueing, retry, idempotency, conflict behavior, if applicable);
- Security/privacy impact (access control, sensitive data, logging boundaries);
- Verification (unit, integration, end-to-end, offline, manual checks as appropriate).

A slice must be small enough to Propose, Apply, Verify, Sync, and Archive on its own without leaving the repository in a broken or half-migrated state, and without requiring simultaneous, entangled changes to a different milestone's scope. A slice that grows past that boundary should be split rather than expanded. For a cross-repository slice, that test applies to every participating repository independently: each component's share must stand alone in its own repository, and the slice as a whole must be provable end to end.

### Central and component changes

A cross-repository slice is an **envelope**. The central change opens first and closes last; component changes open and archive inside it. The central change cannot archive before its components, because central verification's job is to aggregate their evidence, and there is nothing to aggregate until they have produced it.

| | Central change | Component change |
| --- | --- | --- |
| Owns | Product contract, cross-component requirements, system acceptance scenarios, residual cross-repository risk | Implementation code, local ordered tasks, tests, builds, migrations, deployment, local validation evidence |
| Never contains | File-level implementation tasks for another repository | Product-wide behavior decisions not traceable to the central contract |
| Verify produces | Aggregated cross-repository system acceptance | Local validation evidence for that repository only |
| Count per slice | Exactly one | Exactly one per participating component repository |

**A component change is one delta.** Its tasks are iterative implementation steps inside that single change package — not separate change packages. A component repository therefore reports exactly one change identifier back to the central change, however many tasks it took to get there.

The component-implementer role runs the same container-and-ordered-units cadence the central role runs, shifted down one level: where the central role has *milestone → slices*, the component role has *slice → tasks*. The received slice is the container; the ordered tasks inside the single component change are the units.

Task-level pacing is **narration, not gating**. Inside Apply, the component role either works through all tasks continuously (task-autonomous) or emits a per-task summary and pauses between tasks (task-checkpointed) so the developer can redirect. Those pauses authorize nothing new and are not approval gates: a component change still has exactly two approval gates, in the same two positions as any other change.

### Handoff record

Central and component work are linked by durable manual links. The handoff record is the written payload carrying them. It is **transport-agnostic**: the payload is fixed, the delivery mechanism is not.

No official mechanism exists to replace this. OpenSpec Stores (beta) provide a standalone planning repository that code repositories can reference read-only, and OpenSpec's own guidance for spanning repositories is to link store and component branches in their pull-request descriptions — a convention, not a structure. There is no cross-change linkage record, no evidence-return mechanism, and the same gap is open in comparable tooling.

Adopting a Store later would replace the **outbound** half of this design only, and only partly: references index accepted specs, while an in-flight contract lives in the change's delta until central Sync, which happens after components are done. The **return** half — component evidence flowing back for aggregation — remains this skill's responsibility regardless. A future Store adoption should be scoped accordingly, not as a wholesale replacement for linkage.

- **Manual transport (default today):** the record is emitted as text, and a human passes it to whoever owns the component repository.
- **Pull-request-linked transport:** the payload is carried in the central and component pull-request descriptions, so a reviewer can see which contract revision each implementation followed. This is the practice OpenSpec's own Stores guidance recommends today, and it requires no capability beyond the pull requests the flow already produces.
- **Issue-linked transport (once separately authorized):** the same payload is carried by linked GitHub issues via `github-issue-authoring`, `github-issue-to-openspec`, and `openspec-github-sync`. This transport requires an approved change enabling GitHub integration in the participating repositories; the skill must not assume it.

Whichever transport carries the payload, it is also written to the linkage ledger below. A transport moves a record between people; the ledger is what makes it survive.

**Outbound record — central to component.** Emitted at Gate 1 approval, and addressed to one named component repository:

- central repository URL or path;
- central branch;
- central commit or revision, pinned;
- central change identifier;
- central delta path(s) covering the requirements this component owns;
- the slice outcome, the specific requirements and scenarios this component owns, and the non-goals;
- the delivery profile to apply.

The pin must be **pushed, not merely committed locally**. A component repository is a different clone; a local-only commit is not a citable revision. Emitting the outbound record therefore requires committing the central change package to its branch and pushing it — a consequence authorized by Gate 1 approval itself, not a separate prompt.

Note which path is being pinned: during delivery the approved behavior lives in the central change's delta (`openspec/changes/<change-id>/specs/…`), because it only reaches `openspec/specs/` at central Sync, which happens after components are done. The durable post-archive reference is a different path, and the record should say which stage it reflects.

**Return record — component to central.** Emitted at component close-out:

- component repository URL;
- component branch and the commit at archive;
- component change identifier;
- validation command results and evidence artifact references;
- the central pin it was built against;
- any divergence from the contract, or an explicit statement of none.

The component completes the link: it records all seven linkage fields on its side, including its own change identifier, which did not exist when the outbound record was written.

**Where records live.** Handoff records are not conversational artifacts. Both directions are written into a **linkage ledger** at `openspec/changes/<change-id>/linkage.md` inside the central change package, committed and pushed as they are produced:

- each outbound record, when it is emitted at Gate 1;
- each return record, when it arrives, appended by the central role;
- the end-to-end verification evidence reference, when that run completes.

The ledger is what makes a cross-repository slice survive session boundaries. A central session resuming weeks later, with no conversational memory, reconstructs the whole state of the slice by reading it: which components were dispatched, which have returned, against which pin, and what remains outstanding. Anything known only to a session that has ended is lost, so nothing may live only there.

Appending to the ledger is an ordinary local edit inside the already-approved change, in the normal mutation class — it needs no additional gate, but it does need committing and pushing to be durable for anyone else.

**What belongs in it.** The ledger holds exactly the facts that originate *outside* the central repository, and nothing derivable from the central change package itself. Requirements live in the change's delta, design decisions in its design record, tasks in its task list; duplicating those into a ledger creates a second source of truth that drifts. What the change package cannot know on its own is what was promised outward, what came back, and what happened when the assembled system ran.

It therefore records: the contract pin and its amendment history; a dispatch entry per component repository; a return entry per component as it closes out; the end-to-end verification assignment and result; and any residual gaps. It references requirements by identifier only — never by restating their text — and records *that* a component's checks passed and where the evidence lives, never the evidence itself.

**This is an accepted convention, not a placeholder.** No standard exists to adopt: OpenSpec has no cross-change linkage or evidence-return mechanism, its guidance for work spanning repositories is to link branches in pull-request descriptions, and comparable tooling has the same gap. Rather than leave the location to improvisation at the first cross-repository slice, this brief fixes it. The path, the required sections, and the status vocabulary below are normative — a cross-repository slice without a conforming ledger is incomplete, and a component's evidence that exists only in a pull request or a chat log has not been recorded.

The alternatives, and why they were not chosen:

| Alternative | Why not |
| --- | --- |
| Pull-request descriptions alone (OpenSpec's current guidance) | Scattered across repositories, not resolvable from the central repository, and not a single state a resuming session can read. Retained as a *transport*, not as the record. |
| Linked GitHub issues | Requires GitHub integration that may not be authorized, makes the record depend on a service outside the repository, and is likewise a transport rather than a store. |
| A file outside the change package | Outlives the change it describes and drifts from it; archiving the change would not archive its evidence. |
| Extending `proposal.md` or `tasks.md` | Those are OpenSpec-owned artifact shapes. Mixing externally-originated evidence into them blurs the boundary between what this repository decided and what other repositories reported. |
| Waiting for OpenSpec Stores | Beta, and it addresses contract distribution rather than evidence return, so it would not remove the need. |

Inside the change package wins because the ledger is scoped to exactly one slice, archives with it, is durable in git, and sits at a deterministic path a cold session can find without being told. The name follows the vocabulary already used for this relationship — durable *linkage* between central and component work.

If OpenSpec later ships a first-class linkage mechanism, the ledger's fields are deliberately shaped to map onto the seven durable-link fields, so migration is a format change rather than a re-derivation of lost history.

**Required format.** Sections `Contract pin`, `Dispatch`, `Returns`, `End-to-end verification`, and `Residual gaps` are all required, present from initialization even when empty:

```markdown
# Linkage Ledger — m1.2-sync-transaction

Milestone: M1.2 Live Sync REST API Proof
Delivery profile: prototype-rapid

## Contract pin

| Version | Revision | Branch | Pinned at | Reason |
|---|---|---|---|---|
| v1 | 793603b | change/m1.2-sync-transaction | 2026-08-15 | Initial dispatch at Gate 1 |
| v2 | a41f0c2 | change/m1.2-sync-transaction | 2026-08-22 | Amended: idempotency key moved to header |

Delta path: openspec/changes/m1.2-sync-transaction/specs/
Stage: delta (pre-Sync)

## Dispatch

| Component repo | Requirements owned | Pin cited | Dispatched | Status |
|---|---|---|---|---|
| enterprise-growth-mobile | R1, R2, R4 | v2 | 2026-08-15 | returned |
| enterprise-growth-api | R2, R3 | v2 | 2026-08-15 | in-progress |

## Returns

### enterprise-growth-mobile — returned 2026-08-27
- Change: `add-outbox-sync-client`
- Archive commit: 6f2a91d on main
- Built against pin: v2
- Validation: `npm test` 142 passed; `npm run typecheck` clean; device install verified on Pixel 6a
- Divergence: none

### enterprise-growth-api — outstanding
- Change: `add-transaction-sync-endpoint` (proposed, not archived)
- Built against pin: v2

## End-to-end verification

- Executor: named human, scripted manual QA
- Environment: Pixel 6a APK build 6f2a91d against locally-run API — **not** a deployed environment
- Status: not yet run (blocked on api return)
- Evidence location: ai-planning/evidence/m1.2-e2e-run.md

## Residual gaps

- None recorded yet.
```

Dispatch status is drawn from a closed vocabulary — `dispatched`, `in-progress`, `returned`, `reopened`, `superseded` — so that state is machine-readable rather than prose. The pin history is retained rather than overwritten, because the amendment and superseded-pin rules are only auditable if you can see which revision each component actually built against; updating it is part of the amendment procedure, not an optional courtesy.

The format is accountable to one test: a central session opening cold reads this single file and knows the contract is at v2, one component has returned clean, one is outstanding, end-to-end verification is blocked, and Verify must not begin. Any proposed revision to the format has to preserve that property.

A ledger is required for every cross-repository slice and absent for single-repository slices, which have no boundary to record.

**Amendment and re-pinning.** If component work proves the central contract wrong, the correction is to amend the central change, not to let a component diverge silently. Amending produces a new central commit and invalidates the existing pin. Every component still in flight must be re-pinned. A component that has **already archived** against the superseded pin is reopened if the amendment changes behavior it implemented; if the amendment does not affect its behavior, it stays archived and the slice records an explicit "archived against superseded pin" note in the central verification evidence.

### End-to-end verification

A cross-repository slice is not proven by its components passing their own checks. Each component's evidence covers only its own repository; the behavior the slice actually promises exists only in the assembly. Central Verify therefore needs one more input: an end-to-end run of the assembled vertical slice.

The central repository coordinates this evidence but does not produce it — it owns no code and generally cannot execute the assembled system itself. So the run is always **executed elsewhere and recorded centrally**, and the slice must name three things at Propose time, before Gate 1:

- **Executor** — who or what performs the run: a named person doing scripted manual QA, a designated component repository that hosts the end-to-end suite, or a dedicated verification environment. This is a per-slice assignment, not a fixed rule the skill imposes.
- **Environment** — what the run executes against, including which component revisions are assembled and whether any of it is stubbed. A run against a mock of the other half does not prove the slice.
- **Evidence location** — where the result is recorded, referenced from the central linkage ledger.

The skill does not decide these; it refuses to proceed past Gate 1 without them, the same way it refuses a missing component declaration. An unassigned end-to-end owner means the slice has no path to verification, and that is better surfaced at proposal time than discovered when every component has already archived.

If the slice's own delivery profile or the participating repositories genuinely cannot support an end-to-end run, that is a recorded residual gap in central verification — an explicit, visible limitation on what the slice proved. It is never silently substituted with the union of component evidence.

## Users And Modes

### Collaboration profiles and observed gap

The original two-role model correctly protects repository ownership and durable
handoffs, but it has no way to distinguish a multi-owner delivery from a
single owner deliberately operating both roles. The absence of that choice can
make a cross-repository transition appear as an unexpected notification, or
tempt an assistant to treat a central bounded run as implicit component
authority. Neither outcome is acceptable.

The skill therefore SHALL resolve one collaboration profile for every
cross-repository milestone and slice:

- **`team` (default):** separate central-coordinator and component-implementer
  role sessions, with each participating component owned by its named
  repository owner. Gate 1 emits the durable handoff, the central session ends
  while component returns are outstanding, and no central session acts in a
  component repository.
- **`solo` (explicit):** one named owner is intentionally operating the
  central and named component roles. The same person may perform both roles,
  but the assistant still announces a role transition, reads the durable
  inbound handoff, maintains separate central and component controller state,
  and writes the same linkage-ledger dispatch and return records. `solo` does
  not collapse the central and component changes, remove either Gate 1 or Gate
  2, substitute component evidence for end-to-end evidence, or grant a
  component mutation from a central authorization.

When a required collaboration profile is absent, the assistant SHALL present
`team` as the default, explain the effect of `team` and `solo`, and ask the
user to either accept `team` or explicitly select `solo`. It SHALL not select
or start a slice, dispatch a component, or enter a component repository until
that response is recorded in the milestone/slice source and, for an in-flight
slice, its linkage ledger. Default is a safe recommendation, not silent
consent.

This profile is independent of the delivery profile (`prototype-rapid` or
`production-rapid`) and execution mode (checkpointed or a separately granted
autonomous scope). A `solo` choice permits one owner to operate both roles; it
does not make a cross-repository central change milestone-autonomous or
slice-autonomous.

### Interactive, one slice at a time (default)

The user is walked through each milestone and each slice with explicit narration and approval gates as described in Workflow below. For a cross-repository milestone or slice whose collaboration profile is absent, profile resolution occurs before this cadence begins. This is the default whenever the user has not granted a bounded autonomous scope.

### Milestone-autonomous

The user grants a bounded autonomous run whose target is "every remaining candidate slice in milestone `<X>`, in documented order," with a stopping condition of "milestone acceptance criteria met, or a pause condition fires." Slice-level confirmation prompts are replaced by continuous progression; slice-level and milestone-level summaries are still always emitted as non-blocking reports. This is a use of `autonomous-goal-runner`'s authorization model, not a separate autonomy mechanism.

**Milestone-autonomous is unavailable for any milestone containing a cross-repository slice.** A milestone whose delivery spans repositories cannot be run autonomously, because its mutation boundary would span repositories that separate people and separate agents own, and because its slices are gated on handoffs the skill cannot complete unilaterally. It remains available for milestones explicitly declared to have no component repositories — a reusable-skills repository, a docs-only repository, or any self-contained workspace.

This makes component declaration a **required, explicit** milestone field, and it **fails closed**: a milestone that does not state its component involvement is treated as unknown, and the autonomous option is not offered. Silence is never read as "no components."

### Slice-autonomous within an otherwise interactive milestone

The user grants a bounded autonomous run scoped to exactly one named slice: Propose through close-out (Sync, Archive, merge to main, and feature-branch/worktree cleanup) without pausing at the plan gate or the implementation gate. The milestone otherwise remains interactive — the next-slice approval gate still applies afterward.

**Slice-autonomy is unavailable for a cross-repository slice's central change**, for the same structural reason milestone-autonomy is: that change cannot run continuously. It must stop at Gate 1 to dispatch, and it cannot reach Verify until evidence arrives from repositories this session does not own. "Propose through close-out without pausing" has no meaning there.

It remains available to a **component** change, granted locally in that component's own repository by whoever owns it. That grant covers that repository's lifecycle only and is never implied by any grant made centrally.

### Task-checkpointed and task-autonomous (component-implementer only)

Within a component change, the developer chooses how Apply paces its ordered tasks: **task-checkpointed** emits a per-task summary and pauses between tasks so work can be redirected, while **task-autonomous** works through all tasks continuously. Both are pacing choices inside Apply, not authorization grants — neither adds or removes an approval gate, and neither is a substitute for the slice-autonomous grant, which is what actually authorizes skipping Gate 1 and Gate 2.

## Trigger And Non-Triggers

Use this skill when a user is delivering work that is already organized (or is being organized) as milestones containing ordered slices, and wants a consistent narration/approval cadence around OpenSpec Propose/Apply/Verify/Sync/Archive for each slice, or wants an on-demand status query against that plan (current milestone/status, last slice or milestone worked on, overall plan position, a named milestone's summary, a named milestone's slice list).

Also use it in the **component-implementer** role: when a component repository receives an approved slice by handoff record and needs the same cadence one level down, breaking that slice into ordered tasks inside a single delta. The trigger there is the inbound handoff record, not a local milestone plan — a component repository is not expected to hold one.

Do not use this skill:

- for a single, standalone OpenSpec change with no milestone/slice plan behind it — use the repository's ordinary `openspec-*`/`opsx:*` lifecycle actions directly;
- to invent a milestone/slice plan from nothing — planning still belongs to Explore/Propose-level work (or `design-brief-from-research`) and to the owner's actual decisions, not to this skill;
- to grant itself autonomy — every autonomous scope (milestone- or slice-level) requires the user's explicit, exact grant per `autonomous-goal-runner`'s required inputs; a milestone or slice briefing that merely *offers* the autonomous option is not itself authorization; and
- to perform the external mutation classes this skill's own host guidelines gate behind confirmation *beyond the current slice's own feature branch* (GitHub Issue/Project writes, deployments, credential or global configuration changes, destructive actions unrelated to the slice) — those pauses apply the same way inside an autonomous grant unless that exact mutation was named in the grant. The slice's own merge to main and feature-branch/worktree cleanup are not in this category; they are authorized by the implementation-gate approval (checkpointed) or by the autonomous grant itself, per the two-gate model below. Neither is the Gate 1 commit-and-push of a cross-repository slice's central change package, which the plan-gate approval authorizes because the pin it produces is what the handoff records cite.

## Required Inputs

- Milestone/slice source: a durable planning artifact enumerating ordered milestones with candidate slices (for example, a scope-map document plus one brief per milestone), or a GitHub-Project-backed source consumed through `dependency-aware-work-selection` when the target repository has that linkage configured.
- Completion state: the target repository's OpenSpec `changes/archive/` (or linked GitHub Project/issue status) to compute done vs. remaining slices per milestone.
- Delivery profile: `prototype-rapid` or `production-rapid`, applied at Apply/Verify/Archive time via `base-verification-loop` (and `independent-review` for `production-rapid`); this skill does not choose or downgrade the profile.
- Role: whether this session is running as central-coordinator or component-implementer. Resolve it from the repository being operated in, not from what the user's request sounds like.
- Collaboration profile: `team` or `solo` for every cross-repository milestone
  and slice. If absent, present the `team` default and wait for the user's
  explicit acceptance or `solo` selection before any work selection or
  mutation.
- Repository set and integration paths: for a single-repository slice, the one target repository and its configured path for "merge to main" (direct commit, or PR-and-merge under branch protection). For a cross-repository slice, the central repository *and* each participating component repository, each with its own integration path — close-out spans one branch per participating repository, not one branch overall.
- Component declaration: for each milestone, an explicit statement of which component repositories its slices involve, or an explicit declaration of none. Absence of this field is "unknown," not "none."
- For a cross-repository slice: the end-to-end verification assignment — executor, environment, and evidence location — resolved before Gate 1. An unassigned end-to-end owner is a missing input, not a detail to settle later.
- For the component-implementer role: the inbound handoff record (see Handoff record), including the pinned central revision and the requirements this repository owns. Without a resolvable inbound record there is no approved contract to implement against, and the role must stop rather than infer the contract from the repository's own code.
- For any autonomous scope: the exact target, mutation boundary (including whether merge/PR authority is included, and which repositories are in scope), and stopping condition, per the host autonomous-run contract.
- Version-control history for the completion evidence under the milestone/slice source (for example, commit history touching `openspec/changes/archive/`), used to answer recency status queries — "last slice worked on," "last milestone worked on" — without relying on filesystem timestamps or conversational memory.

If the milestone/slice source cannot be resolved, or completion state is ambiguous (for example, an archived folder whose name doesn't map to any candidate slice), pause and report the gap instead of guessing at the next slice or answering a status query with a guess. The same applies to a missing, stale, or unresolvable inbound handoff record: report it rather than reconstructing the contract from memory, from the component repository's existing code, or from a plausible reading of the slice name.

## Workflow

Step 0 runs at the start of every session in either role and routes to the right entry point. Steps 1 through 5 describe the cadence as run by the **central-coordinator** role, which is also the whole cadence for a single-repository slice. Step 3b describes what the **component-implementer** role runs in a component repository, in its own session, and step 3c describes how a central session picks a cross-repository slice back up after dispatch.

### 0. Session entry — resolve role and position

Every session begins here, including a fresh session with no conversational memory. Nothing below may be inferred from what the user's request sounds like; all of it is resolved from durable evidence in the repository.

1. **Resolve the role** from the repository being operated in: central-coordinator or component-implementer.
2. **Look for work already in flight before looking for new work.** In the central role, an open central change whose linkage ledger shows dispatched components is a slice awaiting return, not a slice to start over. In the component role, an unarchived local change citing an inbound handoff record is work to continue.
3. **Route accordingly:**
   - central role, open cross-repository slice with outstanding returns → **step 3c (resume)**;
   - central role, open cross-repository slice with all returns and end-to-end evidence in hand → **step 3c**, which proceeds into Verify;
   - central role, no open slice → **step 1 (milestone entry)**;
   - component role, inbound record and no local change yet → **step 3b** from the top;
   - component role, local change already open → **step 3b**, resumed at its current task.
4. If the position is ambiguous — an open change whose ledger contradicts the repository state, or a local change citing a record that cannot be resolved — report the ambiguity and stop. Do not pick the interpretation that allows work to continue.

### 1. Milestone entry — before the first slice of a new milestone

1. Resolve the current milestone: the first milestone (in documented order) that still has remaining candidate slices, unless the user names a different one explicitly.
2. Resolve the milestone's component declaration. If it is absent, say so and treat component involvement as unknown for the rest of this milestone.
3. Resolve the collaboration profile. For a milestone containing component repositories, show the `team` default and pause for the owner to accept it or select `solo` when the source has no explicit profile. Record the selection durably before starting a slice.
4. Emit a milestone summary: goal, outcome, the full ordered candidate-slice list annotated done/next/remaining, dependencies, acceptance criteria, open blocking questions, the component declaration (the repositories involved, or an explicit "none"), and the collaboration profile.
5. Offer the autonomous path **only** if the milestone is explicitly declared to have no component repositories. Otherwise offer one-slice-at-a-time only, and state plainly why the autonomous option is unavailable — cross-repository milestones and undeclared milestones both fail closed.
6. Pause for approval before starting the first slice, or before starting the milestone if autonomous was chosen and available.

### 2. Slice entry — after milestone/slice approval

1. Emit a slice briefing: what the slice does, the files it plans to add/modify/delete, and the expected end-of-slice outcome.
2. State whether the slice is single-repository or cross-repository. If cross-repository, name the responsible repositories, collaboration profile, and how the requirements divide between them. For `team`, say that named repository owners must act on the handoff records. For `solo`, say that the named owner may enter each component role only after the corresponding durable handoff and role-transition acknowledgement.
3. If the milestone scope is interactive, offer the per-slice execution choice: checkpointed (the two gates below) or slice-autonomous (Propose through close-out without pausing, if granted). Skip this offer when the milestone itself is already running autonomously, and do not offer it at all for a cross-repository slice — that slice's central change cannot run continuously, so checkpointed is its only coherent mode.
4. Ask for explicit confirmation to start the slice.

### 3. Slice execution

There are exactly two approval gates in the checkpointed flow — no more, no fewer:

- **Gate 1 (plan gate):** after Propose, before Apply — verify the plan before anything is implemented.
- **Gate 2 (implementation gate):** after Verify, before Sync — verify the implementation before the change closes out. Approving this gate authorizes the entire close-out as one action: Sync, Archive, merge to main, and feature-branch/worktree cleanup. It does not require a third approval.

Checkpointed (default, non-autonomous):

Propose → **pause (Gate 1)** → Apply → Verify → **pause (Gate 2)** → Sync → Archive → merge to main → clean up the feature branch/worktree.

Autonomous (slice- or milestone-scoped):

Propose → Apply → Verify → Sync → Archive → merge to main → clean up the feature branch/worktree, continuously and without pausing at either gate, subject to the same pause conditions any bounded autonomous run respects — ambiguity, an external-mutation or credential/destructive-action boundary not named in the grant, or failed validation evidence.

Apply typically creates or reuses a per-slice feature branch (and, when isolation is needed, a git worktree). Close-out merges that branch into main via the repository's configured integration path and removes the branch and any worktree once merged. If that path requires an action the assistant cannot complete unassisted (for example, a protected branch that only a human can click to merge), report that as a completion blocker rather than inventing a workaround, silently stopping short, or treating it as a third approval gate.

Delivery-profile gates (`base-verification-loop` checks, and `independent-review` for `production-rapid`) apply identically in both modes and are never skipped to keep an autonomous run moving.

#### Cross-repository slice execution (central-coordinator)

The gate count does not change. The two gates sit at the slice level, and the component repositories' entire lifecycles run between them:

```
CENTRAL     Propose ──[GATE 1]──▶ Apply ─────────────────────▶ Verify ──[GATE 2]──▶ Sync ▶ Archive
                                    │                            ▲
                                    │  (stays open)              │
                    ┌───────────────┼────────────────────────────┤
                    │               │                            │
COMPONENT A         └─▶ Propose ▶ Apply ▶ Verify ▶ Sync ▶ Archive┤
                                    │                            │
COMPONENT B         ┌─▶ Propose ▶ Apply ▶ Verify ▶ Sync ▶ Archive┤
                    │                                            │
E2E QA              └───────────────────────▶ vertical slice run ┘
```

1. **Central Propose** writes the change package: requirements and scenarios divided by responsible repository, the contract, and the system acceptance scenarios. It assigns no file-level tasks to any component repository.
2. **Gate 1.** Refuse to reach this gate without a component declaration and a complete end-to-end verification assignment (executor, environment, evidence location); a slice with no path to verification is stopped here, not discovered later. Approval covers the contract *and* the repository split. Its consequence is mechanical and requires no second prompt: commit the central change package to its branch, push it, capture the resulting revision, initialize the linkage ledger with the pin and one dispatch entry per participating component repository, and emit one outbound handoff record per repository.
3. **Between the gates.** Component repositories run their own full lifecycles, in their own sessions, in parallel — they do not queue behind one another, because the contract that makes them independent was pinned at Gate 1. The central change stays open and visible as in-progress work. The central role does not implement, review, or drive component work here; component-local review happens in each repository's own pull request, not as a central prompt. The central session normally ends here rather than idling, and later sessions re-enter through step 3c; this phase is over only when every return has been recorded in the ledger and end-to-end verification has run.
4. **Central Verify** re-runs nothing. It maps every approved central requirement and scenario to authoritative evidence — each return record plus the end-to-end QA evidence — confirms no requirement is uncovered, and records residual gaps, contract divergences, and any "archived against superseded pin" notes.
5. **Gate 2.** Approval authorizes central Sync, Archive, and the central repository's own close-out as one action. Component repositories were closed out under their own gates, in their own sessions; Gate 2 does not reach into them.

If a component's work proves the contract wrong, this flow loops back rather than continuing: amend the central change, re-pin, and re-issue handoff records per Amendment and re-pinning above.

### 3b. Component slice execution (component-implementer)

Run in a component repository, in its own session, driven by an inbound handoff record. The received slice plays the role a milestone plays centrally.

1. **Slice entry.** Resolve and echo back the inbound record — pinned central revision, change identifier, the requirements this repository owns, the delivery profile — so the developer can confirm the right contract is in hand. Stop and report if it is missing, stale, or unresolvable.
2. **Propose** one component change: a single delta covering this repository's share, breaking it into ordered, iterative implementation tasks, and recording all seven linkage fields including its own change identifier.
3. **Gate 1.** Approve the task breakdown.
4. **Apply**, working the ordered tasks either task-checkpointed or task-autonomous. Pausing between tasks is pacing, not a gate.
5. **Verify** against the component's own validation commands and the delivery profile's checks.
6. **Gate 2.** Approve the implementation; this authorizes the component's own close-out — Sync, Archive, merge, branch/worktree cleanup.
7. **Emit the return record** and hand it back by the agreed transport.

If implementation shows the central contract is wrong or incomplete, stop and report it as a contract amendment request. Do not resolve the conflict locally by implementing something the contract does not say — that divergence would be invisible to central verification.

### 3c. Resuming an open cross-repository slice (central-coordinator)

A cross-repository slice's central session ends at Gate 1 and resumes only when components report back, potentially weeks later and with no shared memory. Resuming is therefore a first-class entry point, not an exception:

1. Read the linkage ledger and reconstruct the slice's state: the pinned revision, which components were dispatched, which have returned, and what end-to-end verification is outstanding.
2. Emit a resumption briefing — the slice, its pin, returns received, returns outstanding, and the end-to-end verification status. This is the same content a status query would report, but as the opening of a working session rather than a read-only answer.
3. If returns are still outstanding, stop there. There is nothing for the central role to do but wait; it must not start component work itself, and it must not begin Verify against partial evidence.
4. If every return has arrived and end-to-end evidence exists, append anything newly received to the ledger and continue into Central Verify (step 3, item 4) and Gate 2.
5. If a return record reports contract divergence, treat it as an amendment request rather than folding the divergence into verification.

### 4. Slice exit

1. Always emit: a summary of the changes made, the files touched (added/modified/deleted), and any post-slice manual QA/testing steps.
2. For a cross-repository slice, the summary spans every participating repository: the central change identifier and pinned revision, each component repository's change identifier and archive commit, the end-to-end QA evidence, and any recorded divergence or superseded-pin note. This is the durable record of what the slice actually was, assembled from return records rather than from session memory.
3. If the milestone scope is interactive, pause for approval before starting the next slice or the next milestone.
4. If the milestone scope is autonomous, continue automatically unless a pause condition fires; the slice summary is still surfaced as a non-blocking report, not a gate.

### 5. Milestone exit

Once the milestone's last candidate slice archives and its acceptance criteria hold, emit a cumulative milestone summary: a bulleted list of every slice change made during the milestone, and a rollup of cumulative files/impact. Return to step 1 for the next milestone.

For a milestone containing cross-repository slices, the rollup spans repositories: every participating repository and the change identifiers it contributed, the end-to-end verification evidence per slice, and any residual gaps carried forward — unverified end-to-end behavior, recorded contract divergences, or superseded-pin notes. A milestone does not close by having all its central changes archived if its recorded residual gaps contradict its acceptance criteria; say so rather than declaring the milestone done.

## Status Queries

Independent of the approval-gated Workflow above, the skill answers on-demand, read-only status questions at any time — before, between, or during slices, and in a brand-new session with no prior conversational context. These reuse the Workflow inputs (milestone/slice source, completion state, version-control history, and — for cross-repository slices — the linkage ledger) but never mutate state, never start a slice, and never imply approval of anything they report.

| User asks | Skill answers |
|---|---|
| "What's the current milestone, and its status?" | The current milestone — the first, in documented order, that still has remaining candidate slices — with its done/next/remaining slice breakdown and any open blocking questions. |
| "What was the last slice we worked on?" | The most recently archived slice across the whole plan, resolved from durable version-control evidence (for example, the most recent commit touching `openspec/changes/archive/**`) — never from filesystem timestamps, which don't survive a fresh checkout, or from conversational memory. |
| "What was the last milestone we worked on?" | The milestone that the most-recently-archived slice (above) belongs to. |
| "Where are we in the spec plan?" | A plan-wide rollup: every milestone's status (done / in progress / not started) with slice counts, the current milestone, and the total remaining-slice count across the whole plan. |
| "Give me a summary of milestone `<X>`." | That milestone's goal, outcome, ordered candidate-slice list with status, dependencies, acceptance criteria, and blocking questions — the same content as the Milestone entry briefing (Workflow step 1), but on demand, without offering the run-autonomously choice and without pausing for approval. |
| "Show me all the slices in milestone `<Y>`." | Just that milestone's ordered candidate-slice list, annotated done/next/remaining. |
| "Is slice `<Z>` done?" | For a single-repository slice, whether its change is archived. For a cross-repository slice, done **only** when the central change is archived — a slice with every component archived but the central change still open is *in progress*, reported with which components have returned and which have not. |
| "What is this component repository waiting on?" (component-implementer role) | The inbound handoff record's pinned central revision and change identifier, and whether that pin is still current. Currency is checked by fetching the central repository and comparing the pinned revision against the current head of the central change's branch: unchanged means current; moved means the pin is potentially superseded and must be reported for re-pinning rather than proceeded against. If the central repository cannot be reached, report the pin as *unverified* — never as current. |

A cross-repository slice's completion state must be computed from the central change plus the return records it has collected, never from one repository's local archive alone. A component repository can only ever report its own share.

If a status query names a milestone or slice absent from the resolved milestone/slice source, say so rather than guessing at a plausible-sounding name.

## Safety And Authorization

The skill must:

- treat "run the entire milestone autonomously" and "run this slice fully autonomous" as distinct, explicit grants that follow the host autonomous-run contract — never infer one from the other, and never infer either from a generic "go ahead";
- treat merge to main and feature-branch/worktree cleanup as part of the Gate 2 (implementation-gate) approval in checkpointed mode, and as part of the grant itself in autonomous mode — never insert a third approval prompt for them. If the repository's configured integration path requires an action the assistant cannot complete unassisted (a protected branch requiring a human-clicked merge, for example), report that as a completion blocker instead of pausing for a gate that doesn't exist or silently leaving the slice unmerged;
- never let an autonomous grant skip the `production-rapid` independent-review gate, a required `base-verification-loop` check, or an OpenSpec Verify/Sync/Archive precondition;
- pause immediately, in either mode, for any GitHub write, deployment, credential/global-configuration change, destructive action, or scope expansion beyond the currently briefed slice, exactly as the host repository's own approval boundaries require;
- never claim a slice or milestone is complete without the lifecycle's own recorded validation/verification evidence;
- preserve the milestone/slice source document as the authoritative plan — if a slice's real scope diverges from what was briefed (split, grown, or dropped), surface that as a visible plan revision before continuing, not a silent substitution;
- never offer or accept a milestone-autonomous grant for a milestone containing a cross-repository slice, and never treat an undeclared milestone as component-free — component declaration fails closed;
- never offer or accept slice-autonomy for a cross-repository slice's central change, which cannot run continuously; component-level slice-autonomy is granted locally, in the component's own repository, and is never implied by a central grant;
- never infer `solo` from a shared user identity, a common workspace, an agent's
  ability to access both repositories, or a generic approval. Missing profile
  means present `team` and wait; `solo` changes role-operation convenience only
  after explicit selection and durable recording;
- never operate outside the repository the current role owns. The central role does not implement in component repositories; a component role does not edit the central contract. Cross-repository influence travels only through handoff records and contract amendments;
- treat the Gate 1 commit-and-push of the central change package as authorized by Gate 1 approval itself, and treat everything it enables downstream as still requiring the component repositories' own approvals;
- never let the central change archive before its component changes, and never let a component change archive against a pin it knows to be superseded without that being recorded as an explicit gap; and
- never reconstruct a missing inbound handoff record from session memory, from the component repository's existing code, or from the slice name. A component change built against an unverified contract is indistinguishable from one built against the real one until central verification fails.

## Canonical Assets And Adapters

Implementation should add:

- `skills/base/sdd-milestone-slice-delivery/SKILL.md`;
- thin Claude and Codex discovery wrappers;
- references for milestone/slice source inventory and done/remaining computation, the cadence state machine (session entry → milestone entry → slice entry → execution → resume → slice exit → milestone exit), and the slice/milestone summary templates;
- a cross-repository reference covering role resolution, the session-entry router, the envelope model, the outbound/return handoff record templates and their transports, the linkage-ledger format, end-to-end verification assignment, and the amendment/re-pin rules; and
- synthetic fixtures and tests under `evals/skills/sdd-milestone-slice-delivery/`, covering an interactive multi-slice milestone, a milestone-autonomous run, a slice-autonomous run inside an otherwise interactive milestone, a paused run (ambiguous next slice, missing milestone source, a merge mechanism the assistant cannot complete unassisted), and a multi-repository fixture exercising both roles across separate simulated sessions.

## Evaluation Requirements

Use synthetic milestone/slice plans to test:

- correct next-milestone and next-slice resolution from a documented plan plus archive/completion state;
- milestone and slice briefings contain every required field (goal/outcome/slice list/status for milestones; changes/files/outcome for slices);
- a cross-repository milestone or slice with no collaboration profile presents
  `team` as the default and pauses before work selection, dispatch, or a role
  transition; it never treats the default as silent consent;
- explicit `team` preserves separate central and component role sessions, while
  explicit `solo` permits one named owner to enter both roles only through
  visible role-transition acknowledgement and durable handoff/return records;
  neither profile weakens the two approval gates, component mutation boundary,
  linkage ledger, or end-to-end verification requirement;
- the two autonomy grants stay independent and are never inferred from each other or from vague approval language;
- checkpointed slices pause at exactly two gates — before Apply (Gate 1) and before Sync (Gate 2) — and that Gate 2 approval alone authorizes Sync, Archive, merge to main, and feature-branch/worktree cleanup as one close-out with no third prompt;
- autonomous slices still invoke `base-verification-loop` (and `independent-review` for `production-rapid`) and still pause on a named-mutation boundary not covered by the grant, and that an unassisted-merge blocker (e.g., a protected branch requiring a human-clicked merge) is reported as a completion blocker rather than a fabricated third gate;
- slice-exit and milestone-exit summaries are emitted in both interactive and autonomous modes, and gate progression only in interactive mode;
- a missing or ambiguous milestone/slice source, or an unmapped archived change, produces a paused gap report instead of a guessed next slice; and
- every status query (current milestone/status, last slice worked on, last milestone worked on, plan-wide rollup, a named milestone's summary, a named milestone's slice list, cross-repository slice completion) returns a correct, non-mutating, non-gating answer from durable evidence in a fresh session with no prior conversational context, and reports rather than guesses when the named milestone or slice doesn't exist;
- role resolution comes from the repository operated in, and neither role acts outside it — a central session never implements component code, a component session never edits the central contract;
- a cross-repository slice still pauses at exactly two central gates, Gate 1 emits one outbound handoff record per participating component repository, and the emitted pin is a pushed revision rather than a local-only commit;
- a component session with a missing, stale, or unresolvable inbound handoff record stops and reports instead of reconstructing the contract, and a component change is one delta with ordered tasks rather than one change package per task;
- task-checkpointed and task-autonomous pacing change no gate count, and neither is accepted as a substitute for a slice-autonomous grant;
- slice-autonomy is refused for a cross-repository slice's central change with the structural reason stated, while remaining available to a component change granted locally;
- milestone-autonomous is refused for a milestone containing a cross-repository slice and for a milestone with no component declaration, with the reason stated;
- a cross-repository slice reports as in progress while the central change is open even when every component has archived, and central archive is refused before component archives; and
- an amended central contract re-pins in-flight components, reopens an already-archived component whose implemented behavior the amendment changes, and records an explicit superseded-pin gap when it does not;
- session entry resolves role and position from durable repository evidence alone, routes correctly to milestone entry, resume, or component execution, and stops on an ambiguous position rather than choosing the reading that lets work continue;
- a central session resuming a cross-repository slice with no conversational memory reconstructs dispatched/returned/outstanding state from the linkage ledger, refuses to begin Verify against partial returns, and waits rather than doing component work itself;
- outbound records, return records, and end-to-end evidence references are all persisted to the linkage ledger and committed, so no slice state exists only in a session;
- the ledger is written to the normative path with all required sections present from initialization, uses only the closed dispatch-status vocabulary, retains rather than overwrites pin history, and is absent for single-repository slices; and
- a cross-repository slice missing its end-to-end verification owner, environment, or evidence location is refused at Gate 1, and a slice that genuinely cannot run end to end records that as a residual verification gap rather than substituting the union of component evidence.

## Acceptance Gate

An implementation change is complete only when a synthetic milestone/slice plan can be run end-to-end — interactively, milestone-autonomous, and with a slice-autonomous exception inside an interactive milestone — producing correctly gated milestone and slice briefings, correctly paced Propose/Apply/Verify/Sync/Archive execution, accurate slice- and milestone-exit summaries, and provable pauses at exactly the two named gates, without needing a live target repository for the first-release evaluation suite. It must also answer every Status Queries entry correctly, non-gating, and from a fresh session against that same synthetic plan.

It must additionally run one synthetic **cross-repository** slice end to end across separate simulated sessions: a central session that proposes, gates, pins, and emits handoff records; independent component sessions that consume those records, deliver one delta each under their own two gates, and emit return records; and a returning central session that aggregates them into verification and closes the envelope in the correct order. That run must also demonstrate the refusal paths — milestone-autonomy declined for a cross-repository or undeclared milestone, a component session stopping on a missing or stale inbound record, a slice refused at Gate 1 for an unassigned end-to-end verification owner, and an amendment correctly re-pinning in-flight components while resolving an already-archived one.

Critically, the central sessions in that run must be genuinely discontinuous: the session that dispatches at Gate 1 and the session that resumes into Verify must share no conversational state, proving that the linkage ledger alone carries the slice across the gap.
