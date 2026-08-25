# Design — Single-Change Reliability Qualification

## Overview

M4-S4 adds the qualification machinery that records and gates the two
independent qualification gates (ten consecutive real completions + the
disposable fault matrix), as one pure, deterministic module.

## Module: autonomous-sdd-qualification.mjs

- `consecutiveCompletions({ runs, threshold })` — counts the trailing run of
  `completed` real runs; returns `{ streak, threshold, met }`.
- `classifyRealRun({ status, defectAffectsPriorRuns })` — classifies a run's
  effect on the streak: `count`, `break` (incomplete/terminal/stale/unknown), or
  `stale-prior-runs` (a discovered defect invalidates prior runs).
- `validateMatrixRowSchema({ row })` — requires scenario, environment,
  isolation proof, injection boundary, allowed mutations, expected outcome,
  evidence, cleanup contract, bound, and counter effect; counter effect MUST be
  `fault-matrix-only`.
- `evaluateMatrixRow({ row })` — a row passes only when its actual outcome
  equals its expected outcome.
- `faultMatrixGate({ rows })` — passes only when no row failed.
- `releaseDecision({ realGateMet, matrixGatePassed })` — `qualified-opt-in`
  only when both gates pass; otherwise names the missing gates.

## Streak semantics

The streak is the number of consecutive trailing `completed` runs. Any
non-`completed` run breaks it. A defect that could affect prior real runs marks
them stale and restarts the streak.

## Matrix semantics

Every fault row counts only toward the fault gate. An expected disposable pause
satisfies its row; a row that misses its expected outcome blocks qualification.

## Integration

- Pure and deterministic; the campaign feeds it records and the running log
  promotes defects to GitHub Issues.
- Does not change the not-activated v2 controller.

## Non-goals

Standing authorization, fault injection into real work, milestone queues,
parallelism, five-slice delivery, and Temporal remain unchanged.
