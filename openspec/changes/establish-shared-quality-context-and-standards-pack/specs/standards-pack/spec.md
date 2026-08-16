## Purpose

Defines a portable quality-standards selection record so preparation, review,
and verification apply the same scoped policy and expose gaps instead of
inventing standards.

## ADDED Requirements

### Requirement: Standards selection follows explicit precedence
The system SHALL select standards in this order: target-repository rules,
applicable official standards, selected public sources, then cross-stack
guidance. A record MUST identify each selected source with scope and classify
every candidate as `required`, `recommended`, `repository-selected`, or
`not-applicable`.

#### Scenario: Repository rule overrides generic guidance
- **WHEN** a scoped target-repository convention conflicts with a selected
  generic standard
- **THEN** the record preserves the repository convention and identifies the
  overridden source and scope without silently applying the conflict

#### Scenario: Unselected stack guidance is available
- **WHEN** a catalog includes guidance outside the target scope
- **THEN** the record classifies it as `not-applicable` with a reason and no
  consumer treats it as selected

### Requirement: Selection records are portable and bounded
The system SHALL validate each selection record before use. The record MUST use
workspace-relative or public-source references, contain no credentials or
product constants, and identify target scope, selected rules, overrides,
expected evidence, and unresolved conflicts or gaps. Unsafe or incomplete
records MUST produce a structured gap or pause rather than a guessed selection.

#### Scenario: A second workspace supplies a valid record
- **WHEN** another workspace provides valid records with different configured
  paths and conventions
- **THEN** validation accepts them without edits to canonical assets

#### Scenario: Selection input is unsafe or incomplete
- **WHEN** a record contains an absolute path, traversal, credential-like
  value, missing target scope, or unresolved required conflict
- **THEN** validation rejects it and the consumer reports the specific gap

### Requirement: Quality consumers share one selection record
The system SHALL make the same validated selection record available to
preparation, advisory review, and verification for one bounded change. Every
consumer MUST report its selected rules, not-applicable classifications, and
role-specific evidence gaps. Consumers MUST NOT create competing code-writing
workflows or claim coverage for absent rules.

#### Scenario: Preparation, review, and verification share selection
- **WHEN** a bounded change supplies one valid selection record
- **THEN** all three results cite the same selected rule identifiers and apply
  role-specific evidence consistently

#### Scenario: A consumer lacks required selection
- **WHEN** stack-specific coverage is requested without a valid applicable
  selection record
- **THEN** the consumer reports an evidence gap and does not claim coverage

### Requirement: Context loading remains progressive and auditable
The system SHALL maintain one canonical context-management policy for quality
assets. It MUST load selection guidance before only applicable references, pass
compact rule and evidence identifiers between stages, and record unreviewed
applicable areas as gaps. Quality entrypoints MUST link to that policy instead
of duplicating its catalog or checklist.

#### Scenario: A bounded change touches one selected surface
- **WHEN** a consumer evaluates one selected standards surface
- **THEN** it loads only the selection guidance and required surface references
  while retaining identifiers for later inspection

#### Scenario: Unbounded context would be required
- **WHEN** relevant references cannot be selected without unrelated catalogs
- **THEN** the consumer records a gap and follows the canonical policy rather
  than treating retrieval volume as coverage
