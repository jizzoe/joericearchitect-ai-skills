# Verification Report

- Date: 2026-08-09
- Change: `enforce-openspec-pr-linkage`
- Milestone issue: https://github.com/jizzoe/joericearchitect-ai-skills/issues/37

## Summary

M5-C1 verification passed. The repository now has advisory PR/OpenSpec linkage
validation, read-only GitHub workflows, canonical PR linkage skill exposure,
and deterministic tests/evals for PR body contracts, tracking metadata,
changed-path routing, workflow safety, and corrective output. Project status
reconciliation remains deferred to M5-C2.

## Requirements and Scenarios

- Pull requests declare issue and OpenSpec linkage: PR contract validation
  requires an issue reference and OpenSpec change reference.
- OpenSpec linkage validates tracking and reciprocal references: linkage
  validation checks change path, `tracking.yaml`, and issue match.
- OpenSpec validation runs only for relevant paths: changed-path routing
  distinguishes governed and non-governed files.
- Advisory workflows avoid privileged mutation: workflows use read-only
  permissions and no Project token.
- Canonical skills expose PR linkage validation: Claude and Codex wrappers
  reference the canonical base skill and validators.

## Task Evidence

- 1.1: Issue #37 exists, is linked to roadmap issue #1, and has a Project item
  in `In Progress`.
- 1.2: Planning artifacts and tracking metadata exist; OpenSpec,
  artifact-quality, and tracking validation passed.
- 2.1: `scripts/validation/validate-pr-contract.mjs` validates PR body and
  changed-path routing.
- 2.2: `scripts/validation/validate-openspec-linkage.mjs` validates change
  path, tracking metadata, and reciprocal issue linkage.
- 2.3: `.github/workflows/openspec-validate.yml` and
  `.github/workflows/openspec-linkage.yml` run advisory read-only checks.
- 3.1: `skills/base/github-pr-linkage/SKILL.md` and assistant wrappers exist.
- 3.2: `scripts/validation/test/pr-linkage.test.mjs` and
  `evals/skills/github-pr-linkage/` cover required behavior.
- 4.1: Full local verification and review passed as recorded below.

## Local Verification

- `openspec validate enforce-openspec-pr-linkage --strict`
  - Result: valid.
- `openspec validate --all --strict`
  - Result: 9 passed, 0 failed.
- `node --test scripts/validation/test/pr-linkage.test.mjs evals/skills/github-pr-linkage/run-fixtures.test.mjs scripts/github/test/lifecycle-sync.test.mjs evals/workflows/openspec-github-lifecycle/run-fixtures.test.mjs scripts/github/test/github-intake.test.mjs evals/skills/github-openspec-intake/run-fixtures.test.mjs scripts/validation/test/tracking.test.mjs scripts/validation/test/openspec-artifacts.test.mjs evals/github-work-intake/validate-intake.test.mjs evals/skills/autonomous-goal-runner/run-fixtures.test.mjs evals/workflows/autonomous-sdd-lifecycle/run-fixtures.test.mjs`
  - Result: 70 passed, 0 failed.
- `node scripts/validation/validate-openspec-artifacts.mjs --json openspec/changes/enforce-openspec-pr-linkage`
  - Result: valid, 0 issues.
- `node scripts/validation/validate-tracking.mjs --json --change enforce-openspec-pr-linkage openspec/changes/enforce-openspec-pr-linkage/tracking.yaml`
  - Result: valid, 0 issues.
- High-confidence credential scan over workflows, validators, skills, evals,
  and change paths
  - Result: one intentional test assertion match for `PROJECT_TOKEN`; no
    credential value or workflow secret reference was found.

## Design Decisions

- DEC-001, advisory validation: implemented via non-required workflows and
  local validators.
- DEC-002, local PR body validation: implemented with body-file and
  changed-path inputs.
- DEC-003, read-only workflow permissions: implemented in both advisory
  workflows and tested.

## Security, Recovery, Attribution, and Portability

- Security: workflows are read-only and avoid Project credentials; PR body text
  is parsed as text only.
- Recovery: validators emit rule IDs and corrective instructions for missing
  issue links, missing change links, missing paths, and tracking mismatches.
- Attribution: all added scripts, workflows, skills, and fixtures are
  repository-authored and dependency-free.
- Portability: validators accept supplied PR bodies, paths, and tracking files
  without mutable Project item IDs.

## Known Limitations

- M5-C1 does not reconcile Project status from PR draft, ready, merge, or close
  events.
- M5-C1 does not promote advisory checks to required branch protection.
