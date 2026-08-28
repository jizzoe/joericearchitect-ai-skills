# Autonomous SDD M4-S4 repair closeout and resumption handoff

Date: 2026-08-27

Status: Current local-session handoff. It records state and does **not** grant
new Apply, GitHub, runtime-install, controller-recovery, or cleanup authority.

## Purpose

Resume the M4-S4 single-change reliability qualification campaign after Run #2
was interrupted by framework repairs. This document separates the paused
roadmap work, unfinished Run #2 work, delivered repairs, and the one remaining
active repair.

Durable Git, GitHub, OpenSpec, installed-runtime, and controller state outrank
this document. Reinspect them before mutation.

## Read first

1. `AGENTS.md`, `docs/sdd-workflow.md`, and
   `docs/sdd-foundation-operations.md`.
2. [Control-plane roadmap](../plans/autonomous-sdd-reliability-control-plane-roadmap.md).
3. [M4-S4 qualification handoff](autonomous-sdd-m4-s4-qualification-handoff.md)
   and [qualification issues log](../notes/autonomous-sdd/m4-s4-qualification-issues.md).
4. [Blocker register](autonomous-sdd-blocker-register-and-plain-english-handoff.md).
5. The complete active planning package:
   `openspec/changes/repair-requirements-to-plan-outcome-validation/`.
6. The delivered repair archives, from `origin/main` if the primary worktree
   remains behind:
   - `openspec/changes/archive/2026-08-27-repair-strict-review-terminal-event-capture/`
   - `openspec/changes/archive/2026-08-27-repair-controller-phase-advance-and-early-cancel/`

## Roadmap status

| Milestone or slice | Status |
|---|---|
| M1 — Contract convergence (M1-S1 through M1-S3) | Complete and archived |
| M2 — Deterministic local single-change execution (M2-S1 through M2-S3) | Complete and archived |
| M3 — Independent-review reliability (M3-S1 through M3-S3) | Complete and archived |
| M4-S1 — GitHub intake and implementation delivery | Complete and archived |
| M4-S2 — Sync and Archive delivery | Complete and archived |
| M4-S3 — Finalization and cleanup | Complete and archived |
| **M4-S4 — Single-change reliability qualification** | **In progress; paused for repairs** |
| M5 — Cross-repository coordination (M5-S1) | Not started; blocked by M4-S4 exit |
| M6 — Milestone queues and owner shorthand (M6-S1, M6-S2) | Not started; blocked by M4-S4 exit |
| M7 — Five-slice qualification and default cutover (M7-S1 through M7-S3) | Not started; depends on M6 |
| M8 — Optional Temporal backend (M8-S1) | Not started; conditional after M7 |

The deferred fine-grained-parallel-execution decision and the separate Jira
integration gate remain out of scope. GitHub is the only implemented tracker;
see `ai-planning/notes/ad-hoc-follow-ups.md` before proposing Jira work.

## Current milestone and slice

The paused roadmap work is **M4-S4**,
`qualify-autonomous-sdd-single-change-reliability`.

- M4-S4 requires two independent proofs: **10 consecutive qualifying real
  completions** and a passing disposable fault matrix.
- Current qualification count: **0/10**. Run #1
  (`add-claude-cross-tool-repo-hygiene`) was a duplicate/formalization of
  pre-existing work and does not count.
- Run #2 is `add-generic-git-repository-cleanup`. It is unfinished and does
  not count.
- The disposable fault matrix has not yet run against its fixture.

The next roadmap slice after M4-S4 exits is M5-S1,
`add-autonomous-sdd-cross-repository-coordination`. Do not start it early:
M4-S4 is its hard gate.

## Run #2 status: generic Git repository cleanup

The Run #2 implementation is on pushed branch
`feat/add-generic-git-repository-cleanup`, head
`c669135f2cd1ad4c1dd2c05d53ac4bbedb12a5b3`.

- No PR was observed for this topic, so it has not completed delivery, Sync, or
  Archive.
- Its relevant commits are `5844ec4` (initial capability), `25240df`
  (owner-approved open-question resolutions), and `c669135` (Q2/Q4 and
  payload-verb corrections).
- The branch is an implementation snapshot, not delivery evidence. Preserve it.
- The earlier strict review reported seven material findings plus one advisory.
  The recorded hardening areas are policy discovery, remote-state validation,
  active-change reporting, push OID binding, receipt integrity, and porcelain
  parsing. Reinspect and create a fresh review package; do not reuse an old
  result.

The agreed M4-S4 queue is recorded in the exploration note. After Run #2, the
next candidates are the job-search backlog. Every candidate still needs its
own accepted brief and exact authorization.

## Repairs delivered while M4-S4 was paused

### Strict-review terminal event capture

- Change: `repair-strict-review-terminal-event-capture`
- Issue #247; delivered PRs #248 implementation, #249 Sync, #250 Archive
- Final Archive commit: `15fb47825250d15a11654609c6737f2ac70b068e`

This repair addresses the real failure in which Codex could produce a review
result but the reviewer process did not reliably save the final findings file.
The reviewer now emits structured JSONL only; a fixed host capture adapter
selects the final completed agent message and atomically publishes the artifact
and receipt.

Preserve these invariants:

- accept only the **last** completed `agent_message` before exactly one
  `turn.completed` and end of stream;
- authenticate bounded raw request bytes with an independently sealed digest
  before parsing operational fields;
- keep stdout JSONL separate from stderr and never treat transcript/reasoning
  as findings evidence;
- use no-clobber same-filesystem hard-link publication, not ordinary replacement
  rename;
- allow only one transport-only retry for a missing final message or terminal
  event after cleanup and while all exact bindings remain current.

The repair used an exact N-1 Claude bootstrap review because it changed the
Codex capture transport. After installation, the normal adapter was restored
to `codex-detached-read-only-v1`.

Known follow-up, not a current delivery blocker: the ordinary installed N-1
review runner had a 120-second subprocess deadline, while the authorized
bootstrap runner used a fixed 10-minute deadline. Treat deadline policy and
timeout diagnostics as a separate scoped change; do not silently widen a
production deadline during another delivery.

### Controller phase advancement and early cancellation

- Change: `repair-controller-phase-advance-and-early-cancel`
- Issue #245 (closed; Project Done)
- Delivered PRs #246 implementation, #251 Sync, #252 Archive
- Implementation head: `5d21f53dad9335b7c5832453e7c3e94752dfbf7f`
- Final Archive commit: `f5a92e6d128fd7da04d8da9c61395b060545b77c`

This repair added the installed controller's durable, first-incomplete-only
phase-evidence transition and a narrowly bound early-cancellation path for an
undelivered blocked run. It was proven against its own existing controller,
without editing a checkpoint by hand:

1. Archive advanced through the installed transition using
   repository-relative content hashes.
2. Cleanup audited and removed exactly three clean non-primary worktrees and
   their three delivered local branches, writing start/completion receipts.
3. Cleanup advanced through the installed transition.
4. The v2 parent/work-unit/claim was terminalized, its claim released, and its
   run archived. An idempotent retry returned `already-terminalized`.

The final controller was `controller-080fdee510280142da2efc77ee7ffbb1`.
Its archived v2 state is under:

`/Users/joerice/.local/state/ai-skills/autonomous-sdd/repositories/joericearchitect-ai-skills--1a26c8325157/archive/2026/08/27/parent-080fdee510280142da2efc77ee7ffbb1`

All temporary bootstrap/review scripts used for these two repairs were removed
after both runtimes were installed. The durable cleanup receipt records 33
exact files and zero residuals. Do not recreate or reuse an old bootstrap
script; use the installed runtime and a new exact authorization.

## Installed runtime and review status

At the end of this session, `ai-skills-runtime doctor` reported an available,
content-verified runtime:

- source revision: `f5a92e6d128fd7da04d8da9c61395b060545b77c`
- digest: `ce9eb98785e121c760b607fb2e333c217d30dd3256d0b557be6e1534db5d6783`
- active generation: `runtime-ce9eb98785e1`

The exact repair review used a fresh N-1 Claude fallback only after strict
Codex unavailability was durably recorded. The owner accepted
`authorized-degraded` only for that exact package. It passed with no material
findings. This is not standing authorization for future fallback.

The two prior strict Codex review failures ended before the reviewer returned a
result. Available evidence did not establish why Codex terminated internally.
The terminal-event repair changes who writes the artifact and retains safe
diagnostics; it does not claim to prevent every timeout or crash.

## Remaining repair: requirements-to-plan outcome validation

The only active OpenSpec change is:

- `repair-requirements-to-plan-outcome-validation`
- issue #244 (open; no Project item at the last read)
- planning package:
  `openspec/changes/repair-requirements-to-plan-outcome-validation/`
- task status: 0/9 complete

This is sometimes called **D1** in prior conversation. It is a repair, not a
roadmap milestone or slice. It fixes the installed
`sdd-requirements-to-plan` launcher, which omits the required
outcome-validation dependency even though test fixtures inject a permissive
callback.

The accepted design is deliberately fail-closed:

- add a canonical v1 requirements-outcome parser under `scripts/sdd/`;
- require the exact marker, `## Accepted outcomes` heading, ordered
  outcome/acceptance pairs, meaningful non-instruction-like text, and a
  content SHA-256;
- inject the validator only from the installed planning-runtime launcher;
- retain the executor's independent second digest/non-empty check;
- reject legacy, malformed, vague, forged, stale, and instruction-like input
  before a plan write; do not add heuristic legacy parsing.

Read its `proposal.md`, `design.md`, delta spec, and `tasks.md` completely
before applying.

### Important #244 controller boundary

The prior controller is expired and must remain untouched until a fresh
authorized recovery decision:

- controller: `controller-e45c82049d4f6606bcfc1abbef4ad8cc`
- selected entry: `repair-requirements-to-plan-outcome-validation`
- phase: `propose`; all eight phases pending
- expiry: `2026-08-26T23:47:21.999Z`
- record:
  `.git/sdd-delivery-runs/runs/controller-e45c82049d4f6606bcfc1abbef4ad8cc/controller.json`

The controller-phase repair is now installed, but #244 still needs fresh
explicit Apply/delivery authorization and a new durable admission/recovery
decision based on current state. Let the installed runtime classify the expired
run; never manufacture a claim or hand-edit controller JSON.

## Local state to preserve

The primary worktree is intentionally not a clean delivery worktree:

- path: `/Users/joerice/git/joericearchitect/joericearchitect-ai-skills`
- local branch: `244-fix-requirements-to-plan-runtime-outcome-validation`
- local HEAD: `aa2439116cbff2eb2477fda961b15813a4bf2131`
- `origin/main` at the last read:
  `f5a92e6d128fd7da04d8da9c61395b060545b77c`
- existing untracked content: the #244 OpenSpec planning directory and this
  handoff document.

Do **not** reset, clean, rebase, or force-update the primary worktree to make
it look current. Fetch and inspect first. Create a new isolated worktree from
current `origin/main` for newly authorized implementation, and adopt the
planning artifacts only after a deliberate comparison.

The old Run #2 worktree must also be preserved:

- `/private/tmp/ai-skills-add-generic-git-repository-cleanup`
- branch `feat/add-generic-git-repository-cleanup`
- head `c669135f2cd1ad4c1dd2c05d53ac4bbedb12a5b3`

It is unrelated to #244 and must not be cleaned as a side effect.

## Safe next-session sequence

1. Reconcile read-only state: `git fetch --prune origin`, `git status`,
   `git worktree list --porcelain`, `openspec list --json`,
   `openspec validate --all --strict`, `ai-skills-runtime doctor`, and
   current GitHub/Project reads using non-secret authentication context.
2. Preserve the dirty primary worktree and confirm #244 planning artifacts are
   still complete and unchanged.
3. Obtain fresh owner authorization naming #244, its lifecycle scope, review
   policy, duration, recovery policy if needed, GitHub issue handling, and
   post-merge runtime installation.
4. Use the installed controller to inspect/recover the expired #244 state.
   Stop on any identity, claim, authorization, or recovery-evidence mismatch.
5. Implement #244 in a registered isolated worktree in task order. After each
   major component, run focused validation and a fresh code/security/coherence
   review; correct objective findings and rereview.
6. Complete Verify, fresh independent review, exact-head CI, delivery, Sync,
   Archive, receipt-backed cleanup, and runtime installation only inside the
   fresh authorization.
7. Then return to Run #2, harden its listed review findings, conduct a fresh
   review, and complete its lifecycle before counting it as M4-S4 completion
   #1.

## Final verified state

- `openspec validate --all --strict`: 48 passed, 0 failed.
- PR #246, #251, and #252 are merged; issue #245 is closed and Project status
  is Done.
- Exact-head CI for PR #246 passed audit, linkage, OpenSpec validation, and
  Linux/Windows runtime checks.
- The final controller had all eight phases complete, 12 cleanup receipts for
  six owned resources, and an archived released claim.
- Both repairs are installed; no temporary bootstrap executables remain.
- No M4-S4 qualification completion has been counted.

## Plain-English pause policy

For every stop, explain what was attempted, what proof is missing, why the
guard exists, whether a completed roadmap should still stop there, the smallest
safe repair or resume path, and what remains untouched. Classify it using the
blocker-register categories before bypassing or repairing it.
