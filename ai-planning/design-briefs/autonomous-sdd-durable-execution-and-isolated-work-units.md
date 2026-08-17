# Autonomous SDD durable execution and isolated work units

Date: 2026-08-17

Status: Evidence-derived recommendation pending owner confirmation. This brief
is intended to be concrete enough for OpenSpec Propose, but it does not create
an OpenSpec change or authorize implementation.

## 1. Problem and desired outcome

The repository has most of the domain rules needed for reliable autonomous SDD:
lifecycle ordering, bounded authorization, exact-head evidence, independent
review, Git/GitHub/OpenSpec reconciliation, cleanup ownership, and human-pause
behavior. Those rules are distributed across OpenSpec specifications, skills,
scripts, and multiple state projections. There is still no single executable
composition that selects a next unit of work, starts it in a deliberately
bounded context, validates its result, records evidence, and resumes safely.

The [original reliability control-plane brief](autonomous-sdd-reliability-control-plane.md)
correctly recommends deterministic, evidence-gated orchestration. It goes too
far in one area by proposing a bespoke lease, compare-and-swap protocol, and
replay-oriented event ledger before the repository has demonstrated a
distributed multi-writer need. It is also too narrow in treating fresh isolated
execution primarily as an independent-review concern.

The desired outcome is a local-first SDD execution kernel with two explicit
layers:

1. An SDD domain layer that defines typed workflows, work units, authorization,
   evidence, freshness, reconciliation, outcomes, and status.
2. A small swappable durability layer that initially enforces one mutating
   runner per repository and can later be replaced by Restate, Temporal, DBOS,
   or another durable engine without redefining SDD behavior.

The same kernel should be able to run ordinary tasks in separate, smaller
contexts. A tests-first workflow should be able to use one fresh bounded context
to author tests, another to implement production code, a third read-only context
to verify the exact implementation against the unchanged tests, and a stricter
independent context to review the result when the delivery profile requires it.

Success means:

- models receive only the context needed for one work unit;
- each work unit has an enforceable tool and mutation boundary;
- handoffs contain immutable artifacts and evidence rather than prior chat;
- evidence, not a model's self-report, unlocks dependent work;
- a changed input invalidates all dependent evidence deterministically;
- interruption between work units resumes without repeating completed effects;
- a second mutating runner is rejected rather than racing the first;
- the status command explains the current unit, evidence, stop reason, and next
  safe action; and
- strict independent review remains a higher-assurance specialization, not the
  only operation that can benefit from fresh context.

## 2. Evidence and key findings

### Original brief and what changed

This brief supersedes the architecture recommendation in the
[original control-plane brief](autonomous-sdd-reliability-control-plane.md),
while retaining its reproduced reliability gaps and its SDD-specific rules.

| Original brief | Revised solution |
|---|---|
| Build a canonical run record with a lease, CAS revision, and append-only replay ledger. | Retain the canonical run and immutable transition receipts, but use a standards-based repository-wide single-writer lock and atomic snapshots for the actual local threat model. Do not implement a distributed lease/CAS protocol. |
| Treat the event ledger as part of a custom durable engine. | Treat immutable attempt and outcome records as audit and reconciliation evidence. The authoritative local projection is an atomic run snapshot; recovery reconciles any started-but-unfinished unit against Git, GitHub, OpenSpec, and owned artifacts. |
| One transition engine directly owns the entire lifecycle. | Split the design into an SDD workflow kernel and a `RunStore`/runtime port. SDD semantics remain stable if the local store is later replaced by Restate, Temporal, or DBOS. |
| Isolation is concentrated in the review dispatcher. | Generalize isolation into typed execution capsules for test authoring, implementation, verification, research, planning, review, and other bounded work. Independent review adds stronger actor-separation and read-only requirements. |
| Apply is one broad lifecycle phase. | Permit an Apply phase to contain an evidence-gated subgraph of smaller work units, such as tests-first, implementation, verification, and correction. |
| The controller lacked a run ID and stored state only in a removable worktree. | This diagnosis is now stale. The current [controller](../../scripts/sdd/autonomous-sdd-controller.mjs) uses schema version 4, a unique `runId`, a Git-common-directory checkpoint, resource registration, delivery bindings, and cleanup receipts. The remaining gaps are orchestration, unified schemas, configuration snapshots, locking, context dispatch, and composed recovery. |
| Temporal-like durability was treated as a future external-service option. | Existing durable engines are explicit adapters or escalation options. None is allowed to define SDD lifecycle, evidence, authorization, review, or cleanup semantics. |

### The SDD domain model already exists, but is fragmented

The following concepts are not supplied by a durable-execution product. They
are already defined substantially or partially by this repository and must be
consolidated rather than reinvented.

| Domain concern | OpenSpec definition | Current executable coverage | Remaining composition gap |
|---|---|---|---|
| Typed lifecycle and operation graph | [SDD lifecycle](../../openspec/specs/sdd-lifecycle/spec.md), [bounded autonomous execution](../../openspec/specs/bounded-autonomous-execution/spec.md), and [derived target authorization](../../openspec/specs/derived-sdd-target-authorization/spec.md) define ordering, prerequisites, and authorized target derivation. | [Operation authorization](../../scripts/sdd/check-operation-authorization.mjs), the [controller](../../scripts/sdd/autonomous-sdd-controller.mjs), and the delivery resolver contain hard-coded phase and operation vocabularies. | One validated graph must generate or validate every vocabulary and permit subgraphs of typed work units. |
| Authorization and configuration snapshots | Bounded execution and lifecycle specs require exact, expiring authorization and selected-entry continuity. | The request resolver normalizes authorization and the controller records an authorization digest. Repository config and reviewer consumers still use incompatible projections. | Resolve one safe configuration and authorization snapshot at admission, retain provenance and digests, and make every work unit derive narrower authority from it. |
| Evidence bindings and freshness | Lifecycle specs, derived authorization, independent review, and cleanup define current evidence and exact-head invalidation. | [Checkpoint inspection](../../scripts/sdd/checkpoint.mjs), operation authorization, and review-contract validators enforce many individual bindings. | Use one evidence schema, dependency graph, and invalidation function instead of caller-supplied or subsystem-specific notions of `current`. |
| Review dispatcher and exact-head lineage | [Isolated independent review](../../openspec/specs/isolated-independent-review/spec.md) defines sealed packages, fresh reviewers, immutable results, correction, and changed-head rereview. | [Independent-review execution](../../scripts/sdd/execute-independent-review.mjs) implements strict-first dispatch and authorized degraded recovery. | Invoke it from the workflow kernel and bind its result into the same work-unit lineage and outcome registry. |
| Git/GitHub/OpenSpec reconciliation | The lifecycle and GitHub sync specifications define resume and convergence behavior. | Focused GitHub, lifecycle audit, Project status, and OpenSpec helpers exist. | Each external transition needs a typed adapter with `inspect`, `apply`, and `reconcile` behavior consumed by the kernel. |
| Cleanup ownership and human-pause classification | [Workspace cleanup](../../openspec/specs/sdd-workspace-cleanup/spec.md) strongly defines exact ownership, fresh inspection, terminal receipts, and safe refusal. Bounded execution defines when judgment is human-only. | Controller schema v4 and cleanup scripts now register resources and persist cleanup receipts; a deterministic result classifier exists. | All emitted outcomes need one exhaustive retry, correction, pause, or terminal disposition used by every work unit. |
| Domain-level run/status projection | Lifecycle, continuation, review, and cleanup specs define individual state classifications. | Controller, checkpoint, review, GitHub, and cleanup commands each expose partial status. | A single projection must aggregate the run, current unit, evidence, external state, owned resources, stop reason, and next safe action. |

OpenSpec therefore owns the normative observable behavior; canonical skills own
assistant-neutral operating policy; deterministic scripts enforce boundaries;
and the proposed kernel composes those pieces. A workflow engine may durably
store and invoke this model, but cannot define it.

### Durable-execution build-versus-adopt evidence

The checked-in [landscape findings](../research/autonomous-agent-harness-landscape-2026/findings.md)
support predefined code paths, evidence gates, narrow model roles, and durable
handoffs. They also warn that hand-building distributed leases, CAS, and replay
is a known risk. The later vendor comparison supplied with this decision was
checked against current first-party material:

| Candidate | What it can replace | Fit for this repository now |
|---|---|---|
| Local single-writer adapter | Prevents overlapping mutating runners; persists atomic run projections and immutable attempt receipts; resumes by reconciliation. | Recommended first implementation. It matches one developer and one active mutating runner per repository, has no service dependency, and avoids pretending to provide distributed guarantees. |
| Temporal | Supplies durable workflow history, replay, retries, timers, and distributed coordination. | Keep as a future adapter or production-scale option. `temporal server start-dev` is documented as a [development server](https://github.com/temporalio/cli) and official SDK material calls the embedded service suitable for [development and CI/CD](https://github.com/temporalio/sdk-php); that is not evidence that it is an unattended production runtime. |
| Restate | Journals durable steps and can run as a [single self-contained binary](https://docs.restate.dev/quickstart); a single node persists to local durable disk. | Best candidate for a time-boxed local durable-engine spike if local reconciliation proves insufficient. The server is under [Business Source License 1.1](https://github.com/restatedev/restate/blob/main/LICENSE), so licensing and redistribution must be reviewed. |
| DBOS | Checkpoints workflows and step outputs in [Postgres without a separate orchestration server](https://docs.dbos.dev/architecture). | Attractive only where Postgres is already an accepted dependency. DBOS strongly recommends [Conductor for production](https://docs.dbos.dev/production/conductor), which adds a control-plane service and credentials for the higher-availability features. |

The key correction is not “buy Temporal and remove the control plane.” It is
“do not hand-build generic distributed durability.” The typed lifecycle,
work-unit permissions, evidence rules, review lineage, reconciliation, cleanup,
and status projection remain repository-owned under every option.

## 3. Options considered and tradeoffs

### Option A: Keep model-driven composition and improve prompts

Skills would tell the active model to open a fresh context, pass limited files,
avoid certain mutations, and return structured evidence.

- Lowest initial cost.
- Useful as user-facing guidance after enforcement exists.
- Cannot prove that transcript history was excluded, permissions were narrowed,
  tests remained unchanged, or dependent evidence is current.
- Leaves recovery and status dependent on context retention and model choice.

Disposition: reject as the reliability boundary.

### Option B: Build a bespoke distributed durable-execution engine

The repository would implement leases, heartbeats, monotonic revisions, CAS,
event replay, worker ownership, and failover in addition to SDD semantics.

- Gives complete local control and no external engine dependency.
- Solves multiple writers and failover that are not current requirements.
- Creates a large distributed-systems test and maintenance burden.
- Repeats mature engine functionality and expands the trusted computing base.

Disposition: reject for the current single-repository, single-writer topology.

### Option C: Adopt Temporal, Restate, or DBOS as the canonical model

All SDD transitions would be encoded directly in one vendor's workflow model.

- Provides real durable-execution primitives and operating tools.
- Couples domain evolution, local installation, testing, and distribution to
  one runtime and its license or infrastructure.
- Does not eliminate the need for SDD-specific schemas and adapters.
- Risks making a local CLI require a production service before the domain
  contract and recovery semantics have been proven.

Disposition: reject as the mandatory first runtime. Preserve an adapter seam.

### Option D: Local-first SDD kernel with typed isolated work units

Build the SDD-specific graph, evidence, context, and reconciliation model above
a small `RunStore`/execution port. Start with one process-held repository lock,
atomic state, immutable receipts, and restart reconciliation. Use an external
durable engine only when an observed requirement exceeds that model.

- Matches the current threat model and operational footprint.
- Generalizes fresh bounded execution beyond review.
- Keeps SDD semantics stable across future runtime choices.
- Makes the first vertical slice testable without GitHub or a workflow cluster.
- Still requires careful context attestation, mutation fencing, and crash
  reconciliation; a lock alone does not make side effects exactly-once.

Disposition: recommended, pending owner confirmation.

## 4. Decisions, assumptions, and owner

- Decision owner: Joe Rice.
- Owner-stated desired capability: workflows should be able to carry out tasks
  in smaller contexts and scopes, including distinct tests-first,
  implementation, and verification contexts.
- Existing owner constraints retained from the original brief: multi-hour
  autonomous SDD delivery, no routine prompts when objective gates pass,
  preservation of unrelated dirty work, and exact-owned cleanup only.
- Recommendation pending confirmation: select Option D.
- Assumption: the first release supports one active mutating runner per Git
  repository. It does not claim high availability or distributed failover.
- Assumption: a fresh context may use the same model/provider as another work
  unit. A different actor identity is required only by an assurance profile,
  such as strict independent review.
- Assumption: persisted state contains structured inputs, references, digests,
  outcomes, and safe diagnostics—not full transcripts, credentials, or hidden
  chain-of-thought.

### Recommended architecture

```text
normalized authorization + configuration snapshot
                         |
                         v
             SDD workflow definition
       (lifecycle graph containing work-unit subgraphs)
                         |
                         v
        +----------------------------------+
        | SDD execution kernel             |
        | select -> package -> dispatch    |
        | inspect -> validate -> commit    |
        | invalidate -> reconcile -> next  |
        +----------------+-----------------+
                         |
             +-----------+-----------+
             |                       |
             v                       v
   context dispatcher           typed adapters
   fresh bounded agent          Git / GitHub /
   or deterministic tool        OpenSpec / review
             |                       |
             +-----------+-----------+
                         v
              evidence and outcomes
                         |
                         v
                 RunStore port
           local single-writer first
       Restate / Temporal / DBOS optional
                         |
                         v
              canonical status view
```

### Canonical domain objects

1. **`RunRecord`** identifies the run, repository, selected entry, immutable
   authorization and configuration snapshots, workflow definition digest,
   deadline, current status, owned resources, external records, and work-unit
   projections.
2. **`WorkflowDefinition`** is a versioned directed graph. It names work units,
   dependencies, branch conditions, terminal outcomes, and invalidation edges.
   The existing SDD lifecycle becomes the outer graph; Apply, correction, and
   review may contain nested subgraphs.
3. **`WorkUnitDefinition`** defines one bounded objective and its executable
   contract:
   - stable `workUnitId`, type, role, and objective;
   - prerequisite units and required evidence types;
   - immutable input references and digest rules;
   - fresh-context and actor-separation policy;
   - allowed tools, commands, network capabilities, and mutation classes;
   - readable paths, writable paths, forbidden paths, and ephemeral outputs;
   - expected result and evidence schemas;
   - completion predicate and freshness/invalidation triggers;
   - retry budget and exhaustive outcome dispositions; and
   - reconciliation behavior for an interrupted attempt.
4. **`WorkPackage`** is the sealed handoff to a context. It contains the
   objective, exact artifact references, base/head identities, constraints,
   permitted operations, result location, and package digest. It excludes the
   previous context's transcript.
5. **`ExecutionAttempt`** binds a unique attempt and context ID to the work
   unit, actor/provider identity, package digest, authorization derivation,
   start and finish receipts, exact source state, and safe outcome.
6. **`EvidenceRecord`** binds a schema-versioned claim to its producer attempt,
   subject digests, base/head, timestamps, verification method, and dependent
   work units. Freshness is derived from those bindings rather than supplied as
   an unverified boolean.
7. **`OutcomeDefinition`** maps every emitted outcome exactly once to
   `continue`, `retry`, `correct`, `repackage`, `degraded-eligible`,
   `waiting-human`, or `terminal-failure`.
8. **`RunStatus`** is a derived read model, never an independent source of
   truth. It reports the current unit, active attempt, evidence state, external
   reconciliation, owned resources, classification, reason, and next safe
   action.

### Independence is a work-unit property, not a synonym for review

Yes, this model can make other tasks independent. It helps to distinguish
three levels rather than give every fresh context the full independent-review
meaning:

| Execution profile | Guarantees | Appropriate uses |
|---|---|---|
| `fresh-scoped` | New context ID; no prior transcript; sealed package; narrow tools and write set; structured result. The same model/provider is allowed. | Test authoring, implementation, documentation, migration, focused investigation. |
| `producer-separated` | All `fresh-scoped` guarantees plus a different execution attempt and no authority to validate or approve its own output. | Tests versus implementation, implementation versus verification, competing analyses. |
| `independent-assurance` | Fresh distinct reviewer identity, pinned read-only view, immutable exact-head package, no implementation authority, and the existing strict result contract. | Production independent review and other explicitly high-assurance judgments. |

This avoids two errors: treating a new chat as sufficient proof of independent
review, and requiring an expensive independent reviewer for every ordinary
bounded task. Context separation improves focus and limits accidental scope;
actor and authority separation provide stronger assurance only where needed.

### Concrete tests-first workflow

The first vertical slice should compile this subgraph inside Apply:

```text
requirements snapshot
        |
        v
 [author-tests] -- red evidence + test manifest digest --> [implement]
        ^                                                     |
        | test-contract-challenge                             | exact head
        +-----------------------------------------------------+
                                                              v
                                                       [verify-green]
                                                              |
                                           exact-head verification evidence
                                                              v
                                                [independent-review]
                                                when profile requires it
```

| Work unit | Context and authority | Required input | Required output/evidence |
|---|---|---|---|
| `author-tests` | Fresh context. May inspect the requirement snapshot, current interfaces, existing tests, and bounded source. May write only declared test-owned paths. May not modify production paths. | Requirements/spec digest, base commit, target behavior, project test conventions, allowed paths. | Test patch/commit, test-file manifest and digest, targeted command, and red evidence showing the new behavior fails for the expected reason on the base implementation. |
| `implement` | Separate fresh context. May inspect requirements, tests, red evidence, and production code. May write only declared production paths. Test-owned paths are immutable. | Exact test package digest, red evidence, base/head, implementation constraints. | Implementation patch/commit, changed-file manifest, unchanged test digest, and implementation evidence bound to the new head. |
| `verify-green` | Separate fresh, source-read-only context. It may execute declared verification commands and write only ephemeral build/test output outside source-owned paths. | Exact implementation head, unchanged test package, verification plan. | Structured command results, test and coverage evidence where applicable, source-tree cleanliness proof, and exact-head binding. |
| `independent-review` | Existing strict independent-assurance boundary: fresh distinct reviewer, detached pinned view, read-only tools, sealed package. | Current Apply and verification evidence, base/head, manifest. | Existing schema-valid review result and lineage. |

Deterministic rules prevent the contexts from becoming ceremonial:

- `implement` cannot edit test-owned files. If it finds a defective or
  underspecified test, it emits `test-contract-challenge` with evidence. The
  graph returns to `author-tests` or pauses for a material requirements
  decision. A new test digest invalidates implementation and verification
  evidence that depended on the old digest.
- Red evidence must identify the new target failure and expected signature.
  “Some test failed” is insufficient because unrelated baseline failures could
  otherwise satisfy the gate.
- Green verification must run against the exact implementation head and exact
  test manifest. A source mutation during verification fails the unit.
- The verifier does not correct the code it evaluates. Objective failures route
  back to a new implementation attempt; material requirement failures pause.
- The independent reviewer remains separate from the verifier. Passing tests
  are computational evidence; review supplies inferential assurance.
- The first implementation is serial. Later parallel work is allowed only for
  read-only units or units with proven disjoint worktrees, write sets, merge
  ownership, and invalidation rules.

### Local durability contract

The kernel depends on a small port rather than storage-specific calls. Its
behavior includes `createRun`, `loadRun`, `acquireRunner`, `selectNextUnit`,
`recordAttemptStarted`, `recordAttemptOutcome`, `recordEvidence`,
`reconcileAttempt`, `projectStatus`, and `releaseRunner`.

The first local adapter should:

- retain run state under the repository Git common directory so removable
  worktrees do not own the only checkpoint;
- use a maintained file-locking primitive to hold one repository-wide mutating
  runner lock for the run session, with safe process-death recovery supplied by
  the locking implementation rather than a custom lease algorithm;
- write the canonical run snapshot with atomic replacement;
- create immutable, uniquely named attempt, evidence, and outcome receipts;
- record `started` before invoking a work unit and a terminal receipt only after
  result validation;
- on restart, reconcile a started attempt against its result artifact, Git
  state, external state, and idempotency key before retrying or advancing; and
- make the immutable history useful for audit and diagnosis without claiming
  that replaying it is a distributed exactly-once engine.

External side effects remain idempotent, inspectable adapters. A crash after a
GitHub mutation but before a local completion receipt is resolved by inspecting
the exact issue, pull request, Project item, or commit and recording the
already-completed outcome. The lock prevents a local race; reconciliation
handles the uncertain side-effect boundary.

### Swapping the runtime without swapping the domain

A later Restate, Temporal, or DBOS adapter may implement durable scheduling,
step persistence, timers, and multi-worker recovery. It must still call the
same domain transition functions and store the same logical identifiers,
packages, evidence bindings, outcomes, and status fields. Engine event history
is infrastructure evidence, not authorization or SDD completion evidence.

Adoption should be triggered by an observed requirement such as multiple
hosts, high availability, server-side scheduling while the local client is
offline, or repeated unrecoverable crash-mid-unit failures. It should not be
triggered solely by the existence of an engine or by a desire to remove the SDD
kernel.

### Proposal-ready first change

Recommended OpenSpec change name:
`establish-isolated-sdd-work-unit-execution`.

The first change should be one end-to-end local vertical slice, not the entire
GitHub delivery lifecycle. Its observable outcomes should be:

1. A versioned workflow definition can express the serial tests-first graph and
   reject missing, cyclic, or unauthorized dependencies.
2. Each work unit receives a sealed minimal package in a fresh context with a
   derived mutation boundary.
3. Test authoring produces exact red evidence and a test manifest before
   implementation begins.
4. Implementation cannot mutate the test manifest; a challenge follows the
   explicit repackage path.
5. Verification is source-read-only and produces exact-head green evidence.
6. Changed requirements, tests, head, commands, or configuration invalidate
   dependent evidence and select the earliest affected work unit.
7. Interruption between units resumes from persisted evidence; an interrupted
   in-flight attempt is reconciled before retry.
8. A concurrent mutating runner is refused with a stable, inspectable status.
9. Existing strict independent review can consume the exact-head Apply and
   verification evidence without weakening its isolation contract.
10. One status command reports current unit, evidence, reason, and next safe
    action from any linked worktree.

Likely affected assets are a new living capability for isolated work-unit
execution; deltas to bounded autonomous execution and SDD lifecycle; canonical
schemas for workflow, work unit, attempt, and evidence records; a local
`RunStore`; a context-dispatch interface; mutation/evidence validators; the TDD
workflow fixture; and restart, invalidation, concurrency, and cross-assistant
conformance tests. Exact filenames belong in the OpenSpec design, not in this
pre-proposal brief.

## 5. Scope, non-goals, constraints, dependencies, and risks

### Full-solution scope

- Consolidate the existing SDD lifecycle and operation vocabularies into one
  versioned outer graph.
- Allow lifecycle phases to contain typed work-unit subgraphs.
- Define immutable authorization/configuration snapshots and per-unit derived
  authority.
- Define packages, attempts, evidence, freshness, invalidation, outcome, and
  status contracts.
- Dispatch deterministic tools or fresh bounded model contexts through
  platform adapters.
- Integrate the existing independent-review dispatcher as the strictest work
  unit profile.
- Reconcile Git, GitHub, OpenSpec, and cleanup effects through typed adapters.
- Start with local single-writer durability and preserve a tested external
  runtime port.

### First-proposal scope

- The domain schemas and validators needed for work-unit execution.
- Local single-writer run persistence and restart reconciliation.
- Context dispatch and attestation for supported Claude and Codex exposure.
- The serial tests-first, implementation, and verification vertical slice.
- Current independent-review consumption of the resulting evidence.
- Canonical status for that vertical slice.

### Non-goals

- Building distributed leases, consensus, CAS, worker failover, or a replay
  engine.
- Adopting a hosted or clustered workflow engine in the first change.
- Replacing OpenSpec, Git, GitHub, current review contracts, or cleanup policy.
- Claiming that separate context alone proves independent review.
- Creating a new agent for every shell command or fragmenting work below a
  coherent objective and evidence boundary.
- Permitting one context to silently edit another context's owned artifacts.
- Multi-repository scheduling, arbitrary parallel writers, deployment/release
  automation, or remote branch deletion in the first proposal.

### Constraints

- OpenSpec specs remain the normative source for observable behavior.
- Assistant wrappers remain thin and point to canonical `skills/base/*`
  behavior.
- Product paths, branches, repositories, labels, identities, and credentials
  remain configured rather than embedded in reusable assets.
- Work packages and receipts exclude secrets, raw credentials, full
  transcripts, and chain-of-thought.
- Untrusted requirements, source, test output, review output, GitHub content,
  and engine history are treated as data rather than executable instruction.
- Every mutation requires run authorization, active runtime permission, and
  the narrower work-unit capability policy.
- A changed exact head or input digest invalidates dependent evidence.
- Dirty, unowned, ambiguous, primary, locked, or evidence-mismatched resources
  remain untouched.
- Strict OpenSpec validation and proportional tests/evals remain delivery
  gates.

### Dependencies

- Existing controller schema v4, checkpoint inspection, operation
  authorization, result classification, review contracts, GitHub helpers, and
  cleanup implementation.
- A cross-assistant context-launch adapter that can return a context ID,
  execution identity, applied permission profile, and owned result receipt.
- A maintained, license-compatible local locking dependency or platform
  primitive.
- A test repository/fixture with stable failing and passing cases and no
  production credentials.
- Owner confirmation of the recommended architecture and first-proposal
  boundary.

### Risks and mitigations

| Risk | Mitigation |
|---|---|
| A fresh context inherits hidden history or broad host permissions. | Require platform-specific context and capability attestation; classify unavailable rather than infer isolation. |
| Test authors encode implementation details or weak assertions. | Bind tests to observable requirements, require red evidence for the intended behavior, and retain independent review for quality judgment. |
| The implementer is blocked by an invalid test. | Provide a typed `test-contract-challenge` route; never allow silent test edits. |
| Too many contexts increase latency and cost. | Make a work unit a coherent objective with its own evidence boundary; do not split deterministic commands that need no model reasoning. |
| A process crashes after an external mutation. | Record intent first, use stable idempotency keys, inspect the exact external target, and reconcile before retry. |
| A file lock is mistaken for high availability. | State the single-writer guarantee explicitly and add a durable-engine adapter only when topology requires it. |
| Runtime abstraction becomes a lowest-common-denominator framework. | Keep the port limited to persistence, dispatch, and recovery primitives; keep SDD graph and evidence semantics above it. |
| Existing controller and checkpoint records diverge further during migration. | Introduce one versioned projection with compatibility readers and reject ambiguous legacy state rather than guessing. |
| Restate, Temporal, or DBOS creates licensing or operational surprises. | Require an official-doc, license, packaging, crash-recovery, and acceptance spike before selecting an external adapter. |

## 6. Open questions and blocking decisions

The recommendation is concrete, but these decisions should be confirmed or
resolved during OpenSpec Propose:

1. **Test ownership:** Confirm the recommended default that implementation
   contexts cannot edit test-owned files. All changes return through
   `test-contract-challenge` and create a new test-package revision.
2. **Fresh-context proof:** Define the exact Claude and Codex attestation that
   proves no prior transcript was supplied and the requested capability profile
   was applied. A new context ID alone may not prove both facts.
3. **Mutation enforcement:** Decide whether the first adapter enforces write
   sets through a sandbox, detached worktree plus post-run diff rejection, or
   both. The design requires deterministic rejection, not prompt compliance.
4. **Controller evolution:** Confirm whether schema v4 evolves in place to the
   canonical `RunRecord` or becomes a compatibility input to a new record. The
   recommendation is one successor schema with explicit v4 migration.
5. **Lock selection:** Select and review the maintained lock primitive. The
   proposal should specify observable acquisition, refusal, process-death, and
   recovery behavior without inventing its own distributed lease.
6. **Review reuse:** Decide whether one current exact-head review gates later
   non-code lifecycle transitions until a review-relevant input changes, as
   recommended in the original brief.
7. **External-engine threshold:** Define measurable triggers for a Restate or
   other adapter spike—for example, a second host, offline scheduling, high
   availability, or repeated reconciliation failures. Temporal `start-dev`
   should not be designated production infrastructure without explicit vendor
   support for that use.

None of these questions changes the central answer: smaller fresh contexts are
applicable to many tasks, while independent review remains a stronger and more
specific assurance boundary.

## 7. Recommended next step

Recommendation pending owner confirmation: accept Option D and run OpenSpec
Propose for `establish-isolated-sdd-work-unit-execution`, using this brief and
the linked research as inputs.

The proposal should deliver the local tests-first vertical slice and its
restart, mutation, invalidation, and status evidence. It should preserve the
runtime port but defer Restate, Temporal, or DBOS adoption until a measured
requirement exceeds the single-writer model. After that slice proves the
contracts, a later change can compile the full SDD lifecycle onto the same
kernel and another can qualify an external durable-runtime adapter if needed.

No OpenSpec artifacts, GitHub records, or implementation changes were created
by this brief.
