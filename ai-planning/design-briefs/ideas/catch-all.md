# Catch-all Ideas

Unshaped ideas to revisit and organize later.

- **Repository-status skill:** provide a read-only, bird's-eye summary of living specs, active and archived OpenSpec changes, milestone and slice progress, and the current Git state.
- **Repository-status skill output:** use concise one-line bullets for each category; identify the source of truth, current state, blocker or risk, and clearest next action without producing a detailed inventory.
- **Repository-status additions to consider:** delivery/review evidence freshness, configuration and tool readiness, issue/PR/Project alignment when configured, recent activity, and missing ownership or decisions.
- **Git-health skill:** provide a read-only maintenance summary of orphaned, stale, merged, unpushed, untracked, or upstream-diverged branches and worktrees.
- **Git-health metrics to consider:** branch age and last activity, ahead/behind counts, missing upstreams, gone remote tracking branches, dirty or detached worktrees, stale stashes, merge-base reachability, and worktree-path or lock anomalies.
- **Git-health output:** distinguish safe observations from actions that need confirmation, then recommend the smallest appropriate cleanup or follow-up.
- **Design-brief delivery shorthand:** add a global guidance entry or skill so “implement design brief `<name>`” resolves the brief, proposes when no current change exists, otherwise resumes from durable current state, and runs through merged implementation, Sync, Archive, closed/Done issue, and cleanup of clean target-owned branches and worktrees.
- **Design-brief delivery defaults:** when the caller omits an expiry, profile, or delivery type, present the resolved defaults for confirmation and allow overrides; initial defaults to assess are `4h`, `prototype-rapid`, `strict-only`, and `sdd-delivery`.
- **Design-brief delivery guardrails:** preserve unrelated dirty work and pause on material decisions, missing authorization, or an unmet strict-review gate.
- **Autonomous SDD control-plane documentation restructure:** before proposing any
  control-plane slice, consolidate the initiative into one detailed main design
  brief, a thin dependency-and-execution-order roadmap, and one detailed brief
  per roadmap slice. Preserve every material decision, requirement, risk, and
  acceptance condition through a reviewed source-to-destination map before
  archiving superseded control-plane briefs. See
  `ai-planning/handoff-docs/autonomous-sdd-document-restructure-and-multi-agent-handoff.md`.
- **Autonomous SDD multi-agent operating model:** add durable planning,
  test-and-evidence, implementation, independent-review, and closeout work
  units. The test-and-evidence worker creates requirements-derived proof before
  the implementation worker changes production code; independent review runs
  after Apply on the exact head and gates readiness for Verify; closeout runs
  only after Verify evidence is current. Defer broader harness-engineering
  exploration until this document restructure is ready to resume.
- **Control-plane document-refactor sequencing:** first establish, review, and
  iterate on the complete big-picture main design and a thin roadmap. Each
  roadmap slice names its future detailed brief and marks it `not yet created`
  rather than using a broken placeholder link. Create and link the detailed
  slice briefs only after the big picture is accepted; archive superseded
  sources only after the later migration review.
