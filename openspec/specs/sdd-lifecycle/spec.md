# sdd-lifecycle Specification

## Purpose

Defines the repository's reviewable OpenSpec lifecycle, quality context, and
safe operating boundaries from exploration through verified archival.
## Requirements
### Requirement: Streamlined lifecycle actions
The repository SHALL expose exactly the selected OpenSpec lifecycle actions
`explore`, `propose`, `apply`, `verify`, `sync`, and `archive` for supported
assistants.

#### Scenario: Selected actions are available
- **WHEN** a supported assistant reloads the repository after OpenSpec generation
- **THEN** all six selected lifecycle actions are discoverable

#### Scenario: Incremental actions remain unavailable
- **WHEN** the generated OpenSpec actions are inspected
- **THEN** `new`, `continue`, `ff`, `bulk-archive`, `onboard`, and the deselected `update` workflow are not exposed

### Requirement: Planning and implementation remain separate
The proposal action SHALL generate planning artifacts without applying the
change, and implementation SHALL require a later explicit apply action.

#### Scenario: Proposal completes
- **WHEN** an assistant completes a proposal, delta specifications, design, and task plan
- **THEN** it stops for artifact review without starting implementation

#### Scenario: Apply has not been authorized
- **WHEN** a proposal request also contains language asking to build or implement the change
- **THEN** the proposal action treats the request as planning-only and does not edit product implementation files

### Requirement: Repository context guides generated artifacts
OpenSpec project context and artifact rules SHALL concisely define the product
boundary, supported assistants, canonical asset locations, source-of-truth
model, quality and testing expectations, security and attribution constraints,
portability requirements, and built-in-first policy.

#### Scenario: A proposal is generated
- **WHEN** OpenSpec generates planning artifacts for this repository
- **THEN** the artifacts follow the configured repository context without copying the context block into artifact content

#### Scenario: A behavioral requirement is specified
- **WHEN** a delta specification is generated
- **THEN** it uses normative language and contains at least one verifiable acceptance scenario per requirement

### Requirement: Verification reports objective gaps
The verification action SHALL compare implementation evidence with the selected
change's tasks, specifications, and design and SHALL report incomplete,
divergent, or unevidenced behavior without claiming success.

#### Scenario: Implementation evidence is complete
- **WHEN** completed tasks, requirement coverage, scenario coverage, and design adherence are supported by evidence
- **THEN** verification reports the evidence and whether the change is ready for archival

#### Scenario: Required work is incomplete
- **WHEN** a task is incomplete or a required behavior lacks implementation evidence
- **THEN** verification identifies the gap with an actionable recommendation and does not report an all-clear result

### Requirement: Setup and refresh are recoverable
The repository SHALL document the tested OpenSpec version, initialization,
workflow refresh, assistant discovery, validation, and recovery procedures.

#### Scenario: Generated workflows become stale
- **WHEN** the configured workflow selection changes or OpenSpec is updated
- **THEN** a contributor can regenerate both assistant integrations and verify the selected actions using documented commands

#### Scenario: Generation partially fails
- **WHEN** OpenSpec updates one assistant integration but cannot write the other
- **THEN** existing valid planning artifacts remain intact and the recovery guidance provides a safe retry and verification path

### Requirement: Bootstrap linkage is explicit
The bootstrap change SHALL reference its primary GitHub issue and roadmap while
automated tracking metadata is not yet available.

#### Scenario: Bootstrap artifacts are reviewed
- **WHEN** a reviewer opens the bootstrap proposal
- **THEN** the reviewer can navigate to the primary issue and its roadmap parent

### Requirement: Bounded authorization can span lifecycle actions
The SDD lifecycle SHALL allow one explicit bounded authorization to span
Propose, Apply, Verify, delivery, Sync, and Archive only when the authorization
states the eligible changes or deterministic selection policy, allowed
transitions, mutation boundaries, and stopping conditions.

#### Scenario: Authorized lifecycle continuation
- **WHEN** a bounded Goal authorization covers the selected change, transition
  policy, expected local edits, expected GitHub mutations, and stopping
  conditions
- **THEN** the lifecycle may continue across later actions without a routine
  prompt only after each action's objective gates pass

#### Scenario: Propose remains planning-only outside bounded authorization
- **WHEN** the current action is the generated Propose workflow without an
  already-delivered bounded runner and explicit run authorization
- **THEN** the lifecycle stops after proposal, delta specifications, design,
  and task plan for artifact review

#### Scenario: Authorization does not cover transition
- **WHEN** the next lifecycle transition is not named or permitted by the
  active bounded authorization
- **THEN** the lifecycle pauses before that transition

### Requirement: Planning review gates Apply
The lifecycle SHALL require automated planning review before a bounded run may
advance from Propose to Apply.

#### Scenario: Planning review passes
- **WHEN** proposal scope, non-goals, issue linkage, requirements, scenarios,
  design decisions, dependencies, security, recovery, attribution, portability,
  task IDs, task dependencies, batch boundaries, and evidence requirements are
  complete and objective validation passes
- **THEN** the bounded lifecycle may advance to Apply if the run authorization
  permits that transition

#### Scenario: Planning artifact has objective defect
- **WHEN** planning review finds a missing link, malformed scenario, missing
  evidence field, inconsistent task dependency, stale capability path, or other
  objective artifact defect
- **THEN** the runner corrects the planning artifact and reruns affected
  validation and review before continuing

#### Scenario: Planning review finds material ambiguity
- **WHEN** planning review finds an unresolved decision that could change
  behavior, architecture, compatibility, security, data ownership, licensing,
  governance, or external mutation scope
- **THEN** the lifecycle pauses before Apply

### Requirement: Apply runs in evidenced batches
The lifecycle SHALL implement approved tasks in dependency-valid batches with
validation, review, correction, and evidence before tasks are marked complete.

#### Scenario: Batch completes
- **WHEN** a dependency-valid batch passes task-specific tests, OpenSpec
  validation where applicable, code and documentation review, security review,
  requirements mapping, portability review, attribution review, and recovery
  review
- **THEN** the lifecycle may mark the batch tasks complete and record the
  evidence

#### Scenario: Batch check fails objectively
- **WHEN** a batch check fails with a scoped behavior-preserving correction
- **THEN** the lifecycle applies the correction, reruns affected checks, and
  records the corrected evidence

#### Scenario: Batch requires human decision
- **WHEN** batch progress requires a material decision, destructive action,
  credential change, unexpected external mutation, unresolved dependency, or
  exhausted correction budget
- **THEN** the lifecycle pauses without marking the affected task complete

### Requirement: Delivery, Sync, and Archive are evidence-gated
The lifecycle SHALL perform delivery, Sync, and Archive only after current
state proves the required preconditions for each transition.

#### Scenario: Delivery gate passes
- **WHEN** the verified PR targets the approved base, contains the verified
  head commit, has required evidence, is mergeable, has acceptable review
  state, and formally closes the issue only when merge means completion
- **THEN** the lifecycle may make the PR ready and merge only if authorized

#### Scenario: Sync gate passes
- **WHEN** implementation delivery is merged, delta specs and living specs have
  been reread, OpenSpec validation passes, every delta operation is reflected
  in living specs, and repeat Sync is a no-op
- **THEN** the lifecycle may deliver the Sync checkpoint only if authorized

#### Scenario: Archive gate passes
- **WHEN** implementation and Sync are delivered, issue and Project state show
  completion, living specs exactly reflect deltas, strict validation passes,
  archive target is available, and the move is content-preserving
- **THEN** the lifecycle may select Archive without another routine prompt only
  if authorized

#### Scenario: Evidence is stale or incomplete
- **WHEN** delivery, Sync, or Archive evidence is missing, stale, divergent, or
  tied to a different commit or change
- **THEN** the lifecycle pauses before the transition

### Requirement: Lifecycle resume is idempotent
The lifecycle SHALL resume from authoritative durable state rather than from
prior chat summaries or transient runner logs.

#### Scenario: Lifecycle resumes
- **WHEN** a lifecycle run resumes
- **THEN** it rereads the selected change status, instructions, artifacts,
  tasks, Git state, issue, Project item, PR, living specs, archive state, and
  evidence before deciding what remains

#### Scenario: Partial external mutation exists
- **WHEN** a previous transition partially changed GitHub, Project, PR, branch,
  Sync, or Archive state
- **THEN** the lifecycle reconciles idempotently or pauses if recovery cannot
  be made safe from authoritative records

#### Scenario: Prior message claimed success
- **WHEN** a prior chat message claims completion but durable evidence is
  absent
- **THEN** the lifecycle treats the step as incomplete

### Requirement: Autonomous program delivery proves derived-target linkage
The lifecycle SHALL advance an autonomous selected queue entry through issue,
branch, pull request, delivery, Sync, Archive, and exact merged-branch cleanup
only when each derived target is durably linked to that entry and current
evidence ties the transition to the recorded head commit. It MUST pause before
a transition when linkage, evidence, or runtime permission is missing, stale,
or conflicts with durable state, and it MUST authorize only the first incomplete
ordered checkpoint transition. The checkpoint MUST contain the complete
canonical ordered chain `issue`, `branch`, `pr`, `merge-pr`, `sync-change`,
`archive-change`, and `delete-merged-topic-branch`; each transition requires
its prerequisite durable record kinds before it becomes the next eligible action.

#### Scenario: Derived delivery chain is current
- **WHEN** the selected queue entry has one durably linked issue, branch, pull
  request, Sync target, Archive target, and cleanup target with current
  transition evidence
- **THEN** the lifecycle may proceed only through the next authorized
  transition in that entry's recorded chain

#### Scenario: Derived chain is incomplete or mismatched
- **WHEN** the selected entry lacks a required record or its requested branch,
  pull request, commit, or change name differs from the durable checkpoint
- **THEN** the lifecycle pauses before delivery, Sync, Archive, or cleanup and
  reports the first unmet boundary

### Requirement: Production-rapid lifecycle preserves independent rereview
The lifecycle SHALL invoke and validate strict isolated independent review
after Apply and after every behavior-preserving objective fix before a
`production-rapid` delivery transition. It MUST bind the record to the exact
base/head and sealed manifest, retain execution evidence, findings, and
dispositions under a unique transition record, and pause on findings requiring
human judgment, three materially different fixes for one signature, or strict unavailability
unless an exact active degraded authorization applies. A degraded transition
MUST retain strict unavailable evidence, `authorized-degraded` assurance, the
authorization/risk record, expiration, and capability ledger; it MUST never be
normalized to strict isolation. For external-host recovery it MUST also retain
the selected Codex or Claude launcher kind and disclose that parent-launch
evidence and executable identity are not security-verifiable. A new head MUST
invalidate both prior strict and degraded review and repeat strict-first
evaluation.
The lifecycle MUST automatically hand a valid prepared recovery request to its
configured parent-runtime transport, capture and validate the response, and
continue the bounded finding/correction/rereview loop. It MUST NOT ask the
owner to execute a command, approve a prompt, copy a request or response,
retrigger review for a new head, or manufacture runtime evidence. Transport
denial or unavailability MUST fail closed with durable machine-readable
evidence.

#### Scenario: Rereview follows an objective fix
- **WHEN** an independent-review finding is corrected without changing approved
  behavior
- **THEN** the lifecycle reruns affected evidence and retries strict review for
  the complete new diff before any eligible fresh degraded review

#### Scenario: Rereview challenges a prior disposition
- **WHEN** a prior finding was dispositioned as a warning or false positive
- **THEN** the next fresh strict or degraded reviewer independently evaluates
  the finding, disposition, and cited evidence and may return it unresolved

#### Scenario: Authorized degraded lifecycle evidence is current
- **WHEN** an exact change- and transition-bound authorization remains active
  after durable strict unavailability for the same sealed package
- **THEN** the lifecycle may retain a fresh degraded record as reduced-assurance
  evidence for that one transition

#### Scenario: Rereview cannot be performed safely
- **WHEN** strict review is unavailable and no valid degraded authorization or
  constrained fresh fallback can be established
- **THEN** the lifecycle pauses without self-review or a silent downgrade

#### Scenario: New head retriggers the complete review path
- **WHEN** an objective correction or main integration changes the delivery
  head
- **THEN** the lifecycle automatically reruns affected checks, rebuilds the
  sealed package, attempts strict review, invokes eligible parent recovery,
  accepts and dispositions the result, and repeats within budget without
  operator mediation

### Requirement: Autonomous phase entry is controller-routed
The SDD lifecycle SHALL allow complete valid autonomous delivery context to
continue through planning review, Apply, Verify, delivery, Sync, Archive, and
exact owned cleanup. It MUST preserve evidence and authorization gates and
retain standalone phase boundaries when no valid context exists.

#### Scenario: Valid request begins at a later phase entry
- **WHEN** valid selected-entry context is presented after interruption
- **THEN** lifecycle routes it to controller and runs only its first incomplete checkpoint

#### Scenario: Bare phase action is used
- **WHEN** a lifecycle phase has no valid delivery context
- **THEN** that phase remains bounded and grants no downstream delivery authority

### Requirement: Lifecycle completion includes owned-resource reconciliation
The lifecycle SHALL not report autonomous delivery complete until Archive,
configured issue and Project convergence, and finalizer outcomes are current.
Every ineligible or blocked exact resource MUST have durable classification and
recovery evidence.

#### Scenario: Finalization finds an ineligible resource
- **WHEN** finalization cannot safely remove an exact resource
- **THEN** lifecycle records its classification and recovery evidence
