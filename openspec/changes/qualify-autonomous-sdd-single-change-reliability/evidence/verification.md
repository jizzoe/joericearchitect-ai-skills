# Verification — Single-Change Reliability Qualification

## Change

`qualify-autonomous-sdd-single-change-reliability` (M4-S4 machinery)

## Implementation

- `scripts/sdd/autonomous-sdd-qualification.mjs` — real-completion streak,
  defect-stale classification, scenario-to-environment matrix-row schema +
  outcome evaluation, fault-matrix gate, and the qualified-opt-in release
  decision.

## Test results

- Focused suite `autonomous-sdd-qualification.test.mjs`: 6/6 pass.
- Full `scripts/sdd/test` + `scripts/github/test`: 348 pass, 0 fail, 0 skipped.

## Strict validation

`openspec validate --all --strict`: 47 passed, 0 failed.

## Acceptance evidence mapping

- Streak count/reset/stale: `consecutiveCompletions` + `classifyRealRun`.
- Matrix-row schema + `fault-matrix-only` counter: `validateMatrixRowSchema`.
- Matrix outcome mismatch: `evaluateMatrixRow`.
- Fault-matrix gate blocks on a failed row: `faultMatrixGate`.
- Release requires both gates: `releaseDecision`.
- Fault rows never count toward the streak: counter effect is
  `fault-matrix-only` and the streak only counts `completed` real runs.
