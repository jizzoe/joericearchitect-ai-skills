## ADDED Requirements

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
