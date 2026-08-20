## 1. Domain contract and repository identity

- [x] 1.1 Add a canonical v2 run-contract module with strict record-kind,
  identity, digest, parent-summary allowlist, work-unit isolation, and
  secret-safe validation; add focused schema fixtures. Evidence: accepted and
  rejected record fixtures cover every v2 record kind and unknown kinds.
- [x] 1.2 Implement canonical-remote normalization and `r1-` repository-ID
  derivation without retaining credentials or worktree paths. Evidence: moved,
  removed, and fresh-clone fixtures resolve identically; credential-bearing,
  missing, changed, and colliding remotes pause. Depends on: 1.1.
- [x] 1.3 Define portable local and mock-future-backend serializers for the
  domain records. Evidence: round-trip/digest parity tests prove no
  backend-specific domain fields. Depends on: 1.1.

## 2. Durable local substrate contracts

- [x] 2.1 Add the configured state-root layout, immutable record/evidence
  publication protocol, rebuildable projections/indexes, and durable-write
  capability reporting. Evidence: fault fixtures prove atomic visibility,
  no in-place history changes, and safe unavailable-durability classification.
  Depends on: 1.1.
- [x] 2.2 Add the provider capability contract for singular repository claims,
  native-lock equivalence, explicit takeover proof, ownership generations, and
  in-doubt attempts; provide deterministic fake providers only. Evidence:
  fixtures reject mkdir/PID/timeout fallbacks, uncertain takeover, and stale
  generation writes. Depends on: 1.1, 2.1.
- [x] 2.3 Implement immutable transition-attempt records and idempotent resume
  reconciliation. Evidence: prepared/in-flight/in-doubt and duplicate-key
  fixtures prove no duplicate external attempt is admitted. Depends on: 2.1,
  2.2.
- [x] 2.4 Implement terminal-only archive validation, archive manifest/digest
  creation, atomic bundle movement/recovery, and index rebuild. Evidence:
  fixtures archive only fully reconciled terminal bundles and retain every
  active, paused, ambiguous, or cleanup-pending bundle. Depends on: 2.1, 2.3.

## 3. Admission and legacy cutover

- [x] 3.1 Implement read-only legacy controller/checkpoint decoding,
  inventory, deterministic compatible classification, immutable ambiguous
  classification, and legacy write-denial. Evidence: legacy fixtures prove no
  automatic rewrite and no dual-authority run. Depends on: 1.1.
- [x] 3.2 Implement v2 admission that validates normalized authorization,
  repository identity, provider bindings, no-active-legacy inventory, initial
  claim generation, parent run, and one work unit before lifecycle selection.
  Evidence: conflict and expired-input fixtures preserve existing records and
  admit only an exact compatible request. Depends on: 1.2, 2.2, 3.1.
- [x] 3.3 Adapt the canonical controller and runtime manifest with a durable
  `admit-v2-run` entrypoint plus v2 inspection/recovery; remove the legacy
  controller's ability to create or advance official new-run records. Evidence:
  entrypoint tests prove construction-only admission is unavailable and no
  lifecycle phase starts before durable v2 admission. Depends on: 3.2.
- [x] 3.4 Adapt canonical autonomous lifecycle instructions and regenerate thin
  Claude/Codex exposure so all entrypoints delegate to the same v2 admission.
  Evidence: generated-asset inventory and cross-assistant contract tests show
  no wrapper-owned record or worktree-derived identity. Depends on: 3.3.

## 4. Qualification and delivery evidence

- [x] 4.1 Add an end-to-end fake-provider qualification matrix covering
  parent/child isolation, repository conflict, interruption/resume, explicit
  takeover, stale-write fencing, archive recovery, and legacy cutover.
  Evidence: every specification scenario has a focused passing test or an
  explicitly documented M2 native-adapter boundary. Depends on: 2.4, 3.4.
- [x] 4.2 Perform the second-product configured-fixture portability check,
  secret-pattern review, dependency/license attribution review, and recovery
  review. Evidence: recorded checks show no repository-specific constants,
  credentials, or unapproved dependency/license impact. Depends on: 4.1.
- [x] 4.3 Run focused Node tests, required quality validators, requirements
  mapping, local code/security review, OpenSpec Verify, and
  `openspec validate --all --strict`; correct objective findings within the
  resolved per-signature budget. Evidence: current passing outputs are bound to
  the final implementation head. Depends on: 4.2.
