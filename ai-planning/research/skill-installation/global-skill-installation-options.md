# Global Skill Installation: Research Findings

Date: 2026-08-10
Status: Research complete; decision pending
Related plan: [Global Skill Installation Implementation
Plan](../../plans/archive/global-skill-installation-implementation-plan.md)

## Executive Summary

The best current cross-agent candidate for local installation is GitHub CLI's
preview `gh skill` feature, not a repository-owned copy installer. It supports
Claude Code and Codex targets, user scope, local or GitHub sources, explicit
version pins, source-tracking metadata, preview, and update behavior. For
reusable Codex distribution beyond local setup, OpenAI's current documentation
instead recommends plugins. The decision must therefore distinguish local
developer installation from a published shared distribution model.

This is not yet a final decision because `gh skill` is explicitly preview, and
the repository must test its exact user-scope destinations, injected metadata,
and update behavior with this repository's nested `skills/base/*/SKILL.md`
layout. A small repository wrapper may still be justified for a stable
cross-platform command surface, validation, or developer-mode links. It should
delegate to a supported installer where possible rather than reimplement source
download, version resolution, and update tracking.

Do not use symlinks as the default end-user installation model. They are useful
for a local developer checkout because edits become immediately visible, but
they depend on checkout location, have Windows and permission differences, and
can silently break when a checkout is moved or deleted. A copied, pinned
installation is more portable for normal use.

## Scope and Questions

This research covers installation of the repository's reusable skills for a
person's Claude Code and Codex environments. It does not cover installation of
MCP servers, credentials, plugin marketplaces, or arbitrary third-party skill
registries.

Questions investigated:

1. Which user-level and project-level skill locations are currently supported?
2. Which supported installers already provide preview, pinning, update, and
   conflict behavior?
3. When is a copy, link, package, or custom installer appropriate?
4. Which public installer designs are useful reference material?
5. What should be decided before an OpenSpec implementation change?

## Platform Facts

### Claude Code

Claude Code documents personal skills under `~/.claude/skills/<name>/SKILL.md`.
They are available across projects. Project skills live under
`.claude/skills/`, and Claude discovers them from the starting directory up to
the repository root. Claude Code follows the Agent Skills open standard, while
adding Claude-specific frontmatter capabilities.

Implications:

- A canonical skill directory with `SKILL.md`, `references/`, `scripts/`, and
  `assets/` is a compatible portable shape.
- The user-level installation is distinct from project-local skills.
- A global installer must not overwrite `.claude/skills/<name>` by default.
- The final guide needs both a user-level installation path and a project-local
  path for skills that should not apply everywhere.

Sources: [Claude Code skills documentation](https://code.claude.com/docs/en/slash-commands),
[Claude Agent SDK skill discovery](https://code.claude.com/docs/en/agent-sdk/skills).

### Codex

Current OpenAI documentation says Codex scans user skills from
`$HOME/.agents/skills`, repository skills from `.agents/skills`, administrator
skills from `/etc/codex/skills`, and bundled system skills. It supports
symlinked skill folders. For locally curated skills, it recommends
`$skill-installer`; for reusable distribution beyond one repository, it
recommends plugins.

There is a compatibility detail to validate: the bundled OpenAI
`skill-installer` implementation currently installs into `$CODEX_HOME/skills`,
defaulting to `~/.codex/skills`, whereas the current public documentation names
`~/.agents/skills` as the user discovery location. This may reflect a
version-specific or product-surface transition. No repository automation should
hard-code either location until a clean-environment fixture establishes the
runtime behavior for the supported Codex versions.

Implications:

- `.agents/skills` is the documented user and repository discovery convention
  for current Codex documentation.
- The bundled installer is Codex-only and deliberately does not overwrite an
  existing destination.
- The installer is a useful safety reference, but it does not solve
  cross-assistant installation, update, uninstall, or local-development links
  by itself.

Sources: [OpenAI documentation: Build skills](https://learn.chatgpt.com/docs/build-skills),
[OpenAI skill-installer implementation](https://github.com/openai/skills/blob/main/skills/.system/skill-installer/scripts/install-skill-from-github.py).

### GitHub CLI `gh skill`

GitHub CLI now has a preview `gh skill` command family. `gh skill install` can
install from a GitHub repository or a local directory, target Claude Code or
Codex, and choose user or project scope. Its documented behavior includes:

- Host-specific placement selected through `--agent` and `--scope`.
- User scope for skills available everywhere.
- Copy-based local installation with source-tracking metadata injected into
  frontmatter.
- Discovery of nested `skills/*/SKILL.md` structures and direct path targeting.
- Preview, listing, update, pinning to a tag or commit SHA, and an explicit
  force-overwrite option.

This maps directly to this repository's `skills/base/<skill>/SKILL.md` layout.
The exact user-scope path and metadata schema should be treated as a tested
contract only after an isolated local fixture run, because the feature is in
preview and GitHub may change it.

Sources: [GitHub CLI `gh skill install` manual](https://cli.github.com/manual/gh_skill_install),
[GitHub CLI `gh skill` preview notice](https://cli.github.com/manual/gh_skill).

## Installation Options

| Option | Strengths | Limits and risks | Research assessment |
|---|---|---|---|
| GitHub CLI `gh skill` | Cross-agent targeting, user/project scope, preview, pinning, source metadata, updates | Preview feature; metadata and destination behavior require fixture tests | Leading candidate for normal local installs |
| Codex `$skill-installer` | OpenAI-maintained local setup flow; safe no-overwrite behavior | Codex-only; observed user path needs version-aware validation | Good Codex fallback and safety reference |
| OpenAI plugin | Current official recommendation for reusable Codex distribution beyond a single repo | Does not distribute to Claude Code; adds plugin packaging | Evaluate when broad Codex/ChatGPT distribution is a goal |
| Claude marketplace/plugin | Native Claude distribution and updates | Claude-only; requires plugin packaging and does not solve Codex | Consider only if a separate Claude plugin becomes valuable |
| Repository copy installer | Can present one stable command and enforce repository policy | Duplicates installer logic, path handling, versioning, and update behavior | Only justified as a thin wrapper over `gh skill` or native tools |
| Per-skill symbolic links | Immediate use of a local checkout; no copy drift | Checkout-dependent, fragile after moves, platform-sensitive, weak provenance | Developer-only opt-in mode |
| Third-party universal installer | Broad agent coverage | New supply-chain and operational dependency | Do not make it the baseline without separate evaluation |

## Public Examples Worth Studying

### OpenAI `skill-installer`

The official implementation demonstrates several patterns worth retaining:

- Validate that URLs, paths, and names cannot escape the intended source or
  destination.
- Extract downloaded archives only after real-path containment checks.
- Validate that every installed directory contains a valid skill entry point.
- Fail closed when the target already exists.
- Use a temporary directory for download or sparse checkout and clean it up.

It is intentionally a copier, not a synchronizer. That boundary is useful:
source acquisition and installation should not silently mutate a user-owned
skill after the initial install.

Source: [OpenAI skill-installer implementation](https://github.com/openai/skills/blob/main/skills/.system/skill-installer/scripts/install-skill-from-github.py).

### GitHub CLI

GitHub's own CLI publishes a user-scoped skill through `gh skill install` and
updates it with `gh skill update`. This is the strongest evidence that the
GitHub-managed source-tracking and update model is intended for maintained
skill distribution.

Source: [GitHub CLI repository](https://github.com/cli/cli).

### `megastep/codex-skills`

This repository provides a custom installer with selective groups, an explicit
`--dry-run`, and an opt-in `--symlink` mode for local iteration. It is useful
as an interaction-design reference: users should be able to select a subset,
preview mutations, and choose developer links deliberately. It is not an
authority on Codex's supported locations or installer contract.

Source: [`megastep/codex-skills`](https://github.com/megastep/codex-skills).

### `alirezarezvani/claude-skills`

This collection documents platform-specific instructions, a universal
installer, a native Claude marketplace route, manual copy instructions,
verification, troubleshooting, and uninstallation. It reinforces the need for
clear operator documentation, but it has a broad third-party dependency and
should not be adopted as the repository's installer without a separate
security and maintenance review.

Source: [`alirezarezvani/claude-skills` installation guide](https://github.com/alirezarezvani/claude-skills/blob/main/INSTALLATION.md).

## Security and Reliability Findings

- Treat every external skill as executable operational guidance, not harmless
  Markdown. Review `SKILL.md`, referenced files, and scripts before install.
- Use pinned tags or commit SHAs for reproducible installations when a skill is
  released for reuse. A default-branch install is convenient but not immutable.
- Preview the exact skill and source before installation. `gh skill preview`
  supports this workflow.
- Keep user-level and project-level scopes explicit. Global installation grants
  the skill relevance in every session.
- Default to no overwrite. Require a separate explicit replace operation after
  displaying source, destination, ownership, and diff information.
- Record managed provenance in a format that update tooling can read; do not
  overwrite provenance added by `gh skill` without understanding its schema.
- A link installer must validate the resolved real path and fail if the link
  escapes the selected repository or becomes stale.
- Never install credentials, MCP configuration, shell profiles, or global
  approval-policy changes as part of skill installation.

## Recommended Decision Inputs

The decision record should compare these two candidates first:

### Candidate A: GitHub CLI as the Release Installer

Use `gh skill preview` before installation, then use `gh skill install` from a
tagged release at user scope for each supported agent. Publish each selected
canonical skill in the standard nested layout and use `gh skill update` for
managed updates. Keep this candidate limited to local installation until its
preview status and path behavior are fixture-tested.

Advantages: no custom source download/update engine, existing provenance, and
explicit user/project scope. Risks: preview status and the need to test exact
Claude/Codex destination behavior and frontmatter effects.

### Candidate B: Thin Repository Wrapper Plus Native Backends

Provide a small script that discovers this repository's canonical skills,
prints a dry-run plan, validates prerequisites, then delegates normal release
installs to `gh skill`. It may offer a separately named developer-only link
mode for a checked-out local repository.

Advantages: one repository-specific operator interface and room for
cross-platform validation. Risks: scope creep into a competing package manager.
The wrapper must not download arbitrary repositories, invent update metadata,
or obscure the underlying commands.

## Open Questions to Resolve by Fixture Testing

1. Does the installed GitHub CLI version place user-scoped Codex skills in the
   expected location and make them discoverable after a restart?
2. Does a user-scoped Claude Code target preserve the current documented
   `~/.claude/skills` contract?
3. What exact source metadata does `gh skill` inject, and is it compatible with
   the Agent Skills standard and both platforms?
4. Can `gh skill update` update skills installed from this repository while
   preserving local user changes or reporting them clearly?
5. Does `gh skill preview` show enough source and mutation information to be
   the required pre-install inspection step?
6. Does `gh skill` accept this repository's exact nested canonical paths
   without adding an alternate distribution tree?
7. Which supported operating systems need separate link-mode behavior?
8. Does the Codex version used by this repository discover the current
   documented `~/.agents/skills` path, the bundled installer's
   `$CODEX_HOME/skills` path, or both?
9. Is a Codex plugin necessary for the intended distribution audience, or are
   documented local installations sufficient for the first release?

## Research Sources

- [GitHub CLI `gh skill install` manual](https://cli.github.com/manual/gh_skill_install)
- [GitHub CLI `gh skill` manual](https://cli.github.com/manual/gh_skill)
- [OpenAI documentation: Build skills](https://learn.chatgpt.com/docs/build-skills)
- [OpenAI skill-installer implementation](https://github.com/openai/skills/blob/main/skills/.system/skill-installer/scripts/install-skill-from-github.py)
- [Claude Code skills documentation](https://code.claude.com/docs/en/slash-commands)
- [Claude Agent SDK skill discovery](https://code.claude.com/docs/en/agent-sdk/skills)
- [`megastep/codex-skills`](https://github.com/megastep/codex-skills)
- [`alirezarezvani/claude-skills` installation guide](https://github.com/alirezarezvani/claude-skills/blob/main/INSTALLATION.md)

All sources were accessed on 2026-08-10. GitHub CLI skill management and
current OpenSpec multi-repository functionality are documented as preview or
beta surfaces; their behavior must be rechecked immediately before
implementation.

## Appendix: Practical `gh skill` Installation Walkthrough

This appendix answers the concrete question: given the public repository
`jizzoe/joericearchitect-ai-skills`, how does a user install the repository's
canonical skills globally for both Claude Code and Codex?

### Repository Layout Confirmed

The repository's reusable skills live at:

```text
skills/base/<skill-name>/SKILL.md
```

For example, this read-only command successfully discovered and rendered the
canonical `github-issue-authoring` skill on 2026-08-10:

```bash
PAGER=cat gh skill preview \
  jizzoe/joericearchitect-ai-skills \
  skills/base/github-issue-authoring
```

`gh skill` reported the path as `base/github-issue-authoring/` and displayed
its `SKILL.md`. The repository's nested `skills/base/` structure is therefore
compatible with GitHub CLI's skill discovery. The current canonical set is:

```text
autonomous-goal-runner
dependency-aware-work-selection
github-issue-authoring
github-issue-to-openspec
github-pr-linkage
openspec-github-sync
project-pr-status-sync
```

### Compatibility Prerequisite: Normalize Skill Metadata

Current Codex documentation requires `name` and `description` in the YAML
frontmatter of every `SKILL.md`. Claude Code likewise documents YAML frontmatter
as the mechanism that supplies invocation and discovery metadata. The current
repository inventory shows that `autonomous-goal-runner` has compliant metadata,
but the other six canonical skills begin directly with Markdown headings.

`gh skill preview` can discover and render those six directories, but that is
not evidence that Claude Code or Codex will activate them after installation.
Before treating global installation as supported, first deliver a small,
separate metadata-normalization change that gives every canonical skill:

```yaml
---
name: stable-skill-name
description: What the skill does, when to use it, and when not to use it.
---
```

The generated Claude and Codex wrappers should remain thin discovery adapters;
the canonical metadata and procedure belong in `skills/base/`. Add a fixture
that proves every canonical skill has valid metadata before attempting the
global-install fixture.

Sources: [OpenAI documentation: Build skills](https://learn.chatgpt.com/docs/build-skills),
[Claude Code skills documentation](https://code.claude.com/docs/en/slash-commands).

### Prerequisites

1. Complete the metadata-normalization prerequisite above. Until then, the
   commands below are useful exploration commands, not a supported
   cross-assistant installation path.

2. Install a recent GitHub CLI release that includes the preview `gh skill`
   command.

   ```bash
   gh skill --help
   ```

3. Authenticate GitHub CLI if needed. The repository is public, but
   authentication avoids anonymous API limits and is required if a future
   release becomes private.

   ```bash
   gh auth status
   gh auth login
   ```

4. Install and authenticate Claude Code and Codex separately. `gh skill`
   installs skills; it does not install the agent applications.

### Step 1: Preview Before Installing

Preview a specific canonical skill and inspect its `SKILL.md` before any local
write:

```bash
gh skill preview \
  jizzoe/joericearchitect-ai-skills \
  skills/base/github-issue-authoring
```

Repeat that command for every skill that will be installed. In an interactive
terminal, `gh skill preview` can browse the skill's additional files. Review
all scripts, references, assets, and any external tool requirements, not only
the rendered `SKILL.md`.

For a stable release, preview a tag or commit SHA rather than the moving default
branch:

```bash
gh skill preview \
  jizzoe/joericearchitect-ai-skills \
  skills/base/github-issue-authoring@<release-tag-or-commit-sha>
```

### Step 2: Install All Canonical Skills for Claude Code

The following command installs every discovered canonical skill for the
user-level Claude Code environment:

```bash
gh skill install \
  jizzoe/joericearchitect-ai-skills \
  --all \
  --agent claude-code \
  --scope user
```

To install one skill instead, pass its explicit canonical path:

```bash
gh skill install \
  jizzoe/joericearchitect-ai-skills \
  skills/base/github-issue-authoring \
  --agent claude-code \
  --scope user
```

### Step 3: Install All Canonical Skills for Codex

Run a second command for Codex. The `--agent` flag accepts one target, so this
is intentionally separate from the Claude Code command:

```bash
gh skill install \
  jizzoe/joericearchitect-ai-skills \
  --all \
  --agent codex \
  --scope user
```

To install one skill instead:

```bash
gh skill install \
  jizzoe/joericearchitect-ai-skills \
  skills/base/github-issue-authoring \
  --agent codex \
  --scope user
```

The default branch is used when no version is specified. For reproducible
installation, substitute a release tag or commit SHA after the explicit skill
name, or use `--pin <release-tag-or-commit-sha>`. Pinning prevents normal
`gh skill update` from changing the installed version until it is unpinned.

### Step 4: Verify the Installed Skills

Ask GitHub CLI to list the skills it recorded at user scope:

```bash
gh skill list --agent claude-code --scope user \
  --json skillName,sourceURL,scope,version,pinned,path

gh skill list --agent codex --scope user \
  --json skillName,sourceURL,scope,version,pinned,path
```

Confirm that every expected skill has this repository as `sourceURL`, has
`scope` set to `user`, and has the expected version or pin. Then restart Claude
Code and Codex, or start new sessions, so both rediscover the installed skills.

Finally, invoke one known skill in each tool and confirm it loads from the
location reported by `gh skill list`:

```text
Claude Code: /github-issue-authoring
Codex:       $github-issue-authoring
```

The invocation check verifies actual agent discovery, not merely installation
metadata. If GitHub CLI reports a user path that the target agent does not
discover, stop and record the exact `gh` and agent versions; this is the
version-sensitive Codex-path question identified earlier in this research.

### Step 5: Update or Inspect Updates

For unpinned skills, use a dry run first:

```bash
gh skill update --dry-run
```

Then run the interactive update, reviewing every proposed replacement:

```bash
gh skill update
```

Do not use `--force` as routine maintenance. It re-downloads the remote skill
and overwrites local modifications. Treat a local modification as a fork or a
separate repository-owned change instead of an unmanaged variation.

### What `gh skill` Covers

- Finding standard nested `SKILL.md` directories in a GitHub repository.
- Previewing a skill before installation.
- Installing copies for each selected agent at user or project scope.
- Selecting all skills, one named skill, or an explicit nested path.
- Pinning to tags or commit SHAs.
- Recording source metadata and checking for updates.
- Listing known installed skills and their paths.
- Default no-force installation, with explicit force required to overwrite.

### What `gh skill` Does Not Cover

- Installing Claude Code, Codex, OpenSpec, or any required runtime dependency.
- Verifying that a skill's scripts are safe, compatible, or functional.
- Testing that Claude Code and Codex interpret the skill identically.
- Adding missing required `name` and `description` metadata to canonical
  `SKILL.md` files.
- Creating releases, tags, changelogs, or a compatibility policy for this
  repository.
- Managing credentials, MCP configuration, permissions, or sandbox policy.
- Providing a stable API contract: GitHub documents `gh skill` as preview.
- Providing developer-checkout symlinks; it installs copies, not live links.
- Resolving the current Codex user-skill directory transition without a fixture
  test against the intended Codex version.

### Is a Custom Install Script Necessary?

No custom installer is needed for the first release once canonical metadata is
normalized, if the goal is:

- Install the canonical skills from this public repository.
- Support current Claude Code and Codex users.
- Let GitHub CLI own source selection, pinning, provenance, and updates.
- Document the two `gh skill install` commands above and validate them in
  clean-environment fixtures.

A custom script becomes justified only when there is a demonstrated gap, such
as:

- A stable repository-specific interface is needed while `gh skill` remains
  preview.
- A developer-only live-link mode is required for a checked-out repository.
- The repository needs named installation bundles, compatibility preflight, or
  release-policy validation that GitHub CLI does not provide.
- Fixture tests show that `gh skill` does not place skills where a supported
  Claude Code or Codex version discovers them.

If a wrapper is built later, it should be thin: discover canonical skills,
perform preflight and dry-run reporting, invoke `gh skill`, verify the result,
and never reimplement downloading, version resolution, or update metadata.

Source: [GitHub CLI `gh skill install` manual](https://cli.github.com/manual/gh_skill_install).

## Recommended Implementation Plan: Metadata and Installation Documentation

### Decision

Yes. For the first supported global-installation release, create one small
OpenSpec change. It should cover the metadata correction that makes the
canonical skills reliably consumable by Codex, the regression check that keeps
them that way, and the user-facing installation documentation. A custom
installer is out of scope unless fixture testing demonstrates a concrete `gh
skill` gap.

Proposed change name: `normalize-skill-metadata-and-document-global-installation`.

### Intended Outcome

A user can install the repository's canonical skills from GitHub with `gh
skill` for Claude Code or Codex, using documented commands that have been
validated against supported versions. Every canonical distributable skill has
the required machine-readable metadata.

### Scope

1. Normalize canonical skill metadata.
   - Add valid YAML frontmatter with `name` and `description` to the six
     canonical `skills/base/*/SKILL.md` files that lack it.
   - Retain the existing `autonomous-goal-runner` metadata as the formatting
     reference, reviewing it for the same quality rules.
   - Keep names stable, unique, lowercase, and hyphenated.
   - Write each description as an activation contract: what it does, when to
     use it, and an important non-use boundary where appropriate.
   - Do not turn assistant wrapper files into duplicate skill definitions;
     retain the established thin-wrapper-to-canonical-source model.

2. Add focused metadata verification.
   - Add a repository-owned check that enumerates the seven canonical
     `skills/base/*/SKILL.md` files.
   - Fail when frontmatter is absent or invalid, `name` or `description` is
     missing, names are duplicated, or a name does not match its canonical
     directory.
   - Keep this test deterministic and offline; it validates repository
     content, not GitHub CLI or agent installation behavior.

3. Add global installation documentation.
   - Publish a concise how-to in the repository's normal documentation area.
   - Include prerequisites (`gh`, authentication, and installed Claude Code or
     Codex), safe preview commands, exact user-scope installation commands for
     each agent, tag/SHA pinning guidance, `gh skill list` verification,
     restart/new-session guidance, update guidance, and troubleshooting.
   - Link to the canonical source directories and state that `gh skill` is a
     preview GitHub CLI feature.
   - State the supported boundary precisely: the guide installs skills; it
     does not configure MCP servers, credentials, runtime dependencies, or
     product-specific configuration.

4. Run a release-readiness fixture.
   - In a clean, disposable environment, preview and install the canonical
     skills for Claude Code and Codex with `gh skill`.
   - Confirm `gh skill list` reports the expected source, scope, version, and
     path for every installed skill.
   - Restart or create fresh agent sessions and invoke at least one skill in
     each agent.
   - Record the exact `gh`, Claude Code, and Codex versions plus any
     Codex-path compatibility result in the change verification evidence.

### Explicitly Out of Scope

- A custom install script, installer package, or live-link development mode.
- Automatic setup of Claude Code, Codex, OpenSpec, MCP servers, OAuth, or
  credentials.
- New skills or changes to the substantive workflow instructions in existing
  skills, except the activation metadata needed for discovery.
- Releases, tags, changelog automation, or compatibility guarantees beyond
  the tested agent and GitHub CLI versions.

### OpenSpec Artifacts and Completion Criteria

Create the normal proportional artifacts for the change: `proposal.md`, a
delta specification for global skill distribution, `design.md`, and
`tasks.md`. The proposal should identify the current missing metadata as the
problem. The specification should require canonical metadata, guardrail
validation, and documentation. The design should define the canonical-skill
inventory and validation approach. The tasks should separate metadata,
validation, documentation, clean-environment fixture testing, and strict
OpenSpec validation.

The change is complete when all seven canonical skills pass the new metadata
check; the installation guide enables both supported agents to be installed
with `gh skill`; fixture evidence shows discovery and invocation in each; and
`openspec validate --all --strict` passes.

### Decision Gate After the Fixture

Adopt the documented `gh skill` workflow if both agents discover and invoke
the installed skills. Create a follow-up proposal for a thin custom installer
only if the fixture exposes a repeatable supported-user problem that `gh
skill` cannot address, such as an incompatible Codex install path or a needed
preflight/recovery workflow.
