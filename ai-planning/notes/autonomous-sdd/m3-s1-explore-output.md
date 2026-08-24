# M3-S1 Explore Output — Strict-Review Artifact Delivery

Date: 2026-08-24
Change: `harden-strict-review-multistep-artifact-delivery`
Workflow action: OpenSpec Explore (planning-only; no OpenSpec artifacts created).

## Selected design

Upgrade the M2-S1 thin review loop
(`scripts/sdd/autonomous-sdd-vertical-slice.mjs` `thinReviewLoop`) to route
through the already-proven strict host-captured review transport
(`scripts/sdd/review-launcher-*.mjs` and
`scripts/sdd/platform-review-adapters.mjs`) instead of the simulated adapter.
Every strict review returns exactly one parent-owned schema-valid
`independent-review-result-v1` terminal artifact, or typed unavailable evidence.
Transcripts, stdout, JSONL fragments, self-review, and claimed success are never
acceptance evidence.

## Scope

- Strict review capture (a fixed host-owned executable launches a fresh
  read-only reviewer and captures its lifecycle independently of the transcript).
- Transport (sealed host request → prepared recovery → host response acceptance).
- Terminalization (exactly once across success, failure, timeout, and crash).
- Transcript rejection and typed unavailable evidence.
- Cleanup (ownership-guarded view removal; actionable recovery record on failure).
- Live probes (minimal, large-read, and genuine multi-step reviews).

Non-goals: admission policy (M3-S2), exact-head correction (M3-S3), degraded
fallback redesign, production Apply.

## Dependencies

- M1 contracts (run/work-unit, operation, runtime-config) — delivered/archived.
- M2-S1 vertical slice thin review loop — delivered/archived.
- M2-S2 local execution backend — delivered/archived.
- M2-S3 run status and recovery — delivered/archived.

## Open question resolutions

### Q1 — Authoritative existing review change/worktree

The authoritative existing review work is the current scripts under
`scripts/sdd/` plus the archived strict-review transport changes, not a live
worktree or active OpenSpec change:

- Current scripts: `review-launcher-host.mjs`, `review-launcher-recovery.mjs`,
  `review-adapter-contract.mjs`, `platform-review-adapters.mjs`,
  `review-worktree-lifecycle.mjs`, `detached-review-view.mjs`,
  `independent-review-contract.mjs`, `independent-review.mjs`,
  `review-diagnostics.mjs`, `review-findings.mjs`,
  `degraded-independent-review-authorization.mjs`,
  `execute-independent-review.mjs`.
- Archived changes: `2026-08-15-harden-strict-review-artifact-transport`,
  `2026-08-16-harden-independent-review-result-transport`,
  `2026-08-16-harden-independent-review-worktree-lifecycle`,
  `2026-08-16-allow-artifact-missing-degraded-review-recovery`.

The worktree `/private/tmp/ai-skills-harden-strict-review-multistep` is a stale,
prunable detached checkout at commit `06e756a` (archive of #110), a leftover
from an earlier attempt. It is NOT authoritative and must not be used as source;
it is retired via exact-owned cleanup, never force-deleted.

Source mapping: the older `strict-review-multistep-artifact-delivery.md` brief
(2026-08-16) recommended Propose for this exact change name; its transport
recommendations were partially delivered in the archived
`harden-strict-review-artifact-transport` and
`harden-independent-review-result-transport` changes, whose implementation now
lives in `review-launcher-*.mjs` + `platform-review-adapters.mjs`. That older
brief is considered superseded by the M3-S1 brief once this mapping is recorded.

### Q2 — Host capture and terminalization boundaries per adapter

Two adapters are defined in `review-launcher-recovery.mjs`
(`launcherDefinitions`):

- `codex-detached-read-only-v1` — executable `codex`/`codex.exe`; inner boundary
  `read-only-sandbox`; recoverable failures include
  `review-launcher-codex-result-artifact-missing`.
- `claude-detached-restricted-v1` — executable `claude`/`claude.exe`; inner
  boundary `read-search-tools-only`.

Host capture boundary = `review-launcher-host.mjs` `executeReviewLauncherHost`:
the fixed host-owned executable that prepares the worktree lifecycle, builds the
sealed package, launches the fresh read-only reviewer, validates the result, and
removes the view. It never trusts the transcript; it reads the owned final-result
artifact.

Terminalization boundary = `review-launcher-recovery.mjs`
`executePreparedReviewLauncherRecovery` + `acceptReviewLauncherHostResponse`:
denied, timed-out, malformed, or failed transports return a terminal
machine-readable unavailable record with no manual fallback; an accepted
response must validate schema, package digest, base/head commits, assurance,
reviewer identity, and terminal status, plus cleanup-removed, exactly once.

## Authorization

Explore is planning-only. Implementation (Propose/Apply) is NOT authorized and
requires explicit owner approval in the pre-v2/interactive lane.
