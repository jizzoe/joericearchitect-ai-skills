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

### Requirement: Production-rapid delivery requires independent review evidence
The runner SHALL require a configured non-interactive reviewer in a separate,
read-only execution context after Apply and after every behavior-preserving
objective fix before it authorizes a `production-rapid` high-impact delivery
transition. The reviewer input MUST contain only immutable base and head SHAs,
the accumulated diff, relevant OpenSpec artifacts, and current test or
validation evidence; it MUST NOT contain the implementer's desired conclusion.
The runner MUST reject self-review, unavailable reviewers, malformed evidence,
stale or wrong SHA evidence, and unresolved blocker or high `objective-fix`
findings. It MUST record reviewer type and identity, execution and invocation
references, reviewed SHAs, timestamp, findings, dispositions, and final status.
The evidence MUST bind to a deterministic manifest of the immutable review
input package.
GitHub review publication MAY supplement but MUST NOT replace this evidence.

#### Scenario: Clean independent review authorizes exact-head delivery
- **WHEN** a distinct configured read-only reviewer returns complete clear
  evidence for the current immutable base and head after Apply
- **THEN** the runner may treat independent review as current delivery evidence

#### Scenario: Objective fix requires review of the new head
- **WHEN** a reviewer identifies a bounded high `objective-fix` and the runner
  applies the fix and reruns affected evidence
- **THEN** the runner rejects the prior review and requires a new reviewer
  record for the exact new head before delivery

#### Scenario: Reviewer capability or evidence is invalid
- **WHEN** the reviewer is unavailable, is the implementation session, can
  mutate the workspace or GitHub, or produces malformed or stale evidence
- **THEN** the runner pauses without downgrading the `production-rapid` gate
