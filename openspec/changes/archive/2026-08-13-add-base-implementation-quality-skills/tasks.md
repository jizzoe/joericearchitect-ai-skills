## 1. Base code review vertical slice

- [x] 1.1 Implement the pure implementation-quality details validator and
  synthetic valid/invalid review fixtures for stable IDs, repository-relative
  evidence, severity order, independent disposition, coverage gaps, and shared
  `skill-result-v1` conformance.
  - Depends on: approved planning review.
  - Evidence: focused Node tests pass for complete results and deterministic
    failures for malformed, unsupported, duplicate, unsafe-path, and misordered
    findings.
- [x] 1.2 Add the canonical `base-code-review` skill and only the progressive
  references needed for bounded activation, read-only behavior, review areas,
  finding semantics, report ordering, pause, and recovery.
  - Depends on: 1.1.
  - Evidence: trigger, non-trigger, findings-first, missing-test, unsupported-
    finding, material-decision, no-auto-fix, and structured-result fixtures pass;
    metadata and shared-guardrail linkage validate.
- [x] 1.3 Add thin Claude and Codex discovery wrappers for
  `base-code-review` that point to the canonical skill without copied policy.
  - Depends on: 1.2.
  - Evidence: adapter-drift and normalized cross-assistant behavior checks pass
    for the same review fixtures.

## 2. Base verification loop vertical slice

- [x] 2.1 Implement deterministic verification-loop state, trusted named-check
  resolution, profile selection, evidence binding, stale-evidence rejection,
  per-signature correction accounting, and readiness validation inside the
  existing local-implementation authorization boundary.
  - Depends on: 1.1.
  - Evidence: focused tests prove ordered stages, structured-argument execution,
    focused-before-broader checks, exact target enforcement, idempotent resume,
    current evidence, and three-attempt or narrower correction limits.
- [x] 2.2 Add the canonical `base-verification-loop` skill and progressive
  references for inputs, critical-path selection, implementation authority,
  profile evidence, local review composition, objective correction, pause,
  recovery, and `skill-result-v1` readiness output.
  - Depends on: 1.2, 2.1.
  - Evidence: prototype and production fixtures pass for success, failed check,
    material decision, stale evidence, another-cycle result, correction success,
    correction exhaustion, and no OpenSpec Verify or delivery overclaim.
- [x] 2.3 Implement the initial web UI evidence matrix and prerequisite behavior
  for Chromium `1440x900` and `390x844`, current screenshots, critical-path
  interaction assertions, axe-core results, applicable manual review gaps, and
  native-mobile non-coverage.
  - Depends on: 2.1, 2.2.
  - Evidence: synthetic UI, non-UI, layout-change, accessibility, missing-tool
    interactive, and missing-tool autonomous fixtures select the specified
    checks and pause or proceed exactly as required.
- [x] 2.4 Integrate production readiness with exact-head CI evidence and the
  current strict isolated independent-review gate through its canonical owner,
  without duplicating review adapters, accepting self-review, or consuming
  behavior unique to the active degraded-review change.
  - Depends on: 2.2.
  - Evidence: strict-pass, wrong-head, stale, malformed, self-review, and strict-
    unavailable fixtures prove production readiness passes or pauses through the
    existing public contract.
- [x] 2.5 Add thin Claude and Codex discovery wrappers for
  `base-verification-loop` that point to the canonical skill without copied
  profile, authorization, review, or recovery policy.
  - Depends on: 2.2, 2.3, 2.4.
  - Evidence: adapter-drift and normalized cross-assistant behavior checks pass
    for prototype, production, UI, correction, and pause fixtures.

## 3. Security, evaluation, and portability evidence

- [x] 3.1 Complete the required evaluation matrix for review activation and
  non-trigger, severity ordering, evidence-backed findings, missing tests,
  read-only enforcement, profile selection, correction/rereview, failed
  validation, and browser or mobile-web evidence reporting.
  - Depends on: 1.3, 2.5.
  - Evidence: every delta-spec scenario maps to at least one deterministic
    fixture and the matrix reports no uncovered required behavior.
- [x] 3.2 Add adversarial fixtures for untrusted instructions, shell text,
  unexpected targets, scope expansion, secret-like values, sensitive data,
  destructive or external mutation, and missing runtime permission.
  - Depends on: 1.2, 2.2.
  - Evidence: tests prove no untrusted text executes, no secret or PII value is
    retained, review remains read-only, and verification pauses before every
    unauthorized operation.
- [x] 3.3 Add a second-workspace fixture with different relative paths, trusted
  check definitions, and product configuration, then compare Claude and Codex
  normalized results against the canonical behavior.
  - Depends on: 1.3, 2.5, 3.2.
  - Evidence: portability and thin-wrapper parity pass without product constants,
    absolute machine paths, credentials, or changes to canonical policy.

## 4. Integrated verification and review

- [x] 4.1 Run the focused implementation-quality tests plus existing metadata,
  shared-guardrail, result-contract, authorization, adapter-drift, secret, and
  OpenSpec artifact-quality validation; record commands and current results.
  - Depends on: 3.1, 3.2, 3.3.
  - Evidence: all applicable local deterministic checks pass and any intentionally
    unavailable check is recorded as a blocking gap rather than success.
- [x] 4.2 Review the complete changed paths for requirements/scenario coverage,
  code and documentation quality, security, dependency and supply-chain impact,
  attribution and licensing, portability, generated exposure, unrelated changes,
  recovery, and rollback; correct only evidence-backed behavior-preserving
  findings and rerun affected checks.
  - Depends on: 4.1.
  - Evidence: requirements mapping and review record contain every finding,
    disposition, correction, rerun, known limitation, and final changed-path
    inventory.
- [x] 4.3 Obtain current-head strict isolated independent review using the
  existing production protocol after Apply and after any objective correction;
  pause if a fresh enforced read-only reviewer or exact package evidence is
  unavailable.
  - Depends on: 4.2.
  - Evidence: unique durable review record binds the current canonical base and
    head, sealed manifest, validation evidence, reviewer execution, findings,
    dispositions, and final strict status.
- [x] 4.4 Run formal OpenSpec Verify,
  `openspec validate add-base-implementation-quality-skills --strict`, and
  `openspec validate --all --strict`; resolve only objective planning or
  implementation defects and repeat affected evidence and strict review for a
  new head.
  - Depends on: 4.3.
  - Evidence: Verify reports complete requirement, scenario, task, and design
    coverage; both strict OpenSpec commands exit successfully on the final
    reviewed state.
