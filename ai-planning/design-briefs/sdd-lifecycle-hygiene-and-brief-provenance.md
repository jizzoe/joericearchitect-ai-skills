# Design Brief: SDD Lifecycle Hygiene and Design-Brief Provenance

Date: 2026-08-16
Status: Owner decisions recorded. Ready for one OpenSpec proposal.

## 1. Problem and desired outcome

The repository has correctly delivered and archived multiple OpenSpec changes, but its local Git state no longer tells a clear story. Squash-merged delivery branches remain non-ancestors of main; old worktrees retain active-looking change folders after the authoritative archive is merged; and a duplicate WIP ref can point at the same divergent history as a current branch. A branch list therefore looks like a work queue even when most capability is already on main.

The second gap is provenance. Design briefs live under ai-planning/design-briefs/, but the OpenSpec change they motivate does not retain a durable copy or explicit association. Once a change is archived, a future reader can often infer the related brief, but cannot reliably prove which brief was accepted for that proposal.

The desired outcome is one small lifecycle-hygiene capability that makes the following routine and safe:

- distinguish delivered or superseded local branches from work genuinely absent from main;
- make post-merge worktree and branch cleanup deliberate and recoverable;
- preserve an explicitly selected source design brief with its OpenSpec change through Archive; and
- offer related brief candidates when no source brief was supplied, without guessing or creating a file if the user declines to choose one.

## 2. Evidence and key findings

- docs/sdd-workflow.md defines Issue through Archive, but no local-ref cleanup checkpoint or source-brief provenance rule.
- docs/sdd-foundation-operations.md identifies Archive as the final lifecycle step, but has no post-archive branch/worktree reconciliation.
- Git diagnostics on 2026-08-16 found several local branches whose linked PRs were merged and whose delivered capability/specs are on origin/main. Squash merging preserved delivery content while leaving source commits outside main ancestry, so ahead/behind counts misclassified historical delivery branches as apparent unmerged work.
- The diagnostics found stale active change directories in old worktrees despite matching dated archives on origin/main. They were historical copies, not live changes.
- fix/harden-independent-review-result-transport and wip/preserved-preexisting-20260814-84 point to the same commit. One is a divergent history; the other is a preservation alias. Neither name states whether it is a delivery candidate, recovery ref, or disposable history.
- Existing archived changes safely retain supplemental evidence artifacts. No repository convention retains the accepted design brief under a change or archive.
- The design-brief workflow expects a brief before Explore or Propose, and requirements-to-plan already treats an approved brief path as explicit input. The missing link is durable proposal provenance, not a new planning model.

Relevant context:

- docs/sdd-workflow.md
- docs/sdd-foundation-operations.md
- skills/base/design-brief-from-research/SKILL.md
- skills/base/sdd-requirements-to-plan/SKILL.md
- openspec/changes/archive/
- ai-planning/design-briefs/

## 3. Options considered and tradeoffs

### Option A — One lifecycle-hygiene and brief-provenance change (recommended)

Add one bounded capability with two related surfaces: lifecycle reconciliation and source-brief provenance. Both operate at the Proposal/Archive boundary and solve the same failure mode: a completed change loses context needed to identify, clean up, and explain it later.

Advantages:

- one coherent operator workflow and safety model;
- one inventory can report change, PR/archive state, local refs, and source-brief association;
- no partial policy where a brief is copied but source branches/worktrees continue to accumulate.

Tradeoff: implementation must stay modest and avoid becoming a general Git-management system.

### Option B — Separate cleanup and brief-provenance changes

This narrows implementation but creates an interim state where one problem remains unsolved and repeats target-resolution, lifecycle, and safety logic.

### Option C — Document a manual convention only

This is cheap, but does not stop automation from omitting a copy, guessing a brief, or treating a squash-merged branch as active.

## 4. Decisions, assumptions, and owner

### Confirmed owner preferences

- Decision owner: Joe Rice.
- Use one design brief and, if accepted, one bounded OpenSpec change.
- A selected brief must be copied under the OpenSpec change so Archive carries it forward.
- When a proposal has no explicit source brief, show closest related brief options. Never select silently. If the user declines or makes no choice, create no copied brief and allow the proposal to continue.
- Use the proposed context/design-brief.md and context/design-brief-provenance.yaml layout, subject to a strict-validation fixture proving the supplemental directory is compatible.
- Query GitHub PR state by default when gh is available. If GitHub is unavailable, produce a clearly labeled local-only report; only an explicit local-only option suppresses the lookup intentionally.

### Approved conventions and implementation details

1. Introduce this supplemental, OpenSpec-validated convention:

       openspec/changes/<change-name>/context/
         design-brief.md
         design-brief-provenance.yaml

   context/ is a change-local supplemental directory, distinct from design.md and implementation evidence. The change adds a fixture proving strict validation accepts it and a repository validator defining its metadata contract.

2. design-brief.md is an immutable copy made at proposal time. design-brief-provenance.yaml records only workspace-relative source path, source blob digest, copy timestamp, selection mode (explicit or user-selected-candidate), and proposal/change identifier. It stores no absolute paths, credentials, or user identity.

3. Propose accepts an optional explicit brief path. It validates the path is inside the workspace, previews source and destination, copies atomically, writes provenance, then creates normal OpenSpec artifacts. A failed copy/provenance write stops before proposal setup is claimed complete.

4. Without an explicit path, interactive Propose discovers at most three candidates under ai-planning/design-briefs/. Ranking is deterministic: exact change-name/issue mention, then shared capability terms and explicit links, then recent modification time. It displays none alongside candidates and never copies the first result by default. Autonomous mode records no selected source brief unless authorization already contains an explicit path.

5. Add a read-only lifecycle reconciliation report. It obtains origin/main, local branches, worktrees, active changes, archive entries, and linked PR state, then classifies each target as delivered-and-safe-to-retire, delivered-but-dirty, duplicate/ref-alias, genuinely-divergent, or ambiguous. It uses PR/archive/spec evidence as well as ancestry so squash merges are classified correctly. GitHub lookup is the default when gh is available; an unavailable lookup is reported as a local-only evidence gap, never guessed away.

6. Archive completion includes a visible cleanup report. It may recommend removal of a clean delivered branch/worktree, but never deletes a dirty worktree, invokes broad cleanup, rewrites history, or treats a branch name as delivery proof. Removal remains a separately authorized action with exact targets and final status verification.

## 5. Scope, non-goals, constraints, dependencies, and risks

### In scope

- Change-local design-brief copy and provenance metadata.
- Deterministic candidate discovery and explicit user choice/no-choice behavior.
- Validation and fixtures for the sidecar convention.
- Read-only lifecycle reconciliation and Archive cleanup reporting.
- Thin Claude/Codex guidance pointing to one canonical implementation.

### Non-goals

- Automatically deleting branches, worktrees, files, or GitHub records.
- Rewriting old Git history, retroactively inventing provenance, or changing existing archives.
- Copying research, plans, or arbitrary documents other than an explicitly selected design brief.
- Requiring every change to have a design brief.
- Inferring that the newest or similarly named brief is approved.
- Replacing OpenSpec-generated artifacts or GitHub’s PR lifecycle.

### Constraints and dependencies

- Preserve existing dirty user work and unrelated worktrees.
- Keep all paths workspace-relative and reject traversal/absolute paths.
- Validate the context convention under openspec validate --all --strict; do not assume any extra directory is compatible without a regression fixture.
- Reconciliation requires a current origin/main and read-only GitHub PR access when PR state is requested. It reports unavailable state rather than guessing.
- The report is idempotent: repeated runs do not modify Git state.

### Risks and mitigations

| Risk | Mitigation |
|---|---|
| A stale branch is mistaken for missing work after squash merge | Classify with archive/spec/merged-PR evidence as well as ancestry. |
| A dirty worktree is deleted | Discovery never deletes; a later explicit authorization and clean-status proof are required. |
| A similar brief is copied for the wrong change | Require explicit path or explicit selection; none is always valid. |
| A copied brief silently diverges from source | Preserve source digest and treat the copy as immutable change provenance. |
| The change becomes broad Git automation | Limit it to lifecycle inventory, safe provenance capture, validation, and guidance. |

## 6. Open questions and blocking decisions

The context layout and default GitHub lookup are approved. The implementation must still prove strict-validation compatibility and gracefully report unavailable GitHub state.

The only remaining non-blocking question is whether historical unlinked briefs should remain as-is. Recommendation: do not backfill automatically; offer a manual association in a later migration only if useful.

## 7. Recommended next step

Run OpenSpec Propose for one change, tentatively named improve-sdd-lifecycle-hygiene-and-brief-provenance. Its requirements should cover safe classification, dirty-worktree protection, optional/no-choice source briefs, atomic copying and digest provenance, strict-validation compatibility, default GitHub lookup with local-only fallback, and Archive cleanup reporting. Stop after proposal; Apply requires separate authorization.
