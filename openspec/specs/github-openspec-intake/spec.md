## Purpose

Defines local GitHub issue authoring and issue-to-OpenSpec intake behavior for
SDD foundation work.

## Requirements

### Requirement: GitHub commands use a safe execution boundary
GitHub helper scripts SHALL invoke `gh` through structured argument arrays and
return deterministic JSON results, with dry-run support for mutating
operations.

#### Scenario: Dry-run mutation is requested
- **WHEN** a mutating helper is called in dry-run mode
- **THEN** it returns the intended command and inputs without calling GitHub

#### Scenario: GitHub command fails
- **WHEN** `gh` returns a nonzero status or invalid JSON
- **THEN** the helper returns a structured failure without claiming mutation
  success

### Requirement: Issue authoring is idempotent
Issue authoring SHALL search for an existing managed issue before creation and
SHALL return the same issue when rerun with the same configured repository and
title.

#### Scenario: Duplicate issue exists
- **WHEN** create-or-find receives a title already present in search results
- **THEN** it returns the existing issue and does not plan a create operation

#### Scenario: Issue is missing
- **WHEN** no existing issue matches the requested title
- **THEN** it plans or creates a new issue with configured labels

### Requirement: Managed issue blocks preserve human content
Managed issue-block updates SHALL replace only content between configured
markers and preserve all human-authored content outside those markers.

#### Scenario: Managed block is updated
- **WHEN** issue body text already contains configured managed-block markers
- **THEN** only the managed block content is replaced

#### Scenario: Managed block is inserted
- **WHEN** issue body text lacks configured managed-block markers
- **THEN** the managed block is appended without altering existing content

### Requirement: Project intake operations are reusable
Project helpers SHALL expose idempotent add-to-Project and status-setting
operations using configured Project owner, number, field name, and status
names.

#### Scenario: Project operation is planned
- **WHEN** Project membership or status is requested in dry-run mode
- **THEN** the helper reports the intended Project operation without external
  mutation

### Requirement: Issue-to-OpenSpec intake creates reciprocal local linkage
Issue-to-OpenSpec intake SHALL create conventional OpenSpec planning paths,
managed issue block content, and valid tracking metadata for a linked issue.

#### Scenario: Intake fixture is generated
- **WHEN** issue-to-OpenSpec intake runs with complete issue and config data
- **THEN** it produces reciprocal artifact links and tracking metadata that
  validates against tracking v1

#### Scenario: Required issue data is missing
- **WHEN** issue-to-OpenSpec intake lacks a title, issue number, issue URL, or
  change name
- **THEN** it fails locally without creating partial artifacts

### Requirement: Canonical skills expose intake behavior
The repository SHALL expose GitHub issue authoring and issue-to-OpenSpec intake
skills for Claude and Codex through thin wrappers over canonical skill assets.

#### Scenario: Assistant skill exposure is inspected
- **WHEN** Claude and Codex skill files are compared with canonical skills
- **THEN** both assistants reference the same canonical scripts and behavior

### Requirement: Autonomous issue intake validates a durable reviewed payload binding
GitHub issue authoring SHALL accept an exact durable intake binding for an
authorized autonomous SDD run. The binding MUST include the selected entry,
configured repository, title, managed labels, managed OpenSpec block,
canonical body digest, operation, expiry, and idempotent recovery rule. Before
create-or-find, the helper MUST canonicalize the current payload, compare its
digest and every exact target field with the binding, and require an explicit
current runtime-permission input. It MUST return structured safe diagnostics
without invoking GitHub when the binding is missing, expired, mismatched, or
runtime-denied.

#### Scenario: Exact autonomous intake binding passes
- **WHEN** the current issue payload, configured target, selected entry,
  operation, and expiry match the durable binding and runtime permission is
  current
- **THEN** the helper invokes duplicate-safe create-or-find without requesting
  another skill-level approval and returns structured issue evidence

#### Scenario: Current payload differs from the binding
- **WHEN** any body content, title, label, managed block, repository, selected
  entry, operation, digest, or expiry differs from the durable binding
- **THEN** the helper returns a structured mismatch and performs no GitHub
  mutation

#### Scenario: Host permission is denied
- **WHEN** the durable binding matches but the explicit current runtime input
  denies issue publication
- **THEN** the helper returns a runtime-denied result and does not attempt a
  different command or claim the skill can override host policy

### Requirement: Bound issue creation preserves idempotent intake behavior
Bound autonomous issue intake SHALL reuse the existing exact-title search,
structured `gh` argument boundary, configured labels, and managed-block
preservation behavior. It MUST record the created or reused issue number, URL,
title, state, labels, payload digest, and selected-entry linkage as current
evidence suitable for tracking and lifecycle reconciliation.

#### Scenario: Exact issue already exists
- **WHEN** a bound intake request finds the exact configured repository and
  title already present
- **THEN** the helper returns the existing issue evidence, creates no
  duplicate, and preserves human-authored body content outside the managed
  block

#### Scenario: Bound issue is newly created
- **WHEN** no exact issue exists and the binding plus runtime permission pass
- **THEN** the helper creates the issue through structured arguments and
  returns evidence bound to the payload digest and selected entry
