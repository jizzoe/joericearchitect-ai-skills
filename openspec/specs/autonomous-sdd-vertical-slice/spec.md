# autonomous-sdd-vertical-slice Specification

## Purpose

Proves one disposable fixture change flows proposal, Apply, Verify, and
fresh-review-on-change under a pure selector, simulated adapters, and a minimal
ephemeral store for both authority profiles.

## Requirements

### Requirement: Pure selector makes one deterministic transition choice
The selector SHALL consume authoritative run state, the M1-S2 operation
registry, current evidence, live checks, deadline, and correction budgets, and
SHALL return exactly one legal transition or a typed no-op/pause. It SHALL
perform no I/O and MUST NOT invent a transition, authority, or outcome.

#### Scenario: Valid state selects exactly one registry transition
- **WHEN** a run's state, evidence, live checks, deadline, and budgets match one
  registry entry whose complete contract applies
- **THEN** the selector returns that single transition and no alternate transition

#### Scenario: No legal transition is reachable
- **WHEN** no registry entry's complete contract matches the current state, or
  the inputs are ambiguous, unknown, or conflicting
- **THEN** the selector returns a typed pause and performs no selection or mutation

### Requirement: Simulated adapters are non-mutating and capability-scoped
Each simulated adapter SHALL accept immutable, capability-scoped input and
SHALL return validated output. It MUST NOT edit a real repository, mutate
GitHub, select the next transition, or expand authority.

#### Scenario: Propose adapter returns planning evidence without repository edits
- **WHEN** the simulated Propose adapter runs against the fixture template
- **THEN** it returns planning-artifact evidence and writes no real repository file

#### Scenario: Adapter output cannot select the next transition
- **WHEN** an adapter emits a result
- **THEN** that result is data only and cannot name or authorize the next transition

#### Scenario: Unknown or malformed adapter outcome pauses
- **WHEN** an adapter returns an unknown, malformed, or multiply classified outcome
- **THEN** the run records a typed pause and performs no retry or mutation

### Requirement: Executor persists write-ahead attempts and commits one permitted state
The executor SHALL acquire single-run ownership, persist a `prepared` attempt,
record `in-flight`, observe the result, and commit exactly one of `observed`,
`committed`, or `in-doubt`. Interrupted external success MUST reconcile before
retry.

#### Scenario: Successful attempt advances through the write-ahead states
- **WHEN** an adapter completes successfully
- **THEN** the attempt advances `prepared` to `in-flight` to `committed` with
  recorded evidence at each boundary

#### Scenario: Receipt is lost and the result is unknowable
- **WHEN** an attempt's external outcome cannot be observed after interruption
- **THEN** the run pauses before retry and does not duplicate mutation

### Requirement: Thin sealed review loop invalidates on any review-relevant change
The slice SHALL reuse the existing independent-review and verification skills.
For the production profile the review step SHALL route through the strict
host-captured transport and SHALL require a parent-owned schema-valid terminal
artifact, never a transcript or claimed success; the prototype profile SHALL
keep its same-session-local review path. It MUST require fresh review when the
sealed package digest, exact head or tree, artifact manifest, Apply evidence,
findings dispositions, or policy gates change. The reviewer MUST NOT fix the
change.

#### Scenario: Unchanged sealed bindings reuse review lineage
- **WHEN** a review-gated operation's sealed bindings are all still current
- **THEN** the slice may consume the existing review lineage without launching a
  redundant reviewer

#### Scenario: A review-relevant binding changes
- **WHEN** any sealed review binding changes after a review result was accepted
- **THEN** the result is invalid and the next review-gated operation requires fresh review

#### Scenario: A reviewer finding never mutates the change
- **WHEN** the independent reviewer records a finding
- **THEN** the change is routed to a fresh implementer correction and is never
  edited by the reviewer

#### Scenario: Production review requires the terminal artifact
- **WHEN** a production-profile review step completes
- **THEN** it accepts only a parent-owned schema-valid terminal artifact from the
  strict host-captured transport and rejects transcript-only or claimed success

### Requirement: Minimal ephemeral store is distinct from the durable backend
The slice SHALL record one disposable fixture run in a minimal ephemeral store
that MUST NOT write real controller state and MUST remain distinct from the
future durable execution backend.

#### Scenario: Ephemeral records avoid real controller checkpoints
- **WHEN** the slice persists attempt and transition records
- **THEN** it writes only its own disposable store and never touches a real
  controller checkpoint or claim record

#### Scenario: Store contents are disposable for the single fixture run
- **WHEN** the fixture run completes or is discarded
- **THEN** the store can be rebuilt from its attempts without a durable history,
  claim, or projection backend

### Requirement: Both authority profiles produce the same lifecycle facts
`production` and `prototype` profiles SHALL produce the same proposal → apply →
verify → fresh-review-on-change facts on the fixture while applying their
distinct approval requirements. `prototype` SHALL use same-session-local
review; `production` SHALL require its strict independent review path and MUST
NOT substitute local review.

#### Scenario: Prototype completes with local review
- **WHEN** a `prototype` run exercises the fixture
- **THEN** it completes the same lifecycle facts using same-session-local review

#### Scenario: Production requires strict review without degradation
- **WHEN** a `production` run exercises the fixture
- **THEN** it requires the strict independent review path and does not substitute
  local review or a weaker profile

### Requirement: Failure and recovery conditions produce exact typed pauses
Restart, stale-owner, exhausted-budget, and malformed-outcome conditions SHALL
produce exact typed pauses with retained evidence and MUST NOT retry or mutate.

#### Scenario: Restart resumes without duplicate work
- **WHEN** a run restarts at a completed attempt boundary
- **THEN** it advances only the first incomplete evidenced transition without
  duplicating completed work

#### Scenario: A stale owner cannot advance state
- **WHEN** a prior owner's token no longer matches the current single-run owner
- **THEN** the stale attempt is rejected and the run pauses

#### Scenario: Correction budget is exhausted
- **WHEN** a registered objective failure reaches its canonical failure-signature
  correction budget
- **THEN** the run pauses with the exhausted budget recorded and does not retry

#### Scenario: Outcome cannot be classified
- **WHEN** an outcome is unknown, malformed, or ambiguous
- **THEN** the run records a typed pause and performs no retry or external mutation

### Requirement: Selector and review-invalidation are proven deterministically
The slice SHALL include a requirement-to-test map, an injected clock so no
authorization test is calendar-sensitive, and property/symmetry tests covering
the selector and review-invalidation rules.

#### Scenario: Authorization tests are calendar-independent
- **WHEN** authorization or budget tests run
- **THEN** they use an injected clock and do not depend on the wall-clock date

#### Scenario: Property tests prove selector and invalidation determinism
- **WHEN** the same authoritative inputs are replayed
- **THEN** the selector returns the same transition and unchanged review
  bindings reuse while changed bindings invalidate, symmetrically and repeatedly
