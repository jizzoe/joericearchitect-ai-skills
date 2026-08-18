# Design-Brief Future Changes Roadmap

Date: 2026-08-17
Status: Read-only readiness inventory and candidate-change roadmap. It creates
no issue, branch, OpenSpec change, or implementation authorization.

## Purpose and scope

This roadmap turns the non-autonomous design-brief portfolio into an accurate
future-work queue. It answers two questions only:

1. Which unimplemented brief is ready for one bounded OpenSpec proposal?
2. Which unimplemented brief still needs a decision, prerequisite, or shaping
   step before proposal?

It deliberately excludes autonomous-delivery, autonomous-controller,
independent-review transport, degraded-review, and prototype-review briefs.
Those designs remain under separate active design work and are not candidates
in this roadmap.

“Implemented” means a directly related OpenSpec change is archived with its
tasks complete. Local files, an old branch, a completed proposal, or a
partially implemented worktree are not implementation evidence.

Before starting any candidate, re-read the source brief, current OpenSpec and
Git state, relevant living specs, and target-repository facts. Preserve all
unrelated dirty and untracked work.

## Ready for OpenSpec Propose

| Priority | Source brief | Candidate change | Why ready | First action |
| --- | --- | --- | --- | --- |
| P0 | [SDD Design-Brief Provenance](../design-briefs/sdd-design-brief-provenance.md) | `add-sdd-design-brief-provenance` | Owner decisions, scope, non-goals, sidecar layout, evidence model, safety boundaries, and proposal requirements are recorded. No active change or archived implementation provides this capability. | Run **OpenSpec Propose** and stop after planning artifacts. Validate the optional `context/` sidecar convention under strict OpenSpec validation before Apply is considered. |

## Not ready for OpenSpec Propose

| Source brief | Current state | What prevents proposal | Smallest next step |
| --- | --- | --- | --- |
| [Standards-Driven Quality Skills Program](../design-briefs/standards-driven-quality-skills.md) | Program design; the first shared-context/standards-pack slice exists on `feature/107-shared-quality-context` with 8/10 tasks complete, but is not merged or archived. | The program is intentionally not a detailed single-change brief, and creating another proposal for its first slice would duplicate in-flight work. | Finish, verify, deliver, Sync, and Archive the existing shared-context/standards-pack change. Then write or accept focused briefs for the next overlays. |
| [React Native and Expo Quality Skills](../design-briefs/react-native-expo-quality-skills.md) | Owner-approved direction; explicitly ready for **Explore**, not Propose. | It depends on the shared standards-pack convention being delivered and needs target-repository facts: pinned SDKs, platform/device matrix, trusted commands, selected MASVS controls, and available evidence. | Run **OpenSpec Explore** against the selected mobile repository after the shared standards-pack change is delivered; record the per-change inputs before proposing an overlay. |
| [Claude Cross-Tool Repo Gap Inventory](../design-briefs/claude-cross-tool-repo-gap-inventory.md) | Design-only inventory; no accepted implementation change. | Owner decisions are still required on OpenSpec-adapter scope, the `CLAUDE.md` content boundary, the live Claude sandbox smoke test, and grouping of the remaining review-adapter fixes. | Resolve the four documented open questions. If accepted, split the low-risk hygiene fixes from the live-isolation verification work and propose each bounded slice separately. |
| [SDD Project Bootstrap Skill](../design-briefs/sdd-project-bootstrap-skill.md) | Detailed implementation-ready draft; no canonical `sdd-project-bootstrap` skill is delivered. The archived `plan-sdd-workspace-bootstrap` change is planning evidence, not this skill's implementation. | The brief explicitly requires owner acceptance of the scope before proposal. | Accept, narrow, or revise the first-release scope; then propose one canonical skill, thin adapters, safe fixtures, and no external provisioning. |
| [Catch-all Ideas](../design-briefs/ideas/catch-all.md) | Unshaped idea list, not a design decision. | It has no selected outcome, owner decision, bounded scope, dependencies, or acceptance evidence. | Choose one idea and create a decision brief before considering OpenSpec Propose. |

## Completed briefs excluded from future work

The following brief families have corresponding archived implementation evidence
and are not candidates for a new proposal merely because historical copies or
old branches remain locally:

- base skill contracts and guardrails;
- base skill authoring;
- base research and planning skills;
- base implementation-quality skills;
- global skill installation;
- isolated independent review and its completed reliability repairs; and
- post-Archive workspace cleanup.

## Briefs intentionally outside this roadmap

Do not use this roadmap to select or propose work from autonomous-delivery,
autonomous control-plane, controller cleanup, independent-review configuration
or inspection fallback, artifact-missing/degraded recovery, strict-review
transport, prototype same-session review, milestone/slice delivery cadence, or
execution-kernel reference briefs. They remain in the autonomous-design track.

## Operating rules

- One candidate becomes one bounded issue and one OpenSpec change; do not turn
  this roadmap into a multi-capability proposal.
- A "ready" entry authorizes only **Propose** after normal intake. Apply,
  external mutation, and delivery remain separate approvals.
- Do not create a new change where an identified branch already contains the
  same active implementation; resume or reconcile that work instead.
- Reassess this roadmap after every merge, archive, or owner decision that
  changes a listed prerequisite.
