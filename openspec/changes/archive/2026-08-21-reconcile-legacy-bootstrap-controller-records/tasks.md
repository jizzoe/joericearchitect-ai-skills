## 1. Reconciliation contract and durable receipt

- [x] 1.1 Inventory the legacy decoder, inventory classifier, v2 state
  substrate, and controller/runtime entrypoints; define a portable,
  credential-free exact reconciliation request and immutable sidecar receipt
  schema. Evidence: schema and negative-input fixtures cover identity, digest,
  authorization scope, expiry, evidence, and idempotency.
- [x] 1.2 Implement canonical receipt publication and lookup outside legacy
  records, with deterministic idempotency and byte-for-byte legacy-record
  preservation. Evidence: valid, duplicate, interrupted, and attempted-write
  fixtures prove no legacy mutation, deletion, v2 run, or claim. Depends on:
  1.1.

## 2. Evidence predicate and admission projection

- [x] 2.1 Implement the closed read-only reconciliation predicate for exact
  selected change/repository binding, current closed issue, merged
  implementation/Sync/Archive deliveries, and terminal receipts for every
  registered resource. Evidence: each missing, stale, mismatched, or ambiguous
  condition yields a retained non-mutating pause. Depends on: 1.1.
- [x] 2.2 Extend legacy inventory and v2 admission to recognize only a valid
  receipt for its exact record as compatible terminal; retain active/ambiguous
  fail-closed behavior everywhere else. Evidence: admission fixtures prove no
  parent run, work unit, or claim exists before reconciliation and normal v2
  checks still run afterward. Depends on: 1.2, 2.1.

## 3. Controller exposure and portability

- [x] 3.1 Expose a distinct canonical controller/runtime reconciliation
  checkpoint and adapt lifecycle guidance and thin Claude/Codex delegates
  without creating wrapper-owned behavior. Evidence: equivalent cross-assistant
  fixtures return the same receipt or pause classification. Depends on: 2.2.
- [x] 3.2 Add a second-product configured fixture and secret/constant guards
  proving record, repository, issue, PR, branch, and cleanup identifiers are
  caller-provided rather than embedded in reusable code. Evidence: portability
  and no-secret checks pass. Depends on: 3.1.

## 4. Verification and bounded bootstrap use

- [x] 4.1 Run focused reconciliation, legacy inventory, v2 admission,
  controller/runtime, and cross-assistant tests; map every requirement and
  recovery path to current evidence. Depends on: 2.2, 3.2.
- [x] 4.2 Run local code/security review, attribution and dependency review,
  `openspec validate reconcile-legacy-bootstrap-controller-records --strict`,
  `openspec validate --all --strict`, and formal OpenSpec Verify; correct
  objective findings within the approved budget. Evidence: checks and review
  results are bound to the final head. Depends on: 4.1.

The first real bootstrap reconciliation is a post-delivery operational
checkpoint: it runs only after the implementation PR is merged and the
released runtime is installed. It is not an Apply prerequisite for this change,
because that would require the unreleased runtime to execute before its own
delivery gate can pass.
