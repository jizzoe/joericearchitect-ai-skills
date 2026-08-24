## 1. Cancellation-as-terminal compatibility

- [x] 1.1 Generalize terminal v2-controller compatibility in
  `autonomous-sdd-admission.mjs` to accept exactly one of a
  `terminalization-receipt` or a `cancellation-receipt` bundle, with the
  cancellation path binding `controllerRunId` and `expiresAt` to the controller.
- [x] 1.2 Add an admission test that initializes, cancels-and-retires, then
  re-initializes a later delivery without ambiguity. Depends on: 1.1.

## 2. Backend capability formalization and acceptance evidence

- [x] 2.1 Add the `autonomous-sdd-local-execution-backend` living-spec delta
  (storage, history, projection, ownership, coarse claim, takeover, discovery,
  legacy inventory) and the `autonomous-sdd-run-contract`
  terminal-compatibility modification. Depends on: 1.1.
- [x] 2.2 Confirm the acceptance evidence is covered by the existing focused
  suites (second-runner denial, exact takeover, provider-capability fail-closed,
  archive/rebuild, ambiguous legacy inventory) plus the new cancellation test.
  Depends on: 2.1.

## 3. Validation and evidence

- [x] 3.1 Run the focused admission suite and the full SDD suite; run
  `openspec validate --all --strict`. Depends on: 1.2, 2.2.
- [ ] 3.2 Record completion evidence and mark the M2-S2 brief delivered; keep the
  result contract-only/audit and do not activate real ownership. Depends on: 3.1.
