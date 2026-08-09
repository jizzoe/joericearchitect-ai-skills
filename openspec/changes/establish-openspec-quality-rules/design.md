## Context

M3-C1 follows the completed bounded autonomous lifecycle controls and GitHub
work intake setup. Current `openspec/config.yaml` includes repository quality
rules, but those rules are advisory prose. Later M3-C2 and M4-M6 automation
needs local evidence that an OpenSpec change is structured well enough to be
tracked, linked, synchronized, and delivered.

The design must preserve these boundaries:

- OpenSpec remains the artifact generator and source for specifications.
- Repository-owned validation reviews artifacts after generation.
- GitHub Issues and Projects remain external lifecycle records.
- M3-C1 does not create tracking metadata, mutate GitHub lifecycle state, or
  introduce CI enforcement. Security-sensitive behavior is limited to local
  artifact reads and explicit rejection of credentials or executable artifact
  content.

## Goals / Non-Goals

Goals:

- Define concrete OpenSpec artifact quality rules.
- Validate proposal, delta spec, design, and tasks files locally.
- Demonstrate the rules with a representative sample change fixture.
- Confirm the standard OpenSpec schema remains sufficient for this milestone.
- Keep validator output deterministic and dependency-free.

Non-goals:

- Defining the tracking schema version.
- Creating or updating GitHub issue/OpenSpec linkage metadata.
- Adding GitHub lifecycle synchronization.
- Enforcing validation in CI or branch protection.
- Rewriting archived OpenSpec changes to meet new forward-looking rules.

## Decisions

### DEC-001: Keep quality rules in repository JSON

Store the rule contract in `quality/openspec-artifact-rules.json` and use a
small Node.js validator to enforce the required subset.

Rationale: JSON is easy for both assistants and scripts to read, and a
dependency-free validator avoids introducing supply-chain or install
requirements.

### DEC-002: Validate artifacts as files, not OpenSpec internals

The validator reads conventional OpenSpec files: `proposal.md`, `design.md`,
`tasks.md`, and delta `spec.md` files below `specs/`.

Rationale: This composes with OpenSpec instead of depending on private
implementation details or replacing generated behavior.

### DEC-003: Treat quality rules as forward-looking

The representative fixture and new changes must satisfy the rules. Historical
archives remain valid records even when earlier files do not contain every new
section.

Rationale: Rewriting history would damage provenance and create unnecessary
diff noise.

### DEC-004: Keep validation advisory in M3-C1

M3-C1 adds local deterministic validation and tests but does not wire the
validator into CI enforcement.

Rationale: M5-C1 is the right milestone to decide PR enforcement and advisory
versus required checks after tracking and intake contracts exist.

### DEC-005: Avoid custom OpenSpec schema migration

The standard OpenSpec schema remains sufficient because required quality data
can live in conventional proposal, design, spec, task, and evidence files.

Rationale: The foundation should prefer OpenSpec built-ins before adding custom
schema surface.

## Affected Files and Interfaces

- `quality/openspec-artifact-rules.json`: machine-readable rule names,
  required sections, and task dependency conventions.
- `scripts/validation/validate-openspec-artifacts.mjs`: CLI and reusable
  validation implementation.
- `scripts/validation/test/openspec-artifacts.test.mjs`: deterministic tests
  for valid and invalid fixtures.
- `evals/openspec-artifact-quality/fixtures/sample-change/`: representative
  compliant OpenSpec change fixture.
- `openspec/changes/establish-openspec-quality-rules/`: planning,
  verification, and delta spec artifacts.

No external API, credential, Project field, label, or repository setting is
changed by this milestone.

## Verification Strategy

- Run `openspec validate establish-openspec-quality-rules --strict`.
- Run `openspec validate --all --strict`.
- Run validator tests for compliant and intentionally invalid fixtures.
- Run the validator against the representative sample fixture.
- Run the validator against this M3-C1 change before delivery.
- Confirm standard OpenSpec validation passes without custom schema changes.
- Run a secret-pattern scan across new rules, scripts, fixtures, and M3-C1
  evidence.

## Attribution and Licensing

M3-C1 uses repository-authored Markdown, JSON, and Node.js validation logic.
No third-party runtime dependency, copied external code, or bundled license
notice is added.

## Recovery

- If validation reports missing sections or malformed task metadata, update the
  affected artifact and rerun the validator plus OpenSpec validation.
- If a later change needs a rule exception, record it in that change's design
  or verification report rather than weakening the global rule contract.
- If the validator fails because a file is missing, it exits nonzero with the
  path and rule ID so the change can be repaired from Git.
- If OpenSpec changes its generated file layout later, update the validator in
  a separate reviewed change.

## Reuse Plan

- Canonical behavior: rule JSON and validator under repository-owned paths.
- Product configuration: issue URLs, change IDs, and artifact contents remain
  per repository or fixture.
- Claude/Codex exposure: both assistants call the same validator and read the
  same rule file.
- Second-product portability: fixture content avoids current-product mutable
  IDs and proves the validator works from a supplied change path.
- Intentional product-specific behavior: this repository's OpenSpec directory
  layout and SDD terminology are used because they are the foundation's
  governed artifact surface.
