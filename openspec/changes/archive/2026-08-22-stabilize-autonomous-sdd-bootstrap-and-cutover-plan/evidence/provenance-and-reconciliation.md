# Provenance and reconciliation decisions

## Current-main rule

Current mainline is authoritative. Historical branches are inputs, not merge
targets. No stale branch was merged or cherry-picked.

## Commit `2929d82`

Included:

- M1-S2 owner answers Q1-Q6: same-session prototype review, canonical
  `reviewPolicy`, exact-head review reuse, pre-Apply strict readiness, compact
  public lifecycle stages with typed internal operations, and canonical
  `agentPolicy` behavior.

Excluded or superseded:

- its `Proposal-ready`/“no OpenSpec artifacts” status, because M1-S2 is
  delivered and archived;
- its older M1-S3 proposal state, because current main contains the newer
  delivered/archived brief; and
- any unrelated branch content.

## Commit `e237061`

Included:

- `ai-planning/notes/ad-hoc-follow-ups.md`; and
- the roadmap's deferred external-tracker gate.

Interpretation:

- Jira remains explicitly disabled. The recovered note is a future decision
  gate, not configuration, connection authority, or permission to create Jira
  records.

## Primary dirty worktree

Included:

- the blocker handoff, stabilization handoff, root-cause findings, and sources,
  copied into the isolated branch before edits.

Preserved:

- the primary worktree itself remains untouched with its original modified and
  untracked files; exact cleanup does not own them.

## Repair lineage interpretation

The two later initializer repairs and repeated remote-branch restorations are
added as dated evidence. They share stable causal IDs with their underlying
inventory and branch-policy gaps rather than inflating independent architecture
failure counts.
