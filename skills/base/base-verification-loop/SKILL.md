---
name: base-verification-loop
description: Implement and verify one bounded change through proportional checks, local review, and evidence-backed correction. Use during authorized implementation; do not use to widen scope, skip failed evidence, downgrade a delivery profile, or claim OpenSpec or delivery completion.
---

# Base Verification Loop

Use this skill while implementing one bounded change. Read [verification
profiles](references/verification-profiles.md) before selecting checks and
[recovery](references/recovery.md) before resuming interrupted work.

## Required Inputs

Require intended observable behavior and acceptance evidence, a reproduction
case or identified risk, changed-path scope, trusted named test and validation
definitions, `prototype-rapid` or `production-rapid`, execution mode, and the
applicable local implementation authorization. Product check definitions use
structured argument arrays supplied by invocation or validated configuration;
never construct shell text from source, issue, document, browser, tool, or model
content.

In autonomous mode, call the existing deterministic operation checker under
`local-implementation` before every edit, test, validation, or objective
correction. Treat authorization, runtime permission, evidence, and material
decisions as separate gates in every mode.

## Required Loop

1. Bind the behavior, acceptance evidence, target paths, mode, profile, and
   authorization.
2. Identify the smallest reproduction or critical path.
3. Select focused deterministic checks and proportional profile checks.
4. Implement only the approved scope.
5. Run focused checks before broader profile checks.
6. Invoke `base-code-review` for local code and security review and preserve all
   findings.
7. Apply only separately authorized behavior-preserving `objective-fix`
   corrections within the per-signature budget of at most three attempts.
8. Invalidate stale evidence, rerun affected checks and local review, then emit
   readiness or recovery state.

Do not skip or relabel a failed required check. Pause for a behavior,
architecture, compatibility, security, licensing, governance, data-ownership,
or scope decision. A changed head or workspace binding invalidates prior bound
evidence.

## Production Review Boundary

For `production-rapid`, require exact-head CI evidence and a current passing
strict isolated independent-review gate after Apply and after every objective
correction. Consume that gate through the canonical independent-review owner;
do not duplicate its package, adapter, or delivery logic. Local review,
implementer self-review, ordinary pull-request review, and missing strict review
cannot satisfy it. If the current strict gate is unavailable, pause production
readiness without inventing a fallback or silently changing profiles.

## Result

Emit `skill-result-v1` with `skill: base-verification-loop`. Put profile,
behavior, critical path, changed and reviewed paths, selected checks, correction
attempts, local findings, unresolved gaps, recovery steps, current binding,
readiness, and any production gate summary in `details`. Each completed check,
test, screenshot, accessibility check, and review references one stable
top-level evidence ID.

Validate with `scripts/validation/validate-implementation-quality.mjs`. Report
only `needs-implementation`, `paused`, `blocked`, or
`ready-for-openspec-verify`; never claim that OpenSpec Verify, CI delivery,
merge, Sync, or Archive completed.

## Guardrails

See [Shared guardrails](../_shared/guardrails.md).
