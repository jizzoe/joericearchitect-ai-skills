# M5-S1 — Cross-repository Coordination

Date: 2026-08-23
Status: First-class milestone brief; gated after M4-S4 qualifies repeated
single-change v1. Delivery still requires separate authorization.
Proposed change: `add-autonomous-sdd-cross-repository-coordination`

## 1. Problem and desired outcome
Problem: A single delivery slice that spans a central planning repository and
one or more component repositories has no first-class coordination contract in
the control plane.
Desired outcome: One authorized change spans a central planning repository and
one or more component repositories, with the central change opening first and
closing last and component changes archiving inside it.

## 2. Evidence and key findings
- The Invest-in-Growth project (`home-roots-reinvest-in-growth` central +
  `hrf-reinvest-to-grow-mobile-app` component) documents the open-first/
  close-last sequencing, the linkage ledger, and the assigned-executor
  requirement in its `docs/cross-repository-sdd-flow.md`.
- The [main design](../autonomous-sdd-reliability-control-plane.md) supplies
  the shared architecture and single-owner invariants this slice extends
  without weakening.

## 3. Options considered and tradeoffs
- Treat as a deferred parallel-execution concern (rejected: the owner made it a
  first-class milestone).
- First-class milestone with its own contract and proof fixture (selected).

## 4. Decisions, assumptions, and owner
- Owner: Initiative owner.
- Confirmed decisions: this is a first-class milestone, not deferred
  parallel-execution behavior; it reuses the linkage-ledger convention.
- Assumptions: component repositories each run their own single-repo lifecycle
  and return evidence to the central ledger.

## 5. Scope, non-goals, constraints, dependencies, and risks
- Scope: M5-S1 central envelope change, component change dispatch/return,
  linkage ledger, open-first/close-last ordering, and assigned-executor evidence.
- Non-goals: milestone queues, parallel child execution, fine-grained claims,
  or default routing.
- Constraints: the central change opens first and closes last; component changes
  archive inside it; end-to-end verification names an assigned executor,
  environment, and evidence location.
- Dependencies: M4-S4 qualified single-change v1.
- Risks: cross-repository mutation without a single owner could create
  conflicting claims; the linkage ledger must record exact revisions.

### Proof fixture
The Invest-in-Growth project: `home-roots-reinvest-in-growth` (central envelope)
plus `hrf-reinvest-to-grow-mobile-app` (component).

### Acceptance evidence
- One central envelope change and one or more component changes complete with
  the central change opening first and closing last.
- The linkage ledger records dispatch and return against exact revisions.
- End-to-end verification names an assigned executor, environment, and evidence
  location; a missing executor is discovered at proposal time.

## 6. Open questions and blocking decisions
- Confirm the linkage-ledger format and closed dispatch-status vocabulary.

## 7. Recommended next step
Explore-ready only after M4-S4 qualifies. Recommended workflow action: OpenSpec
Explore. No OpenSpec artifacts were created.
