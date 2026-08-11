## Purpose

Defines how the repository keeps canonical skills installable and discoverable
by Claude Code and Codex through a supported, safely verified global workflow.

## ADDED Requirements

### Requirement: Canonical skills provide valid installation metadata
Every distributable `SKILL.md` discovered under `skills/base/` SHALL start with
valid YAML frontmatter containing a unique `name` and a non-empty
`description`. The `name` SHALL be lowercase kebab-case and match the canonical
skill directory name. The description SHALL state the skill's intended use and,
where a misleading activation is likely, an important non-use boundary.

#### Scenario: A canonical skill is reviewed
- **WHEN** a maintainer inspects a distributable canonical skill
- **THEN** its frontmatter identifies it with a unique directory-matching name
  and a meaningful activation description

#### Scenario: A new canonical skill is added
- **WHEN** a new distributable `skills/base/<skill>/SKILL.md` is introduced
- **THEN** it is subject to the same metadata requirements without adding it to
  a hard-coded skill inventory

### Requirement: Metadata regressions fail deterministically
The repository SHALL provide an offline deterministic validation command that
discovers canonical skill directories and fails with an actionable path and
reason when frontmatter is missing or invalid, a required field is absent, a
name is duplicated, or a name does not match its directory. The normal local
and CI validation paths SHALL run this check, and regression fixtures SHALL
prove dynamic discovery and each failure class.

#### Scenario: Metadata validation passes
- **WHEN** every discovered canonical skill has valid unique metadata
- **THEN** the validation command succeeds without network access, credentials,
  or execution of skill instructions

#### Scenario: Metadata validation finds an invalid skill
- **WHEN** a canonical skill has missing frontmatter, a missing required field,
  a duplicate name, or a directory-name mismatch
- **THEN** the command exits nonzero and identifies the affected path and rule

### Requirement: Global installation guidance supports both agents
The repository SHALL document the tested `gh skill` preview workflow for
installing canonical skills at user scope for Claude Code, Codex, and both.
The guide SHALL identify prerequisites, trust review and preview, Git source
selection and tag-or-SHA pinning, listing or verification, required new-session
or restart behavior, updates, troubleshooting, and the installed source's
ownership boundary.

#### Scenario: A user installs for one supported agent
- **WHEN** a user follows the documented Claude Code-only or Codex-only
  installation steps with the stated prerequisites
- **THEN** the instructions supply a previewable user-scope `gh skill` command
  and a verification path for that agent

#### Scenario: A user needs both supported agents
- **WHEN** a user follows the documented dual-agent flow
- **THEN** the instructions distinguish each agent selection while preserving
  one canonical Git source and one verification path per agent

#### Scenario: Installation cannot proceed safely
- **WHEN** a prerequisite is missing, a destination conflicts with user-authored
  content, or agent discovery fails after the documented reload step
- **THEN** the guide directs the user to inspect, resolve, or report the
  condition without silently overwriting files or changing global configuration

### Requirement: Installation behavior is evidenced in isolation
The repository SHALL retain reproducible evidence from disposable isolated
fixtures for the documented installation flow on the declared supported Claude
Code and Codex versions. The evidence SHALL record the GitHub CLI and agent
versions, source, selected scope, resulting destination, discovery result, and
one successful invocation per agent; it SHALL report unavailable prerequisites
or unsupported behavior as a failed or blocked result rather than success.

#### Scenario: Cross-agent fixture succeeds
- **WHEN** a clean fixture runs the supported flow for Claude Code and Codex
- **THEN** it confirms the installed canonical skills are discovered and can be
  invoked once by each selected agent without using a user's actual global home

#### Scenario: Fixture evidence is incomplete
- **WHEN** a fixture cannot establish installation, discovery, or invocation
  for an agent
- **THEN** it records the exact unavailable prerequisite or failure and the
  release does not claim support for that agent/version combination

### Requirement: Custom installer work remains evidence-gated
The repository SHALL treat GitHub CLI `gh skill` as the initial supported
installer and SHALL NOT add a repository-owned copy installer merely to
duplicate its source selection, pinning, provenance, update, or conflict
behavior. A later custom installer proposal SHALL cite repeatable fixture
evidence of a user requirement that the supported flow cannot satisfy.

#### Scenario: The supported installer flow passes
- **WHEN** isolated fixtures establish supported installation and activation
- **THEN** release documentation names `gh skill` as the supported installer
  and no custom installer is introduced

#### Scenario: The supported installer has a demonstrated gap
- **WHEN** a repeatable fixture exposes an unmet supported-user requirement
  such as an undiscoverable destination or necessary recovery operation
- **THEN** the result is recorded for a separate design and authorization
  decision before a custom installer is added
