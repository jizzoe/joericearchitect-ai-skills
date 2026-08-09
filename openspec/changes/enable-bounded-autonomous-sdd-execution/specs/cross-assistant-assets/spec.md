## ADDED Requirements

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
separate copies of the same policy.

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
