## MODIFIED Requirements

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
