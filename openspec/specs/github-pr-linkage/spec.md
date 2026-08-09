## Purpose

Defines advisory validation for pull request linkage to GitHub issues and
OpenSpec changes.

## Requirements

### Requirement: Pull requests declare issue and OpenSpec linkage
PR linkage validation SHALL require a GitHub issue reference and an OpenSpec
change reference before reporting a PR contract as valid.

#### Scenario: Valid PR body is checked
- **WHEN** a PR body contains an issue reference and OpenSpec change reference
- **THEN** PR contract validation passes

#### Scenario: Issue reference is missing
- **WHEN** a PR body omits issue linkage
- **THEN** validation fails with corrective instructions

### Requirement: OpenSpec linkage validates tracking and reciprocal references
OpenSpec linkage validation SHALL verify the referenced change path exists,
tracking metadata is valid, and tracking issue data matches the PR issue
reference.

#### Scenario: Tracking matches PR issue
- **WHEN** PR issue linkage and tracking metadata refer to the same issue
- **THEN** linkage validation passes

#### Scenario: Tracking is invalid
- **WHEN** tracking metadata is missing or invalid
- **THEN** validation fails with the tracking path and validation issue

### Requirement: OpenSpec validation runs only for relevant paths
Advisory validation SHALL route OpenSpec validation when PR changed paths
include OpenSpec artifacts, skills, workflows, scripts, or validation assets.

#### Scenario: Relevant path changes
- **WHEN** changed paths include governed OpenSpec or automation assets
- **THEN** advisory validation requires OpenSpec validation evidence

#### Scenario: Irrelevant path changes
- **WHEN** changed paths do not include governed paths
- **THEN** advisory validation reports OpenSpec validation as not required

### Requirement: Advisory workflows avoid privileged mutation
GitHub advisory workflows SHALL run with read-only permissions and SHALL NOT
require Project credentials or mutation privileges.

#### Scenario: Workflow permissions are inspected
- **WHEN** advisory workflow files are read
- **THEN** they use read-only permissions and do not reference Project tokens

### Requirement: Canonical skills expose PR linkage validation
The repository SHALL expose a canonical PR linkage skill and thin assistant
wrappers for Claude and Codex.

#### Scenario: Skill exposure is inspected
- **WHEN** assistant wrapper files are compared with the canonical skill
- **THEN** wrappers reference canonical PR linkage behavior and scripts
