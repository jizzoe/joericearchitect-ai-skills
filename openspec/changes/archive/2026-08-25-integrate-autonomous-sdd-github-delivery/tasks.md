## 1. Host-operation envelope and result receipt

- [x] 1.1 Create `scripts/sdd/autonomous-sdd-github-envelope.mjs` with `createHostOperationEnvelope`, `validateHostOperationEnvelope`, and a canonical envelope digest
- [x] 1.2 Implement `createHostResultReceipt` and `validateHostResultReceipt` (match envelope digest, operation, repository, and target identities; reject ambiguous or mismatched receipts)
- [x] 1.3 Implement `revalidateControllerAdvance` (receipt + live target state -> `advance` | `reconcile` | `in-doubt` | `paused`)

## 2. Exact intake and delivery adapters

- [x] 2.1 Create `scripts/sdd/autonomous-sdd-github-transitions.mjs` with the field-level ownership scopes (`issueOwnershipScope`, `prOwnershipScope`, `projectOwnershipScope`)
- [x] 2.2 Implement exact adapter plans for issue create/reuse, Project binding/status, topic branch, PR create/update, exact-head check, merge, issue close, and delivery status
- [x] 2.3 Implement observe-before-retry reconciliation (live state -> `noop` | `apply` | `conflict` with idempotency key and precondition digest)

## 3. Merge policy and branch retention

- [x] 3.1 Create `scripts/sdd/autonomous-sdd-github-merge-policy.mjs` with `preflightMergePolicy` (merge strategy + auto topic-branch deletion)
- [x] 3.2 Implement `planBranchRetentionRestoration` (restore only the exact clean reviewed head, no force) and `validateBranchRetentionReceipt`

## 4. Tests

- [x] 4.1 Add focused tests: envelope/receipt validation, advance revalidation, ownership-scope preservation, idempotent reuse, observe-before-retry convergence, merge-policy preflight, branch-retention restoration, wrong-target rejection, and credential-free history
- [x] 4.2 Add restricted-to-host and auto-delete fixture coverage per the M4-S1 acceptance evidence

## 5. Verification

- [x] 5.1 Run the focused test files and the full `scripts/sdd/test` and `scripts/github/test` suites
- [x] 5.2 Run `openspec validate --all --strict` and confirm the new delta validates
