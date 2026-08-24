# M2-S2 local durable execution backend handoff

Date: 2026-08-24

## Purpose

Handoff for starting the M2-S2 slice
(`add-autonomous-sdd-local-execution-backend`) in a fresh session, after M2-S1
(`prove-autonomous-sdd-vertical-slice`) was delivered and archived. Use this to
resume M2 implementation without losing the decisions and delivery state
recorded on 2026-08-24.

## Current state (verified 2026-08-24)

M2-S1 is delivered and archived:

- Issue #207 (`Prove the autonomous SDD vertical slice (M2-S1)`) — closed.
- Implementation PR #208, Sync PR #209, Archive PR #210 — all squash-merged to
  `main` (commits `f824c27`, `5f57b3c`, `feb500d`).
- Change archived at
  `openspec/changes/archive/2026-08-24-prove-autonomous-sdd-vertical-slice/`.
- Living spec synced (new capability):
  `openspec/specs/autonomous-sdd-vertical-slice/spec.md`.
- Implementation:
  - `scripts/sdd/autonomous-sdd-vertical-slice.mjs` (pure next-transition
    selector, minimal ephemeral store, write-ahead executor, four simulated
    non-mutating adapters, thin sealed review loop, role/context manifests,
    dual-profile driver).
  - `scripts/sdd/test/autonomous-sdd-vertical-slice.test.mjs` (18 tests).
- Verification: 18/18 focused tests, 227/227 full SDD suite,
  `openspec validate --all --strict` 39/39, all CI green on every PR.
- M2-S1 brief marked "Delivered and archived":
  `ai-planning/design-briefs/autonomous-sdd-reliability-control-plane/m2-s1-prove-vertical-slice.md`.
- Delivery branches are retired: remote heads auto-deleted on merge; local
  branches deleted; remote-tracking refs pruned. M2-S1 created no worktrees.
- Released runtime unchanged: `runtime-cfd993c706d6` (source `c9e128f…`),
  `ai-skills-runtime doctor` reports `ok`. No active OpenSpec changes.
- The v2 controller remains NOT activated (contract-only/audit).

Note: the working tree may contain unrelated untracked files (for example
`docs/research/security/`). Preserve them; they are not part of this work.

## Read first

1. [SDD workflow](../../docs/sdd-workflow.md)
2. [SDD foundation operations](../../docs/sdd-foundation-operations.md)
3. [Reliability-control-plane roadmap](../plans/autonomous-sdd-reliability-control-plane-roadmap.md)
4. [M2-S2 brief](../design-briefs/autonomous-sdd-reliability-control-plane/m2-s2-local-durable-execution-backend.md)
5. [Durability brief](../design-briefs/autonomous-sdd-durable-execution-and-isolated-work-units.md)
6. [Build-vs-buy research](../research/reliability-engineering/durable-execution-build-vs-buy/durable-execution-build-vs-buy-findings.md)
7. [Main control-plane design](../design-briefs/autonomous-sdd-reliability-control-plane.md)
8. The proven M2-S1 slice (archived change above, plus its living spec and
   module) — its transition set and record shapes scope M2-S2.

## What M2-S2 is

Build the smallest local, single-writer durable execution backend, scoped by
the transition set and record shapes proven in M2-S1. Scope: local storage,
authoritative history, projection, ownership, one coarse claim, takeover,
discovery, and legacy inventory. Explicit non-goals: daemons, queues,
distributed workers, generalized timers, arbitrary workflows, Temporal, and
real lifecycle adapters. Constraints: history lives outside disposable
worktrees; advancement is atomic and generation-fenced; one coarse claim
prevents overlapping mutation; an approximate 1,000–1,200 production-line
complexity budget is a tripwire (crossing it returns to owner
build-versus-adopt review; the line count is not a test target).

M2-S2 publishes and proves backend behavior in `contract-only` or
`audit/shadow` mode. It does NOT replace the existing real lifecycle owner,
even where initialization and claims are executable. Operational activation
waits for the complete vertical bundle and M4-S4 qualification. Delivered by
the pre-v2/interactive lifecycle, never by the controller this slice builds.

## Open questions to resolve before Propose (from the M2-S2 brief §6)

1. Select the smallest storage and locking substrate compatible with Node
   20.19.
2. Define same-host liveness, stale-owner proof, and the explicit takeover
   procedure.
3. Confirm which filesystem classes are supported or rejected at admission.
4. Recognize a `cancellation-receipt` (or otherwise retire a cancelled
   controller's schema-5 checkpoint) as terminal during initialization, so the
   2026-08-23 bootstrap recovery's retired controller (`controller-cf2ecbc…`,
   checkpoint left at `propose`) does not pause future v2 admission.

## Known limitation to carry forward

The recovery archived the expired controller's run with a
`cancellation-receipt` but left its schema-5 checkpoint (`controller-cf2ecbc…`)
at `propose` (not hand-edited, per recovery guardrails). The v2 initializer
recognizes only a `terminalization-receipt` as terminal, so that checkpoint
would still pause a future v2 admission. This is open question #4 above and
must be resolved before M2-S2 exercises the v2 controller.

## What to do next (in order)

1. Re-inspect live state in the fresh session (`ai-skills-runtime doctor`, Git,
   `openspec status`).
2. Read the documents under "Read first".
3. Resolve the four M2-S2 open questions (recommended workflow action: OpenSpec
   Explore; record the output under `ai-planning/notes/autonomous-sdd/`).
4. Refresh the roadmap's "Recommended starting point" paragraph (and the M2-S2
   row) to reflect M2-S1 delivered and M2-S2 next. If this changes the living
   `autonomous-sdd-control-plane-planning` spec's M2-ordering scenario, handle
   it as its own OpenSpec change; otherwise treat it as a docs edit.
5. Obtain explicit owner authorization, then start a fresh M2-S2 delivery
   (`add-autonomous-sdd-local-execution-backend`) in the pre-v2/interactive
   lane.
6. Implement, verify, and deliver M2-S2, then continue in order to M2-S3
   (`add-autonomous-sdd-run-status-and-recovery`).

## Guardrails

- Do not begin M2-S2 implementation without explicit authorization.
- M2-S2 is delivered by the pre-v2 lifecycle, never by the v2 controller it
  builds.
- Keep the result contract-only/audit; do not activate real ownership before
  the full activation bundle and M4-S4 qualification exist.
- Do not rebuild Temporal features; crossing the complexity tripwire returns to
  owner build-versus-adopt review.
- Do not hand-edit controller, claim, or archive files.
- Do not force-push or delete remote branches (note: GitHub auto-deletes merged
  head branches; retire local delivery branches only via exact-owned cleanup).
