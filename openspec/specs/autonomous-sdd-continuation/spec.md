# autonomous-sdd-continuation Specification

## Purpose
Defines durable, authorization-bound continuation for complete autonomous SDD
delivery without broadening ordinary standalone lifecycle actions.
## Requirements

### Requirement: Complete delivery intake creates durable controller context
The system SHALL accept autonomous continuation only after resolving an explicit
change or ordered queue, mode, quality profile, authorization profile,
independent-review policy, and expiry. Before it selects work or mutates state,
it MUST invoke one declared initialization transition that durably creates a
portable selected-entry controller record and its matching v2 run. The
controller record MUST bind the authorization digest, selected entry,
repository, expiry, lifecycle chain, phase, and checkpoint location, without
credentials or standing approval grants. The initialization transition MUST NOT
leave an active v2 repository claim unless the exact matching controller record
is durably present and recoverable; an interrupted transition MUST return a
typed recoverable result and make no lifecycle selection. Before admission,
the initializer MUST derive its exact pending controller checkpoint as an
internal exclusion from legacy inventory and MUST NOT submit unrelated JSON as
legacy records. The exclusion MUST NOT be caller-selectable or apply to any
other legacy controller candidate. The controller and its terminal cleanup
receipts MUST reside in a repository-scoped local state location outside every
removable lifecycle worktree. Before creating or selecting a non-primary
lifecycle branch or worktree, the controller MUST durably register its exact
repository, lifecycle role, identity, full head, ownership token, recovery
reference, and pending delivery binding. A registered resource MUST retain its
own delivery evidence as the corresponding lifecycle pull request is merged;
the controller MUST NOT substitute one global final head for distinct resource
deliveries. Each controller record MUST have an immutable generated run
identity and a checkpoint location derived from that identity; persistence MUST
reject replacement by a different recorded run. The controller MUST expose
executable initialization, registration, delivery-binding, and receipt-coupled
cleanup transitions so required resource evidence is produced by lifecycle
work rather than tests. It MUST NOT report a controller or ordered queue entry
complete unless at least one resource was registered and every registered
resource has a current delivery binding plus a terminal completed or
already-completed cleanup receipt.

#### Scenario: Complete target-explicit delivery starts
- **WHEN** a valid autonomous `sdd-delivery` request names one change or queue
- **THEN** the declared initializer reports normalized authorization and
  persists mutually matching v2-run and controller contexts before lifecycle
  selection

#### Scenario: Intake is incomplete or invalid
- **WHEN** a delivery request lacks, conflicts on, or invalidly formats required input
- **THEN** the controller makes no selection or mutation and returns one consolidated clarification

#### Scenario: Initialization is interrupted before admission completes
- **WHEN** initialization is interrupted before the v2 run and exact controller
  record can both be verified
- **THEN** it makes no lifecycle selection and leaves no active repository
  claim without a recoverable matching controller context

#### Scenario: Installed initializer inventories real Git-common state
- **WHEN** the manifest-declared initializer writes its pending schema-5
  checkpoint in a real repository's Git common controller directory
- **THEN** it excludes that exact checkpoint from legacy inventory, admits the
  matching v2 bundle, returns mutually matching controller, parent-run,
  work-unit, and claim identities, and resumes the same identities on retry

#### Scenario: Genuine legacy ambiguity remains during initialization
- **WHEN** the same Git-common directory contains another malformed,
  unknown-schema, or unreconciled active legacy controller candidate
- **THEN** initialization pauses before creating the v2 parent run, work unit,
  or claim and preserves the candidate unchanged

#### Scenario: Lifecycle resource is registered before creation
- **WHEN** the controller is about to create an implementation, Sync, or Archive
  worktree or local branch for its selected entry
- **THEN** it persists an exact pending ownership record before the resource is
  eligible for a later cleanup transition

#### Scenario: Separate lifecycle deliveries are squash merged
- **WHEN** implementation, Sync, and Archive each merge through distinct
  squash pull requests
- **THEN** the controller binds each registered resource to its own exact topic
  head, pull request, and delivered default-branch head without relying on
  ancestry to a later lifecycle merge

#### Scenario: Lifecycle worktree is removed after Archive
- **WHEN** a registered worktree passes the exact post-Archive cleanup gate
- **THEN** its controller and terminal cleanup receipt remain recoverable from
  repository-scoped state outside that worktree

#### Scenario: Controller checkpoint collides with another run
- **WHEN** persistence targets a checkpoint owned by a different run identity
- **THEN** it rejects the replacement and preserves the existing record

#### Scenario: Executable cleanup transition completes
- **WHEN** registered resources pass exact post-Archive cleanup gates
- **THEN** the controller persists each receipt outside the target worktree and
  returns the updated record

#### Scenario: Cleanup evidence is incomplete
- **WHEN** a caller tries to complete cleanup or advance an ordered queue with
  no registered resource or without a terminal receipt for every resource
- **THEN** the controller pauses or rejects the transition and retains the
  recoverable records

### Requirement: Controller resumes at first incomplete evidenced phase
The controller SHALL re-read its durable record, checkpoint, OpenSpec state,
Git state, and configured external evidence on every phase entry. It MUST run
only the first incomplete or stale authorized phase and pause on expired,
forged, conflicting, or unverifiable context.

#### Scenario: Interrupted valid run resumes
- **WHEN** a valid unexpired record has complete planning but no current Apply evidence
- **THEN** the controller resumes at Apply after its planning gate

#### Scenario: Context no longer matches durable state
- **WHEN** selected entry, authorization digest, repository, expiry, or checkpoint conflicts
- **THEN** the controller pauses before the affected phase and infers no replacement target

### Requirement: Controller phase advancement is an executable durable transition
The installed autonomous SDD controller SHALL expose a transition that advances
only the first incomplete lifecycle phase of an admitted exact run. It MUST
require current evidence whose exact phase, reference, relative artifact paths,
and SHA-256 digests validate against regular, non-metadata files beneath the
target repository; validate the selected entry, authorization, repository, checkpoint
identity, expiry, and phase order; and persist the updated checkpoint before
reporting success. The transition MUST reject a skipped, stale, conflicting,
expired, caller-substituted, malformed, or artifact-mismatched phase without
changing the record.

#### Scenario: Completed proposal advances to planning review
- **WHEN** an admitted controller has `propose` as its first incomplete phase
  and receives current evidence bound to its exact proposal artifacts
- **THEN** the controller persists `propose` as complete and reports
  `planning-review` as the next phase

#### Scenario: Caller attempts to skip or replace a phase
- **WHEN** a request names any phase other than the record's first incomplete
  phase or supplies stale/conflicting evidence
- **THEN** the controller returns a typed pause and preserves the checkpoint

#### Scenario: Phase evidence does not bind exact artifacts
- **WHEN** evidence has missing, extra, phase-mismatched, unsafe, metadata,
  symlinked, or digest-mismatched artifacts
- **THEN** the controller returns a typed pause and preserves the checkpoint

#### Scenario: Equivalent Claude and Codex requests use one transition
- **WHEN** equivalent valid phase-evidence requests are submitted through
  Claude and Codex installed exposure
- **THEN** both use the same canonical controller transition and only the
  first idempotent persistence changes the exact checkpoint

### Requirement: Standalone phases retain ordinary boundaries
A generated or ordinary lifecycle phase SHALL remain at its phase-local boundary
unless it discovers valid controller context for the exact selected entry. A
valid context MUST return control to the controller rather than grant a phase
new authority.

#### Scenario: Standalone Propose is invoked
- **WHEN** Propose is invoked without validated active delivery context
- **THEN** it creates only planning artifacts and stops before Apply

#### Scenario: Valid controller invokes a phase
- **WHEN** a validated controller context reaches a lifecycle phase
- **THEN** phase work completes and the controller evaluates the next authorized checkpoint

### Requirement: Controller context persists reviewed issue-intake binding and evidence
The run-specific autonomous SDD controller SHALL persist one exact reviewed
issue-intake binding for its selected entry before issue publication. The
binding MUST include the canonical payload digest, configured repository,
title, managed labels, managed block, operation, expiry, ownership and recovery
reference, and MUST contain no credential. After create-or-reuse, the
controller MUST bind the returned issue number, URL, state, labels, and current
evidence to the same payload digest. Resume MUST reread that durable record and
reconcile the first incomplete intake action without inferring a replacement
payload or re-requesting a skill-level approval when the exact binding and
runtime permission remain current.

#### Scenario: Reviewed intake is registered before publication
- **WHEN** planning produces the exact issue payload for an autonomous
  prototype selected entry
- **THEN** the controller persists the reviewed pending binding before any
  issue mutation occurs

#### Scenario: Issue evidence is bound after create-or-reuse
- **WHEN** configured intake creates or finds the exact bound issue
- **THEN** the controller persists the issue identity and current evidence
  against the same selected entry and payload digest

#### Scenario: Interrupted intake resumes
- **WHEN** a run resumes with a valid unexpired pending or delivered issue
  binding
- **THEN** the controller reconciles the exact issue action and proceeds from
  its first incomplete evidenced state without generating a different payload

#### Scenario: Intake record conflicts on resume
- **WHEN** the current payload, selected entry, repository, title, digest,
  issue identity, or expiry conflicts with the durable intake record
- **THEN** the controller pauses before external mutation and preserves the
  original binding and recovery evidence

### Requirement: GitHub lifecycle actions retain authentication-context recovery evidence
Before an autonomous SDD lifecycle action invokes GitHub CLI, the controller
SHALL obtain current non-secret authentication-context evidence for its exact
authorized operation. On an authentication-shaped restricted-runtime failure,
the controller MUST use the canonical contrast diagnostic before classifying
the action as an invalid credential or a runtime-permission gap. It MUST retain
the normalized result and recovery reference in durable controller evidence
and MUST pause when the result is invalid-or-expired, host-denied, unknown,
expired, or mismatched.

#### Scenario: Exact issue intake encounters a restricted-runtime 401
- **WHEN** a current controller-bound issue intake probe fails with a
  normalized authentication-shaped restricted-runtime result
- **THEN** the controller performs only the bound read-only contrast path and
  preserves its safe recovery class before reconsidering the exact intake
  operation

#### Scenario: Authentication context does not authorize a new action
- **WHEN** host-context preflight succeeds for an autonomous lifecycle run
- **THEN** the controller still requires the selected-entry authorization,
  exact target binding, active runtime permission, and all lifecycle evidence
  before invoking a GitHub mutation

### Requirement: Autonomous continuation persists v2 admission before lifecycle selection
The system SHALL persist a v2 parent run and isolated selected work unit before
it selects an OpenSpec lifecycle phase for an autonomous `sdd-delivery`
request. The persisted admission MUST bind the normalized authorization digest,
repository identity, history provider, claim provider, immutable run identity,
derived checkpoint reference, selected change, expiry, and initial ownership
generation without credentials or standing approval. Controller entrypoints
MUST expose a durable initial-admission operation and MUST reject a request
whose existing durable identity, authorization, repository, provider binding,
expiry, or selected work unit conflicts.

#### Scenario: Valid target-explicit autonomous request begins
- **WHEN** a valid unexpired autonomous `sdd-delivery` request names one
  change and its repository passes v2 admission
- **THEN** the system durably records the parent run and selected work unit
  before it reports or executes the first lifecycle checkpoint

#### Scenario: Controller only constructs an ephemeral record
- **WHEN** a controller entrypoint can construct an admission record but cannot
  durably persist the exact v2 admission transition
- **THEN** it reports admission unavailable and does not select or execute a
  lifecycle phase

#### Scenario: Resume conflicts with immutable admission
- **WHEN** a resumed request conflicts with durable run identity,
  authorization, selected work unit, repository identity, provider binding, or
  expiry
- **THEN** the system pauses before lifecycle selection and preserves the
  original records for recovery

### Requirement: Cross-assistant entrypoints use the same v2 admission contract
The system SHALL expose the same v2 admission, inspection, and recovery
behavior through assistant-neutral canonical assets and thin Claude/Codex
wrappers. A wrapper MUST NOT create a competing run record, infer a worktree
location as repository identity, or relax v2 claim and history checks.

#### Scenario: Codex and Claude submit equivalent requests
- **WHEN** equivalent valid autonomous requests are submitted through Codex and
  Claude entrypoints against the same repository
- **THEN** both resolve the same contract behavior and the second mutating
  admission is rejected while the first repository claim remains active

### Requirement: Reconciliation is a controller-gated pre-admission checkpoint
The autonomous SDD controller SHALL expose reconciliation as a distinct,
non-lifecycle pre-admission checkpoint and SHALL require an exact
owner-authorized legacy-record binding before it examines or publishes a
reconciliation receipt. The checkpoint MUST use assistant-neutral canonical
behavior through thin Claude and Codex entrypoints, preserve non-secret
evidence and recovery references, and return control to ordinary v2 admission
only after successful terminal reconciliation. It MUST NOT select an OpenSpec
lifecycle phase, create a v2 run, or perform GitHub mutation as part of the
checkpoint.

#### Scenario: Controller performs a valid reconciliation checkpoint
- **WHEN** Codex or Claude submits the same valid exact reconciliation request
  through the canonical controller entrypoint
- **THEN** both receive the same durable receipt result and neither entrypoint
  creates a lifecycle run or selects a change phase

#### Scenario: Controller receives an unauthorized reconciliation request
- **WHEN** the controller receives a reconciliation request with missing,
  expired, conflicting, or broader-than-bound legacy authority
- **THEN** it pauses before modifying controller state, legacy records, v2
  admission state, or external lifecycle resources

### Requirement: Stale schema-5 checkpoint reconciliation requires owner authorization and archive evidence

The system SHALL reconcile a non-terminal schema-5 controller checkpoint as
compatible terminal only when an exact owner-authorized reconciliation binding
and immutable local v2 archive evidence bind the same repository, selected
change, run identity, and expiry. Reconciliation MUST publish an immutable
receipt and MUST NOT mutate or delete the checkpoint or its archive. An
unauthorized, expired, or mismatched binding MUST leave the checkpoint ambiguous
and pause initialization without mutation.

#### Scenario: Owner-authorized stale checkpoint reconciles

- **WHEN** a stale schema-5 checkpoint matches an exact owner-authorized
  reconciliation binding and its archived v2 run contains a matching
  terminalization or cancellation receipt
- **THEN** initialization classifies the checkpoint compatible terminal and
  continues ordinary admission without rewriting the checkpoint or archive

#### Scenario: Unauthorized or mismatched reconciliation is rejected

- **WHEN** a reconciliation binding is missing, expired, or does not match the
  checkpoint's repository, selected change, record digest, or expiry
- **THEN** the checkpoint remains ambiguous and initialization pauses without
  mutation

### Requirement: Autonomous continuation consumes normalized operation-contract inputs
Before lifecycle selection, autonomous continuation SHALL obtain the effective
authorization, profile, review policy, agent topology, allowed operation set,
and typed gate/outcome contract from the canonical autonomous SDD operation
contract. It MUST bind the normalized values and their source to durable
admission evidence. The controller MUST use compact public lifecycle stages and
registry-defined internal operations rather than inferring policy from a
skill name, caller, or free-form model output.

#### Scenario: Controller begins an admitted run
- **WHEN** v2 admission accepts a target-explicit autonomous request
- **THEN** the controller persists and uses the matching normalized
  operation-contract inputs before selecting its first lifecycle checkpoint

#### Scenario: Continuation input conflicts with the operation contract
- **WHEN** a requested profile, review policy, topology, stage, or operation
  conflicts with the canonical normalized contract
- **THEN** the controller pauses before lifecycle selection and preserves the
  conflicting durable evidence

### Requirement: Exact bootstrap cleanup attachment is a separate, bounded transition
The controller SHALL attach legacy cleanup resources to an existing v2 run only
through a separately invoked, expiry-bound bootstrap-repair transition. The
transition MUST bind one existing parent run, work unit, claim, repository,
approved change, and signed migration record per resource. It MUST verify the
fresh resource inspection, persist the attached record and every cleanup
receipt outside removable worktrees, and MUST NOT create a v2 run, claim,
lifecycle checkpoint, or replacement admission record.

#### Scenario: Signed migration attaches to the named bootstrap run
- **WHEN** an unexpired repair binding and a signed migration both match one
  freshly inspected eligible legacy resource for the named active run
- **THEN** the controller persists only that attached resource and returns a
  recovery-safe cleanup record for the existing run

#### Scenario: Attachment exceeds its exact repair scope
- **WHEN** a migration names another run, resource, repository, head, owner,
  or expired repair binding
- **THEN** the controller returns a typed pause without changing run state,
  claims, cleanup records, or local resources

#### Scenario: Attachment cannot imitate normal admission
- **WHEN** a caller submits a valid bootstrap cleanup attachment
- **THEN** the controller preserves the original admission bytes and creates
  neither a new v2 run nor a new native claim

### Requirement: Initialization recognizes only evidence-verified terminal v2 controllers
Before legacy compatibility classification, the initializer SHALL recognize a prior schema-5 controller as compatible terminal only when the controller is complete and immutable local v2 archive evidence binds the same repository, authorization, selected change, parent run, work unit, claim, terminalization receipt, and released-claim disposition. Recognition MUST be derived internally from configured repository state and MUST NOT be caller-selectable. The initializer MUST preserve the controller and archive records unchanged.

#### Scenario: Prior terminal schema-5 controller permits later initialization
- **WHEN** Git-common inventory contains a prior schema-5 controller whose completed state and admission identities exactly match a valid archived v2 run, terminalization receipt, and claim release for the configured repository and selected change
- **THEN** initialization classifies that controller as compatible terminal and continues ordinary admission without rewriting either audit record

#### Scenario: Terminal-looking controller lacks matching archive evidence
- **WHEN** a prior schema-5 controller appears complete but its archived run, terminalization receipt, claim release, repository, authorization, selected change, parent, work unit, claim, provider, or digest evidence is missing or mismatched
- **THEN** initialization treats that controller as ambiguous and pauses before creating a parent run, work unit, or claim

#### Scenario: Pending or active schema-5 controller remains authoritative
- **WHEN** Git-common inventory contains a prior schema-5 controller whose lifecycle or v2 admission has not been proven terminal
- **THEN** initialization pauses without excluding, reconciling, deleting, or modifying that controller

#### Scenario: Installed initializer evaluates real prior terminal state
- **WHEN** the manifest-declared initializer runs against a real Git common directory containing its own pending checkpoint and a different evidence-verified terminal schema-5 checkpoint backed by a real local v2 archive layout
- **THEN** it excludes only its own checkpoint, accepts only the verified terminal sibling, persists matching new v2 identities, and resumes those identities on retry

### Requirement: Installed controller cleanup executes canonical local operations
The installed autonomous-SDD controller wrapper SHALL provide the canonical
fresh local-resource inspection, exact worktree removal, and exact local-branch
delete operations to the controller cleanup transition. It MUST use repository
Git-common state, retain remote branches, persist outcomes through the
controller record, and return a typed pause instead of substituting an
unverified manual cleanup path.

#### Scenario: Installed wrapper cleans a complete delivery
- **WHEN** the installed wrapper receives an exact completed controller record with eligible local resources and current Archive convergence evidence
- **THEN** it executes the controller cleanup transition and returns the persisted receipt-coupled outcomes

#### Scenario: Installed wrapper cannot inspect a safe resource
- **WHEN** the wrapper cannot freshly establish the required local eligibility for a registered resource
- **THEN** it returns a typed paused result and performs no removal

### Requirement: Installed controller exposes pending-checkpoint retirement recovery
The installed autonomous SDD controller SHALL expose one assistant-neutral
transition that evaluates and retires an exact expired never-admitted pending
checkpoint under current owner authority. The transition MUST derive repository
state from the explicit target repository and configured local state root,
publish only the immutable retirement receipt after all absence checks pass,
and return a typed idempotent result. It MUST NOT select work, advance a phase,
delete or rewrite a checkpoint, create a claim, or fall back to workspace code
when the installed transition is unavailable.

#### Scenario: Claude and Codex request the same retirement
- **WHEN** Claude or Codex invokes the declared installed transition with the
  same valid exact retirement request
- **THEN** both use the same canonical validation and receipt-publication path,
  and only the first invocation publishes evidence

#### Scenario: Retirement transition cannot prove absence
- **WHEN** configured state is unreadable, ambiguous, or contains any matching
  active or archived v2 identity
- **THEN** the transition pauses without lifecycle selection or mutation and
  reports the exact recovery classification

#### Scenario: Installed transition is unavailable
- **WHEN** the active installed runtime does not declare the retirement
  transition or fails its integrity contract
- **THEN** the caller pauses and MUST NOT invoke a workspace-relative substitute
