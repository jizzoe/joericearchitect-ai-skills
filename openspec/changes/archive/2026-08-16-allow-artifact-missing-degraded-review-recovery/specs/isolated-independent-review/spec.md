## MODIFIED Requirements

### Requirement: Review execution proves isolation and least privilege
The system SHALL invoke a fresh reviewer with no implementation-session history
against a detached read-only repository view pinned to the supplied head. When
the selected review strategy requires a detached Git worktree, the system MUST
request a bounded outer worktree-lifecycle capability before view construction.
That capability MUST be bound to the canonical repository, immutable sealed
head, active request digest, expiration, and a runtime-generated temporary
destination; it MUST permit only fixed detached-worktree creation and
ownership-checked removal for that request. The reviewer execution MUST deny
workspace and Git writes, GitHub mutation, credential access, authenticated
external access, external sends, deployment and release operations, and
mutation through delegated agents. A prompt, separate chat, separate reviewer
identity, or reviewer self-attestation alone MUST NOT establish isolation.

#### Scenario: Enforced reviewer isolation is available
- **WHEN** a configured adapter proves fresh context, a pinned read-only view,
  the required denied capabilities, and (for a worktree strategy) a current
  bounded outer lifecycle capability
- **THEN** the system may construct the exact-head view through the outer
  lifecycle and invoke the reviewer with the sealed package

#### Scenario: Managed parent denies a nested strict reviewer
- **WHEN** the implementation runtime is already sandboxed and denies nested
  Codex app-server or sandbox startup but permits the configured parent review
  transport
- **THEN** the system resolves only the bare Codex adapter name through fixed
  platform install locations, authenticates the canonical target with a fixed
  OS-backed signer requirement or root-owned non-writable path policy, binds
  its content and filesystem identity, and launches only that executable across
  the parent boundary while the child retains its sealed read-only profile and
  a validated child result remains `strict-isolated`

#### Scenario: Strict parent transport is unavailable
- **WHEN** its tool request, runtime approval, executable identity, expiration,
  result artifact, package binding, or owned cleanup cannot be validated
- **THEN** the system records strict unavailability with the shared diagnostic
  envelope and does not relabel a degraded result as strict

#### Scenario: Strict reviewer is unavailable with no authorization
- **WHEN** the strict adapter cannot prove required isolation for the exact
  package and no active exact degraded authorization exists
- **THEN** the system records unavailability and pauses without a substitute

#### Scenario: Authorized strict-first fallback is eligible
- **WHEN** strict unavailability is durable and an exact active degraded
  authorization permits the same change, transition, base, head, and manifest
- **THEN** the system may invoke only a fresh separate restricted fallback and
  records `authorized-degraded` assurance and its capability ledger

#### Scenario: Authorized strict-first fallback follows a missing strict result artifact
- **WHEN** the durable strict result for the same exact package is
  `review-launcher-codex-result-artifact-missing` and an active exact degraded
  authorization permits the transition
- **THEN** the system may invoke only the existing fresh separate restricted
  fallback, retains the immutable strict unavailable precursor, and records the
  accepted result as `authorized-degraded`, never `strict-isolated`

#### Scenario: Unsupported strict unavailable code remains ineligible
- **WHEN** a strict result is unavailable for a code other than a configured
  recoverable launcher failure or
  `review-launcher-codex-result-artifact-missing`
- **THEN** the system does not create a degraded view or launch request and
  pauses with the stable ineligible-failure diagnostic

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

#### Scenario: Strict reviewer startup excludes repository customization
- **WHEN** an exact-head archive contains repository instructions, skills,
  plugins, or other startup customization
- **THEN** the strict process starts from a neutral parent directory with user
  configuration ignored, treats the repository child as data, and grants the
  model no read access to isolated reviewer authentication state

#### Scenario: Worktree lifecycle request is not eligible
- **WHEN** the selected worktree strategy has a missing, expired, mismatched,
  caller-selected, or otherwise invalid lifecycle request
- **THEN** the system does not construct a view or invoke the reviewer and
  returns a request-bound unavailable result
