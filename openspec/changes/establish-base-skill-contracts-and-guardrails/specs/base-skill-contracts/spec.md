## Purpose

Defines portable, versioned result and optional configuration contracts so reusable skills communicate safely and consistently across assistant platforms.

## ADDED Requirements

### Requirement: Skills emit strict versioned results
The foundation SHALL define `skill-result-v1` as a JSON Schema draft 2020-12 contract with `additionalProperties: false` at its top level. A conforming result MUST have `schemaVersion: 1`, lowercase-kebab-case `skill`, `status`, `mode`, non-empty `summary`, `artifacts`, `evidence`, `assumptions`, `openQuestions`, and `nextAction`; it MAY contain only one extension point, `details`.

#### Scenario: A complete result is validated
- **WHEN** a skill supplies all required fields with values from the defined enums and valid nested objects
- **THEN** local validation accepts the result and a Markdown report derived from it introduces no fields absent from the result

#### Scenario: An unsupported or unknown result contract is supplied
- **WHEN** a result uses an unsupported schema version or unknown top-level field
- **THEN** local validation rejects it and the caller returns a structured blocked result rather than guessing its meaning

### Requirement: Results preserve portable artifact and evidence semantics
The result contract SHALL require each artifact to declare its kind, operation, and non-empty subject; file artifact subjects MUST be workspace-relative and contain neither an absolute path nor a `..` segment. Evidence and open-question identifiers MUST be unique within their respective arrays, and optional evidence references MUST be non-secret.

#### Scenario: A result references a workspace artifact
- **WHEN** an artifact of kind `file` names a normalized workspace-relative path and evidence identifiers are unique
- **THEN** validation accepts the artifact and evidence records

#### Scenario: A result leaks an unsafe path or duplicate identifier
- **WHEN** a file artifact is absolute or traverses upward, or an evidence or open-question identifier is repeated
- **THEN** validation rejects the result deterministically

### Requirement: Optional product configuration is strict and non-secret
The foundation SHALL define `ai-skills-config-v1` as an optional JSON Schema draft 2020-12 contract for `config/ai-skills.json`. When present it MUST have `schemaVersion: 1`, reject unknown keys, and permit only the documented non-secret defaults, named paths, adapter declarations, policy identifiers, and boolean feature flags.

#### Scenario: A product supplies valid configuration
- **WHEN** configuration provides only valid workspace-relative path defaults, kebab-case names, and adapter capabilities from the operation vocabulary
- **THEN** validation accepts it without embedding product values in canonical reusable assets

#### Scenario: Configuration is absent or unsafe
- **WHEN** `config/ai-skills.json` is absent
- **THEN** callers require every destination or path explicitly

#### Scenario: Configuration contains an unknown, unsafe, or unsupported value
- **WHEN** configuration has an unknown key or schema version, an absolute or upward-traversing path, duplicate adapter operation, or credential-like connection detail
- **THEN** validation rejects it rather than applying a default or persisting sensitive state

### Requirement: Contracts remain portable across assistant platforms
The contracts SHALL define assistant-neutral JSON behavior and SHALL be validated through synthetic fixtures in a second workspace whose configured paths differ from this repository.

#### Scenario: A second workspace uses different configured paths
- **WHEN** the same contract fixture is evaluated with a different workspace root and valid product-owned paths
- **THEN** it validates without edits to canonical schemas or assistant wrappers

### Requirement: High-impact delivery approvals follow mode and profile policy
The foundation SHALL treat execution mode and delivery profile as independent
inputs to approval behavior. Interactive `production-rapid` work MUST obtain a
just-in-time approval before `merge-pr`, `delete-merged-topic-branch`, or
`archive-change` after its objective gates pass. A bounded autonomous run or
an explicitly selected `prototype-rapid` one-change delivery MAY proceed
without that routine prompt only when its active bounded authorization or
recorded prototype delivery preapproval explicitly names the exact operation,
target, evidence, recovery behavior, and expiration; runtime permission and
every lifecycle gate MUST still pass. A prototype delivery preapproval MUST
not be reused as a standing grant or treated as an autonomous-runner invocation.

#### Scenario: Normal interactive production delivery reaches a high-impact transition
- **WHEN** interactive `production-rapid` work reaches a verified merge,
  merged-topic-branch deletion, or content-preserving OpenSpec Archive
- **THEN** it pauses for a just-in-time approval before the named transition

#### Scenario: An exact autonomous or prototype delivery authorization is complete
- **WHEN** an active bounded autonomous run or selected `prototype-rapid`
  one-change delivery explicitly covers one named high-impact transition and
  its target, evidence, recovery behavior, expiration, runtime permission, and
  lifecycle gates all pass
- **THEN** it proceeds without another routine prompt and records the evidence

#### Scenario: A high-impact delivery preapproval is incomplete or mismatched
- **WHEN** the operation, target, evidence, recovery behavior, expiration,
  runtime permission, or lifecycle gate is absent, stale, or mismatched
- **THEN** the action pauses and does not treat the execution mode or delivery
  profile as standing permission
