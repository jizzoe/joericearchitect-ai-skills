# M4-S4 Qualification — Resumption Handoff

Date: 2026-08-28
Status: Current handoff for a **new session**. It records state and does **not**
grant new Apply, GitHub, runtime-install, controller-recovery, or cleanup
authority. Every mutating action in the new session still needs its own fresh
owner authorization (`ship-sdd <change> prod` or equivalent).

Durable Git, GitHub, OpenSpec, installed-runtime, and controller state outrank
this document. Reinspect them before mutation.

## 1. TL;DR — where we are

- **M4-S4 goal**: qualify *single-change autonomous SDD reliability* with **10
  consecutive clean real completions** + a passing **disposable fault-matrix
  gate**.
- **Qualification count: 1/10.**
  - Run #1 `add-claude-cross-tool-repo-hygiene` — completed but does **not**
    count (duplicate/formalization of already-archived work).
  - Run #2 `add-generic-git-repository-cleanup` (issue #243) — completed end-to-end
    and **counts as completion #1**. Delivered 2026-08-28.
- **9 real completions remain**, then the fault-matrix gate.
- The strict-review machinery, controller, runtime, and repo are in a **clean,
  working state** right now (verified below). The prior-session repair detours
  (#244/#245/#247) are fully delivered and terminalized.

## 2. Read first

1. `AGENTS.md`, `docs/sdd-workflow.md`, `docs/sdd-foundation-operations.md`.
2. [Control-plane roadmap](../plans/autonomous-sdd-reliability-control-plane-roadmap.md)
   and its [revision](../plans/autonomous-sdd-reliability-control-plane-roadmap-revision.md).
3. **[Campaign roadmap + status](../plans/m4-s4-qualification-campaign-roadmap.md)** —
   the canonical order + progress tracker for the 9 remaining runs. Then the
   [M4-S4 qualification brief](../../design-briefs/autonomous-sdd-reliability-control-plane/m4-s4-single-change-reliability-qualification.md)
   and [explore output](../notes/autonomous-sdd/m4-s4-explore-output.md).
4. [Qualification issues log](../notes/autonomous-sdd/m4-s4-qualification-issues.md)
   (the running framework-issue capture).
5. [Blocker register](autonomous-sdd-blocker-register-and-plain-english-handoff.md).
6. [Prior M4-S4 session handoff](autonomous-sdd-m4-s4-qualification-handoff.md)
   and [repairs closeout/resumption handoff](autonomous-sdd-m4-s4-repairs-closeout-and-resumption-handoff.md).

## 3. Current state (verified 2026-08-28)

- Primary worktree: `/Users/joerice/git/joericearchitect/joericearchitect-ai-skills`
  — on branch `main`, **clean**, head `b5cd6145d44d8d68767bbc5dbd48949c6297338f`
  (= `origin/main`).
- `openspec validate --all --strict`: **48 passed, 0 failed**. No active changes.
- Full test suite: **726 passed, 0 failed** (up from 712 at the start of Run #2).
- Installed runtime: `ai-skills-runtime doctor` → `ok: true`, source revision
  `4ad0a677809626fb9313f443eb07f5321107ccb0` (the merged main at Run #2 closeout;
  the only later commit `b5cd6145` is the planning-notes PR, which does not change
  runtime content — no re-install required).
- Controller: no active admission remains. The Run #2 v2 run
  `controller-3f48e2d4b947a53326580b1d670ed446` is **terminalized** (claim
  released, archived). The stranded #244 run was cancelled during Run #2 startup.

### Run #2 delivered evidence (for provenance)

| Step | PR | Squash commit |
|---|---|---|
| Implementation | #256 | `6391aa7821c683c4c6942772b6b931849ba8bbb8` |
| Archive + Sync | #257 | `4ad0a677809626fb9313f443eb07f5321107ccb0` |
| Planning notes | #258 | `b5cd6145d44d8d68767bbc5dbd48949c6297338f` |

- Issue #243 auto-closed by PR #256.
- Run #2 strict isolated Codex review passed **0 findings** at
  `1fa10d75e8fcf810b70b16f3aecea35d72aa3a01` (after ~24 hardening iterations).

## 4. Remaining qualification — follow the campaign roadmap

The prior-session queue tension is **resolved** (owner, 2026-08-28): **job-search
repo work is on hold.** The remaining 9 completions are reusable **global skills
built in this repo**, consumed by the mobile app for code generation, review, and
later the independent verifier.

**Canonical queue + order + status:**
[`ai-planning/plans/m4-s4-qualification-campaign-roadmap.md`](../plans/m4-s4-qualification-campaign-roadmap.md).
Follow it **in order**.

Rules for the new session:

1. Read the campaign roadmap first — it is the source of truth for order and
   running status (10 rows: 1 completed + 9 remaining).
2. Each run takes the **next uncompleted row in order**; do not skip or reorder
   without owner sign-off. #4 `add-react-native-expo-quality-overlays` and #7
   `add-sonarqube-client-and-quality-gate` are the intended stress tests.
3. After each completed run, **update that roadmap row's `Status`** to
   `✅ Completed — Run #N, counts N/10` (with date + PR/commit evidence) and
   append framework findings to the qualification issues log.
4. A material defect that invalidates prior runs **restarts the streak**.

## 5. How we track framework issues

Three-tier capture. Use all three consistently:

1. **Fast in-flight log** —
   `ai-planning/notes/autonomous-sdd/m4-s4-qualification-issues.md`. One row per
   finding: `# | run | slice | phase | symptom | classification
   (defect|gap|observation) | status (open|promoted|resolved) | issue link`.
2. **Promotion** — any **material defect** becomes a GitHub Issue in the owning
   repo with label `qualification-finding`, then the log row is marked `promoted`
   and linked.
3. **Blocker register** —
   `ai-planning/handoff-docs/autonomous-sdd-blocker-register-and-plain-english-handoff.md`
   — for anything that pauses/stops the campaign; classify before bypassing or
   repairing.

## 6. Fixed so far (framework repairs, for reappearance triage)

These are framework/harness defects already found and fixed. If the new session
sees the same symptom again, treat it as a **reappearance** (see §7).

| Issue | PR | What it fixed |
|---|---|---|
| #239 | #240 | Codex `permissions.sealed-review` profile → `sandbox-exec` re-exec denied (switched to `--sandbox read-only`); findings schema `$schema` draft-2020-12 rejected by Claude (→ draft-07); Claude reviewer had no isolated auth provisioning (`prepareClaudeReviewerEnvironment`) |
| #241 | #242 | Runtime passed `claude` to `gh skill list` (valid id is `claude-code`) and bare `--json` (needs field list `--json skillName,version,pinned`); test stubs now assert the real arg vector |
| #245 | #246 | Controller phase advancement + blocked-run recovery (early cancel, phase reconstruction) |
| #247 | #251 / #252 | Strict review terminal event capture (parent-capture review transport) — commit `cb5e0d5` |
| #244 | #253/#254/#255 | `requirements-to-plan` runtime outcome validation (3 new requirements, 11 total) |

Earlier (pre-M4-S4) control-plane repairs already merged and still relevant if
reappear: #115 (terminal cleanup), #123 (global install), #138 (Claude degraded
review MCP CLI-invalid), #146 (gh auth context detection), #154/#162/#170/#174
(legacy controller reconciliation), #181/#187/#193 (v2 controller initialization),
#203 (bootstrap runtime/controller recovery).

### Run #2 hardening findings (the skill, not the framework)

Run #2's strict-review loop hardened `generic-git-repository-cleanup` itself.
Those findings are fixed in the delivered skill and are **not** framework issues,
but the list is a useful reference for similar skills: policy discovery (default
branch/remote/validation/protected-branch/active-change/ownership locations),
push OID binding + commit-outcome binding, receipt digest, NUL-delimited status
parsing, paired rename records, realpath/symlink guards, PR `baseRefName`
binding, force-with-lease remote delete, staged-blob inspection, primary-worktree
exclusion, and exact candidate identity.

## 7. Reappearance protocol

If a symptom matches anything in §6 (or an earlier repair):

1. **Call it out explicitly** in the running log and to the owner: "this is a
   reappearance of issue #NNN, which was fixed in PR #NNN — it should not recur."
   Do not silently re-fix as if new.
2. **Short-circuit the fix** by reading the delivered repair:
   - `git show <squash-commit>` or `git log --oneline --all -- <file>` for the
     changed files; the archive directories under
     `openspec/changes/archive/2026-08-27-*` / `2026-08-28-*` contain the
     proposal/spec/tasks for each repair.
   - Reuse the exact fix pattern rather than re-deriving it.
3. **If the fix did not hold**, investigate *why* (regression, different code
   path, environment drift) and record that as a new finding, cross-referencing
   the original issue.

## 8. Open / deferred follow-ups (still relevant)

From `ai-planning/notes/ad-hoc-follow-ups.md` — resolve or consciously skip, but
do not forget:

- **Host-managed reviewer binaries** (2026-08-27): the parent-capture strict
  review requires the reviewer binary + path chain to be **system-owned,
  non-writable** (mutation-proof preflight). A normal Homebrew Codex install
  fails this. Not yet surfaced in setup/docs. Revisit before the next strict
  review on a fresh machine or after any `brew upgrade`/reinstall of the
  reviewer CLIs.
- **Claude as degraded backup reviewer** (2026-08-27): `ship-sdd prod` resolves
  to `strict-only` (no degraded fallback). Claude adapter exists but produces
  `authorized-degraded` (not `strict-isolated`) and is not wired into the
  shorthand. A `strict-first-degraded` profile/shorthand is needed to opt in.
- **Jira-linkage rules** (2026-08-20): no durable Jira integration exists. Do
  not infer/create Jira records until a dedicated slice is accepted and an
  authorized connection is configured.
- **Missing `tracking.yaml` on the archived M4-S4 qualification change**
  (2026-08-28): `openspec/changes/archive/2026-08-25-qualify-autonomous-sdd-single-change-reliability/`
  exists but has **no `tracking.yaml`**. This makes any PR that cites
  `OpenSpec change: qualify-autonomous-sdd-single-change-reliability` fail the
  `validate-openspec-linkage.mjs` `openspec.tracking_exists` check. The new
  session should either add the missing tracking metadata (its own governed
  change) or cite a change whose tracking.yaml exists when writing
  qualification-related planning PRs.
- **D3/D4 implementation draft preserved on
  `feat/harden-autonomous-sdd-governance-and-review`** (2026-08-28): this branch
  (pushed to `origin`) is the **code companion** to the D2/D3/D4 briefs merged
  via PR #260. It holds undelivered review-hardening implementation — severity
  classification (`scripts/sdd/test/review-severity-classification.test.mjs`),
  per-signature counters, single-source checklist, correction budget, and edits
  to `independent-review-contract.mjs` / `review-findings.mjs` /
  `platform-review-adapters.mjs`. It predates the #239/#247 review repairs, so
  rebase/reconcile against `main` before pursuing D3/D4. Repo cleanup note: all
  other stale local branches and the two leftover d1 worktrees were removed on
  2026-08-28; only `main` and this branch remain.

## 9. Campaign mechanics and gotchas (learned, do not relearn)

- **Profile**: `ship-sdd <change> prod` = autonomous production-rapid,
  **strict-only** independent review. Strict-unavailable = fail-closed pause (no
  silent degraded fallback).
- **Threshold**: 10 consecutive clean real completions; an authorized pause/
  restart between completed transitions does **not** break the streak, but a
  terminal/incomplete run or an invariant defect does.
- **Fault-matrix gate**: disposable, in `sdd-fixture`, never injected into real
  work, never increments the real counter. Scenario matrix is drafted (10 rows)
  in `m4-s4-explore-output.md` §Q2 but **final matrix approval is still
  pending**.
- **Pause conditions** (broader than "material decision + uncorrectable
  failure"): ambiguous durable state, in-doubt external outcome, host/permission
  denial, missing credential, unexpected scope expansion, destructive action
  outside plan, secret-leak risk, behavior-changing validation failures.
- **Always branch from `origin/main`** — not a local `main` that may hold
  unpushed commits — or unrelated local commits get folded into the squash merge.
- **PR body linkage** (`validate-openspec-linkage.mjs`) requires **both** an
  issue reference (`Closes #NNN` / `Related to #NNN`) **and**
  `OpenSpec change: <name>`. Planning-only PRs also need both; reference the
  nearest real issue/change (e.g. the prior run) when the PR has no issue of its
  own.
- **`openspec archive <change> --yes`** must run from the delivery worktree
  against the merged main, then commit + push + PR the archive (this is the
  Sync+Archive delivery).
- **Controller `terminalize-v2-run`** requires full reconstructed
  `completionEvidence` (implementation/sync/archive delivery bindings with
  merged flag + reference + delivered head commit) and a terminal summary
  (`terminalStatus`, `finalHead`, `childHistoryReference`, `childHistoryDigest`).
  Advance controller phases/bindings **as you go** (don't do all delivery
  manually and then struggle to reconstruct evidence at the end — that is what
  stranded the #244 run).
- **Strict review machinery** (working sequence, verified): see the prior
  session handoff §"The strict review machinery". Requires full 40-char SHAs;
  reviewer `identity` must differ from `implementerSession` (anti-self-review).
- **Fresh authorization per run**: backlog membership never grants standing
  authorization. Every real run has its own accepted brief, exact grant, profile,
  evidence, and stop conditions.

## 10. Safe next-session sequence

1. **Reconcile read-only state**: `git fetch --prune origin && git status`,
   `git worktree list --porcelain`, `openspec list --json`,
   `openspec validate --all --strict`, `ai-skills-runtime doctor`, and current
   GitHub/Project reads (non-secret auth context).
2. **Take the next uncompleted row from the campaign roadmap** (§4) and obtain
   fresh owner authorization for that run (Run #N), naming the change, lifecycle
   scope, review policy, duration, issue handling, and post-merge runtime install.
3. **Run the change** in a registered isolated worktree in task order; focused
   validation + fresh code/security/coherence review after each major component;
   correct objective findings and rereview.
4. Complete Verify → fresh independent review → exact-head CI → delivery (PR +
   squash-merge) → Sync → Archive → receipt-backed cleanup → runtime install,
   all inside the fresh authorization, advancing controller phases as you go.
5. **Terminalize the controller run** at the end (reconstruct evidence from the
   same run's bindings).
6. Append any new framework findings to the qualification issues log; promote
   material defects to `qualification-finding` GitHub issues; follow the §7
   reappearance protocol for anything already fixed.
7. Repeat until all 10 campaign-roadmap rows are completed, **updating each
   row's `Status` after every run**; then run the disposable fault-matrix gate,
   then update the roadmap + M4-S4 qualification record before touching M5.

## 11. Key files and commands

- Qualification log: `ai-planning/notes/autonomous-sdd/m4-s4-qualification-issues.md`
- **Campaign roadmap (order + running status): `ai-planning/plans/m4-s4-qualification-campaign-roadmap.md`**
- Candidate list: `ai-planning/notes/autonomous-sdd/m4-s4-campaign-candidate-list.md`
- Roadmap: `ai-planning/plans/autonomous-sdd-reliability-control-plane-roadmap.md`
  (+ `-revision.md`)
- Review machinery: `scripts/sdd/{platform-review-adapters,independent-review-contract,detached-review-view}.mjs`
- Qualification machinery (fault matrix): `scripts/sdd/autonomous-sdd-qualification.mjs`
- Runtime probe: `scripts/runtime/{launcher,install-runtime}.mjs`
- Validate: `openspec validate --all --strict`
- Authorize + run: `ai-skills-runtime run autonomous-sdd-controller <operation> --repository <repo> -- --input <payload>`
- Delivery: branch from `origin/main` → `gh pr create` (body links issue +
  `OpenSpec change: <name>`) → `gh pr merge --squash --delete-branch` →
  `openspec archive <change> --yes` → commit + push + PR.

