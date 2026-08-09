## Why

The repository can run individual OpenSpec actions, but it still depends on
routine human prompts between planning, implementation, verification, delivery,
Sync, and Archive. M1-C2 is needed before the remaining foundation changes can
run for long periods under Codex Goal mode while preserving human control over
material decisions, destructive actions, credentials, and governance.

## What Changes

- Add a reusable bounded autonomous work-execution capability for authorized
  long-running goals, ordered queues, small task batches, objective correction,
  durable checkpoints, idempotent recovery, and explicit human-pause rules.
- Extend the SDD lifecycle so one explicit bounded authorization can cover
  later Apply, Verify, delivery, Sync, and Archive transitions only after their
  objective gates pass.
- Extend cross-assistant asset behavior so Claude and Codex expose equivalent
  autonomous runner and SDD lifecycle semantics from one canonical source.
- Add security and abuse controls for credentials, untrusted content,
  destructive operations, external mutations, sandbox limitations, and
  repeated correction failures.
- Add proportional deterministic tests, evals, second-repository portability
  evidence, and a disposable end-to-end rehearsal before unattended M2-M7 work
  may begin.
- Keep this Propose action planning-only. Apply, PR readiness, merge, Sync,
  Archive, and M2-M7 execution remain outside this change proposal step.

## Capabilities

### New Capabilities

- `bounded-autonomous-execution`: reusable behavior for bounded long-running
  work execution, including authorization, queue selection, batching,
  correction budgets, review gates, checkpoints, recovery, external mutation
  boundaries, and human-pause classification.

### Modified Capabilities

- `sdd-lifecycle`: allow an explicitly authorized bounded Goal to continue
  across OpenSpec lifecycle stages only after automated planning, validation,
  review, evidence, delivery, Sync, and Archive gates pass.
- `cross-assistant-assets`: require equivalent Claude and Codex exposure for
  the bounded runner and autonomous SDD workflow from one assistant-neutral
  canonical source without duplicating policy.

## Impact

- Primary issue: https://github.com/jizzoe/joericearchitect-ai-skills/issues/8
- Roadmap parent: https://github.com/jizzoe/joericearchitect-ai-skills/issues/1
- Affected users: repository owner and contributors using Claude or Codex to
  run OpenSpec SDD lifecycle work, especially long-running Codex Goal sessions.
- Affected asset types: canonical skills, workflows, deterministic scripts,
  evals, fixtures, documentation, generated Claude exposure, generated Codex
  exposure, and OpenSpec specifications.
- Expected implementation assets include:
  - `skills/base/autonomous-goal-runner/`
  - `workflows/autonomous-sdd-lifecycle/`
  - `scripts/sdd/`
  - `evals/skills/autonomous-goal-runner/`
  - `evals/workflows/autonomous-sdd-lifecycle/`
  - generated or packaged Claude and Codex adapter surfaces
- Compatibility: ordinary Codex sessions must retain current approval behavior.
  The named Goal profile remains a launch-time runtime choice, not a behavior
  embedded in the reusable assets.
- Migration: no existing OpenSpec action is removed. The existing Propose
  workflow continues to stop at planning artifacts unless a later delivered
  bounded Goal has explicit run authorization and passes the planning review
  gate.
- Security: no token values, credential scopes, secret rotation, repository
  deletion, force-push, hard reset, or security-control weakening is
  authorized by this proposal.

## Reuse Plan

- Product-neutral reusable behavior belongs in canonical assets:
  `skills/base/autonomous-goal-runner/`,
  `workflows/autonomous-sdd-lifecycle/`, and deterministic helpers under
  `scripts/sdd/`.
- Product-specific values remain in repository configuration, OpenSpec context,
  GitHub issue and Project state, run authorization text, and local runtime
  configuration. Reusable assets must not embed `jizzoe`, Project `1`, this
  repository name, branch names, issue numbers, or bookkeeping-domain behavior.
- Claude and Codex consume the capability through generated or packaged thin
  exposure that points back to the canonical behavior. Platform permissions,
  discovery rules, and sandbox behavior are adapters, not duplicated policy.
- Portability will be evaluated against a non-mutating second-repository
  fixture and a non-OpenSpec generic-work fixture that reuse authorization,
  batching, review, correction, checkpoint, and human-pause behavior through
  different configured values.
- Behavior intentionally left product-specific: the M1-C2 issue, PR, Project
  status, disposable rehearsal authorization, and this repository's OpenSpec
  foundation sequence.
