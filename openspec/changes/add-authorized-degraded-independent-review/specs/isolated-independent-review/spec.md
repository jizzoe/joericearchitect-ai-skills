## MODIFIED Requirements

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
