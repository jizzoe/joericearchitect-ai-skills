## 1. Derived Target Contract

- [x] 1.1 Define portable queue-entry, derived-record, and evidence-linkage
  validation in the authorization checker.  
  Depends on: approved proposal, delta specs, and design.  
  Evidence: valid and invalid synthetic delivery-chain inputs have deterministic
  authorization outcomes.
- [x] 1.2 Preserve exact-target authorization and existing profile/runtime/
  adapter/high-impact gates for callers without a derived-target declaration.  
  Depends on: 1.1.  
  Evidence: regression fixtures cover exact and derived requests.
- [x] 1.3 Add explicit public-source rule checks without allowing sign-in,
  private access, downloaded-code execution, or unauthorized local writes.  
  Depends on: 1.1.  
  Evidence: source-read allow and deny fixtures pass.

## 2. Durable Checkpointing

- [x] 2.1 Extend checkpoint inspection for selected queue-entry identity,
  derived records, evidence freshness, and durable-state conflicts.  
  Depends on: 1.1.  
  Evidence: checkpoint fixtures identify the first incomplete/stale step and
  stop on a conflict.
- [x] 2.2 Update the canonical autonomous runner and authorization reference
  with the derived-target lifecycle, recovery, and portability boundaries.  
  Depends on: 2.1.  
  Evidence: documentation matches the evaluator behavior without product
  constants or credential material.

## 3. Evaluation and Acceptance

- [x] 3.1 Add a focused Node test suite for derived targets, source-read
  boundaries, exact-target regression, expiry, evidence/head mismatch, and
  checkpoint resume/conflict behavior.  
  Depends on: 1.2, 1.3, 2.1.  
  Evidence: focused suite passes.
- [x] 3.2 Run comprehensive end-of-Apply review of the accumulated diff for
  requirements, security, portability, attribution, documentation, and
  recovery; correct only bounded objective findings.  
  Depends on: 2.2, 3.1.  
  Evidence: review record has no blocker or high objective-fix finding.
- [x] 3.3 Run final focused tests, repository validators, strict OpenSpec
  validation, secret/supply-chain review, and formal Verify preparation.  
  Depends on: 3.2.  
  Evidence: current command output and requirements mapping are recorded.
