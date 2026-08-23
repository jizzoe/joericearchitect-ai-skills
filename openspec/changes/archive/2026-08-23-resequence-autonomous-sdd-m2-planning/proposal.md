## Why

The 2026-08-23 roadmap revision re-sequenced Milestone 2 to prove a vertical
slice before the durable execution backend and promoted cross-repository SDD
coordination to a first-class M5 milestone. The living
`autonomous-sdd-control-plane-planning` spec still encodes the prior M2 order
and does not record cross-repository coordination as a gated milestone, so a
future session could select work under the obsolete order.

Primary issue: [#202](https://github.com/jizzoe/joericearchitect-ai-skills/issues/202).

## What Changes

- Update the "M2 work is selected after stabilization" scenario so M2-S1 is
  `prove-autonomous-sdd-vertical-slice`, followed by M2-S2 (local durable
  execution backend) and M2-S3 (run status and recovery).
- Add a requirement that cross-repository SDD coordination (M5-S1) is a
  first-class milestone gated after M4-S4, not a deferred parallel-execution
  concern.

This is a planning-only change. It changes no runtime, skill, deployment,
credential, or execution behavior.

## Non-Goals

- Implementing or activating any controller, backend, transition, GitHub, or
  cross-repository execution behavior.
- Authorizing M2-S1 or any later slice; each remains a separate delivery.

## Capabilities

### Modified Capabilities

- `autonomous-sdd-control-plane-planning`: records the re-sequenced M2 order
  and the gated first-class cross-repository milestone.

## Impact

Affected assets are the living `autonomous-sdd-control-plane-planning` spec.
The master design, roadmap, and slice briefs were already reconciled in the
accepted 2026-08-23 revision on `main`. No executable source, reusable global
skill, runtime artifact, repository setting, or external deployment changes.

## Reuse Plan

- The spec remains repository-neutral and configuration-free; no product
  constants, credentials, or assistant-specific policy are added.
- Claude and Codex continue to consume the same canonical planning rules.
