## Context

See [proposal.md](proposal.md) for the delivery interruption that produced two
legacy records. The v2 cutover intentionally classifies legacy data as
read-only audit evidence and rejects admission while it appears active. That
fail-closed behavior is correct; the missing capability is a bounded way to
record independently proven terminal history without altering an old record.

## Goals / Non-Goals

**Goals:**

- Publish a separate, immutable terminal-reconciliation receipt only after
  exact evidence converges for an owner-authorized legacy bootstrap record.
- Let legacy inventory consume that receipt deterministically without creating
  a second operational authority.
- Preserve complete auditability, idempotent recovery, and cross-assistant
  behavior.

**Non-Goals:**

- Edit, remove, migrate, or resume a legacy controller record.
- Create a v2 run, work unit, claim, lifecycle attempt, or GitHub mutation
  during reconciliation.
- Generalize this into automatic stale-record cleanup, timeout reclamation, or
  a bypass for ambiguous legacy state.

## Decisions

### Receipts are append-only sidecar evidence, never legacy rewrites

Store reconciliation receipts in the v2 repository-scoped state substrate,
keyed by an exact digest of the legacy record and its credential-free
repository identity. The receipt includes its own immutable identity,
owner-authorized scope digest and expiry, verified evidence digests, observed
time, terminal classification, and recovery reference. It excludes secrets,
raw GitHub output, and mutable local path authority.

This preserves the M1-S1 cutover rule: legacy data remains untouched and no
legacy controller becomes a v2 record. Deleting the redundant closeout record
is rejected because deletion would erase the evidence used to explain why it
was retired.

### Reconciliation has a closed verification predicate

The canonical evaluator receives a constrained reconciliation request and
read-only evidence observations. It validates: exact legacy identity/digest,
authorized selected change and repository, non-expired owner scope, closed
matching issue, merged exact implementation/Sync/Archive delivery bindings,
and terminal cleanup receipts for every legacy-owned resource. It records the
first failed predicate as a retained pause; no inferred branch, PR, issue, or
cleanup target is permitted.

This is preferred to treating current default-branch ancestry or a pending
legacy phase as completion. The historical record proves ownership; current
external observations prove delivery is still true.

### Inventory projects receipts into compatibility only

Legacy classification remains `active-legacy` by default. Inventory changes it
to a terminal-compatible classification only when a valid immutable receipt
matches the specific legacy record. Admission still performs all normal v2
identity, history, provider, expiry, and native-claim checks after inventory;
the receipt has no admission or lifecycle authority of its own.

This is narrower than a generic migration flag and keeps a stale or forged
receipt from weakening v2 admission.

### Explicit bootstrap bindings stay configured, not reusable constants

The initial delivery request will name the two known record paths, their
digests, the selected M1-S1 change, and expected lifecycle evidence. Canonical
code validates generic structured inputs and consumes an explicit
owner-authorized binding; it will not embed repository, branch, issue, PR, or
record values. A second-product fixture proves differing configured values
behave identically.

## Risks / Trade-offs

- [A stale receipt masks new ambiguity] → bind record/evidence digests and
  revalidate current delivery evidence before classifying it terminal.
- [A receipt becomes a second authority] → limit it to legacy inventory
  classification; exclude it from v2 run, claim, and lifecycle schemas.
- [Evidence capture exposes credentials or untrusted content] → retain only
  normalized identifiers, digests, states, and references; never execute
  external text.
- [Interrupted publication duplicates a receipt] → use a deterministic
  idempotency key and immutable lookup before publication.

## Migration Plan

1. Add receipt schema, canonical evaluator, read-only evidence validator, and
   inventory projection with no default behavior change.
2. Add isolated fixtures for valid, missing, stale, mismatched, duplicate, and
   cross-assistant reconciliation outcomes.
3. Expose the constrained controller/runtime checkpoint and keep legacy write
   denial in force.
4. Run a separately authorized bootstrap reconciliation against only the two
   recorded identities; then admit the next v2 delivery normally.
5. Roll back a failed deployment by retaining every receipt and legacy record,
   disabling receipt consumption, and pausing admission. Never delete or
   rewrite legacy audit evidence.

## Reuse Plan

Canonical receipt validation, evidence predicates, inventory projection, and
controller entrypoint live in assistant-neutral runtime assets. Product-owned
delivery authorization supplies exact record identities, repository, issue,
PR, branch, and cleanup observations. Claude and Codex remain thin delegates.
Fixtures use a second configured repository to prove that product constants,
credentials, and local paths are not embedded in reusable assets.
