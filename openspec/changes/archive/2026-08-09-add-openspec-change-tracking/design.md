## Context

M3-C2 follows M3-C1 artifact quality rules. The next integration milestones
need a machine-readable, versioned local contract for issue/OpenSpec linkage,
but GitHub mutation automation is intentionally deferred to M4 and M5.

The design must preserve these boundaries:

- OpenSpec owns proposals, specs, designs, and tasks.
- `tracking.yaml` owns local linkage metadata for one OpenSpec change.
- GitHub remains the external source for issue, PR, and Project state.
- Scripts may validate and normalize local files but must not mutate GitHub.

## Goals / Non-Goals

Goals:

- Define tracking schema version 1.
- Validate required fields, value types, unknown safe fields, and change-name
  consistency.
- Create or update tracking files without dropping unknown safe fields.
- Print normalized linkage JSON for later automation.
- Support one or multiple implementation repositories.

Non-goals:

- No GitHub issue, Project, PR, or label mutation.
- No CI enforcement.
- No credential storage or token discovery.
- No migration that rewrites historical archive records.

## Decisions

### DEC-001: Use YAML for human-authored tracking files

Tracking files use `tracking.yaml` because the research plan selected a YAML
shape and maintainers can review it easily next to OpenSpec artifacts.

Rationale: the metadata is small, human-authored, and close to issue bodies.

### DEC-002: Keep a JSON Schema document and explicit validator

`schemas/openspec-tracking-v1.schema.json` documents the contract. The Node.js
validator enforces the required subset directly without external dependencies.

Rationale: JSON Schema is portable documentation, while a dependency-free
validator keeps local execution reliable.

### DEC-003: Preserve unknown safe fields

Create/update helpers preserve unknown fields unless they look like credentials,
mutable runtime IDs, or execution state.

Rationale: future extensions should not lose human-authored metadata, but
security and durable-state boundaries still apply.

### DEC-004: Normalize output for consumers

The read-only command emits sorted, normalized JSON so M4-M6 automation can
consume linkage without reparsing YAML.

Rationale: later scripts need deterministic behavior and precise field paths.

## Affected Files and Interfaces

- `schemas/openspec-tracking-v1.schema.json`
- `scripts/validation/lib/tracking.mjs`
- `scripts/validation/validate-tracking.mjs`
- `scripts/validation/test/tracking.test.mjs`
- `scripts/validation/fixtures/tracking/`
- `openspec/changes/add-openspec-change-tracking/tracking.yaml`

No external API, credential, Project field, label, or repository setting is
changed by this milestone.

## Verification Strategy

- Run `openspec validate add-openspec-change-tracking --strict`.
- Run `openspec validate --all --strict`.
- Run tracking tests for valid, missing-field, invalid-type, unknown-field,
  mismatched-change, update preservation, and normalized JSON behavior.
- Run artifact-quality validation against this change.
- Run a secret-pattern scan across schema, scripts, fixtures, and tracking
  files.
- Record compatibility results for pre-M3-C2 archived changes.

## Attribution and Licensing

M3-C2 uses repository-authored JSON, YAML, Markdown, and Node.js code. No
third-party runtime package or copied external implementation is added.

## Recovery

- If validation fails, the reported field path identifies the file section to
  repair.
- If a helper update is interrupted, rerun from the current file; unknown safe
  fields are preserved.
- If historical archived changes lack tracking files, retain the archive and
  record a compatibility exception instead of rewriting history.

## Reuse Plan

- Canonical behavior: schema and validator scripts under repository-owned
  paths.
- Product configuration: repository owner/name, issue number, Project number,
  branch, and paths live in each tracking file.
- Claude/Codex exposure: both assistants call the same scripts.
- Portability: multi-repository fixture proves schema shape can represent more
  than one implementation repository without hard-coded current-product values.
