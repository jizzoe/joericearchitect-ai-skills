## Context

The root-cause analysis shows that six bootstrap pauses and most follow-on
repairs descend from one early activation choice: M1 enabled real v2 admission
and claims while initializer/finalizer/recovery/GitHub/cleanup work remained in
later milestones. Additional recurring gaps are restricted-runtime GitHub
authentication, repository auto-delete behavior, active OpenSpec delta overlap,
and mainline planning drift.

The primary worktree contains intentional uncommitted analysis and handoff
material. This change recovers those exact bytes into an isolated controller-
owned worktree. It inspects stale planning branch `2929d82` and Jira-note commit
`e237061` as sources, but does not merge or cherry-pick either branch.

## Goals / Non-Goals

**Goals:**

- Make the dependency and activation order explicit enough that later slices
  cannot activate a capability whose terminal/recovery dependencies are absent.
- Establish permanent planning homes for authenticated host execution,
  active-delta preflight, exact Sync semantics, branch retention, and planning
  reconciliation.
- Bring delivered M1 status, accepted decisions, causal analysis, and deferred
  Jira work onto main through one reviewed planning-only lifecycle.

**Non-Goals:**

- Implementing any controller/runtime/skill behavior.
- Changing active v2 records, claims, credentials, repository settings, or
  deployment state.
- Renumbering roadmap milestones or claiming the full control plane is ready.
- Enabling Jira or creating any Jira record.

## Decisions

### Separate contract publication from operational activation

Five explicit modes replace the earlier implicit enabled/disabled boundary.
Exactly one generation owns mutation in every mode, and in-flight runs retain
their immutable generation binding. This preserves the target architecture
while preventing partial horizontal slices from becoming live dependencies.

### Use a two-version delivery lane and vertical activation bundle

N-1 delivers and archives N, then N is installed for later work. The minimum
activation bundle groups every transition needed to start, recover, finish,
release, converge, clean, and roll back. Implementation slices remain separate,
but activation is atomic behind qualification.

### Put recurring boundary repairs in their owning milestones

M4-S1 owns the exact authenticated-host operation envelope and branch policy/
retention receipts. M4-S2 owns active-delta overlap and description-aware exact
Sync comparison. M4-S3 owns terminal convergence and exact cleanup. M4-S4 owns
single-change qualification. M6-S3 alone may switch default routing.

### Reconcile planning rather than merging stale branches

Current mainline wins over stale content. Accepted M1-S2 decisions are
recovered, but their status is updated to delivered; the newer delivered M1-S3
brief is retained. The Jira note is recovered as explicitly deferred planning,
not as an integration commitment.

## Risks / Trade-offs

- Keeping N-1 authoritative longer slows adoption but prevents live repair
  chains and preserves rollback.
- A larger activation bundle delays opt-in, but a repository claim is safe only
  when the same release can reach and recover from terminal state.
- Active-delta graphing adds preflight work, but moves conflicts before branch
  and PR mutation.
- Mainline planning reconciliation adds closeout scope; limiting it to accepted
  decisions, delivered evidence, and explicit deferrals prevents invention.

## Verification Strategy

- Map every added planning requirement and scenario to exact document sections.
- Compare recovered source files by digest and document each stale-branch
  inclusion/exclusion decision.
- Validate internal links, milestone dependencies, delivered status, blocker
  causal fields, OpenSpec artifact quality, tracking, and strict OpenSpec.
- Run documentation/link/security/portability review and same-session local
  review; no runtime test is applicable because executable assets do not change.

## Recovery

All edits occur in the controller-owned isolated worktree. The dirty primary
worktree remains untouched. If review finds a stale or conflicting decision,
remove only that recovered hunk and retain the source branch/note as evidence.
Normal implementation, Sync, Archive, and receipt-backed exact cleanup remain
separate delivery checkpoints.

## Attribution and Licensing

All source material is repository-owned planning history. No third-party text,
dependency, generated asset, or license change is introduced.

## Reuse Plan

Activation modes, two-version delivery, host envelopes, overlap graphs, and
planning reconciliation are product-neutral contracts. Repository-specific
PR numbers and paths stay in analysis/handoff provenance and never become
reusable runtime constants.
