# M2-S1 vertical slice handoff

Date: 2026-08-23

## Purpose

Handoff for starting the M2-S1 slice (`prove-autonomous-sdd-vertical-slice`)
in a fresh session, after the bootstrap-recovery delivery completed. Use this
to resume M2 planning and implementation without losing the decisions and
recovery state recorded on 2026-08-23.

## Current state (verified 2026-08-23)

- Bootstrap recovery is complete and delivered:
  - Implementation PR #204, Sync PR #205, Archive PR #206 (all squash-merged to `main`).
  - Change archived at `openspec/changes/archive/2026-08-23-recover-autonomous-sdd-bootstrap-runtime-and-controller-state/`.
- Released runtime installed runtime-only:
  - Active: `runtime-cfd993c706d6` (source revision `c9e128f…`).
  - Prior runtime retained: `runtime-e0e9a50a042b`.
- Expired controller retired:
  - `controller-cf2ecbc380a3ee49a2fe23768951f7cf` cancelled via `cancel-v2-run`;
    `cancellation-receipt` and `claim-release` recorded; run archived; active-dir empty.
  - Owned branch `fix/repair-controller-cleanup-wrapper-and-ordering` and its worktree removed.
- M2-S1 Explore output written:
  - `ai-planning/notes/autonomous-sdd/m2-s1-explore-output.md`.

## Read first

1. [SDD workflow](../../docs/sdd-workflow.md)
2. [SDD foundation operations](../../docs/sdd-foundation-operations.md)
3. [Reliability-control-plane roadmap](../plans/autonomous-sdd-reliability-control-plane-roadmap.md)
4. [M2-S1 brief](../design-briefs/autonomous-sdd-reliability-control-plane/m2-s1-prove-vertical-slice.md)
5. [M2-S1 Explore output](../notes/autonomous-sdd/m2-s1-explore-output.md)

## What M2-S1 is

Prove one disposable fixture change (`add-typescript-javascript-review`) flows
proposal → apply → verify → fresh-review-on-change under simulated, non-mutating
adapters, a thin sealed review loop, and a minimal ephemeral store, for both
`production` and `prototype` authority profiles. Delivered by the
pre-v2/interactive lifecycle (runtime N-1 delivers N), never by the controller
it builds.

## Known limitation to carry forward

The recovery archived the expired controller's run with a `cancellation-receipt`
but left its schema-5 checkpoint (`controller-cf2ecbc…`) at `propose` (not
hand-edited, per recovery guardrails). The v2 initializer recognizes only a
`terminalization-receipt` as terminal, so that checkpoint would still pause a
future v2 admission. This is recorded as an open question on the M2-S2 brief
(`m2-s2-local-durable-execution-backend.md`) and must be resolved before M2-S2
exercises the v2 controller.

## What to do next (in order)

1. Re-inspect live state in the fresh session (`ai-skills-runtime doctor`, Git,
   `openspec status`).
2. Resolve M2-S1's open questions: finalize the selector and adapter interface
   shapes (after M1-S2), and confirm the minimal ephemeral-store schema is not
   confused with the durable backend.
3. Obtain explicit owner authorization, then start a fresh M2-S1 delivery
   (`prove-autonomous-sdd-vertical-slice`) in the pre-v2/interactive lane.
4. Implement, verify, and deliver M2-S1, then continue in order to M2-S2.

## Guardrails

- Do not begin M2-S1 implementation without explicit authorization.
- M2-S1 is delivered by the pre-v2 lifecycle, never by the v2 controller.
- Do not hand-edit controller, claim, or archive files.
- Do not force-push or delete remote branches.
- Keep the resulting generation contract-only or audit/shadow; do not route real
  delivery ownership to it before M4-S4.
