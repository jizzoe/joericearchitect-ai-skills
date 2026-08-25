# claude-cross-tool-repo-hygiene Specification

## Purpose

Makes repository-owned Claude and Codex guidance discoverable and keeps every
canonical reusable skill adapter drift-checked through deterministic
enumeration.

## ADDED Requirements

### Requirement: Claude loads shared guidance through a one-line import
A root `CLAUDE.md` SHALL contain exactly `@AGENTS.md` so a fresh Claude Code
session at repository root loads the same shared contributor guidance as Codex.

#### Scenario: Claude guidance import is exact
- **WHEN** a Claude Code session reads the root `CLAUDE.md`
- **THEN** it imports the shared `AGENTS.md` rules without a second policy
  surface

### Requirement: Canonical skill enumeration is deterministic
The system SHALL deterministically enumerate every `skills/base/*/SKILL.md`
package and require a matching thin `.claude/skills/<name>/SKILL.md` and
`.agents/skills/<name>/SKILL.md` adapter for each.

#### Scenario: Missing adapter is reported
- **WHEN** a canonical skill lacks a required thin adapter
- **THEN** the drift check reports `missing-adapter`

#### Scenario: Full catalog is covered
- **WHEN** enumeration runs over the canonical catalog
- **THEN** every canonical skill is checked on both platforms

### Requirement: Thin adapters satisfy the no-duplication contract
Each thin adapter SHALL reference its canonical skill and SHALL NOT duplicate
canonical policy.

#### Scenario: Missing canonical reference is reported
- **WHEN** a thin adapter does not reference its canonical skill
- **THEN** the drift check reports `missing-canonical-reference`

#### Scenario: Policy-duplicating adapter is reported
- **WHEN** a thin adapter duplicates canonical policy beyond the thin contract
- **THEN** the drift check reports a thinness or duplication violation

### Requirement: Generated OpenSpec assets are excluded
OpenSpec-generated `.claude/skills/openspec-*`, `.agents/skills/openspec-*`, and
`opsx` commands SHALL be excluded from the drift check and SHALL NOT be
hand-edited.

#### Scenario: Generated assets are outside the catalog
- **WHEN** the drift check runs
- **THEN** OpenSpec-generated assets are not treated as canonical skills
