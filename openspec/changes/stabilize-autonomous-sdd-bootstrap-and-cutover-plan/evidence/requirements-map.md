# Requirements-to-plan map

## Explicit single-owner modes

- Master design: `Bootstrap, activation, and cutover control lane`.
- Stabilization brief: `Operating modes and mutation owner`.
- Roadmap: delivery rules, dependency shape, M4-S4 and M6-S3 gates.
- M6-S3 brief: five-mode state machine and immutable in-flight ownership.

## Two-version bootstrap and no self-reference

- Master design: N-1 releases N; self-referential tasks split before Propose.
- Stabilization brief: `Decision`.
- Roadmap: delivery rules.
- M1-S2 brief: `Activation clarification`.

## Minimum vertical activation bundle

- Master design and stabilization brief enumerate initialize, claim/fence,
  advance, recover, terminalize, release, external convergence, exact cleanup,
  and rollback.
- Roadmap keeps M2 contract-only/audit, assigns terminal convergence to M4-S3,
  qualified opt-in to M4-S4, and default to M6-S3.
- M2-S1/M4-S3/M4-S4 briefs repeat their local activation boundaries.

## Exact authenticated-host and branch-retention boundary

- M4-S1 brief defines the non-secret exact request/receipt envelope, restricted
  controller and authenticated host roles, policy preflight, exact reviewed-ref
  verification/restoration, and failure fixtures.
- Roadmap M4-S1 readiness and blocker rows link this permanent repair to the
  repeated 401/auto-delete symptoms.

## Active-delta and exact Sync boundary

- M4-S2 brief requires the repository-wide capability/requirement/operation
  overlap graph before branch or PR mutation, serialized/shared-authority
  reconciliation, description-and-scenario comparison, and repeat no-op.
- Roadmap M4-S2 readiness and blocker lineage identify the overlapping
  complete-replacement and description-loss failures.

## Mainline truth and causal blocker metadata

- M1-S1 and M1-S2 briefs record delivered status; current M1-S3 remains the
  delivered mainline version.
- `provenance-and-reconciliation.md` records what was recovered or excluded
  from commits `2929d82` and `e237061`.
- The Jira note and roadmap gate explicitly keep Jira disabled.
- The blocker register defines `rootCauseId`, `expectedStop`, `temporaryUntil`,
  `permanentRepair`, and `escapedGate`, preserving chronological rows while
  grouping repeated symptoms causally.
