## Purpose

Defines portable ownership and discovery behavior for canonical AI assets that
must operate through both Claude and Codex without silently diverging.

## ADDED Requirements

### Requirement: Claude and Codex expose equivalent lifecycle behavior
Claude and Codex SHALL expose the same selected OpenSpec lifecycle actions even
when platform naming and generated file locations differ.

#### Scenario: Assistant integrations are compared
- **WHEN** generated Claude and Codex workflow inventories are normalized by lifecycle action
- **THEN** both inventories contain `explore`, `propose`, `apply`, `verify`, `sync`, and `archive`

#### Scenario: One assistant integration is missing an action
- **WHEN** normalized workflow inventories differ
- **THEN** verification reports the missing or extra action rather than treating generation as complete

### Requirement: Generated and user-authored ownership remains distinct
OpenSpec refresh operations SHALL update OpenSpec-managed integration files
without overwriting unrelated user-authored assistant configuration.

#### Scenario: Integrations are refreshed
- **WHEN** OpenSpec regenerates Claude and Codex exposure
- **THEN** files identified as OpenSpec-managed reflect the selected workflow profile and unrelated assistant files remain unchanged

#### Scenario: A write restriction blocks one platform
- **WHEN** the environment denies access to an assistant integration path
- **THEN** the failure identifies the affected platform and path and permits a targeted retry without deleting unrelated content

### Requirement: Generated workflow provenance is visible
Generated OpenSpec skills and commands SHALL remain distinguishable from future
canonical repo-owned skills and SHALL retain available generator and license
metadata.

#### Scenario: A generated skill is inspected
- **WHEN** a contributor reviews an OpenSpec-managed skill
- **THEN** its metadata identifies OpenSpec generation and available licensing information

### Requirement: Reusable bootstrap behavior is product-neutral
Reusable setup and recovery guidance SHALL accept configured repository and
assistant inputs and SHALL NOT embed this product's GitHub owner, Project
number, credentials, or another product's domain behavior in reusable logic.

#### Scenario: Guidance is evaluated for another product
- **WHEN** the bootstrap procedure is reviewed against a repository with a different owner, Project, and implementation-repository layout
- **THEN** reusable steps remain applicable through configuration without editing canonical workflow logic

#### Scenario: Product-specific context is required
- **WHEN** repository purpose, product boundaries, or asset locations differ
- **THEN** those values are supplied through product-owned configuration or documentation rather than generated platform copies

### Requirement: Discovery limitations are documented
The repository SHALL state any reload or restart needed before an assistant can
discover newly generated workflow files.

#### Scenario: A workflow was generated during an active assistant session
- **WHEN** the active assistant does not immediately expose the new workflow
- **THEN** the contributor is directed to reload or restart discovery before diagnosing the generated files as invalid

