# Verification — Claude Cross-Tool Repository Hygiene

## Change

`add-claude-cross-tool-repo-hygiene` (M4-S4 campaign run #1)

## Note on provenance

The implementation (`CLAUDE.md` + `scripts/sdd/check-adapter-drift.mjs` + its
test) pre-existed via commit `4e81901` without a formal OpenSpec change. This run
formalizes the capability (proposal/spec/design/tasks), re-verifies the existing
implementation against the requirements, and delivers it through the SDD
lifecycle. See the qualification issues log entry #1.

## Verification

- `CLAUDE.md` content is exactly `@AGENTS.md\n`.
- `node scripts/sdd/check-adapter-drift.mjs` -> `{ valid: true, issues: [] }`.
- Focused suite `check-adapter-drift.test.mjs`: 6/6 pass (Claude import, newly
  added skill, OpenSpec-asset exclusion, missing adapter, no-policy-duplication
  statement, canonical-reference + thinness limit).
- `openspec validate add-claude-cross-tool-repo-hygiene --strict`: valid.
