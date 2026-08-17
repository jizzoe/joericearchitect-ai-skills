# Autonomous SDD Reliability Control Plane Roadmap

Date: 2026-08-16

Status: Owner-requested roadmap and candidate-change plan. It creates no
GitHub issue, branch, worktree, OpenSpec change, delta spec, implementation
authorization, or external mutation.

## Outcome and planning basis

This roadmap decomposes the
[Autonomous SDD Reliability Control Plane](../design-briefs/autonomous-sdd-reliability-control-plane.md)
into iterative, independently reviewable OpenSpec changes. The target outcome
is a production-rapid runner that can complete an authorized five-slice
milestone unattended when all objective gates pass, while stopping safely for
real failures, exhausted correction budgets, missing runtime capability, or
material human judgment.

The roadmap also carries forward the accepted safety model in the
[bounded autonomous SDD implementation plan](archive/bounded-autonomous-sdd-execution-implementation-plan.md),
the current [SDD workflow](../../docs/sdd-workflow.md), and the living
[bounded autonomous execution](../../openspec/specs/bounded-autonomous-execution/spec.md),
[autonomous continuation](../../openspec/specs/autonomous-sdd-continuation/spec.md),
[isolated independent review](../../openspec/specs/isolated-independent-review/spec.md),
and [SDD lifecycle](../../openspec/specs/sdd-lifecycle/spec.md) specifications.

The owner directed milestone-and-slice planning in the active session after
reviewing the systemic diagnosis. The source brief digest at planning time is
`2ef29f4a34eb5d2b90afe5d5b9a242a0a566592ac75608c46b3aa42c2dda46ce`.
That digest records the planning basis; it is not a substitute for owner
confirmation of the open architecture decisions or authorization to Propose or
Apply a slice.

## Delivery rules

- Each numbered slice below is one proposed semantic OpenSpec change with its
  own proposal, applicable delta specs, design, tasks, implementation review,
  Verify evidence, implementation delivery, Sync, Archive, and exact-owned
  cleanup.
- A milestone is an outcome grouping, not one large change. Do not combine its
  slices merely to reduce issue or PR count.
- Every slice defaults to `production-rapid` because it changes reusable
  authorization, orchestration, review, or delivery controls. Strict
  independent review remains mandatory until an owner-approved profile
  contract says otherwise.
- `Explore-ready` means one or more named decisions must be resolved before
  Propose. `Propose-ready` means observable behavior and dependencies are
  sufficiently defined, but it still requires explicit lifecycle
  authorization. `Conditional` means evidence from an earlier slice decides
  whether the change is needed.
- A later slice may start only when every hard dependency is delivered and its
  milestone exit evidence remains current. Re-read Git, worktrees, OpenSpec,
  GitHub, configuration, and run state before selection.
- Preserve unrelated dirty work. Never infer ownership from branch names,
  worktree paths, current-directory visibility, or an untracked controller
  file.
- Existing open briefs are implementation inputs to the named slice below;
  they should not become competing roadmaps or parallel orchestration models.

### Per-slice profile and delivery authority

Every candidate selects `production-rapid` independently. None receives a
prototype preapproval from this roadmap. Delivery of a roadmap slice follows
the current exact authorization in force for that slice: normal interactive
just-in-time approval applies to merge, Archive, and merged-branch cleanup
unless the owner separately starts an exact bounded autonomous `sdd-delivery`
run that validly covers those transitions.

| Candidate slices | Data rationale | Exposure rationale | Recovery rationale |
| --- | --- | --- | --- |
| M1-S1 through M1-S3 | Internal schemas and safe configuration metadata | Reusable global authorization and review contracts | Contract drift can incorrectly permit or block later actions; strict review and reversible migration are required. |
| M2-S1 through M2-S3 | Local run, event, lease, and status records | The engine controls repository mutation sequencing | Restart and concurrency defects can corrupt authoritative state; fail-closed recovery is required. |
| M3-S1 through M3-S3 | Sealed review packages and safe evidence metadata | Production assurance and reviewer transport boundary | A false pass or false unavailable result changes delivery eligibility; strict exact-head evidence is required. |
| M4-S1 through M4-S3 | Repository, GitHub, OpenSpec, branch, and worktree state | Real external and destructive lifecycle transitions | Every mutation must be exact, idempotent, and recoverable without touching unrelated work. |
| M5-S1 and M5-S2 | Approved roadmap/brief metadata and normalized run inputs | Global queue and shorthand entrypoints | Thin adapters must be reversible and must not duplicate or widen engine authority. |
| M6-S1 through M6-S3 | Disposable qualification evidence and safe diagnostics | Default routing for all autonomous SDD delivery | Audit-mode rollback and retained failure evidence are required before and after cutover. |

## Dependency shape

```text
M1 Contract convergence
  -> M2 Deterministic single-change engine
    -> M3 Independent-review reliability
      -> M4 Full lifecycle integration
        -> M5 Milestone and shorthand adapters
          -> M6 Qualification and default cutover
```

Within a milestone, parallel work is allowed only where the slice table says
so and a fresh shared-resource inspection confirms that files, schemas, test
fixtures, and generated assistant assets do not overlap.

## Milestone 1 — Contract convergence

**Outcome:** every runtime component consumes the same run, operation,
authorization, configuration, and outcome contracts. Cross-contract probes
become release gates rather than undocumented assumptions.

### M1-S1 — Establish the autonomous SDD run-v2 contract

- **Proposed change:** `establish-autonomous-sdd-run-v2-contract`
- **Readiness:** Explore-ready.
- **Outcome:** define one canonical versioned run record and validated v1
  migration/projection boundary.
- **Scope:** run ID, monotonic revision, authorization/config digests,
  repository and worktree identity, ordered queue, selected entry, transition
  state, typed attempts and pauses, derived targets, evidence/review linkage,
  external record IDs, cleanup ownership, timestamps, deadline, and event
  references.
- **Non-goals:** executing lifecycle actions, acquiring a lease, launching a
  reviewer, or migrating ambiguous legacy records automatically.
- **Depends on:** owner decision on canonical registry ownership and whether a
  dual record has one explicitly canonical side.
- **Shared-resource hazards:** controller, checkpoint, authorization, cleanup,
  and result schemas; validation fixtures used by later slices.
- **Acceptance evidence:** invalid redundant state is rejected; queue order and
  index are bound; controller and lifecycle evidence have one lossless
  projection; ambiguous v1 state classifies audit-only; resolver output can be
  embedded in a valid run; schema portability fixtures pass in a second repo.
- **First action:** OpenSpec Explore using the source brief, current controller,
  checkpoint, resolver, cleanup records, and living specs.

### M1-S2 — Unify operations, profiles, gates, and outcomes

- **Proposed change:** `unify-autonomous-sdd-operation-contract`
- **Readiness:** Explore-ready.
- **Outcome:** one typed operation graph becomes authoritative for profiles,
  target kinds, prerequisites, evidence freshness, approval behavior, review
  requirements, recovery, and terminal classifications.
- **Scope:** replace mismatched lifecycle vocabularies; bind issue, Project,
  PR, Sync, Archive, and branch operations to exact record kinds; authorize
  bounded objective correction for SDD delivery; classify every emitted error
  code exactly once; generate or conformance-check documentation and matrices.
- **Non-goals:** performing GitHub mutations or changing strict-review
  transport.
- **Depends on:** M1-S1; owner decision on the prototype profile; owner
  confirmation of exact-head review reuse across non-code transitions.
- **Shared-resource hazards:** operation checker, run-policy validator,
  resolver, review result codes, workflow prose, and eval matrices. Run
  sequentially after M1-S1.
- **Acceptance evidence:** issue operations reject branch records; stale Sync
  requests fail closed; resolver lifecycle permissions are enforced; SDD
  objective correction is reachable within its durable budget; autonomous
  requests never route through interactive preapproval logic; every emitted
  outcome has one retry/correct/pause/terminal disposition.
- **First action:** OpenSpec Explore using the source brief and the direct
  cross-contract probes recorded there.

### M1-S3 — Establish runtime configuration provenance

- **Proposed change:** `establish-autonomous-sdd-runtime-config-provenance`
- **Readiness:** Explore-ready.
- **Outcome:** all gates consume one schema-validated, precedence-defined,
  immutable runtime configuration snapshot.
- **Scope:** repository defaults, design-brief and plan roots, reviewer and
  adapter identity, attestation references, evidence/artifact paths, safe
  provenance, redacted capability metadata, snapshot digest, and source
  precedence.
- **Non-goals:** storing credentials, raw environment, user-specific absolute
  paths, or mutable standing authorization in the repository.
- **Depends on:** M1-S1; owner decision on whether a product-owned runtime
  config may supply reviewer defaults before the sealed run snapshot.
- **Shared-resource hazards:** `config/ai-skills.json`, base-skill config
  validation, research/planning defaults, and independent-review gates. It may
  be designed alongside M1-S2 but should merge after shared schema ownership is
  explicit.
- **Acceptance evidence:** every validator-approved config is consumable by the
  operation and review gates; checker-only undeclared fields are impossible;
  source precedence and path roots are deterministic; a sealed run never
  guesses another source after admission; secrets and raw configuration are
  absent from durable diagnostics.
- **Source brief:**
  [Independent-review configuration provenance](../design-briefs/independent-review-configuration-provenance.md).
- **First action:** OpenSpec Explore.

### Milestone 1 exit gate

- Resolver output validates as a complete bounded authorization/run input.
- One schema owns phase, queue, selected-entry, evidence, and transition state.
- One operation graph owns names, target kinds, profiles, approval modes,
  review gates, and error dispositions.
- Validated configuration is exactly the configuration consumed at runtime.
- All known cross-contract probes are encoded as failing-before/fixed-after
  tests.

## Milestone 2 — Deterministic single-change engine

**Outcome:** one local single-change run can start, select exactly one next
transition, persist it safely, restart after interruption, and explain its
state without relying on model memory or the current working directory.

### M2-S1 — Add the canonical run registry, ledger, and lease

- **Proposed change:** `add-autonomous-sdd-run-registry-and-lease`
- **Readiness:** Propose-ready after M1 decisions are delivered.
- **Outcome:** provide durable run discovery and single-writer transition
  ownership across linked worktrees and process restarts.
- **Scope:** canonical registry locator, append-only event ledger, atomic
  revision update, compare-and-swap semantics, expiring lease, takeover rules,
  worktree binding, and safe v1 discovery/migration report.
- **Non-goals:** invoking a lifecycle phase or deleting legacy controller
  files.
- **Depends on:** all Milestone 1 slices.
- **Shared-resource hazards:** worktree discovery and cleanup ownership. Reuse
  the lifecycle-hygiene inventory rather than creating a second scanner.
- **Acceptance evidence:** concurrent writers cannot both advance; process
  death allows revision-bound recovery after lease expiry; a moved or missing
  worktree is classified from canonical identity; main-worktree status finds a
  run owned by another linked worktree; ambiguous legacy state remains intact.
- **Source brief:**
  [SDD lifecycle hygiene and brief provenance](../design-briefs/sdd-lifecycle-hygiene-and-brief-provenance.md).
- **First action:** OpenSpec Propose.

### M2-S2 — Add the deterministic transition engine

- **Proposed change:** `add-autonomous-sdd-transition-engine`
- **Readiness:** Propose-ready after M2-S1.
- **Outcome:** execute one authorized single-change lifecycle through a fixed
  state machine using bounded adapters and durable evidence.
- **Scope:** admission hook, next-transition selection, adapter invocation,
  receipt validation, atomic outcome recording, retry/correction counters,
  expiration, and loop termination. Start with fake adapters and local
  Propose/planning-review/Apply/Verify boundaries; later milestones add real
  review and external delivery adapters.
- **Non-goals:** real PR merge, Sync, Archive, cleanup, milestone queues, or a
  new model-planning system.
- **Depends on:** M2-S1.
- **Shared-resource hazards:** generated OpenSpec actions and assistant
  wrappers. Keep wrappers thin and do not copy OpenSpec artifact logic.
- **Acceptance evidence:** a model-independent fake-adapter run reaches its
  terminal state with zero routine prompts; exactly one transition is owned at
  a time; replay is no-op or convergent; interruption before and after every
  write resumes correctly; expiration and material decisions pause with exact
  evidence.
- **First action:** OpenSpec Propose.

### M2-S3 — Add canonical run status and recovery reporting

- **Proposed change:** `add-autonomous-sdd-run-status-and-recovery`
- **Readiness:** Propose-ready after M2-S2.
- **Outcome:** provide one read-only bird's-eye report and exact resume action
  for all discoverable runs in a repository.
- **Scope:** classifications for running, retryable infrastructure,
  quality-blocked, waiting-human, configuration-discovery-gap, expired,
  complete, and ambiguous legacy state; current milestone/slice and exact next
  transition; evidence freshness; Git/worktree and OpenSpec linkage.
- **Non-goals:** mutating a run, cleaning Git state, or deciding among
  materially equivalent work.
- **Depends on:** M2-S2.
- **Shared-resource hazards:** repository-status and Git-health concepts should
  consume this report rather than reimplement run discovery.
- **Acceptance evidence:** the same report is produced from the primary or a
  linked worktree; missing current-directory files never imply failure; every
  status links to canonical evidence and one safe resume/no-op/pause result.
- **First action:** OpenSpec Propose.

### Milestone 2 exit gate

- A fake-adapter single-change run completes without conversational re-entry.
- Kill/restart and concurrent-run tests pass at every supported transition.
- Status is identical from every worktree and distinguishes discovery gaps
  from actual failures.
- No real external mutation or production-review claim is made yet.

## Milestone 3 — Independent-review reliability

**Outcome:** production runs prove strict reviewer readiness before Apply,
deliver a real multi-step owned result, correct objective findings within the
bounded budget, and reuse exact-head assurance without launching redundant
reviewers for unchanged code.

### M3-S1 — Harden strict multi-step artifact delivery

- **Proposed change:** `harden-strict-review-multistep-artifact-delivery`
- **Readiness:** Propose-ready from its existing brief, subject to current
  branch/worktree reconciliation.
- **Outcome:** a real multi-step tool-driven Codex reviewer always leaves one
  parent-owned schema-valid terminal artifact or exact unavailable evidence.
- **Scope:** host-owned event capture, deterministic terminalization, bounded
  package/result transport, transcript rejection, artifact cleanup, and live
  acceptance probes.
- **Non-goals:** accepting transcript text, weakening isolation, or treating an
  artifact-missing recovery allowlist entry as proof of repair.
- **Depends on:** Milestone 2 engine interfaces and Milestone 1 contracts.
- **Shared-resource hazards:** an existing unmerged change may contain interim
  artifact-missing recovery work. Reconcile ownership and evidence before
  Propose; do not duplicate it.
- **Acceptance evidence:** minimal, large-read, and genuinely multi-step
  reviewers all produce the exact terminal artifact; missing/malformed output
  fails closed; parent receipt and cleanup remain bound; the live probe runs
  through the same production dispatcher interface used later.
- **Source brief:**
  [Strict review multi-step artifact delivery](../design-briefs/strict-review-multistep-artifact-delivery.md).
- **First action:** reconcile current worktree state, then OpenSpec Propose or
  resume the exact existing change if authoritative.

### M3-S2 — Add review admission and one dispatcher

- **Proposed change:** `add-autonomous-sdd-review-admission-and-dispatcher`
- **Readiness:** Propose-ready after M3-S1.
- **Outcome:** the transition engine, not the model, owns strict launch,
  receipt consumption, recovery eligibility, authorized degraded fallback,
  and terminal evidence.
- **Scope:** admission checks for reviewer configuration/provenance,
  executable identity, parent Auto-review transport, exact repository/view,
  multi-step artifact capability, inspection capability, runtime permission,
  deadline headroom, and cleanup destination; one exhaustive strict/degraded
  state machine.
- **Non-goals:** silently adding shell tools or environment access, prompting
  the owner to relay commands, or degrading a strict-only run.
- **Depends on:** M3-S1 and M1-S3.
- **Shared-resource hazards:** platform adapters, launcher recovery,
  diagnostics, and failure-code registry must change through one owner.
- **Acceptance evidence:** strict-only inability stops before Apply; the engine
  makes and consumes the fixed parent request without model-selected routing;
  Auto-review denial is terminal evidence, not a conversational relay; every
  unavailable code has exactly one disposition.
- **Conditional follow-up:** create an inspection-environment slice only if
  admission proves host-owned semantic inspection cannot meet reviewer needs.
- **Source brief:**
  [Independent-review inspection-environment fallback](../design-briefs/independent-review-inspection-environment-fallback.md).
- **First action:** OpenSpec Propose.

### M3-S3 — Bind review and correction to the code head

- **Proposed change:** `bind-autonomous-review-to-code-head`
- **Readiness:** Explore-ready pending owner confirmation of review reuse.
- **Outcome:** one current exact-head review gates later non-code lifecycle
  transitions while changed code or review-relevant artifacts deterministically
  invalidate it and trigger affected checks plus rereview.
- **Scope:** review lineage in run-v2, Apply evidence binding, package and
  artifact digests, correction source/attempt linkage, invalidation rules, and
  merge/Sync/Archive/cleanup consumption.
- **Non-goals:** carrying review across a changed head, weakening finding
  dispositions, or skipping transition-specific external-state evidence.
- **Depends on:** M3-S2.
- **Shared-resource hazards:** production delivery gate and correction-chain
  logic.
- **Acceptance evidence:** unchanged heads do not launch redundant reviewers;
  any relevant change invalidates the review; objective findings correct and
  rereview within the exact per-signature budget; human-decision dispositions
  pause; Archive no longer fails solely for a duplicate transition review.
- **First action:** owner decision, then OpenSpec Explore or Propose.

### Milestone 3 exit gate

- Admission proves the real strict path before implementation begins.
- A real multi-step reviewer produces accepted exact-head evidence through the
  integrated dispatcher.
- Objective correction and rereview complete without owner relay.
- Unchanged code does not trigger redundant review at later lifecycle steps.

## Milestone 4 — Full lifecycle integration

**Outcome:** one authorized single change runs from planning through merged
implementation, Sync, Archive, issue/Project completion, and exact-owned local
cleanup through deterministic adapters.

### M4-S1 — Integrate GitHub intake and implementation delivery

- **Proposed change:** `integrate-autonomous-sdd-github-delivery`
- **Readiness:** Propose-ready after Milestone 3.
- **Outcome:** deterministically create or reuse the exact issue, Project item,
  branch, PR, and merge transition without duplicate records or routine
  autonomous prompts.
- **Scope:** current GitHub capability preflight, exact typed derived records,
  idempotent create/update, branch/head binding, PR linkage, check state,
  authorized merge, issue closure, Project status, receipts, and recovery.
- **Non-goals:** changing credentials/scopes, branch protection, required
  checks, releases, deployments, or unrelated records.
- **Depends on:** Milestone 3 and the existing GitHub lifecycle skills.
- **Shared-resource hazards:** issue/PR/Project state and human-authored body
  content. Preserve human content and use field-level ownership.
- **Acceptance evidence:** restart at every external mutation converges without
  duplication; wrong record kind or stale head fails; current review and CI
  bind to the merged head; expected autonomous transitions do not invoke
  interactive preapproval logic.
- **First action:** OpenSpec Propose with a disposable GitHub fixture strategy.

### M4-S2 — Integrate Sync and Archive delivery

- **Proposed change:** `integrate-autonomous-sdd-sync-and-archive`
- **Readiness:** Propose-ready after M4-S1.
- **Outcome:** deterministically synchronize living specs and archive the
  completed change only after implementation delivery is proven.
- **Scope:** delta-to-living-spec reflection, repeat-Sync no-op proof, Sync PR
  and merge evidence, content-preserving Archive, Archive PR and merge evidence,
  current default-branch confirmation, and run-ledger transitions.
- **Non-goals:** resolving ambiguous spec conflicts, inventing missing
  requirements, or archiving before implementation and Sync delivery.
- **Depends on:** M4-S1.
- **Shared-resource hazards:** living specs and archive destinations require
  serialized ownership.
- **Acceptance evidence:** exact reflection and repeat no-op pass; interrupted
  Sync/Archive resumes idempotently; changed or conflicting living specs pause;
  unchanged code reuses current review while transition evidence remains
  independently current.
- **First action:** OpenSpec Propose.

### M4-S3 — Integrate exact-owned finalization and cleanup

- **Proposed change:** `integrate-autonomous-sdd-finalization-and-cleanup`
- **Readiness:** Propose-ready after M4-S2.
- **Outcome:** converge issue, Project, default branch, run status, branches,
  and worktrees to the completed state without touching unrelated or dirty
  resources.
- **Scope:** reuse current cleanup audit/execute/resume contracts as the
  terminal engine adapter; register exact ownership when resources are
  created; record ineligible resource recovery states; close the run only
  after final evidence is current.
- **Non-goals:** broad stale-branch cleanup, force removal, reset/clean, or
  inference of legacy ownership.
- **Depends on:** M4-S2 and M2-S1.
- **Shared-resource hazards:** local Git state and primary/locked/dirty
  worktrees.
- **Acceptance evidence:** exact clean delivered resources are removed;
  unrelated, dirty, primary, locked, divergent, or ambiguous resources remain;
  partial cleanup resumes safely; completion status matches GitHub, OpenSpec,
  default-branch, and local resource evidence.
- **Source brief:**
  [SDD post-Archive workspace cleanup](../design-briefs/archived/sdd-post-archive-workspace-cleanup.md).
- **First action:** OpenSpec Propose.

### Milestone 4 exit gate

- A disposable real single-change repository completes the full lifecycle with
  zero routine owner prompts.
- Every external transition is exact, typed, current, idempotent, and bound to
  a run revision.
- Strict review is current for the delivered code head and not redundantly
  relaunched for unchanged code.
- Dirty and unrelated resources survive all cleanup tests unchanged.

## Milestone 5 — Milestone queues and owner shorthand

**Outcome:** an approved milestone plan can feed several dependency-valid
slices into the proven engine, and the owner can start or resume the lifecycle
with a concise command without restating every default.

### M5-S1 — Add the milestone/slice queue adapter

- **Proposed change:** `add-autonomous-sdd-milestone-slice-adapter`
- **Readiness:** Explore-ready after Milestone 4.
- **Outcome:** convert one approved roadmap milestone into immutable,
  dependency-valid run-v2 queue entries with per-slice authorization and brief
  provenance.
- **Scope:** milestone selection, slice dependencies, queue ordering,
  per-entry brief and target paths, shared-resource serialization, progress
  reporting, next-entry admission, and pause when selection is ambiguous.
- **Non-goals:** duplicating lifecycle logic, silently choosing product
  priorities, or adding cross-repository autonomy in the first slice.
- **Depends on:** Milestone 4 and owner acceptance of the milestone cadence.
- **Shared-resource hazards:** two entries may touch living specs, validators,
  generated assets, or the same worktree. The adapter must serialize rather
  than guess.
- **Acceptance evidence:** a five-entry fake-adapter milestone runs in exact
  dependency order; later brief paths are authorized; restart preserves queue
  position; one failed entry does not corrupt later entries; status reports
  milestone and slice progress from the canonical registry.
- **Source brief:**
  [SDD milestone/slice delivery skill](../design-briefs/sdd-milestone-slice-delivery-skill.md).
- **First action:** OpenSpec Explore.

### M5-S2 — Add design-brief delivery shorthand

- **Proposed change:** `add-autonomous-design-brief-delivery-shorthand`
- **Readiness:** Propose-ready after M5-S1 and prototype-profile resolution.
- **Outcome:** make “implement design brief `<name>`” a thin, deterministic
  entrypoint that resolves current state, proposes only when needed, and calls
  the existing control plane through completion.
- **Scope:** defaults display and confirmation, owner overrides, exact brief
  resolution, existing-change resume, new-change proposal path, normalized
  authorization, expiration/profile/review-policy inputs, and run-ID response.
- **Non-goals:** a second runner, hidden defaults, standing authorization,
  fuzzy brief selection, or bypass of strict-review and human-decision gates.
- **Depends on:** M5-S1 and M1-S2.
- **Shared-resource hazards:** global skill wrappers and command aliases must
  remain thin and platform-consistent.
- **Acceptance evidence:** missing values produce one concise defaults summary
  and override opportunity; an exact existing run resumes rather than
  duplicates; a new target enters Propose once; normalized input and run ID are
  identical across Claude/Codex adapters; no lifecycle policy is copied into
  the shorthand.
- **First action:** OpenSpec Propose.

### Milestone 5 exit gate

- Five fake slices complete in dependency order through one engine.
- Every queue entry has exact authorization, brief provenance, target scope,
  evidence, and cleanup ownership.
- The shorthand only resolves inputs and invokes the canonical engine.
- Status reports the current milestone, slice, transition, and stop reason.

## Milestone 6 — Reliability qualification and default cutover

**Outcome:** the unattended promise is proven under interruption and real
review/delivery conditions before the control plane becomes the default.

### M6-S1 — Add composition and fault-injection qualification

- **Proposed change:** `qualify-autonomous-sdd-composition-reliability`
- **Readiness:** Propose-ready after Milestone 5.
- **Outcome:** make cross-contract, restart, concurrency, and partial-state
  behavior an executable release suite.
- **Scope:** resolver-to-run, config-to-gate, operation-to-record,
  error-to-disposition conformance; interruption at every transition boundary;
  concurrent lease attempts; stale heads; partial GitHub mutations; expired
  authorization; worktree relocation; reviewer denial/unavailability;
  correction exhaustion; exact prompt-count assertions.
- **Non-goals:** replacing focused unit tests or claiming real multi-slice
  qualification from fake adapters alone.
- **Depends on:** Milestone 5.
- **Shared-resource hazards:** fault injection must use disposable repositories,
  isolated GitHub fixtures, and no production credentials in artifacts.
- **Acceptance evidence:** every injected failure converges to exactly one
  retry/correct/pause/terminal state; no routine approval prompts occur; no
  duplicate external records or leaked resources remain; all existing focused
  tests and strict OpenSpec validation pass.
- **First action:** OpenSpec Propose.

### M6-S2 — Qualify repeated five-slice unattended delivery

- **Proposed change:** `qualify-autonomous-sdd-five-slice-soak`
- **Readiness:** Propose-ready after M6-S1 and availability of a disposable
  end-to-end environment.
- **Outcome:** prove the owner's multi-hour, five-slice target through the real
  engine, strict reviewer, GitHub lifecycle, Sync, Archive, and cleanup paths.
- **Scope:** repeated fresh and resumed soak runs, captured prompt count,
  transition/event timing, retry and correction evidence, resource-leak audit,
  final spec/GitHub/Git/worktree convergence, and safe diagnostic summaries.
- **Non-goals:** hiding flaky runs by rerunning until green or lowering a gate
  to meet the target.
- **Depends on:** M6-S1 and current runtime permission for the exact disposable
  environment.
- **Shared-resource hazards:** reviewer capacity, GitHub rate limits, test
  repository cleanup, and run expiration. Admission must prove them first.
- **Acceptance evidence:** the owner-selected qualification threshold is met by
  consecutive clean five-slice runs; zero routine owner prompts; no false
  failure/location conclusions; every slice is merged, synchronized, archived,
  closed/Done, and safely cleaned; all failures are retained in the report.
- **First action:** owner selects the qualification threshold and disposable
  environment, then OpenSpec Propose.

### M6-S3 — Enable the control plane as the default path

- **Proposed change:** `enable-autonomous-sdd-control-plane-default`
- **Readiness:** Conditional on M6-S2 passing its owner-approved threshold.
- **Outcome:** switch thin assistant entrypoints from v1/model-orchestrated
  continuation to run-v2 while retaining safe audit and recovery for legacy
  state.
- **Scope:** default routing, compatibility window, deprecation diagnostics,
  documentation, operator recovery, rollback to audit mode, and final removal
  criteria for obsolete duplicate contracts.
- **Non-goals:** deleting ambiguous legacy state or removing rollback before
  the compatibility window closes.
- **Depends on:** M6-S2 qualification evidence and explicit owner approval.
- **Shared-resource hazards:** global installed-skill adapters and generated
  assistant assets require cache refresh and parity verification.
- **Acceptance evidence:** default entrypoints create/resume run-v2; legacy
  state is reported without mutation; rollback to audit mode is tested; Claude
  and Codex wrappers remain thin; repository docs name one authoritative path.
- **First action:** OpenSpec Propose only after the qualification decision.

### Milestone 6 exit gate

- Repeated real five-slice soak runs meet the owner-approved threshold.
- No run asks for routine approval when exact authorization and gates permit the
  action.
- Every true stop has one durable classification, evidence, and resume path.
- Default cutover and rollback are both proven without weakening guardrails.

## Recommended first slice

Start with **M1-S1, `establish-autonomous-sdd-run-v2-contract`**, through
OpenSpec Explore. It is the smallest slice that removes a root cause rather
than another reviewer symptom: every later engine, review, lifecycle, queue,
and status decision needs one canonical durable state model.

Before Explore, the owner should answer the canonical registry ownership
question. The remaining review/configuration/profile choices can be resolved
in M1-S2 and M1-S3 without blocking the initial run-v2 inventory and migration
analysis.

## Roadmap-level acceptance checklist

- Every slice identifies its source brief/specs, outcome, scope, non-goals,
  dependencies, hazards, profile, objective evidence, and first OpenSpec
  action.
- No slice claims a created issue, change, branch, PR, approval, or
  implementation.
- Each change is independently deliverable and leaves the repository in a
  coherent, recoverable state.
- Milestone exit gates measure integrated behavior, not the presence of files
  or passing component fixtures alone.
- The final qualification directly measures the owner's five-slice unattended
  outcome without suppressing failures or lowering strict-review assurance.
