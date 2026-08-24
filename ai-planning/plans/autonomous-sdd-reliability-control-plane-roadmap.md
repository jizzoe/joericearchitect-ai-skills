# Autonomous SDD Reliability Control Plane Roadmap

Date: 2026-08-16

Last updated: 2026-08-24

Status: Accepted dependency and execution-order plan through M1 and the
bootstrap/cutover stabilization. M1-S1, M1-S2, and M1-S3 are delivered and
archived. M2 is re-sequenced to prove a vertical slice before the durable
backend (2026-08-23 revision), and a first-class M5 cross-repository
coordination milestone is added. M2-S1 is delivered and archived; M2-S2 is
next. Every slice still requires its own accepted brief and explicit
authorization.

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
- OpenSpec change names;
- linked detailed-brief names and review/delivery status; and
- milestone exit evidence.

Every slice below links to its detailed brief. Delivered briefs record accepted
design and evidence; undelivered briefs preserve design and acceptance
direction for review. A brief never grants authorization for another delivery.

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
- Contract publication is not activation. The operating modes are
  `contract-only`, `audit/shadow`, `bootstrap-hybrid`, `qualified-opt-in`, and
  `default`, and exactly one runtime generation owns mutation in every mode.
- Runtime N-1 delivers and archives runtime N. N is installed afterward for
  later work and is never required to prove its own releasing change complete.
  Self-referential release tasks are split before Propose readiness.
- Real ownership remains disabled until one released generation implements and
  qualifies initialization, claim/fencing, advancement, recovery,
  terminalization, claim release, external convergence, exact cleanup, and
  rollback as one minimum vertical activation bundle.
- Single-change v1 ends at M4-S4. M4-S3 is the first point where the complete
  real lifecycle exists and approved backlog runs can begin; M4-S4 proves that
  path safely and repeatedly. M5, M6, M7, and M8 remain blocked until that proof.
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

## Deferred external-tracker integration gate

The current control-plane roadmap uses configured GitHub Issues and Projects
only. Jira linkage is not inferred from branch names, research references, or a
future connector. Before any Jira issue creation, Jira-to-OpenSpec binding, or
Jira lifecycle mutation is proposed, recover the accepted Jira-linkage rules
and create a dedicated accepted slice defining tracker authority, configured
identifiers, GitHub/OpenSpec/PR relationships, authorization, idempotent
reconciliation, evidence, and failure behavior. Until then, Jira remains out
of scope and GitHub remains the only implemented tracker integration. See
[`ad-hoc-follow-ups.md`](../notes/ad-hoc-follow-ups.md).

## Dependency and role-enablement shape

```text
M1 Contract convergence
  delivered state, operation, configuration, role, and handoff contracts
    -> M2 Deterministic local single-change execution
       proves a vertical slice, then builds durable transitions and recovery
       in contract-only/audit mode
      -> M3 Independent-review reliability
         supplies the isolated exact-head reviewer gate
        -> M4 Full lifecycle integration
           supplies delivery, Sync, Archive, closeout, and repeated
           single-change qualification
             M4-S3: enough exists to begin real backlog proof
             M4-S4: proof gate passes; qualified opt-in can begin
          -> M5 Cross-repository SDD coordination
             spans a central planning repository and component repositories
            -> M6 Milestone queues and owner shorthand
               coordinates dependency-valid child work units
              -> M7 Five-slice qualification and default cutover
                 proves milestone execution, the complete multi-agent harness,
                 and rollback; M7-S3 alone enables default mode
                -> M8 Optional Temporal backend
                   preserves the same contracts on another durable backend
```

## Planned detailed-brief directory

All planned names are relative to:

`ai-planning/design-briefs/autonomous-sdd-reliability-control-plane/`

Every entry links to its slice brief. Delivered briefs are historical design
and evidence records; undelivered briefs remain review inputs rather than
implementation authorization. The roadmap remains the sole authority for
milestone dependencies, readiness, and exit evidence.

## Milestone 1 — Contract convergence

**Outcome:** every component consumes the same run/work-unit, operation,
authorization, configuration, role/handoff, evidence, and outcome contracts.

| Slice | Proposed change | Hard dependencies/readiness | Planned detailed brief |
|---|---|---|---|
| M1-S1 — Run and isolated work-unit contract | `establish-autonomous-sdd-run-v2-contract` | Delivered and archived via issue #150 and implementation/Sync/Archive PRs #151/#152/#153; its early operational admission is retrospectively constrained by the activation lane below | [M1-S1 brief](../design-briefs/autonomous-sdd-reliability-control-plane/m1-s1-run-and-work-unit-contract.md) |
| M1-S2 — Operations, profiles, gates, and outcomes | `unify-autonomous-sdd-operation-contract` | Delivered and archived via issue #158 and PRs #159/#160/#161; accepted Q1-Q6 decisions are reconciled in the brief, and terminalization repair #162/#163/#164 closes its stranded bootstrap run | [M1-S2 brief](../design-briefs/autonomous-sdd-reliability-control-plane/m1-s2-operation-profile-gate-and-outcome-contract.md) |
| M1-S3 — Runtime configuration provenance | `establish-autonomous-sdd-runtime-config-provenance` | Delivered and archived; owner confirmed bounded layered authority, versioned product-config namespace, and fail-closed conflicts | [M1-S3 brief](../design-briefs/autonomous-sdd-reliability-control-plane/m1-s3-runtime-configuration-provenance.md) |

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
| M2-S1 — Prove the vertical slice | `prove-autonomous-sdd-vertical-slice` | Delivered and archived via issue #207 and PRs #208/#209/#210; proves one fixture change flows proposal → apply → verify → fresh-review-on-change under simulated/non-mutating adapters, a thin sealed review loop, and a minimal ephemeral store; fixture template is `add-typescript-javascript-review`; delivered by the pre-v2 lifecycle, never by the controller it builds | [M2-S1 brief](../design-briefs/autonomous-sdd-reliability-control-plane/m2-s1-prove-vertical-slice.md) |
| M2-S2 — Local durable execution backend | `add-autonomous-sdd-local-execution-backend` | Next; follows delivered M2-S1; hardens controller/admission pairing, history, atomic advancement, exact resume/takeover, stale-owner rejection, and one coarse claim, scoped by the proven slice; stays contract-only/audit and does not activate real lifecycle ownership | [M2-S2 brief](../design-briefs/autonomous-sdd-reliability-control-plane/m2-s2-local-durable-execution-backend.md) |
| M2-S3 — Run status and recovery | `add-autonomous-sdd-run-status-and-recovery` | Follows M2-S2; completes local recovery/status prerequisites without activating real external mutation | [M2-S3 brief](../design-briefs/autonomous-sdd-reliability-control-plane/m2-s3-run-status-and-recovery.md) |

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
| M4-S1 — GitHub intake and implementation delivery | `integrate-autonomous-sdd-github-delivery` | After M3 and a disposable GitHub fixture strategy; must include the exact restricted-controller/authenticated-host request-and-receipt envelope plus merge-policy and retained-branch preflight/restoration evidence | [M4-S1 brief](../design-briefs/autonomous-sdd-reliability-control-plane/m4-s1-github-intake-and-implementation-delivery.md) |
| M4-S2 — Sync and Archive delivery | `integrate-autonomous-sdd-sync-and-archive` | After M4-S1; must graph all active overlapping deltas before mutation and compare accepted requirement descriptions plus scenarios exactly | [M4-S2 brief](../design-briefs/autonomous-sdd-reliability-control-plane/m4-s2-sync-and-archive-delivery.md) |
| M4-S3 — Finalization and cleanup | `integrate-autonomous-sdd-finalization-and-cleanup` | After M4-S2 and M2-S1; completes terminal convergence, release, and exact receipt-backed cleanup as part of the activation bundle | [M4-S3 brief](../design-briefs/autonomous-sdd-reliability-control-plane/m4-s3-finalization-and-cleanup.md) |
| M4-S4 — Single-change reliability qualification | `qualify-autonomous-sdd-single-change-reliability` | After M4-S3, approved thresholds/matrix/environments, and individually approved eligible changes; it is the only gate that may enable qualified-opt-in ownership | [M4-S4 brief](../design-briefs/autonomous-sdd-reliability-control-plane/m4-s4-single-change-reliability-qualification.md) |

**Proof boundary:** M4-S3 is the first point where enough has been built to
start proving one approved change can complete safely and repeatedly. The
owner's eligible skills backlog can supply real varied changes during M4-S4,
but every item still requires its own accepted brief, exact authorization,
profile, evidence contract, and stop conditions.

The accepted M4-S4 backlog order is: `add-claude-cross-tool-repo-hygiene`,
`add-generic-git-repository-cleanup`, `add-typescript-javascript-review`,
`add-react-web-review`, `add-react-native-expo-quality-overlay`,
`add-java-spring-review`, `add-terraform-static-quality-overlay`,
`add-repository-status-skill`, `add-git-health-skill`, and
`deliver-research-and-planning-base-skills`. Each real run must preflight for
overlapping active deltas before Sync.

**Exit evidence:** two separately counted gates pass: ten consecutive real
backlog changes complete through closeout, and every approved disposable fault-
matrix row reaches its expected recovery or typed pause. Disposable scenarios
never increment the ten-run count; disruptive faults are not injected into real
backlog work. There are zero false passes, duplicate or unaccounted mutations,
unrelated or dirty-resource changes, routine prompts inside valid authority,
unresolved terminal leaks, or untyped stops. M4 exit qualifies single-change
v1 for explicit opt-in use and is the hard gate for M5. It does not enable
default routing.

## Milestone 5 — Cross-repository SDD coordination

**Outcome:** one authorized change spans a central planning repository and one
or more component repositories, with the central change opening first and
closing last and component changes archiving inside it. This is a first-class
milestone, not a deferred parallel-execution concern.

| Slice | Proposed change | Hard dependencies/readiness | Planned detailed brief |
|---|---|---|---|
| M5-S1 — Cross-repository coordination | `add-autonomous-sdd-cross-repository-coordination` | Gated after M4-S4 qualifies repeated single-change v1; reuses the linkage-ledger and open-first/close-last sequencing proven by the Invest-in-Growth (HRF) central/component project | [M5-S1 brief](../design-briefs/autonomous-sdd-reliability-control-plane/cross-repository-coordination.md) |

**Exit evidence:** one central envelope change and one or more component
changes complete with the central change opening first and closing last; the
linkage ledger records dispatch and return against exact revisions; end-to-end
verification names an assigned executor, environment, and evidence location.

## Milestone 6 — Milestone queues and owner shorthand

**Outcome:** one approved milestone becomes dependency-valid isolated child
work units, and a concise owner request enters or resumes the same engine.

| Slice | Proposed change | Hard dependencies/readiness | Planned detailed brief |
|---|---|---|---|
| M6-S1 — Milestone/slice queue | `add-autonomous-sdd-milestone-slice-adapter` | Explore-ready only after M4-S4 qualifies repeated real single-change delivery and the owner accepts milestone cadence | [M6-S1 brief](../design-briefs/autonomous-sdd-reliability-control-plane/m6-s1-milestone-slice-queue.md) |
| M6-S2 — Design-brief delivery shorthand | `add-autonomous-design-brief-delivery-shorthand` | Propose-ready after M6-S1, M1-S2, and prototype-profile resolution | [M6-S2 brief](../design-briefs/autonomous-sdd-reliability-control-plane/m6-s2-design-brief-delivery-shorthand.md) |

**Exit evidence:** five fake slices run in exact dependency order; each child's
authority, context, role receipts, attempts, evidence, claims, and cleanup are
isolated; parent projections rebuild from child state; shorthand only resolves
inputs and invokes the canonical engine; status reports exact milestone, slice,
role, transition, and stop reason.

## Milestone 7 — Five-slice qualification and default cutover

**Outcome:** the already-qualified single-change engine is extended and proven
for milestone/child composition, repeated real five-slice delivery, and safe
default routing with rollback.

| Slice | Proposed change | Hard dependencies/readiness | Planned detailed brief |
|---|---|---|---|
| M7-S1 — Milestone composition and fault qualification | `qualify-autonomous-sdd-composition-reliability` | Propose-ready after M6; extends rather than repeats the M4-S4 single-change suite | [M7-S1 brief](../design-briefs/autonomous-sdd-reliability-control-plane/m7-s1-composition-and-fault-qualification.md) |
| M7-S2 — Five-slice unattended qualification | `qualify-autonomous-sdd-five-slice-soak` | Propose-ready after M7-S1, owner confirmation or adjustment of the proposed three-run threshold, and a disposable end-to-end environment | [M7-S2 brief](../design-briefs/autonomous-sdd-reliability-control-plane/m7-s2-five-slice-unattended-qualification.md) |
| M7-S3 — Default control-plane cutover | `enable-autonomous-sdd-control-plane-default` | Conditional on M7-S2 threshold, tested rollback, no competing active owner, and explicit owner approval; sole authority for `default` mode | [M7-S3 brief](../design-briefs/autonomous-sdd-reliability-control-plane/m7-s3-default-control-plane-cutover.md) |

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
They are not silently included in M6 or M7 and are not required for serial
five-slice qualification. A future slice is added only when measured throughput
or contention justifies it and the owner accepts its workspace ownership,
claim, integration-order, review, and recovery design. Temporal cannot be used
as a shortcut around this gate.

## Milestone 8 — Optional Temporal execution backend

**Outcome:** Temporal can run the qualified contracts without becoming
mandatory, changing domain policy, or creating another authority.

| Slice | Proposed change | Hard dependencies/readiness | Planned detailed brief |
|---|---|---|---|
| M8-S1 — Temporal execution backend | `add-autonomous-sdd-temporal-execution-backend` | Conditional/Explore-ready after M7, a current sourced Temporal assessment, deployment/data/versioning/ownership decisions, and explicit owner adoption | [M8-S1 brief](../design-briefs/autonomous-sdd-reliability-control-plane/m8-s1-temporal-execution-backend.md) |

**Exit evidence:** Temporal passes the same role, handoff, lifecycle,
fault-injection, exact-prompt, security, and five-unit outcome suites as local
execution; replay/versioning, duplicate Activities, worker/service failure,
Continue-As-New, projection rebuild, and payload safety pass; local and
Temporal runs serialize overlapping work through one claim authority.

## Recommended starting point

M2-S1 (`prove-autonomous-sdd-vertical-slice`) is delivered and archived. Begin
M2-S2 (`add-autonomous-sdd-local-execution-backend`) under a new exact
authorization, then continue in order through M2-S3. Keep the resulting
generation contract-only or audit/shadow; do not route real delivery ownership
to it before the full activation bundle and M4-S4 qualification exist.

## Roadmap integrity checklist

- Every slice has one outcome, proposed change, dependency/readiness statement,
  linked draft brief, and milestone exit evidence.
- Detailed behavior lives in the linked brief and shared architecture in the
  main design; it is never defined only in this roadmap.
- Delivered slices identify their durable evidence; undelivered slices do not
  claim an issue, change, branch, PR, approval, or implementation.
- Each delivered change must leave the repository coherent and recoverable.
- Milestone gates measure integrated behavior rather than file presence or
  component fixtures alone.
- M4-S3 remains the start of real backlog proof; only M4-S4 exit qualifies
  repeated single-change v1 and unblocks milestone expansion.
- Contract publication never activates ownership; M4-S4 enables only explicit
  opt-in, and M7-S3 alone may enable default routing.
- Temporal remains optional and post-qualification.
