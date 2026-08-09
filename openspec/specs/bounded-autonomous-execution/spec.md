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
completion.

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
different correction attempts for the same failure signature.

#### Scenario: Objective failure has a scoped correction
- **WHEN** formatting, lint, type, schema, deterministic test, link, generated
  exposure, stale fixture, secret-like fixture, or narrow review failure has an
  evidence-backed behavior-preserving fix
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
authorization.

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
