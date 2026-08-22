## 1. Planning provenance and proposal

- [x] 1.1 Reinspect current Git, controller, runtime, OpenSpec, issue/Project, roadmap, design, blocker, and repair evidence. Depends on: none. Evidence: `evidence/planning-inventory.md`.
- [x] 1.2 Recover the exact primary-worktree analysis/handoff bytes and deliberately classify stale planning branch `2929d82` and Jira-note commit `e237061` content. Depends on: 1.1. Evidence: `evidence/provenance-and-reconciliation.md`.
- [x] 1.3 Complete proposal, requirements, design, tasks, issue/Project linkage, and planning review. Depends on: 1.2. Evidence: `evidence/planning-review.md`, issue #197, Project 1 `In Progress`, artifact-quality validation, tracking validation, and strict OpenSpec validation.

## 2. Mainline planning correction

- [x] 2.1 Add the five operating modes, single-owner rule, two-version bootstrap rule, minimum activation bundle, schema-not-activation rule, and self-reference ban to the master design and stabilization brief. Depends on: 1.3. Evidence: `evidence/requirements-map.md`.
- [x] 2.2 Correct roadmap dependency order and M1/M2/M4/M6 readiness/status so M2-S1 is next without prematurely activating real ownership. Depends on: 2.1. Evidence: `evidence/requirements-map.md` and changed-file stale-status audit.
- [x] 2.3 Amend M4-S1 for exact authenticated-host execution and branch-retention policy/receipts; amend M4-S2 for repository-wide active-delta overlap and description-aware exact Sync. Depends on: 2.2. Evidence: `evidence/requirements-map.md` and blocker lineage.
- [x] 2.4 Reconcile M1-S1/M1-S2 delivered status and accepted decisions, preserve current M1-S3 truth, recover Jira deferral, and publish the root-cause notes/handoffs and causal blocker fields. Depends on: 2.3. Evidence: `evidence/provenance-and-reconciliation.md`, changed-file internal-link validation, and primary-worktree source hashes in `evidence/planning-inventory.md`.

## 3. Verification and delivery

- [x] 3.1 Run artifact quality, tracking, strict OpenSpec, internal-link, stale-status, dependency, security, portability, attribution, and diff checks. Depends on: 2.4. Evidence: `evidence/verification-report.md`.
- [x] 3.2 Complete same-session read-only local review and formal OpenSpec Verify with no unresolved findings. Depends on: 3.1. Evidence: `evidence/local-review.md` and `evidence/openspec-verify.md`.
- [x] 3.3 Prepare the verified implementation and exact Sync deliveries for content-preserving Archive, with issue/Project linkage, remote-branch retention, and controller-owned cleanup bindings current. Depends on: 3.2. Evidence: implementation PR #198, Sync PR #199, exact retained remote refs, and the active controller resource records.
