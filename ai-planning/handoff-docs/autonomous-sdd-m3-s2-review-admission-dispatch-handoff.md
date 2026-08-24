# M3-S2 review admission and dispatch handoff

Date: 2026-08-24

## Purpose

Handoff for starting the M3-S2 slice
(`add-autonomous-sdd-review-admission-and-dispatcher`) in a fresh session,
after M3-S1 (`harden-strict-review-multistep-artifact-delivery`) was delivered
and archived. Use this to resume M3 implementation without losing the decisions
and delivery state recorded on 2026-08-24.

## Current state (verified 2026-08-24)

M3-S1 is delivered and archived — issue #219, PRs #220 (implementation) / #221
(Sync) / #222 (Archive). This is the hard dependency M3-S2 requires.

- M1-S3 (`establish-autonomous-sdd-runtime-config-provenance`) is already
  delivered and archived (2026-08-21). It supplies
  `scripts/sdd/runtime-configuration.mjs` — the canonical product-owned runtime
  configuration source that review admission must consume, never
  `config/ai-skills.json` guessing.
- M3-S1 delivered `scripts/sdd/autonomous-sdd-strict-review-delivery.mjs`:
  deterministic exactly-once terminalization, transcript-only and wrong-package
  rejection, and cleanup-or-recovery. This is the artifact-delivery boundary
  that M3-S2 admission/dispatch builds on.
- The strict host-captured transport already exists: `review-launcher-host.mjs`,
  `review-launcher-recovery.mjs`, `platform-review-adapters.mjs`,
  `review-adapter-contract.mjs`, `independent-review-contract.mjs`.
- Note: `autonomous-sdd-admission.mjs` is the M2-S2 vertical-slice admission
  (a different concept from M3-S2 review admission); do not conflate them.
- Verification: full SDD suite 250 tests (249 pass + 1 conditionally skipped
  "no active OpenSpec change" probe), `openspec validate --all --strict` 41/41,
  CI green on every PR. No active OpenSpec changes.
- Released runtime unchanged: `runtime-cfd993c706d6` (source `c9e128f…`). The
  v2 controller remains NOT activated (contract-only/audit); M3 does not change
  this.
- Roadmap refreshed: M3-S1 row marked delivered; "Recommended starting point"
  already points at M3-S2.
- Note: the working tree contains unrelated untracked files/dirs (for example
  `docs/research/security/`, `docs/research/aidlc/`, `.continue/`). Preserve
  them; they are not part of this work.

## Read first

1. [SDD workflow](../../docs/sdd-workflow.md)
2. [SDD foundation operations](../../docs/sdd-foundation-operations.md)
3. [Reliability-control-plane roadmap](../plans/autonomous-sdd-reliability-control-plane-roadmap.md)
4. [M3-S2 brief](../design-briefs/autonomous-sdd-reliability-control-plane/m3-s2-review-admission-and-dispatch.md)
5. [Configuration-provenance brief](../design-briefs/independent-review-configuration-provenance.md)
6. [Inspection-environment-fallback brief](../design-briefs/independent-review-inspection-environment-fallback.md)
7. The M3-S1 archived change
   (`openspec/changes/archive/2026-08-24-harden-strict-review-multistep-artifact-delivery/`)
   and `scripts/sdd/autonomous-sdd-strict-review-delivery.mjs`.
8. The existing transport modules (`review-launcher-host.mjs`,
   `review-launcher-recovery.mjs`, `platform-review-adapters.mjs`,
   `review-adapter-contract.mjs`) and `runtime-configuration.mjs`.

## What M3-S2 is

Admission proves the production review path before Apply; one typed dispatcher
owns launch through terminal evidence. Admission probes the exact configured
executable/adapter identity, parent transport, repository/view, multi-step
artifact path, inspection capability, runtime permission, deadline budget, and
cleanup destination. Strict-only work pauses before Apply when any mandatory
capability is absent; successful admission is evidence, not standing
permission. One dispatcher owns launch, receipt consumption, transport
recovery, classification, allowed degraded eligibility, and terminal evidence.
It never asks the owner to relay commands and never converts an unavailable
strict result into success.

Scope: readiness checks, dispatcher, receipt recovery, fallback eligibility,
deadline, permissions, and cleanup destination.

Non-goals: changing strict review assurance, owner command relay, or exact-head
correction semantics (M3-S3).

Constraints: no skill may launch its own competing review path; no degraded
fallback may satisfy a strict-only production gate.

## Open questions to resolve before Propose (from the M3-S2 brief §6)

1. Define the minimum live multi-step readiness probe and its freshness window.
2. Confirm when the inspection-environment follow-up is actually required.

## Known limitation to carry forward

The v2 controller remains NOT activated (contract-only/audit). M3-S2 is a
review admission/dispatch upgrade and does not activate real ownership or
production Apply; those stay gated behind the full activation bundle and
M4-S4.

## What to do next (in order)

1. Re-inspect live state in the fresh session (`ai-skills-runtime doctor`, Git,
   `openspec status`).
2. Read the documents under "Read first".
3. Resolve the two M3-S2 open questions (recommended workflow action: OpenSpec
   Explore; record the output under `ai-planning/notes/autonomous-sdd/`).
4. Verify the roadmap's "Recommended starting point" and the M3-S2 row are
   current (they already point at M3-S2 after the M3-S1 hygiene commit; adjust
   only if stale). If a change to a living ordering scenario is needed, handle
   it as its own OpenSpec change; otherwise treat it as a docs edit.
5. Obtain explicit owner authorization, then start a fresh M3-S2 delivery
   (`add-autonomous-sdd-review-admission-and-dispatcher`) in the pre-v2/
   interactive lane.
6. Implement, verify, deliver, Sync, and Archive M3-S2, then continue in order
   to M3-S3 (`bind-autonomous-review-to-code-head`).

## Guardrails

- Do not begin M3-S2 implementation without explicit authorization.
- M3-S2 is delivered by the pre-v2 lifecycle, never by the v2 controller.
- Keep the result contract-only/audit; do not activate real ownership or
  production Apply before the full activation bundle and M4-S4 qualification
  exist.
- Do not accept transcripts or claimed success as review evidence; the
  host-captured terminal artifact is the only acceptance evidence.
- Admission success is evidence, not standing permission; no skill may launch a
  competing review path, and no degraded fallback may satisfy a strict-only
  gate.
- Do not hand-edit controller, claim, or archive files.
- Do not force-push or delete remote branches (GitHub auto-deletes merged head
  branches; retire local delivery branches only via exact-owned cleanup).
