# Design — Claude Cross-Tool Repository Hygiene

## Overview

One small change: a root `CLAUDE.md` that imports `@AGENTS.md`, and a
deterministic adapter-drift check over the canonical `skills/base` catalog.

## Root CLAUDE.md

Contains exactly `@AGENTS.md`, so a fresh Claude Code session at repository root
loads the same shared contributor guidance as Codex, without a second policy
surface.

## Module: check-adapter-drift.mjs

- `canonicalSkillNames(root)` — deterministically enumerates every
  `skills/base/*/SKILL.md` package (sorted).
- `requiredAdapters(root)` — for each canonical skill and platform
  (`.claude`, `.agents`), derives the thin adapter path.
- `checkAdapterDrift(root)` — reports `missing-adapter`, `missing-canonical`,
  `missing-canonical-reference`, `missing-no-policy-duplication-statement`, and
  `adapter-exceeds-thinness-limit`.

## Exclusion boundary

OpenSpec-generated `.claude/skills/openspec-*`, `.agents/skills/openspec-*`, and
`opsx` commands are owned by OpenSpec and are outside the canonical catalog; the
check never hand-edits them.

## Tests

A focused test covers a newly added canonical skill, a missing adapter, and a
policy-duplicating adapter.

## Non-goals

OpenSpec generation, Claude global settings, authentication, independent-review
isolation, and canonical skill policy are unchanged.
