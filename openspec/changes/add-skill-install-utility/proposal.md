## Why

Using `gh skill install` directly is correct but repetitive during local skill
development and remote release installation. A small repository utility can
standardize those invocations without reimplementing GitHub CLI installation,
provenance, conflict, or update behavior.

## What Changes

- Add a thin, deterministic command-line utility that delegates global skill
  installation to `gh skill install`.
- Support explicit local checkout sources and explicit remote GitHub sources.
- Require callers to choose an agent and skill selector, preserve `gh` user
  scope, and expose explicit `--force` and remote-only `--pin` options.
- Add dry-run command rendering, focused tests using a stubbed `gh`, and
  operator documentation for development and reviewed-release workflows.

## Non-Goals

- Do not copy skill files, manage credentials, authenticate Codex or Claude,
  create a package manager, or replace `gh skill` update behavior.
- Do not infer a source repository, current workspace, skill name, agent,
  profile, or overwrite choice.
- Do not mutate project-scope directories, assistant configuration, or source
  content.

## Capabilities

### New Capabilities

- `skill-install-utility`: safe, explicit invocation of GitHub CLI global
  skill installation from a local checkout or remote source.

### Modified Capabilities

- None.

## Impact

- Primary issue: https://github.com/jizzoe/joericearchitect-ai-skills/issues/59
- Affected users: maintainers iterating on local skills or installing reviewed
  remote skills globally.
- Affected assets: a repository utility, focused tests, documentation, and
  OpenSpec tracking created during delivery.
- Compatibility: existing direct `gh skill` commands remain supported.
- Security: the utility passes no credentials, defaults to `user` scope, and
  requires an explicit `--force` before `gh` can overwrite an installed skill.

## Reuse Plan

The utility accepts source, skill selector, agent, pin, and overwrite behavior
as runtime input. It contains no user paths, product repositories, credentials,
or assistant-specific policy beyond the caller-provided `gh` agent identifier.
