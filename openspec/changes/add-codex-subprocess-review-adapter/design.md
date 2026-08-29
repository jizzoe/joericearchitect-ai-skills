## Context

See `proposal.md` for motivation. `scripts/sdd/platform-review-adapters.mjs`
already contains every building block for a plain-shell Codex reviewer:
`probeCodexReviewAdapter`, `prepareCodexReviewerEnvironment`,
`buildCodexDegradedReviewInvocation` (which delegates to
`codexReviewChildArguments` to build the exact
`codex exec --strict-config --sandbox read-only --ephemeral
--ignore-user-config --ignore-rules --skip-git-repo-check --cd <view>
--output-schema <schema> --json <prompt>` command), and the already-tested
`sealCodexDegradedReviewPayload`. The strict `runCodexReviewAdapter` and
degraded `runCodexDegradedReviewAdapter` are stubs returning
`independent-reviewer-codex-capture-parent-required`, and
`review-launcher-host.mjs` blocks the Codex degraded path whenever no parent
`invoke` function is injected.

## Goals / Non-Goals

**Goals:**

- Wire the existing Codex invocation machinery into a real subprocess adapter
  that produces an honest `authorized-degraded` result.
- Unblock the Codex degraded review path from a plain shell without weakening
  strict isolation.

**Non-Goals:**

- Implement portable `strict-isolated` OS-sandbox isolation (deferred).
- Consume the reviewer-provider registry (follow-on to PR #265).
- Change the strict Codex parent-capture transport.

## Decisions

- **Add a new `runCodexSubprocessReviewAdapter`** instead of repurposing the
  parent-capture stubs. This keeps the strict and parent-capture paths intact
  and makes the subprocess transport explicit. Alternative rejected: replacing
  `runCodexDegradedReviewAdapter` in place would blur the parent-capture vs
  subprocess distinction and break the existing stub contract.
- **Reuse `sealCodexDegradedReviewPayload`** (already present and tested) rather
  than inlining the result shape. It already records the
  `degradedCapabilityLedger` with `authenticatedParentLaunchEvidence` and
  `hostPinnedReviewerExecutableIdentity` marked unavailable.
- **Mirror `runClaudeDegradedReviewAdapter`** for the
  probe → environment → invoke → parse → validate → seal flow, substituting the
  Codex-specific probe, environment, and invocation builders, so the two
  degraded paths stay symmetric and share the same failure classification.
- **Default the Codex degraded launcher to the new adapter** and drop the
  parent-capture early-fail only for the degraded launcher; strict Codex review
  remains parent-capture via `runCodexReviewAdapter`.

## Risks / Trade-offs

- [A subprocess cannot runtime-prove parent launch or host-pinned executable
  identity] → report both as unavailable in the ledger and never label the
  result `strict-isolated`.
- [Codex structured-output contract drift] → retain the preflight probe
  asserting the required flags and the `validateReviewFindingsPayload` gate; a
  malformed or missing payload fails closed through
  `diagnoseCodexExecutionFailure`.
- [Credential leakage through the child environment] → reuse
  `prepareCodexReviewerEnvironment` and `buildCodexDegradedReviewInvocation`,
  which scrub mutation credentials and use an isolated reviewer home.
- [No new external dependency] → no licensing or attribution impact.

## Reuse Plan

- The canonical adapter remains in `scripts/sdd/platform-review-adapters.mjs`;
  `review-launcher-host.mjs` stays a thin orchestrator.
- No product-specific values, credentials, or Claude/Codex skill exposure
  change; the adapter is product-neutral and the portable contract stays in the
  `isolated-independent-review` living spec.
