# Design — GitHub Intake and Implementation Delivery

## Overview

M4-S1 unifies GitHub intake and implementation delivery into one idempotent,
recoverable transition chain, built on the existing `gh` execution boundary
(`scripts/github/lib/gh.mjs`), the `github-cli-auth-context` probe, and the
`issue-intake-binding` payload binding. It adds three focused, pure modules so
the whole chain is testable against disposable fixtures and deterministic
synthetic adapters.

## Module: autonomous-sdd-github-envelope.mjs

The credential-isolation boundary. The (credential-isolated) controller emits one
non-secret envelope; the authenticated host executes only that envelope; the
controller revalidates the returned receipt plus live target state before
advancing.

- `createHostOperationEnvelope({ operation, repository, targetIdentities,
  payloadDigest, preconditionDigest, idempotencyKey, ownershipScope, expiresAt })`
  -> a canonical envelope carrying a single `envelopeDigest` (sha256 over the
  canonical fields). No credential field exists.
- `validateHostOperationEnvelope(envelope)` -> schema/expiry/digest validation;
  rejects unknown operations, malformed repositories/targets, expired envelopes,
  or a mismatched envelope digest.
- `createHostResultReceipt({ envelopeDigest, operation, repository,
  targetIdentities, outcome, observedAt })` -> a non-secret receipt with its own
  digest and the envelope digest it answers.
- `validateHostResultReceipt(receipt, envelope)` -> matches envelope digest,
  operation, repository, and target identities; rejects ambiguous, mismatched,
  or stale receipts.
- `revalidateControllerAdvance({ receipt, envelope, liveState, now })` -> one
  typed decision: `advance` (receipt and live state agree), `reconcile`
  (observe-before-retry required), `in-doubt` (unobservable or conflicting
  remote outcome), or `paused` (expired/mismatched/denied).

## Module: autonomous-sdd-github-transitions.mjs

The exact adapters and the field-level ownership map (Q2). Each adapter exposes
a `plan` (observe current state -> typed plan with stable identity,
target/precondition digest, capability, ownership scope, and idempotency key) and
a `reconcile` (observe-before-retry: live state -> `noop` | `apply` |
`conflict`).

- Ownership scopes: `issueOwnershipScope` (exact title, managed block between
  `managedIssueBlockMarkers`, managed labels), `prOwnershipScope` (derived
  title/body, topic branch, status mapping), `projectOwnershipScope` (the single
  configured `statusField` and item add/remove). Human-owned fields are never
  written.
- Adapters: `issueCreateOrReuse`, `projectItemAddOrReuse`,
  `projectSetStatus`, `topicBranchCreate`, `prCreateOrUpdate`,
  `exactHeadCheck`, `merge`, `issueClose`, `deliveryStatus`. Each returns
  deterministic plans and validates ownership scope before any write; wrong
  repository, issue, Project, branch, PR, head, or ownership is rejected.

## Module: autonomous-sdd-github-merge-policy.mjs

Merge preflight and branch retention.

- `preflightMergePolicy({ observedMergeStrategy, autoDeleteHeadBranches,
  authorization })` -> selects the merge approach and whether remote branch
  retention is required by the authorization.
- `planBranchRetentionRestoration({ expectedHead, observedRef })` -> when
  repository policy removed the merged topic branch, plan to restore only that
  exact clean reviewed head, without force, and never infer another ref.
- `validateBranchRetentionReceipt(receipt, { expectedHead, restored })` ->
  records a retention receipt binding the restored ref to the exact reviewed
  head.

## Credential isolation

No credential crosses into controller history. The controller records only
non-secret envelopes, receipts, and normalized probe evidence. The authenticated
host retrieves the selected keychain entry (`selectedEntry`) and passes it as
`GH_TOKEN` for the single `gh` subprocess; raw CLI output and secret-bearing
diagnostics are never persisted.

## Integration

- Consumes `ghCommand` (array boundary) and the existing issue/project/PR helpers
  for observed-state reads.
- Builds on `github-cli-auth-context` binding (operation, repository,
  optional payload digest, expiry) and `issue-intake-binding` payload binding.
- Does not change the not-activated v2 controller.

## Non-goals

Credential changes, branch-protection changes, releases, deployments, Sync,
Archive, and broad content ownership remain unchanged.
