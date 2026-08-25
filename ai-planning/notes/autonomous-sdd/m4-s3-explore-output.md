# M4-S3 Explore Output — Finalization and Cleanup

Date: 2026-08-25
Change: `integrate-autonomous-sdd-finalization-and-cleanup`
Workflow action: OpenSpec Explore (planning-only; no OpenSpec artifacts created).

## Context

M4-S3 makes closeout and exact-owned cleanup resumable, evidence-bound terminal
transitions so a run cannot falsely report completion, release its claim too
early, or delete dirty, unrelated, primary, or ambiguously owned resources. The
two open questions from the M4-S3 brief §6 are:

1. Finalize terminal convergence predicates and claim-release order.
2. Decide retention and operator guidance for permanently ineligible resources.

Both are owner decisions. No implementation is authorized by this note.

Live state (re-inspected 2026-08-25): M4-S1 and M4-S2 delivered and archived;
M4-S3's dependencies (M4-S2 + M2-S1 durable ownership/claim) are satisfied. No
active changes; `openspec validate --all --strict` 45/45; runtime `ok`. Working
tree has only three unrelated untracked dirs (`.continue/`,
`docs/research/aidlc/cloud-deployed-sdd-framework/`, `docs/research/security/`).

## Source-mapping (existing machinery vs. the M4-S3 gap)

- `scripts/sdd/sdd-workspace-cleanup.mjs` — `planWorkspaceCleanup` (archive
  visible + issue closed + project done + delivery evidence + eligibility),
  `executeWorkspaceCleanup` (fresh inspection, persist-before-remove,
  worktrees-before-branches, resume as `already-completed`),
  `migrateLegacyWorkspaceResource` (owner-authorized ed25519-signed migration).
  The exact-owned cleanup engine already exists.
- `openspec/specs/sdd-workspace-cleanup/spec.md` — ownership records,
  post-Archive delivery evidence, non-forced deletion, never delete remote
  branches.
- `scripts/sdd/autonomous-sdd-controller.mjs` — `terminalizationEvidence`
  (implementation + sync + archive + issueClosed + projectDone +
  cleanupCompleted) and `terminalDetails` (terminalStatus complete + finalHead +
  cleanupDisposition completed) already codify the terminal predicate;
  `terminalizeV2Run` archives the run and verifies post-archive (contract-only).
- `check-operation-authorization.mjs` — `delete-merged-topic-branch` is
  high-impact.

Gap: M4-S3 promotes these to evidenced, resumable terminal transitions in the
pre-v2 lifecycle and codifies the exact predicate/claim-release order plus the
operator guidance for permanently ineligible resources (currently prose).

## Open question resolutions

### Q1 — Terminal convergence predicates and claim-release order

**Answer (recommendation — pending owner confirmation).** Use the predicates
already codified in the controller:

- Terminal predicate = `implementation`, `sync`, and `archive` delivered with
  exact `deliveredHeadCommit` AND `issueClosed === true` AND
  `projectDone === true` AND `cleanupCompleted === true`, plus a terminal record
  (`terminalStatus: complete`, `finalHead`, `cleanupDisposition: completed`).
- Claim-release order = **cleanup converges first → terminal evidence completes
  → then claim release**. A merged PR or an archived directory alone is not
  sufficient to release.

### Q2 — Retention and operator guidance for permanently ineligible resources

**Answer (recommendation — pending owner confirmation).** Retain with a typed
recovery classification; never broad-clean or infer ownership. Legacy resources
become eligible only through a distinct owner-authorized, ed25519-signed
migration (already in `migrateLegacyWorkspaceResource`). Permanently ineligible
resources surface an operator decision, not an automatic deletion.

## Authorization

Explore is planning-only. Implementation (Propose/Apply) is NOT authorized and
requires explicit owner approval in the pre-v2/interactive lane. The v2
controller remains NOT activated; M4-S3 is delivered by the pre-v2 lifecycle.

## Owner sign-off and authorization (2026-08-25)

- Q1 (terminal predicates + claim-release order) — **signed off**.
- Q2 (retention/operator guidance for ineligible resources) — **signed off**.
- Owner explicitly authorized **Propose + deliver
  `integrate-autonomous-sdd-finalization-and-cleanup`** in the **pre-v2 /
  prototype-rapid** flow, autonomously through close and cleanup.
