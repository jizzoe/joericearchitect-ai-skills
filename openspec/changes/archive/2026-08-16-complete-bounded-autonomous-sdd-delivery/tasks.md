## 1. Delivery Controller and Intake

- [x] 1.1 Add deterministic `ship-sdd` parsing, fixed profile aliases, duration override, and normalized authorization output with resolver tests.
- [x] 1.2 Define and validate the versioned selected-entry controller record, authorization digest, context reference, expiry, and first-incomplete-phase calculation with synthetic fixtures.
- [x] 1.3 Implement the canonical autonomous SDD controller and its pause/recovery results for incomplete, expired, stale, forged, and conflicting state. Depends on 1.1, 1.2.

## 2. Phase Routing and Bounded Preparation

- [x] 2.1 Update canonical lifecycle guidance and repository-owned phase integration boundaries to validate controller context and preserve standalone phase-local completion. Depends on 1.3.
- [x] 2.2 Extend design-brief authorization for one selected-entry path and add positive and rejection coverage. Depends on 1.2.
- [x] 2.3 Add phase-entry end-to-end fixtures proving every authorized resume advances through the first incomplete checkpoint or produces a classified pause. Depends on 2.1.

## 3. Exact Delivery and Cleanup

- [x] 3.1 Extend checkpoint and operation authorization validation for controller records, exact transition linkage, current evidence, and cleanup records. Depends on 1.2.
- [x] 3.2 Implement a deterministic cleanup inventory planner for exact owned worktrees and branches, with audit, apply, and resume modes. Depends on 3.1.
- [x] 3.3 Implement guarded cleanup execution and fixtures for normal merge, squash/rebase evidence, dirty/locked/primary/legacy resources, partial recovery, and remote-branch protection. Depends on 3.2.

## 4. Canonical Exposure and Documentation

- [x] 4.1 Add canonical assistant-neutral controller and cleanup skills with progressive references and product-neutral guardrails. Depends on 1.3, 3.3.
- [x] 4.2 Add or refresh thin Claude and Codex exposure and drift/portability coverage without modifying generated OpenSpec skills. Depends on 4.1.
- [x] 4.3 Update lifecycle, operations, and bootstrap documentation with request form, standalone boundary, evidence, recovery, and cleanup behavior. Depends on 2.1, 3.3, 4.2.

## 5. Evidence and Delivery Readiness

- [x] 5.1 Run focused unit, fixture, portability, security/secret, attribution, and recovery checks; correct objective failures within the bounded correction policy. Depends on 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 4.1, 4.2, 4.3.
- [ ] 5.2 Run formal OpenSpec Verify, strict all-change validation, requirements-to-evidence mapping, and current-head strict independent review before delivery. Depends on 5.1.
- [ ] 5.3 Deliver implementation, synchronize living specs, archive content-preservingly, and run exact owned-resource finalization only after each external gate and runtime permission passes. Depends on 5.2.
