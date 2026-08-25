# Qualify Autonomous SDD Single-Change Reliability

## Why

A complete single-change path is not trustworthy until it succeeds repeatedly
and survives disruptive recovery scenarios without contaminating real work. This
change adds the qualification machinery — a streak counter, scenario-to-
environment matrix validation, and a release-decision predicate — that records
and gates the two qualification gates.

## What Changes

- Add a real-completion streak counter (default 10) that resets on an
  incomplete, terminal, or defect-staled run.
- Add scenario-to-environment matrix-row schema validation and a fault-matrix
  gate that blocks qualification when any row misses its expected outcome.
- Add a release-decision predicate that grants qualified-opt-in only when both
  gates pass independently.
- Enforce that fault-matrix rows count only toward the fault gate and never
  toward the real-run streak.

## Capabilities

### New Capabilities

- `autonomous-sdd-single-change-qualification`: real-completion streak,
  fault-matrix validation and gating, and the qualified-opt-in release decision.

### Modified Capabilities

None.

## Impact

- New `scripts/sdd/autonomous-sdd-qualification.mjs` (plus focused tests).
- Consumes the M4-S1 disposable fixture strategy, M4-S2 Sync/Archive, and M4-S3
  finalization contracts.
- Contract-only/audit: recording qualification evidence does not itself activate
  ownership; qualified-opt-in remains gated on the campaign passing.
