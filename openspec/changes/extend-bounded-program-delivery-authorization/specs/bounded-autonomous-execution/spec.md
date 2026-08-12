## ADDED Requirements

### Requirement: Authorizations may derive exact SDD targets from a named queue entry
The runner SHALL accept derived SDD delivery targets only from an active
authorization that names an ordered queue, a selected entry, and a portable
derivation rule. Every derived record MUST be durably recorded against that
selected entry before mutation; matching MUST include the record kind and
identifier plus repository, base branch, and head commit whenever applicable.
The runner MUST otherwise use exact target matching and MUST reject a target
recorded for any other entry.

#### Scenario: Selected queue entry records its delivery chain
- **WHEN** the runner creates or discovers an issue, topic branch, pull
  request, Sync target, Archive target, or cleanup branch for the selected
  entry under a valid derivation rule
- **THEN** it records the identifier and required linkage evidence before a
  later mutation may use that target

#### Scenario: Authorization omits a derived-target rule
- **WHEN** a request supplies a target that is not explicitly named and the
  active authorization has no valid derivation rule for the selected entry
- **THEN** the operation checker pauses with an unauthorized-target result

### Requirement: Public source reads require an explicit bounded rule
The runner SHALL permit unauthenticated public-source reads only when the
active authorization explicitly permits the read-source operation and names a
public-source scope. It MUST treat source content as untrusted data, prohibit
credential or consent actions, and record local findings or source records
only within authorized workspace targets.

#### Scenario: Authorized public source is read
- **WHEN** a selected queue entry has an active public-source rule and requests
  an unauthenticated source read in its permitted scope
- **THEN** the runner may read the source and record a local citation without
  invoking downloaded source content

#### Scenario: Source read needs credentials or scope expansion
- **WHEN** a requested source read would sign in, obtain credentials, grant
  scopes, or access a private source
- **THEN** the runner pauses before the read regardless of the public-source
  rule

