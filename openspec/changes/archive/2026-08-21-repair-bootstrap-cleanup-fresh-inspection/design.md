## Context

See [proposal.md](proposal.md) for the failure. The ordinary cleanup plan
correctly classifies the two attached M1-S3 worktrees as eligible. During
execution, `freshResourceMatches` removes `exists` from the fresh inspection
but compares it to an action resource that still carries the migration-time
`exists: true` field. The durable attachment already records blocked receipts,
so the repair must preserve those receipts and make a later exact resume work.

## Goals / Non-Goals

**Goals:**

- Compare stable cleanup-resource fields symmetrically at final execution.
- Continue to require a fresh positive existence check before removal.
- Keep genuine mutable-state differences (head, clean state, lock, branch
  reachability, ownership, delivery evidence) fail-closed.
- Preserve existing receipt-before-effect and bootstrap staged-cleanup rules.

**Non-Goals:**

- Rewriting the existing M1-S3 attachment, work unit, claim, or blocked
  receipts.
- Generalizing legacy discovery or migrating any additional resource.
- Updating global skills, deleting remote branches, or deleting the retained
  M1-S3 Sync branch.

## Decisions

1. Normalize both sides of the final comparison by treating `exists` as a
   transient inspection result rather than a durable resource identity field.
   The final comparison first requires `current.exists === true`, then compares
   the stable record shapes with `exists` omitted from both sides.

   This is preferable to preserving `exists` on both sides because presence is
   intentionally rechecked at execution time; comparing a historical presence
   observation adds no safety but prevents a valid resume.

2. Add focused tests at the cleanup-helper level and through the
   bootstrap-attachment controller path. The first proves an attached resource
   carrying legacy `exists: true` receives a completed receipt after an exact
   fresh inspection. The second proves a real field change still produces a
   blocked receipt and no removal.

3. Append a plain-English handoff row that distinguishes this implementation
   defect from a temporary roadmap gap. The row must state that later
   milestones do not repair the comparison automatically and that the safe
   resume sequence is: deliver this repair, activate its released runtime,
   rerun the exact attachment, then continue the signed branch migrations and
   M1-S3 terminalization.

## Risks / Trade-offs

- [Normalizing too broadly could hide a real mutation] → Omit only `exists`;
  retain canonical comparison of every other field and keep the explicit
  positive existence guard.
- [A repair runtime could be applied to unrelated legacy resources] → Do not
  add caller-selected resource scope; reuse the existing exact attachment
  binding, signatures, and receipts.
- [An interrupted retry could duplicate removal] → Preserve the existing
  receipt ordering and `already-completed` behavior; test resume from the
  current blocked-receipt state.

## Migration Plan

1. Deliver the helper and regression tests through the normal linked OpenSpec
   lifecycle.
2. Build and activate the released repair runtime through its normal installer
   after the installer compatibility defect is separately repaired; until then,
   any runtime-only bridge requires a new exact owner authorization.
3. Reread the existing M1-S3 attachment and execute only its already attached
   resources. Do not remove records manually.
4. Confirm new completed receipts, create fresh signed branch migrations only
   after their paired worktree receipts, retain the unsafe Sync branch, and
   terminalize the original run only when all existing terminal checks pass.

## Reuse Plan

The canonical fix remains in `scripts/sdd/sdd-workspace-cleanup.mjs`; the
existing runtime wrapper remains thin. It accepts all repository paths,
resource identities, and signed evidence as runtime input. A portability check
will run the Node test suite without embedding M1-S3 paths or GitHub values in
the reusable helper. No third-party code, dependency, or attribution is added.
