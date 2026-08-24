# M3-S2 Source Mapping — Review Admission vs. Controller Admission

Date: 2026-08-24
Change: `add-autonomous-sdd-review-admission-and-dispatcher`
Workflow action: Planning-only reconciliation (no OpenSpec artifacts created).

## Purpose

Map the existing `scripts/sdd/` review modules by role and confirm the boundary
between (a) the **review admission/dispatcher** that M3-S2 introduces and (b) the
**v2 controller run admission** already delivered in M2-S2. This is analysis only;
no code is changed.

## Source map

### A. Run/controller admission — a DIFFERENT admission (do not confuse)

- `autonomous-sdd-admission.mjs` — `admitV2Run`, `admitV2RunFromInitializer`,
  `inspectV2Admission`. Persists the parent-run record, selected work unit, and
  generation-one claim **before any lifecycle phase**, after validating identity,
  authorization, and provider capability. This is the **whole-run gate**.
- `autonomous-sdd-controller.mjs` — the v2 controller: drives the lifecycle phase
  chain (`propose → planning-review → apply → verify → delivery → sync → archive →
  cleanup`), `terminalizeV2Run`, `executeControllerLifecycleCleanup`. It consumes
  `admitV2RunFromInitializer` / `inspectV2Admission`. "apply" appears here only as
  one lifecycle phase id — it does **not** perform review-readiness admission.

### B. Review path modules — the "split prompts/helpers" M3-S2 consolidates

- `review-adapter-contract.mjs` — validates adapter capability records
  (`freshContext`, `nonInteractive`, `readOnlyView`, `runtimeEnforced`, denials).
- `platform-review-adapters.mjs` — the codex/claude platform adapters:
  executable identity (`resolveTrustedReviewerExecutable`, `pinnedExecutableUnchanged`),
  capability probes (`probeCodexReviewAdapter`, `probeClaudeReviewAdapter`),
  parent strict transport (`buildCodexParentStrictReviewToolRequest` /
  `consumeCodexParentStrictReviewToolResult`), host tool request/response,
  execution (`runCodexReviewAdapter`, `runCodexDegradedReviewAdapter`,
  `runClaudeReviewAdapter`, `runClaudeDegradedReviewAdapter`), environment
  sanitation (`sanitizedReviewEnvironment`, `isolatedReviewerEnvironment`,
  `codexAuthenticationEnvironment`, `prepareCodexReviewerEnvironment`), and
  failure classification (`diagnose*/classify*ExecutionFailure`).
- `review-launcher-host.mjs` — `executeReviewLauncherHost`: the fixed host-owned
  launcher (worktree lifecycle → sealed package → launch reviewer → validate
  result → remove view).
- `review-launcher-recovery.mjs` — `prepareReviewLauncherRecovery`,
  `acceptReviewLauncherHostResponse`, `executeReviewLauncherRecovery`: transport
  recovery + acceptance + terminalization.
- `review-worktree-lifecycle.mjs` — detached review view prepare/execute/cleanup.
- `detached-review-view.mjs` — `createDetachedReviewView`, `removeDetachedReviewView`.
- `independent-review-contract.mjs` — `buildReviewPackage`, `validateReviewPackage`,
  `validateReviewResult`, `canonicalJson`: the package/result schema.
- `independent-review.mjs` — pure evaluators (`immutableReviewManifest`,
  `reviewInputMatchesGitDiff`, `prepareIndependentReview`,
  `evaluateIndependentReviewV1`, `strictSummaryMatchesResult`,
  `degradedAuthorizationMatchesResult`). Policy/evaluation only, no execution.
- `execute-independent-review.mjs` — orchestration entry points
  (`probeIndependentReviewAdapter`, `executeIndependentReview`,
  `probeDegradedIndependentReviewAdapter`, and the degraded/launcher-recovery
  flow). This is today's de-facto "proto-dispatcher", still split.
- `degraded-independent-review-authorization.mjs` — validates the disabled-by-default
  degraded fallback authorization (`fallbackBoundary: "fresh-separated-reviewer-only"`).

### C. M3-S1 strict delivery — the transport the dispatcher builds over

- `autonomous-sdd-strict-review-delivery.mjs` — `deliverStrictReviewArtifact`,
  `terminalizeStrictReviewCapture`, `strictReviewTerminalKey`: exactly-once
  terminalization of a strict host capture into a parent-owned schema-valid
  terminal artifact.
- `autonomous-sdd-vertical-slice.mjs` — `thinReviewLoop` with an optional
  `strictDelivery` callback; the production review step routes through the strict
  transport (M3-S1 wiring).

## Boundary confirmation

The two "admissions" are distinct and must stay separate:

- **Controller/run admission** (`autonomous-sdd-admission.mjs` +
  `autonomous-sdd-controller.mjs`) gates whether the **whole v2 run** may
  initialize and persist its parent/work-unit/claim. It is contract-only/audit and
  the v2 controller is NOT activated.
- **Review admission** (M3-S2) is a **pre-Apply gate on the review path's
  viability**: before Apply becomes eligible, prove the exact configured
  executable/adapter, parent transport, repository/view, multi-step artifact path,
  inspection capability, runtime permission, deadline budget, and cleanup
  destination.

M3-S2's admission/dispatcher therefore lives **over the review transport**
(section B + `autonomous-sdd-strict-review-delivery.mjs`), and is NOT wired into
`autonomous-sdd-admission.mjs` / `autonomous-sdd-controller.mjs`. The controller's
`apply` phase id is unrelated to review-readiness admission.

## What the dispatcher consolidates

One typed dispatcher owns review invocation. Current helper → dispatcher
responsibility:

| Dispatcher responsibility | Today lives in |
|---|---|
| Launch | `review-launcher-host.mjs` (`executeReviewLauncherHost`) |
| Receipt consumption | `review-launcher-recovery.mjs` (`acceptReviewLauncherHostResponse`) |
| Transport recovery | `review-launcher-recovery.mjs` (`executePreparedReviewLauncherRecovery`) |
| Classification | `platform-review-adapters.mjs` (`classify*/diagnose*`), `autonomous-sdd-strict-review-delivery.mjs` (`terminalizeStrictReviewCapture`) |
| Allowed degraded eligibility | `degraded-independent-review-authorization.mjs` |
| Terminal evidence | `autonomous-sdd-strict-review-delivery.mjs` (`deliverStrictReviewArtifact`) |
| (admission checks) | `review-adapter-contract.mjs`, `probe*ReviewAdapter`, `resolveTrustedReviewerExecutable` |

No skill may launch its own competing review path, and no degraded fallback may
satisfy a strict-only gate.

## Authorization

Planning-only. Implementation (Propose/Apply) is NOT authorized and requires
explicit owner approval in the pre-v2/interactive lane.
