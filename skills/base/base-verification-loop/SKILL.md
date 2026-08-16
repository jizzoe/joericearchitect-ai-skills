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
For an objective correction, the checker derives aggregate and named-signature
attempt counts from the selected entry's validated durable correction records;
caller-reported counts must match and cannot reset the budget.

## Required Loop

For claimed stack-standard coverage, read the shared
[standards-pack selection](../_shared/standards-pack.md) and
[context-management policy](../_shared/context-management.md). Use only the
validated selection record and repository-declared command evidence; absent
selection or tooling is a gap, never an invented command or passing claim.
Report selected rule IDs, scoped overrides, not-applicable classifications, and
role-specific evidence gaps in the verification result.

1. Bind the behavior, acceptance evidence, target paths, mode, profile, and
   authorization.
2. Identify the smallest reproduction or critical path.
3. Select focused deterministic checks and proportional profile checks.
4. Implement only the approved scope.
5. Run focused checks before broader profile checks.
6. Invoke `base-code-review` for local code and security review, cover every
   changed path exactly once in the reviewed-path set, and preserve all findings.
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
The production gate records CI provenance as `exact-head-ci` and binds its CI
head to the same current commit as the strict review.

## Result

Emit `skill-result-v1` with `skill: base-verification-loop`. Put profile,
explicit non-UI or web UI applicability and change flags, behavior, critical
path, changed and reviewed paths, the complete profile-minimum selected checks, current
binding records for their evidence IDs, correction budget and attempts, local
findings, unresolved gaps, recovery steps, current binding, readiness, and any
production gate summary in `details`. Each completed check, test, screenshot,
accessibility check, and review references one stable top-level evidence ID
whose result agrees with the selected-check result and whose details binding
matches the current workspace or commit and changed-path set. Preserve each
`not-applicable` result with a non-empty reason tied to explicit scope. A check
derived as applicable by the selected profile and UI scope must pass; it cannot
use `not-applicable` to establish readiness. Preserve each
local finding with an explicit unresolved, corrected, accepted-warning, or
false-positive resolution. Corrected findings use the exact evidence set from
their latest current passed correction. Every passed correction requires all
of its evidence to pass; every failed correction retains at least one failed
evidence record;
unresolved findings prevent readiness. A latest failed correction prevents
readiness; an exhausted failed signature requires blocked status and recovery.
Historical attempts retain evidence bound to their recorded workspace or head;
only the latest passed attempt for each signature must bind to current rerun
evidence for readiness.

Validate with `scripts/validation/validate-implementation-quality.mjs`. Supply
a validation-context JSON file as its second argument. The context carries the
applicable local-implementation authorization and durable correction checkpoint;
a production-ready result additionally carries the canonical owner's complete
review authorization input. Self-reported correction budgets, correction
histories, review summaries, or top-level evidence records cannot establish
readiness. Report
only `needs-implementation`, `paused`, `blocked`, or
`ready-for-openspec-verify`; never claim that OpenSpec Verify, CI delivery,
merge, Sync, or Archive completed.
Map readiness deterministically to the shared result status: `paused` to
`paused`, `blocked` to `blocked`, `needs-implementation` to `completed`, and
ready to `completed` or an evidence-equivalent `no-op`.

## Guardrails

See [Shared guardrails](../_shared/guardrails.md).
