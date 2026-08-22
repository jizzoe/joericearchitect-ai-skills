## 1. Terminal-controller evidence model

- [x] 1.1 Add a read-only verifier that derives one prior schema-5 controller's terminal compatibility from the configured contained v2 archive and validates every required domain record, digest, and mutual identity. Depends on: none. Evidence: focused admission tests and implementation verification report.
- [x] 1.2 Feed only internally verified exact controller-reference and byte-digest bindings into legacy inventory while preserving ambiguous classification for every unmatched schema-5 controller. Depends on: 1.1. Evidence: focused legacy inventory and initializer tests.

## 2. Focused and critical-flow coverage

- [x] 2.1 Add focused tests for valid terminal evidence and missing, malformed, active, pending, symlinked, duplicated, repository, change, authorization, provider, identity, and digest mismatch cases. Depends on: 1.2. Evidence: 40/40 focused admission/controller tests.
- [x] 2.2 Add an installed-wrapper integration test using real Git-common controller state and a real local v2 archive layout, including successful admission, identity-stable retry, byte-preservation checks, and an unmatched-sibling pause. Depends on: 2.1. Evidence: staged launcher critical-flow test passes.

## 3. Verification and delivery evidence

- [x] 3.1 Run focused tests, the full Node suite, tracking validation, requirements mapping, security/recovery/portability/attribution review, and `openspec validate --all --strict`. Depends on: 2.2. Evidence: change-local verification and requirements-mapping reports.
- [x] 3.2 Produce current same-session read-only local-review and formal OpenSpec Verify evidence with no unresolved objective findings. Depends on: 3.1. Evidence: current local-code-review and openspec-verify reports.
- [ ] 3.3 Deliver the exact implementation, Sync, and content-preserving Archive checkpoints; reconcile issue #193 and its configured Project item; retain remote branches; and record exact local cleanup evidence. Depends on: 3.2. Evidence: merged PRs, GitHub lifecycle, and exact cleanup receipt.
- [ ] 3.4 Build and install only the runtime from the final merged default-branch head, verify installed-wrapper behavior and no global-skill mutation, then resume the exact pending planning controller if its authorization remains current. Depends on: 3.3. Evidence: runtime-only activation receipt and resumed-controller identity evidence.
