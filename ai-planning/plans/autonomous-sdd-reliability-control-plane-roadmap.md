# Autonomous SDD Reliability Control Plane Roadmap

Date: 2026-08-16

Last updated: 2026-08-20

Status: Owner-directed dependency and execution-order plan under review. Its
linked slice briefs are draft planning records; neither this roadmap nor those
briefs create an issue, branch, worktree, OpenSpec change, implementation
authorization, or external mutation.

## Purpose and authority

This roadmap is the thin execution map for the
[Autonomous SDD Reliability Control Plane](../design-briefs/autonomous-sdd-reliability-control-plane.md).
The main design owns the outcome, diagnosis, architecture, safety invariants,
multi-agent model, harness foundations, shared implementation direction, risks,
and open decisions. This roadmap is the sole authority for milestone
dependencies, readiness, and exit evidence. Within that boundary, it contains
only:

- milestone and slice order;
- hard dependencies and readiness;
- proposed OpenSpec change names;
- linked detailed-brief names and review status; and
- milestone exit evidence.

Every slice below links to its draft detailed brief. Those briefs preserve the
slice-specific design and acceptance direction for review; their existence does
not mean the slice is accepted, Propose-ready, or authorized for delivery.

## Delivery rules

- Each slice is one independently reviewable semantic OpenSpec change with its
  own later proposal, specs, design, tasks, implementation review, Verify,
  delivery, Sync, Archive, and exact-owned cleanup.
- A milestone groups outcomes; it is not one oversized change.
- Every slice defaults to `production-rapid` because it changes reusable
  authorization, orchestration, review, or delivery controls. Strict isolated
  independent review remains mandatory unless an owner-approved profile says
  otherwise.
- `Explore-ready` means named decisions must be resolved before Propose.
  `Propose-ready` means its hard dependencies and observable behavior are
  defined, but explicit lifecycle authorization is still required.
  `Conditional` means earlier evidence or an owner decision determines whether
  the slice proceeds.
- Re-read Git, worktrees, OpenSpec, GitHub, configuration, authoritative run
  history, resource claims, and current evidence before selecting any slice.
- A later slice starts only when every hard dependency is delivered and the
  relevant milestone exit evidence remains current.
- Single-change v1 ends at M4-S4. M4-S3 is the first point where the complete
  real lifecycle exists and approved backlog runs can begin; M4-S4 proves that
  path safely and repeatedly. M5, M6, and M7 remain blocked until that proof.
- V1 admits at most one active mutating autonomous run per canonical
  repository. Disjoint concurrent runs, fine-grained claims, parallel child
  execution, milestone queues, five-slice delivery, and Temporal are later
  expansion behavior.
- Parallel work is allowed only after fresh file/workspace/resource inspection
  proves non-overlap and the control plane can enforce separate ownership.
  The first test-and-evidence to implementation handoff is serial.
- Existing earlier briefs are source inputs to the linked slice briefs, not competing
  roadmaps or alternative orchestration authorities.
- Linked detailed briefs own slice-specific acceptance criteria and evidence;
  they link to but do not redefine the containing roadmap milestone gate.
- No linked brief authorizes creating an OpenSpec change or implementation.

## Dependency and role-enablement shape

```text
M1 Contract convergence
  establishes state, operation, configuration, role, and handoff contracts
    -> M2 Deterministic local single-change execution
       makes transitions and role handoffs durable and recoverable
      -> M3 Independent-review reliability
         supplies the isolated exact-head reviewer gate
        -> M4 Full lifecycle integration
           supplies delivery, Sync, Archive, closeout, and repeated
           single-change qualification
             M4-S3: enough exists to begin real backlog proof
             M4-S4: proof gate passes and single-change v1 is qualified
          -> M5 Milestone queues and owner shorthand
             coordinates dependency-valid child work units
            -> M6 Five-slice qualification and default cutover
               proves milestone execution, the complete multi-agent harness,
               and rollback
              -> M7 Optional Temporal backend
                 preserves the same contracts on another durable backend
```

## Planned detailed-brief directory

All planned names are relative to:

`ai-planning/design-briefs/autonomous-sdd-reliability-control-plane/`

Every entry now links to a draft slice brief. A brief remains a review input,
not an approved OpenSpec change or implementation authorization. The roadmap
remains the sole authority for milestone dependencies, readiness, and exit
evidence.

## Milestone 1 — Contract convergence

**Outcome:** every component consumes the same run/work-unit, operation,
authorization, configuration, role/handoff, evidence, and outcome contracts.

| Slice | Proposed change | Hard dependencies/readiness | Planned detailed brief |
|---|---|---|---|
| M1-S1 — Run and isolated work-unit contract | `establish-autonomous-sdd-run-v2-contract` | Explore-ready after decisions on registry ownership, parent/child boundary, authoritative history, the one-active-mutating-run v1 threat model, local durability substrate, and coarse resource-claim authority | [M1-S1 brief](../design-briefs/autonomous-sdd-reliability-control-plane/m1-s1-run-and-work-unit-contract.md) |
| M1-S2 — Operations, profiles, gates, and outcomes | `unify-autonomous-sdd-operation-contract` | Explore-ready after M1-S1; requires prototype-profile and exact-head-review-reuse decisions | [M1-S2 brief](../design-briefs/autonomous-sdd-reliability-control-plane/m1-s2-operation-profile-gate-and-outcome-contract.md) |
| M1-S3 — Runtime configuration provenance | `establish-autonomous-sdd-runtime-config-provenance` | Explore-ready after M1-S1; requires configuration-authority decision; may be designed alongside M1-S2 but merges after schema ownership | [M1-S3 brief](../design-briefs/autonomous-sdd-reliability-control-plane/m1-s3-runtime-configuration-provenance.md) |

**Exit evidence:** resolver output is valid run input; one schema family owns
the four durable scopes and role handoffs; every run has one backend/history
and one claim-provider binding; one operation graph owns gates and outcomes;
validated configuration is consumed unchanged; known cross-contract failures
exist as failing-before/fixed-after tests; unknown or malformed outcomes pause
without retry or external continuation.

## Milestone 2 — Deterministic local single-change execution

**Outcome:** one local work unit advances through exactly one owned transition
at a time, survives interruption, preserves role handoffs, rejects another
mutating run for the same repository, and reports status independently of the
current working directory.

| Slice | Proposed change | Hard dependencies/readiness | Planned detailed brief |
|---|---|---|---|
| M2-S1 — Local durable execution backend | `add-autonomous-sdd-local-execution-backend` | Propose-ready after all M1 slices and an M1-S1 decision on the smallest substrate that proves authoritative history, atomic advancement, exact resume/takeover, stale-owner rejection, and one coarse repository claim | [M2-S1 brief](../design-briefs/autonomous-sdd-reliability-control-plane/m2-s1-local-durable-execution-backend.md) |
| M2-S2 — Deterministic transition engine | `add-autonomous-sdd-transition-engine` | Propose-ready after M2-S1 | [M2-S2 brief](../design-briefs/autonomous-sdd-reliability-control-plane/m2-s2-deterministic-transition-engine.md) |
| M2-S3 — Run status and recovery | `add-autonomous-sdd-run-status-and-recovery` | Propose-ready after M2-S2 | [M2-S3 brief](../design-briefs/autonomous-sdd-reliability-control-plane/m2-s3-run-status-and-recovery.md) |

**Exit evidence:** a non-mutating simulated-adapter single-change run completes
without conversational re-entry; role receipts remain bound across restart;
kill/restart, stale-owner, exact takeover, conflicting-run rejection, coarse-
claim, and worktree-discovery tests pass; status agrees from every worktree; no
real Apply, external mutation, or production-review claim is made.

## Milestone 3 — Independent-review reliability

**Outcome:** strict reviewer capability is proven before Apply, and a fresh
isolated reviewer produces reusable exact-head evidence after Apply without
owner transport or redundant review of unchanged code.

| Slice | Proposed change | Hard dependencies/readiness | Planned detailed brief |
|---|---|---|---|
| M3-S1 — Strict-review artifact delivery | `harden-strict-review-multistep-artifact-delivery` | Propose-ready after M2 interfaces and M1 contracts; reconcile any authoritative existing change/worktree first | [M3-S1 brief](../design-briefs/autonomous-sdd-reliability-control-plane/m3-s1-strict-review-artifact-delivery.md) |
| M3-S2 — Review admission and dispatch | `add-autonomous-sdd-review-admission-and-dispatcher` | Propose-ready after M3-S1 and M1-S3 | [M3-S2 brief](../design-briefs/autonomous-sdd-reliability-control-plane/m3-s2-review-admission-and-dispatch.md) |
| M3-S3 — Exact-head review and correction | `bind-autonomous-review-to-code-head` | Explore-ready after M3-S2 and owner decision on review reuse | [M3-S3 brief](../design-briefs/autonomous-sdd-reliability-control-plane/m3-s3-exact-head-review-and-correction.md) |

**Exit evidence:** strict readiness is proven before implementation; a real
multi-step reviewer returns accepted exact-head evidence through one
dispatcher; objective correction/rereview completes within budget without
owner relay; changed heads invalidate review and unchanged heads do not launch
redundant reviewers. No real mutating Apply adapter may be enabled before this
milestone exits.

## Milestone 4 — Full lifecycle integration

**Outcome:** one authorized change runs from planning through implementation
delivery, Sync, Archive, issue/Project convergence, and exact-owned cleanup,
then the same complete path is proven repeatedly against eligible approved
backlog changes.

| Slice | Proposed change | Hard dependencies/readiness | Planned detailed brief |
|---|---|---|---|
| M4-S1 — GitHub intake and implementation delivery | `integrate-autonomous-sdd-github-delivery` | Propose-ready after M3 and a disposable GitHub fixture strategy | [M4-S1 brief](../design-briefs/autonomous-sdd-reliability-control-plane/m4-s1-github-intake-and-implementation-delivery.md) |
| M4-S2 — Sync and Archive delivery | `integrate-autonomous-sdd-sync-and-archive` | Propose-ready after M4-S1 | [M4-S2 brief](../design-briefs/autonomous-sdd-reliability-control-plane/m4-s2-sync-and-archive-delivery.md) |
| M4-S3 — Finalization and cleanup | `integrate-autonomous-sdd-finalization-and-cleanup` | Propose-ready after M4-S2 and M2-S1 | [M4-S3 brief](../design-briefs/autonomous-sdd-reliability-control-plane/m4-s3-finalization-and-cleanup.md) |
| M4-S4 — Single-change reliability qualification | `qualify-autonomous-sdd-single-change-reliability` | Propose-ready after M4-S3, approved thresholds, an approved scenario-to-environment/counter matrix, proven disposable fault environments, and a set of individually approved eligible backlog changes | [M4-S4 brief](../design-briefs/autonomous-sdd-reliability-control-plane/m4-s4-single-change-reliability-qualification.md) |

**Proof boundary:** M4-S3 is the first point where enough has been built to
start proving one approved change can complete safely and repeatedly. The
owner's eligible skills backlog can supply real varied changes during M4-S4,
but every item still requires its own accepted brief, exact authorization,
profile, evidence contract, and stop conditions.

**Exit evidence:** two separately counted gates pass: ten consecutive real
backlog changes complete through closeout, and every approved disposable fault-
matrix row reaches its expected recovery or typed pause. Disposable scenarios
never increment the ten-run count; disruptive faults are not injected into real
backlog work. There are zero false passes, duplicate or unaccounted mutations,
unrelated or dirty-resource changes, routine prompts inside valid authority,
unresolved terminal leaks, or untyped stops. M4 exit qualifies single-change
v1 for explicit opt-in use and is the hard gate for M5.

## Milestone 5 — Milestone queues and owner shorthand

**Outcome:** one approved milestone becomes dependency-valid isolated child
work units, and a concise owner request enters or resumes the same engine.

| Slice | Proposed change | Hard dependencies/readiness | Planned detailed brief |
|---|---|---|---|
| M5-S1 — Milestone/slice queue | `add-autonomous-sdd-milestone-slice-adapter` | Explore-ready only after M4-S4 qualifies repeated real single-change delivery and the owner accepts milestone cadence | [M5-S1 brief](../design-briefs/autonomous-sdd-reliability-control-plane/m5-s1-milestone-slice-queue.md) |
| M5-S2 — Design-brief delivery shorthand | `add-autonomous-design-brief-delivery-shorthand` | Propose-ready after M5-S1, M1-S2, and prototype-profile resolution | [M5-S2 brief](../design-briefs/autonomous-sdd-reliability-control-plane/m5-s2-design-brief-delivery-shorthand.md) |

**Exit evidence:** five fake slices run in exact dependency order; each child's
authority, context, role receipts, attempts, evidence, claims, and cleanup are
isolated; parent projections rebuild from child state; shorthand only resolves
inputs and invokes the canonical engine; status reports exact milestone, slice,
role, transition, and stop reason.

## Milestone 6 — Five-slice qualification and default cutover

**Outcome:** the already-qualified single-change engine is extended and proven
for milestone/child composition, repeated real five-slice delivery, and safe
default routing with rollback.

| Slice | Proposed change | Hard dependencies/readiness | Planned detailed brief |
|---|---|---|---|
| M6-S1 — Milestone composition and fault qualification | `qualify-autonomous-sdd-composition-reliability` | Propose-ready after M5; extends rather than repeats the M4-S4 single-change suite | [M6-S1 brief](../design-briefs/autonomous-sdd-reliability-control-plane/m6-s1-composition-and-fault-qualification.md) |
| M6-S2 — Five-slice unattended qualification | `qualify-autonomous-sdd-five-slice-soak` | Propose-ready after M6-S1, owner confirmation or adjustment of the proposed three-run threshold, and a disposable end-to-end environment | [M6-S2 brief](../design-briefs/autonomous-sdd-reliability-control-plane/m6-s2-five-slice-unattended-qualification.md) |
| M6-S3 — Default control-plane cutover | `enable-autonomous-sdd-control-plane-default` | Conditional on M6-S2 threshold and explicit owner approval | [M6-S3 brief](../design-briefs/autonomous-sdd-reliability-control-plane/m6-s3-default-control-plane-cutover.md) |

**Exit evidence:** milestone composition, child isolation, role-handoff,
restart, dependency-failure, queue-rebuild, review, correction, cleanup,
backend, and claim-provider suites pass; at least three consecutive real
five-slice multi-hour runs meet the zero-tolerance safety criteria with zero
routine prompts; failures and harness-health metrics remain visible; default
and audit-mode rollback are both proven without weakening gates. Fine-grained
parallel execution remains separately gated.

## Deferred parallel-execution gate

Fine-grained claims and parallel child or role execution become eligible for a
separate Explore decision only after M4-S4 qualifies serial single-change v1.
They are not silently included in M5 or M6 and are not required for serial
five-slice qualification. A future slice is added only when measured throughput
or contention justifies it and the owner accepts its workspace ownership,
claim, integration-order, review, and recovery design. Temporal cannot be used
as a shortcut around this gate.

## Milestone 7 — Optional Temporal execution backend

**Outcome:** Temporal can run the qualified contracts without becoming
mandatory, changing domain policy, or creating another authority.

| Slice | Proposed change | Hard dependencies/readiness | Planned detailed brief |
|---|---|---|---|
| M7-S1 — Temporal execution backend | `add-autonomous-sdd-temporal-execution-backend` | Conditional/Explore-ready after M6, a current sourced Temporal assessment, deployment/data/versioning/ownership decisions, and explicit owner adoption | [M7-S1 brief](../design-briefs/autonomous-sdd-reliability-control-plane/m7-s1-temporal-execution-backend.md) |

**Exit evidence:** Temporal passes the same role, handoff, lifecycle,
fault-injection, exact-prompt, security, and five-unit outcome suites as local
execution; replay/versioning, duplicate Activities, worker/service failure,
Continue-As-New, projection rebuild, and payload safety pass; local and
Temporal runs serialize overlapping work through one claim authority.

## Recommended starting point

Review the main design, this roadmap, and linked slice briefs. Begin with the
M1-S1 brief and run OpenSpec Explore only after the owner accepts it. That
Explore must resolve registry ownership, parent/child boundaries, the local
durability substrate and concurrency threat model, authoritative history,
resource-claim authority, and the complexity guardrail before Propose.

## Roadmap integrity checklist

- Every slice has one outcome, proposed change, dependency/readiness statement,
  linked draft brief, and milestone exit evidence.
- Detailed behavior lives in the linked brief and shared architecture in the
  main design; it is never defined only in this roadmap.
- No slice claims a created brief, issue, change, branch, PR, approval, or
  implementation.
- Each delivered change must leave the repository coherent and recoverable.
- Milestone gates measure integrated behavior rather than file presence or
  component fixtures alone.
- M4-S3 remains the start of real backlog proof; only M4-S4 exit qualifies
  repeated single-change v1 and unblocks milestone expansion.
- Temporal remains optional and post-qualification.
