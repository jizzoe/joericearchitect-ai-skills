## Why

The repository's canonical skills cannot yet be installed through one verified,
supported cross-agent workflow: most lack the machine-readable metadata Codex
expects, and existing research is not a tested end-user installation guide.
This change makes the repository's reusable skills reliably discoverable and
installable through the GitHub CLI `gh skill` preview without duplicating their
canonical implementation or building a custom installer prematurely.

## What Changes

- Add a `global-skill-installation` capability for supported, documented
  installation of canonical repository skills into Claude Code, Codex, or both.
- Normalize YAML `name` and `description` metadata on every distributable
  `skills/base/*/SKILL.md` and protect that invariant with an offline,
  dynamically discovering repository check and regression fixtures.
- Document safe `gh skill` prerequisites, preview, user-scope installation,
  version pinning, verification, session reload, updates, troubleshooting, and
  explicit unsupported boundaries.
- Verify the documented Claude Code and Codex flows in isolated disposable
  environments, including source, scope, installed path, discovery, and one
  invocation per supported agent version.
- Preserve the existing assistant-neutral canonical-source model and thin
  platform wrappers. A repository-owned installer, live-link mode, secrets,
  runtime configuration, and platform-global configuration changes are out of
  scope unless fixture evidence identifies a concrete `gh skill` gap.

## Non-Goals

- Do not install Claude Code, Codex, OpenSpec, MCP servers, credentials, or
  product-specific configuration.
- Do not create a package manager, marketplace, release automation, or a
  general third-party skill registry.
- Do not change existing skills' substantive behavior or maintain duplicate
  Claude and Codex policy text.
- Do not claim support for untested operating-system or agent-version
  combinations.

## Capabilities

### New Capabilities

- `global-skill-installation`: metadata invariants, validation, documented
  GitHub CLI skill installation, and isolated cross-agent installation and
  activation evidence for canonical reusable skills.

### Modified Capabilities

- None.

## Impact

- Primary issue: [#55](https://github.com/jizzoe/joericearchitect-ai-skills/issues/55),
  "Implement global skill installation workflow."
- Affected users: maintainers and Claude Code or Codex users installing this
  repository's reusable skills globally.
- Affected assets: canonical skill frontmatter, thin assistant wrappers,
  offline validation scripts and fixtures, CI/local checks, documentation, and
  disposable installation-test evidence.
- Compatibility: existing skill directories and wrapper invocation paths remain
  stable; the change adds required frontmatter to canonical skills and records
  tested installer/version boundaries.
- Security: installation guidance requires preview and review of executable
  skill content, preserves user-authored destinations, uses isolated fixtures,
  and does not store credentials, product constants, or personal paths.

## Reuse Plan

- Product-neutral behavior belongs in canonical `skills/base` metadata,
  repository validation, fixture harnesses, and installation documentation.
- Product-specific repositories, branches, credentials, user homes, and
  destination state remain runtime inputs or fixture data, never reusable
  canonical constants.
- Claude Code and Codex consume a single canonical source through `gh skill`
  and the existing thin-wrapper model; platform path and session-discovery
  differences are documented and tested rather than encoded as duplicate
  policy.
- A future custom installer is considered only when evidence shows that the
  supported GitHub CLI flow cannot meet a documented user requirement.
