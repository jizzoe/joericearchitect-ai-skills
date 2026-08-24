# M3-S2 review admission and dispatch handoff

Date: 2026-08-24

## Purpose

Handoff for starting the M3-S2 slice
(`add-autonomous-sdd-review-admission-and-dispatcher`) in a fresh session, after
M3-S1 (`harden-strict-review-multistep-artifact-delivery`) was delivered and
archived on 2026-08-24. Use this to resume M3 implementation without losing the
decisions and delivery state recorded on 2026-08-24.

## Current state (verified 2026-08-24)

M3-S1 is delivered and archived, and both of M3-S2's hard dependencies are
satisfied:

- M3-S1 (`harden-strict-review-multistep-artifact-delivery`) — issue #219, PRs
  #220/#221/#222 (implementation / Sync / Archive).
- M1-S3 (`establish-autonomous-sdd-runtime-config-provenance`) — delivered and
  archived (2026-08-21). It supplies `scripts/sdd/runtime-configuration.mjs`,
  the canonical product-owned runtime configuration source that review
  admission must consume (never `config/ai-skills.json` guessing).
- M2 (M2-S1, M2-S2, M2-S3) — delivered and archived (see prior handoffs).

All squash-merged to `main`. M3-S1 changes archived under
`openspec/changes/archive/2026-08-24-harden-strict-review-multistep-artifact-delivery/`.
Living specs synced:

- `openspec/specs/isolated-independent-review/spec.md` — three added
  requirements: strict review terminalizes exactly once, wrong-package results
  are rejected, and temporary review resources clean exactly or retain an
  actionable recovery record.
- `openspec/specs/autonomous-sdd-vertical-slice/spec.md` — the production review
  step now routes through the strict host-captured transport and requires a
  parent-owned schema-valid terminal artifact.

New/changed implementation under `scripts/sdd/`:

- `autonomous-sdd-strict-review-delivery.mjs` — M3-S1 deterministic
  exactly-once terminalization (`terminalizeStrictReviewCapture`,
  `strictReviewTerminalKey`), transcript/wrong-package rejection,
  cleanup-or-recovery, and the `deliverStrictReviewArtifact` entry point.
- `autonomous-sdd-vertical-slice.mjs` — production review step wired through the
  strict delivery via an optional `strictDelivery` callback.

The strict host-captured transport already exists under `scripts/sdd/`:
`review-launcher-host.mjs`, `review-launcher-recovery.mjs`,
`platform-review-adapters.mjs`, `review-adapter-contract.mjs`,
`independent-review-contract.mjs`. M3-S2 adds admission plus one typed
dispatcher over this transport; it does not reimplement capture.

Note: `autonomous-sdd-admission.mjs` is the M2-S2 vertical-slice admission (a
different concept from M3-S2 review admission); do not conflate them.

Verification: M3-S1 focused 16/16, full SDD suite 250 tests (249 pass + 1
conditionally-skipped with no active change, 0 failures),
`openspec validate --all --strict` 41/41 (after archive), all CI green on every
PR.

- Released runtime unchanged: `runtime-cfd993c706d6` (source `c9e128f…`),
  `ai-skills-runtime doctor` reports `ok`. No active OpenSpec changes.
- The v2 controller remains NOT activated (contract-only/audit); M3 does not
  change this.
- Roadmap refreshed: M3-S1 row marked delivered; "Recommended starting point"
  already points at M3-S2.

Note: the working tree contains unrelated untracked files/dirs (for example
`docs/research/security/`, `docs/research/aidlc/`, `.continue/`). Preserve them;
they are not part of this work.

## Read first

1. [SDD workflow](../../docs/sdd-workflow.md)
2. [SDD foundation operations](../../docs/sdd-foundation-operations.md)
3. [Reliability-control-plane roadmap](../plans/autonomous-sdd-reliability-control-plane-roadmap.md)
4. [M3-S2 brief](../design-briefs/autonomous-sdd-reliability-control-plane/m3-s2-review-admission-and-dispatch.md)
5. [Main control-plane design](../design-briefs/autonomous-sdd-reliability-control-plane.md)
6. [Harness research](../research/autonomous-agent-harness-landscape-2026/findings.md)
7. [Configuration-provenance brief](../design-briefs/independent-review-configuration-provenance.md)
8. [Inspection-fallback brief](../design-briefs/independent-review-inspection-environment-fallback.md)
9. The proven M3-S1 strict delivery (archived change above, its living spec, and
   `scripts/sdd/autonomous-sdd-strict-review-delivery.mjs`) — M3-S2 adds
   admission plus one typed dispatcher over this transport.
10. Existing review adapter/launcher modules to reconcile before Propose:
    `scripts/sdd/review-launcher-host.mjs`, `review-launcher-recovery.mjs`,
    `review-adapter-contract.mjs`, `platform-review-adapters.mjs`,
    `independent-review.mjs`, `execute-independent-review.mjs`, and the M2-S2
    `autonomous-sdd-admission.mjs` / `autonomous-sdd-controller.mjs` (controller
    admission — confirm the review-admission boundary is distinct from these).

## What M3-S2 is

Upgrade strict-review readiness, launch, recovery, and fallback from split
prompts/helpers into admission plus one typed dispatcher. Admission proves the
production review path is viable (exact configured executable/adapter identity,
parent transport, repository/view, multi-step artifact path, inspection
capability, runtime permission, deadline budget, and cleanup destination) before
Apply can become eligible; a single dispatcher owns launch, receipt consumption,
transport recovery, classification, allowed degraded eligibility, and terminal
evidence. The dispatcher never asks the owner to relay commands and never
converts an unavailable strict result into success. No skill launches its own
competing review path, and no degraded fallback satisfies a strict-only gate.

Scope: readiness checks, dispatcher, receipt recovery, fallback eligibility,
deadline, permissions, and cleanup destination.

Non-goals: changing strict review assurance, owner command relay, or exact-head
correction semantics (M3-S3).

Constraints: one dispatcher owns review invocation; admission is evidence, not
standing permission; strict-only fails closed.

Acceptance evidence: live preflight and a genuine multi-step probe pass through
the production interface before real Apply can be enabled; missing adapter, bad
attestation, wrong repository view, inadequate deadline, denied runtime
permission, and unwritable destination fail at admission; mid-run reviewer loss
preserves the attempt and returns an exact resume/pause; degraded behavior
occurs only under a separately valid policy; the inspection-environment fallback
stays conditional on observed semantic-tool insufficiency.

## Open questions to resolve before Propose (from the M3-S2 brief §6)

1. Define the minimum live multi-step readiness probe and its freshness window.
2. Confirm when the inspection-environment follow-up is actually required.

## Known limitation to carry forward

The v2 controller remains NOT activated (contract-only/audit). M3-S2 is a review
admission/dispatch upgrade and does not activate real ownership or production
Apply; those stay gated behind the full activation bundle and M4-S4.

## What to do next (in order)

1. Re-inspect live state in the fresh session (`ai-skills-runtime doctor`, Git,
   `openspec status`).
2. Read the documents under "Read first".
3. Resolve the two M3-S2 open questions (recommended workflow action: OpenSpec
   Explore; record the output under `ai-planning/notes/autonomous-sdd/`).
4. Reconcile the existing review adapter/launcher/admission modules by source
   mapping (confirm the review-admission boundary vs. the M2-S2 controller
   admission).
5. Verify the roadmap's "Recommended starting point" and the M3-S2 row are
   current (they already point at M3-S2 after the M3-S1 hygiene commit; adjust
   only if stale). If a change to a living ordering scenario is needed, handle
   it as its own OpenSpec change; otherwise treat it as a docs edit.
6. Obtain explicit owner authorization, then start a fresh M3-S2 delivery
   (`add-autonomous-sdd-review-admission-and-dispatcher`) in the pre-v2/
   interactive lane.
7. Implement, verify, deliver, Sync, and Archive M3-S2, then refresh the
   roadmap's "Recommended starting point" to point at M3-S3
   (`bind-autonomous-review-to-code-head`) and continue in order.

## Guardrails

- Do not begin M3-S2 implementation without explicit authorization.
- M3-S2 is delivered by the pre-v2 lifecycle, never by the v2 controller.
- Keep the result contract-only/audit; do not activate real ownership or
  production Apply before the full activation bundle and M4-S4 qualification
  exist.
- Admission success is evidence, not standing permission; no skill may launch
  its own competing review path, and no degraded fallback may satisfy a
  strict-only production gate.
- Do not accept transcripts or claimed success as review evidence; the
  host-captured terminal artifact is the only acceptance evidence.
- Do not hand-edit controller, claim, or archive files.
- Do not force-push or delete remote branches (GitHub auto-deletes merged head
  branches; retire local delivery branches only via exact-owned cleanup).
