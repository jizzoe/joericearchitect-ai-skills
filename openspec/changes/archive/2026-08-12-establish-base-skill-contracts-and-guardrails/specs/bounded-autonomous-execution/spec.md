## MODIFIED Requirements

### Requirement: Runs require explicit bounded authorization
The runner SHALL require explicit run authorization that identifies the intended objective, allowed work selection policy, allowed mutation classes, forbidden actions, expiration or stopping conditions, and evidence required for completion. Before each action, a deterministic operation checker SHALL also confirm that the action is in the named fixed profile allowlist, explicitly present in `allowedMutations`, targets an authorized workspace path, record, or configured adapter, and is permitted by both the configured adapter capability and active runtime permission.

#### Scenario: Authorization is sufficient
- **WHEN** a run authorization names the target repository, work queue or deterministic selection policy, allowed lifecycle transitions, external mutation boundaries, and stopping conditions, and a requested operation satisfies its named profile, allowed mutation, target, adapter, and runtime checks
- **THEN** the runner may proceed only within those stated bounds and reports the effective authorization before selecting work

#### Scenario: Authorization is missing a material boundary
- **WHEN** a requested run omits the target repository, mutation boundaries, or stopping conditions
- **THEN** the runner pauses for a human decision before selecting work or mutating local or external state

#### Scenario: Authorization conflicts with runtime permissions
- **WHEN** the authorization allows an action that the active sandbox, approval policy, tool access, or credential scope does not permit
- **THEN** the runner reports the permission gap and a safe resume path without weakening sandbox, approval, credential, or repository controls

#### Scenario: An operation fails an additional deterministic boundary
- **WHEN** an action is outside the active profile allowlist, omitted from `allowedMutations`, targets an unauthorized resource, lacks the configured adapter capability, or has expired authorization
- **THEN** the runner pauses before the action and reports the failed boundary and safe resume requirement

### Requirement: Objective corrections are bounded
The runner SHALL automatically correct objective, narrowly scoped, behavior-preserving failures and SHALL stop after no more than three materially different correction attempts for the same failure signature. Each correction MUST separately pass the active profile, allowed-mutation, target, adapter, and runtime-permission checks before execution.

#### Scenario: Objective failure has a scoped correction
- **WHEN** formatting, lint, type, schema, deterministic test, link, generated exposure, stale fixture, secret-like fixture, or narrow review failure has an evidence-backed behavior-preserving fix and the correction passes all active operation checks
- **THEN** the runner applies the correction, reruns every affected check, and records the correction evidence

#### Scenario: Correction would change approved behavior
- **WHEN** a correction would require a new requirement, altered observable behavior, material architecture choice, broader credential access, data loss, governance change, or an operation outside the active authorization bounds
- **THEN** the runner pauses for human judgment instead of applying the correction

#### Scenario: Correction budget is exhausted
- **WHEN** three materially different correction attempts for the same failure signature do not resolve the failure
- **THEN** the runner records the attempts and pauses in a blocked state

### Requirement: External mutations stay inside authorized boundaries
The runner SHALL perform external mutations only when the target, mutation class, preconditions, recovery behavior, and evidence are covered by the active authorization. First-release profiles MUST pause external send, calendar update, submission, release, and deployment even when another authorization field names them. The `sdd-delivery` profile MAY perform the named `merge-pr`, `archive-change`, or `delete-merged-topic-branch` operation without another routine prompt only when the active bounded authorization explicitly names that exact transition, target, evidence, recovery behavior, and expiration, and every existing lifecycle, adapter-capability, and runtime-permission gate passes.

#### Scenario: Expected mutation is authorized
- **WHEN** an issue, Project, branch, pull request, Sync, or explicitly permitted lifecycle action matches the active authorization and every objective precondition passes
- **THEN** the runner may perform the mutation and records resulting URLs, statuses, commits, and recovery evidence

#### Scenario: External target is unexpected
- **WHEN** a mutation targets an unapproved repository, Project, issue, pull request, branch, secret, workflow, or record type
- **THEN** the runner stops before the mutation and reports the mismatch

#### Scenario: Mutation is repeated
- **WHEN** an authorized mutation is rerun after interruption or partial completion
- **THEN** the runner converges to the existing intended state without creating duplicates or losing human-authored content

#### Scenario: A first-release profile requests a reserved action
- **WHEN** a run requests external send, calendar update, submission, release, deployment, a generic merge/archive/deletion, or a named SDD high-impact transition outside the `sdd-delivery` profile
- **THEN** the operation checker pauses and requires separate explicit authorization under a later policy

#### Scenario: An exact SDD delivery transition is authorized
- **WHEN** `sdd-delivery` requests the named `merge-pr`, `archive-change`, or `delete-merged-topic-branch` transition and the bounded authorization, exact target, lifecycle evidence, recovery behavior, expiration, adapter capability, and runtime permission all match
- **THEN** the runner performs that transition without another routine prompt and records its resulting evidence

#### Scenario: An SDD delivery transition lacks an exact boundary
- **WHEN** `sdd-delivery` requests a high-impact transition without any required exact authorization or objective gate
- **THEN** the runner pauses before mutation and reports the unmet boundary
