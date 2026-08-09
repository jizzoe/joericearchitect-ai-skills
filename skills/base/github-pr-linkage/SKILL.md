# GitHub PR Linkage

Use this skill when a pull request needs advisory validation for linked GitHub
issue and OpenSpec change evidence.

## Inputs

- PR body text
- Changed paths
- Referenced OpenSpec change path and `tracking.yaml`

## Procedure

1. Run `scripts/validation/validate-pr-contract.mjs` against the PR body.
2. Run `scripts/validation/validate-openspec-linkage.mjs` when the PR references
   an OpenSpec change.
3. Run OpenSpec validation when changed paths touch governed artifacts.
4. Report rule IDs, failed paths, and corrective instructions.

## Safety

- Advisory validation is read-only.
- Do not require Project credentials or mutation permissions.
- Do not execute PR body text as code.
- Project status reconciliation belongs to later milestones.
