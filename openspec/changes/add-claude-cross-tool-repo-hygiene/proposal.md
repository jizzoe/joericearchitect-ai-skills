# Add Claude Cross-Tool Repository Hygiene

## Why

Repository-owned Claude and Codex guidance should be discoverable, and every
canonical reusable skill adapter should be drift-checked. A root `CLAUDE.md`
importing `@AGENTS.md` makes Claude Code receive the same shared contributor
rules that Codex receives, and deterministic adapter-drift coverage keeps the
canonical `skills/base` catalog and its thin `.claude`/`.agents` adapters in
parity.

## What Changes

- Add a root `CLAUDE.md` containing exactly `@AGENTS.md`.
- Add deterministic adapter-drift coverage that enumerates every
  `skills/base/*/SKILL.md` package and requires matching thin
  `.claude/skills/<name>/SKILL.md` and `.agents/skills/<name>/SKILL.md`
  adapters, validating their canonical reference and no-policy-duplication
  contract.
- Explicitly exclude OpenSpec-generated `.claude/skills/openspec-*`,
  `.agents/skills/openspec-*`, and `opsx` commands (owned by OpenSpec).

## Capabilities

### New Capabilities

- `claude-cross-tool-repo-hygiene`: root Claude guidance import and
  deterministic canonical-adapter drift validation.

### Modified Capabilities

None.

## Impact

- Root `CLAUDE.md` and `scripts/sdd/check-adapter-drift.mjs` (plus a focused
  test).
- Does not alter OpenSpec generation, Claude global settings, authentication,
  independent-review isolation, or any canonical skill policy.
