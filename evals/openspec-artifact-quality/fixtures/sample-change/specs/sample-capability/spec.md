## Purpose

Defines local report export review behavior for a sample product.

## ADDED Requirements

### Requirement: Report exports are reviewed locally
The report export reviewer SHALL validate required report metadata before a
generated report is shared.

#### Scenario: Report metadata is complete
- **WHEN** a generated report contains required name, date, and checksum
  metadata
- **THEN** local validation passes without contacting an external service

#### Scenario: Report metadata is incomplete
- **WHEN** a generated report omits required metadata
- **THEN** local validation fails with the report path and missing field
