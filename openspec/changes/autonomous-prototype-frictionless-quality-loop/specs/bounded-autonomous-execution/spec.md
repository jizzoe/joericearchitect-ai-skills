## MODIFIED Requirements

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

## ADDED Requirements

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
