## Context

The M2-S1 vertical slice drives a disposable fixture through proposal → apply →
review → verify with simulated adapters and a thin sealed review loop. The
strict host-captured review transport already exists under `scripts/sdd/`:
`review-launcher-host.mjs` (the host-owned executable: prepare worktree
lifecycle, build the sealed package, launch a fresh read-only reviewer, validate,
cleanup), `review-launcher-recovery.mjs` (adapter definitions plus
prepare/accept/execute with terminal-on-denied/timeout/malformed),
`platform-review-adapters.mjs` (Codex/Claude adapter execution and result-artifact
inspection), and `independent-review-contract.mjs` (canonical result validation).
M3-S1 upgrades the thin loop so the production review step routes through this
transport and a real multi-step strict reviewer must deliver the parent-owned
terminal artifact.

## Goals / Non-Goals

**Goals:**

- Production review step routes through the strict host-captured transport.
- Deterministic exactly-once terminalization across success/failure/timeout/crash.
- Transcript-only and wrong-package results rejected.
- Cleanup exactly, or an actionable recovery record.

**Non-Goals:**

- Admission policy and dispatch (M3-S2).
- Exact-head correction policy (M3-S3).
- Degraded fallback redesign.
- Production Apply or v2-controller activation.

## Decisions

### D1 — Reuse the existing strict transport as the fixed host adapter
The vertical-slice production review step delegates to
`executeReviewLauncherHost` / `executePreparedReviewLauncherRecovery` rather than
reimplementing capture. Prototype keeps its simulated same-session-local path.

Alternative: a new parallel capture path was rejected (duplicate authority, drift
risk).

### D2 — Exactly-once terminalization by a single guarded terminal write
Terminalization is a single guarded record keyed by (launchId, requestDigest).
Denied, timed-out, malformed, and missing-artifact outcomes terminate before any
second attempt; exit-before-result-creation and exit-after-result-creation each
resolve to one deterministic terminal record.

Alternative: retrying to "look for" a late artifact was rejected (nondeterministic).

### D3 — Wrong-package rejection via canonical binding validation
`validateReviewResult` binds the result to `expectedPackage` (package digest plus
base/head). A result for a different package or head fails binding validation.

Alternative: a separate package-check module was rejected (duplicates the canonical
validator).

### D4 — Cleanup exactly, or retain an actionable recovery record
Reuse `cleanupReviewWorktreeLifecycle` / `removeDetachedReviewView`. On
unconfirmed removal, retain an owned-resource recovery record (identity plus the
required cleanup), never review content or secrets.

### D5 — Live probes as focused fixtures
Add focused tests for minimal, large-read, and genuine multi-step reviews, plus
fault injection (exit before/after result, transcript-only, wrong-package,
cleanup failure) to evidence exactly-once terminalization and rejection.

## Risks / Trade-offs

- [Accepting a transcript] → artifact-only acceptance stays enforced.
- [Duplicate/conflicting terminal records] → single guarded terminal write keyed by launchId + digest.
- [Wrong-package acceptance] → canonical binding validation on expectedPackage + base/head.
- [Orphaned temporary resources] → recovery record on unconfirmed cleanup.
- [Activating real ownership] → stays contract-only/audit in the pre-v2 lane.

## Reuse Plan

- Canonical assets: the strict transport stays assistant-neutral under
  `scripts/sdd/`; no product-specific repository, credential, or constant is added.
- Product configuration: repository, Project, and branch values remain
  configuration-driven, never hard-coded.
- Platform exposure: Claude/Codex boundaries remain in `platform-review-adapters.mjs`
  adapter definitions; no new duplicate canonical logic.
- Second-product portability: no mobile/job-search product behavior is introduced.
- Intentional product-specific behavior: none in this slice.

## Migration Plan

No migration. The slice is additive. Rollback reverts the review-step wiring and
its tests without touching the existing transport modules or records.

## Open Questions

None. The two brief open questions are resolved (Q1 authoritative existing review
work = `scripts/sdd/review-launcher-*.mjs` plus the archived strict-review
transport changes; Q2 host capture/terminalization boundaries =
`executeReviewLauncherHost` / `executePreparedReviewLauncherRecovery`).
