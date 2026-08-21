## Why

Autonomous SDD currently spreads operation names, delivery profiles, gate
predicates, and outcome handling across resolver, controller, review, and
lifecycle assets. That allows equivalent work to be classified differently by
different entrypoints and makes recovery or a safe pause depend on local
implementation choices rather than one durable policy.

M1-S1 established a v2 run, work-unit, history, and claim boundary. This next
slice supplies the typed operational vocabulary that decides what an admitted
run may do, what evidence it needs, and how every result changes its state.

## What Changes

- Add one canonical operation-contract registry for autonomous SDD operations,
  compact lifecycle stages, typed targets, prerequisite gates, required
  evidence, write-ahead behavior, and outcome disposition.
- Define deterministic `prototype-rapid` and `production-rapid` profile
  semantics, including canonical `reviewPolicy`, bounded legacy compatibility,
  required pre-Apply review readiness, and non-weakenable gates.
- Normalize and durably bind `agentPolicy` (`auto`, `multi-agent`, or
  `single-agent`) with deterministic conservative selection for `auto` and
  explicit-override preservation.
- Define an exact-head review-reuse predicate for external-only closeout work;
  require a fresh review when its sealed package, review-relevant inputs,
  dispositions, Apply evidence, or assurance policy changes.
- Require one machine-readable disposition for every emitted outcome:
  continuation, bounded objective correction, human decision, terminal
  failure, or completion. Unknown outcomes pause with retained evidence and
  cannot retry or mutate.
- Adapt autonomous continuation and bounded execution behavior to consume the
  canonical operation contract instead of maintaining competing profile or
  transition policy.

## Capabilities

### New Capabilities

- `autonomous-sdd-operation-contract`: Defines the portable operation,
  profile, gate, evidence, topology, review-reuse, and outcome-disposition
  contract for admitted autonomous SDD runs.

### Modified Capabilities

- `autonomous-sdd-continuation`: Normalize and bind the canonical profile,
  review, topology, gate, and operation outcome inputs before controller
  lifecycle work.
- `bounded-autonomous-execution`: Require bounded autonomous execution to use
  one typed operation and outcome vocabulary without weakening existing
  authorization, evidence, correction, or human-pause boundaries.

## Impact

- Affected assets: delivery-request resolver, v2 admission/controller policy,
  lifecycle and review adapters, shared runtime declarations, tests, evals,
  and thin Claude/Codex exposure.
- Compatibility: `reviewPolicy` becomes canonical; the legacy
  `independentReviewPolicy` remains accepted only for its two compatible strict
  values and contradictory dual fields are rejected.
- Migration: existing lifecycle skills become adapters over the canonical
  registry. Product-specific repositories, credentials, branches, Projects,
  and tool permissions remain caller-provided configuration rather than values
  embedded in reusable assets.
- Planning boundary: this proposal creates no implementation authority and
  does not invoke adapters or mutate external systems.
