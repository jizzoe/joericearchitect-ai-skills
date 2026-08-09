## 1. Authorization and Classification

- [x] 1.1 Create the canonical `autonomous-goal-runner` skill structure and concise primary instructions.
  - Depends on: none
  - Evidence: `skills/base/autonomous-goal-runner/SKILL.md` exists with trigger, non-trigger, planning boundary, authorization, runtime-permission, evidence-gate, and human-pause guidance.

- [x] 1.2 Add authorization policy reference covering objective, queue, mutation boundaries, forbidden actions, expiration, stopping conditions, and evidence requirements.
  - Depends on: 1.1
  - Evidence: `skills/base/autonomous-goal-runner/references/authorization-policy.md` maps to `bounded-autonomous-execution` authorization scenarios and distinguishes authorization from permission.

- [x] 1.3 Add human-decision classification reference covering material decisions, destructive actions, credentials, governance, external-state ambiguity, dependency ambiguity, persistent environment failure, and objective local failures.
  - Depends on: 1.1
  - Evidence: `skills/base/autonomous-goal-runner/references/human-decision-classification.md` maps pause and non-pause cases to delta-spec scenarios.

- [x] 1.4 Implement deterministic run-policy validation with fixtures.
  - Depends on: 1.2, 1.3
  - Evidence: `scripts/sdd/validate-run-policy.mjs` and tests or fixtures cover sufficient authorization, missing target, missing mutation boundary, forbidden action, expired authorization, and product-constant detection.

- [x] 1.5 Implement deterministic result and pause classification with fixtures.
  - Depends on: 1.3
  - Evidence: `scripts/sdd/classify-result.mjs` and tests or fixtures classify objective-fix, human-decision, warning, false-positive, destructive action, credential issue, repeated failure, and environment impasse cases.

- [x] 1.6 Run Batch 1 validation and review.
  - Depends on: 1.1, 1.2, 1.3, 1.4, 1.5
  - Evidence: focused tests or fixture checks pass; OpenSpec strict validation passes; code/documentation, security, secret-pattern, attribution, recovery, and Claude/Codex portability review findings are recorded and objective findings corrected.

## 2. Iteration, Correction, and Checkpointing

- [x] 2.1 Add correction-loop reference covering failure signatures, three materially different attempts, affected-check reruns, and blocked-state reporting.
  - Depends on: 1.5
  - Evidence: `skills/base/autonomous-goal-runner/references/correction-loop.md` maps to objective-correction and correction-budget scenarios.

- [x] 2.2 Add review-matrix reference covering tests, OpenSpec validation, code/documentation review, security and supply-chain review, requirements mapping, portability, attribution, and recovery.
  - Depends on: 1.1
  - Evidence: `skills/base/autonomous-goal-runner/references/review-matrix.md` defines required evidence and finding classifications.

- [x] 2.3 Implement checkpoint inspection helper and fixtures.
  - Depends on: 1.4, 1.5
  - Evidence: `scripts/sdd/checkpoint.mjs` and tests or fixtures report first incomplete evidenced step, no-op completed transition, stale evidence, and conflicting durable state without treating transient logs as authoritative.

- [x] 2.4 Add generic runner evals for trigger, non-trigger, authorization, batching, objective correction, correction-budget exhaustion, human pause, idempotent resume, and non-OpenSpec adapter behavior.
  - Depends on: 2.1, 2.2, 2.3
  - Evidence: eval fixtures under `evals/skills/autonomous-goal-runner/` exercise positive, negative, failure, retry/no-op, stop, and portability scenarios.

- [x] 2.5 Run Batch 2 validation and review.
  - Depends on: 2.1, 2.2, 2.3, 2.4
  - Evidence: focused tests/evals pass; correction-budget fixture demonstrates blocking after three attempts; no secrets or product-specific constants appear in reusable assets; affected checks and reviews are rerun after objective corrections.

## 3. Autonomous SDD Lifecycle Adapter

- [x] 3.1 Create the canonical autonomous SDD lifecycle workflow structure.
  - Depends on: 2.5
  - Evidence: `workflows/autonomous-sdd-lifecycle/workflow.md` composes Explore, Propose, Apply, Verify, delivery, Sync, and Archive without replacing OpenSpec artifact logic.

- [x] 3.2 Add OpenSpec action reference covering status inspection, artifact instructions, planning review, Apply batches, Verify, delivery, Sync, Archive, and standing validation.
  - Depends on: 3.1
  - Evidence: `workflows/autonomous-sdd-lifecycle/references/openspec-actions.md` maps every lifecycle gate to current OpenSpec commands and delta-spec scenarios.

- [x] 3.3 Add delivery reference covering PR readiness, verified head commit, issue closing relationship, Project state, merge authorization, branch cleanup, and no-code exception handling.
  - Depends on: 3.1
  - Evidence: `workflows/autonomous-sdd-lifecycle/references/delivery.md` defines expected GitHub targets, preconditions, evidence, idempotent rerun, and human-pause cases.

- [x] 3.4 Add recovery reference covering resume from Git, OpenSpec, issue, Project, PR, living spec, archive, and evidence state.
  - Depends on: 3.1, 2.3
  - Evidence: `workflows/autonomous-sdd-lifecycle/references/recovery.md` defines durable state precedence and partial-mutation recovery behavior.

- [x] 3.5 Add lifecycle evals for planning review, Apply batching, Verify, delivery, Sync, Archive, stale evidence, partial mutation, and generated Propose planning-only behavior.
  - Depends on: 3.2, 3.3, 3.4
  - Evidence: eval fixtures under `evals/workflows/autonomous-sdd-lifecycle/` cover complete, incomplete, ambiguous, divergent, no-op, and stop scenarios.

- [x] 3.6 Run Batch 3 validation and review.
  - Depends on: 3.1, 3.2, 3.3, 3.4, 3.5
  - Evidence: lifecycle evals pass; OpenSpec strict validation passes; review confirms built-in OpenSpec behavior is composed rather than duplicated and Apply remains gated by planning review and authorization.

## 4. External Mutation Boundaries and Platform Exposure

- [x] 4.1 Define expected external mutation boundaries for issue, Project, branch, PR, merge, Sync, Archive, and merged-topic-branch cleanup.
  - Depends on: 3.3, 3.4
  - Evidence: workflow references or fixtures require exact targets, dry-run or preview where practical, idempotent rerun, and stop behavior for unexpected repositories, Projects, secrets, branches, and records.

- [x] 4.2 Add unauthorized, partial-failure, duplicate-rerun, untrusted-content, and missing-credential fixtures for external mutation boundaries.
  - Depends on: 4.1
  - Evidence: fixtures prove no duplicate records, no human-authored content loss, no untrusted shell execution, and safe failure when `PROJECT_TOKEN` or GitHub access is missing.

- [x] 4.3 Generate or package Claude exposure for the canonical autonomous runner and SDD workflow.
  - Depends on: 3.6
  - Parallel with: 4.4
  - Evidence: Claude adapter files expose equivalent behavior, identify canonical source, and remain distinct from OpenSpec-managed generated files.

- [x] 4.4 Generate or package Codex exposure for the canonical autonomous runner and SDD workflow.
  - Depends on: 3.6
  - Parallel with: 4.3
  - Evidence: Codex adapter files expose equivalent behavior, identify canonical source, and do not change ordinary Codex session approval behavior.

- [x] 4.5 Add drift and parity checks for canonical assets and Claude/Codex exposure.
  - Depends on: 4.3, 4.4
  - Evidence: checks or fixtures fail when platform exposure is missing, stale, policy-divergent, or lacking discovery recovery instructions.

- [x] 4.6 Run Batch 4 validation and review.
  - Depends on: 4.1, 4.2, 4.3, 4.4, 4.5
  - Evidence: external-boundary fixtures, drift checks, OpenSpec validation, security review, secret scan, untrusted-input review, and cross-assistant parity review pass.

## 5. Documentation, Portability, Rehearsal, and Delivery Readiness

- [x] 5.1 Document setup, normal operation, Goal-profile launch, authorization examples, recovery, security boundaries, and stale discovery.
  - Depends on: 4.6
  - Evidence: contributor documentation links canonical assets, avoids token values, distinguishes owner-only prerequisites, and keeps product-specific values in product-owned configuration.

- [x] 5.2 Add second-repository and non-OpenSpec generic-work portability fixtures.
  - Depends on: 4.6
  - Evidence: fixtures demonstrate reusable authorization, batching, review, correction, checkpoint, and human-pause behavior without this repository's owner, Project number, branch names, issue numbers, or domain constants.

- [x] 5.3 Run full local verification for specs, tasks, design, tests, evals, documentation, security, attribution, recovery, and Claude/Codex parity.
  - Depends on: 5.1, 5.2
  - Evidence: strict OpenSpec validation, focused tests, evals, link checks or documented substitutes, secret-pattern scan, scope review, attribution review, portability review, and requirements/scenario mapping pass.

- [x] 5.4 Obtain owner authorization and run the disposable end-to-end rehearsal.
  - Depends on: 5.3
  - Evidence: disposable `[SDD test]` issue, Project updates, lifecycle PRs, Sync, Archive, objective correction, human pause, idempotent resume, external mutation boundary, branch cleanup, and preserved audit evidence are recorded without secrets.

- [x] 5.5 Complete formal OpenSpec Verify for M1-C2.
  - Depends on: 5.4
  - Evidence: verification report maps every task, requirement, scenario, design decision, security control, recovery path, portability claim, eval, and known limitation to current evidence.

- [x] 5.6 Prepare PR #9 for delivery only after verification acceptance.
  - Depends on: 5.5
  - Evidence: PR #9 targets `main`, contains accepted verification evidence, formally changes from `Related to #8` to `Closes #8` only when merge means completion, and remains draft until the owner accepts verification.

- [x] 5.7 Deliver, Sync, and Archive through separate authorized checkpoints.
  - Depends on: 5.6
  - Evidence: implementation PR merge closes issue #8 and Project reaches `Done`; Sync PR proves living specs reflect deltas and repeat Sync is a no-op; Archive PR preserves the full change bundle and active change list is empty.
