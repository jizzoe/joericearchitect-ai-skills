# Autonomous SDD execution and orchestration roadmap

Date: 2026-08-17

Status: Current planning roadmap. Candidate change names are proposed only;
this document creates no OpenSpec or GitHub record and authorizes no
implementation or external mutation.

## Outcome and planning basis

Deliver a local-first autonomous SDD system that can run one explicitly
authorized repository delivery for hours, resume from durable evidence, split
reasoning into scoped contexts, enforce review and lifecycle gates, and later
serve milestone/cross-repository coordination without duplicating its runtime.

This roadmap is organized by the canonical brief portfolio:

- [runtime kernel](../design-briefs/autonomous-sdd-runtime-kernel.md);
- [scoped work units](../design-briefs/scoped-work-unit-context-orchestration.md);
- [review assurance](../design-briefs/independent-review-assurance-and-profiles.md);
- [lifecycle integration](../design-briefs/sdd-lifecycle-integration-and-safe-recovery.md);
- [milestone/slice coordination](../design-briefs/sdd-milestone-slice-delivery-skill.md); and
- [design-brief provenance](../design-briefs/sdd-design-brief-provenance.md),
  which is an independent planning-governance track rather than a runtime
  prerequisite.

The [historical control-plane brief](../design-briefs/archived/autonomy/autonomous-sdd-reliability-control-plane.md)
and [durable-execution research](../research/reliability-engineering/durable-execution-build-vs-buy/durable-execution-build-vs-buy-findings.md)
remain evidence, not the current implementation plan.

## Current baseline

Already delivered and therefore not recreated by this roadmap:

- schema-v4 controller records with unique run IDs and Git-common-directory
  checkpoints;
- target-explicit bounded autonomous intake and first-incomplete-phase resume;
- exact derived-target authorization and phase evidence gates;
- strict isolated and precisely authorized degraded independent review;
- result/view lifecycle diagnostics and artifact-missing degraded eligibility;
- GitHub/OpenSpec/Project reconciliation helpers; and
- exact-owned, fresh-inspected, idempotent workspace cleanup with resource,
  delivery, and cleanup receipts.

Remaining work is composition, general scoped work units, review-transport
qualification, canonical status, and milestone adaptation. The roadmap does
not prescribe a bespoke distributed lease, compare-and-swap protocol, or
replay engine. The first topology is one local mutating runner per repository,
protected by a maintained single-writer primitive and restart reconciliation.

## Delivery rules

- Each slice delivers one observable outcome and its own tests/evidence.
- Current living specs and implemented contracts are migration inputs, not
  obsolete code to replace wholesale.
- Production-rapid work retains current independent-review requirements.
  Prototype behavior remains current until the open profile decision is made.
- No slice broadens credentials, deployment/release authority, remote branch
  deletion, or exact-owned cleanup scope.
- External side effects use exact targets, idempotency keys, intent/outcome
  receipts, and inspect-before-retry reconciliation.
- A failing composition test is not waived because component tests pass.
- External runtime adoption requires measured need and a separate official-doc,
  license, packaging, crash-recovery, and acceptance evaluation.

## Dependency shape

```text
M1 domain/runtime contracts
        |
        v
M2 scoped tests-first work units
        |
        +------------+
        v            v
M3 review        M4 lifecycle
reliability      composition
        \            /
         +----------+
               |
               v
M5 milestone/cross-repository adapter
               |
               v
M6 unattended qualification and cutover

Independent track: design-brief provenance
```

## Milestone 1 — Domain convergence and local runtime

### M1-S1 — Unify operation, evidence, configuration, and outcome contracts

Candidate change: `consolidate-autonomous-sdd-domain-contracts`

Outcome:

- one versioned operation graph validates lifecycle and target kinds;
- authorization/configuration resolves once with safe provenance/digests;
- one evidence binding/freshness model replaces caller-asserted currency; and
- every emitted result code maps exactly once to continue, retry, correct,
  repackage, degraded eligibility, human pause, or terminal failure.

Evidence:

- resolver-to-validator and configuration-to-consumer conformance tests;
- operation/target/profile matrix generation or validation;
- exhaustive outcome coverage with duplicate and missing mappings rejected;
- compatibility fixtures for current schema-v4 controller records.

### M1-S2 — Add the local RunStore and canonical status projection

Candidate change: `add-local-autonomous-sdd-run-store`

Depends on: M1-S1.

Outcome:

- one mutating runner acquires a repository-wide maintained lock;
- atomic projections and immutable attempt/evidence/outcome receipts survive
  removable worktrees;
- an interrupted attempt reconciles exact Git/external/result state before
  retry or advance; and
- status from any linked worktree reports run, current operation, evidence,
  owned resources, stop reason, and next safe action.

Evidence:

- concurrent-run refusal and process-death lock recovery;
- crash-before/after-intent and crash-before/after-result matrices;
- relocated/removed worktree discovery;
- sensitive-data and portability checks.

### Milestone 1 exit gate

One fake-adapter run reaches a terminal result through the new contracts,
survives interruption at every transition, and reports the same status from
every linked worktree. No distributed durability guarantee is claimed.

## Milestone 2 — Scoped tests-first work units

### M2-S1 — Define work units, sealed packages, attempts, and invalidation

Candidate change: `establish-isolated-sdd-work-unit-execution`

Depends on: M1.

Outcome:

- a validated graph rejects missing, cyclic, and unauthorized dependencies;
- each unit derives narrower read/write/tool authority from the run;
- fresh-context and producer-separation policies are attested by platform
  adapters; and
- input changes invalidate dependent evidence deterministically.

### M2-S2 — Deliver the serial tests-first vertical slice

Depends on: M2-S1.

Outcome:

- `author-tests` produces target-specific red evidence and a test digest;
- `implement` cannot change test-owned paths and can emit a typed contract
  challenge;
- `verify-green` is source-read-only and binds green evidence to the exact
  implementation head and unchanged test package; and
- current independent review can consume the resulting evidence when required.

Evidence:

- red-before-implementation and unchanged-test proofs;
- rejected cross-role writes and source mutation during verification;
- test-contract challenge/repackage/invalidation behavior;
- restart after every work unit and correction attempt.

### Milestone 2 exit gate

A synthetic repository completes the tests-first graph from requirements to
exact-head verification using separate bounded contexts, with no transcript
handoff and no model self-report accepted as evidence.

## Milestone 3 — Review admission, dispatch, and transport reliability

### M3-S1 — Resolve profile and configuration authority

Before implementation, the owner decides whether prototype remains
strict-first-degraded or becomes same-session-local. A versioned matrix must
then be shared by resolver, authorization, lifecycle, docs, and tests.

Candidate change after the decision:
`consolidate-independent-review-profiles-and-admission`.

Outcome:

- allowed reviewer sources and precedence are explicit;
- planning defaults cannot be mistaken for runtime reviewer authority;
- strict-only readiness is proved before Apply; and
- profile/policy incompatibilities fail before mutation.

### M3-S2 — Prove real multi-step final-result transport

Candidate change: `harden-independent-review-multistep-transport`

Outcome:

- a fixed host-owned adapter captures exactly one authoritative terminal event
  into the owned artifact, or a different documented protocol is proven;
- stdout, transcripts, intermediate JSON, missing/duplicate/late events,
  invalid payloads, binding mismatch, and cleanup failure remain rejected; and
- large packages use bounded indexed/chunked inspection rather than one-line
  JSON that defeats line limits.

Evidence must include a live multi-step Codex and Claude path where practical;
a fixture that writes the expected artifact directly is insufficient.

### M3-S3 — Integrate one dispatcher and exact-head reuse

Depends on: M3-S1, M3-S2.

Outcome:

- one dispatcher owns strict launch, eligible degraded recovery, finding
  correction, rereview, exact-head invalidation, and final evidence;
- an authorized degraded result retains its strict precursor and label; and
- one current review may gate explicitly defined later non-code transitions
  until a review-relevant input changes.

Conditional follow-up: add sanitized launch-context toolchain parity only for
typed missing-tool failures that host semantic inspection cannot satisfy.

### Milestone 3 exit gate

Clean, findings-bearing, corrected, unavailable, degraded-eligible, stale-head,
and cleanup-failure scenarios all produce one current, schema-valid,
exhaustively classified result without operator mediation or transcript
acceptance.

## Milestone 4 — Lifecycle composition and recovery

### M4-S1 — Compile lifecycle phases onto typed adapters

Candidate change: `compose-autonomous-sdd-lifecycle-adapters`

Depends on: M1; may proceed in parallel with M3 where interfaces are stable.

Outcome:

- intake, Propose, Apply, Verify, review, PR delivery, Sync, Archive,
  issue/Project convergence, and cleanup use the shared operation/outcome model;
- every external adapter implements inspect/apply/reconcile with exact targets;
  and
- standalone actions keep normal phase boundaries while a validated controller
  returns to the next incomplete phase.

### M4-S2 — Prove terminal delivery and exact-owned cleanup

Depends on: M4-S1 and review behavior required by the selected profile.

Outcome:

- implementation, Sync, and Archive heads retain separate current delivery
  bindings, including squash/rebase evidence;
- partial GitHub/OpenSpec state reconciles without duplicate mutation;
- cleanup removes only fresh-inspected eligible resources and records durable
  terminal receipts; and
- dirty, primary, locked, legacy, unregistered, changed, or ambiguous resources
  remain intact with actionable status.

### Milestone 4 exit gate

A disposable repository completes the full single-change lifecycle and resumes
from every transition boundary, including partial external state and partial
cleanup, without routine prompts when authorization and evidence remain valid.

## Milestone 5 — Milestone and cross-repository coordination

### M5-S1 — Add the milestone/slice adapter

Candidate change: `add-sdd-milestone-slice-delivery`

Depends on: M2 and M4; M3 when production-rapid is used.

Outcome:

- dependency-valid single-repository slices submit immutable queue entries to
  the same runtime rather than implementing another runner;
- milestone/slice summaries and the two checkpointed gates remain visible;
- cross-repository slices use explicit `team` or `solo` collaboration profiles,
  separate repository roles, pushed central pins, durable linkage ledgers,
  component returns, re-pinning, and assigned end-to-end verification; and
- central authorization never grants component-repository mutation.

### M5-S2 — Add optional design-brief provenance

Candidate change: `add-sdd-design-brief-provenance`.

This planning-governance slice is independent of the runtime dependency chain
and may be delivered earlier. It adds explicit/optional source selection,
immutable copy/digest sidecars, Archive preservation, and strict-validation
fixtures without changing lifecycle authority.

### Milestone 5 exit gate

A cold central session reconstructs an open cross-repository slice from its
ledger alone; separate component sessions deliver one local change each; the
central role verifies returned plus end-to-end evidence and closes only after
every component, with no shared conversation or cross-repository mutation.

## Milestone 6 — Qualification and default cutover

### M6-S1 — Composition and fault-injection qualification

Exercise real composed code, not only prepared fixtures:

- interrupt/restart at every operation and work unit;
- concurrent runner and stale-lock recovery;
- stale-head and invalidation cascades;
- partial GitHub, PR, Project, Sync, Archive, and cleanup states;
- strict/degraded review transport and correction;
- worktree relocation/removal and dirty unrelated work preservation;
- exact prompt/pause counts; and
- cross-assistant behavior with product-neutral configuration.

### M6-S2 — Repeated unattended delivery soak

Run several disposable five-slice deliveries for the required duration and
profile. Record transition attempts, corrections, reviews, pauses, external
effects, resource outcomes, and final status. A real human-only decision is a
valid pause; an unclassified stop, missing state, duplicate mutation, stale
evidence acceptance, or routine prompt is a failure.

### M6-S3 — Decide runtime and default path

Enable the new path by default only after acceptance thresholds are defined and
met. If local reconciliation shows a measured topology/recovery limit, run the
external-engine evaluation at this point and select an adapter from evidence.
Retain the previous path until migration, rollback, and active-run compatibility
are proven.

## Recommended first slice

First resolve the architecture confirmation and prototype-profile owner
decision. Then start M1-S1, because shared operation/evidence/configuration/
outcome contracts are prerequisites for the local store, scoped work units,
review dispatcher, lifecycle adapters, and milestone client.

Do not begin with a lease/CAS/event ledger implementation or a vendor runtime.
Neither can repair conflicting domain vocabularies or define the SDD-specific
evidence and authority model.
