# Integrate Autonomous SDD GitHub Delivery

## Why

GitHub intake and implementation delivery are currently spread across several
helpers and are not one idempotent, recoverable transition chain. A crash after
remote success but before local receipt, or a changed branch-protection policy,
can duplicate work or overwrite human-owned state. This change makes exact issue,
Project, branch, PR, check, merge, closure, and status operations converge
without duplicate or unrelated mutation, through a credential-isolated
host-operation envelope plus a non-secret result receipt.

## What Changes

- Add a non-secret, authorization-bound host-operation envelope contract
  (exact operation, repository, target identities, immutable payload/precondition
  digest, idempotency key, expiry) and a non-secret result receipt the controller
  revalidates against live target state before advancing.
- Add exact adapters for issue create/reuse, Project binding/status, topic
  branch, PR create/update, exact-head checks, merge, issue closure, and delivery
  status. Each request declares stable identity, target/precondition digest,
  capability, ownership scope, idempotency key, and observe-before-retry.
- Add merge-policy preflight (repository merge strategy and automatic
  topic-branch deletion policy) and post-merge branch-retention restoration that
  restores only the exact clean reviewed head without force, recording a
  branch-retention receipt.
- Enforce field-level ownership (managed fields vs. human-owned content) for
  issue, PR, and Project updates, per the accepted Q2 model.

## Capabilities

### New Capabilities

- `autonomous-sdd-github-delivery`: credential-isolated host-operation envelope
  and result receipt; exact idempotent GitHub intake and implementation-delivery
  adapters; merge-policy preflight and branch-retention restoration; ownership
  scope and observe-before-retry reconciliation.

### Modified Capabilities

None.

## Impact

- New `scripts/sdd/autonomous-sdd-github-envelope.mjs`,
  `scripts/sdd/autonomous-sdd-github-transitions.mjs`, and
  `scripts/sdd/autonomous-sdd-github-merge-policy.mjs` (plus focused tests).
- Reuses the existing `gh` execution boundary (`scripts/github/lib/gh.mjs`),
  `github-cli-auth-context` probe, `issue-intake-binding`, and the
  issue/project/PR helpers.
- Uses the two-token disposable fixture strategy and the delimited-block +
  field-allowlist ownership model recorded in the M4-S1 explore output.
- Contract-only/audit; does not activate real ownership or production Apply
  before the full activation bundle and M4-S4 qualification.
