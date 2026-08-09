# OpenSpec SDD Foundation Dependency Plan

Date: 2026-08-08
Status: Proposed
Parent plan: [OpenSpec SDD Foundation Implementation Plan](openspec-sdd-foundation-implementation-plan.md)

## 1. Purpose

Define milestone, change, and major task dependencies for the SDD foundation so that:

- Blocked work is not started accidentally.
- Independent changes can be implemented in parallel.
- Multiple changes can remain in flight and be resumed explicitly.
- GitHub Project automation can determine current, blocked, actionable, and next work.
- OpenSpec task plans expose ordering and concurrency constraints instead of relying on document order alone.

## 2. Terminology and Identifiers

Use one-based milestone and change identifiers:

```text
Human shorthand: M3/C2
Machine identifier: M3-C2
Issue title: [M3-C2] Add versioned OpenSpec change tracking
OpenSpec change: add-openspec-change-tracking
```

Milestones group outcomes. Changes are independently deliverable OpenSpec units. Tasks are implementation steps within a change.

## 3. Dependency Sources of Truth

| Dependency level | Source of truth |
|---|---|
| Milestone/change ordering for this foundation | This dependency plan until migrated into GitHub |
| Cross-change hard dependency | GitHub issue `blocked by` / `blocking` relationship |
| Milestone membership | GitHub Milestone and Project `Milestone` field |
| Planned sequence among otherwise independent changes | GitHub Project `Sequence` field |
| Priority override | GitHub Project `Priority` field |
| Within-change task dependency | OpenSpec `tasks.md` dependency annotation |
| Potential concurrency conflict | OpenSpec design dependency plan and affected-path/resource analysis |

Dependencies SHALL NOT be inferred solely from issue-title prefixes or list order.

## 4. Milestone Dependency Graph

```text
M1  Tool and OpenSpec Bootstrap
 |
 +--------------------+
 |                    |
 v                    v
M2  GitHub Intake     M3  OpenSpec Quality and Tracking
 |                    |
 +----------+---------+
            |
            v
M4  Local Lifecycle Integration
            |
            +--------------------+
            |                    |
            v                    v
       M4/C2 Sync          M5/C1 PR Linkage
            |                    |
            +----------+---------+
                       |
                       v
              M5/C2 PR Reconciliation
                       |
                       v
              M6 Project Navigation and
                 Parallel Work Planning
                       |
                       v
              M7 Verification and Hardening
```

Milestones are outcome groupings, not rigid phase gates. A downstream change may start when its declared dependencies are complete even if another independent change in the upstream milestone remains active.

## 5. Change Dependency Matrix

| ID | OpenSpec change | Hard dependencies | Can run in parallel with | Blocking output |
|---|---|---|---|---|
| M1-C1 | `bootstrap-openspec-foundation` | None; manual bootstrap | None initially | Initialized OpenSpec and assistant workflow ownership |
| M2-C1 | `establish-github-work-intake` | M1-C1 | M3-C1 | Issue forms, Project statuses, non-secret Project config |
| M3-C1 | `establish-openspec-quality-rules` | M1-C1 | M2-C1 | Artifact quality rules used by later changes |
| M3-C2 | `add-openspec-change-tracking` | M3-C1 | Late M2-C1 work after Project identity is stable | Versioned tracking contract and validator |
| M4-C1 | `add-github-openspec-intake` | M2-C1, M3-C2 | None on the critical integration boundary | Shared GitHub API boundary, issue/OpenSpec intake skills |
| M4-C2 | `add-openspec-github-lifecycle-sync` | M4-C1 | M5-C1 after shared GitHub modules stabilize | Status transition engine, audit, repair |
| M5-C1 | `enforce-openspec-pr-linkage` | M4-C1, M3-C2 | M4-C2 | PR contract validator and advisory checks |
| M5-C2 | `reconcile-project-status-from-prs` | M4-C2, M5-C1 | Final tests from either dependency after interfaces freeze | PR-driven Project lifecycle reconciliation |
| M6-C1 | `add-dependency-aware-work-selection` | M5-C2 | Documentation/eval preparation for M7 | Current/next/blocked/parallel work selection and switching |
| M7-C1 | `verify-sdd-foundation` | M2-C1 through M6-C1 | Independent test scenarios within the change | Hardened complete foundation and archived specs |

## 6. Critical Path

The longest dependency chain is:

```text
M1-C1
  -> M3-C1
  -> M3-C2
  -> M4-C1
  -> M4-C2
  -> M5-C2
  -> M6-C1
  -> M7-C1
```

M2-C1 must also complete before M4-C1. M5-C1 must complete before M5-C2.

Critical-path changes should receive priority when a choice between equally valuable work is required.

## 7. Parallel Work Plan

### Parallel Window A: After M1-C1

These changes can proceed concurrently:

```text
Lane A: M2-C1 establish-github-work-intake
Lane B: M3-C1 establish-openspec-quality-rules
```

Within M2-C1, local repository files can be developed in parallel with remote Project configuration:

- Issue forms and PR template.
- Labels, Project fields, view, and built-in workflows.

They join when end-to-end intake behavior is verified.

### Parallel Window B: During M3-C2

After M3-C1 defines artifact rules, tracking schema/validator work can proceed while remaining M2-C1 Project verification and documentation are completed. M4-C1 cannot start until both are complete.

### Parallel Window C: After M4-C1

These changes can proceed concurrently after the shared GitHub modules and tracking interfaces are stable:

```text
Lane A: M4-C2 add-openspec-github-lifecycle-sync
Lane B: M5-C1 enforce-openspec-pr-linkage
```

The lanes must not independently redefine:

- Tracking schema.
- GitHub command result contract.
- Managed issue-block format.
- Status transition names.

Interface changes require coordination before either lane merges.

### Parallel Window D: M7 Verification

Within M7-C1, these test groups can run concurrently after their fixtures and external mutation boundaries are isolated:

- Feature lifecycle tests.
- Bug lifecycle tests.
- Tracking and linkage failure tests.
- Security and token-boundary review.
- Claude/Codex skill exposure and portability evals.
- Documentation and recovery walkthrough.

Live GitHub mutation tests must use distinct disposable issues to avoid shared-state interference.

## 8. Task Dependency Convention

Every OpenSpec `tasks.md` created for this foundation SHALL use stable task IDs and declare dependencies when order is not obvious. This convention is maintained manually for M1-C1 through M5-C2; M6-C1 adds automated validation and work selection.

Example:

```markdown
## 2. GitHub Project Integration

- [ ] 2.1 Implement Project field discovery.
  - Depends on: 1.2
  - Parallel with: 2.2

- [ ] 2.2 Implement managed issue-block rendering.
  - Depends on: none
  - Parallel with: 2.1

- [ ] 2.3 Implement lifecycle synchronization.
  - Depends on: 2.1, 2.2, M3-C2
```

Rules:

- `Depends on` lists task IDs or `M#-C#` change IDs that must complete first.
- `Parallel with` is optional and documents known-safe concurrency.
- Missing `Depends on` means only that no explicit hard dependency is known; it does not waive shared-file or shared-state conflict checks.
- A task that mutates shared external state SHALL identify that state in the change design.
- A task dependency on another change SHALL correspond to a GitHub issue dependency.

## 9. Multiple Changes in Flight

There is no hard work-in-progress limit of one. The system SHALL support multiple issues in `In Progress` or `In Review`.

Each assistant session SHALL have one explicitly selected OpenSpec change. Switching changes SHALL:

1. Record or report the current change's status and incomplete task IDs.
2. Validate that local work is not left in an ambiguous partial state.
3. Select the target change explicitly by semantic OpenSpec name or `M#-C#` identifier.
4. Read that change's current artifacts and task status from disk.
5. Report blockers and the next actionable task before implementation resumes.

The workflow SHALL NOT infer a session's selected change merely because it is the most recently modified directory.

## 10. Dependency-Aware Work Selection

M6-C1 will implement these work sets:

| Set | Definition |
|---|---|
| In flight | Issues in `In Progress` or `In Review` |
| Actionable | In-flight or `Ready` issues with every hard dependency satisfied |
| Blocked | Issues with at least one unresolved `blocked by` relationship or explicit dependency conflict |
| Parallel candidates | Two or more actionable changes without a hard dependency path or known shared-resource conflict |
| Next | Highest-priority actionable issue, then lowest `Sequence` value |

Selection order:

1. Explicit user-selected change.
2. Existing actionable `In Progress` change.
3. Existing `In Review` work requiring review action.
4. Highest-priority, lowest-sequence `Ready` change.
5. Lowest-sequence `Backlog` change that needs proposal/specification.

The system SHALL show all eligible choices when multiple changes are parallelizable. It SHALL recommend one but SHALL NOT silently start or switch work.

## 11. Initial Project Metadata

M6-C1 will add or activate these GitHub Project fields:

| Field | Type | Purpose |
|---|---|---|
| `Status` | Single select | Lifecycle state |
| `Milestone` | Single select | `M1` through `M7` |
| `Change` | Text | Machine identifier such as `M4-C2` |
| `Sequence` | Number | Stable planned order, such as `402` |
| `Priority` | Single select | Explicit override: `P0` through `P3` |

GitHub issue dependencies remain the source of truth for blocking relationships. Project fields support filtering and ordering but do not replace dependencies.

## 12. Initial Sequence

| ID | Sequence |
|---|---:|
| M1-C1 | 101 |
| M2-C1 | 201 |
| M3-C1 | 301 |
| M3-C2 | 302 |
| M4-C1 | 401 |
| M4-C2 | 402 |
| M5-C1 | 501 |
| M5-C2 | 502 |
| M6-C1 | 601 |
| M7-C1 | 701 |

Sequence communicates planned order among otherwise eligible changes. It does not override an unresolved dependency.

## 13. Dependency Plan Maintenance

Until M6-C1 is implemented, update this document and the corresponding issue dependency whenever a cross-change dependency changes.

After M6-C1:

- GitHub issue dependencies become operational source of truth.
- The workflow generates a dependency report from GitHub and OpenSpec task metadata.
- This document remains the approved initial baseline and architectural rationale.
- Material dependency changes are captured in the affected OpenSpec proposal, design, or task plan.

The dependency report SHALL identify cycles, missing referenced changes, completed blockers, and conflicting dependency records.
