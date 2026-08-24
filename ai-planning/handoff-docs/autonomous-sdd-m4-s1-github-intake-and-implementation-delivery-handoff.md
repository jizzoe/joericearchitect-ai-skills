# M4-S1 GitHub intake and implementation delivery handoff

Date: 2026-08-24

## Purpose

Handoff for starting the M4-S1 slice
(`integrate-autonomous-sdd-github-delivery`) in a fresh session, after M3 was
delivered and archived (M3-S1, M3-S2, and M3-S3 all on 2026-08-24). Use this to
resume M4 implementation without losing the decisions and delivery state
recorded on 2026-08-24.

## Current state (verified 2026-08-24)

M3 is fully delivered and archived; M4-S1's M3 dependency is satisfied, but its
**disposable-GitHub-fixture-strategy dependency is NOT yet satisfied**:

- M3-S1 (`harden-strict-review-multistep-artifact-delivery`) — issue #219, PRs
  #220/#221/#222.
- M3-S2 (`add-autonomous-sdd-review-admission-and-dispatcher`) — issue #223,
  PRs #224/#225/#226.
- M3-S3 (`bind-autonomous-review-to-code-head`) — issue #227, PRs #228/#229/#230.

All squash-merged to `main`. Living specs synced:

- `openspec/specs/autonomous-sdd-review-admission-and-dispatch/spec.md`
- `openspec/specs/autonomous-sdd-exact-head-review/spec.md`

Archived changes under `openspec/changes/archive/2026-08-24-*`.

New/changed implementation under `scripts/sdd/`:

- M3-S2: `autonomous-sdd-review-admission.mjs`,
  `autonomous-sdd-review-dispatcher.mjs`, `autonomous-sdd-vertical-slice.mjs`
  (new `reviewDispatch` callback).
- M3-S3: `autonomous-sdd-exact-head-review.mjs`, `independent-review.mjs` (new
  `validateExactHeadReviewReuse`).

Verification: M3-S3 focused 7/7; full SDD suite 271 tests (270 pass + 1
conditionally-skipped with no active change, 0 failures);
`openspec validate --all --strict` 43/43; no active changes.

- Released runtime unchanged: `runtime-cfd993c706d6` (source `c9e128f…`),
  `ai-skills-runtime doctor` reports `ok`.
- The v2 controller remains NOT activated (contract-only/audit).
- Roadmap refreshed: M3 rows marked delivered; "Recommended starting point"
  points at M4-S1.

Note: the working tree contains unrelated untracked files/dirs (for example
`docs/research/security/`, `docs/research/aidlc/`, `.continue/`). Preserve them;
they are not part of this work.

## Read first

1. [SDD workflow](../../docs/sdd-workflow.md)
2. [SDD foundation operations](../../docs/sdd-foundation-operations.md)
3. [Reliability-control-plane roadmap](../plans/autonomous-sdd-reliability-control-plane-roadmap.md)
4. [M4-S1 brief](../design-briefs/autonomous-sdd-reliability-control-plane/m4-s1-github-intake-and-implementation-delivery.md)
5. [Main control-plane design](../design-briefs/autonomous-sdd-reliability-control-plane.md)
6. [Harness research](../research/autonomous-agent-harness-landscape-2026/findings.md)
7. The credential-isolated host envelope:
   `skills/base/github-issue-authoring/SKILL.md`,
   `scripts/sdd/github-cli-auth-context.mjs`, and the
   `github-cli-auth-context-detection` living spec.
8. Existing GitHub helpers to reconcile before Propose:
   `scripts/github/create-or-find-issue.mjs` and `scripts/github/lib/` (issues,
   projects, gh, lifecycle, pr-status-sync, auth-context, dependencies).
9. The delivered M3 modules for context:
   `autonomous-sdd-review-admission.mjs`, `autonomous-sdd-review-dispatcher.mjs`,
   `autonomous-sdd-exact-head-review.mjs`.

## What M4-S1 is

Make GitHub intake and implementation delivery one idempotent, recoverable
transition chain: exact issue, Project, branch, PR, check, merge, closure, and
status operations converge without duplicate or unrelated mutation.

Scope: GitHub intake and implementation-delivery adapters, preflight, records,
receipts, ownership, and recovery. Non-goals: credential changes, protection
changes, releases, deployments, Sync, Archive, or broad content ownership.

Key mechanism: a credential-isolated controller emits one non-secret,
authorization-bound host-operation envelope (exact operation, repository, target
identities, immutable payload/precondition digest, idempotency key, expiry); an
authenticated host executes only that envelope and returns a non-secret result
receipt; the controller revalidates the receipt and live target state before
advancing. No credential crosses into controller history. Before any merge whose
authorization requires remote branch retention, preflight merge strategy and
automatic topic-branch deletion policy; after merge, restore only the exact clean
reviewed head (no force) and record a branch-retention receipt.

## Open questions to resolve before Propose (from the M4-S1 brief §6)

1. Select and prove a disposable GitHub repository/account strategy.
2. Finalize field-level ownership for issue, PR, and Project updates.

## Known limitation to carry forward

The v2 controller remains NOT activated (contract-only/audit). M4-S1 does not
activate real ownership or production Apply; those stay gated behind the full
activation bundle and M4-S4 qualification.

## What to do next (in order)

1. Re-inspect live state in the fresh session (`ai-skills-runtime doctor`, Git,
   `openspec status`).
2. Read the documents under "Read first".
3. Resolve the two M4-S1 open questions, especially the disposable GitHub
   fixture strategy (recommended workflow action: OpenSpec Explore; record the
   output under `ai-planning/notes/autonomous-sdd/`). The fixture strategy is an
   owner decision.
4. Reconcile the existing GitHub helper modules by source mapping (confirm the
   intake/delivery boundary vs. the M2-S2 controller admission).
5. Obtain explicit owner authorization, then start a fresh M4-S1 delivery
   (`integrate-autonomous-sdd-github-delivery`) in the pre-v2/interactive lane.
6. Implement, verify, and deliver M4-S1, then refresh the roadmap's "Recommended
   starting point" to point at M4-S2 and continue in order.

## Guardrails

- Do not begin M4-S1 implementation without explicit authorization.
- M4-S1 is delivered by the pre-v2 lifecycle, never by the v2 controller.
- Keep the result contract-only/audit; do not activate real ownership or
  production Apply before the full activation bundle and M4-S4 qualification
  exist.
- Do not expose credentials or secret-bearing diagnostics; no credential crosses
  into controller history.
- Do not overwrite human-authored issue/PR text or unrelated repository settings.
- Do not force-push or delete remote branches.
- Do not hand-edit controller, claim, or archive files.
