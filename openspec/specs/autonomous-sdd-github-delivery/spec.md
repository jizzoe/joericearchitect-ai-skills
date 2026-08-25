# autonomous-sdd-github-delivery Specification

## Purpose
Makes GitHub intake and implementation delivery one idempotent, recoverable
transition chain. Exact issue, Project, branch, PR, check, merge, closure, and
status operations converge without duplicate or unrelated mutation through a
credential-isolated host-operation envelope and a non-secret result receipt.
## Requirements
### Requirement: Envelope is non-secret and authorization-bound
The credential-isolated controller SHALL emit one non-secret, authorization-bound
host-operation envelope carrying the exact operation, repository, target
identities, immutable payload and precondition digests, idempotency key,
ownership scope, and expiry. The envelope SHALL NOT contain credentials, tokens,
or raw command output.

#### Scenario: Envelope carries no credential
- **WHEN** a host-operation envelope is created
- **THEN** it contains the operation, repository, targets, digests, idempotency
  key, ownership scope, and expiry, and no credential or secret field

#### Scenario: Expired envelope is rejected
- **WHEN** an envelope is evaluated after its expiry
- **THEN** the controller rejects it and performs no host execution

### Requirement: Result receipt matches the envelope exactly
The authenticated host SHALL return a non-secret result receipt that the
controller validates against the envelope digest, operation, repository, and
target identities. An ambiguous, mismatched, or stale receipt SHALL NOT advance
the controller.

#### Scenario: Mismatched receipt is rejected
- **WHEN** a receipt's operation, repository, targets, or envelope digest differs
  from the envelope
- **THEN** the controller rejects the receipt and does not advance

### Requirement: Controller revalidates before advancing
The controller SHALL revalidate the receipt and live target state before each
advance. An unobservable or conflicting remote outcome SHALL become `in-doubt`
and pause instead of blindly repeating the write.

#### Scenario: Unobservable outcome pauses in-doubt
- **WHEN** a remote write's outcome cannot be confirmed against live state
- **THEN** the controller pauses `in-doubt` and does not repeat or infer success

### Requirement: Exact adapters converge without duplicate or unrelated mutation
Issue create/reuse, Project binding/status, topic branch, PR create/update,
exact-head check, merge, issue closure, and delivery status SHALL be exact,
idempotent adapters. Rerunning with the same idempotency key and precondition
SHALL NOT create a duplicate or mutate an unrelated target.

#### Scenario: Duplicate issue is reused
- **WHEN** create-or-reuse runs for an issue title that already exists
- **THEN** the adapter reuses the existing issue and creates no duplicate

#### Scenario: Wrong target is rejected
- **WHEN** an adapter is pointed at the wrong repository, issue, Project, branch,
  PR, head, or ownership
- **THEN** the adapter rejects the request without mutation

### Requirement: Ownership scope preserves human fields
Each adapter SHALL write only its declared ownership scope (managed fields) and
SHALL NOT overwrite human-owned issue/PR text or unrelated repository settings.

#### Scenario: Managed block update preserves human content
- **WHEN** an issue body update runs
- **THEN** only the delimited managed block and managed labels change, and all
  human-authored content outside the block remains unchanged

### Requirement: Merge preflight and branch retention
Before any merge whose authorization requires remote branch retention, the system
SHALL preflight the repository merge strategy and automatic topic-branch deletion
policy. After merge, if repository policy removed the branch, the system SHALL
restore only the exact clean reviewed head, without force, and record a
branch-retention receipt. Unauthorized deletion, force-push, divergent heads, and
unreviewed refs SHALL remain blocked.

#### Scenario: Auto-deleted branch is restored exactly
- **WHEN** repository policy deletes the merged topic branch and retention is
  required
- **THEN** only the exact clean reviewed head is restored, without force, and a
  retention receipt is recorded

#### Scenario: Force-push is never used
- **WHEN** a retention or restoration plan runs
- **THEN** no force-push or divergent ref is created

### Requirement: Remote-success/local-receipt-loss converges
Every mutation SHALL converge through observe-before-retry reconciliation: after
a crash between remote success and local receipt persistence, the controller SHALL
reconcile from authoritative external state without a duplicate, or pause
`in-doubt` when observation cannot prove the result.

#### Scenario: Receipt loss after remote success does not duplicate
- **WHEN** remote success occurs but the local receipt is lost
- **THEN** reconciliation observes the existing remote result and records it
  without creating a duplicate

