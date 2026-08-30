## Context

See `proposal.md` for motivation. The existing controller-first initializer
persists a deterministic schema-5 `pending` checkpoint before v2 admission and
internally excludes only that exact checkpoint during the admission attempt.
Existing terminal compatibility requires an admitted archive, while existing
cancellation/retirement requires an active v2 claim. An expired checkpoint from
a pre-admission stop satisfies neither path.

The repair crosses controller validation, legacy inventory, local immutable
state, installed runtime dispatch, and canonical lifecycle documentation. The
checkpoint is audit evidence in Git-common state and must remain unchanged.

## Goals / Non-Goals

**Goals:**

- Establish a least-privilege recovery transition for one exact expired,
  never-admitted, non-progressed controller.
- Make the recovery idempotent and independently auditable without converting
  absence into fabricated cancellation or terminalization evidence.
- Preserve fail-closed behavior for every uncertain or differently shaped
  controller.

**Non-Goals:**

- Replacing admitted-run cancellation, early retirement, or archive-backed
  schema-5 reconciliation.
- Deleting, moving, editing, or automatically expiring controller checkpoints.
- Treating a receipt as claim, delivery, completion, or future mutation
  authority.

## Decisions

### Publish a distinct pending-controller retirement receipt

Create a separate immutable `pending-controller-retirement-receipt` rather than
overloading cancellation receipts or archive-backed legacy reconciliation. Its
schema binds the exact checkpoint reference and byte digest; controller,
authorization, repository, selected-entry, and derived v2 identities; provider
binding; owner authorization scope; absence-evidence digest; and publication
time. It explicitly records `v2Authority: false`, `nativeClaim: false`, and
`legacyMutation: false`.

Alternative: extend schema-2 `legacy-reconciliation-receipt`. Rejected because
that schema truthfully asserts an archived terminalization/cancellation evidence
kind, which does not exist for a never-admitted initializer.

### Prove a narrow pending baseline and authoritative absence

The transition accepts only a schema-5 controller with deterministic run and
checkpoint identities, `v2Admission.state: pending`, expired controller
deadline, `currentPhase: propose`, every lifecycle step pending, and empty
resource, issue-intake, auth-context, cleanup, and completed-entry collections.
The request must bind every controller and v2 identity plus the checkpoint's
exact bytes.

Using the canonical remote-derived repository ID and configured local state
layout, the transition rejects a matching active parent directory, any contained
date-partitioned archive for the parent, or unreadable/ambiguous state. It also
checks the repository status projection for a conflicting matching parent. The
absence proof is digested into the receipt; no empty v2 bundle is created.

Alternative: delete or quarantine the checkpoint after checking that the active
directory is absent. Rejected because it destroys or relocates the only durable
record and bypasses inventory's audit trail.

### Extend inventory with exact receipt validation, not an exclusion

Inventory may reclassify only a schema-5 ambiguous entry whose exact content and
identity match a validated pending-controller retirement receipt. The receipt
is discovered from the configured repository reconciliation directory, never
supplied as a caller-selected path exclusion. Unknown future schemas and all
other pending controllers remain ambiguous.

Alternative: allow a new initializer to exclude prior pending checkpoints for
the same selected entry. Rejected because selection equality does not prove
ownership, expiration, or absence of a v2 claim.

### Expose one installed runtime verb

Add `retire-expired-pending-controller` to the manifest-declared
`autonomous-sdd-controller` helper. The runtime wrapper supplies the explicit
target repository path and delegates to canonical code. The canonical lifecycle
skill documents the exact recovery boundary; Claude and Codex wrappers remain
thin and require no duplicated policy.

## Risks / Trade-offs

- [A false absence proof could retire real authority] → require contained
  canonical state paths, reject unreadable or duplicate archives, bind all
  derived identities, and test active/archive/projection conflicts.
- [A forged receipt could weaken inventory] → exact schema, deterministic
  receipt ID, path/content digest, controller identity, and non-authority fields
  are validated before classification.
- [State could appear after receipt publication] → the original controller is
  already expired and never admitted; ordinary v2 active-run inspection still
  independently blocks any later conflicting active claim.
- [More durable receipt types add complexity] → keep the new type isolated and
  reuse the existing contained reconciliation directory and atomic immutable
  publisher pattern.

## Migration Plan

1. Deliver and install the repaired runtime before attempting retirement.
2. Submit a fresh exact owner authorization for each expired pending checkpoint.
3. Publish and verify its immutable receipt and unchanged checkpoint digest.
4. Retry initialization normally; do not delete historical checkpoints.

Rollback deactivates the repaired runtime and code. Existing receipts remain
non-authoritative audit evidence; older runtimes ignore their distinct kind and
therefore fail closed.

## Verification Strategy

- Focused unit tests for exact validation, expiry, idempotency, byte
  preservation, active/archive/projection conflicts, malformed and mismatched
  requests, and forged receipts.
- Installed-wrapper integration test with a real Git-common controller root:
  first admission pauses on the old checkpoint, the declared transition
  publishes a receipt, and exact retry admits while excluding only its own new
  pending checkpoint.
- Runtime manifest/completeness tests, full Node regression suite, strict
  OpenSpec validation, local code/security review, exact-head CI, and strict
  independent review.

## Reuse Plan

- Canonical logic lives in assistant-neutral `scripts/sdd` and `skills/base`.
- Product configuration supplies repository/state identity and authorization;
  no repository, path, account, Project, or credential constant enters reusable
  assets.
- Claude and Codex use the same manifest verb through thin exposures.
- A synthetic second repository with a different remote, readable name, Git
  common directory, and state root must pass the same transition tests.
- Product-specific issue and campaign evidence remain outside reusable assets.

## Security, Attribution, and Licensing

Checkpoint/request content is untrusted structured input: exact schemas,
contained regular files, and digest bindings are required. No credential or
sensitive environment value is accepted or persisted. The transition performs
no external mutation and no destructive filesystem action. No third-party code,
dependency, or copied asset is introduced; attribution is not applicable.
