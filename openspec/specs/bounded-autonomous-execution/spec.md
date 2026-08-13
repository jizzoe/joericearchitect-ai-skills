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
different correction attempts for the same failure signature. Each correction
MUST separately pass the active profile, allowed-mutation, target, adapter, and
runtime-permission checks before execution.

#### Scenario: Objective failure has a scoped correction
- **WHEN** formatting, lint, type, schema, deterministic test, link, generated
  exposure, stale fixture, secret-like fixture, or narrow review failure has an
  evidence-backed behavior-preserving fix and the correction passes all active
  operation checks
- **THEN** the runner applies the correction, reruns every affected check, and
  records the correction evidence

#### Scenario: Correction would change approved behavior
- **WHEN** a correction would require a new requirement, altered observable
  behavior, material architecture choice, broader credential access, data loss,
  or governance change
- **THEN** the runner pauses for human judgment instead of applying the
  correction

#### Scenario: Correction budget is exhausted
- **WHEN** three materially different correction attempts for the same failure
  signature do not resolve the failure
- **THEN** the runner records the attempts and pauses in a blocked state

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
The runner SHALL require a configured non-interactive reviewer in a fresh,
separate, enforced read-only execution context after Apply and after every
behavior-preserving objective fix before it authorizes a `production-rapid`
high-impact delivery transition. The reviewer input MUST be a validated sealed
package containing only immutable canonical full base and head SHA object IDs,
the accumulated diff re-derived from that exact range, relevant OpenSpec
artifact identities, and current test or validation evidence; it MUST NOT
contain inherited implementation-session history or the implementer's desired
conclusion. The runner MUST reject self-review, unavailable or writable
reviewers, malformed evidence, stale or wrong SHA evidence, and unresolved
blocker, high, or `objective-fix` findings. It MUST record reviewer type and
identity, platform adapter, execution and invocation references, reviewed SHAs,
timestamp, findings, evidence-backed implementer dispositions, and final status.
The evidence MUST bind to a deterministic manifest of the immutable review
input package and a uniquely identified durable transition review record. The
runner MUST derive and compare the accumulated diff from the recorded base and
head through a read-only configured repository adapter, and reject a package or
duplicated durable review record whose provenance is not exact. It MUST compare
reviewer identity and type to a configured reviewer with an enforced read-only
isolation attestation, and resolve recorded base/head identifiers as canonical
lowercase full commit object IDs before accepting evidence. The reviewer input
MUST exactly match configured relevant OpenSpec artifact identities and the
durable current Apply validation-evidence list for the reviewed head. The
selected-entry checkpoint MUST durably store exactly one uniquely identified
current Apply evidence record; the request and review record MUST exactly
reference that record, whose completion time is no later than the review
timestamp. Every finding MUST remain durably visible: objective fixes require
affected validation and a fresh review for the new head, warning and
false-positive dispositions remain challengeable evidence for the next fresh
reviewer, and material findings pause. GitHub review publication MAY supplement
but MUST NOT replace this evidence.

#### Scenario: Clean independent review authorizes exact-head delivery
- **WHEN** a distinct configured isolated read-only reviewer returns complete
  clear evidence for the current immutable base and head after Apply
- **THEN** the runner may treat independent review as current evidence only for
  the named authorized delivery transition

#### Scenario: Objective fix requires review of the new head
- **WHEN** a reviewer identifies a bounded `objective-fix` and the runner
  applies the behavior-preserving fix and reruns affected evidence
- **THEN** the runner rejects the prior review and requires a fresh reviewer
  record for the exact new head before delivery

#### Scenario: Warning or false positive remains reviewable
- **WHEN** the implementer records a warning or false-positive disposition with
  cited evidence
- **THEN** the runner includes it as challengeable evidence in the next fresh
  review and does not present the disposition as a required conclusion

#### Scenario: Reviewer capability or evidence is invalid
- **WHEN** the reviewer is unavailable, is the implementation session, can
  mutate the workspace or GitHub, lacks enforced isolation, or produces
  malformed or stale evidence
- **THEN** the runner pauses without downgrading the `production-rapid` gate
