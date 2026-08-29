## Why

The merged `runCodexSubprocessReviewAdapter` parsed `codex exec --json` output
with the single-document `parseJsonResult`, but Codex emits JSONL events. The
final agent message carries the findings payload, so a successful review failed
closed with a misleading diagnostic.

## What Changes

- Parse the Codex subprocess stdout with the bounded
  `parseCodexReviewEventStream` parser (the same parser the parent-capture
  transport uses) instead of `parseJsonResult`.
- Keep the process-failure classification for nonzero exits.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None (implementation-only bug fix; `isolated-independent-review` already
mandates validating the returned findings payload).

## Impact

- `scripts/sdd/platform-review-adapters.mjs` and its focused tests.
