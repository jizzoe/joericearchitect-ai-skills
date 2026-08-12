## Why

The current operation checker only accepts targets that already appear in a
run authorization. A bounded program cannot therefore safely deliver the
issue, branch, pull request, Sync checkpoint, Archive target, and exact branch
cleanup that it deterministically creates for an approved queue entry.

## What Changes

- Add a portable, deterministic derived-target model for named SDD queue
  entries and their exact delivery records.
- Require a durable per-change checkpoint that records derived identifiers,
  head commit, lifecycle evidence, and the first incomplete transition.
- Extend authorization checks and synthetic evaluations to reject unrelated,
  incomplete, stale, mismatched, or expired delivery targets.
- Permit preapproved unauthenticated public-source reads only when an active
  run authorization explicitly includes them.
- Make `production-rapid` independent-review evidence an operational,
  exact-head delivery gate rather than a planning-only statement.

## Non-Goals

- Do not create a standing GitHub, credential, cloud, release, or deployment
  permission.
- Do not weaken existing profile, runtime-permission, adapter, evidence, or
  high-impact lifecycle gates.
- Do not deliver any program change until its exact external identifiers and
  current evidence are durable.

## Capabilities

### New Capabilities

- `derived-sdd-target-authorization`: deterministic authorization and durable
  checkpointing for delivery records derived from an approved queue entry.

### Modified Capabilities

- `bounded-autonomous-execution`: permits narrowly derived queue-entry targets
  while retaining explicit profile, evidence, runtime, and expiry checks.
- `sdd-lifecycle`: requires durable derived-target linkage before autonomous
  delivery, Sync, Archive, or merged-branch cleanup.
- `bounded-autonomous-execution`: requires an isolated configured reviewer and
  valid reviewer evidence before `production-rapid` delivery transitions.

## Impact

- Affects the portable SDD authorization checker, checkpoint helper, their
  synthetic evaluations, canonical autonomous-runner documentation, and the
  autonomous SDD lifecycle workflow.
- Primary issue: [#72](https://github.com/jizzoe/joericearchitect-ai-skills/issues/72),
  "Extend bounded program delivery authorization."
- Scope is limited to portable local policy, synthetic evaluation, and later
  SDD delivery linkage. Compatibility is backward-preserved: authorizations
  without a derived-target declaration retain exact-target behavior. Security
  remains least-privilege because no credential or external action is added.

## Reuse Plan

The canonical policy uses only queue-entry names, configured repositories, and
recorded identifiers. Repository owners, issue numbers, branches, project
configuration, and credentials remain run-time product configuration; Claude
and Codex continue to consume the same thin canonical runner asset.
