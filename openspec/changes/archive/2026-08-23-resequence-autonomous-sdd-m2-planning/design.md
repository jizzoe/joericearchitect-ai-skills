## Context

The 2026-08-23 roadmap revision re-sequenced M2 (vertical slice before durable
backend) and promoted cross-repository SDD coordination to first-class M5. The
living planning spec must record both decisions so dependency-valid work
selection stays aligned with the roadmap.

## Decisions

- MODIFY the "M2 work is selected after stabilization" scenario to name the
  vertical slice as M2-S1 and the durable backend as M2-S2.
- ADD a requirement that cross-repository coordination is first-class and gated
  after M4-S4, with open-first/close-last and linkage-ledger behavior.

## Alternatives

- Leaving the spec unchanged: rejected, because it would let a future session
  select M2 work under the obsolete order.
- Encoding slice content in the spec: rejected; the spec records ordering and
  gating, while detailed slice content stays in the roadmap and briefs.
