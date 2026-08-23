# Autonomous SDD Reliability Control Plane — Roadmap Revision Proposal

Date: 2026-08-23

Status: Accepted and applied on 2026-08-23. The canonical roadmap and the
linked briefs have been amended per this revision (M2 re-sequenced, M5
cross-repository milestone added, M4-S4 backlog named). This document remains a
historical record of the decisions, not an open proposal.

## Purpose

Revise the canonical roadmap in three ways, all traceable to one principle:
**prove the product before building durability or scale.**

1. Re-sequence Milestone 2 so a vertical slice is validated before the durable
   execution backend is built.
2. Name the non-SDD planned skills in this repository as the M2-S1 fixture
   template and the M4-S4 real delivery backlog.
3. Add a post-M4-S4 milestone for cross-repository SDD coordination, using the
   Invest-in-Growth (HRF) project as its proof fixture.

## Why

Two inputs converged on the same conclusion:

- The [stabilization handoff](../handoff-docs/autonomous-sdd-stabilization-and-roadmap-resumption-handoff.md)
  found that M1 activated real v2 admission and exclusive ownership before a
  complete start-to-cleanup lifecycle existed. That is a **release-sequencing**
  failure, not a target-architecture failure.
- The [SDD harness refactor recommendation](../research/deepseek-cline-continue/recommended-sdd-harness-refactor-plan.md)
  independently argues that a general workflow engine must not be built before
  one vertical slice proves the intended product.

This revision adopts the refactor recommendation's *substance* (vertical-slice
first, narrow roles, sealed review, no workflow engine) while **remaining in
this repository** and **preserving the existing activation gates** instead of
forking a new repository and retiring M2–M7.

## 1. Re-sequenced Milestone 2

The current M2 builds a durable backend before proving a single change can flow
end-to-end. But the transition engine (current M2-S2) only needs a trivial
ephemeral store, not the full durable backend. Invert the order.

### Before

```text
M2-S1 durable backend ──► M2-S2 transition engine ──► M2-S3 status/recovery
```

### After

```text
M2-S1 vertical slice ──► M2-S2 durable backend ──► M2-S3 status/recovery
```

### M2-S1 — Prove the vertical slice (new, replaces current M2-S2)

**Proposed change:** `prove-autonomous-sdd-vertical-slice`

Absorbs the current
[M2-S2 transition-engine brief](../design-briefs/autonomous-sdd-reliability-control-plane/m2-s2-deterministic-transition-engine.md)
and adds a thin review loop and a minimal ephemeral store.

- Pure next-transition selector + fixed **simulated** adapters (Propose,
  planning conformance, Apply, Verify) — no real repository edit, no GitHub
  mutation.
- Minimal ephemeral/checkpoint store, explicitly **not** the durable backend.
  This decoupling is what makes the reorder possible.
- Thin sealed review/fix loop using the existing `independent-review` and
  `base-verification-loop` skills (typed findings, fresh-review-on-change,
  reviewer never fixes).
- Narrow role/context manifests: planner, implementer, verification worker,
  independent reviewer, controller — mapped to existing `skills/base/*` skills.
- Prove both `production` and `prototype` authority profiles on one disposable
  fixture (same lifecycle facts, different approval requirements).

**Acceptance:** one fixture change completes proposal → apply → verify →
fresh-review-on-change with typed stops, no routine prompt, no real mutation.

**Fixture template:** mirror the shape of a planned non-SDD skill (see §2).

**Delivery lane:** delivered by the pre-v2/interactive lifecycle, not by the
controller it builds (runtime N-1 delivers runtime N). The slice must not write
to real controller state; simulated adapters and the ephemeral store stay
non-activating.

**Evidence requirements:** per the milestone-blocker root-cause analysis,
acceptance must include a requirement-to-test map, an injected clock (no
calendar-sensitive authorization tests), and property/symmetry tests for the
selector and review-invalidation rules.

### M2-S2 — Local durable execution backend (unchanged substance, moved)

**Proposed change:** `add-autonomous-sdd-local-execution-backend`

Same scope as the current
[M2-S1 brief](../design-briefs/autonomous-sdd-reliability-control-plane/m2-s1-local-durable-execution-backend.md):
storage, authoritative history, atomic generation-fenced advancement, one
coarse claim, stale-owner rejection, operator takeover, filesystem admission.

Improvement: it is now **scoped by a proven slice**, so the transition set and
record shapes are known rather than speculative. Stays contract-only/audit; no
real activation.

### M2-S3 — Run status and recovery (unchanged)

**Proposed change:** `add-autonomous-sdd-run-status-and-recovery`

Depends on M2-S1 and M2-S2, as today.

## 2. Non-SDD test-bed queue

The HRF mobile app is a multi-repository project; v1 is single-repository and
single-run. It is therefore **not** the first test bed. Instead, the planned
non-SDD skills in *this* repository are ideal: they live in one canonical
repository, each has a design brief and research already done, and each is
bounded with objective acceptance evidence. They exercise the full SDD
lifecycle without touching the harness's own internals, avoiding
self-referential bootstrapping.

### M2-S1 fixture template

One planned non-SDD skill supplies the *shape* (proposal/design/tasks,
verification commands, review package) that the simulated adapters mirror.

Recommended template: `generic-git-repository-cleanup` or
`typescript-javascript-review`.

### M4-S4 real delivery backlog (ten consecutive real changes)

The `quality-and-product-acceleration-roadmap.md` already frames these as
dependency-valid, independently deliverable slices. They become the M4-S4
qualification queue:

| Proposed change | Source brief | Notes |
|---|---|---|
| `add-claude-cross-tool-repo-hygiene` | `claude-cross-tool-repo-hygiene.md` | Smallest; recommended **first** real change |
| `add-generic-git-repository-cleanup` | `generic-git-repository-cleanup.md` | Audit + confirmation-gated apply |
| `add-typescript-javascript-review` | `standards-driven-quality-skills.md` | First/default JS overlay |
| `add-react-web-review` | `standards-driven-quality-skills.md` | Web overlay |
| `add-react-native-expo-quality-overlay` | `react-native-expo-quality-skills.md` | Mobile standards pack + overlays |
| `add-java-spring-review` | `standards-driven-quality-skills.md` | Conditional on mobile stack |
| `add-terraform-static-quality-overlay` | `standards-driven-quality-skills.md` | Static/local only |
| `add-repository-status-skill` | `ideas/catch-all.md` | Read-only; very low risk |
| `add-git-health-skill` | `ideas/catch-all.md` | Read-only; very low risk |
| `deliver-research-and-planning-base-skills` | quality roadmap | Recovery / backlog seed |

> **Active-delta preflight:** several backlog skills consume the shared
> `standards-pack`, `context-management`, and `base-code-review` contracts.
> Before each real qualification run, preflight for overlapping active deltas
> and serialize or reconcile them before Sync; otherwise consecutive runs can
> trip the same overlap that stalled Sync PR #183.

## 3. New milestone: cross-repository SDD coordination (post-M4-S4)

**Proposed change:** `add-autonomous-sdd-cross-repository-coordination`

**Gating:** eligible only after M4-S4 qualifies repeated single-change v1. It
inherits the roadmap's deferred parallel-execution gate: it is multi-owner
coordination and must not be silently folded into M5/M6.

**Outcome:** one authorized change spans a central planning repository and one
or more component repositories, with the central change opening first and
closing last and component changes archiving inside it.

**Proof fixture:** the Invest-in-Growth project —
`home-roots-reinvest-in-growth` (central envelope) +
`hrf-reinvest-to-grow-mobile-app` (component). Its existing
`cross-repository-architecture` spec and linkage-ledger convention are the
reference model. Its `docs/cross-repository-sdd-flow.md` documents the
open-first/close-last sequencing and assigned-executor requirement.

**Milestone placement (open decision):** insert as a new milestone after M4-S4.
Whether it renumbers the existing M5/M6/M7 or is added as an expansion entry in
the deferred-parallel gate is left to the owner.

### Carried amendments (from the root-cause analysis)

Two permanent design gaps are not changed by this re-sequencing and must be
carried into the re-done roadmap as explicit M4 amendments:

- **Authenticated-host execution → M4-S1:** a non-secret host-operation envelope
  (exact repository, operation, resource identity, expected state, expiry,
  idempotency key) with an observation receipt; durable records never hold the
  credential.
- **Active-delta overlap preflight → M4-S2:** build an overlap graph across
  living-spec destinations and every active delta before Sync; reconcile or
  serialize complete replacements of the same requirement.

This revision also complements, not replaces, the root-cause analysis's
"Bootstrap and cutover control lane" correction: operating modes, one mutating
owner per mode, the runtime N-1→N rule, the minimum activation set, and the
"contract availability ≠ operational enablement" gate all still apply.

## 4. Design-brief and linkage changes

Re-sequencing M2 and adding the cross-repository milestone require these edits
to the linked briefs under
`ai-planning/design-briefs/autonomous-sdd-reliability-control-plane/` and to the
tables that reference them.

### Per-brief changes

| File | Change |
|---|---|
| `m2-s1-local-durable-execution-backend.md` | Renumber to **M2-S2**. Update title, status ("next slice" → "second M2 slice"), dependency (→ "M2-S1 vertical slice"), and add a scope note that the transition set and record shapes are now known from the proven slice. |
| `m2-s2-deterministic-transition-engine.md` | **Superseded** — its pure selector, simulated adapters, attempt envelopes, and typed-pause content merge into the new M2-S1 brief; move to `archived/` after acceptance. |
| `m2-s1-prove-vertical-slice.md` | **New** — brief for `prove-autonomous-sdd-vertical-slice`. |
| `m2-s3-run-status-and-recovery.md` | Update status and dependency: now depends on M2-S1 (transitions/attempt state) **and** M2-S2 (durable history/backend). |
| `m1-s1-run-and-work-unit-contract.md` | Re-point the forward "M2-S1" references that describe the durable backend (native lock adapter, crash boundary, filesystem admission) to **M2-S2**; reword the generic "resume with M2-S1" to "resume with the next M2 slice." |
| `m3-s1-strict-review-artifact-delivery.md` | Reframe from "introduce strict review" to "upgrade the thin M2-S1 review loop to strict host-captured multi-step artifact delivery." |
| `m3-s3-exact-head-review-and-correction.md` | Note that fresh-review-on-change is first proven in M2-S1's thin loop; M3-S3 upgrades it to strict exact-head binding. |
| `m4-s4-single-change-reliability-qualification.md` | Resolve open question #3 by naming the §2 non-SDD skill queue as the eligible backlog seed. |
| `cross-repository-coordination.md` | **New** — brief for `add-autonomous-sdd-cross-repository-coordination`. |

### Index and table updates

- `autonomous-sdd-reliability-control-plane.md` (master design) — update the
  milestone index table rows for M2-S1/M2-S2 to the new order and names.
- `autonomous-sdd-reliability-control-plane-roadmap.md` — amend the M2 table
  rows and the "Recommended starting point" paragraph (the accepted amendment
  this revision proposes).

### Governance flag

- The living spec `openspec/specs/autonomous-sdd-control-plane-planning/spec.md`
  encodes the current M2 order ("M2-S1 is the next implementation slice,
  followed by M2-S2 and M2-S3"). Re-sequencing therefore requires a **spec
  change** (its own OpenSpec proposal/apply/sync), not just a documentation
  edit.

### No change

- `m1-s2-operation-profile-gate-and-outcome-contract.md`, `m1-s3-runtime-configuration-provenance.md`,
  `m3-s2-review-admission-and-dispatch.md`, `m4-s1`/`m4-s2`/`m4-s3`, and the
  `m5`/`m6`/`m7` briefs are unchanged in substance.

## What stays unchanged

- Activation gates: contract-only/audit until **M4-S4**; **M6-S3** sole
  authority for default mode; **M7** optional.
- Safety invariants, role boundaries, sealed-review and fresh-review-on-change
  rules, config-over-hard-coding, no product constants in canonical code.
- The live-controller retirement remains a separate bounded emergency-recovery
  operation; it is not folded into any slice.

## Decisions required before this revision is adopted

1. Confirm the M2 re-sequence (vertical slice first) and the new
   `prove-autonomous-sdd-vertical-slice` name.
2. Select the M2-S1 fixture template skill.
3. Confirm the M4-S4 backlog queue and its ordering.
4. Decide where the cross-repository-coordination milestone slots (renumber
   vs. deferred-gate entry).
5. Authorize the first delivery (`prove-autonomous-sdd-vertical-slice`).

## Recommended next action

Owner review of this document. If accepted, amend the canonical roadmap's
Milestone 2 table and add the cross-repository milestone, then authorize
`prove-autonomous-sdd-vertical-slice` as the first M2 delivery. No
implementation, repository creation, GitHub write, migration, or cleanup is
authorized by this recommendation.
