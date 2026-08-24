# M3-S1 strict-review artifact delivery handoff

Date: 2026-08-24

## Purpose

Handoff for starting the M3-S1 slice
(`harden-strict-review-multistep-artifact-delivery`) in a fresh session, after
the M2 milestone (M2-S1, M2-S2, M2-S3) was delivered and archived. Use this to
resume M3 implementation without losing the decisions and delivery state
recorded on 2026-08-24.

## Current state (verified 2026-08-24)

Milestone 2 is delivered and archived:

- M2-S1 (`prove-autonomous-sdd-vertical-slice`) — issue #207, PRs #208/#209/#210.
- M2-S2 (`add-autonomous-sdd-local-execution-backend`) — issue #211, PRs #212/#213/#214.
- M2-S3 (`add-autonomous-sdd-run-status-and-recovery`) — issue #215, PRs #216/#217/#218.

All squash-merged to `main`. Changes archived under
`openspec/changes/archive/2026-08-24-*/`. Living specs synced:

- `openspec/specs/autonomous-sdd-vertical-slice/spec.md`
- `openspec/specs/autonomous-sdd-local-execution-backend/spec.md`
- `openspec/specs/autonomous-sdd-run-status-and-recovery/spec.md`

Implementation under `scripts/sdd/`:

- `autonomous-sdd-vertical-slice.mjs` — M2-S1 pure selector, thin sealed review
  loop, minimal ephemeral store, simulated adapters, dual-profile driver.
- `autonomous-sdd-local-store.mjs`, `autonomous-sdd-admission.mjs`,
  `autonomous-sdd-controller.mjs` — M2-S2 backend (storage/history/projection/
  ownership/claim/takeover/discovery/legacy inventory) and admission, including
  cancellation-receipt-as-terminal recognition.
- `autonomous-sdd-run-status.mjs` — M2-S3 discovery, versioned `run-status`
  projection, eight typed classifications, safe-resume/no-op/pause, read-only
  projection rebuild.

Verification: M2-S2 focused 19/19, M2-S3 focused 6/6, full SDD suite 234 tests
with 0 failures, `openspec validate --all --strict` 41/41, all CI green on every
PR.

- Released runtime unchanged: `runtime-cfd993c706d6` (source `c9e128f…`),
  `ai-skills-runtime doctor` reports `ok` (mode installed, contract version 1,
  Node `26.7.0` with required `>=20`). No active OpenSpec changes.
- The v2 controller remains NOT activated (contract-only/audit); M3 does not
  change this. The stranded `controller-cf2ecbc…` checkpoint is retired by
  M2-S2's cancellation-as-terminal recognition.
- Roadmap refreshed: M2 rows marked delivered; "Recommended starting point" now
  points at M3-S1.

Note: the working tree contains unrelated untracked files/dirs (for example
`docs/research/security/`, `docs/research/aidlc/`, `.continue/`,
`.tmp-cline_mcp_settings.json`, `tmp-run-workspace-mcp-local`). Preserve them;
they are not part of this work.

## Read first

1. [SDD workflow](../../docs/sdd-workflow.md)
2. [SDD foundation operations](../../docs/sdd-foundation-operations.md)
3. [Reliability-control-plane roadmap](../plans/autonomous-sdd-reliability-control-plane-roadmap.md)
4. [M3-S1 brief](../design-briefs/autonomous-sdd-reliability-control-plane/m3-s1-strict-review-artifact-delivery.md)
5. [Earlier artifact-delivery brief](../design-briefs/strict-review-multistep-artifact-delivery.md)
6. [Harness research](../research/autonomous-agent-harness-landscape-2026/findings.md)
7. [Main control-plane design](../design-briefs/autonomous-sdd-reliability-control-plane.md)
8. The proven M2-S1 thin review loop (archived change above, its living spec,
   `scripts/sdd/autonomous-sdd-vertical-slice.mjs`, and the
   `skills/base/independent-review` skill) — M3-S1 upgrades this thin loop to
   strict.

## What M3-S1 is

Upgrade the M2-S1 thin review loop to strict, host-captured multi-step artifact
delivery. Every strict review MUST return one parent-owned schema-valid terminal
artifact, or exact unavailable evidence; transcripts and claimed success are
never acceptance evidence. The parent creates a sealed immutable review package
and owns the only writable terminal-result destination; a fixed host adapter
launches a fresh read-only reviewer, captures its lifecycle independently of the
transcript, and terminalizes exactly once. Accepted results must validate schema,
package digest, base/head commits, assurance, reviewer identity, and terminal
status.

Scope: strict review capture, transport, terminalization, transcript rejection,
cleanup, and live probes.

Non-goals: admission policy, exact-head correction policy, degraded fallback
redesign, or production Apply.

Constraints: reviewer execution is read-only and isolated; capture terminalizes
deterministically across success, failure, timeout, and crash.

Acceptance evidence: minimal, large-read, and genuine multi-step reviews all use
this interface; process exit before/after result creation yields one
deterministic terminal record (never duplicate or conflicting); transcript-only
and wrong-package results are rejected; temporary resources clean exactly or
retain an actionable recovery record; existing strict-review delivery work is
reconciled by source mapping before an older brief is considered superseded.

## Open questions to resolve before Propose (from the M3-S1 brief §6)

1. Confirm the authoritative existing review change/worktree, if any (and
   reconcile it by source mapping before an older brief is superseded).
2. Finalize host capture and terminalization boundaries for each adapter.

## Known limitation to carry forward

The v2 controller remains NOT activated (contract-only/audit). M3-S1 is a review
capture/transport upgrade and does not activate real ownership or production
Apply; those stay gated behind the full activation bundle and M4-S4.

## What to do next (in order)

1. Re-inspect live state in the fresh session (`ai-skills-runtime doctor`, Git,
   `openspec status`).
2. Read the documents under "Read first".
3. Resolve the two M3-S1 open questions (recommended workflow action: OpenSpec
   Explore; record the output under `ai-planning/notes/autonomous-sdd/`).
4. Reconcile any authoritative existing review change/worktree.
5. Refresh the roadmap's "Recommended starting point" paragraph (and the M3-S1
   row) to reflect M2 delivered and M3-S1 next. If this changes a living
   ordering scenario, handle it as its own OpenSpec change; otherwise treat it
   as a docs edit.
6. Obtain explicit owner authorization, then start a fresh M3-S1 delivery
   (`harden-strict-review-multistep-artifact-delivery`) in the pre-v2/interactive
   lane.
7. Implement, verify, and deliver M3-S1, then continue in order to M3-S2
   (`add-autonomous-sdd-review-admission-and-dispatcher`).

## Guardrails

- Do not begin M3-S1 implementation without explicit authorization.
- M3-S1 is delivered by the pre-v2 lifecycle, never by the v2 controller.
- Keep the result contract-only/audit; do not activate real ownership or
  production Apply before the full activation bundle and M4-S4 qualification
  exist.
- Do not accept transcripts or claimed success as review evidence; the
  host-captured terminal artifact is the only acceptance evidence.
- Do not hand-edit controller, claim, or archive files.
- Do not force-push or delete remote branches (note: GitHub auto-deletes merged
  head branches; retire local delivery branches only via exact-owned cleanup).
