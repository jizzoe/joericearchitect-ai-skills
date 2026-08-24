# M3-S2 Explore Output — Review Admission and Dispatch

Date: 2026-08-24
Change: `add-autonomous-sdd-review-admission-and-dispatcher`
Workflow action: OpenSpec Explore (planning-only; no OpenSpec artifacts created).

## Context

M3-S2 upgrades strict-review readiness, launch, recovery, and fallback from split
prompts/helpers into admission plus one typed dispatcher. Admission proves the
production review path is viable before Apply can become eligible; a single
dispatcher owns launch, receipt consumption, transport recovery, classification,
allowed degraded eligibility, and terminal evidence. No skill launches its own
competing review path, and no degraded fallback satisfies a strict-only gate.

Live state (re-inspected 2026-08-24): on `main`, working tree clean except three
unrelated untracked dirs (`.continue/`, `docs/research/aidlc/cloud-deployed-sdd-framework/`,
`docs/research/security/`). OpenSpec 1.8.0, no active changes. `ai-skills-runtime
doctor` reports `ok: true` / `classification: available` (runtime
`runtime-cfd993c706d6`, source `c9e128f…`, contentVerified). M3-S1 archived; both
hard dependencies satisfied.

## Open question resolutions

### Q1 — Minimum live multi-step readiness probe and its freshness window

**Answer.** Admission runs exactly one *genuine multi-step* probe through the real
production interface — the strict host-captured transport
(`review-launcher-host.mjs` → `review-launcher-recovery.mjs` → `deliverStrictReviewArtifact`)
— against a **synthetic owned fixture** (never repository content, never the
simulated adapter). The probe must prove, live and in order, every mandatory
admission capability:

1. **Exact executable/adapter identity** — resolve the configured adapter
   (`codex-detached-read-only-v1` or `claude-detached-restricted-v1`), canonical
   executable path, version/probe result, and a non-secret identity digest, inside
   the target permission profile. `command -v` on the parent host is not proof.
2. **Parent transport** — the host-owned launcher crosses the boundary and returns
   a valid host response (not `denied` / `timed-out` / `unavailable`).
3. **Repository/view** — the detached read-only review view is constructed from the
   sealed package (worktree lifecycle prepare/execute succeeds).
4. **Multi-step artifact path** — the fresh reviewer performs **at least two
   distinct semantic read-only operations** (`read-file`, `list-tree`,
   `search-text`, `read-sealed-diff`) and emits a parent-owned schema-valid
   `independent-review-result-v1` terminal artifact that terminalizes exactly once
   (`strictReviewTerminalKey`).
5. **Inspection capability** — representative read-only operations succeed inside
   the reviewer's own runtime profile against synthetic owned fixtures (not the
   parent host).
6. **Runtime permission** — the required/escalated host execution is permitted.
7. **Deadline budget** — the probe completes within the review deadline budget.
8. **Cleanup destination** — the view is confirmed removed (`cleanup.removed ===
   true`); a writable cleanup destination is proven.

"Minimum" means the smallest probe that still exercises the full path end-to-end
and multi-step: a single minimal read or a large-read probe is insufficient, but
it is still *one* probe against one synthetic fixture — it does not review the
actual change (that happens later in the review step).

Any mandatory capability absent → admission fails closed and pauses before Apply.
Admission is evidence, not standing permission.

**Freshness window** is two orthogonal conditions, both required:

- **Exact-head binding.** The probe is valid only for the exact sealed package it
  proved (base, head, manifest, artifact manifest, policy gates). Any change
  invalidates it immediately and forces re-admission.
- **Time-to-live.** The evidence carries `observedAt` and a bounded TTL. Recommended
  default: **60 minutes, configurable, hard-capped by the run's remaining deadline
  budget**; the probe cannot outlive its own run and is consumed exactly once by
  the admission→Apply transition it gates. If Apply has not committed within the
  TTL (or the head changes), admission re-runs. The exact TTL value is owner-confirmable
  at Propose; the structural exact-head invalidation is non-negotiable.

**Required proof.** A fixture shows a genuine multi-step probe passing through the
production interface and a stale head, a changed manifest, an expired TTL, a
missing adapter, and a `command -v`-only "probe" each failing admission.

### Q2 — When the inspection-environment follow-up is actually required

**Answer.** The inspection-environment follow-up (the context-compatible degraded
reviewer, `launch-context-compatible-read-only-v1` — "attempt B" in the
inspection-fallback brief) is required **only** when all three hold:

1. strict isolated review is **durably unavailable** (not merely `failed` findings),
2. a **separately valid degraded authorization** exists (strict-first-degraded
   policy plus the exact fallback-boundary value), and
3. the default **restricted degraded reviewer (attempt A)** fails with a **typed
   inspection-capability / environment failure** produced by the adapter — i.e.
   executable-resolution failure inside the target profile, a toolchain/SDK
   resolution failure, the permission profile incorrectly denying a required
   read-only operation, or a structured runtime event showing an allowlisted
   inspection operation could not execute for an environment reason after a
   successful preflight.

It is **never** required — and must not trigger — on: review findings
(blocker/high/material), missing/malformed output without independent typed
environment evidence, stale head/manifest/authorization/identity/expiration,
security-invariant failures (result binding, cleanup ownership, credential scrub,
network denial), timeout/crash/refusal without a typed inspection cause, or
repository content claiming a command is unavailable.

The dispatcher owns this classification: it keys the follow-up off an
adapter-produced **typed inspection-insufficiency code**, never off transcript
text, claimed unavailability, or a skill's own preference. Exactly one
context-compatible attempt is allowed per sealed package and
environment-failure signature, with its own bounded attempt budget, and its result
remains labelled `authorized-degraded` — never normalized into `strict-isolated`
assurance. This keeps the fallback **conditional on observed semantic-tool
insufficiency** rather than a routine second path, matching the M3-S2 acceptance
criterion and the inspection-fallback brief's attempt state machine.

**Required proof.** A typed inspection-insufficiency code routes to attempt B
exactly once; a transcript-only claim, a repository-controlled hint, a `failed`
finding, and a stale/expired binding never do.

## Authorization

Explore is planning-only. Implementation (Propose/Apply) is NOT authorized and
requires explicit owner approval in the pre-v2/interactive lane. The v2 controller
remains NOT activated; M3-S2 is delivered by the pre-v2 lifecycle.
