## 1. Shared standards and context contract

- [x] 1.1 Define the canonical standards-pack selection, precedence,
  classification, conflict, and handoff reference.
  - Depends on: approved proposal/specs/design.
  - Evidence: reference defines required, recommended,
    repository-selected, and not-applicable outcomes without product constants.
- [x] 1.2 Define the canonical progressive context-management policy and link
  it from the affected quality entrypoints.
  - Depends on: 1.1.
  - Evidence: policy supports compact identifier handoff and no copied catalog.

## 2. Deterministic validation and consumer integration

- [x] 2.1 Implement portable selection-record validation and a CLI entrypoint.
  - Depends on: 1.1.
  - Evidence: invalid scope, path, secret-like value, conflict, and unknown
    field outcomes fail deterministically.
- [x] 2.2 Update `base-code-review` to consume a valid standards selection for
  claimed stack coverage and expose selected rules or a gap.
  - Depends on: 1.1, 1.2, 2.1.
  - Evidence: canonical instructions/references retain read-only boundaries and
    existing thin adapter parity.
- [x] 2.3 Update `base-verification-loop` to map selection records only to
  repository-declared evidence and expose missing evidence as a gap.
  - Depends on: 1.1, 1.2, 2.1.
  - Evidence: no new command authority or production-gate weakening.
- [x] 2.4 Add concise README discovery text linking to the canonical policy.
  - Depends on: 1.2.
  - Evidence: README does not duplicate standards or context policy.

## 3. Evaluation, review, and verification

- [x] 3.1 Add synthetic fixture coverage for precedence, override, exclusion,
  portability, unsafe records, and cross-stage handoff.
  - Depends on: 2.1, 2.2, 2.3.
  - Evidence: focused Node tests pass with a second-workspace fixture.
- [x] 3.2 Run requirements mapping, documentation, security/secret,
  portability, attribution, recovery, adapter-drift, and focused test review.
  - Depends on: 3.1.
  - Evidence: written evidence maps every task/spec/design decision and
    documents no third-party dependency or product constants.
- [ ] 3.3 Complete formal OpenSpec Verify and current-head strict independent
  review before delivery.
  - Depends on: 3.2.
  - Evidence: current validation, exact-head CI evidence where configured,
    independently generated strict review record, and `openspec validate --all
    --strict` pass.
- [ ] 3.4 Deliver, Sync, Archive, reconcile issue/Project state, and remove
  only exact clean change-owned branches/worktrees.
  - Depends on: 3.3.
  - Evidence: merged implementation, Sync, and Archive records; closed issue;
    Project Done state; and cleanup report for only recorded resources.
