# cross-assistant-assets Specification

## Purpose

Defines portable ownership and discovery behavior for canonical AI assets that
must operate through both Claude and Codex without silently diverging.
## Requirements
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

### Requirement: Autonomous capabilities have equivalent assistant exposure
Claude and Codex SHALL expose equivalent bounded autonomous runner and
autonomous SDD lifecycle behavior from one assistant-neutral canonical source
even when platform-specific invocation names, discovery paths, and permission
models differ.

#### Scenario: Assistant autonomous exposure is compared
- **WHEN** Claude and Codex autonomous-runner and autonomous-SDD exposure are
  normalized by capability and lifecycle action
- **THEN** both assistants expose equivalent authorization, queue selection,
  batching, review, correction, checkpoint, recovery, and human-pause behavior

#### Scenario: Platform invocation differs
- **WHEN** Claude and Codex use different command names, skill locations,
  profile mechanisms, or discovery behavior
- **THEN** the platform adapter maps those differences without changing the
  canonical policy

#### Scenario: One platform lacks exposure
- **WHEN** one assistant cannot discover or invoke the autonomous capability
- **THEN** verification reports the missing or stale exposure and provides the
  reload or regeneration recovery path

### Requirement: Canonical policy is not duplicated across platforms
The repository SHALL keep bounded autonomy policy in canonical assets and SHALL
generate or package thin Claude and Codex exposure without manually maintaining
separate copies of the same policy. The repository SHALL deterministically
enumerate every canonical skill package under `skills/base` and verify that
each has both repository-owned Claude and Codex discovery adapters that point
to its canonical source and remain within the documented thin-adapter
contract. OpenSpec-generated assistant assets are outside this enumeration and
remain owned by OpenSpec generation.

#### Scenario: Canonical policy changes
- **WHEN** authorization, correction, human-pause, recovery, security, or
  lifecycle policy changes in the canonical asset
- **THEN** generated or packaged Claude and Codex exposure is refreshed or
  reported stale by verification

#### Scenario: Platform copy diverges
- **WHEN** a Claude or Codex adapter contains policy text that no longer
  matches the canonical source
- **THEN** drift verification fails and identifies the stale adapter

#### Scenario: Generated OpenSpec files are refreshed
- **WHEN** OpenSpec refreshes its generated lifecycle files
- **THEN** repo-owned autonomous runner exposure remains distinguishable from
  OpenSpec-managed files and is not overwritten

#### Scenario: A canonical skill is added
- **WHEN** a new canonical package is added under `skills/base`
- **THEN** drift verification requires its Claude and Codex repository-owned
  discovery adapters without adding it to a manually maintained inventory

#### Scenario: A repository-owned adapter is missing or not thin
- **WHEN** either adapter is absent, lacks its canonical reference, or violates
  the documented no-policy-duplication contract
- **THEN** drift verification fails with the adapter path and the specific
  contract violation

### Requirement: Shared repository guidance is discoverable by both assistants
The repository SHALL provide Claude Code with the same root contributor
guidance that it provides Codex through a one-line root guidance import.

#### Scenario: Claude starts at repository root
- **WHEN** a fresh Claude Code session opens the repository root
- **THEN** it loads the shared contributor guidance through the root one-line
  import without creating a duplicate policy document

### Requirement: Runtime permission mechanisms remain adapters
Claude and Codex platform permission, sandbox, approval, profile, and
credential mechanisms SHALL be treated as runtime adapters and SHALL NOT be
silently changed by reusable autonomous assets.

#### Scenario: Codex Goal profile is selected
- **WHEN** a user launches a Codex session with the configured Goal profile
- **THEN** the autonomous capability may inspect and report the effective
  runtime posture but does not modify global or profile configuration

#### Scenario: Ordinary Codex session is used
- **WHEN** a user runs Codex without the Goal profile
- **THEN** autonomous assets do not silently enable Goal behavior or broaden
  approval, sandbox, network, or filesystem permissions

#### Scenario: Permission is insufficient
- **WHEN** an assistant cannot perform an authorized action because its runtime
  adapter lacks permission, credentials, or tool access
- **THEN** the capability reports the missing runtime permission and pauses or
  requests the normal platform approval path without weakening controls

### Requirement: Cross-assistant portability evidence is required
Autonomous assets SHALL include verification evidence that Claude and Codex
consume equivalent behavior and that reusable policy remains portable to a
second repository without this product's constants.

#### Scenario: Cross-assistant evals pass
- **WHEN** autonomous skill and workflow evals run for Claude and Codex
  exposure
- **THEN** trigger, non-trigger, authorization, human-pause, correction-budget,
  recovery, and stale-exposure scenarios produce equivalent expected behavior

#### Scenario: Second repository fixture runs
- **WHEN** the autonomous assets are evaluated against a second-repository or
  multi-repository fixture with different configured values
- **THEN** reusable policy passes without product-specific constants

#### Scenario: Portability evidence is missing
- **WHEN** delivery claims cross-assistant or second-product portability but
  evals, fixture output, or drift checks are absent
- **THEN** verification reports the claim as unevidenced

### Requirement: Controller and cleanup exposure remain thin and equivalent
Claude and Codex SHALL expose equivalent continuation and cleanup behavior
through thin adapters that reference canonical assistant-neutral assets.
Adapters MUST NOT duplicate policy or alter authorization, continuation,
cleanup, or pause behavior.

#### Scenario: Both assistant exposures are inspected
- **WHEN** continuation and cleanup adapters are compared
- **THEN** each resolves to canonical policy and equivalent behavior

#### Scenario: One adapter is stale
- **WHEN** an adapter no longer references canonical controller or cleanup asset
- **THEN** verification reports stale exposure and recovery path

### Requirement: Autonomous lifecycle policy has one distributable canonical source
The autonomous SDD lifecycle SHALL be owned by one assistant-neutral canonical
skill that is distributable to both Claude Code and Codex. Repository workflow
entrypoints and platform discovery adapters MUST remain thin pointers to that
skill and MUST NOT duplicate lifecycle policy.

#### Scenario: Canonical lifecycle is inspected
- **WHEN** a maintainer compares the lifecycle package, repository workflow entrypoint, and Claude and Codex adapters
- **THEN** the lifecycle package contains the policy and progressive references while every entrypoint and adapter points to it without copying the policy

#### Scenario: Platform exposure drifts
- **WHEN** a workflow entrypoint or platform adapter points to a missing or noncanonical lifecycle source
- **THEN** deterministic drift verification fails with the stale exposure path and expected canonical target

### Requirement: Installed shared runtime is assistant-neutral and policy-neutral
Claude Code and Codex canonical skill exposure SHALL resolve the same
assistant-neutral shared runtime contract for declared helpers. Platform
adapters SHALL remain thin and SHALL NOT duplicate runtime logic or alter
authorization, sandbox, approval, credential, network, review, or cleanup
policy while resolving a runtime.

#### Scenario: Both agents invoke the same helper
- **WHEN** equivalent Claude Code and Codex skills request the same declared
  runtime helper with equivalent explicit absolute target-repository paths
- **THEN** both resolve the same runtime contract and receive equivalent helper
  selection, validation, unavailable classification, and recovery guidance

#### Scenario: A platform runtime is unavailable
- **WHEN** one platform cannot locate or activate the shared runtime
- **THEN** its adapter reports the platform-specific activation gap without
  changing the canonical helper contract or broadening host permissions
