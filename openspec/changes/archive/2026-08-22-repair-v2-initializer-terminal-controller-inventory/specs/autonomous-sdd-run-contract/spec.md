## ADDED Requirements

### Requirement: Terminal v2 controller compatibility is archive-bound
The system SHALL derive terminal compatibility for a schema-5 controller only from validated immutable domain records in the configured repository's contained archive. The evidence MUST include the archived parent run, work unit, resource claim, terminalization receipt, claim release, and terminal projection; MUST verify record digests and mutual identities; and MUST bind the controller's repository, authorization digest, expiry, selected change, provider, parent run, work unit, claim, final status, and released cleanup disposition. Files outside the derived repository archive, symbolic-link escapes, mutable active records, and caller-supplied compatibility assertions MUST NOT establish terminal compatibility.

#### Scenario: Exact immutable terminal bundle is compatible
- **WHEN** a schema-5 controller and one contained archived v2 bundle validate and agree on every required identity, digest, completion, release, and cleanup field
- **THEN** inventory reports the controller as compatible terminal audit evidence without granting authority to a new run

#### Scenario: Archive evidence is partial or conflicting
- **WHEN** any required archived record is absent, invalid, outside the derived archive, symlinked, duplicated, or inconsistent with the controller or another archived record
- **THEN** inventory reports the controller as ambiguous and admission remains fail closed

#### Scenario: Compatibility classification is read-only
- **WHEN** terminal schema-5 compatibility is evaluated successfully or unsuccessfully
- **THEN** the system changes no controller, archive, reconciliation, index, claim, or terminalization record
