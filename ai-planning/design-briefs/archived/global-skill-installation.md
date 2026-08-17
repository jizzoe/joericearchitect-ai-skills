# Design Brief: Global Skill Installation

Date: 2026-08-10
Status: Ready for OpenSpec Propose
Proposed change: `normalize-skill-metadata-and-document-global-installation`

## Problem

This repository contains reusable canonical skills under `skills/base/` and
thin Claude/Codex adapters. Users need a supported, repeatable way to install
those skills globally for Claude Code and Codex.

The current repository has two readiness gaps:

- Six of the seven canonical `SKILL.md` files do not yet contain the YAML
  `name` and `description` metadata required by current Codex skill guidance.
- The repository has research and command examples, but not a concise,
  tested installation guide that establishes the supported user workflow.
- The repository currently lacks a forward-looking rule and enforcement point
  that requires the same metadata on every canonical skill added later.

GitHub CLI's preview `gh skill` feature appears to cover source discovery,
preview, user/project scope, agent selection, pinning, provenance, listing, and
updates. It does not author missing metadata, validate semantic activation, or
prove that Claude Code and Codex discover the installed copies correctly.

## Desired Outcome

A user can install this repository's canonical skills from GitHub for Claude
Code, Codex, or both by following documented `gh skill` commands. The
canonical skills have reliable machine-readable metadata, repository checks
prevent regressions for both current and future skills, and a clean-environment
fixture confirms installation and activation for the supported agent versions.

## Decision

Use GitHub CLI `gh skill` as the initial release installer. Keep the repository
installer scope deliberately small:

- normalize canonical skill metadata;
- add an offline repository validation check;
- publish installation and verification documentation; and
- run isolated fixture tests against Claude Code and Codex.

Do not build a custom installer for this change. Reconsider that decision only
if fixture testing demonstrates a repeatable supported-user problem that `gh
skill` cannot address, such as an incompatible destination path or a required
preflight/recovery operation.

## Options Considered

### GitHub CLI `gh skill` (selected)

Provides one command family for Claude Code and Codex, user/project scope,
preview, version pinning, source tracking, listing, and updates. It is a
preview feature, so exact paths and activation behavior must be tested rather
than assumed.

### Native Codex installer or plugin

Useful as a Codex-specific fallback or future distribution model. It does not
provide a Claude Code installation path and therefore is not the initial
cross-agent workflow.

### Repository-owned copy installer

Could provide a stable repository-specific interface, but would duplicate
source acquisition, path handling, versioning, conflict behavior, and update
logic already provided by `gh skill`. Defer unless testing identifies a real
gap.

### Symbolic links

Useful for optional local development against a checkout, but fragile for
normal global installation because they depend on checkout location and
platform-specific link behavior. Out of scope for this release.

## Scope

### In scope

1. Add valid YAML frontmatter containing `name` and `description` to the six
   canonical skills that lack it. Keep names stable, unique, lowercase, and
   hyphenated. Descriptions must explain intended use and an important
   non-use boundary where appropriate.
2. Establish a repository-wide canonical-skill metadata invariant. Every
   future directory under `skills/base/` that contains a distributable
   `SKILL.md` must include valid `name` and `description` frontmatter before it
   can be merged or released.
3. Preserve the canonical `skills/base/` source model and thin assistant
   wrappers. Do not create duplicate skill definitions in adapter directories.
4. Add a deterministic offline check that discovers canonical skill
   directories rather than relying only on a hard-coded seven-skill list. It
   must detect missing or invalid frontmatter, missing fields, duplicate names,
   and names that do not match canonical directory names. Include a fixture for
   a newly added skill to prove the check is future-proof.
5. Make the invariant part of the normal authoring and delivery path: document
   the required frontmatter in the skill-creation guidance or template, run the
   metadata check in CI (and any local validation command used before commit),
   and make the check a required merge gate where repository rules permit.
6. Document prerequisites, preview, user-scope installation for each agent,
   pinning, listing, restart/new-session behavior, updates, troubleshooting,
   and the supported boundary of the installer.
7. Validate the documented workflow in disposable environments for Claude
   Code and Codex, including source, scope, version, path, discovery, and one
   invocation per agent.

## Non-Goals

- Installing Claude Code, Codex, OpenSpec, or runtime dependencies.
- Configuring MCP servers, OAuth, credentials, approval policies, or product
  configuration.
- Creating a general-purpose package manager or third-party skill registry.
- Changing substantive behavior of existing skills.
- Requiring metadata on unrelated Markdown files or assistant wrapper files
  that are not canonical distributable skills.
- Automatically creating releases, tags, changelogs, or marketplace/plugin
  packages.
- Supporting arbitrary operating systems or agent versions beyond those tested
  and documented.

## Constraints and Guardrails

- Treat skill files and referenced scripts as executable operational guidance;
  preview and review them before installation.
- Prefer release tags or commit SHAs for reproducible installs.
- Do not overwrite user-authored destinations implicitly.
- Do not hard-code personal paths, credentials, mutable IDs, or product
  constants into reusable assets.
- Treat `gh skill` as preview and record exact CLI and agent versions in test
  evidence.
- Keep the metadata check offline and make the installation fixture isolated,
  disposable, and non-destructive to the user's actual global environment.

## OpenSpec Handoff

Pass this brief and the supporting research to `openspec propose` to create the
authoritative proposal, delta specification, design, and task list.

The proposal should define observable behavior for:

- canonical skill metadata requirements;
- the future-skill metadata invariant and dynamic discovery rule;
- metadata regression validation;
- installation documentation;
- clean-environment installation and activation verification; and
- the explicit decision gate for any future custom installer.

The change is complete when every discovered canonical skill passes validation,
including a newly added-skill fixture; the documentation supports both agents;
fixture evidence confirms discovery and invocation; and
`openspec validate --all --strict` passes.

## Source Material

- [Global skill installation research](../../research/skill-installation/global-skill-installation-options.md)
- [Global skill installation implementation plan](../../plans/archive/global-skill-installation-implementation-plan.md)
- [OpenAI skill documentation](https://learn.chatgpt.com/docs/build-skills)
- [GitHub CLI `gh skill install` manual](https://cli.github.com/manual/gh_skill_install)
- [Claude Code skills documentation](https://code.claude.com/docs/en/slash-commands)
