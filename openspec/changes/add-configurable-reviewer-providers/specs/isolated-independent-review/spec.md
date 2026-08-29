## ADDED Requirements

### Requirement: Reviewer-provider registry is config-driven and validated

The system SHALL resolve independent-reviewer providers from a validated,
config-driven registry that maps a provider name to a known adapter, executable,
assurance level, and transport. The registry MUST reject unknown adapters,
duplicate names, and invalid assurance or transport values, and MUST NOT change
existing selection behavior when absent.

#### Scenario: Registry validates and resolves a provider

- **WHEN** a registry lists a provider with a known adapter, executable,
  assurance level, and transport
- **THEN** the provider resolves by name deterministically

#### Scenario: Invalid registry entries are rejected

- **WHEN** a registry contains an unknown adapter, a duplicate name, or an
  invalid assurance or transport value
- **THEN** validation fails closed with a deterministic reason
