## ADDED Requirements

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
