# Verification Report

## Scope

M6-C1 implements deterministic dependency-aware work selection for OpenSpec SDD
foundation work. It adds read-only classifiers and CLIs for status, dependency,
next-work, parallel-candidate, and explicit-switch reporting.

## Requirements Evidence

- Work items are classified from dependency evidence:
  `scripts/github/lib/dependencies.mjs` reports in-flight, actionable, blocked,
  cycles, and parallel candidates from fixture-shaped work items.
- Next work selection is deterministic: `selectNextWork` excludes blocked work
  before applying priority and sequence.
- Parallel candidates are reported conservatively: dependency paths and shared
  file/state conflicts prevent safe-parallel recommendations.
- Switching requires explicit target: explicit selection uses the provided
  change name and reports `unknown-explicit-change` when absent.
- Dependency reporting is read-only: status, next, and dependency CLIs read JSON
  input and print JSON output without GitHub credentials or mutation commands.

## Verification Commands

- `openspec validate add-dependency-aware-work-selection --strict`
- `openspec validate --all --strict`
- `node scripts/validation/validate-tracking.mjs openspec/changes/add-dependency-aware-work-selection/tracking.yaml`
- `node scripts/validation/validate-openspec-artifacts.mjs openspec/changes/add-dependency-aware-work-selection`
- `node --test scripts/github/test/dependencies.test.mjs scripts/github/test/work-selection.test.mjs evals/workflows/openspec-github-lifecycle/dependency-selection/run-fixtures.test.mjs`
- Focused repository suite: 88 passed, 0 failed.

## Security and Portability

The new commands are read-only local scripts. They do not call GitHub APIs,
reference secrets, push branches, edit Project fields, or write repository
artifacts. Live GitHub adapters can populate the input shape later without
changing selection semantics.

## Known Limitations

M6-C1 does not create or migrate live GitHub Project fields. It implements the
deterministic selection/reporting layer and fixture-shaped input contract that a
live Project adapter can feed in a later change.

