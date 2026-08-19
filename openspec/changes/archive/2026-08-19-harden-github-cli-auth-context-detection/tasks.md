## 1. Define the reusable diagnostic contract

- [x] 1.1 Add an assistant-neutral GitHub CLI read-only probe adapter with a fixed command-kind contract, conservative authentication-shaped error normalization, bounded account identity extraction, and explicit output redaction.
  - Depends on: planning review.
  - Evidence: focused Node fixtures cover success, unavailable CLI, known authentication-shaped failures, unrecognized errors, no raw output retention, and no credential or environment inspection.
- [x] 1.2 Add the SDD auth-context binding and contrast evaluator for exact selected entry, operation, repository, optional payload digest, command kind, expiry, context result, and recovery reference.
  - Depends on: 1.1.
  - Evidence: focused fixtures cover all five terminal classes, same-probe requirement, host success/denial/second-auth-failure, expired and cross-target mismatch rejection.

## 2. Persist and enforce lifecycle evidence

- [x] 2.1 Extend the autonomous SDD controller with versioned validated auth-context records and persistence transitions that retain only normalized evidence and conservatively reject legacy, stale, forged, or mismatched records.
  - Depends on: 1.2.
  - Evidence: controller tests prove durable pending/terminal records, no secret-shaped fields, exact-binding enforcement, resume behavior, and safe legacy pause.
- [x] 2.2 Require accepted current auth-context evidence at the bound GitHub issue helper boundary, retaining existing exact-title create-or-reuse behavior and failing closed before `gh` when evidence is absent or non-authorizing.
  - Depends on: 1.2, 2.1.
  - Evidence: GitHub intake tests prove accepted current-context invocation and no invocation for unknown, invalid, host-denied, stale, or mismatched evidence.
- [x] 2.3 Integrate the canonical diagnostic before autonomous GitHub lifecycle operations and record recovery paths without converting host preflight into authorization or an automatic host escalation.
  - Depends on: 2.1, 2.2.
  - Evidence: lifecycle/authorization fixtures prove restricted-host contrast, exact operation rebinding, runtime-denial pause, and unaffected non-GitHub paths.

## 3. Distribute canonical behavior and documentation

- [x] 3.1 Add a declared shared-runtime payload entrypoint and manifest registration for the diagnostic/binding operations; preserve validated wrapper and smoke behavior.
  - Depends on: 1.1, 1.2.
  - Evidence: runtime registry, build, closure, and smoke tests pass with the new helper declared exactly once.
- [x] 3.2 Update canonical autonomous-SDD lifecycle/delivery guidance and repository operation documentation with the non-secret preflight, exact retry boundary, fail-closed classes, and recovery behavior; retain thin Claude/Codex exposure.
  - Depends on: 2.3, 3.1.
  - Evidence: documentation and wrapper review confirms one canonical route, no copied policy, no product constants in reusable assets, and no credential workaround.
- [x] 3.3 Create linked OpenSpec tracking metadata and reconcile the managed GitHub issue/Project records through the configured idempotent lifecycle path.
  - Depends on: 2.3.
  - Evidence: `tracking.yaml` validates, issue #146 retains its managed linkage, and Project membership/status is observed with an exact recovery reference.

## 4. Verify evidence and delivery readiness

- [x] 4.1 Run focused diagnostic, controller, GitHub-intake, authorization, runtime, and canonical-asset checks; map every requirement and scenario to final-head evidence in `evidence/verification.md`.
  - Depends on: 2.3, 3.1, 3.2, 3.3.
  - Evidence: focused suites pass, requirements mapping is complete, and security, secret, attribution, portability, and recovery reviews record no unresolved objective finding.
- [x] 4.2 Run formal OpenSpec Verify, `openspec validate harden-github-cli-auth-context-detection --strict`, and `openspec validate --all --strict`; apply only evidence-backed behavior-preserving fixes and rerun affected checks plus fresh local review.
  - Depends on: 4.1.
  - Evidence: current Verify report, strict validation output, clean diff check, and a schema-valid same-session local-review record bound to the final head.
