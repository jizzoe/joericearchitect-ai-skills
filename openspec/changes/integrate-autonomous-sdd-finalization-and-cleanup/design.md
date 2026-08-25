# Design — Finalization and Cleanup

## Overview

M4-S3 codifies the terminal convergence predicates, claim-release order, and
exact resource-eligibility classification as one pure, deterministic module,
building on the existing `sdd-workspace-cleanup` engine and the controller
terminalization predicates.

## Module: autonomous-sdd-finalization.mjs

- `terminalConvergencePredicate({ implementation, sync, archive, issueClosed,
  projectDone, cleanupCompleted, terminal })` — every delivery, issue/project,
  and terminal predicate must hold; returns `{ complete, missing }`.
- `claimReleaseOrder({ cleanupDisposition, terminalStatus, issueClosed,
  projectDone })` — release only after cleanup converges, terminal completes,
  and issue/project converge; returns `{ release, reason, missing }`.
- `classifyResourceEligibility({ resource })` — exact-owned, clean,
  non-primary/non-locked/non-divergent, delivered-head resources are eligible;
  everything else is retained with a typed reason.
- `partialCleanupBlocksRelease({ outcomes })` — any blocked outcome means
  partial cleanup and no release/complete.

## Terminal predicate (Q1)

Matches the controller `terminalizationEvidence` + `terminalDetails` shape.

## Claim-release order (Q1)

cleanup-disposition completed -> terminal-status complete -> issue closed ->
project done. A merged PR or archived directory alone is insufficient.

## Retention (Q2)

Ineligible resources (dirty, unrelated, primary, locked, divergent, legacy,
remote, ownership-mismatched) are retained with a typed recovery reason; no
inferred ownership, no broad clean.

## Integration

- Consumes the existing `sdd-workspace-cleanup` engine and controller
  terminalization records.
- Does not change the not-activated v2 controller.

## Non-goals

Force removal, reset/clean, inferred legacy ownership, and deleting ambiguous or
unrelated resources remain unchanged.
