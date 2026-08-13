## 1. Contracts and Compatibility Baseline

- [x] 1.1 Create or confirm the authorized primary GitHub issue and durable OpenSpec tracking link for `add-isolated-independent-review`.
  - Depends on: none.
  - Evidence: GitHub issue #80, `tracking.yaml`, and `node scripts/validation/validate-tracking.mjs --change add-isolated-independent-review tracking.yaml`.
- [x] 1.2 Capture current independent-review facade, operation-checker, checkpoint, and Codex/Claude exposure behavior in focused baseline tests.
  - Depends on: 1.1.
  - Evidence: `node --test scripts/sdd/test/independent-review.test.mjs scripts/sdd/test/derived-target-authorization.test.mjs` (14 passing tests).
- [x] 1.3 Add versioned sealed-package and `independent-review-result-v1` JSON Schemas with positive and negative contract fixtures.
  - Depends on: 1.2.
  - Evidence: `node --test scripts/sdd/test/independent-review-contract.test.mjs`.
- [x] 1.4 Extend product configuration validation for review adapters while rejecting secrets, absolute paths, shell fragments, product constants, and standing grants.
  - Depends on: 1.3.
  - Evidence: `node --test evals/skills/base-skill-contracts/run-fixtures.test.mjs`.

## 2. Immutable Package and Result Validation

- [x] 2.1 Implement deterministic canonicalization and digest helpers.
  - Depends on: 1.3.
  - Evidence: `node --test scripts/sdd/test/independent-review-contract.test.mjs`.
- [x] 2.2 Implement `build-independent-review-package.mjs` with canonical Git resolution, exact diff derivation, artifact/evidence allowlisting, and sensitive-content exclusion.
  - Depends on: 2.1 and 1.4.
  - Evidence: disposable-repository assertion in `node --test scripts/sdd/test/independent-review-contract.test.mjs`.
- [x] 2.3 Implement `validate-independent-review-result.mjs` for schema, identity, attestation, immutable bindings, unique IDs, timestamps, evidence, status, and provenance.
  - Depends on: 2.1 and 1.4.
  - Evidence: `node --test scripts/sdd/test/independent-review-contract.test.mjs`.
- [x] 2.4 Refactor `scripts/sdd/independent-review.mjs` to consume shared package/result helpers without changing existing callers.
  - Depends on: 2.2 and 2.3.
  - Evidence: `node --test scripts/sdd/test/independent-review-contract.test.mjs scripts/sdd/test/independent-review.test.mjs scripts/sdd/test/derived-target-authorization.test.mjs` (17 passing tests).

## 3. Finding Feedback and Correction Loop

- [x] 3.1 Implement the durable finding/disposition state machine with immutable original findings, cited dispositions, and material-decision pauses.
  - Depends on: 2.3.
  - Evidence: `node --test scripts/sdd/test/review-findings.test.mjs`.
- [x] 3.2 Implement objective-fix handling with scope checks, per-signature correction budget, new-head enforcement, affected validation, and prior-review invalidation.
  - Depends on: 3.1 and 2.4.
  - Evidence: correction-budget and head-change fixtures in `node --test scripts/sdd/test/review-findings.test.mjs`.
- [x] 3.3 Package warning and false-positive dispositions as challengeable rereview evidence without a desired conclusion.
  - Depends on: 3.1 and 2.2.
  - Evidence: warning and false-positive disposition fixtures in `node --test scripts/sdd/test/review-findings.test.mjs`.
- [x] 3.4 Add end-to-end feedback-loop fixtures for clean pass, correction/rereview, disputed dispositions, material pause, stale review, and exhausted budget.
  - Depends on: 3.2 and 3.3.
  - Evidence: `node --test scripts/sdd/test/review-findings.test.mjs`.

## 4. Isolated Execution and Cross-Assistant Adapters

- [x] 4.1 Implement `execute-independent-review.mjs` with trusted command selection, fixed transport, timeout/failure codes, and immutable result capture.
  - Depends on: 2.2 and 2.3.
  - Evidence: `node --test scripts/sdd/test/execute-independent-review.test.mjs` proves immutable transport, capability rejection, and schema-bound results.
- [x] 4.2 Implement a disposable detached-review-view helper and capability probe for all required denied mutations and credential/external capabilities.
  - Depends on: 4.1.
  - Evidence: `node --test scripts/sdd/test/detached-review-view.test.mjs` proves a committed detached view excludes dirty workspace state and rejects every missing runtime-enforced denial, including workspace, Git, GitHub, credential, send, deployment, release, and delegated mutation.
- [x] 4.3 Implement the transport-only Codex adapter for fresh no-history execution under a capability-probed enforced read-only sandbox.
  - Depends on: 4.2.
  - Evidence: `scripts/sdd/platform-review-adapters.mjs`, its focused tests, and `evidence/codex-read-only-runtime-unavailable.json` provide the installed runtime's exact fail-closed acceptance record.
- [x] 4.4 Implement the transport-only Claude adapter under a fresh noninteractive execution profile whose temporary review-only settings establish OS sandboxing, deny writes and mutation tools, disable unsandboxed fallback, and fail closed when unavailable.
  - Depends on: 4.2. Parallel with: 4.3.
  - Evidence: `scripts/sdd/platform-review-adapters.mjs`, its focused tests, and `evidence/claude-temporary-sandbox-runtime-unavailable.json` provide the installed runtime's exact fail-closed acceptance record.
- [x] 4.5 Add shared adapter-contract and drift tests proving both adapters use one validator and contain no authorization, severity, disposition, or product policy.
  - Depends on: 4.3 and 4.4.
  - Evidence: `node --test scripts/sdd/test/platform-review-adapters.test.mjs` and `node scripts/sdd/check-adapter-drift.mjs` pass.

## 5. Canonical Skill and Lifecycle Integration

- [x] 5.1 Author `skills/base/independent-review/SKILL.md` and its protocol/result references with complete activation, contract, safety, feedback, pause, and recovery behavior.
  - Depends on: 3.4 and 4.5.
  - Evidence: skill metadata and shared-guardrail validators pass; the skill defines activation and non-trigger boundaries, sealed protocol, feedback, pause, and recovery behavior.
- [x] 5.2 Generate or package thin Codex and Claude skill exposures that route to the canonical skill.
  - Depends on: 5.1.
  - Evidence: `node scripts/sdd/check-adapter-drift.mjs` and `node --test scripts/sdd/test/platform-review-adapters.test.mjs` pass.
- [x] 5.3 Integrate normalized v1 evidence and dispositions into the operation checker and durable checkpoints.
  - Depends on: 2.4 and 3.4.
  - Evidence: `node --test scripts/sdd/test/independent-review-v1-gate.test.mjs scripts/sdd/test/derived-target-authorization.test.mjs` passes normalized package/result/disposition, durable-record, stale, and Apply-evidence gates.
- [x] 5.4 Update the autonomous runner and SDD lifecycle to invoke review only after current Apply evidence and to repeat it after every new head.
  - Depends on: 5.2 and 5.3.
  - Evidence: `node --test evals/workflows/autonomous-sdd-lifecycle/run-fixtures.test.mjs` covers exact-head rereview and unavailable-review pause scenarios.

## 6. Evaluation, Documentation, and Delivery Evidence

- [x] 6.1 Add the complete independent-review negative and positive fixture/eval matrix.
  - Depends on: 4.5 and 5.4.
  - Evidence: `node --test evals/skills/independent-review/run-fixtures.test.mjs` covers malformed, self-review, fresh-context, writable execution, secrets, altered/stale evidence, wrong attestation, duplicate IDs, and prohibited mutations.
- [x] 6.2 Run canonical assets in a second disposable repository with different configured paths and both adapter-shaped results.
  - Depends on: 6.1.
  - Evidence: the second-workspace test in `evals/skills/independent-review/run-fixtures.test.mjs` passes with different governed paths and Codex/Claude-shaped results.
- [x] 6.3 Create `docs/autonomous-run-enablement.md` and update canonical documentation for configuration, capability probing, feedback, and recovery.
  - Depends on: 5.4.
  - Evidence: `docs/autonomous-run-enablement.md` documents one-time readiness, `/goal`, Claude noninteractive invocation, macOS/WSL2/native-Windows boundaries, temporary settings, strict failure, and recovery.
- [x] 6.4 Perform source/license, integrity, secret/data, command-injection, least-privilege, destructive-action, portability, and recovery review.
  - Depends on: 6.1 and 6.3.
  - Evidence: `evidence/repository-review.md` records source/license, integrity, secret/data, command-injection, least-privilege, portability, and recovery review with no unresolved blocker/high finding.
- [x] 6.5 Run final focused tests/evals, adapter parity/drift, requirements mapping, formal OpenSpec Verify, focused strict validation, and `openspec validate --all --strict`.
  - Depends on: 6.2 and 6.4.
  - Evidence: 70 focused tests, skill/guardrail/tracking/drift checks, strict change validation, `git diff --check`, and `openspec validate --all --strict` (21 passed, 0 failed) pass. The schema has no Verify artifact; `evidence/verification.md` records the formal requirement/task/design report and the available strict validation. Live adapter records remain unavailable, so no production-rapid delivery is authorized.
