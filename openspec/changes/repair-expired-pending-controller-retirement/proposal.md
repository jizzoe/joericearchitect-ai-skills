## Why

Controller-first initialization deliberately persists a schema-5 `pending`
checkpoint before attempting v2 admission. When admission stops before creating
a claim and the authorization later expires, that checkpoint cannot be resumed,
cancelled, archive-reconciled, or excluded by a later authorization, so it
permanently blocks every future admission as ambiguous.

Primary issue: https://github.com/jizzoe/joericearchitect-ai-skills/issues/274

## What Changes

- Add a declared, owner-authorized retirement transition for one exact expired
  schema-5 controller whose v2 admission state is still `pending`.
- Require exact repository, controller, authorization, checkpoint byte digest,
  expiry, and derived v2 identity bindings, plus negative proof that no matching
  active or archived v2 run or repository claim exists.
- Publish an immutable sidecar retirement receipt without editing or deleting
  the checkpoint; retries with the same exact authority are idempotent.
- Let legacy inventory classify only an exactly receipt-bound pending checkpoint
  as compatible terminal while all unproven pending checkpoints continue to
  fail closed.
- Expose the transition through the installed assistant-neutral runtime and
  document its recovery use in the canonical lifecycle skill.

Non-goals: retiring admitted or progressing runs; fabricating cancellation or
delivery evidence; weakening claim exclusion; deleting checkpoints; accepting
caller-selected inventory exclusions; or changing ordinary expiration rules.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `autonomous-sdd-run-contract`: define immutable, identity-exact retirement
  evidence for expired never-admitted pending checkpoints and its effect on
  legacy inventory.
- `autonomous-sdd-continuation`: expose a deterministic runtime transition that
  performs this recovery without lifecycle selection or checkpoint mutation.

## Impact

- Affected assets: controller and legacy-inventory scripts, installed runtime
  dispatch/manifest coverage, focused tests, and the canonical autonomous SDD
  lifecycle skill.
- Users: Claude and Codex autonomous SDD operators recovering an initializer
  that stopped before v2 admission.
- Compatibility: existing admitted-run cancellation/retirement and schema-5
  archive reconciliation remain unchanged; unproven pending checkpoints remain
  blockers.
- Security: retirement requires exact, expiring owner authority and locally
  verified absence of the derived v2 run/claim. It grants no new delivery,
  mutation, or claim authority.
- Migration: no automatic migration; existing checkpoints require an explicit
  exact retirement request.

## Reuse Plan

- Product-neutral validation, receipt publication, inventory classification,
  and transition behavior remain in canonical `scripts/sdd` and `skills/base`
  assets.
- Repository identity, checkpoint path, state root, selected change, and owner
  authorization are request/configuration inputs rather than reusable constants.
- Claude and Codex retain thin generated/exposure wrappers over the same
  installed runtime transition; no platform-specific policy is duplicated.
