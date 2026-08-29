# M4-S4 Qualification Campaign — Roadmap & Status

Date: 2026-08-28
Status: **Authoritative campaign queue + running progress tracker.** Supersedes the
2026-08-25 owner-agreed backlog in `notes/autonomous-sdd/m4-s4-explore-output.md`
and the M4-S4 backlog paragraph in
`plans/autonomous-sdd-reliability-control-plane-roadmap.md`. Grants no
authorization; every run still needs its own fresh owner grant
(`ship-sdd <change> prod`).

## Decision (owner, 2026-08-28)

- **Job-search repo work is on hold.**
- The 10 completions are reusable **global skills built in this repo**
  (`joericearchitect-ai-skills`), consumed by the mobile app for code
  generation, review, and (later) the independent verifier.
- Candidate rationale: `notes/autonomous-sdd/m4-s4-campaign-candidate-list.md`.

## The queue (10 completions)

Per-run metric columns (definitions in "Tracking rules"): **Elapsed** = implementation
wall-clock *including* pauses; **Exec** = implementation active time *excluding*
pauses; **Tokens** = tokens consumed; **RTF#** = review-test-fix loop count;
**RTF⏱** = review-test-fix loop duration; **Pauses** = number of pauses;
**Issues** = number of true issues found. `—` = not measured / not started.

| # | Change | Skill(s) | Brief | Status | Elapsed | Exec | Tokens | RTF# | RTF⏱ | Pauses | Issues |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `add-generic-git-repository-cleanup` | `generic-git-repository-cleanup` | `design-briefs/generic-git-repository-cleanup.md` | ✅ **Completed** — Run #2, counts 1/10 (2026-08-28) | — | — | — | — | — | — | — |
| 2 | `establish-shared-quality-context-and-standards-pack` | `standards-pack` + context policy | `standards-driven-quality-skills.md`, `react-native-expo-quality-skills.md` | ⏭️ **Skipped** — duplicate of archived M1 work (PR #119/#120) | — | — | — | — | — | — | — |
| 3 | `add-typescript-quality-overlay` | `typescript-javascript-review` | `standards-driven-quality-skills.md` | 🔄 In progress — paused on `legacy-inventory-ambiguous` (repair in flight) | — | — | — | — | — | 1 | 1 |
| 4 | `add-react-native-expo-quality-overlays` | `react-native-review` + `expo-review` + mobile standards | `react-native-expo-quality-skills.md` | ⬜ Not started | — | — | — | — | — | — | — |
| 5 | `add-java-spring-quality-overlay` | `java-spring-review` | `standards-driven-quality-skills.md` | ⬜ Not started | — | — | — | — | — | — | — |
| 6 | `add-terraform-static-quality-overlay` | `terraform-review` | `standards-driven-quality-skills.md` | ⬜ Not started | — | — | — | — | — | — | — |
| 7 | `add-sonarqube-client-and-quality-gate` | `sonarqube-client` + `sonarqube-quality-gate` | none (jra-sonarqube research) | ⬜ Not started | — | — | — | — | — | — | — |
| 8 | `add-sonarqube-issues-and-coverage` | `sonarqube-issues` + `sonarqube-coverage` | none (jra-sonarqube research) | ⬜ Not started | — | — | — | — | — | — | — |
| 9 | `add-repository-status-skill` | `repository-status` | `ideas/catch-all.md` | ⬜ Not started | — | — | — | — | — | — | — |
| 10 | `add-git-health-skill` | `git-health` | `ideas/catch-all.md` | ⬜ Not started | — | — | — | — | — | — | — |
| 11 | `add-standards-pack-generation-consumption` | `standards-pack` generation-side consumption | `standards-driven-quality-skills.md` | 🔜 **Queued** — future row, replaces skipped #2 | — | — | — | — | — | — | — |

## Tracking rules

- Build **in order**. Dependencies: #2 → #3 → #4 (standards-pack then TS then
  RN/Expo). SonarQube #7/#8 are independent of the overlays and may run in
  parallel with #2–#6.
- **#2 was skipped (2026-08-28)** — it is a duplicate of already-archived M1
  work (PR #119 + #120). Its counting slot is replaced by #11
  `add-standards-pack-generation-consumption` (queued).
- After each completed run, set its `Status` to
  `✅ Completed — Run #N, counts N/10` plus date and PR/commit evidence, and
  fill in the seven metric columns for that row.
- **#4 (`add-react-native-expo-quality-overlays`) and #7
  (`add-sonarqube-client-and-quality-gate`) are the intended stress tests** most
  likely to surface framework gaps; do not reorder them lower without owner
  sign-off.
- A material defect that invalidates prior runs **restarts the streak**; record
  it in `notes/autonomous-sdd/m4-s4-qualification-issues.md` and the blocker
  register.

### Per-run metric columns (added 2026-08-28; refined 2026-08-28)

- **Elapsed** — implementation duration (elapsed): wall-clock from
  implementation start to completion, **including** pauses (a 1.5 h owner wait
  is included).
- **Exec** — implementation duration (execution): active execution time only,
  **excluding** pauses.
- **Tokens** — tokens consumed, recorded as four values. Best-effort estimates
  are acceptable, labeled `~est.` (the runtime does not currently expose exact
  per-run token counters): **(a)** implementation agent; **(b)** reviewer, one
  count **per reviewer run** (a list); **(c)** reviewer total (Σ of b);
  **(d)** grand total across all agents/tools (a + c + overhead). The roadmap
  cell holds a compact summary (`impl ~X · rev Σ~Y · all ~Z`); the full per-loop
  breakdown goes in the run's metrics note.
- **RTF#** — review-test-fix loop count. **One loop = one strict-reviewer
  launch** (one reviewer invocation producing a result), **including the final
  clean "no findings" review**. In the normal clean-termination case this equals
  `correctionCount + 1` (initial review + one re-review per fix). The code has no
  "loop" primitive: controller phases are `propose → planning-review → apply →
  verify → delivery → sync → archive → cleanup`; review is a gate inside
  `verify`/`delivery`; the implementer drives `review → fix → rerun checks →
  re-review` by hand (a changed head invalidates the prior review and forces a
  fresh exact-head re-review).
- **RTF⏱** — review-test-fix loop duration: total time spent inside
  review-test-fix loops.
- **Pauses** — number of pauses: one count per halt. A halt is caused by an
  owner clarification/decision/judgment **or** a true issue. **Every true issue
  also counts as +1 Pause** (it halted the run to fix it).
- **Issues** — number of true issues (defects/gaps) found. Each true issue is
  `+1 Issues` and `+1 Pauses`; an owner-question halt is `+0 Issues, +1 Pauses`.

## Brief validation before implementation

Before starting **any** implementation (Apply) work on a row, scan the change's
design brief(es) and planning inputs for **open questions, incompleteness,
incoherence, or inconsistencies**, and validate they are ready to proceed. Fix
anything fixable that does **not** require human judgment or owner input, and
**report all changes** — both those made and those left open — before applying.
