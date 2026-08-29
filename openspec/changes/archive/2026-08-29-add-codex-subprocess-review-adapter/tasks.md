## 1. Codex subprocess adapter

- [x] 1.1 Add `runCodexSubprocessReviewAdapter` to
  `scripts/sdd/platform-review-adapters.mjs`, mirroring the Claude degraded
  flow with the Codex probe, environment, invocation, and
  `sealCodexDegradedReviewPayload`.

## 2. Launcher wiring

- [x] 2.1 Default the Codex degraded launcher to
  `runCodexSubprocessReviewAdapter` in `scripts/sdd/review-launcher-host.mjs`
  and remove the parent-capture early-fail for the degraded launcher only.

## 3. Tests and validation

- [x] 3.1 Add focused tests for the subprocess adapter success and fail-closed
  behavior.
  - Evidence: `node --test scripts/sdd/test/platform-review-adapters.test.mjs`
    → 29 passed, 0 failed.
- [x] 3.2 Run the full sdd suite and strict OpenSpec validation.
  - Evidence: `node --test scripts/sdd/test/*.test.mjs` → 410 passed, 0 failed;
    `openspec validate --all --strict` → 49 passed, 0 failed.

## 4. Delivery

- [x] 4.1 File the GitHub issue (#266), add `tracking.yaml`, open PR #267
  (`Closes #266` + `OpenSpec change: add-codex-subprocess-review-adapter`),
  merge (squash), sync living specs, archive, and reconcile issue/Project
  state. Independent review proceeded CI-gated (no review record): the strict
  Codex path is parent-capture — the exact gap this change addresses.
