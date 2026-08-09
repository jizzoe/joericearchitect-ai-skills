## Why

M4-C1 can author issues and create local issue/OpenSpec linkage, but lifecycle
state still requires manual interpretation. Assistants need deterministic local
sync helpers to resolve configured Project fields, plan idempotent transitions,
audit linked issue state, and run explicit repair actions before later PR and
CI automation rely on the same state.

## What Changes

- Add an `openspec-github-lifecycle-sync` capability for local lifecycle audit,
  transition planning, and explicit repair.
- Extend GitHub Project helpers to resolve configured field/status data from
  injected state and plan idempotent transitions.
- Add read-only lifecycle audit and explicit repair helpers.
- Add `openspec-github-sync` canonical skill and `openspec-github-lifecycle`
  workflow assets with Claude/Codex exposure.
- Add fixture coverage for propose-to-`Ready`, apply-to-`In Progress`,
  missing authorization, missing Project fields, inconsistent state, repair,
  and historical backfill evidence.

## Non-Goals

- Do not enforce PR linkage or merge behavior.
- Do not add GitHub Actions or remote autonomous repair.
- Do not mutate GitHub without explicit authorization.
- Do not redefine tracking schema, GitHub intake config, or managed-block
  markers.

## Capabilities

### New Capabilities

- `openspec-github-lifecycle-sync`: behavior for local lifecycle status audit,
  idempotent transition planning, and explicit repair of linked OpenSpec/GitHub
  state.

### Modified Capabilities

- None.

## Impact

- Primary issue: https://github.com/jizzoe/joericearchitect-ai-skills/issues/33
- Roadmap parent: https://github.com/jizzoe/joericearchitect-ai-skills/issues/1
- Dependency: M4-C1 is complete.
- Affected users: assistant sessions coordinating OpenSpec changes with GitHub
  issue and Project lifecycle state.
- Affected assets: GitHub Project helper modules, lifecycle audit/repair
  scripts, canonical skills, workflow documentation, evals, and tracking
  conventions.
- Scope: local deterministic helpers and dry-run/test behavior; live mutation
  requires explicit authorization and current GitHub state.
- Compatibility: M4-C1 issue authoring and M3-C2 tracking contracts remain
  unchanged.
- Security: repair is explicit, dry-run capable, and refuses missing
  authorization or missing Project field data.

## Reuse Plan

- Product-neutral behavior belongs in lifecycle audit/repair scripts, status
  transition rules, workflow docs, skills, and evals.
- Product-specific values remain in config, tracking files, injected GitHub
  state, and command arguments.
- Claude and Codex consume the same canonical skill and workflow assets through
  thin wrappers.
- Portability is evaluated with fixtures using injected status names and
  Project state rather than hard-coded item IDs.
