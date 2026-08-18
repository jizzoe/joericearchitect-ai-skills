# Autonomous SDD Reliability Control Plane

> Historical source. Superseded by the canonical
> [runtime](../../autonomous-sdd-runtime-kernel.md),
> [review](../../independent-review-assurance-and-profiles.md), and
> [lifecycle](../../sdd-lifecycle-integration-and-safe-recovery.md) briefs.

Date: 2026-08-16

Status: Evidence-derived recommendation pending owner confirmation. This brief
records analysis and a proposed solution; it does not authorize OpenSpec
Propose, Apply, GitHub mutation, or implementation.

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

- [Autonomous SDD lifecycle](../../../../workflows/autonomous-sdd-lifecycle/workflow.md)
  defines the intended Issue-to-cleanup sequence, current-evidence gates,
  objective correction, exact-head rereview, and routine autonomous
  continuation.
- [Autonomous goal runner](../../../../skills/base/autonomous-goal-runner/SKILL.md)
  separates authorization, runtime permission, evidence, and human decisions,
  and directs objective failures into bounded correction instead of routine
  owner prompts.
- [Authorization policy](../../../../skills/base/autonomous-goal-runner/references/authorization-policy.md)
  requires exact targets, derived durable records, idempotent recovery, and
  strict independent review before production delivery.
- [Independent review](../../../../skills/base/independent-review/SKILL.md) and its
  [protocol](../../../../skills/base/independent-review/references/protocol.md) define
  a sealed immutable package, a fresh distinct reviewer, a read-only inner
  boundary, a fixed parent transport, owned final-result evidence, and
  fail-closed acceptance.

The target behavior is therefore not the main ambiguity. The ambiguity lies in
which executable component is authoritative at each boundary and how those
components exchange state.

### Initial sweep: structural reliability gaps

1. **There is no executable orchestration loop.**
   [autonomous-sdd-controller.mjs](../../../../scripts/sdd/autonomous-sdd-controller.mjs)
   creates, inspects, advances, and persists records, but it does not select and
   invoke phases, derive targets, launch review, reconcile GitHub state, loop to
   the next checkpoint, or run to a terminal state. The thin
   [autonomous-sdd-delivery skill](../../../../skills/base/autonomous-sdd-delivery/SKILL.md)
   tells the model to run the first incomplete phase, while workflow prose says
   control should return for continuation. No deterministic engine enforces
   that re-entry.

2. **Multiple incompatible records are treated as authoritative.** The
   controller uses eight broad phases and accepts a selected-entry string with
   `{current: true}` evidence. The
   [delivery checkpoint](../../../../scripts/sdd/checkpoint.mjs) uses seven external
   lifecycle steps, a structured selected entry, typed durable records, and
   `{present: true, current: true}` evidence. There is no canonical run record,
   validated projection, or linkage between them.

3. **Resolved delivery authorization is not a valid generic run policy.** A
   direct resolver-to-validator probe reports `missing-objective`,
   `missing-work-selection`, `missing-forbidden-actions`,
   `missing-stopping-conditions`, and `missing-evidence`. The
   [delivery resolver](../../../../scripts/sdd/resolve-sdd-delivery-request.mjs) and
   [run-policy validator](../../../../scripts/sdd/validate-run-policy.mjs) therefore
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
   [repository configuration](../../../../config/ai-skills.json) supports a nested
   `independentReview` object, while the operation checker reads undeclared
   top-level `independentReviewer`, `degradedIndependentReviewer`,
   `requiredOpenSpecArtifacts`, and `reviewRepositoryPath` fields. A checker-
   compatible object is rejected by
   [the config validator](../../../../scripts/validation/validate-base-skill-contracts.mjs),
   and no canonical loader maps the validated shape into the checker shape.
   The configured `designBriefRoot` is also `docs/design-briefs`, while current
   repository practice and the resolver use `ai-planning/design-briefs`.

10. **Review transport is a prepared contract, not an integrated runtime.**
    [platform-review-adapters.mjs](../../../../scripts/sdd/platform-review-adapters.mjs)
    can build and consume the fixed strict parent request, and
    [review-launcher-recovery.mjs](../../../../scripts/sdd/review-launcher-recovery.mjs)
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
| [Isolated autonomous independent review](../isolated-autonomous-independent-review.md) | Sealed package, distinct reviewer, immutable exact-head evidence | Retain as the assurance foundation. |
| [Authorized degraded independent review](../authorized-degraded-independent-review.md) | Explicit reduced-assurance fallback after strict unavailability | Retain, but route through one dispatcher and failure registry. |
| [Independent-review result transport reliability](../independent-review-result-transport-reliability.md) | Owned final artifact and transcript rejection | Retain; its contract is necessary but not proven for real multi-step review. |
| [Independent-review worktree lifecycle and diagnostics](../independent-review-worktree-lifecycle-and-diagnostics.md) | Exact detached-view ownership and safe diagnostics | Retain and integrate with admission readiness and the canonical run record. |
| [Autonomous SDD continuation default](../autonomous-sdd-continuation-default.md) | Request resolver and controller primitives | Treat as the v1 foundation to consolidate, not as a complete runner. |
| [SDD post-Archive workspace cleanup](../sdd-post-archive-workspace-cleanup.md) | Exact-owned clean resource cleanup | Retain its safety policy and make it a terminal control-plane transition. |
| [Strict review multi-step artifact delivery](strict-review-multistep-artifact-delivery.md) | Reproduced missing terminal artifact on real multi-step reviews | Required review-transport workstream and live acceptance gate. |
| [Independent-review configuration provenance](independent-review-configuration-provenance.md) | Wrong-source reviewer discovery and false absence | Expand into the canonical runtime-config loader and immutable run snapshot. |
| [Independent-review inspection-environment fallback](independent-review-inspection-environment-fallback.md) | Missing inspection tools in restricted review environments | Keep conditional; prefer host-owned semantic inspection before adding shell-environment tiers. |
| [Prototype-rapid same-session review](prototype-rapid-same-session-review.md) | Prototype profile disagreement | Resolve inside one generated profile-and-gate matrix. |
| [SDD milestone/slice delivery skill](../../sdd-milestone-slice-delivery-skill.md) | Milestone cadence and slice planning | Make it a downstream client of the stable runner, not another orchestrator. |
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
- Evidence-derived recommendation, not yet an owner decision: select Option C
  and make prompt/brief fixes subordinate to an executable control plane.
- Assumption: strict independent review remains mandatory for
  `production-rapid`; reliability improvements must not accept transcripts,
  self-review, stale heads, mutable packages, or unverifiable results.
- Assumption: the first reliable release may target one local repository and
  configured GitHub lifecycle before adding cross-repository milestone slices.
- Assumption: existing archived review and cleanup contracts remain valid
  unless a conformance test proves an incompatibility.

### Recommended architecture

![Autonomous SDD reliability control-plane architecture showing inputs, the deterministic orchestration core, lifecycle adapters, evidence return, and evidence-driven outcomes](../../assets/autonomous-sdd-reliability-control-plane.png)

The diagram is explanatory; the written contracts and their validated schemas
remain normative. The transition engine selects exactly one next action, every
adapter returns durable evidence to the shared ledger, and the evidence—not
model inference—determines whether the run continues, retries, corrects and
rereviews, pauses for human judgment, or completes.

1. **Canonical `autonomous-sdd-run-v2` record.** Include a run ID, schema
   version, monotonic revision, authorization and configuration snapshots with
   digests, canonical repository and worktree locators, ordered queue entries,
   selected entry, explicit transition graph, typed status, attempts,
   evidence bindings, derived targets, review lineage, external record IDs,
   cleanup ownership, timestamps, and deadline. Maintain an append-only event
   ledger and use a lease plus compare-and-swap update so only one runner owns
   a transition.

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
- End-to-end, restart, concurrency, fault-injection, prompt-count, multi-step
  reviewer, queue, and soak verification.
- Later integration of milestone/slice planning as a client of the engine.

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

## 6. Open questions and blocking decisions

- **Canonical registry ownership:** Should the primary run registry be
  repository-local, user-state-local with a repository pointer, or a small
  dual record with one canonical side and one validated projection? This must
  be decided before the v2 schema proposal.
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

These decisions block the exact OpenSpec requirements and schema, but they do
not block agreement on the systemic diagnosis or contract-first direction.

## 7. Recommended next step

Recommendation pending owner confirmation: select Option C and run OpenSpec
Explore for an umbrella change tentatively named
`establish-autonomous-sdd-reliability-control-plane`. Explore should resolve
the blocking decisions and produce a dependency-ordered delivery plan rather
than one oversized Apply.

Recommended implementation sequence after Explore:

1. **Contract consolidation:** v2 run schema, registry choice, generated
   operation/profile matrix, shared config loader, exhaustive outcome registry,
   resolver-to-validator and config-to-checker conformance tests.
2. **Deterministic single-change engine:** lease/revision/event ledger,
   transition adapters, restart/idempotency, status interface, and fake-adapter
   zero-prompt end-to-end proof.
3. **Review reliability:** implement the strict multi-step artifact brief,
   configuration provenance, admission probe, one dispatcher, exact-head review
   reuse, and real Codex acceptance evidence; add inspection fallback only if
   semantic host inspection is insufficient.
4. **External lifecycle and cleanup:** exact issue/Project/PR/merge/Sync/Archive
   transitions, current evidence, no duplicate review, and existing exact-owned
   cleanup policy.
5. **Milestone/slice integration:** submit approved dependency-valid slices to
   the same engine with per-entry authorization and brief provenance.
6. **Reliability qualification:** interruption and concurrency matrix, fault
   injection, prompt-count assertions, then repeated disposable five-slice
   multi-hour soak runs before default enablement.

No OpenSpec artifacts or implementation changes were created by this brief.
