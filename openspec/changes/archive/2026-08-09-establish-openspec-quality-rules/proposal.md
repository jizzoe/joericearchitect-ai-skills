## Why

The repository has high-level OpenSpec context and lifecycle guidance, but
later automation needs deterministic, reviewable quality rules for OpenSpec
artifacts before it can safely create tracking metadata, GitHub-linked changes,
or lifecycle synchronization. M3-C1 makes those artifact expectations explicit
and locally verifiable.

## What Changes

- Add an `asset-quality` capability for OpenSpec proposal, specification,
  design, task, fixture, and schema-sufficiency rules.
- Define explicit scope and non-goals for artifact quality review before
  downstream automation consumes the artifacts.
- Add repository-owned quality rules that preserve the current OpenSpec schema
  while making artifact review deterministic.
- Add a representative sample change fixture that demonstrates compliant
  planning artifacts without mutating GitHub.
- Add local validation that checks required sections, task IDs, dependencies,
  observable requirements, acceptance scenarios, issue linkage, security,
  recovery, attribution, portability, compatibility, and reuse evidence.
- Keep this change focused on local artifact quality. Versioned tracking,
  GitHub/OpenSpec intake, lifecycle sync, PR enforcement, and dependency-aware
  work selection remain in later milestones.

## Non-Goals

- Do not define versioned tracking metadata.
- Do not automate GitHub issue creation or lifecycle synchronization.
- Do not enforce the validator in CI or branch protection.
- Do not rewrite archived OpenSpec changes to satisfy new forward-looking
  quality rules.
- Do not introduce a custom OpenSpec schema migration.

## Capabilities

### New Capabilities

- `asset-quality`: behavior for deterministic quality review of OpenSpec
  planning artifacts and fixtures used by reusable AI skills.

### Modified Capabilities

- None.

## Impact

- Primary issue: https://github.com/jizzoe/joericearchitect-ai-skills/issues/21
- Roadmap parent: https://github.com/jizzoe/joericearchitect-ai-skills/issues/1
- Dependencies: M1-C2 is complete; M2-C1 is complete but not required by this
  change.
- Affected users: repository owner and assistant sessions preparing OpenSpec
  changes.
- Affected systems: OpenSpec artifacts, local validation scripts, fixtures, and
  later SDD automation that consumes artifact quality evidence.
- Expected files:
  - `quality/openspec-artifact-rules.json`
  - `scripts/validation/validate-openspec-artifacts.mjs`
  - `scripts/validation/test/openspec-artifacts.test.mjs`
  - `evals/openspec-artifact-quality/fixtures/sample-change/`
  - OpenSpec change artifacts and verification reports
- Compatibility: existing archived changes remain historical evidence and are
  not rewritten. The standard OpenSpec schema remains sufficient; this change
  adds repository validation rather than custom OpenSpec schema migration.
- Security: validation reads local artifacts only and does not execute issue,
  prompt, or pull-request content as code.

## Reuse Plan

- Product-neutral behavior belongs in artifact rules, validation logic, fixture
  shape, and evidence reporting.
- Product-specific values remain in OpenSpec change files, issue URLs,
  repository configuration, and fixture content.
- Claude and Codex consume the same repository rules and validator without
  platform-specific copies.
- Portability is evaluated through fixture-driven validation instead of
  hard-coded issue numbers, Project item IDs, branches, credentials, or current
  product constants in reusable logic.
