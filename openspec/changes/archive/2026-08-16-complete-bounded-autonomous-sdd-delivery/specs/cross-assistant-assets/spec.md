## ADDED Requirements

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
