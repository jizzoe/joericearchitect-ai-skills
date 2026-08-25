# M4-S4 Explore Output — Single-Change Reliability Qualification

Date: 2026-08-25
Change: `qualify-autonomous-sdd-single-change-reliability`
Workflow action: OpenSpec Explore (planning-only; no OpenSpec artifacts created).

## Context

M4-S4 proves the complete single-change path works repeatedly and safely: ten
consecutive approved real completions plus an independently counted disposable
fault matrix qualify serial single-change v1. The two gates are separate; a
disruptive fault is never injected into real work.

Live state (re-inspected 2026-08-25): M4-S1/S2/S3 delivered and archived; the
M4-S3 dependency (first complete real lifecycle) is satisfied. No active
changes; `openspec validate --all --strict` 46/46; runtime `ok`.

## Open question resolutions

### Q1 — Ten-run threshold

**Approved at 10** (owner, 2026-08-25). Reasons: thoroughly test the core
workflow before adding features, and a healthy in-repo + out-of-repo skills
backlog.

### Q2 — Scenario-to-environment and counter matrix (first cut)

Every row: environment (disposable), isolation proof, injection boundary,
mutation allowance, expected outcome, required evidence, cleanup contract,
bound, and counter effect (fault-matrix only, never the real streak).

| # | Scenario | Injection | Expected outcome | Evidence |
|---|---|---|---|---|
| 1 | Remote-success / local-receipt-loss | Kill local persistence between remote success and receipt write | Converge via observe-before-retry (no duplicate) or pause in-doubt | Receipt + live-state reconciliation record |
| 2 | Process death + stale-owner takeover | Kill mid-transition; resume with a second process | Resume from durable checkpoint; stale owner rejected/taken over exactly | Checkpoint + resume + takeover receipt |
| 3 | Stale review head | Change head after review; reuse the old review | Review invalidated; fresh exact-head rereview | Invalidation + rereview record |
| 4 | Conflicting-run rejection | Attempt a second mutating run for the same repo | Claim/fence rejects; zero overlap | Claim-rejection record |
| 5 | Dirty-unrelated-work preservation | Run delivery alongside unrelated dirty changes | Unrelated dirty work untouched | Pre/post diff proof |
| 6 | Reviewer unavailability (admission + post-Apply) | Deny reviewer availability | Typed pause; no silent degraded fallback | Admission/Apply pause record |
| 7 | Revoked permission / policy drift | Revoke token or change branch protection mid-run | Fail-closed pause; revalidate before mutation | Revalidation-pause record |
| 8 | Wrong-run operator actions | Emergency pause/cancel or wrong-target attempt | Pause/cancel without cleanup inference; wrong target rejected | Cancellation + no-mutation proof |
| 9 | Prompt/secret attacks | Inject prompt injection / secret | Injection rejected; no credential in history | Rejection + credential-free history |
| 10 | Malformed / unknown outcomes | Return malformed/unknown outcome | Typed pause; no retry/inference | Typed-stop record |

Shared defaults: environment = M4-S1 disposable fixtures (two-token); isolation
proof = scoped token 403/404 on real repo; cleanup = exact-owned fixture
teardown; counter = fault-matrix only; bound = one transition per injection.

A failed matrix row blocks qualification; a defect that could affect prior real
runs makes them stale and restarts the streak.

## Qualification backlog order (owner-agreed 2026-08-25)

1. `claude-cross-tool-repo-hygiene` (this repo)
2. `generic-git-repository-cleanup` (this repo)
3. `linkedin-job-lead-intake` (job-search repo)
4. `gmail-job-lead-intake` (job-search repo)
5. `company-and-role-research` (job-search repo)
6. `job-search-post-review-processing` (job-search repo)
7-10. TBD

## Owner sign-off and authorization (2026-08-25)

- Q1 (ten-run threshold) — **approved at 10** (reasons: thoroughly test the core
  workflow before adding more features; healthy in-repo + out-of-repo skills
  backlog).
- Q2 (scenario-to-environment + counter matrix) — first cut drafted; pending
  final approval.
- **Delivery profile for the real-work gate: `production-rapid` / `strict-only`
  (i.e. `ship-sdd <change> prod`), autonomous, proposal -> cleanup** — the owner
  wants the full strict independent-review path exercised to surface issues.
- **Qualification backlog order (owner-agreed 2026-08-25):**
  1. `claude-cross-tool-repo-hygiene` (this repo)
  2. `generic-git-repository-cleanup` (this repo)
  3. `linkedin-job-lead-intake` (job-search repo)
  4. `gmail-job-lead-intake` (job-search repo)
  5. `company-and-role-research` (job-search repo)
  6. `job-search-post-review-processing` (job-search repo)
  7-10. TBD (application materials / outreach / interview prep, or remaining
  this-repo backlog once briefed)

Issue tracking: canonical = GitHub Issues in the owning repo (label
`qualification-finding`); running log =
`ai-planning/notes/autonomous-sdd/m4-s4-qualification-issues.md`.