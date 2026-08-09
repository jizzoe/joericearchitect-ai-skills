# OpenSpec GitHub Lifecycle

This workflow composes existing OpenSpec actions, tracking validation,
artifact-quality validation, GitHub issue intake helpers, and lifecycle sync
helpers. It does not replace OpenSpec artifact generation.

## Propose Reviewed

1. Validate proposal, design, specs, tasks, and tracking metadata.
2. Audit the linked issue and Project state.
3. Plan transition to `Ready`.
4. Apply repair only when explicitly authorized.

## Apply Started

1. Validate tracking metadata.
2. Audit the linked issue and Project state.
3. Plan transition to `In Progress`.
4. Apply repair only when explicitly authorized.

## Boundaries

- Read-only audit may run without mutation authorization.
- Repair requires explicit authorization and known Project field/status data.
- PR review, PR merge, and CI enforcement are handled by later milestones.
