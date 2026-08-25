# Verification — Finalization and Cleanup

## Change

`integrate-autonomous-sdd-finalization-and-cleanup` (M4-S3)

## Implementation

- `scripts/sdd/autonomous-sdd-finalization.mjs` — terminal convergence
  predicate, claim-release ordering, exact resource-eligibility classification,
  and partial-cleanup gating.

## Test results

- Focused suite `autonomous-sdd-finalization.test.mjs`: 5/5 pass.
- Full `scripts/sdd/test` + `scripts/github/test`: 342 pass, 0 fail, 0 skipped.

## Strict validation

`openspec validate --all --strict`: 46 passed, 0 failed.

## Acceptance evidence mapping

- Terminal convergence requires every predicate: `terminalConvergencePredicate`.
- Claim release follows cleanup -> terminal -> issue/project: `claimReleaseOrder`.
- Exact eligibility + typed ineligible reasons (dirty/unrelated/primary/locked/
  divergent/legacy/remote/ownership-mismatch): `classifyResourceEligibility`.
- Partial cleanup cannot release/complete: `partialCleanupBlocksRelease`.
