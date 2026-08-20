# Autonomous SDD Reliability Control Plane Roadmap

Date: 2026-08-16

Last updated: 2026-08-19

Status: Owner-directed dependency and execution-order plan under review. It
creates no issue, branch, worktree, OpenSpec change, detailed slice brief,
implementation authorization, or external mutation.

## Purpose and authority

This roadmap is the thin execution map for the
[Autonomous SDD Reliability Control Plane](../design-briefs/autonomous-sdd-reliability-control-plane.md).
The main design owns the outcome, diagnosis, architecture, safety invariants,
multi-agent model, harness foundations, shared implementation direction, risks,
and open decisions. This roadmap owns only:

- milestone and slice order;
- hard dependencies and readiness;
- proposed OpenSpec change names;
- planned detailed-brief names and creation status; and
- milestone exit evidence.

The future detailed briefs named below do not exist yet. Their names are plain
text rather than broken links. The main design's planned-slice inventory
preserves current detail until each brief is created after big-picture review.

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
- Parallel work is allowed only after fresh file/workspace/resource inspection
  proves non-overlap and the control plane can enforce separate ownership.
  The first test-and-evidence to implementation handoff is serial.
- Existing briefs are source inputs to future slice briefs, not competing
  roadmaps or alternative orchestration authorities.
- No planned brief name authorizes creating that brief, an OpenSpec change, or
  implementation.

## Dependency and role-enablement shape

```text
M1 Contract convergence
  establishes state, operation, configuration, role, and handoff contracts
    -> M2 Deterministic local single-change execution
       makes transitions and role handoffs durable and recoverable
      -> M3 Independent-review reliability
         supplies the isolated exact-head reviewer gate
        -> M4 Full lifecycle integration
           supplies delivery, Sync, Archive, and closeout
          -> M5 Milestone queues and owner shorthand
             coordinates dependency-valid child work units
            -> M6 Qualification and default cutover
               proves the complete multi-agent harness and rollback
              -> M7 Optional Temporal backend
                 preserves the same contracts on another durable backend
```

## Planned detailed-brief directory

All planned names are relative to:

`ai-planning/design-briefs/autonomous-sdd-reliability-control-plane/`

Every entry currently has status **not yet created**. A real link replaces the
name only after the file exists and its content has been reviewed against the
main design and source-to-destination map.

## Milestone 1 — Contract convergence

**Outcome:** every component consumes the same run/work-unit, operation,
authorization, configuration, role/handoff, evidence, and outcome contracts.

| Slice | Proposed change | Hard dependencies/readiness | Planned detailed brief |
|---|---|---|---|
| M1-S1 — Run and isolated work-unit contract | `establish-autonomous-sdd-run-v2-contract` | Explore-ready after decisions on registry ownership, parent/child boundary, authoritative history, local durability substrate, and resource-claim authority | `m1-s1-run-and-work-unit-contract.md` — not yet created |
| M1-S2 — Operations, profiles, gates, and outcomes | `unify-autonomous-sdd-operation-contract` | Explore-ready after M1-S1; requires prototype-profile and exact-head-review-reuse decisions | `m1-s2-operation-profile-gate-and-outcome-contract.md` — not yet created |
| M1-S3 — Runtime configuration provenance | `establish-autonomous-sdd-runtime-config-provenance` | Explore-ready after M1-S1; requires configuration-authority decision; may be designed alongside M1-S2 but merges after schema ownership | `m1-s3-runtime-configuration-provenance.md` — not yet created |

**Exit evidence:** resolver output is valid run input; one schema family owns
the four durable scopes and role handoffs; every run has one backend/history
and one claim-provider binding; one operation graph owns gates and outcomes;
validated configuration is consumed unchanged; known cross-contract failures
exist as failing-before/fixed-after tests.

## Milestone 2 — Deterministic local single-change execution

**Outcome:** one local work unit advances through exactly one owned transition
at a time, survives interruption, preserves role handoffs, and reports status
independently of the current working directory.

| Slice | Proposed change | Hard dependencies/readiness | Planned detailed brief |
|---|---|---|---|
| M2-S1 — Local durable execution backend | `add-autonomous-sdd-local-execution-backend` | Propose-ready after all M1 slices and the M1-S1 substrate decision | `m2-s1-local-durable-execution-backend.md` — not yet created |
| M2-S2 — Deterministic transition engine | `add-autonomous-sdd-transition-engine` | Propose-ready after M2-S1 | `m2-s2-deterministic-transition-engine.md` — not yet created |
| M2-S3 — Run status and recovery | `add-autonomous-sdd-run-status-and-recovery` | Propose-ready after M2-S2 | `m2-s3-run-status-and-recovery.md` — not yet created |

**Exit evidence:** a fake-adapter single-change run completes without
conversational re-entry; role receipts remain bound across restart;
kill/restart, stale-fence, concurrent-writer, cross-run claim, and worktree-
discovery tests pass; status agrees from every worktree; no real external
mutation or production-review claim is made.

## Milestone 3 — Independent-review reliability

**Outcome:** strict reviewer capability is proven before Apply, and a fresh
isolated reviewer produces reusable exact-head evidence after Apply without
owner transport or redundant review of unchanged code.

| Slice | Proposed change | Hard dependencies/readiness | Planned detailed brief |
|---|---|---|---|
| M3-S1 — Strict-review artifact delivery | `harden-strict-review-multistep-artifact-delivery` | Propose-ready after M2 interfaces and M1 contracts; reconcile any authoritative existing change/worktree first | `m3-s1-strict-review-artifact-delivery.md` — not yet created |
| M3-S2 — Review admission and dispatch | `add-autonomous-sdd-review-admission-and-dispatcher` | Propose-ready after M3-S1 and M1-S3 | `m3-s2-review-admission-and-dispatch.md` — not yet created |
| M3-S3 — Exact-head review and correction | `bind-autonomous-review-to-code-head` | Explore-ready after M3-S2 and owner decision on review reuse | `m3-s3-exact-head-review-and-correction.md` — not yet created |

**Exit evidence:** strict readiness is proven before implementation; a real
multi-step reviewer returns accepted exact-head evidence through one
dispatcher; objective correction/rereview completes within budget without
owner relay; changed heads invalidate review and unchanged heads do not launch
redundant reviewers.

## Milestone 4 — Full lifecycle integration

**Outcome:** one authorized change runs from planning through implementation
delivery, Sync, Archive, issue/Project convergence, and exact-owned cleanup.

| Slice | Proposed change | Hard dependencies/readiness | Planned detailed brief |
|---|---|---|---|
| M4-S1 — GitHub intake and implementation delivery | `integrate-autonomous-sdd-github-delivery` | Propose-ready after M3 and a disposable GitHub fixture strategy | `m4-s1-github-intake-and-implementation-delivery.md` — not yet created |
| M4-S2 — Sync and Archive delivery | `integrate-autonomous-sdd-sync-and-archive` | Propose-ready after M4-S1 | `m4-s2-sync-and-archive-delivery.md` — not yet created |
| M4-S3 — Finalization and cleanup | `integrate-autonomous-sdd-finalization-and-cleanup` | Propose-ready after M4-S2 and M2-S1 | `m4-s3-finalization-and-cleanup.md` — not yet created |

**Exit evidence:** a disposable real change completes with zero routine owner
prompts; external actions are exact, current, idempotent, fenced, claimed, and
recoverable after remote-success/local-receipt loss; strict review remains
current without duplicate launch; unrelated and dirty resources remain intact.

## Milestone 5 — Milestone queues and owner shorthand

**Outcome:** one approved milestone becomes dependency-valid isolated child
work units, and a concise owner request enters or resumes the same engine.

| Slice | Proposed change | Hard dependencies/readiness | Planned detailed brief |
|---|---|---|---|
| M5-S1 — Milestone/slice queue | `add-autonomous-sdd-milestone-slice-adapter` | Explore-ready after M4 and owner acceptance of milestone cadence | `m5-s1-milestone-slice-queue.md` — not yet created |
| M5-S2 — Design-brief delivery shorthand | `add-autonomous-design-brief-delivery-shorthand` | Propose-ready after M5-S1, M1-S2, and prototype-profile resolution | `m5-s2-design-brief-delivery-shorthand.md` — not yet created |

**Exit evidence:** five fake slices run in exact dependency order; each child's
authority, context, role receipts, attempts, evidence, claims, and cleanup are
isolated; parent projections rebuild from child state; shorthand only resolves
inputs and invokes the canonical engine; status reports exact milestone, slice,
role, transition, and stop reason.

## Milestone 6 — Qualification and default cutover

**Outcome:** the complete multi-agent control-plane harness is proven under
failure and repeated real delivery before becoming the default path.

| Slice | Proposed change | Hard dependencies/readiness | Planned detailed brief |
|---|---|---|---|
| M6-S1 — Composition and fault qualification | `qualify-autonomous-sdd-composition-reliability` | Propose-ready after M5 | `m6-s1-composition-and-fault-qualification.md` — not yet created |
| M6-S2 — Five-slice unattended qualification | `qualify-autonomous-sdd-five-slice-soak` | Propose-ready after M6-S1, owner-selected threshold, and disposable end-to-end environment | `m6-s2-five-slice-unattended-qualification.md` — not yet created |
| M6-S3 — Default control-plane cutover | `enable-autonomous-sdd-control-plane-default` | Conditional on M6-S2 threshold and explicit owner approval | `m6-s3-default-control-plane-cutover.md` — not yet created |

**Exit evidence:** composition, role-handoff, restart, concurrency, external-
receipt-loss, review, correction, cleanup, backend, and claim-provider suites
pass; repeated real five-slice runs meet the owner threshold with zero routine
prompts; failures and harness-health metrics remain visible; default and audit-
mode rollback are both proven without weakening gates.

## Milestone 7 — Optional Temporal execution backend

**Outcome:** Temporal can run the qualified contracts without becoming
mandatory, changing domain policy, or creating another authority.

| Slice | Proposed change | Hard dependencies/readiness | Planned detailed brief |
|---|---|---|---|
| M7-S1 — Temporal execution backend | `add-autonomous-sdd-temporal-execution-backend` | Conditional/Explore-ready after M6, a current sourced Temporal assessment, deployment/data/versioning/ownership decisions, and explicit owner adoption | `m7-s1-temporal-execution-backend.md` — not yet created |

**Exit evidence:** Temporal passes the same role, handoff, lifecycle,
fault-injection, exact-prompt, security, and five-unit outcome suites as local
execution; replay/versioning, duplicate Activities, worker/service failure,
Continue-As-New, projection rebuild, and payload safety pass; local and
Temporal runs serialize overlapping work through one claim authority.

## Recommended starting point

Review and iterate on the main design and this roadmap before creating any
detailed slice brief. Once the two-master-document direction is accepted,
create M1-S1's planned brief first and run OpenSpec Explore. That Explore must
resolve registry ownership, parent/child boundaries, the local durability
substrate and concurrency threat model, authoritative history, and resource-
claim authority before Propose.

## Roadmap integrity checklist

- Every slice has one outcome, proposed change, dependency/readiness statement,
  planned detailed-brief name/status, and milestone exit evidence.
- Detailed behavior lives in the main design's transitional inventory until a
  real slice brief exists; it is never defined only in this roadmap.
- No slice claims a created brief, issue, change, branch, PR, approval, or
  implementation.
- Each delivered change must leave the repository coherent and recoverable.
- Milestone gates measure integrated behavior rather than file presence or
  component fixtures alone.
- Temporal remains optional and post-qualification.
