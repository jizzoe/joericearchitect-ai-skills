## Why

A complete, explicitly authorized autonomous SDD delivery can currently lose
its enclosing authorization at a generated lifecycle action and stop at that
action's ordinary boundary. This leaves a valid bounded run unable to resume
reliably through delivery and makes post-Archive cleanup unavailable despite
the existing lifecycle and derived-target safety controls.

## What Changes

- Add one canonical controller for a resolved autonomous `sdd-delivery` request
  that persists a portable, versioned selected-entry run record before lifecycle
  work and resumes at the first incomplete evidenced checkpoint.
- Route validated controller context across planning, Apply, Verify, delivery,
  Sync, Archive, and exact change-owned cleanup; preserve the planning-only
  boundary of standalone generated phase actions.
- Add the target-explicit `ship-sdd` request form and fixed `prod` and
  `prototype` aliases, including duration overrides and explicit normalized
  authorization output.
- Extend deterministic checkpoint and operation authorization behavior for
  context freshness, phase ordering, derived records, and post-Archive owned
  worktree/branch cleanup.
- Permit a single explicitly authorized design-brief output as delivery
  preparation, retain product-neutral Claude/Codex exposure, and add portable
  fixtures and documentation.

## Capabilities

### New Capabilities

- `autonomous-sdd-continuation`: durable controller context and idempotent
  continuation for fully resolved autonomous SDD delivery requests.
- `sdd-workspace-cleanup`: authorization-gated, exact-record-only cleanup of
  delivered local worktrees and branches after Archive.

### Modified Capabilities

- `sdd-lifecycle`: make controller-routed lifecycle continuation and cleanup
  observable while retaining standalone phase boundaries.
- `bounded-autonomous-execution`: recognize the resolved delivery controller,
  its durable run record, lifecycle resumption, and target-explicit aliases.
- `derived-sdd-target-authorization`: authorize and validate exact derived
  records for controller transitions and cleanup.
- `design-brief-from-research`: allow one explicitly authorized brief write
  within a valid delivery run without broadening arbitrary write authority.
- `cross-assistant-assets`: expose the canonical controller and cleanup
  behavior equivalently through thin Claude and Codex adapters.

## Impact

Affected assets include canonical skills and workflow guidance, SDD resolver,
checkpoint and operation-authorization scripts, deterministic tests/evals,
OpenSpec living specifications, and repository documentation. No generated
OpenSpec lifecycle skill is manually edited, and no product-specific constants,
credentials, deployment, release, or generic cleanup capability is introduced.

Reuse plan: controller, validation, and cleanup policy remain assistant-neutral
under `skills/base`, `workflows`, and `scripts`; repository, issue, Project,
branch, path, and credential values remain in product-owned configuration or
the durable selected-entry record. The primary GitHub issue will be created or
reused through the configured intake flow when GitHub runtime authentication is
available; current local planning records the unavailable credential boundary.
