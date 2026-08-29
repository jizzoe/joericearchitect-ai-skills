# M4-S4 Run #3 — Repair + Reviewer-Launch Handoff

Date: 2026-08-29
Status: Current handoff for a **new session**. Grants no authorization; every
mutating action still needs fresh owner authorization. Durable Git, GitHub,
OpenSpec, and controller state outrank this document.

## TL;DR

- Campaign: M4-S4 single-change autonomous SDD reliability. **1/10 completions.**
- Run #3 (`add-typescript-quality-overlay`) is **paused** at the controller-init
  gate, blocked by a stale terminalized checkpoint from Run #2.
- Two framework changes are authored and at **PRs ready for review**, both
  **blocked on the independent review** (see "The blocker" below).
- The **primary next-session task** is to restore a **direct Codex subprocess
  reviewer adapter** so the Codex reviewer can run from a plain shell
  (`authorized-degraded`), which unblocks review + merge for both PRs.

## Current state (verified 2026-08-29)

Branches:
- `main` — planning docs only; head `342e918`.
- `repair/stale-controller-record-recognition` — PR #263 (issue #262).
- `feature/add-configurable-reviewer-providers` — PR #265 (issue #264).
- `feat/harden-autonomous-sdd-governance-and-review` — the pre-existing D3/D4
  draft (unrelated; do not touch).

PRs (open):
- #263 `repair-stale-controller-record-recognition` — mergeable, CI green.
- #265 `add-configurable-reviewer-providers` — MERGEABLE, CI green.

Both pass `openspec validate --all --strict` (49 items) and the full sdd suite
(`node --test scripts/sdd/test/*.test.mjs` → 412 passed, 0 failed).

## What this session accomplished

1. Updated the campaign roadmap with per-run metric columns + a brief-validation
   step (commits `a82f03d`, `8fdba05`).
2. Started Run #3: brief scan + slice design brief
   (`ai-planning/design-briefs/add-typescript-quality-overlay.md`), then
   `initialize-v2-delivery` for `add-typescript-quality-overlay` — **paused**
   `legacy-inventory-ambiguous`.
3. Root-caused the pause to a **single** stale terminalized checkpoint
   (`controller-3f48e2d4…`, Run #2) whose phases were advanced manually.
   (Corrected an earlier "6 records" overcount: 5 cancelled siblings are
   auto-recognized as compatible-terminal.)
4. Authored + implemented `repair-stale-controller-record-recognition` (PR #263):
   `autonomous-sdd-legacy.mjs` now consumes a reconciliation receipt for a stale
   schema-5 checkpoint; regression test added.
5. Researched "launch any reviewer" and authored
   `add-configurable-reviewer-providers` (PR #265): `config/reviewer-providers.json`
   + `scripts/sdd/reviewer-providers.mjs` (registry + resolver) + 4 tests.
6. Recorded 3 pauses + multiple deferred follow-ups (see below).

## The blocker: strict review is host-mediated

`runCodexReviewAdapter` in `scripts/sdd/platform-review-adapters.mjs` is stubbed
to return `independent-reviewer-codex-capture-parent-required`. The strict Codex
review runs only through the **parent-capture transport** (Codex CLI's
`exec_command` tool with `require_escalated` + `auto_review`), which a plain-shell
agent cannot invoke. That is why the review "needs Codex the app" and why both
PRs cannot merge yet.

## Next-session primary task: direct Codex subprocess adapter

Make the Codex reviewer runnable from a plain shell:

- `/usr/local/bin/codex` runs fine from the shell (`codex-cli 0.150.1`) and is
  the root-owned mutation-proof copy.
- `codex exec` supports `--sandbox read-only`, `--output-schema <file>`, `--json`,
  `--config`, `--strict-config`, `--ephemeral`, `--ignore-user-config`.
- `buildCodexReviewInvocation` + `codexReviewChildArguments` already construct the
  exact `codex exec …` command; they are just not wired to run.
- Add a `runCodexSubprocessReviewAdapter` that spawns `codex exec`, parses the
  JSON findings, and returns an **`authorized-degraded`** result (honest
  capability ledger). Wire it into `executeReviewLauncherHost` and the provider
  registry (`config/reviewer-providers.json`).
- **Important:** a direct subprocess is `authorized-degraded`, NOT
  `strict-isolated`. The portable `strict-isolated` (OS sandbox + trusted-launch
  attestation) is a separate deferred follow-up (recorded below).

## Deferred follow-ups (in `ai-planning/notes/ad-hoc-follow-ups.md`)

1. Portable `strict-isolated` for arbitrary reviewers (OS sandbox + trusted-launch
   attestation) — full issue/problems/impact/pros-cons writeup.
2. Deterministic reviewer-binary discovery (name-generic + Claude locations +
   provisioning docs + `doctor` check) — includes the specific Claude gap.
3. Stale-checkpoint root cause (terminalization leaves the checkpoint stale when
   phases are advanced manually).

## Recorded pauses (roadmap `Pauses=3, Issues=1`; issues log #9/#10/#11)

- #9 `legacy-inventory-ambiguous` — defect.
- #10 reviewer-binary discovery — gap.
- #11 strict-review parent-transport — observation.

## Controller / runtime state

- `.git/sdd-delivery-runs/runs/controller-00f424e0…`
  (`add-typescript-quality-overlay`, `pending`) — this session's init attempt;
  correctly excluded on retry.
- `controller-3f48e2d4…` (Run #2, terminalized but stale, `currentPhase=propose`)
  — the single blocker; needs an owner reconciliation binding (exact `reference`
  + `recordDigest` + `scopeDigest` + future expiry) via
  `reconcile-legacy-bootstrap-record`.
- 5 cancelled records — auto-recognized `compatible-terminal`; NOT blockers.
- Review package for PR #263 already prepared: base `7132038…`, head `fd5630c…`,
  manifestDigest `008d4930…`, 7 artifacts.

## Next steps (in order)

1. Implement `runCodexSubprocessReviewAdapter` + wire into the gate + registry
   (primary task).
2. Run the Codex review (`authorized-degraded`) on PRs #263 and #265.
3. Merge (squash) → sync living specs → archive each change; reinstall runtime.
4. Reconcile Run #2's checkpoint (owner `scopeDigest` binding).
5. Resume Run #3 (`add-typescript-quality-overlay`).

## Key files + commands

- Campaign roadmap: `ai-planning/plans/m4-s4-qualification-campaign-roadmap.md`
- Issues log: `ai-planning/notes/autonomous-sdd/m4-s4-qualification-issues.md`
- Follow-ups: `ai-planning/notes/ad-hoc-follow-ups.md`
- Reviewer registry: `config/reviewer-providers.json`,
  `scripts/sdd/reviewer-providers.mjs`
- Strict-review machinery: `scripts/sdd/platform-review-adapters.mjs`
  (`runCodexReviewAdapter` stub, `buildCodexReviewInvocation`),
  `scripts/sdd/review-launcher-host.mjs`, `scripts/sdd/review-launcher-recovery.mjs`
- Validate: `openspec validate --all --strict`
- Tests: `node --test scripts/sdd/test/*.test.mjs`
- Authorize: `ship-sdd <change> prod` (resolves to autonomous strict-only, 4h)

## Gotchas (do not relearn)

- Branch **every** delivery from `origin/main`, not a local `main` with unpushed
  commits.
- PR body needs **both** an issue link (`Closes #NNN`) **and**
  `OpenSpec change: <name>` (the linkage CI enforces this); the change bundle
  needs a `tracking.yaml` with the matching issue.
- The Codex strict review is parent-capture; a shell `codex exec` is
  `authorized-degraded`, not `strict-isolated`.
- The reviewer-binary resolver already finds the root-owned `/usr/local/bin/codex`;
  Claude is NOT provisioned root-owned and has no resolver locations.
