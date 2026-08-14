# isolated-independent-review Specification

## Purpose

Defines a portable protocol for obtaining independent AI review evidence from
a fresh, isolated, read-only reviewer without exposing implementation context
or granting mutation authority.

## Requirements

### Requirement: Review inputs are sealed and immutable
The system SHALL build a deterministic review package containing canonical full
base and head commit object IDs, the diff re-derived from that exact range,
hashes and repository-relative identities for relevant OpenSpec artifacts, and
current validation-evidence references. The package MUST exclude credentials,
secret values, sensitive personal data, unrelated worktree content, executable
instructions from untrusted sources, the implementer's desired conclusion, and
prior dispositions presented as instructions.

#### Scenario: Current package is built
- **WHEN** current Apply evidence exists for one canonical base and head
- **THEN** repeated package construction produces the same manifest digest and
  review inputs for that immutable state

#### Scenario: Package contains unsafe or mutable input
- **WHEN** a proposed package contains a secret-like value, noncanonical commit,
  unrelated mutable content, or a desired review conclusion
- **THEN** package validation rejects it before reviewer invocation and reports
  the failing field without exposing the sensitive value

### Requirement: Review execution proves isolation and least privilege
The system SHALL invoke a fresh reviewer with no implementation-session history
against a detached repository view pinned to the supplied head. By default, the
reviewer execution MUST deny workspace and Git writes, GitHub mutation,
credential access, authenticated external access, external sends, deployment
and release operations, and mutation through delegated agents through an
enforced read-only runtime profile. A prompt, separate chat, separate reviewer
identity, or reviewer self-attestation alone MUST NOT establish strict
isolation. Only after that strict adapter produces a durable unavailable record
for the exact sealed package MAY an explicit valid authorized-degraded review
authorization permit a fresh separate fallback under the
`authorized-degraded-independent-review` capability; that fallback MUST never
be described as strict isolation and MUST report all unproven restrictions.
The degraded external-host path MAY support Codex or Claude, but its ordinary
parent-launch evidence and basename-checked executable identity MUST be recorded
as non-security-verifiable accepted risks. This exception MUST NOT weaken or
relabel the strict adapter's isolation requirements.
The outer parent-runtime transport MAY request policy-governed execution of the
fixed host launcher, but that request MUST NOT be inherited by or represented
as additional authority for the inner reviewer.

#### Scenario: Enforced reviewer isolation is available
- **WHEN** a configured adapter proves fresh context, a pinned read-only view,
  and the required denied capabilities
- **THEN** the system may invoke the reviewer with the sealed package and
  record `strict-isolated` assurance

#### Scenario: Strict reviewer is unavailable with no authorization
- **WHEN** the strict adapter cannot prove required isolation for the exact
  package and no active exact degraded authorization exists
- **THEN** the system records unavailability and pauses without a substitute

#### Scenario: Authorized strict-first fallback is eligible
- **WHEN** strict unavailability is durable and an exact active degraded
  authorization permits the same change, transition, base, head, and manifest
- **THEN** the system may invoke only a fresh separate restricted fallback and
  records `authorized-degraded` assurance and its capability ledger

#### Scenario: Reviewer shares context or mutation authority
- **WHEN** the proposed reviewer inherits implementation history, can write the
  target or Git state, can mutate GitHub, or cannot establish its declared
  strict or degraded boundary
- **THEN** the system records reviewer unavailability and pauses without using
  self-review or ordinary pull-request review as a substitute

#### Scenario: Degraded launcher authenticity remains unverified
- **WHEN** an explicitly authorized degraded Codex or Claude launcher produces
  a fresh sealed-package review but cannot cryptographically prove the parent
  launch or executable identity
- **THEN** the result remains `authorized-degraded`, retains the exact accepted
  risk, and cannot satisfy or be described as strict isolation

#### Scenario: Parent launch does not elevate the reviewer
- **WHEN** a parent runtime approves and executes the fixed recovery host
- **THEN** the inner reviewer still starts with its configured ephemeral
  read-only or read/search-only boundary and the result remains
  `authorized-degraded`

### Requirement: Review results use one validated durable contract
The system SHALL require an immutable schema-versioned review result containing
reviewer type and identity, platform adapter, unique execution and record IDs,
isolation attestation, canonical base and head IDs, manifest digest, timestamps,
permitted-command references, artifact and evidence references, structured
findings, implementer dispositions when applicable, and a final `passed`,
`failed`, or `unavailable` status. It MUST reject mismatched configured
identity or attestation, wrong or stale inputs, malformed results, duplicate
record IDs, mutable result provenance, or findings lacking repository-relative
evidence.

#### Scenario: Codex and Claude results are equivalent
- **WHEN** configured Codex and Claude adapters review the same sealed package
- **THEN** both results validate through the same canonical schema and finding
  semantics without platform-specific authorization logic

#### Scenario: Result provenance is invalid
- **WHEN** a result has a duplicate ID, wrong manifest or commit, missing
  attestation, stale evidence, or mutable origin
- **THEN** validation fails closed and the result cannot authorize delivery

### Requirement: Every finding has an evidence-backed disposition
The system SHALL preserve every finding and require the implementer to record an
evidence-backed disposition as `objective-fix`, `warning`, `false-positive`, or
`human-decision`; it MUST NOT silently discard or downgrade a finding. Blocker,
high, and material requirement, architecture, security, compatibility,
licensing, governance, or scope findings MUST pause for human decision.

#### Scenario: Objective finding has a bounded correction
- **WHEN** an `objective-fix` has an evidence-backed behavior-preserving
  correction within the active per-signature correction budget
- **THEN** the implementer may apply only that correction, rerun affected
  checks, create a new head-specific package, and request a fresh independent
  review

#### Scenario: Warning or false positive is disputed
- **WHEN** the implementer records a warning or false-positive disposition
- **THEN** the next fresh reviewer receives the finding, disposition, and cited
  evidence as review data and may independently challenge the disposition

#### Scenario: Finding needs a material decision
- **WHEN** resolving a finding could change approved behavior, architecture,
  security, compatibility, licensing, governance, or authorized scope
- **THEN** the system pauses rather than reclassifying or correcting it to
  continue delivery

### Requirement: Review evidence is current for one transition
A passing review SHALL apply only to the named authorized delivery transition
and exact current base, head, manifest, and validation evidence. Any change to
those inputs MUST invalidate the prior review and require a new sealed package
and fresh reviewer; review evidence MUST NOT grant standing approval.

#### Scenario: Head changes after a passing review
- **WHEN** the implementation head changes for any reason after review
- **THEN** the prior result becomes stale and delivery remains blocked until a
  fresh reviewer passes the new exact head

#### Scenario: Exact reviewed transition is eligible
- **WHEN** the active bounded authorization names the transition and current
  validated review evidence has no unresolved blocker, high, or objective-fix
  finding
- **THEN** the review gate may pass without expanding the transition's existing
  authorization or runtime permission

### Requirement: Review behavior is portable and recoverable
The system SHALL keep package, validation, finding, and safety policy in one
assistant-neutral source while product configuration supplies adapter identity,
isolation attestation, repository view strategy, allowed review commands, and
required artifact paths. Configuration MUST NOT contain credentials, absolute
machine paths, product-specific account or Project identifiers, or standing
permission grants. Failed execution MUST preserve the implementation branch and
evidence and identify the missing adapter, attestation, repository view, or
result condition needed for a safe retry.

#### Scenario: Second repository uses different configuration
- **WHEN** the protocol is evaluated in another workspace with different
  configured repository and artifact paths
- **THEN** canonical behavior and result validation remain unchanged

#### Scenario: Reviewer execution is unavailable
- **WHEN** reviewer execution fails or required isolation evidence is absent
- **THEN** the system preserves current state, records a paused transition, and
  reports a safe retry path without repeating a materially identical failure
  beyond the active recovery limit

### Requirement: Autonomous enablement is documented and per-run
The system SHALL provide user-facing documentation that separates one-time
platform readiness from the dedicated per-run configuration used by an
autonomous review. It MUST document Codex Goal invocation, Claude
noninteractive invocation, supported and unsupported platform boundaries,
required sandbox and tool restrictions, safe failure behavior, and recovery.
It MUST state that ordinary interactive assistant sessions retain their existing
manual-authorization behavior and MUST NOT require a global reviewer sandbox
configuration.

#### Scenario: User enables a Codex autonomous run
- **WHEN** a user follows the documented Codex autonomous-run instructions
- **THEN** the user can start the bounded run under the configured Goal profile
  while the independent reviewer is launched separately with its own read-only
  evidence boundary

#### Scenario: User enables a Claude autonomous review
- **WHEN** a user follows the documented Claude instructions on a supported
  platform
- **THEN** the adapter starts a fresh noninteractive Claude reviewer with a
  temporary strict sandbox configuration and reports `unavailable` if it
  cannot prove the configuration is active

#### Scenario: User continues ordinary interactive work
- **WHEN** a user starts Codex or Claude outside the dedicated autonomous-run
  path
- **THEN** the system does not apply the autonomous reviewer configuration and
  preserves normal manual authorization behavior
