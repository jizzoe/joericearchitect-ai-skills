## Why

The current autonomous `prototype-rapid` path still treats independent-review and routine lifecycle confirmations as delivery gates, so it cannot provide the owner-confirmed low-friction prototype loop. This change introduces a bounded same-session quality loop that continues through objective corrections while retaining exact authorization, safety stops, and current final-head evidence.

## What Changes

- Resolve the exact `autonomous` plus `prototype-rapid` matrix to a same-session `local-review` policy with no routine Plan-to-Apply or Verified-to-Close approval prompt.
- Pre-bind the exact reviewed issue-intake payload and its repository, title, labels, managed OpenSpec block, digest, expiry, and recovery behavior so an authorized autonomous prototype run does not introduce a separate skill-level publication prompt; host runtime permission remains an independent fail-closed boundary.
- Separate blocking human approvals, required quality actions, and completion-evidence predicates in the resolved delivery contract instead of representing autonomy as an empty quality-gate list.
- Route safe objective test and local-review findings through diagnose, correct, affected-check rerun, and rereview work without a routine human pause.
- Preserve the canonical limit of three materially different attempts for one stable failure signature while allowing distinct signatures to progress within the overall run bound.
- Require every applicable focused test, critical-flow check, requirement mapping, local code/security review, OpenSpec Verify result, strict validation result, lifecycle reconciliation, and cleanup result to be current and bound to the final target and head before success.
- Preserve owner-checkpointed and `production-rapid` behavior, including production independent-review assurance.
- Align canonical assistant-neutral skills, deterministic controller and validation scripts, fixtures, living specifications, documentation, and thin Claude/Codex exposure.

Scope is limited to the interim frictionless autonomous-prototype contract and its evidence, correction, lifecycle, and adapter behavior.

## Non-Goals

- Implementing the complete local-first runtime kernel, distributed scheduler, isolated work-unit architecture, or a new controller.
- Weakening `production-rapid`, owner-checkpointed delivery, exact-target authorization, runtime permission checks, security controls, tests, verification, strict validation, or cleanup evidence.
- Treating same-session local review as independent, isolated, strict, or production assurance.
- Expanding correction attempts for one stable signature, bypassing a stopping condition, adding product-specific constants to reusable assets, or changing unrelated products.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `bounded-autonomous-execution`: Define the autonomous prototype profile matrix, continuous required quality actions, completion-evidence predicates, and per-signature correction behavior.
- `base-code-review`: Define bounded same-session review-worker evidence and its explicit local-review assurance label.
- `base-verification-loop`: Define continuous objective correction, affected-check rerun, rereview, and final evidence convergence for autonomous prototypes.
- `github-openspec-intake`: Define canonical issue-payload binding, digest validation, duplicate-safe create-or-reuse, and managed-content preservation for authorized autonomous intake.
- `autonomous-sdd-continuation`: Persist and recover the exact issue-intake binding and resulting issue evidence in the run-specific controller context.
- `sdd-lifecycle`: Define frictionless autonomous-prototype lifecycle progression and terminal evidence reconciliation while preserving other modes and profiles.

## Impact

- Primary GitHub issue: https://github.com/jizzoe/joericearchitect-ai-skills/issues/126
- Affected users: maintainers running explicitly bounded autonomous prototype deliveries through Claude or Codex.
- Affected assets: resolver and operation-check contracts, correction-chain and implementation-quality validation, lifecycle controller behavior, canonical skills under `skills/base/`, thin assistant adapters, deterministic fixtures, living specifications, and operator guidance.
- Compatibility: owner-checkpointed requests and `production-rapid` requests retain their existing approval and independent-review behavior; admitted runs are not silently reinterpreted.
- Migration: the interim local-review policy is selected only for newly resolved exact autonomous prototype requests and remains versioned for later migration to the planned runtime kernel.
- Security: exact target and mutation authorization, runtime permission, stopping conditions, secret handling, destructive-action boundaries, evidence authenticity checks, and production assurance remain enforced.
- Dependencies: existing controller schema, canonical correction ledger, configured GitHub issue-intake helpers, `base-code-review`, `base-verification-loop`, OpenSpec lifecycle actions, and generated adapter drift checks.

## Reuse Plan

- Keep the profile matrix, review labels, correction semantics, evidence predicates, and lifecycle policy product-neutral under canonical `skills/base/*` and `scripts/sdd/*` assets.
- Continue taking repository, Project, branch, issue, path, credential, deadline, and runtime values from validated authorization and repository configuration.
- Derive issue payload content from reviewed change context and configured managed-block markers; never hard-code product repository, label, or Project values in canonical policy.
- Keep Claude and Codex wrappers thin and generated or derived from the assistant-neutral source; do not duplicate canonical policy in platform-specific adapters.

This proposal is planning-only. Apply is authorized only through the active durable autonomous SDD controller after planning review and issue linkage pass.
