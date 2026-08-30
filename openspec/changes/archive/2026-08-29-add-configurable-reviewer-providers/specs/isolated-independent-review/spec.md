## ADDED Requirements

### Requirement: Reviewer-provider registry is config-driven and validated

The system SHALL resolve independent-reviewer providers from a validated,
config-driven registry that maps a provider name to a known adapter, executable,
assurance level, and transport. The registry MUST reject unknown adapters,
duplicate names, invalid assurance or transport values, and undeclared registry
or provider fields. Resolution MUST return only the declared provider fields and
MUST NOT change existing selection behavior when the registry is absent.

#### Scenario: Registry validates and resolves a provider

- **WHEN** a registry lists a provider with a known adapter, executable,
  assurance level, and transport
- **THEN** the provider resolves by name deterministically

#### Scenario: Invalid registry entries are rejected

- **WHEN** a registry contains an unknown adapter, a duplicate name, an invalid
  assurance or transport value, or an undeclared field
- **THEN** validation fails closed with a deterministic reason
