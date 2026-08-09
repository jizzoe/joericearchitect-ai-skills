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
