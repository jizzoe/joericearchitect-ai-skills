## Context

See [proposal.md](proposal.md) for motivation and the captured design brief for
the owner decisions. M1-S1 now provides an admitted v2 parent/work-unit
boundary, but resolver, controller, lifecycle, review, and verification assets
still expose overlapping profile names, prerequisites, and result handling.
This slice must make one operation contract authoritative without altering the
separate M1-S1 persistence, claim, or history substrate.

## Goals / Non-Goals

**Goals:**

- create a portable canonical registry that resolves operation contracts and
  typed outcome dispositions deterministically;
- normalize profile, review, and topology policy into durable effective
  authorization before mutation;
- retain compact public lifecycle stages while giving internal operations and
  attempts precise evidence;
- migrate existing resolver, controller, review, and lifecycle assets into
  adapters over the new contract; and
- prove the policy with cross-assistant, profile, gate, outcome, and
  exact-head review-reuse fixtures.

**Non-Goals:**

- invoke a real Apply, review, GitHub, Sync, Archive, or cleanup adapter;
- replace M1-S1 durable record, history-provider, or claim-provider behavior;
- redesign isolated-review transport or configuration provenance (M1-S3);
- permit a model to choose a retry, profile downgrade, topology override, or
  human-decision outcome; or
- embed product-specific configuration or credentials in reusable assets.

## Decisions

### One data-defined operation registry

Create one assistant-neutral policy module whose entries are immutable data and
whose evaluator returns a normalized operation result. An entry owns its name,
stage, target/record kinds, profile eligibility, gate set, evidence schema,
attempt/write-ahead rule, adapter class, and allowed dispositions. Existing
skills and runtime entrypoints call this evaluator; they do not reimplement
profile or outcome policy.

This is preferred to per-skill policy, which creates competing authorities, and
to an error-code-only registry, which cannot prove that an operation was valid
before its error is routed.

### Compact lifecycle stages, detailed internal attempts

Retain the public stages `admitted`, `planned`, `evidence-ready`, `applied`,
`reviewed`, `verified`, `closing`, and `complete`. Map helpers such as intake,
review dispatch, validation, PR creation, Sync, and cleanup to typed internal
operations with immutable attempt records. Each attempt includes the registry
operation ID, selected entry, exact target, gate-result digest, idempotency
key, outcome, evidence reference, and disposition.

This avoids a broad user-facing transition graph while preserving enough
information for deterministic recovery. Free-form skill-name routing is
rejected because it makes equivalent run state depend on caller location.

### Normalize policy before admission and bind it to effective authorization

Extend request normalization with canonical `reviewPolicy` and `agentPolicy`.
The legacy independent-review field is projected only for its two strict
compatible values. Profile defaults are part of normalization, not adapter
defaults. `auto` topology receives a deterministic classifier over declared
change characteristics and risk signals; missing, ambiguous, or risk-elevating
signals resolve conservatively to separated contexts. An explicit topology
records its source and skips classification. The chosen policy and classifier
inputs/results feed the effective-authorization digest.

This is preferred to accepting both review fields as authorities or allowing an
LLM to classify triviality. It prevents an after-admission context choice from
weakening policy or becoming unreproducible.

### Gates are independent predicates with a fixed evaluation order

Evaluate, in deterministic order: normalized request/profile compatibility,
authorization and expiry, operation/stage/target match, durable admission and
claim state, prerequisite evidence freshness, Apply eligibility, review
readiness, adapter capability, and runtime permission. Return the first failed
gate along with a safe resume classification. `deliveryAuthorization` proves
that a transition is within the grant; `applyEligibility` proves its
post-planning readiness and is never derived from authorization alone.

The required strict-review path is assessed before Apply. A degraded path is
eligible only when its exact prior authorization and recovery evidence are
already current. Local prototype review is deliberately not a substitute.

### One-to-one disposition table and exact review-reuse predicate

Define an exhaustive outcome table validated at module load and by fixtures.
Only registered objective outcomes can enter bounded correction; all unknown or
ambiguous outcomes become a retained pause. Define a review-reuse validator
that compares the sealed package digest, reviewed head/tree, artifact manifest,
Apply evidence, accepted dispositions, and policy gate digest. Closeout still
re-evaluates its own exact external state and authorization.

This is preferred to retrying based on text or reusing any review from a commit,
both of which permit hidden policy drift.

### Reuse and exposure plan

The canonical registry, normalizer, evaluator, fixtures, and schemas live under
the assistant-neutral SDD/runtime area. Base skills reference those canonical
assets. Claude and Codex wrappers remain generated thin delegates. Repository,
Project, branch, credential, runtime-permission, and adapter facts enter via
validated request/configuration inputs. A second-product fixture uses different
repository identity and adapter facts to prove no product value is embedded.

No third-party source code or dependency is introduced; attribution and license
impact are therefore unchanged.

## Risks / Trade-offs

- [Registry omits an existing operation] → enumerate current operation names,
  add a fixture requiring exactly one entry/disposition, and pause unknowns.
- [Compatibility projection accepts an unsafe review policy] → table-test every
  canonical/legacy pair and reject contradictory or local-under-legacy inputs.
- [Topology classifier silently lowers assurance] → bind its input/result to
  authorization, default uncertainty to separated contexts, and test that
  topology never changes a required gate.
- [Review reuse becomes stale] → validate every review-relevant binding and
  require fresh review on any difference.
- [Adapter migration leaves duplicate policy] → enforce thin-adapter tests and
  migrate one caller category at a time behind the canonical evaluator.

## Migration Plan

1. Introduce the registry, normalizer, gate evaluator, disposition validator,
   and portable fixtures without changing existing caller behavior.
2. Add compatibility projection and migrate resolver/admission to persist the
   effective authorization before selection.
3. Migrate controller, lifecycle, review, and bounded-execution adapters to
   consult the registry; delete only duplicate policy proven redundant by tests.
4. Exercise prototype and production fixture matrices, exact-head reuse
   invalidation, unknown outcome pauses, and cross-assistant parity.
5. Roll back a failed migration by retaining the durable admission evidence,
   disabling the affected registry adapter entry, and pausing rather than
   falling back to per-skill routing. Do not rewrite history or alter existing
   claims during rollback.

## Open Questions

None. The selected design brief records the owner decisions that determine this
slice's observable contract; exact internal operation identifiers can be chosen
during implementation provided they preserve the specified behavior.
