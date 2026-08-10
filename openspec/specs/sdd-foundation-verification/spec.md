## Purpose

Defines final verification and hardening evidence for the OpenSpec SDD
foundation.

## Requirements

### Requirement: Foundation capabilities are verified together
SDD foundation verification SHALL confirm living specs and canonical assets
exist for all delivered foundation capabilities.

#### Scenario: Living specs are inspected
- **WHEN** foundation verification runs
- **THEN** all delivered living spec files are present

#### Scenario: Canonical skill exposure is inspected
- **WHEN** foundation verification runs
- **THEN** canonical base skills and assistant wrappers are present

### Requirement: Security and trust boundaries are reviewed
SDD foundation verification SHALL inspect workflow trust boundaries and avoid
secret exposure in PR-triggered workflows.

#### Scenario: Workflow permissions are inspected
- **WHEN** workflow files are checked
- **THEN** PR workflows avoid secrets, `pull_request_target`, and write
  permissions

### Requirement: Portability is verified with an isolated product fixture
SDD foundation verification SHALL keep product-specific fixture constants out
of reusable global assets.

#### Scenario: Global assets are scanned
- **WHEN** reusable skills, workflows, scripts, specs, and docs are scanned
- **THEN** they do not contain product-specific fixture constants

### Requirement: Operations and recovery are documented
SDD foundation verification SHALL document setup, normal operation, recovery,
token rotation, and OpenSpec updates.

#### Scenario: Operations guidance exists
- **WHEN** repository documentation is inspected
- **THEN** setup, operation, recovery, token rotation, and OpenSpec update
  guidance are present
