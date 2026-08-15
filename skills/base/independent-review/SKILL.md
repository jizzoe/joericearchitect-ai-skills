---
name: independent-review
description: Obtain and validate an isolated independent AI review for a bounded production-rapid delivery. Use only after current Apply evidence exists and a configured Codex or Claude adapter can create a fresh read-only review; do not use for ordinary self-review, planning, or to bypass an unavailable reviewer.
---

# Independent Review

Run this skill only for the named delivery transition after Apply evidence is
current for its exact head. Read [the protocol](references/protocol.md) before
building a package and [the result contract](references/result-contract.md)
before accepting a result.

## Required Inputs

Require the named transition, configured adapter and attestation, canonical
base and head commit IDs, current Apply validation evidence, allowed OpenSpec
artifact paths, repository path, and implementer-session identity. Do not infer
any missing value. Reject unsupported configuration, absolute paths, secrets,
standing grants, noncanonical commits, or content outside the sealed package.

## Procedure

1. Re-derive durable Git, OpenSpec, checkpoint, authorization, and Apply
   evidence. Stop if evidence is stale or the transition is not authorized.
2. Build the package with `scripts/sdd/independent-review-contract.mjs`; do not
   add conversation history, dispositions as instructions, or an intended
   conclusion.
3. Create a disposable detached view at the exact head and capability-probe the
   selected adapter. Invoke only `scripts/sdd/platform-review-adapters.mjs`.
4. If a managed parent denies nested Codex app-server or sandbox startup, call
   `buildCodexParentStrictReviewToolRequest` for the same exact package,
   configured reviewer, attestation, and distinct implementer identity. Issue
   its fixed `/usr/bin/env` argument vector as the actual shell-tool call with
   the returned working directory and `sandbox_permissions:
   "require_escalated"`; do not execute repository code outside the parent
   sandbox. Pass only the direct tool result to
   `consumeCodexParentStrictReviewToolResult`. This is still strict: the outer
   boundary starts the process, while the child Codex process enforces the
   sealed read-only permission profile. A denied, expired, changed-executable,
   malformed-result, or cleanup failure remains strict `unavailable`.
5. Validate every returned `independent-review-result-v1` with the shared
   canonical validator. An unavailable, malformed, self-review, writable, or
   stale result pauses the transition.
6. An `authorized-degraded` result is eligible only after both the ordinary
   strict subprocess and any applicable parent strict transport have a
   durable unavailable result for the exact sealed package and active bounded
   authorization names the selected change, transition, expiration, risk
   reason, and `fresh-separated-reviewer-only` boundary. It MUST retain the
   strict record and capability ledger and MUST NOT be called strict-isolated.
7. If detached-view creation or the parent strict transport remains unavailable,
   use `scripts/sdd/review-launcher-recovery.mjs` to validate and
   prepare a sealed host request only when the exact degraded authorization,
   configured launcher, active runtime permission, and a separately bound
   worktree-lifecycle authorization all validate. That lifecycle request binds
   repository, base/head/manifest, transition, parent digest, and expiration;
   it never accepts a caller-selected destination. Pass the
   prepared request immediately to the configured parent-runtime transport and
   call `executePreparedReviewLauncherRecovery`; never return the intermediate
   host-required state as an owner action. A Codex parent uses
   `writePreparedReviewHostRequest` and
   `buildCodexParentReviewHostToolRequest`, which materializes and validates an
   exact-head archive inside the managed sandbox. Issue its resulting fixed
   host-owned reviewer invocation as an actual shell-tool call with
   `sandbox_permissions: "require_escalated"`, then passes the tool result
   through `consumeCodexParentReviewHostToolResult`. This request is eligible
   for Auto-review only under the runtime's interactive approval policy. The
   Codex MUST NOT execute `review-launcher-host.mjs` or other repository code
   with parent authority. The sandbox-prepared archive hosts either a fresh
   ephemeral Codex read-only reviewer or a fresh nonpersistent Claude reviewer
   with read/search tools only. Capture the response directly; do not ask the
   owner to run a command, approve a prompt, copy a payload, retrigger review,
   or attest evidence. For degraded review the runtime receipt and executable
   identity remain best-effort, non-security-verifiable evidence. Missing,
   denied, timed-out, malformed, or failed transports return terminal
   machine-readable unavailable evidence with no manual fallback.
8. Preserve each finding and use the canonical finding state machine. Apply a
   bounded objective correction only when it is behavior-preserving and
   evidence-backed; rerun affected checks and obtain a fresh review for every
   new head.
9. Record only the normalized result, non-sensitive execution reference,
   dispositions, and cleanup result in the durable checkpoint. Remove a review
   view only through its ownership-guarded cleanup helper.

Do not choose, route, or require a model. The adapter determines transport;
the canonical package, result validation, finding policy, and authorization
remain assistant-neutral.

## Result

Return `skill-result-v1` with the selected adapter, review record/result path,
current status, validation evidence, assumptions, and the next safe action.
Use `paused` for unavailable or invalid isolation, a material finding, stale
evidence, or an exhausted correction budget. Do not claim delivery approval.

## Guardrails

See [Shared guardrails](../_shared/guardrails.md).
