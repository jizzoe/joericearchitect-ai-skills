## Purpose

Defines versioned local tracking metadata that links OpenSpec changes to
GitHub work records and implementation repository targets.

## ADDED Requirements

### Requirement: Tracking metadata links a change to GitHub work
Each tracked OpenSpec change SHALL have versioned local metadata containing the
OpenSpec change name, primary issue, repository identity, Project identity, and
implementation repository targets.

#### Scenario: Valid tracking metadata is read
- **WHEN** tracking metadata is validated for a change
- **THEN** required linkage fields are present with correct types and the
  change name matches the containing OpenSpec change

#### Scenario: Required field is missing
- **WHEN** tracking metadata omits a required linkage field
- **THEN** validation fails with the exact field path and nonzero exit status

### Requirement: Tracking validation rejects unsafe or mismatched data
Tracking validation SHALL reject invalid types, mismatched change names,
credentials, mutable runtime IDs, PR state, timestamps, and last-sync state.

#### Scenario: Invalid type is present
- **WHEN** a tracking field has the wrong value type
- **THEN** validation fails with the exact field path and expected type

#### Scenario: Change identity mismatches
- **WHEN** tracking metadata names a different OpenSpec change than the
  containing directory
- **THEN** validation fails before normalized linkage is emitted

### Requirement: Unknown safe fields are preserved
Tracking create and update helpers SHALL preserve unknown safe fields while
rejecting unknown credential-like or runtime-state fields.

#### Scenario: Safe extension field exists
- **WHEN** a tracking file contains an unknown safe extension field
- **THEN** validation passes and helper updates preserve the field

#### Scenario: Unsafe unknown field exists
- **WHEN** a tracking file contains an unknown field that appears to store a
  credential, mutable ID, PR state, timestamp, or sync output
- **THEN** validation fails with the field path

### Requirement: Normalized linkage is deterministic JSON
The read-only tracking command SHALL print normalized linkage as deterministic
JSON without mutating files or calling GitHub.

#### Scenario: Normalized output is requested
- **WHEN** a valid tracking file is read in JSON mode
- **THEN** output contains sorted implementation repositories and canonical
  issue, Project, repository, and change fields

### Requirement: Tracking supports multiple implementation repositories
The tracking contract SHALL represent one or more implementation repositories
without changing schema shape or reusable validation behavior.

#### Scenario: Multi-repository tracking is validated
- **WHEN** tracking metadata contains several implementation repository targets
- **THEN** validation and normalized output preserve each target deterministically

### Requirement: Historical compatibility is explicit
Pre-M3-C2 OpenSpec changes that lack tracking metadata SHALL remain valid
historical records when a compatibility exception is recorded.

#### Scenario: Historical archive is inspected
- **WHEN** a pre-M3-C2 archived change lacks `tracking.yaml`
- **THEN** verification records an explicit compatibility exception rather than
  rewriting historical archive content
