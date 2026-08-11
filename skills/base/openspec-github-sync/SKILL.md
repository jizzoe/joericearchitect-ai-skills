---
name: openspec-github-sync
description: Synchronize a linked OpenSpec change with its configured GitHub lifecycle records. Use for authorized lifecycle reconciliation; do not overwrite human-authored GitHub content or use unapproved credentials.
---

# OpenSpec GitHub Sync

Use this skill when a linked OpenSpec change needs local GitHub lifecycle audit,
dry-run synchronization, or explicitly authorized repair.

## Inputs

- `config/sdd-github.json`
- The change `tracking.yaml`
- Observed issue and Project state
- Lifecycle event such as `propose-reviewed` or `apply-started`

## Procedure

1. Validate tracking metadata and artifact quality.
2. Run read-only lifecycle audit before any repair.
3. Use dry-run transition plans when live mutation is not authorized.
4. Require explicit repair authorization before planning mutation.
5. Record resulting issue URL, current status, expected status, and repair plan.

## Safety

- Audit is read-only.
- Repair requires explicit authorization.
- Missing Project fields or unknown statuses fail safely.
- PR linkage and PR-driven status reconciliation belong to later milestones.
