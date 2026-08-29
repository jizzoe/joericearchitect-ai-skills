## Why

Strict Codex independent review runs only through the parent-capture transport,
which a plain-shell agent cannot invoke. The degraded Codex path is stubbed to
`independent-reviewer-codex-capture-parent-required`, so no Codex review can run
from a plain shell even though `/usr/local/bin/codex` and the full `codex exec`
invocation machinery are already present and validated. This blocks merging
reviewed framework changes (PRs #263 and #265) in the M4-S4 campaign.

## What Changes

- Add `runCodexSubprocessReviewAdapter` to
  `scripts/sdd/platform-review-adapters.mjs`, which spawns `codex exec`, parses
  the structured findings, and seals an honest `authorized-degraded` result
  through the existing `sealCodexDegradedReviewPayload`.
- Wire the adapter into `executeReviewLauncherHost` as the default Codex
  degraded path, removing the parent-capture-only gate for that degraded path.
- Add focused tests for the success and fail-closed behavior.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `isolated-independent-review`: add a plain-shell Codex `authorized-degraded`
  subprocess review path that is honest about the capabilities it cannot
  runtime-prove and fails closed when no structured result is produced.

## Impact

- Affected assets: `scripts/sdd/platform-review-adapters.mjs`,
  `scripts/sdd/review-launcher-host.mjs`, and
  `scripts/sdd/test/platform-review-adapters.test.mjs`.
- Compatibility: additive. Strict Codex parent-capture (`runCodexReviewAdapter`)
  and the existing Claude degraded path are unchanged; the subprocess path never
  claims `strict-isolated`.

## Non-Goals

- Portable `strict-isolated` OS-sandbox isolation for arbitrary reviewers
  (deferred).
- Wiring the reviewer-provider registry to consume the new adapter (follow-on to
  PR #265).
