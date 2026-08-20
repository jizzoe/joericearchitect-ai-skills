# Autonomous SDD document restructure and multi-agent handoff

- Date: 2026-08-20
- Status: Big-picture refactor and all 19 draft slice briefs completed; ready
  for owner review. No OpenSpec, implementation, archive, or delivery work is
  authorized by this handoff.
- Primary sources at capture: `ai-planning/design-briefs/autonomous-sdd-reliability-control-plane.md`
  and `ai-planning/plans/autonomous-sdd-reliability-control-plane-roadmap.md`.

## Purpose

Preserve the owner's agreed direction for the autonomous SDD reliability
control-plane documents before a later focused planning session. The future
work must make the design brief and roadmap agree, retain all useful existing
content, add an explicit multi-agent operating model, and leave a clean basis
for later harness-engineering exploration.

This handoff records planning intent only. It is not an owner decision on any
currently open architecture question, and it does not authorize an OpenSpec
proposal, implementation, GitHub action, or archival mutation.

## Agreed target document model

The control-plane initiative will have two master documents and detailed
slice-level briefs.

```text
Main design brief
  ├─ system outcome, rules, architecture, decisions, and shared constraints
  ├─ links to detailed slice briefs
  └─ roadmap
       └─ dependency order, readiness, and execution order only

Each roadmap slice
  └─ one detailed design brief with its own behavior, risks, evidence,
     handoffs, and OpenSpec starting point
```

### 1. Main design brief

Keep `ai-planning/design-briefs/autonomous-sdd-reliability-control-plane.md`
as the initiative's main design document. It becomes the single explanation of
the whole system, rather than only an evidence-derived recommendation.

It must contain:

- the problem, desired unattended-delivery outcome, and boundaries;
- system-wide safety rules: exact authorization, preservation of unrelated
  dirty work, evidence-driven outcomes, fail-closed recovery, and human pauses
  only for genuine judgment or unresolved material state;
- the durable-execution architecture: local-first execution, isolated parent
  runs and child work units, durable histories, write-ahead records, stable
  attempts, idempotency, reconciliation, and status projections;
- shared conflict prevention through one repository-scoped resource-claim
  authority, including fencing and recovery rules;
- backend portability rules: a local ledger is first; later Temporal support
  must preserve domain policy, use one authoritative history for a Temporal
  run, and not create competing authorities;
- configuration, review, cleanup, authorization, security, and evidence
  principles that apply to every slice;
- the multi-agent operating model below;
- an explicit decision log showing confirmed decisions, assumptions, open
  questions, decision owner, and what must be resolved before a slice can be
  proposed;
- cross-cutting risks, rollout controls, qualification thresholds, and a map to
  the slice briefs.

The first reliable-release promise is one approved change in one repository,
executed serially and safely through closeout or an exact actionable stop.
Repeated real single-change qualification must pass before milestone queues,
parallel child work, five-slice execution, or Temporal.

The main design explains what must remain true across the whole initiative. It
does not become a detailed task list or repeat every slice's test procedure.

### 2. Thin roadmap

Keep `ai-planning/plans/autonomous-sdd-reliability-control-plane-roadmap.md`
as the roadmap, but reduce it to navigation, dependency mapping, and execution
order.

For each slice, retain only:

- ID and one-sentence outcome;
- link to its detailed design brief;
- hard dependencies and explicit pre-Propose decisions;
- readiness state;
- proposed OpenSpec change name;
- the containing milestone's exit evidence, recorded once for that milestone;
  and
- delivery status when work begins.

Move detailed architecture, state models, adapter behavior, non-goals, failure
handling, and acceptance criteria out of the roadmap into either the main
design or the matching slice brief. The roadmap is the sole authority for
milestone dependencies, readiness, and exit evidence; linked detailed briefs
own slice acceptance and link to the containing milestone gate. The main design
must not repeat milestone exit paragraphs, and the roadmap must not become a
competing source of architecture or policy.

### 3. Detailed slice briefs

Create one detailed design brief for every roadmap slice. Each brief must be
specific enough to start OpenSpec Explore without reopening settled shared
architecture.

Every slice brief should contain:

- the exact problem and desired result for that slice;
- scope and non-goals;
- relevant main-design decisions and constraints;
- data, state, interfaces, and adapter behavior changed by the slice;
- agent roles, permitted actions, inputs, outputs, and durable handoff
  receipts;
- concurrency, retry, crash recovery, idempotency, and security behavior when
  applicable;
- requirements-to-evidence mapping, including the right mix of unit,
  integration, fault-injection, lifecycle, and acceptance proof;
- compatibility and migration rules;
- open decisions, dependencies, risks, and first OpenSpec action.

## Logical slice briefs

Preserve the roadmap's current milestones and slice boundaries unless a future
design review finds a real dependency conflict:

| Milestone | Detailed briefs |
|---|---|
| M1 — Contract convergence | M1-S1 run and isolated work-unit contract; M1-S2 operations, profiles, gates, and outcomes; M1-S3 runtime configuration provenance |
| M2 — Deterministic local single-change backend | M2-S1 discoverable authoritative history, safe resume/takeover, stale-owner rejection, and one coarse repository claim; M2-S2 deterministic transition engine; M2-S3 canonical status and recovery reporting |
| M3 — Independent-review reliability | M3-S1 strict multi-step artifact delivery; M3-S2 review admission and dispatcher; M3-S3 review/correction binding to the exact code head |
| M4 — Full lifecycle integration and v1 proof | M4-S1 GitHub intake and implementation delivery; M4-S2 Sync and Archive delivery; M4-S3 exact-owned finalization and cleanup; M4-S4 real-completion and disposable-fault qualification |
| M5 — Milestone queues and owner shorthand | M5-S1 milestone/slice queue adapter; M5-S2 design-brief delivery shorthand |
| M6 — Five-slice qualification and default cutover | M6-S1 milestone composition and fault-injection qualification; M6-S2 repeated five-slice unattended delivery; M6-S3 default-path cutover |
| M7 — Optional Temporal execution backend | M7-S1 Temporal execution backend |

The main design carries the generic future-backend rule. M7-S1 alone carries
Temporal-specific workflow, activity, replay, payload, worker, and operations
detail. M7 remains optional, must follow local qualification, and requires its
own sourced design brief and explicit owner decision before Propose.

Fine-grained claims and parallel child or role execution are deliberately not a
current slice. After M4-S4, measured throughput or contention may justify a
separate Explore decision and roadmap slice. Parallelism is not required for
serial five-slice qualification and cannot be introduced implicitly through M5,
M6, or Temporal.

## Confirmed document-refactor sequencing

The owner confirmed and then advanced through this staged approach:

1. **Big picture first:** update the main design with the full system
   architecture, multi-agent operating model, and harness-environment direction;
   reduce the roadmap to dependency mapping and execution order.
2. **Planned briefs, not placeholder links:** first name each future detailed
   brief without creating broken links or implying that it already exists.
3. **Review and iterate:** review the two master documents until the owner is
   satisfied that the whole-system direction is coherent and all material
   decisions are confirmed or clearly recorded as open.
4. **Detail in dependency order:** create the detailed slice briefs, replacing
   each planned-brief entry with a real link only when that brief exists.
5. **Preserve before archive:** perform the source-to-destination migration
   review and archive only verified superseded control-plane sources.

Steps 1 through 4 are now complete in the current workspace. The next planning
checkpoint is owner review of the main design, roadmap, and linked slice briefs.
Step 5 remains blocked until the source-to-destination migration review proves
that no material content would be lost. No OpenSpec change, archive, or control-
plane implementation is authorized unless separately requested.

## Current refactor checkpoint

The first pass now exists in:

- `ai-planning/design-briefs/autonomous-sdd-reliability-control-plane.md` — the
  big-picture authority for architecture, durable execution, multi-agent
  roles/handoffs, harness foundations, risks, open decisions, and the
  linked detailed slice inventory;
- `ai-planning/plans/autonomous-sdd-reliability-control-plane-roadmap.md` — the
  thin dependency/execution map linking all 19 draft detailed briefs;
- `ai-planning/design-briefs/autonomous-sdd-reliability-control-plane/` — the
  19 slice-specific draft design briefs; and
- `ai-planning/design-briefs/ideas/catch-all.md` — the concise durable memory
  pointer and sequencing reminder.

The refactor preserves all 18 prior slice IDs and proposed OpenSpec change
names and adds M4-S4 as the explicit repeated single-change qualification gate,
for 19 slices total. The old roadmap's profile/exposure/recovery rationale and
historical source digest are retained in the main design. No archive, OpenSpec
change, or implementation was created.

## Multi-agent operating model

The main design now defines the full multi-agent model as durable,
role-bounded work units. Preserve these five roles during review and apply them
only where relevant in each future slice brief:

| Role | Owns | Must not do |
|---|---|---|
| Planning agent | Proposal, detailed slice design, requirements, and task plan | Implement code or approve its own planning output |
| Test-and-evidence agent | Requirements-to-evidence map and initial failing unit, integration, fault, lifecycle, or acceptance tests | Quietly weaken requirements or make implementation-policy decisions |
| Implementation agent | Production changes and narrowly scoped supporting tests until approved checks pass | Delete or weaken acceptance tests to manufacture a pass |
| Independent-review agent | Fresh, isolated, read-only review of the exact applied head and evidence | Write code, approve itself, or review a stale head |
| Closeout agent | Delivery PR, Sync, Archive, issue/Project convergence, and exact-owned cleanup | Change implementation behavior after review/Verify without returning through the gates |

The preferred first-release sequence is intentionally a durable serial handoff,
not two agents freely editing the same worktree:

```text
Planning
  -> approved-intent conformance and Apply-eligibility gate
  -> test-and-evidence handoff and recorded suite/evidence receipt
  -> implementation
  -> independent review of the exact current head
  -> objective correction and rereview when required
  -> OpenSpec Verify
  -> closeout
```

Admission first seals the owner's conditional full-lifecycle
`deliveryAuthorization`. The later `applyEligibility` gate is a deterministic
check that planning still conforms to that grant; it is not a second routine
owner authorization. Material drift pauses for an explicit authorization
amendment, while standalone Propose retains its ordinary stop before Apply.

The test-and-evidence worker is broader than a unit-test writer. Requirements
such as recovery, concurrency, cleanup safety, external-state reconciliation,
and future-backend parity cannot be proven by unit tests alone.

Independent review is not OpenSpec Verify:

- reviewer readiness/admission is checked before Apply for strict delivery;
- the actual independent review occurs after current Apply evidence exists;
- current independent-review evidence gates readiness for Verify;
- Verify separately confirms that the completed implementation matches the
  approved OpenSpec artifacts; and
- closeout starts only after current review and Verify evidence are present.

Parallel work may be introduced later only after the control plane proves
separate workspace ownership, resource claims, merge integration, and safe
recovery. Agent roles are logical work units, not an assumption that five
long-lived processes must always run.

## Where the multi-agent model lands in the roadmap

- **M1:** record role identity, role permissions, inputs, outputs, and handoff
  receipts in the contracts and operation graph.
- **M2:** make those handoffs durable, isolated, resumable, stale-owner-safe,
  and discoverable across worktrees and restarts while rejecting another
  mutating run for the same repository.
- **M3:** provide strict independent-review admission, dispatch, exact-head
  binding, and rereview behavior.
- **M4:** provide the closeout worker's exact delivery, reconciliation, and
  cleanup adapters. M4-S3 is the first point where enough exists to begin real
  approved backlog proof; M4-S4 separately requires ten consecutive real
  backlog completions and a complete disposable fault matrix. Expected
  disposable pauses never increment the real-run counter.
- **M5:** coordinate role-bounded child work units across an ordered milestone.
- **M6:** extend the already-qualified single-change engine to milestone faults
  and repeated unattended five-slice runs.
- **M7:** require Temporal to preserve the same role, handoff, evidence, and
  authority rules rather than invent a second model.

## Preservation and archival plan

Do not archive any older brief merely because it is old. For this initiative,
"older" means a control-plane-related brief whose material has been verified as
superseded or preserved by the new main design and slice briefs. Unrelated
repository briefs keep their existing lifecycle.

Before archival:

1. Inventory every control-plane-related design brief, roadmap, research,
   active handoff, and relevant existing OpenSpec material.
2. Build a source-to-destination map for every material decision, requirement,
   risk, assumption, non-goal, acceptance condition, and unresolved question.
3. Draft the main design and all slice briefs while leaving older sources
   intact.
4. Run a final migration review proving each source item is either preserved in
   a named destination or explicitly superseded with a recorded reason.
5. Check for contradictory decisions, broken links, duplicate policy, and any
   behavior still defined only in the roadmap.
6. Obtain the required owner confirmation for material decisions and the
   archival boundary.
7. Move only verified superseded control-plane briefs to the existing dated
   design-brief archive, retaining their content and the migration map.

The migration review must specifically prove that the new detailed documents
retain the prior discussion of durable execution, isolated work units,
concurrency, restart recovery, strict review, cleanup, configuration
provenance, qualification, and optional Temporal support.

## Focused follow-up: harness engineering

The main design now includes the initial harness-engineering foundation:
progressive context, deterministic controls, capability-scoped tools, legible
state, mechanical invariants, feedback loops, observability, documentation
hygiene, and replaceable workers. A later focused exploration may refine those
requirements. Do not treat this handoff as a completed focused assessment.

## Recommended next session

1. Read this handoff, the current main control-plane brief, and the current
   roadmap.
2. Review the two master documents for whole-system coherence, content
   preservation, the single-change v1/M4-S4 proof boundary, open decisions,
   multi-agent boundaries, harness foundations, dependency order, and
   readability.
3. Iterate only on those two master documents and this handoff as directed by
   the owner. Do not create slice briefs, archive sources, open an OpenSpec
   change, or implement the control plane.
4. After the owner accepts the big picture, inventory sources, create detailed
   slice briefs in
   dependency order, and perform the later preservation/archival review.
5. Resume focused harness-engineering exploration against the accepted document
   set when the owner requests it.
