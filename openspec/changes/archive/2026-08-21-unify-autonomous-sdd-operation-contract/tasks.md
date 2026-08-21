## 1. Canonical operation-contract foundation

- [x] 1.1 Inventory current autonomous SDD operation names, profile fields,
  gate predicates, and outcome classifications; define the canonical portable
  registry schema, compact stages, target/record kinds, and disposition set.
- [x] 1.2 Implement registry validation and normalization helpers that reject
  unknown operations, duplicate or missing dispositions, incompatible stages,
  and unsupported profile combinations.
- [x] 1.3 Add focused registry fixtures for positive matching, wrong target or
  record kind, unknown operation, stage mismatch, and one-to-one outcome
  disposition evidence.

## 2. Effective authorization and policy normalization

- [x] 2.1 Extend autonomous delivery request normalization with canonical
  `reviewPolicy`, compatibility projection for
  `independentReviewPolicy`, and contradiction rejection. Depends on: 1.1.
- [x] 2.2 Add `agentPolicy` normalization, deterministic conservative `auto`
  classification, explicit-override preservation, and effective-authorization
  digest binding. Depends on: 1.1.
- [x] 2.3 Add profile-matrix and topology fixtures covering prototype and
  production defaults, explicit topology bypass of classification, legacy
  compatibility, and invalid combinations. Depends on: 2.1, 2.2.

## 3. Gates, outcomes, and review reuse

- [x] 3.1 Implement deterministic operation-gate evaluation that keeps
  authorization, Apply eligibility, review readiness, evidence freshness,
  claim, adapter capability, and runtime permission distinct. Depends on: 1.2,
  2.3.
- [x] 3.2 Implement typed outcome routing and canonical failure-signature
  correction eligibility; retain unknown, malformed, ambiguous, expired, and
  exhausted results as non-mutating pauses. Depends on: 3.1.
- [x] 3.3 Implement exact review-reuse validation against sealed package,
  exact head/tree, artifact manifest, Apply evidence, dispositions, and policy
  gate digest; require a fresh review for each invalidation case. Depends on:
  3.1.
- [x] 3.4 Add focused gate, outcome, correction-bound, strict-readiness, and
  review-reuse/invalidation tests with expected evidence and pause classes.
  Depends on: 3.2, 3.3.

## 4. Canonical adapter migration

- [x] 4.1 Update v2 admission and autonomous controller policy to persist and
  consume normalized operation-contract evidence before lifecycle selection.
  Depends on: 2.3, 3.1.
- [x] 4.2 Migrate lifecycle, review, and bounded-execution adapters to invoke
  the canonical registry and remove duplicate local profile/outcome decisions.
  Keep Claude and Codex wrappers thin. Depends on: 3.2, 3.3, 4.1.
- [x] 4.3 Update declared runtime helpers and assistant-neutral skill guidance
  only where the migrated contract changes their observable inputs or evidence.
  Preserve product configuration and credentials as caller inputs. Depends on:
  4.2.

## 5. Evidence, portability, and completion checks

- [x] 5.1 Add cross-assistant parity, second-product portability, and
  no-product-constant fixtures for normalized policy, gate results, and
  outcomes. Depends on: 4.2.
- [x] 5.2 Update relevant lifecycle eval scenarios and documentation to explain
  profile compatibility, topology selection, operation outcomes, and
  review-reuse invalidation without duplicating canonical policy. Depends on:
  4.3.
- [x] 5.3 Run focused operation-contract, resolver, controller, review,
  runtime, and adapter tests; run `openspec validate
  unify-autonomous-sdd-operation-contract --strict`, `openspec validate --all
  --strict`, whitespace/secret/scope review, and record completion evidence.
  Depends on: 5.1, 5.2.
