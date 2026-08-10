# Dependency-Aware Work Selection

Use this reference when reporting current, blocked, actionable, parallel, or
next OpenSpec SDD work.

## Inputs

- GitHub issue status and dependency relationships.
- Project fields: `Status`, `Milestone`, `Change`, `Sequence`, and `Priority`.
- OpenSpec tracking metadata and task `Depends on` annotations.
- Shared files, shared interfaces, and shared external state from design docs.

## Selection Order

1. Explicit user-selected change.
2. Actionable `In Progress` work.
3. `In Review` work requiring review or merge action.
4. Highest-priority, lowest-sequence `Ready` work.
5. Lowest-sequence `Backlog` work needing proposal/specification.

When multiple changes can proceed safely, report the candidates and recommend
one. Do not silently start or switch work.

## Commands

- `node scripts/github/project-status.mjs --input queue.json`
- `node scripts/github/select-next-work.mjs --input queue.json`
- `node scripts/github/dependency-report.mjs --input queue.json`

All commands are read-only.

