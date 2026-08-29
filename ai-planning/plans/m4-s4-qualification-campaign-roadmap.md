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

| # | Change | Skill(s) | Associated brief | Status |
|---|---|---|---|---|
| 1 | `add-generic-git-repository-cleanup` | `generic-git-repository-cleanup` | `design-briefs/generic-git-repository-cleanup.md` | ✅ **Completed** — Run #2, counts 1/10 (2026-08-28) |
| 2 | `establish-shared-quality-context-and-standards-pack` | `standards-pack` + context policy | `standards-driven-quality-skills.md`, `react-native-expo-quality-skills.md` | ⬜ Not started |
| 3 | `add-typescript-quality-overlay` | `typescript-javascript-review` | `standards-driven-quality-skills.md` | ⬜ Not started |
| 4 | `add-react-native-expo-quality-overlays` | `react-native-review` + `expo-review` + mobile standards | `react-native-expo-quality-skills.md` | ⬜ Not started |
| 5 | `add-java-spring-quality-overlay` | `java-spring-review` | `standards-driven-quality-skills.md` | ⬜ Not started |
| 6 | `add-terraform-static-quality-overlay` | `terraform-review` | `standards-driven-quality-skills.md` | ⬜ Not started |
| 7 | `add-sonarqube-client-and-quality-gate` | `sonarqube-client` + `sonarqube-quality-gate` | none (jra-sonarqube research) | ⬜ Not started |
| 8 | `add-sonarqube-issues-and-coverage` | `sonarqube-issues` + `sonarqube-coverage` | none (jra-sonarqube research) | ⬜ Not started |
| 9 | `add-repository-status-skill` | `repository-status` | `ideas/catch-all.md` | ⬜ Not started |
| 10 | `add-git-health-skill` | `git-health` | `ideas/catch-all.md` | ⬜ Not started |

## Tracking rules

- Build **in order**. Dependencies: #2 → #3 → #4 (standards-pack then TS then
  RN/Expo). SonarQube #7/#8 are independent of the overlays and may run in
  parallel with #2–#6.
- After each completed run, set its `Status` to
  `✅ Completed — Run #N, counts N/10` plus date and PR/commit evidence.
- **#4 (`add-react-native-expo-quality-overlays`) and #7
  (`add-sonarqube-client-and-quality-gate`) are the intended stress tests** most
  likely to surface framework gaps; do not reorder them lower without owner
  sign-off.
- A material defect that invalidates prior runs **restarts the streak**; record
  it in `notes/autonomous-sdd/m4-s4-qualification-issues.md` and the blocker
  register.
