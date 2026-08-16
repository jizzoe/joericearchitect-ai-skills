## MODIFIED Requirements

### Requirement: Review coverage is proportional and explicit
The capability SHALL evaluate relevant requirements and observable behavior,
regression and edge-case risk, test or eval coverage and quality, input
validation, error handling, data integrity and recovery, secrets and sensitive
data, authorization, untrusted input, dependencies and supply chain,
portability, configuration ownership, generated artifacts, and unrelated
changes. When applicable, it MUST also evaluate mobile or web accessibility,
responsive layout, and interaction risk, and MUST explicitly report review
areas that were not applicable or lacked evidence. When stack standards are in
scope, it MUST consume a validated standards selection record, report selected
rules and scoped overrides, and report a gap rather than claim coverage when
the record is absent or invalid.

#### Scenario: Change has security and UI impact
- **WHEN** the bounded scope includes untrusted input and user-interface changes
- **THEN** the review covers the relevant security, accessibility, responsive,
  and interaction risks and reports any missing evidence

#### Scenario: Evidence for an applicable area is absent
- **WHEN** an applicable review area lacks tests, artifacts, or other evidence
- **THEN** the result reports the missing-test or risk gap without claiming the
  area passed

#### Scenario: Stack-standard review has valid selection
- **WHEN** a bounded review requests stack-standard coverage with a valid
  selection record
- **THEN** its result identifies selected rules and scoped overrides without
  applying unselected-stack guidance

#### Scenario: Stack-standard review lacks selection
- **WHEN** stack-standard coverage is requested without a valid selection record
- **THEN** it reports an evidence gap and does not claim coverage passed
