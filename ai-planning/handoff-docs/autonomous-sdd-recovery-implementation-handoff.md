# Autonomous SDD recovery implementation handoff

Date: 2026-08-23

## Purpose

Handoff for implementing the approved emergency bootstrap-recovery delivery
(`recover-autonomous-sdd-bootstrap-runtime-and-controller-state`, issue #203).
Use this to resume the implementation in a fresh session without losing the
decisions made earlier on 2026-08-23.

## Read first (authoritative procedure)

The full authorization, execution order, required completion evidence, and stop
conditions live in:

- `ai-planning/handoff-docs/autonomous-sdd-emergency-bootstrap-recovery-handoff.md`
  (authoritative procedure)
- The committed proposal/design/tasks for this delivery:
  `openspec/changes/recover-autonomous-sdd-bootstrap-runtime-and-controller-state/`

Re-read both, then re-inspect live state before any mutation.

## Current state (verified 2026-08-23)

### Already merged and pushed on `main`

- `d836cb2` — M2 re-sequenced and cross-repo M5 added (roadmap + briefs + master design).
- `b6b0aaf` — deepseek/cline research docs.
- `3bdc756` — living spec `autonomous-sdd-control-plane-planning` synced for the
  M2 re-sequencing and cross-repo M5 (OpenSpec change #202, archived, issue closed).

### Recovery delivery (proposed, not yet implemented)

- Branch: `recover-autonomous-sdd-bootstrap-runtime-and-controller-state`
  (commit `b589df9`).
- Issue: #203 (open, label `sdd`).
- The OpenSpec change has proposal, design, tasks, delta specs, and tracking —
  strict-validated.

### Still blocked (the stranded controller)

- Controller `controller-cf2ecbc380a3ee49a2fe23768951f7cf`, selected entry
  `repair-controller-cleanup-wrapper-and-ordering`.
- State: `propose`, every step pending; expired `2026-08-23T00:00:00.000Z`.
- Claim still held (`claim-cf2ecbc380a3ee49a2fe23768951f7cf`); admission `admitted`.
- Owned resources: branch `fix/repair-controller-cleanup-wrapper-and-ordering`
  and worktree `/private/tmp/ai-skills-repair-controller-cleanup-wrapper-and-ordering`.
- Runtime healthy: `runtime-e0e9a50a042b` (source revision `138b2212…`);
  `ai-skills-runtime doctor` reports `ok`.

## IMPORTANT correction to the older handoff

The older emergency-recovery handoff references the pre-re-sequencing M2 order.
The correct, current order is:

- **M2-S1 = `prove-autonomous-sdd-vertical-slice`** (fixture template
  `add-typescript-javascript-review`) — NOT the durable backend.
- **M2-S2 = `add-autonomous-sdd-local-execution-backend`** (the durable backend).
- **M2-S3 = `add-autonomous-sdd-run-status-and-recovery`**.
- Cross-repository coordination is **M5-S1**; default cutover is **M7-S3**
  (was M6-S3).

Do not "leave M2-S1 `add-autonomous-sdd-local-execution-backend` Propose-ready";
that change is now M2-S2. The recovery leaves **M2-S1
`prove-autonomous-sdd-vertical-slice`** Propose-ready.

## What to do next (in order)

1. Check out the recovery branch and re-inspect live state (doctor, controller, Git).
2. Implement the four capabilities (delivery `tasks.md` section 2):
   1. runtime-only install mode
   2. installed-wrapper cleanup repair (worktree-before-branch, retain remote)
   3. host-context issue-intake handoff
   4. receipt-backed expired-controller cancellation/retirement
3. The stranded worktree `/private/tmp/ai-skills-repair-controller-cleanup-wrapper-and-ordering`
   holds prepared (uncommitted) changes for capabilities 2–4. Adopt them only
   after review and test per the delivery.
4. Verify, deliver (implementation / Sync / Archive PRs), install the runtime
   runtime-only, retire the exact expired controller, run exact owned cleanup,
   then run the planning-only M2-S1 Explore.

## Guardrails

- Do not hand-edit the controller, claim, or archive files.
- Do not begin M2 implementation.
- Do not force-push or delete remote branches.
- Do not retire any run other than the exact expired controller.
