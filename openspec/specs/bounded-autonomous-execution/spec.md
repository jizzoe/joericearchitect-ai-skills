## Purpose

Defines reusable bounded long-running work execution behavior for AI-assisted
goals that may continue across multiple reviewable steps without routine human
prompts while preserving explicit authorization, evidence gates, recovery, and
human control over material or destructive decisions.
## Requirements

### Requirement: Runs require explicit bounded authorization
The runner SHALL require explicit run authorization that identifies the intended
objective, allowed work selection policy, allowed mutation classes, forbidden
actions, expiration or stopping conditions, and evidence required for
completion. Before each action, a deterministic operation checker SHALL also
confirm that the action is in the named fixed profile allowlist, explicitly
present in `allowedMutations`, targets an authorized workspace path, record, or
configured adapter, and is permitted by both the configured adapter capability
and active runtime permission.

#### Scenario: Authorization is sufficient
- **WHEN** a run authorization names the target repository, work queue or
  deterministic selection policy, allowed lifecycle transitions, external
  mutation boundaries, and stopping conditions
- **THEN** the runner may proceed only within those stated bounds and reports
  the effective authorization before selecting work

#### Scenario: Authorization is missing a material boundary
- **WHEN** a requested run omits the target repository, mutation boundaries, or
  stopping conditions
- **THEN** the runner pauses for a human decision before selecting work or
  mutating local or external state

#### Scenario: Authorization conflicts with runtime permissions
- **WHEN** the authorization allows an action that the active sandbox, approval
  policy, tool access, or credential scope does not permit
- **THEN** the runner reports the permission gap and a safe resume path without
  weakening sandbox, approval, credential, or repository controls

#### Scenario: An operation fails an additional deterministic boundary
- **WHEN** an action is outside the active profile allowlist, omitted from
  `allowedMutations`, targets an unauthorized resource, lacks the configured
  adapter capability, or has expired authorization
- **THEN** the runner pauses before the action and reports the failed boundary
  and safe resume requirement

### Requirement: Work selection is deterministic and dependency-aware
The runner SHALL select work from either an explicitly ordered queue or a
deterministic policy based on approved dependency, priority, sequence, status,
and shared-resource data.

#### Scenario: One item is uniquely eligible
- **WHEN** exactly one work item satisfies the authorized dependency,
  priority, sequence, status, and shared-resource policy
- **THEN** the runner selects that item and records the evidence used for
  selection

#### Scenario: Multiple items are materially equivalent
- **WHEN** more than one work item is eligible and the approved policy cannot
  produce a unique safest next item
- **THEN** the runner reports the candidates and pauses for human selection

#### Scenario: A dependency is unresolved
- **WHEN** a work item has an incomplete hard dependency, unresolved blocker,
  dependency cycle, or unsafe shared-resource conflict
- **THEN** the runner excludes that item from automatic selection and reports
  the blocker

### Requirement: Implementation proceeds in reviewable bounded batches
The runner SHALL execute implementation in small dependency-valid batches that
are independently reviewable, recoverable, and supported by task-specific
evidence.

#### Scenario: Batch is safe to execute
- **WHEN** three to five cohesive tasks have satisfied dependencies and no
  high-risk shared-state boundary requires a smaller batch
- **THEN** the runner may execute the batch and records the selected tasks,
  expected files, validations, reviews, and recovery point

#### Scenario: Batch risk is high
- **WHEN** a task changes credentials, security posture, shared external state,
  generated exposure, or another high-risk boundary
- **THEN** the runner reduces the batch or pauses according to the human-pause
  classification before changing state

#### Scenario: Task evidence is incomplete
- **WHEN** a task lacks its required test, validation, review, recovery, or
  documentation evidence
- **THEN** the runner does not mark that task complete

### Requirement: Objective corrections are bounded
The runner SHALL automatically correct objective, narrowly scoped,
behavior-preserving failures and SHALL stop after no more than three materially
different correction attempts for the same canonical failure signature. The
budget MUST be owned by the stable command or gate, normalized error class,
affected artifact or target, lifecycle transition, and task batch; timestamps,
temporary paths, superficial wording, retries, or restatements MUST NOT create
a new signature. The runner MAY complete more than three aggregate corrections
when they belong to distinct canonical signatures and the overall authorization
remains active. Each correction MUST separately pass the active profile,
allowed-mutation, target, adapter, runtime-permission, and run-bound checks
before execution and MUST record its hypothesis, bounded change, and rerun
evidence.

#### Scenario: Objective failure has a scoped correction
- **WHEN** a deterministic check or local-review failure has an evidence-backed
  behavior-preserving fix and the correction passes all active operation checks
- **THEN** the runner applies the correction, reruns every affected check and
  required review, and records the correction evidence without a routine human
  pause

#### Scenario: Distinct signatures progress within the run bound
- **WHEN** more than three aggregate corrections address distinct canonical
  signatures and every correction remains within authorization and expiry
- **THEN** the runner preserves separate ledgers and continues toward evidence
  convergence without treating the aggregate count as exhaustion

#### Scenario: Superficial signature change is attempted
- **WHEN** an unresolved failure is restated with different wording, a temporary
  path, a retry identifier, or another non-canonical difference
- **THEN** the runner assigns the existing canonical signature and does not
  reset its correction budget

#### Scenario: Correction would change approved behavior
- **WHEN** a correction would require a new requirement, altered observable
  behavior, material architecture choice, broader credential access, data loss,
  or governance change
- **THEN** the runner pauses for human judgment instead of applying the
  correction

#### Scenario: Correction budget is exhausted
- **WHEN** three materially different correction attempts for the same canonical
  failure signature do not resolve the failure
- **THEN** the runner refuses a fourth attempt and preserves a durable
  intervention report with the attempts, current evidence, and safe resume
  requirement

### Requirement: Reviews and evidence gates are mandatory
The runner SHALL run applicable validation, testing, documentation review,
security and supply-chain review, requirements mapping, portability checks,
attribution checks, and recovery review before claiming a batch, lifecycle
transition, or run is complete.

#### Scenario: Independent evidence is available
- **WHEN** deterministic tests, linters, OpenSpec validation, CI checks,
  Codex Auto-review, or separate reviewer agents are available for the changed
  behavior
- **THEN** the runner uses that evidence before relying on self-review

#### Scenario: Review produces findings
- **WHEN** a review reports a finding
- **THEN** the runner classifies it as objective-fix, human-decision,
  non-blocking warning, or false positive with evidence before proceeding

#### Scenario: Evidence is missing
- **WHEN** required evidence is absent, stale, or not tied to the current
  artifacts or commit
- **THEN** the runner reports the gap and does not claim completion

### Requirement: Human-pause classification is enforced
The runner SHALL pause for material requirements, architecture, compatibility,
data ownership, security, licensing, governance, credential, destructive,
unexpected external-state, unresolved dependency, persistent environment, or
exhausted correction-budget decisions.

#### Scenario: Material decision appears
- **WHEN** progress requires deciding a missing or conflicting observable
  requirement, compatibility behavior, security posture, license obligation, or
  governance rule
- **THEN** the runner pauses and reports the decision needed with available
  evidence

#### Scenario: Destructive or unexpected action appears
- **WHEN** a command or external mutation would delete a repository, force-push
  a shared branch, hard reset, rotate or expose secrets, weaken controls,
  mutate unrelated records, or target unexpected external state
- **THEN** the runner stops before the action and requests explicit human
  authorization

#### Scenario: Objective local failure appears
- **WHEN** a deterministic formatting, lint, type, link, schema, or test
  failure has a scoped behavior-preserving correction
- **THEN** the runner does not pause solely for that failure

### Requirement: External mutations stay inside authorized boundaries
The runner SHALL perform external mutations only when the target, mutation
class, preconditions, recovery behavior, and evidence are covered by the active
authorization. First-release profiles MUST pause external send, calendar update,
submission, release, and deployment even when another authorization field names
them. The `sdd-delivery` profile MAY perform the named `merge-pr`,
`archive-change`, or `delete-merged-topic-branch` operation without another
routine prompt only when the active bounded authorization explicitly names that
exact transition, target, evidence, recovery behavior, and expiration, and
every existing lifecycle, adapter-capability, and runtime-permission gate passes.

#### Scenario: Expected mutation is authorized
- **WHEN** an issue, Project, branch, pull request, merge, Sync, Archive, or
  merged-topic-branch deletion matches the active authorization and every
  objective precondition passes
- **THEN** the runner may perform the mutation and records resulting URLs,
  statuses, commits, and recovery evidence

#### Scenario: External target is unexpected
- **WHEN** a mutation targets an unapproved repository, Project, issue, pull
  request, branch, secret, workflow, or record type
- **THEN** the runner stops before the mutation and reports the mismatch

#### Scenario: Mutation is repeated
- **WHEN** an authorized mutation is rerun after interruption or partial
  completion
- **THEN** the runner converges to the existing intended state without creating
  duplicates or losing human-authored content

#### Scenario: A first-release profile requests a reserved action
- **WHEN** a run requests external send, calendar update, submission, release,
  deployment, a generic merge/archive/deletion, or a named SDD high-impact
  transition outside the `sdd-delivery` profile
- **THEN** the operation checker pauses and requires separate explicit
  authorization under a later policy

#### Scenario: An exact SDD delivery transition is authorized
- **WHEN** `sdd-delivery` requests the named `merge-pr`, `archive-change`, or
  `delete-merged-topic-branch` transition and the bounded authorization, exact
  target, lifecycle evidence, recovery behavior, expiration, adapter capability,
  and runtime permission all match
- **THEN** the runner performs that transition without another routine prompt
  and records its resulting evidence

#### Scenario: An SDD delivery transition lacks an exact boundary
- **WHEN** `sdd-delivery` requests a high-impact transition without any required
  exact authorization or objective gate
- **THEN** the runner pauses before mutation and reports the unmet boundary

### Requirement: Checkpoints are durable and idempotent
The runner SHALL derive resume state from authoritative Git, OpenSpec, GitHub,
Project, living-spec, archive, and evidence records whenever possible and SHALL
avoid treating transient logs as competing sources of truth.

#### Scenario: Run resumes after interruption
- **WHEN** a run resumes after cancellation, timeout, approval denial, network
  failure, or partial external mutation
- **THEN** the runner rereads authoritative state, reports drift, and continues
  from the first incomplete evidenced step

#### Scenario: Completed transition is rerun
- **WHEN** a completed transition is invoked again
- **THEN** the runner reports a no-op or reconciles safely to the same state
  without duplicate records or content loss

#### Scenario: Durable evidence conflicts
- **WHEN** Git, OpenSpec, GitHub, Project, living-spec, or archive state
  conflict and precedence is not established by approved policy
- **THEN** the runner pauses for human review instead of guessing

### Requirement: Reusable runner behavior is portable
The runner SHALL separate product-neutral policy from product-specific
configuration so a second repository and a non-OpenSpec workflow can reuse the
same authorization, batching, review, correction, checkpoint, and human-pause
behavior.

#### Scenario: Second repository uses the runner
- **WHEN** the runner is evaluated against a repository with different owner,
  Project, branch, issue, path, and repository-collection values
- **THEN** product-neutral behavior works through configuration without editing
  canonical runner policy

#### Scenario: Non-OpenSpec workflow uses the runner
- **WHEN** a workflow adapter supplies its own work items, transitions,
  validations, and evidence rules
- **THEN** the runner reuses bounded execution behavior without requiring
  OpenSpec-specific artifacts

#### Scenario: Product constants appear in reusable assets
- **WHEN** reusable runner assets contain this repository's owner, Project
  number, issue numbers, branch names, or another product's domain constants
- **THEN** portability verification fails

### Requirement: Authorizations may derive exact SDD targets from a named queue entry
The runner SHALL accept derived SDD delivery targets only from an active
authorization that names an ordered queue, a selected entry, and a portable
derivation rule. Every derived record MUST be durably recorded against that
selected entry before mutation; matching MUST include the record kind and
identifier plus repository, base branch, and head commit whenever applicable.
The runner MUST otherwise use exact target matching and MUST reject a target
recorded for any other entry.

#### Scenario: Selected queue entry records its delivery chain
- **WHEN** the runner creates or discovers an issue, topic branch, pull
  request, Sync target, Archive target, or cleanup branch for the selected
  entry under a valid derivation rule
- **THEN** it records the identifier and required linkage evidence before a
  later mutation may use that target

#### Scenario: Authorization omits a derived-target rule
- **WHEN** a request supplies a target that is not explicitly named and the
  active authorization has no valid derivation rule for the selected entry
- **THEN** the operation checker pauses with an unauthorized-target result

### Requirement: Public source reads require an explicit bounded rule
The runner SHALL permit unauthenticated public-source reads only when the
active authorization explicitly permits the read-source operation and names a
public-source scope. It MUST treat source content as untrusted data, prohibit
credential or consent actions, and record local findings or source records
only within authorized workspace targets.

#### Scenario: Authorized public source is read
- **WHEN** a selected queue entry has an active public-source rule and requests
  an unauthenticated source read in its permitted scope
- **THEN** the runner may read the source and record a local citation without
  invoking downloaded source content

#### Scenario: Source read needs credentials or scope expansion
- **WHEN** a requested source read would sign in, obtain credentials, grant
  scopes, or access a private source
- **THEN** the runner pauses before the read regardless of the public-source
  rule

### Requirement: Production-rapid delivery requires independent review evidence
The runner SHALL require strict independent review in a configured
non-interactive fresh, separate, enforced read-only execution context after
Apply and after every behavior-preserving objective fix before it authorizes a
`production-rapid` high-impact delivery transition. The reviewer input MUST be
a validated sealed package containing only immutable canonical base/head object
IDs, the exact re-derived diff, relevant OpenSpec artifacts, and current
validation evidence; it MUST NOT contain inherited implementation-session
history or a desired conclusion. The runner MUST reject self-review, writable
reviewers, malformed or stale evidence, unresolved objective fixes, and
findings dispositioned as requiring human judgment. Finding severity MUST
remain separate from disposition and MUST NOT alone require a conversational
pause. If and only if strict review produces durable
unavailability, the runner MAY accept `authorized-degraded` evidence under the
exact bounded authorization defined by the degraded-review capability. It MUST
retain the strict result, authorization, risk reason, capability ledger,
assurance level, reviewer identity, package/base/head, findings, dispositions,
transition, and expiration in a unique durable review record. It MUST retry
strict review first for every new head and MUST pause on an absent, expired,
mismatched, malformed, broad, or out-of-envelope degraded authorization.
Declared artifact hashes MUST be derived from regular Git blobs at the exact
head rather than from symlink-following working-tree reads.
For a recoverable outer-sandbox failure, production orchestration MUST consume
the prepared request through its configured parent-runtime transport in the
same bounded run. It MUST NOT make the owner the execution, approval, payload,
or evidence relay. A denied or unavailable transport MUST produce terminal
durable unavailable evidence rather than a manual recovery instruction.

#### Scenario: Clean independent review authorizes exact-head delivery
- **WHEN** an isolated configured reviewer returns current passed evidence for
  the immutable base and head after Apply
- **THEN** the runner may use `strict-isolated` review only for the named
  authorized transition

#### Scenario: Caller attempts to bypass the production review gate
- **WHEN** a high-impact SDD transition omits its delivery profile or supplies
  a profile that differs from the resolved durable authorization
- **THEN** the runner rejects the transition before delivery and does not use
  the caller-supplied value to weaken the independent-review requirement

#### Scenario: Objective fix requires review of the new head
- **WHEN** a reviewer identifies a bounded `objective-fix` and the runner
  applies the behavior-preserving fix and reruns affected evidence
- **THEN** the prior result is stale, strict review is attempted for the new
  exact head, and degraded review is eligible only inside its derived envelope

#### Scenario: Caller understates prior correction attempts
- **WHEN** an objective-correction request supplies a counter that differs
  from the selected entry's validated durable correction chain
- **THEN** the runner rejects the request and derives the per-signature limit
  only from that chain and the resolved authorization budget

#### Scenario: Caller renames a failure to reset its budget
- **WHEN** an objective-correction request supplies a failure signature that
  differs from the signature derived from its durable review finding
- **THEN** the runner rejects the request and counts attempts using the finding
  ID, repository-relative evidence path, and transition recorded in durable
  correction evidence

#### Scenario: Warning or false positive remains reviewable
- **WHEN** the implementer records a warning or false-positive disposition with
  cited evidence
- **THEN** the runner gives it to the next fresh strict or degraded reviewer as
  challengeable evidence rather than an intended conclusion

#### Scenario: Reviewer capability or evidence is invalid
- **WHEN** strict review is unavailable but the degraded authorization, sealed
  package, result, capability ledger, reviewer freshness, or detached view is
  missing, stale, mismatched, or mutation-capable
- **THEN** the runner pauses without downgrading the production-rapid gate

#### Scenario: Explicit degraded evidence authorizes exact-head delivery
- **WHEN** strict review is durably unavailable and an exact active degraded
  authorization permits a fresh separate fallback result for the same package
- **THEN** the runner may use only `authorized-degraded` evidence for that
  named transition while preserving the reduced-assurance record

#### Scenario: Objective correction loop remains autonomous
- **WHEN** review identifies an objective, behavior-preserving correction
  inside the per-signature budget
- **THEN** the runner applies it, reruns affected validation, rebuilds the
  exact-head package, and completes a fresh strict-first review path without
  operator relay before reconsidering delivery

### Requirement: Concise SDD delivery requests resolve before mutation
The runner SHALL normalize a concise SDD delivery request into a complete,
durable effective-authorization record before selecting work or mutating local
or external state. The request MUST explicitly provide or unambiguously name a
target change or ordered queue, execution mode, quality profile, authorization
profile, review policy, and expiration. Supported values MUST be published by
the canonical runner. The exact `autonomous` plus `prototype-rapid` matrix MUST
resolve to `same-session-local`; `production-rapid` MUST resolve only to an
independent-review policy allowed by the production contract. The effective
authorization MUST represent routine approval gates separately from required
quality actions and completion-evidence predicates. It MUST preserve the
existing maximum of three materially different behavior-preserving corrections
per canonical failure signature unless the user supplies a narrower budget.
`sdd-delivery` MUST derive only the named change's normal issue, Project item,
OpenSpec, branch, implementation PR, Sync PR, Archive PR, closure, Done-status,
and confirmed merged-branch cleanup targets and MUST NOT authorize deployment,
release, credentials, external messages, or unrelated mutation.

#### Scenario: Autonomous prototype request resolves completely
- **WHEN** a user names an exact target and selects autonomous
  `prototype-rapid` delivery with a valid expiry
- **THEN** the runner records and reports `same-session-local`, no routine
  blocking approval gates, every required quality action, every terminal
  evidence predicate, the exact lifecycle boundary, and the per-signature
  correction budget before work selection

#### Scenario: Concise request resolves completely
- **WHEN** the user names the target and supplies every required request field
  with supported and mutually consistent values
- **THEN** the runner records and reports the expanded effective authorization,
  including the exact lifecycle boundary, approval gates, quality actions,
  completion predicates, review policy, expiration, and correction budget,
  before work selection

#### Scenario: Production request resolves completely
- **WHEN** a user names an exact target and selects `production-rapid`
- **THEN** the runner retains the production independent-review, validation,
  security, portability, attribution, recovery, and Verify gates

#### Scenario: Required shorthand inputs are missing
- **WHEN** one or more required request inputs are absent or ambiguous
- **THEN** the runner performs no work selection or mutation and sends one
  concise clarification that lists every missing input with a short meaning and
  its supported values or value form

#### Scenario: A shorthand value is unsupported
- **WHEN** a supplied request value is unknown or conflicts with another
  controlling input
- **THEN** the runner identifies that field, shows its supported values, and
  pauses without silently choosing a risk-bearing alternative

#### Scenario: A profile and review policy conflict
- **WHEN** a supplied review policy conflicts with the selected execution-mode
  and quality-profile matrix
- **THEN** the runner identifies the conflicting fields and pauses without
  silently upgrading, downgrading, or reinterpreting the request

#### Scenario: Strict-first-degraded is selected
- **WHEN** an eligible non-autonomous-prototype request selects
  `strict-first-degraded`
- **THEN** the effective authorization requires strict review first and permits
  only the exact transition-bound degraded recovery defined by the existing
  independent-review contract after durable strict unavailability

#### Scenario: Runtime permission remains unavailable
- **WHEN** the selected profile authorizes an operation but the configured
  adapter or active runtime permission remains unavailable after bounded
  diagnosis
- **THEN** the runner preserves a durable intervention report and pauses
  without treating authorization as platform permission

### Requirement: Target-explicit SDD shorthand resolves fixed profiles
The runner SHALL accept `ship-sdd <change-or-ordered-queue> prod` or
`prototype`, with optional explicit duration override, only when target is
explicit. It MUST report every effective authorization field before selection
or mutation and MUST NOT infer risk-bearing targets from aliases.

#### Scenario: Production shorthand is complete
- **WHEN** a user provides one explicit change with the `prod` alias
- **THEN** the runner resolves a four-hour autonomous production-rapid
  strict-only `sdd-delivery` authorization

#### Scenario: Prototype shorthand is complete
- **WHEN** a user provides one explicit change with the `prototype` alias
- **THEN** the runner resolves a four-hour autonomous prototype-rapid
  same-session-local `sdd-delivery` authorization with continuous quality and
  terminal evidence predicates

#### Scenario: Shorthand target is omitted
- **WHEN** a user provides a profile alias without explicit change or queue
- **THEN** the runner requests the target and performs no lifecycle work

### Requirement: Delivery preparation writes are narrowly authorized
Within a valid selected-entry delivery run, the runner SHALL permit a
design-brief preparation write only when its exact output path is authorized.
It MUST preserve local-implementation behavior and reject arbitrary
workspace-write expansion.

#### Scenario: Unlisted path is requested
- **WHEN** delivery preparation targets a path absent from its record
- **THEN** the runner rejects the write before filesystem mutation

### Requirement: Autonomous prototype completion requires evidence convergence
An autonomous `prototype-rapid` run SHALL execute every applicable focused
test, critical-flow check, requirement mapping, local code and security review,
OpenSpec Verify, strict OpenSpec validation, authorized lifecycle
reconciliation, and exact-owned cleanup check. It MUST report success only when
every applicable result is current, passing, unresolved-objective-finding free,
and bound to the final target, package, workspace, and head. Failed, missing,
stale, mismatched, skipped-required, or attempted-only evidence MUST NOT be
relabeled as passed.

#### Scenario: All prototype evidence converges
- **WHEN** every applicable required action passes for the final target and head
  and lifecycle and cleanup evidence are current
- **THEN** the runner may report the bounded autonomous prototype run complete

#### Scenario: Evidence is not current
- **WHEN** any required result failed, is missing, stale, mismatched, tied to an
  earlier head, or leaves an unresolved objective finding
- **THEN** the runner creates correction work when safely eligible or stops with
  preserved state and MUST NOT report success

### Requirement: Autonomous prototype issue intake is preauthorized and payload-bound
An autonomous `prototype-rapid` `sdd-delivery` authorization SHALL bind the
reviewed issue-intake payload before lifecycle mutation. The binding MUST name
the selected entry, configured repository, title, managed labels, managed
OpenSpec block, content digest, issue-create-or-reuse operation, expiry, and
idempotent recovery behavior. When the binding, active authorization, exact
target, runtime permission, and planning prerequisites all match, the runner
MUST create or reuse the issue without a separate skill-level human approval
prompt. The binding MUST NOT create host permission, broaden credentials, or
authorize payload drift; a runtime denial or digest mismatch MUST fail closed
with durable recovery evidence.

#### Scenario: Bound issue payload is authorized
- **WHEN** an unexpired autonomous prototype run reaches issue intake with a
  reviewed payload whose digest and configured target match durable
  authorization and the runtime permits the mutation
- **THEN** the runner creates or reuses the exact issue and records its number,
  URL, title, state, labels, and recovery linkage without a routine
  conversational pause

#### Scenario: Existing exact issue is found
- **WHEN** issue intake finds an issue with the exact bound title in the exact
  configured repository
- **THEN** the runner reuses it, preserves human-authored content outside the
  managed block, and creates no duplicate

#### Scenario: Reviewed payload changes after authorization
- **WHEN** the repository, title, labels, managed block, content, digest,
  selected entry, or expiry differs from the durable binding
- **THEN** the runner refuses publication and requires a newly reviewed exact
  binding instead of treating the prior grant as standing approval

#### Scenario: Host runtime denies issue publication
- **WHEN** the exact payload is authorized but active host policy, credential,
  connector, network, or runtime permission denies the mutation
- **THEN** the runner records the permission boundary and safe resume condition
  without bypassing the host, weakening controls, or claiming the skill can
  guarantee publication

### Requirement: Bounded execution routes through canonical operation outcomes
An autonomous SDD runner SHALL use the canonical operation-contract registry
to evaluate execution gates and route every operation result. It MUST retain
existing authorization, target, adapter, runtime-permission, evidence,
correction-budget, and human-pause controls; selecting a `single-agent` or
`multi-agent` topology MUST NOT weaken any of those controls.

#### Scenario: Operation outcome is handled during bounded execution
- **WHEN** a registry-defined operation completes or fails during an active
  bounded run
- **THEN** the runner records and follows its sole canonical disposition before
  considering another operation

#### Scenario: Topology selection changes context separation only
- **WHEN** a run uses an explicit or automatically selected agent topology
- **THEN** the runner preserves the same authorization, quality, review, and
  safety gates regardless of the number of agent contexts
