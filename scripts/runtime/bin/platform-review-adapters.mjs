#!/usr/bin/env node
import { runAsMain } from "../payload-wrapper.mjs";
import {
  buildCodexParentReviewHostToolRequest, buildCodexParentStrictReviewToolRequest,
  consumeCodexParentReviewHostToolResult, consumeCodexParentStrictReviewToolResult,
  degradedCapabilityLedger, probeClaudeReviewAdapter, probeCodexReviewAdapter,
  writePreparedReviewHostRequest
} from "../../sdd/platform-review-adapters.mjs";

// Only the parent-transport and probe surface canonical skills name is declared.
// The adapter run functions stay internal: they are reached through
// scripts/sdd/execute-independent-review.mjs, which owns reviewer process
// lifecycle, and exposing them here would widen the dispatch surface without a
// declared caller.
runAsMain({
  helper: "platform-review-adapters",
  invocation: "subcommand",
  operations: {
    "build-codex-parent-strict-review-tool-request": (payload) => buildCodexParentStrictReviewToolRequest(payload ?? {}),
    "consume-codex-parent-strict-review-tool-result": (payload) => consumeCodexParentStrictReviewToolResult(payload ?? {}),
    "write-prepared-review-host-request": (payload) => writePreparedReviewHostRequest(payload?.prepared, payload?.directoryPath),
    "build-codex-parent-review-host-tool-request": (payload) => buildCodexParentReviewHostToolRequest(payload ?? {}),
    "consume-codex-parent-review-host-tool-result": (payload) => consumeCodexParentReviewHostToolResult(payload ?? {}),
    "probe-codex-review-adapter": (payload) => probeCodexReviewAdapter(payload ?? {}),
    "probe-claude-review-adapter": (payload) => probeClaudeReviewAdapter(payload ?? {}),
    "degraded-capability-ledger": () => degradedCapabilityLedger()
  }
});
