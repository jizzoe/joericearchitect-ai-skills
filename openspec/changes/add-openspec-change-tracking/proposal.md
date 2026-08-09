## Why

Later GitHub/OpenSpec automation needs a durable local link between an
OpenSpec change and its primary GitHub issue, repository, Project, and
implementation repositories. Today that linkage exists only in prose, which is
not sufficient for deterministic validation, update helpers, or lifecycle
sync.

## What Changes

- Define tracking schema version 1 for OpenSpec change metadata.
- Add deterministic validation for required fields, types, unknown safe fields,
  and mismatched change identity.
- Add helpers to create and update tracking files while preserving unknown safe
  fields.
- Add a read-only command that prints normalized linkage as JSON.
- Add fixtures for valid, missing-field, invalid-type, unknown-field,
  mismatched-change, and multi-repository tracking cases.
- Validate completed bootstrap and M2 changes or record explicit compatibility
  exceptions.

## Non-Goals

- Do not automate GitHub issue creation or status synchronization.
- Do not mutate GitHub Issues, Projects, PRs, labels, or branches.
- Do not make tracking validation a required CI gate.
- Do not store credentials, Project item IDs, field IDs, PR state, timestamps,
  or last-sync output in tracking files.

## Capabilities

### New Capabilities

- `github-work-tracking`: behavior for versioned local tracking metadata that
  links OpenSpec changes to GitHub work records and implementation repository
  targets.

### Modified Capabilities

- None.

## Impact

- Primary issue: https://github.com/jizzoe/joericearchitect-ai-skills/issues/25
- Roadmap parent: https://github.com/jizzoe/joericearchitect-ai-skills/issues/1
- Dependency: M3-C1 / issue #21 is complete.
- Affected users: assistant sessions and maintainers preparing OpenSpec changes
  for later GitHub automation.
- Affected assets: schema, validation scripts, fixtures, OpenSpec change
  metadata conventions, and later lifecycle automation inputs.
- Scope: local repository files and local validation only.
- Compatibility: existing archived changes may lack tracking files; explicit
  compatibility exceptions are allowed for pre-M3-C2 historical changes.
- Security: tracking files contain names, URLs, issue numbers, branch names,
  and paths only; credentials and mutable runtime IDs are forbidden.

## Reuse Plan

- Product-neutral behavior belongs in schema, parser, validator, create/update
  helpers, normalized output, and fixtures.
- Product-specific values remain in each `tracking.yaml` file or fixture.
- Claude and Codex consume the same repository scripts and tracking contract.
- Portability is evaluated with a multi-repository fixture that uses configured
  repository values rather than this repository's constants.
