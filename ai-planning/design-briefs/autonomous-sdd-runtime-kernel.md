# Autonomous SDD runtime kernel

Date: 2026-08-17

Status: Evidence-derived recommendation pending explicit owner confirmation.
This is the canonical runtime-architecture brief; it does not claim that the
recommended successor kernel is implemented.

## 1. Problem and desired outcome

The repository already defines bounded authorization, lifecycle checkpoints,
independent-review evidence, external reconciliation, and exact-owned cleanup.
Those rules are distributed across living specs, skills, scripts, and several
state projections. The current controller durably records a run, but no single
executable kernel composes the complete rules into deterministic selection,
dispatch, reconciliation, outcome classification, and status.

The desired outcome is a repository-owned SDD domain kernel above a small,
swappable durability port. The first runtime should match the actual topology:
one local mutating runner per Git repository, atomic state, immutable receipts,
and restart-by-reconciliation. A later durable engine may replace that storage
and scheduling substrate without redefining authorization, evidence, review,
OpenSpec, GitHub, or cleanup semantics.

## 2. Evidence and key findings

- The current [controller](../../scripts/sdd/autonomous-sdd-controller.mjs)
  uses schema version 4, a unique `runId`, Git-common-directory checkpoints,
  resource registration, delivery bindings, and cleanup receipts. Older claims
  that it has no run ID or stores its only checkpoint inside a removable
  worktree are stale.
- [Bounded autonomous execution](../../openspec/specs/bounded-autonomous-execution/spec.md),
  [autonomous continuation](../../openspec/specs/autonomous-sdd-continuation/spec.md),
  and [derived target authorization](../../openspec/specs/derived-sdd-target-authorization/spec.md)
  already define much of the domain behavior. The gap is composition, not a
  missing generic workflow vocabulary.
- The [public harness landscape](../research/autonomous-agent-harness-landscape-2026/findings.md)
  supports predefined code paths, narrow model roles, deterministic evidence,
  checkpointed recovery, and explicit stop conditions.
- The [durable-execution comparison](../research/reliability-engineering/durable-execution-build-vs-buy/durable-execution-build-vs-buy-findings.md)
  shows that Temporal, Restate, and DBOS can supply generic durable execution,
  but cannot define the SDD domain. It also shows that hand-building a
  distributed lease/CAS/replay engine would repeat mature infrastructure for a
  threat model the repository has not demonstrated.
- The superseded [original control-plane brief](archived/autonomy/autonomous-sdd-reliability-control-plane.md)
  remains useful evidence for fragmented schemas, vocabularies, review
  dispatch, configuration, and status. Its distributed-persistence
  recommendation is not carried forward.

## 3. Options considered and tradeoffs

1. **Continue model-driven composition.** Cheap, but prompt compliance cannot
   enforce transition ownership, current evidence, or crash reconciliation.
2. **Build distributed durability in this repository.** Full control, but a
   large and unnecessary distributed-systems surface for one local writer.
3. **Adopt Temporal, Restate, or DBOS as the domain model.** Real durability,
   but couples SDD semantics and local operation to a runtime that still does
   not supply SDD policy.
4. **Use a local-first kernel with a runtime port.** Matches current topology,
   isolates SDD semantics, and leaves an evidence-based adoption seam. This is
   the recommended direction.

## 4. Recommended design

The stable domain layer owns these objects:

- `RunRecord`: run/repository/selected-entry identity, immutable authorization
  and safe configuration snapshots, workflow digest, deadline, owned
  resources, external records, and projections.
- `WorkflowDefinition`: a versioned graph of lifecycle operations and nested
  work-unit graphs, including dependencies, conditions, invalidation edges,
  and terminal outcomes.
- `ExecutionAttempt`: one invocation bound to an operation or work unit,
  package digest, derived authority, exact source/external state, timestamps,
  and outcome.
- `EvidenceRecord`: a schema-versioned claim bound to its producer, subjects,
  digests, head, verification method, and dependents. Freshness is derived;
  callers cannot assert it with an unchecked boolean.
- `OutcomeDefinition`: an exhaustive one-to-one mapping from emitted codes to
  continue, retry, correct, repackage, degraded-eligible, waiting-human, or
  terminal-failure.
- `RunStatus`: a derived read model showing the current operation, evidence,
  external reconciliation, owned resources, stop reason, and next safe action.

Authorization and configuration resolve once at admission with source
provenance and safe digests. Each operation derives narrower authority and
still requires active runtime permission. Credentials, raw environment,
transcripts, or hidden reasoning are never persisted.

The runtime port is deliberately small: create/load a run, acquire/release the
repository writer, record attempt start/outcome/evidence, atomically replace the
projection, reconcile an interrupted attempt, and project status. The local
adapter retains state under the Git common directory, holds a maintained
repository-wide single-writer lock, records immutable uniquely named receipts,
and reconciles Git/GitHub/OpenSpec side effects before retrying.

External mutations remain inspect/apply/reconcile adapters with stable
idempotency keys. A lock prevents overlapping local runners; it does not claim
exactly-once external effects. Reconciliation closes the crash window by
inspecting the exact target and recording an already-completed outcome.

A Restate, Temporal, DBOS, or other adapter becomes appropriate only after an
observed need such as multiple hosts, offline server-side scheduling, high
availability, or repeated unrecoverable crash-mid-operation failures. Engine
history remains infrastructure evidence, never authorization or SDD completion
evidence.

## 5. Scope, non-goals, constraints, dependencies, and risks

In scope are the canonical run/evidence/outcome/status model, configuration and
authorization snapshot, deterministic transition selection, local
single-writer persistence, restart reconciliation, and runtime adapter seam.

This brief does not define the internal contract of isolated work units (see
[Scoped work-unit context orchestration](scoped-work-unit-context-orchestration.md)),
review assurance, milestone coordination, or planning provenance. It does not
adopt a hosted engine, build distributed leases/CAS/consensus, replace OpenSpec,
or broaden GitHub, credential, deployment, release, or cleanup authority.

The main risks are treating a file lock as high availability, centralizing too
much privilege, snapshotting secrets, and retrying an uncertain external
effect. The mitigations are an explicit single-writer guarantee,
capability-scoped adapters, safe-only snapshots, intent receipts, exact-target
inspection, and fail-closed legacy-state classification.

## 6. Open questions and blocking decisions

- Confirm the local-first kernel as the successor architecture rather than
  bespoke distributed durability or immediate external-engine adoption.
- Decide whether schema-v4 controller records evolve in place or enter one
  successor schema through an explicit compatibility reader.
- Select and license-review the maintained local locking primitive.
- Define measured triggers and an acceptance spike for any external runtime.
- Decide the exact boundary for reusing current exact-head review across later
  non-code lifecycle transitions; Review assurance owns the assurance policy.

## 7. Recommended next step

Confirm the architecture and refine one vertical implementation slice: a
single-run local store, exhaustive outcome registry, interruption
reconciliation, and canonical status, exercised first by the scoped tests-first
workflow. Do not create distributed persistence primitives or choose a vendor
before that slice demonstrates a requirement the local model cannot satisfy.
