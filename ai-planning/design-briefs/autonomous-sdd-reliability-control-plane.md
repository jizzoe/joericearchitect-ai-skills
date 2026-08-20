# Autonomous SDD Reliability Control Plane

Date: 2026-08-16

Last updated: 2026-08-19

Status: Owner-directed big-picture architecture draft under review. The owner
confirmed the deterministic control-plane direction, durable isolated work
units, future Temporal expandability, the multi-agent operating model, and the
two-master-document refactor. Named open decisions remain unresolved. This
brief does not authorize OpenSpec Propose, Apply, GitHub mutation, archival, or
implementation.

## Document role

This is the main design document for the autonomous SDD reliability control
plane. It owns the whole-system outcome, architecture, safety invariants,
agent roles, harness foundations, shared risks, and open decisions. The
[roadmap](../plans/autonomous-sdd-reliability-control-plane-roadmap.md) owns
only milestone/slice dependency mapping and execution order. Future detailed
slice briefs will own slice-specific implementation design after this big
picture is reviewed and accepted.

Until those detailed briefs exist, the planned-slice inventory in this
document preserves the current implementation direction. A planned filename
is not a link and does not claim that the brief, an OpenSpec change, or any
implementation exists.

## 1. Problem and desired outcome

The repository defines a strong intended autonomous SDD lifecycle and strict
independent-review boundary, but it does not yet provide one deterministic
runtime that executes that lifecycle. Policy is distributed across skills,
workflow prose, request resolution, two durable-state shapes, authorization
helpers, review transports, recovery helpers, and model-driven tool calls.
Individual components are well guarded, but their composition is ambiguous.
Different runs can therefore select different helpers, inspect different
worktrees or configuration sources, request approvals at different points, or
classify the same reviewer outcome differently.

The desired outcome is a truly unattended, fail-closed SDD delivery path that
can complete an authorized five-slice milestone over a multi-hour run when all
objective gates pass. It should ask for no routine owner approvals, stop only
for a material decision or a real unrecoverable gate, resume idempotently after
interruption, preserve unrelated dirty work, and make every stop explainable
from one canonical durable record.

Success means that autonomy and rigor reinforce each other: scripts own state
selection, transition ordering, authorization, tool transport, retries, and
evidence binding; models own bounded planning, implementation, verification,
and independent review within those fixed transitions.

## 2. Evidence and key findings

### Intended behavior is coherent

- [Autonomous SDD lifecycle](../../workflows/autonomous-sdd-lifecycle/workflow.md)
  defines the intended Issue-to-cleanup sequence, current-evidence gates,
  objective correction, exact-head rereview, and routine autonomous
  continuation.
- [Autonomous goal runner](../../skills/base/autonomous-goal-runner/SKILL.md)
  separates authorization, runtime permission, evidence, and human decisions,
  and directs objective failures into bounded correction instead of routine
  owner prompts.
- [Authorization policy](../../skills/base/autonomous-goal-runner/references/authorization-policy.md)
  requires exact targets, derived durable records, idempotent recovery, and
  strict independent review before production delivery.
- [Independent review](../../skills/base/independent-review/SKILL.md) and its
  [protocol](../../skills/base/independent-review/references/protocol.md) define
  a sealed immutable package, a fresh distinct reviewer, a read-only inner
  boundary, a fixed parent transport, owned final-result evidence, and
  fail-closed acceptance.

The target behavior is therefore not the main ambiguity. The ambiguity lies in
which executable component is authoritative at each boundary and how those
components exchange state.

### Initial sweep: structural reliability gaps

1. **There is no executable orchestration loop.**
   [autonomous-sdd-controller.mjs](../../scripts/sdd/autonomous-sdd-controller.mjs)
   creates, inspects, advances, and persists records, but it does not select and
   invoke phases, derive targets, launch review, reconcile GitHub state, loop to
   the next checkpoint, or run to a terminal state. The thin
   [autonomous-sdd-delivery skill](../../skills/base/autonomous-sdd-delivery/SKILL.md)
   tells the model to run the first incomplete phase, while workflow prose says
   control should return for continuation. No deterministic engine enforces
   that re-entry.

2. **Multiple incompatible records are treated as authoritative.** The
   controller uses eight broad phases and accepts a selected-entry string with
   `{current: true}` evidence. The
   [delivery checkpoint](../../scripts/sdd/checkpoint.mjs) uses seven external
   lifecycle steps, a structured selected entry, typed durable records, and
   `{present: true, current: true}` evidence. There is no canonical run record,
   validated projection, or linkage between them.

3. **Resolved delivery authorization is not a valid generic run policy.** A
   direct resolver-to-validator probe reports `missing-objective`,
   `missing-work-selection`, `missing-forbidden-actions`,
   `missing-stopping-conditions`, and `missing-evidence`. The
   [delivery resolver](../../scripts/sdd/resolve-sdd-delivery-request.mjs) and
   [run-policy validator](../../scripts/sdd/validate-run-policy.mjs) therefore
   implement different authoritative authorization schemas.

4. **An ordered queue authorizes only its first entry's brief.** The resolver
   preserves all queue names under `target.entries`, but
   `deliveryPreparation`, `targets`, and the brief output path are generated
   only for entry zero. Advancing the controller to a later entry can therefore
   produce an unauthorized next brief or force model-side scope invention.

5. **The controller does not validate its own redundant state.** A direct
   probe changed `currentPhase`, reversed `queueEntries`, and changed
   `queueIndex`; inspection still returned `propose` as the next phase. There
   is also no run identifier, revision, compare-and-swap update, lease, attempt
   identifier, typed pause state, or event ledger. Atomic file replacement
   prevents torn JSON but not concurrent last-writer-wins corruption.

6. **Run discovery is location-dependent.** Controller records are stored
   inside the selected worktree, and no primary run registry binds repository,
   worktree, branch, change, and checkpoint. The main worktree can report no
   active OpenSpec change while a linked worktree contains the active change
   and paused controller. A model that inspects only its current directory can
   incorrectly conclude that work is absent, complete, or failed.

7. **The normal correction path is not available to the SDD profile.** The
   operation checker supports `objective-correction` only under
   `local-implementation`; `sdd-delivery` does not permit it, and the delivery
   resolver creates no linked local-implementation authorization. This
   conflicts with the autonomous goal runner's requirement to correct bounded
   objective findings automatically.

8. **Lifecycle vocabularies are not shared.** Resolver actions such as
   `merge-implementation-pr`, `sync-pr`, `merge-sync-pr`, and
   `merge-archive-pr` do not match checker actions such as `merge-pr`,
   `sync-change`, `archive-change`, and
   `delete-merged-topic-branch`. The resolver's `lifecycle.allowed` list is not
   consumed by the operation checker, so it is descriptive rather than an
   enforced permission boundary.

9. **Configuration has two mutually incompatible schemas.** The validated
   [repository configuration](../../config/ai-skills.json) supports a nested
   `independentReview` object, while the operation checker reads undeclared
   top-level `independentReviewer`, `degradedIndependentReviewer`,
   `requiredOpenSpecArtifacts`, and `reviewRepositoryPath` fields. A checker-
   compatible object is rejected by
   [the config validator](../../scripts/validation/validate-base-skill-contracts.mjs),
   and no canonical loader maps the validated shape into the checker shape.
   The configured `designBriefRoot` is also `docs/design-briefs`, while current
   repository practice and the resolver use `ai-planning/design-briefs`.

10. **Review transport is a prepared contract, not an integrated runtime.**
    [platform-review-adapters.mjs](../../scripts/sdd/platform-review-adapters.mjs)
    can build and consume the fixed strict parent request, and
    [review-launcher-recovery.mjs](../../scripts/sdd/review-launcher-recovery.mjs)
    can validate callback-driven recovery. Production code does not provide a
    host dispatcher that calls those helpers from the controller. The model is
    still responsible for choosing the helper, making the exact escalated tool
    call, preserving runtime state, and routing its receipt.

11. **Strict review is checked at the wrong abstraction boundary.** The
    operation checker applies the production independent-review gate to every
    high-impact action. A direct Archive probe with an already-completed merge
    and Sync stops at `independent-review-input-incomplete`, even though the
    canonical workflow describes review after Apply and after a changed head.
    This can require separate transition-bound review records for merge,
    Archive, and branch deletion without a code change, adding latency and
    failure opportunities without increasing exact-head assurance.

### Second sweep: false positives, inconsistencies, and missing proofs

1. **The authorization checker accepts semantically wrong records.** A direct
   probe authorized `issue-create-or-update` against a durable branch record.
   Kind-to-operation matching exists for named lifecycle actions but not for
   issue, Project, or draft-PR mutations.

2. **Sync can ignore an explicit stale-evidence signal.** A direct probe passed
   `evidenceCurrent: false` for `sync-change` and was authorized because Sync
   is excluded from the high-impact freshness check. Its durable record was
   current, so the contradictory request field was silently ignored rather
   than rejected.

3. **Approval behavior is split across unused evaluators and prose.**
   `checkDeliveryPreapproval` encodes interactive-only decisions but has no
   production call site. Autonomous authorization is handled separately.
   Choosing the wrong helper can yield a false just-in-time approval or a false
   preapproval failure even when the autonomous run already authorizes the
   exact transition.

4. **Prototype semantics disagree.** The request resolver maps the prototype
   shorthand to strict-first-degraded independent review and retains the
   independent-review quality gate, while the quality model and
   [prototype same-session brief](prototype-rapid-same-session-review.md)
   describe a lighter same-session local review. Until one profile matrix is
   authoritative, the same shorthand can take different paths.

5. **Failure classification is not exhaustive by construction.** Review
   adapters emit stable unavailable codes, but recovery eligibility is a
   separately maintained allowlist. The observed
   `review-launcher-codex-result-artifact-missing` outcome was initially absent
   from that list, so the controller treated a transport symptom as
   non-recoverable. An unmerged branch adds the code, but that is an interim
   routing patch rather than proof that a real multi-step result is delivered.

6. **Current tests validate components, not the composed promise.** All 151
   targeted controller, authorization, lifecycle, review, recovery, and
   adapter tests passed during this analysis. The direct cross-contract probes
   above still found invalid behavior. Fixtures manually create durable state
   and successful artifacts, so they do not prove that a real orchestrator can
   create that state, survive restarts, or complete a multi-step reviewer run.

7. **There is no acceptance test for the owner's outcome.** The suite has no
   executable zero-owner-prompt delivery, no five-entry queue run, no
   interrupt-and-resume matrix, no concurrent-run conflict test, no worktree-
   relocation test, and no multi-hour soak with partial GitHub state. It also
   has no conformance tests proving that resolver output is accepted by the run
   validator, validated config is consumable by the reviewer gate, every
   emitted failure code has exactly one retry/pause disposition, or every
   operation requires the correct record kind.

8. **Observability cannot distinguish failure from discovery failure.** There
   is no canonical status command that reports `running`, `retryable
   infrastructure`, `quality-blocked`, `waiting for human judgment`,
   `configuration discovery gap`, or `complete` from all worktrees and external
   records. This encourages the model to infer status from partial filesystem
   searches and transient transcripts.

### Existing design-brief coverage and disposition

| Existing brief | Coverage | Recommended disposition in this design |
|---|---|---|
| [Isolated autonomous independent review](archived/isolated-autonomous-independent-review.md) | Sealed package, distinct reviewer, immutable exact-head evidence | Retain as the assurance foundation. |
| [Authorized degraded independent review](archived/authorized-degraded-independent-review.md) | Explicit reduced-assurance fallback after strict unavailability | Retain, but route through one dispatcher and failure registry. |
| [Independent-review result transport reliability](archived/independent-review-result-transport-reliability.md) | Owned final artifact and transcript rejection | Retain; its contract is necessary but not proven for real multi-step review. |
| [Independent-review worktree lifecycle and diagnostics](archived/independent-review-worktree-lifecycle-and-diagnostics.md) | Exact detached-view ownership and safe diagnostics | Retain and integrate with admission readiness and the canonical run record. |
| [Autonomous SDD continuation default](archived/autonomous-sdd-continuation-default.md) | Request resolver and controller primitives | Treat as the v1 foundation to consolidate, not as a complete runner. |
| [SDD post-Archive workspace cleanup](archived/sdd-post-archive-workspace-cleanup.md) | Exact-owned clean resource cleanup | Retain its safety policy and make it a terminal control-plane transition. |
| [Strict review multi-step artifact delivery](strict-review-multistep-artifact-delivery.md) | Reproduced missing terminal artifact on real multi-step reviews | Required review-transport workstream and live acceptance gate. |
| [Independent-review configuration provenance](independent-review-configuration-provenance.md) | Wrong-source reviewer discovery and false absence | Expand into the canonical runtime-config loader and immutable run snapshot. |
| [Independent-review inspection-environment fallback](independent-review-inspection-environment-fallback.md) | Missing inspection tools in restricted review environments | Keep conditional; prefer host-owned semantic inspection before adding shell-environment tiers. |
| [Prototype-rapid same-session review](prototype-rapid-same-session-review.md) | Prototype profile disagreement | Resolve inside one generated profile-and-gate matrix. |
| [SDD milestone/slice delivery skill](sdd-milestone-slice-delivery-skill.md) | Milestone cadence and slice planning | Make it a downstream client of the stable runner, not another orchestrator. |
| [SDD lifecycle hygiene and brief provenance](sdd-lifecycle-hygiene-and-brief-provenance.md) | Cross-worktree inventory and durable brief provenance | Reuse its inventory/provenance decisions in the run registry; avoid a parallel status model. |

The existing briefs cover most observed symptoms. What is missing is the
overarching composition contract that makes those solutions operate as one
deterministic system.

## 3. Options considered and tradeoffs

### Option A: Tighten skill prose and prompts

Clarify which directory, helper, and state file the model should inspect at
each step.

- Lowest implementation cost.
- Useful as temporary guidance.
- Cannot enforce re-entry, atomic transition ownership, schema compatibility,
  exact tool transport, or concurrency safety.
- Leaves consistency dependent on model interpretation and context retention.

### Option B: Continue patching individual failure codes and validators

Add missing recovery codes, more controller checks, and more unit fixtures as
each failed run is observed.

- Produces quick relief for known failures.
- Preserves current component boundaries.
- Expands duplicated vocabularies and state projections.
- Cannot prove unattended composition and is likely to move failures to the
  next untested boundary.

### Option C: Build a deterministic SDD reliability control plane

Create one executable transition engine, one canonical run schema, one runtime
configuration loader, one typed operation graph, and one exhaustive outcome
registry. Reuse the existing bounded helpers behind typed adapters.

- Directly addresses nondeterministic selection and false status conclusions.
- Makes approvals, retries, pauses, and review transport testable without
  relying on model memory.
- Enables restart, queue, and soak testing against the actual execution path.
- Requires a staged migration and careful compatibility with active v1 runs.
- Is the recommended option.

### Option D: Move orchestration to an external CI or workflow service

Implement the state machine outside the assistant runtime.

- Offers strong scheduling, leases, logs, and resumability.
- Adds service credentials, infrastructure, remote-state reconciliation, and a
  larger security surface before the local contract is stable.
- Could become a later adapter, but should not define the first canonical
  semantics.

## 4. Decisions, assumptions, and owner

- Decision owner: Joe Rice.
- Confirmed owner outcome: support truly autonomous spec delivery across about
  five milestone slices for several hours, with strict automated guardrails,
  no routine approvals when the bounded authorization and quality gates pass,
  and pauses only for real failures or human judgment.
- Confirmed safety constraint: preserve unrelated dirty work and clean up only
  exact target-owned, clean, confirmed-delivered branches and worktrees.
- Confirmed owner direction: select Option C as the big-picture planning
  direction and make prompt/brief fixes subordinate to an executable control
  plane. Exact schema, storage, provider, and rollout decisions remain open
  where named below.
- Confirmed owner direction: represent milestone delivery as durable isolated
  child work units and preserve a backend-neutral seam for an optional future
  Temporal execution backend.
- Confirmed owner direction: separate planning, test-and-evidence,
  implementation, independent-review, and closeout responsibilities through
  explicit durable handoffs.
- Assumption: strict independent review remains mandatory for
  `production-rapid`; reliability improvements must not accept transcripts,
  self-review, stale heads, mutable packages, or unverifiable results.
- Assumption: the first reliable release may target one local repository and
  configured GitHub lifecycle before adding cross-repository milestone slices.
- Assumption: existing archived review and cleanup contracts remain valid
  unless a conformance test proves an incompatibility.

### Planning provenance and profile rationale

The pre-refactor roadmap was derived from the 2026-08-16 version of this brief
with SHA-256 digest
`2ef29f4a34eb5d2b90afe5d5b9a242a0a566592ac75608c46b3aa42c2dda46ce`.
The 2026-08-19 refactor moved its cross-cutting design here and retained its
slice-specific direction in Section 7. The digest is historical provenance, not
a claim that the current refactored brief has the same content hash or that any
OpenSpec work is authorized.

Every planned slice independently defaults to `production-rapid`. The rationale
is retained here so later slice briefs do not lose why their data, exposure,
review, and recovery requirements are strict:

| Candidate slices | Data rationale | Exposure rationale | Recovery rationale |
|---|---|---|---|
| M1-S1 through M1-S3 | Internal schemas and safe configuration metadata | Reusable global authorization, role, handoff, and review contracts | Contract drift can incorrectly permit or block later actions; strict review and reversible migration are required. |
| M2-S1 through M2-S3 | Local run, event, lease, claim, handoff, and status records | The engine controls repository mutation and worker sequencing | Restart and concurrency defects can corrupt authoritative state; fail-closed recovery is required. |
| M3-S1 through M3-S3 | Sealed review packages and safe evidence metadata | Production assurance and reviewer transport boundary | A false pass or false unavailable result changes delivery eligibility; strict exact-head evidence is required. |
| M4-S1 through M4-S3 | Repository, GitHub, OpenSpec, branch, and worktree state | Real external and destructive lifecycle transitions | Every mutation must be exact, idempotent, and recoverable without touching unrelated work. |
| M5-S1 and M5-S2 | Approved roadmap/brief metadata and normalized run inputs | Global queue and shorthand entrypoints | Thin adapters must be reversible and must not duplicate or widen engine authority. |
| M6-S1 through M6-S3 | Disposable qualification evidence, harness metrics, and safe diagnostics | Default routing for autonomous SDD delivery | Audit-mode rollback and retained failure evidence are required before and after cutover. |
| M7-S1 | Temporal history, safe workflow metadata, worker handoffs, and backend projections | Optional external durable-execution service and workers | Temporal remains optional, preserves contract parity, shares claim authority, and never exposes credentials or creates a second state authority. |

### Recommended architecture

![Autonomous SDD reliability control-plane architecture showing inputs, the deterministic orchestration core, lifecycle adapters, evidence return, and evidence-driven outcomes](assets/autonomous-sdd-reliability-control-plane.png)

The diagram is explanatory; the written contracts and their validated schemas
remain normative. The transition engine selects exactly one next action, every
adapter returns durable evidence to the shared ledger, and the evidence—not
model inference—determines whether the run continues, retries, corrects and
rereviews, pauses for human judgment, or completes.

1. **Canonical backend-neutral run-v2 schema family.** Distinguish parent runs,
   child work units, transition attempts, and resource claims rather than
   collapsing their ownership into one monolithic record. Include immutable
   identities and bindings, schema version, monotonic revision,
   authorization/configuration snapshots and digests, repository/worktree
   locators, ordered dependencies, typed state, budgets, attempts, evidence,
   review lineage, external records, cleanup ownership, timestamps, deadlines,
   selected execution backend, authoritative-history choice, and validated
   projection references.

2. **One executable transition engine.** A command accepts a normalized
   delivery request or resumes a run ID, performs admission, selects exactly
   one next transition, invokes its fixed adapter, validates and atomically
   records the outcome, then continues until complete, expired, or genuinely
   paused. Generated skills become thin entry adapters to this engine.

3. **One typed operation graph.** Define operation names, allowed profiles,
   required target and record kinds, prerequisites, evidence freshness,
   recovery, review gate, approval policy, and terminal outcomes in one schema.
   Generate or validate the resolver vocabulary, authorization checker,
   lifecycle documentation, and matrix tests from it.

4. **One configuration loader and run snapshot.** Resolve repository defaults,
   runtime reviewer identity, adapters, paths, and policy precedence once at
   admission. Validate the same shape consumed by every gate, record safe
   provenance and a digest in the run, and prohibit later directory or source
   guessing.

5. **Admission readiness before implementation.** Prove exact repository and
   worktree discovery, OpenSpec and Git versions, GitHub credential/capability
   availability when needed, branch and merge constraints, parent Auto-review
   transport, reviewer executable identity, multi-step owned-result delivery,
   required inspection capabilities, cleanup-record destination, and enough
   remaining run time. A strict-only run should fail before Apply when its
   mandatory review path cannot work.

6. **One review dispatcher and exhaustive outcome registry.** The dispatcher
   owns strict launch, receipt consumption, exact-head invalidation, bounded
   objective correction, rereview, authorized degraded fallback, and terminal
   evidence. Every emitted code must map exactly once to retry, correction,
   degraded eligibility, human decision, or terminal failure. Existing
   multi-step artifact, configuration-provenance, and inspection-environment
   briefs become sequenced implementation inputs.

7. **Review once per code head and assurance contract.** Bind a successful
   review to current Apply evidence, immutable package, and exact head, then
   reuse it across later non-code lifecycle transitions while their own state
   evidence remains current. Any code-head or relevant artifact change
   invalidates it and triggers affected validation plus rereview. This avoids
   redundant reviewers at Archive and cleanup without weakening the code
   assurance boundary.

8. **Canonical status and recovery interface.** Resolve run state from the
   registry rather than the current directory and emit a concise status with
   exact evidence: running, retryable infrastructure, quality-blocked,
   waiting-human, configuration-discovery-gap, expired, or complete. Include
   the next safe transition and never infer failure solely from a missing file
   in the current worktree.

9. **Milestone adapter after single-change reliability.** Convert an approved
   milestone plan into immutable queue entries with per-slice brief paths,
   dependencies, target scope, and evidence. The adapter submits entries to the
   same engine; it does not duplicate lifecycle policy.

10. **Composition-first verification.** Add schema conformance tests, a
    model-independent fake-adapter end-to-end run, real Codex multi-step review
    acceptance, interruption/restart tests at every transition, concurrent
    runner tests, stale-head and partial-external-state recovery, worktree
    discovery tests, exact prompt-count assertions, and a disposable five-slice
    soak. Unit tests remain necessary but are not release evidence for
    unattended delivery.

### Durable execution and backend portability

The design separates four ownership scopes:

- A **parent run** owns milestone intent, ordered child dependencies, global
  deadline, selected execution backend, and summaries of child terminal state.
- A **work unit** owns exactly one slice and its authorization/configuration
  digests, role handoffs, lifecycle state, attempts and correction budget,
  evidence/artifact namespace, derived targets, resource ownership, and cleanup
  result.
- A **transition attempt** owns one stable attempt ID and idempotency key,
  target and precondition digests, backend fence, write-ahead state, adapter
  receipt, and retry or reconciliation outcome.
- A **resource claim** serializes conflicting work across runs and work units
  using canonical repository identity, exact conflict scope, owner, fencing
  epoch, expiry, and release or recovery evidence.

The backend owns durable scheduling, authoritative execution history, replay,
timers, and delivery of transition work. Backend-neutral domain contracts own
authorization, operation semantics, evidence validity, review assurance,
cleanup safety, role permissions, and terminal classifications. Every admitted
run immutably selects one backend and one authoritative history. Repository-
visible registries and status indexes are rebuildable projections and never
compete with that history for control authority.

Resource-claim coordination is a separate repository-scoped authority rather
than a history projection. Repository configuration selects one claim provider
and safe identity; every admitted run snapshots the binding and records claim
request, acquisition, renewal, fencing, release, and recovery receipts in its
own history. All active local and future-backend workers for the repository use
the same provider. Changing providers while runs or claims are active fails
closed.

The first backend is local and must prove the contract through a discoverable
registry, append-only ledger, atomic revision updates, leases, fencing, and
compare-and-swap behavior. These are local implementation choices, not
requirements imposed on every future backend. Before finalizing that design,
Explore must compare bespoke local primitives with an existing local-first
durable-execution substrate and the actual single-writer/concurrent-run threat
model. The decision and rejected alternatives must be recorded rather than
assuming that a custom lease/ledger is automatically the safest choice.

Temporal remains an optional post-qualification adapter. A future Temporal
backend may map the parent to a parent Workflow, work units to child Workflows,
and bounded external operations to idempotent Activities. Temporal Event
History is then the sole authoritative execution history for that run;
repository status is a projection. It must not duplicate Temporal scheduling,
retry, or transition ownership locally, and it must use the repository's
active resource-claim authority so local and Temporal runs cannot both acquire
an overlapping claim. Live backend migration is forbidden until a separate
design proves it safe.

### External-operation recovery contract

Every external mutation declares stable identity, exact target and
preconditions, required resource claims, authorization, runtime permission,
and its observe-before-retry procedure before invocation. Its attempt moves
through durable `prepared`, `in-flight`, `observed`, `committed`, or `in-doubt`
states. A crash after remote success but before local receipt persistence must
reconcile from authoritative external state; an unobservable or conflicting
outcome becomes `in-doubt` and pauses instead of blindly repeating the write.
Stale fences, wrong target kinds, expired authority, or mismatched claims
cannot invoke or commit the operation.

### Multi-agent operating model

The control plane coordinates role-bounded work units rather than asking one
model session to remember and perform the entire lifecycle. Roles describe
authority and handoff contracts; they do not require five permanently running
processes or different model vendors.

| Role | Owns | Must not do |
|---|---|---|
| Planning agent | Proposal, detailed slice design, requirements, acceptance criteria, and task plan | Implement production code or approve its own planning output |
| Test-and-evidence agent | Requirements-to-evidence map and initial failing unit, integration, fault, lifecycle, or acceptance tests | Quietly weaken requirements or make product/architecture decisions |
| Implementation agent | Production changes and narrowly scoped supporting tests until the approved evidence suite passes | Delete, bypass, or weaken acceptance evidence to manufacture a pass |
| Independent-review agent | Fresh, isolated, read-only review of the exact applied head, artifacts, and evidence | Write code, approve itself, accept transcript-only output, or review a stale head |
| Closeout agent | Implementation delivery, Sync, Archive, issue/Project convergence, and exact-owned cleanup | Change implementation behavior after review/Verify without returning through the gates |

The first reliable release uses a durable serial handoff:

```text
admission
  -> planning
  -> planning review and Apply authorization
  -> test-and-evidence receipt
  -> implementation and focused/broad verification evidence
  -> independent review of the exact current head
  -> bounded objective correction and rereview when required
  -> OpenSpec Verify
  -> closeout
```

The test-and-evidence role is broader than a unit-test writer because recovery,
concurrency, cleanup safety, external reconciliation, and backend parity need
integration, fault-injection, and end-to-end proof. The implementation role may
add implementation-local unit coverage but cannot unilaterally change the
requirements-derived evidence contract. Any justified evidence change returns
to the planning/test boundary and receives a new durable receipt.

Reviewer capability admission happens before Apply for strict delivery so the
run does not implement work that cannot satisfy its mandatory assurance path.
The actual independent review occurs only after current Apply evidence exists.
It is a separate gate consumed by Verify; it is not OpenSpec Verify itself.
Closeout starts only when current review, CI where required, and Verify evidence
agree on the exact head and artifacts.

Each handoff records the run and work-unit identity, role and execution
identity, immutable input digests, allowed tools/capabilities, workspace and
head binding, produced artifacts/evidence, result classification, timestamps,
and next permitted transition. A later worker rereads the durable receipt and
authoritative repository state rather than relying on conversation history.

Parallel role execution is conditional, not a default. It may be enabled only
when file/workspace ownership, resource claims, integration order, and recovery
are mechanically proven. The initial test-to-implementation sequence is serial
to avoid two agents racing in one worktree or allowing implementation behavior
to shape the acceptance contract.

### Harness-engineering foundation

The control plane treats useful agent behavior as a property of the model plus
its surrounding context, tools, state, boundaries, and feedback loops. The
following are architecture requirements, while a later focused harness-
engineering review may refine their implementation:

1. **Progressive, repository-owned context.** Thin entrypoints act as maps to
   the main design, roadmap, selected slice brief, OpenSpec artifacts, current
   run records, and exact evidence. Durable repository sources outrank chat
   memory. Workers receive only the role-relevant subset plus named links to
   deeper sources.
2. **Computational controls before model judgment.** Schemas, types, linters,
   structural checks, deterministic probes, tests, permission checks, and
   evidence freshness run before expensive or inferential review. Models make
   bounded judgments only where deterministic controls cannot decide.
3. **Capability-scoped tools.** Every role receives the smallest tool and
   mutation surface needed for its operation. Tools accept validated structured
   inputs, return typed receipts, expose recovery semantics, and never broaden
   authorization.
4. **Legible environments.** Repository state, worktrees, OpenSpec, GitHub
   linkage, logs, status, and test results must be directly inspectable by the
   worker. Missing visibility is classified as an environment or discovery gap,
   not guessed as product failure.
5. **Mechanical architecture and quality invariants.** Rules that must hold
   repeatedly become executable validators, conformance suites, or structural
   tests with actionable failure output. Documentation explains the rule but
   is not its only enforcement.
6. **Closed feedback loops.** Every check or reviewer finding returns to the
   owning role through a typed disposition. Objective failures receive bounded
   correction and affected evidence is rerun; material decisions pause for the
   owner. A pass requires evidence, not an attempted command or persuasive
   summary.
7. **Harness improvement from recurring failures.** Repeated defects or manual
   interventions become candidates for a clearer document, better tool,
   stronger invariant, new test/fixture, improved status signal, or simplified
   interface. The system records which harness component changed and which
   failure it is intended to prevent.
8. **Observability and operability.** Status exposes work-unit/role progress,
   transition timing, retries, corrections, prompt/owner-intervention count,
   reviewer availability, projection freshness, resource claims, leaked
   resources, and exact stop/resume reasons without leaking secrets.
9. **Continuous context hygiene.** A later maintenance process checks broken
   links, stale instructions, duplicate policies, obsolete compatibility paths,
   missing ownership, and drift between documentation and executable behavior.
   Cleanup remains reviewable and never silently rewrites authoritative design.
10. **Replaceable workers and adapters.** Domain semantics do not depend on one
    model, assistant wrapper, local storage mechanism, or durable-execution
    backend. Replacement implementations pass the same role, tool, evidence,
    safety, and outcome conformance suites.

Harness health is measured, not assumed. Qualification should track at least
completion and false-pass rates, routine owner prompts, human-decision pauses,
retry/correction counts, repeated failure signatures, recovery time, stale or
missing context incidents, reviewer launch/result failures, evidence gaps,
resource leaks, and documentation/invariant drift. Exact rollout thresholds
remain an owner decision.

## 5. Scope, non-goals, constraints, dependencies, and risks

### Scope

- Canonical autonomous-run schema, registry, event ledger, lease, and
  migration from compatible v1 controller/checkpoint state.
- Deterministic single-repository transition engine from brief/Propose through
  cleanup.
- Shared authorization, operation, target-kind, evidence, approval, review,
  and outcome vocabularies.
- Runtime configuration loading, provenance, immutable snapshot, and status
  discovery across linked worktrees.
- Strict/degraded review dispatch, readiness, recovery, and exact-head reuse.
- Durable role identities and handoffs for planning, test/evidence,
  implementation, independent review, and closeout.
- Progressive context delivery, capability-scoped tools, mechanical
  invariants, evidence feedback loops, harness-health observability, and
  documentation hygiene.
- End-to-end, restart, concurrency, fault-injection, prompt-count, multi-step
  reviewer, queue, and soak verification.
- Later integration of milestone/slice planning as a client of the engine.
- A backend-neutral seam and post-qualification option for Temporal without
  making Temporal a first-release dependency.

### Non-goals

- Weakening strict independent-review evidence or treating a transcript as a
  result.
- Automatically resolving product, architecture, security, legal, or other
  material human decisions.
- Force-cleaning dirty worktrees, deleting unowned resources, rewriting
  history, or changing credentials and permission scopes.
- Cross-repository or deployment/release autonomy in the first control-plane
  release.
- Replacing OpenSpec, GitHub, Git, or the existing bounded skills with a new
  planning system.
- Treating multi-agent execution as unrestricted parallel editing or assuming
  that more agents automatically improve outcomes.
- Treating unit tests alone as proof of requirements that need integration,
  fault, lifecycle, security, or acceptance evidence.
- Automatically changing prompts, tools, policies, or documentation from
  telemetry without a reviewable bounded change.
- Preserving every v1 implementation detail when a validated v2 projection is
  simpler and safer.

### Constraints

- Assistant wrappers remain thin and point to canonical `skills/base/*`
  behavior.
- Reusable assets contain no product-specific constants, credentials, or
  absolute local paths.
- External actions remain exact, idempotent, evidence-gated, and limited by
  both run authorization and active runtime permission.
- A changed head invalidates current code review; material findings and
  exhausted correction budgets still pause.
- Existing dirty user work and unrelated branches/worktrees must remain
  untouched.
- OpenSpec strict validation remains a delivery gate.

### Dependencies

- Existing isolated/degraded review, review-result transport, worktree
  lifecycle, controller, operation checker, GitHub lifecycle, and cleanup
  implementations.
- The open strict multi-step artifact-delivery and configuration-provenance
  decisions.
- An owner decision on review reuse, canonical registry ownership, and rollout
  acceptance thresholds.
- A disposable test repository or fixture service capable of exercising merge,
  Sync, Archive, issue/Project reconciliation, and cleanup without production
  impact.

### Risks and mitigations

| Risk | Mitigation |
|---|---|
| A large redesign hides new defects | Deliver in contract-first slices with compatibility fixtures and a shadow/audit mode before mutation. |
| A centralized engine becomes over-privileged | Keep adapters capability-scoped; evaluate authorization and runtime permission before every transition. |
| A lease strands a run after process death | Use expiring leases with revision-bound recovery and evidence reread before takeover. |
| Review reuse accidentally accepts stale code | Bind reuse to exact package digest, head, Apply evidence, relevant artifact digests, and transition prerequisites. |
| Config snapshots retain sensitive data | Store only safe normalized capability metadata and digests; never persist credentials or raw environment. |
| Migration mistakes old worktrees for active runs | Inventory all worktrees, require exact v1 linkage, and classify ambiguous legacy state as audit-only. |
| Soak tests pass only with fake services | Require both deterministic fake-adapter coverage and a real strict multi-step reviewer acceptance run. |
| Separate agents race or shape each other's evidence | Use role-scoped work units, serial test-to-implementation handoff first, immutable receipts, and resource claims before allowing parallelism. |
| Tests pass while requirements remain unproven | Require a requirements-to-evidence map and permit unit, integration, fault, lifecycle, security, and acceptance proof according to behavior. |
| More context reduces agent accuracy | Use a thin entry map and progressive role-specific disclosure with durable sources and freshness checks. |
| Harness rules decay into advisory prose | Promote repeated invariants into executable checks and run documentation/context hygiene as a measured maintenance loop. |
| A bespoke local backend recreates distributed-systems failures | Validate the real concurrency threat model and compare existing local-first durable substrates before fixing the implementation design. |

## 6. Open questions and blocking decisions

- **Canonical registry ownership:** Should the primary run registry be
  repository-local, user-state-local with a repository pointer, or a small
  dual record with one canonical side and one validated projection? This must
  be decided before the v2 schema proposal.
- **Parent/work-unit boundary:** Confirm the exact parent-owned summaries and
  child-owned state so no parent projection can mutate or become authoritative
  over a child's transition history.
- **Local durability substrate:** Confirm the actual concurrent-writer threat
  model and whether the local backend should use bespoke ledger/lease/CAS
  primitives, an existing local-first durable engine, or a host-managed resume
  primitive. Record evidence and rejected alternatives before Propose.
- **Resource-claim authority:** Confirm where the repository-scoped claim
  provider lives, how it is discovered and fenced, and how provider switching
  is prohibited while runs or claims are active.
- **Review reuse boundary:** Confirm that one current exact-head production
  review should gate later merge, Sync, Archive, and cleanup transitions unless
  code or review-relevant artifacts change, instead of requiring a new reviewer
  record for every high-impact transition.
- **Configuration authority:** Confirm whether the sealed run request is the
  sole reviewer authority or whether a separately schema-validated product-
  owned runtime config may supply defaults before the immutable run snapshot is
  created.
- **Prototype profile:** Confirm whether `prototype-rapid` means same-session
  local review or strict-first authorized-degraded independent review. The
  shorthand, quality matrix, and checker must expose one meaning.
- **Admission policy:** Confirm that strict-only delivery should stop at
  admission, before implementation, when the real multi-step strict path is not
  ready.
- **Rollout threshold:** Define the required number and duration of clean
  unattended single-change and five-slice runs before the control plane becomes
  the default rather than shadow/audit mode.
- **Agent execution identities:** Confirm whether roles may reuse one model or
  session identity across transitions and which roles require a fresh isolated
  process. Independent review must remain distinct and isolated.
- **Test/evidence change authority:** Confirm the narrow cases in which an
  implementation-discovered requirement ambiguity may return to planning and
  revise the requirements-derived evidence contract.
- **Harness-health threshold:** Select the metrics and failure levels that
  block default cutover, including routine prompts, false passes, repeated
  failure signatures, recovery time, resource leaks, and context drift.

These decisions block the exact OpenSpec requirements and schema, but they do
not block agreement on the systemic diagnosis or contract-first direction.

## 7. Planned slice design inventory

The roadmap sequences these slices. The planned filenames below reserve clear
destinations for later detailed design; every file is **not yet created**. The
current implementation direction remains in this section until each future
brief is created and reviewed.

Planned directory: `ai-planning/design-briefs/autonomous-sdd-reliability-control-plane/`

| Slice | Proposed OpenSpec change | Planned detailed brief |
|---|---|---|
| M1-S1 | `establish-autonomous-sdd-run-v2-contract` | `m1-s1-run-and-work-unit-contract.md` — not yet created |
| M1-S2 | `unify-autonomous-sdd-operation-contract` | `m1-s2-operation-profile-gate-and-outcome-contract.md` — not yet created |
| M1-S3 | `establish-autonomous-sdd-runtime-config-provenance` | `m1-s3-runtime-configuration-provenance.md` — not yet created |
| M2-S1 | `add-autonomous-sdd-local-execution-backend` | `m2-s1-local-durable-execution-backend.md` — not yet created |
| M2-S2 | `add-autonomous-sdd-transition-engine` | `m2-s2-deterministic-transition-engine.md` — not yet created |
| M2-S3 | `add-autonomous-sdd-run-status-and-recovery` | `m2-s3-run-status-and-recovery.md` — not yet created |
| M3-S1 | `harden-strict-review-multistep-artifact-delivery` | `m3-s1-strict-review-artifact-delivery.md` — not yet created |
| M3-S2 | `add-autonomous-sdd-review-admission-and-dispatcher` | `m3-s2-review-admission-and-dispatch.md` — not yet created |
| M3-S3 | `bind-autonomous-review-to-code-head` | `m3-s3-exact-head-review-and-correction.md` — not yet created |
| M4-S1 | `integrate-autonomous-sdd-github-delivery` | `m4-s1-github-intake-and-implementation-delivery.md` — not yet created |
| M4-S2 | `integrate-autonomous-sdd-sync-and-archive` | `m4-s2-sync-and-archive-delivery.md` — not yet created |
| M4-S3 | `integrate-autonomous-sdd-finalization-and-cleanup` | `m4-s3-finalization-and-cleanup.md` — not yet created |
| M5-S1 | `add-autonomous-sdd-milestone-slice-adapter` | `m5-s1-milestone-slice-queue.md` — not yet created |
| M5-S2 | `add-autonomous-design-brief-delivery-shorthand` | `m5-s2-design-brief-delivery-shorthand.md` — not yet created |
| M6-S1 | `qualify-autonomous-sdd-composition-reliability` | `m6-s1-composition-and-fault-qualification.md` — not yet created |
| M6-S2 | `qualify-autonomous-sdd-five-slice-soak` | `m6-s2-five-slice-unattended-qualification.md` — not yet created |
| M6-S3 | `enable-autonomous-sdd-control-plane-default` | `m6-s3-default-control-plane-cutover.md` — not yet created |
| M7-S1 | `add-autonomous-sdd-temporal-execution-backend` | `m7-s1-temporal-execution-backend.md` — not yet created |

### M1 — Contract convergence

- **M1-S1** defines the backend-neutral parent-run, child-work-unit,
  transition-attempt, and resource-claim records; v1 migration/projection;
  immutable backend/history and claim-authority binding; identities, revisions,
  snapshots, deadlines, budgets, evidence, review, external records, and
  cleanup ownership. It does not execute, lease, review, switch backends, or
  auto-migrate ambiguous legacy state. Acceptance rejects redundant/cross-unit
  state, validates one authoritative history and claim authority, preserves
  ambiguous v1 state as audit-only, and proves schema portability without a
  Temporal runtime.
- **M1-S2** makes one typed operation graph authoritative for names, target and
  record kinds, profiles, prerequisites, freshness, approval, review,
  correction, recovery, write-ahead state, idempotency, resource claims, and
  exhaustive outcomes. It does not perform external mutations or redesign
  review transport. Acceptance covers wrong-kind rejection, stale Sync,
  enforced resolver permissions, reachable bounded correction, no interactive
  preapproval in an autonomous grant, one disposition per error, and one
  reconciliation path per external operation.
- **M1-S3** establishes one validated immutable runtime configuration snapshot
  covering paths, reviewer/adapter identity, backend and claim-provider
  selection, evidence locations, attestations, source precedence, safe
  provenance, and redacted capabilities. Credentials, raw environment,
  user-specific absolute paths, and mutable standing authority remain excluded.
  Existing configuration-provenance work is an input. Acceptance proves that
  the validated shape is the consumed shape and that admission never guesses a
  later source.

M1 exits only when resolver output is valid run input, the schema family and
operation graph are authoritative, configuration is consumable, backend/history
and claim-provider bindings are singular, and every known cross-contract probe
exists as failing-before/fixed-after evidence.

### M2 — Deterministic local single-change execution

- **M2-S1** supplies the first local backend: discoverable registry outside
  removable worktrees, append-only history, projections, atomic revisions,
  lease/heartbeat/fencing/takeover, the local resource-claim provider, canonical
  worktree binding, and non-destructive v1 inventory. It does not invoke phases,
  delete legacy records, implement Temporal, or turn local mechanics into the
  portable contract. Acceptance covers competing writers, stale fences,
  restart/takeover, overlapping versus disjoint claims, provider-switch denial,
  deterministic claim order, moved/removed worktrees, cross-worktree discovery,
  and preservation of ambiguous state.
- **M2-S2** separates the deterministic next-transition function from backend
  scheduling/persistence and executes fixed adapters through durable attempt
  envelopes and write-ahead states. It starts with fake adapters around
  Propose, planning review, Apply, and Verify; real review, GitHub, Sync,
  Archive, and cleanup arrive later. Acceptance requires zero routine prompts,
  one owned transition, convergent replay, restart at every boundary,
  observe-before-retry after receipt loss, stale-fence rejection, and exact
  pause evidence.
- **M2-S3** provides read-only repository-wide status and one safe resume,
  no-op, or pause result. It distinguishes running, retryable infrastructure,
  quality-blocked, waiting-human, configuration-discovery-gap, expired,
  complete, and ambiguous legacy state while exposing backend/history,
  projection, evidence, Git/worktree, and OpenSpec linkage. It does not mutate
  or clean state. Reports must agree from every worktree and rebuild stale
  projections from authoritative history.

M2 exits with a fake-adapter single-change completion plus kill/restart,
stale-fence, concurrent-writer, cross-run claim, and worktree-discovery proof;
it makes no real external-mutation or production-review claim.

### M3 — Independent-review reliability

- **M3-S1** makes a real multi-step reviewer always produce one parent-owned,
  schema-valid terminal artifact or exact unavailable evidence through
  host-owned capture, deterministic terminalization, bounded transport,
  transcript rejection, cleanup, and live probes. Minimal, large-read, and
  genuinely multi-step reviews must all use the production dispatcher
  interface. Existing strict-review artifact work is an input and must be
  reconciled rather than duplicated.
- **M3-S2** adds strict-review admission and one dispatcher that owns launch,
  receipt consumption, recovery, allowed degraded fallback, and terminal
  evidence. Admission checks configuration, executable/adapter identity,
  parent transport, exact repository/view, multi-step delivery, inspection,
  runtime permission, deadline, and cleanup destination. It never asks the
  owner to relay commands or silently degrades strict-only work. An inspection-
  environment follow-up remains conditional on evidence that host semantic
  inspection is insufficient.
- **M3-S3** binds review and correction to exact Apply evidence, package,
  artifacts, and code head. Unchanged heads reuse current assurance across
  later non-code transitions; relevant changes deterministically invalidate it
  and trigger affected checks plus rereview. Objective findings correct within
  the durable per-signature budget; human decisions pause; transition-specific
  external evidence remains independently current.

M3 exits when strict readiness is proven before Apply, a real isolated reviewer
returns accepted exact-head evidence, correction/rereview needs no owner relay,
and unchanged code does not launch redundant reviewers.

### M4 — Full lifecycle integration

- **M4-S1** integrates exact GitHub issue, Project, branch, PR, check, merge,
  closure, status, receipt, and recovery operations with capability preflight,
  typed derived records, write-ahead/idempotency keys, field-level ownership,
  and observe-before-retry. It does not change credentials, protection rules,
  releases, deployments, or unrelated human content. External-success/local-
  receipt-loss injections must converge or pause `in-doubt` without duplication.
- **M4-S2** integrates exact delta-to-living-spec Sync, repeat no-op proof, Sync
  delivery, content-preserving Archive, Archive delivery, default-branch
  confirmation, claims for shared spec/archive destinations, and durable
  reconciliation. It does not invent requirements, resolve ambiguous spec
  conflicts, or archive before implementation and Sync delivery. Overlapping
  runs serialize and unchanged code reuses current review.
- **M4-S3** makes exact-owned finalization and cleanup terminal transitions:
  ownership is registered when resources are created; ineligible resources get
  recovery states; issue/Project/default branch/run status converge; durable
  history remains outside removable worktrees. It forbids broad cleanup,
  force-removal, reset/clean, and inferred legacy ownership. Dirty, unrelated,
  primary, locked, divergent, and ambiguous resources remain intact; partial
  cleanup resumes safely.

M4 exits only after a disposable real single-change lifecycle completes with
zero routine prompts, exact/idempotent/fenced/claimed external transitions,
receipt-loss recovery, current non-duplicated review, and preservation of all
unrelated or dirty resources.

### M5 — Milestone queues and owner shorthand

- **M5-S1** converts an approved milestone into a parent coordinating immutable
  dependency-valid child work units. Every child owns authorization/config,
  deadline, budget, brief and target, artifacts/evidence, backend reference,
  claims, lifecycle, result, and cleanup; the parent owns order and projections.
  The adapter never duplicates lifecycle policy or chooses product priority.
  Five-unit fixtures must preserve isolation through restart, pause, expiry,
  corruption, dependency failure, and projection rebuild.
- **M5-S2** makes `implement design brief <name>` a thin deterministic input
  resolver: display defaults and overrides, resolve an exact brief, resume an
  existing run or enter Propose once, seal profile/review/expiry inputs, and
  return a run ID. It creates no second runner, hidden default, standing
  authority, fuzzy selection, or gate bypass, and Claude/Codex wrappers must
  normalize identically.

M5 exits when five slices execute in dependency order through one engine,
child state cannot leak, parent status is derived, and shorthand remains only
an entry adapter.

### M6 — Qualification and default cutover

- **M6-S1** builds the executable composition/fault suite: cross-contract
  conformance; interruption at every boundary; backend and claim-provider
  conformance; leases/fences; overlapping/disjoint claims; remote-success/local-
  receipt loss; stale heads; partial GitHub state; expired authority; worktree
  relocation/removal; review unavailability; correction exhaustion;
  parent/child corruption; exact prompt counts; and role-handoff integrity. It
  uses disposable repositories/fixtures and never substitutes fake adapters
  for real qualification.
- **M6-S2** runs repeated fresh and resumed five-slice multi-hour soaks through
  the real engine, strict reviewer, GitHub lifecycle, Sync, Archive, and cleanup.
  It records prompt/owner intervention, timings, retries/corrections, resource
  leaks, role/work-unit isolation, final convergence, history/projection
  agreement, and all failed runs. It cannot rerun away flakes or lower gates.
- **M6-S3** switches thin entrypoints to qualified run-v2 local execution only
  after the owner-approved threshold. It retains legacy audit/recovery,
  compatibility diagnostics, a tested rollback, and removal criteria. It never
  deletes ambiguous legacy state or removes rollback early; generated assistant
  assets require parity and cache-refresh verification.

M6 exits only when repeated real runs meet the threshold, routine approvals are
zero inside valid authority, every stop has evidence and recovery, harness
health is reported, and both default cutover and rollback are proven.

### M7 — Optional Temporal execution backend

- **M7-S1** maps the proven contracts to a parent Workflow, child Workflows,
  idempotent Activities, stable IDs, task queues, worker capability admission,
  bounded retries/heartbeats, authorized Signals or Updates, status Queries,
  safe Continue-As-New, deterministic replay/versioning, minimized/redacted
  payloads, and shared resource claims. Temporal Event History is the sole
  authority for Temporal runs. Local registry/status remains projection-only.
  Temporal is never mandatory, never receives credentials or raw repository
  content in history, never changes domain gates, and never creates a separate
  claim authority or automatic live migration.

M7 requires M6 qualification, a current sourced Temporal assessment, stable
portable contracts, deployment/data/versioning/ownership decisions, and
explicit owner approval. It exits only after local/Temporal conformance,
replay, duplicate Activity, worker/service interruption, history rollover,
parent/child pause, projection rebuild, shared-claim conflict, and payload-
safety tests pass without weakening local behavior.

## 8. Document evolution and preservation

The current detailed slice inventory is transitional. After the two master
documents are reviewed and accepted:

1. Create detailed slice briefs in dependency order using the planned names.
2. Move the matching slice detail from this inventory into each brief and
   replace the roadmap's planned name/status with a real link.
3. Build a source-to-destination map for every related older control-plane
   brief, decision, requirement, risk, non-goal, assumption, and acceptance
   condition.
4. Run a final migration review proving that each material source item is
   preserved or explicitly superseded with a reason.
5. Archive only verified superseded control-plane briefs. Do not archive
   unrelated briefs or delete historical content.

The roadmap must remain thin during this evolution. The main design owns shared
architecture; the slice brief owns its detailed behavior; OpenSpec artifacts
own an authorized change's requirements/design/tasks; durable runtime evidence
owns execution truth.

## 9. Recommended next step

Review and iterate on this big-picture design together with the thin roadmap.
Resolve or retain the named open decisions explicitly. Do not create detailed
slice briefs, archive older sources, create OpenSpec artifacts, or implement
the control plane until the owner accepts the two-master-document direction.

After acceptance, create M1-S1's detailed brief first and use OpenSpec Explore
to resolve canonical registry ownership, parent/child ownership, local durable-
execution substrate, authoritative history, and resource-claim authority.

No OpenSpec artifacts or implementation changes were created by this brief.
