## ADDED Requirements

### Requirement: Delivery-scoped brief preparation preserves path bounds
The design-brief workflow SHALL recognize valid `sdd-delivery` authorization
only for one explicitly authorized selected-entry output path. It MUST validate
the path and authorization before writing, preserve local-implementation, and
reject other delivery writes.

#### Scenario: Valid delivery preparation is received
- **WHEN** selected-entry authorization names the requested brief path
- **THEN** workflow may write the brief within that path boundary

#### Scenario: Delivery context lacks a path grant
- **WHEN** delivery context does not authorize requested output path
- **THEN** workflow returns rejection without writing a brief
