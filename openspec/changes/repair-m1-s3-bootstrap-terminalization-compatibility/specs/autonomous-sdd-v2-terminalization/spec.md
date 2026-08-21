## MODIFIED Requirements

### Requirement: V2 terminalization is evidence-bound and exact
The system SHALL terminalize a v2 run only when the request binds one exact
repository identity, parent run, work unit, claim, approved change, and
current delivered lifecycle evidence. It MUST reject missing, stale, foreign,
conflicting, or incomplete evidence without changing the active run, claim,
or archive. It MUST NOT accept a manual durable-state edit or an inferred
target as terminalization evidence. A work unit that predates a later required
admission field MUST remain rejected unless an explicit, expiry-bound bootstrap
compatibility binding identifies that exact run and proves the original record
is preserved unchanged.

#### Scenario: Exact delivered run terminalizes
- **WHEN** an exact completed run has current delivery and cleanup evidence and
  a matching active claim
- **THEN** the system records terminal evidence, releases that claim, archives
  only that run, and rebuilds the repository status index

#### Scenario: Explicit pre-feature bootstrap record terminalizes
- **WHEN** one exact completed bootstrap run predates the configuration
  snapshot field and has a current compatibility binding, delivered Archive
  evidence, and matching active claim
- **THEN** the system terminalizes the original record without adding or
  claiming a configuration snapshot at admission

#### Scenario: Evidence is incomplete or mismatched
- **WHEN** a terminalization request has missing, stale, foreign, conflicting,
  or incomplete evidence, or a missing-snapshot record lacks the exact
  compatibility binding
- **THEN** the system returns a typed pause and leaves the active run and claim
  unchanged
