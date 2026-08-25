## 1. Qualification machinery

- [x] 1.1 Create `scripts/sdd/autonomous-sdd-qualification.mjs` with `consecutiveCompletions` and `classifyRealRun`
- [x] 1.2 Implement `validateMatrixRowSchema` and `evaluateMatrixRow`
- [x] 1.3 Implement `faultMatrixGate` and `releaseDecision`

## 2. Tests

- [x] 2.1 Add focused tests: streak count/reset/stale, matrix-row schema + counter-effect, matrix outcome mismatch, fault-matrix gate, release decision (both gates), fault rows never count toward the streak

## 3. Verification

- [x] 3.1 Run the focused test file and the full `scripts/sdd/test` and `scripts/github/test` suites
- [x] 3.2 Run `openspec validate --all --strict` and confirm the new delta validates
