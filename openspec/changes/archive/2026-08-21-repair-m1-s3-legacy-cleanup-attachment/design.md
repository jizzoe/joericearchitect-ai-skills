## Context

See proposal.md for the M1-S3 closeout failure. The active v2 work unit is
immutable and has no controller resource records because it predates that
lifecycle feature. The cleanup helper can validate a signed, freshly inspected
legacy resource, but the executable controller has no transition that attaches
the result to this existing run. Its current response is
`controller-cleanup-resources-missing`.

## Goals / Non-Goals

**Goals:**

- Attach only owner-signed, exact legacy migration results to the named M1-S3
  run without changing its admission, claim generation, or work-unit bytes.
- Make each removal receipt-coupled, resumable, and stored outside the target
  worktree.
- Make exceptional terminalization independently verify those receipts rather
  than trust an input boolean.

**Non-Goals:**

- General legacy discovery, automatic owner-key creation, backfilling ordinary
  v2 runs, cleaning remote branches, or deleting the M1-S3 Sync branch.

## Decisions

1. Introduce a dedicated bootstrap cleanup-attachment record rather than
   forcing old state into the normal controller schema. It binds the original
   identity, compatibility archive head, expiry, migrated resources, receipts,
   and retained-resource classifications. This preserves immutable admission
   history and makes the exceptional path visible and bounded.
2. Verify owner-signed migration requests with the existing canonical cleanup
   validator and construct attached resources from its fresh inspection result.
   The controller will never reconstruct a resource from a name, branch, chat
   approval, or older metadata.
3. Use staged cleanup: worktrees first, then a new signed branch migration
   after fresh inspection shows no worktree reference. Resources whose exact
   topic head is not delivery-proven become retained terminal classifications,
   not deletion candidates.
4. Extend bootstrap-compatible terminalization to read the persisted attachment
   and refuse a caller-only cleanup flag. Normal terminalization remains
   unchanged.

Alternatives rejected: direct Git removal bypasses receipts; synthesizing a
normal controller record would misrepresent original lifecycle history; broad
legacy reconciliation could capture unrelated user work.

## Risks / Trade-offs

- [A signed migration is stale before removal] → inspect again immediately
  before each action and persist a blocked receipt on mismatch.
- [A retained branch leaks local clutter] → retain it with a typed reason and
  require separate exact delivery evidence before any future cleanup.
- [Compatibility logic broadens ordinary terminalization] → require the exact
  bootstrap binding and test normal runs and all unbound old records still
  reject.
- [Local signing material is exposed] → use only the public key and signature
  in repository-local evidence; keep the private key outside the repository,
  output, and Git history.

## Migration Plan

1. Deliver the repair through a linked issue and implementation PR.
2. Sync the three modified living specifications and Archive the repair.
3. Install the released runtime and use only the pre-created, exact signed
   M1-S3 migration records.
4. Attach and clean each eligible worktree, then create fresh branch-only
   migrations and clean eligible branches; retain the Sync branch.
5. Terminalize the original M1-S3 run only after the persisted attachment
   proves every bound result.

Rollback is fail-closed: a failed attachment or cleanup action leaves the
original run, claim, and affected resource intact with a durable receipt.

## Reuse Plan

The attachment format, signature verification, cleanup sequencing, and
terminalization checks are assistant-neutral canonical runtime behavior.
Claude and Codex retain thin wrappers. Repository identity, run IDs, paths,
PRs, archive heads, authority records, and the retained resource are explicit
local inputs; a portability fixture uses synthetic values and no product
credentials or absolute user paths.
