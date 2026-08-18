## ADDED Requirements

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
