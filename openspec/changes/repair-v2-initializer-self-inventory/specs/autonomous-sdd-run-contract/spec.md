## MODIFIED Requirements

### Requirement: Cutover preserves legacy audit evidence without dual authority
The system SHALL inventory only legacy controller and checkpoint candidates
before v2 admission is enabled for a repository. Candidate discovery MUST
exclude unrelated JSON and MAY exclude only the initializer's exact current
pending controller checkpoint through an internally derived path binding; a
caller MUST NOT be able to nominate another legacy record for exclusion. The
system MUST classify compatible legacy records deterministically and leave
malformed, unknown-schema, or otherwise ambiguous records at genuine legacy
controller locations immutable and actionable. After v2 enablement, legacy
creation and advancement MUST be disabled, legacy records remain read-only,
and no run MAY have both a legacy and v2 official record. Rollback MUST preserve
that single-authority rule.

#### Scenario: Ambiguous legacy record is discovered
- **WHEN** inventory cannot map a record at a genuine legacy controller or
  checkpoint location unambiguously
- **THEN** the system preserves it unchanged, reports an actionable migration
  classification, and refuses automatic migration

#### Scenario: Unrelated JSON is present in controller state
- **WHEN** repository-common controller state contains an initializer request,
  receipt, or other JSON that is not a legacy controller candidate
- **THEN** legacy inventory excludes it from classification without deleting or
  rewriting it

#### Scenario: Initializer excludes its exact pending controller
- **WHEN** controller-first initialization persists its schema-5 pending
  checkpoint before invoking v2 admission
- **THEN** legacy inventory excludes only that internally derived exact path and
  continues to inspect every other genuine legacy controller candidate

#### Scenario: Caller attempts to exclude a legacy controller
- **WHEN** a direct admission caller supplies an exclusion for an active,
  ambiguous, or unrelated legacy controller record
- **THEN** the public admission boundary ignores or rejects that exclusion and
  retains the normal fail-closed legacy classification
