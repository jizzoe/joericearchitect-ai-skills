# Design — Review Admission and Dispatcher

## Overview

M3-S2 consolidates the split review readiness/launch/recovery/fallback helpers
into two pure, deterministic modules over the existing strict host-captured
transport:

- `autonomous-sdd-review-admission.mjs` — proves the production review path is
  viable before Apply can become eligible.
- `autonomous-sdd-review-dispatcher.mjs` — the single owner of review
  invocation: launch, receipt consumption, transport recovery, classification,
  allowed degraded eligibility, and terminal evidence.

Both are pure functions over injected clocks, filesystem, and transport
callbacks, so they stay deterministic and testable without a real reviewer
process.

## Admission

`admitReviewReadiness({ reviewPackage, adapter, reviewer, transport, deadline,
clock })` returns one typed result:

- resolve the exact adapter identity via `resolveTrustedReviewerExecutable` and
  `probe*ReviewAdapter` (canonical path, version/probe result, non-secret
  identity digest) inside the target permission profile;
- build the sealed package and detached read-only view
  (`prepareReviewWorktreeLifecycle`);
- launch one genuine multi-step probe: the reviewer performs at least two
  distinct semantic read-only operations (`read-file`, `list-tree`,
  `search-text`, `read-sealed-diff`) and emits a parent-owned schema-valid
  terminal artifact;
- terminalize exactly once via `deliverStrictReviewArtifact`;
- confirm cleanup removal (`cleanup.removed === true`).

Each mandatory capability maps to a typed failure code that fails admission
closed: missing adapter, bad attestation, wrong repository view, inadequate
deadline, denied runtime permission, unwritable destination.

Freshness: admission evidence records the exact sealed package digest and an
`observedAt`. It is valid only for that exact head and within a bounded TTL
(default 60 minutes, configurable, hard-capped by the run's remaining deadline
budget), and is consumed exactly once by the admission-to-Apply transition it
gates. Any head/manifest change invalidates it.

## Dispatcher

`dispatchReview({ ... })` owns the full invocation lifecycle and returns one
typed disposition. It wraps (never replaces) the existing transport:

- launch → `executeReviewLauncherHost`;
- receipt consumption → `acceptReviewLauncherHostResponse`;
- transport recovery → `executePreparedReviewLauncherRecovery`;
- classification → typed codes from `classify*ExecutionFailure` plus
  `terminalizeStrictReviewCapture`;
- allowed degraded eligibility → `validateDegradedIndependentReviewAuthorization`;
- terminal evidence → `deliverStrictReviewArtifact`.

The dispatcher keys classification and fallback eligibility off adapter-produced
typed codes, never transcripts, stdout, or repository content. Mid-run reviewer
loss preserves the attempt and returns an exact resume/pause. The
context-compatible inspection fallback triggers only on a typed
inspection-capability/environment failure from the restricted degraded attempt
and only under a separately valid degraded authorization — never a routine
second path, and never satisfying a strict-only gate.

## Integration

`autonomous-sdd-vertical-slice.mjs` `thinReviewLoop` gains an optional
`reviewDispatch` callback (parallel to the M3-S1 `strictDelivery` callback) so
the production review step routes through admission plus the dispatcher. The
prototype same-session-local path is unchanged.

## Non-goals

Strict review assurance, owner command relay, and exact-head correction
semantics are unchanged. The v2 controller stays not activated; delivery runs in
the pre-v2 lane.
