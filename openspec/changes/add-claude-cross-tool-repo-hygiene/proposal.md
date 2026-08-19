## Why

Claude Code does not currently load the repository's shared contributor rules
at the root, and the adapter-drift check covers only a hand-maintained subset
of canonical skills. This permits discovery and thin-adapter drift to go
unnoticed as the reusable skill catalog grows.

## What Changes

- Add a root `CLAUDE.md` that imports the shared `AGENTS.md` guidance.
- Replace the hand-maintained adapter inventory with deterministic discovery of
  every canonical `skills/base/*/SKILL.md` package and its Claude and Codex
  discovery adapters.
- Validate each adapter's canonical reference and thin, non-policy-duplicating
  contract, with explicit documentation that OpenSpec-generated assets are
  outside this repository-owned check.
- Add focused regression coverage for new canonical skills, missing adapters,
  and adapters that exceed the thin-adapter contract.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `cross-assistant-assets`: Require shared root guidance discovery and complete,
  deterministic parity verification for repository-owned canonical skills.

## Impact

- Root Claude guidance, repository-owned Claude/Codex adapters, the adapter
  drift validator and its tests, and skill-authoring documentation.
- Primary issue: https://github.com/jizzoe/joericearchitect-ai-skills/issues/134.
- No OpenSpec-generated command or skill is edited, and no canonical skill
  policy, credentials, global Claude settings, or runtime permissions change.

## Reuse Plan

The portable validator derives only repository-relative canonical and platform
paths. Claude and Codex retain thin discovery adapters around the existing
assistant-neutral `skills/base` sources; repository and GitHub values stay in
product-owned configuration and tracking metadata. The linked GitHub issue is
tracked in `tracking.yaml`; its managed block points reviewers to these change
artifacts without duplicating the repository guidance.
