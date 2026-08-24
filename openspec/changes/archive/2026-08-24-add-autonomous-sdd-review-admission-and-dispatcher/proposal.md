# Add Autonomous SDD Review Admission and Dispatcher

## Why

Strict-review readiness, launch, recovery, and fallback are split across prompts
and helpers, so different runs can select different helpers or classify the same
reviewer outcome differently. This change replaces that split with admission
that proves the production review path is viable before Apply, plus one typed
dispatcher that owns review invocation from launch through terminal evidence.

## What Changes

- Add a review-admission gate that proves, before Apply can become eligible, the
  exact configured executable/adapter identity, parent transport, repository
  view, multi-step artifact path, inspection capability, runtime permission,
  deadline budget, and cleanup destination — via one genuine multi-step live
  probe with an exact-head-bound freshness window.
- Add one typed dispatcher that owns review launch, receipt consumption,
  transport recovery, classification, allowed degraded eligibility, and terminal
  evidence; no skill may launch its own competing review path.
- Make admission fail closed for a missing adapter, bad attestation, wrong
  repository view, inadequate deadline, denied runtime permission, or unwritable
  destination.
- Preserve the attempt and return an exact resume/pause on mid-run reviewer loss.
- Keep the inspection-environment fallback conditional on observed semantic-tool
  insufficiency — never a routine second path, and never satisfying a strict-only
  gate.

## Capabilities

### New Capabilities

- `autonomous-sdd-review-admission-and-dispatch`: review-readiness admission and
  single-owner review dispatch.

### Modified Capabilities

None. Strict review assurance, owner command relay, and exact-head correction
semantics are non-goals and remain unchanged.

## Impact

- New `scripts/sdd/autonomous-sdd-review-admission.mjs` and
  `scripts/sdd/autonomous-sdd-review-dispatcher.mjs` (plus focused tests).
- Re-wires `scripts/sdd/autonomous-sdd-vertical-slice.mjs` `thinReviewLoop` so
  the production review step routes through admission and the dispatcher.
- Reuses `review-launcher-*.mjs`, `platform-review-adapters.mjs`,
  `degraded-independent-review-authorization.mjs`, and
  `autonomous-sdd-strict-review-delivery.mjs`.
- No change to the not-activated v2 controller; delivered in the pre-v2 lane.
