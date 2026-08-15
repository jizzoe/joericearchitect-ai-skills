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
  target or Git state, can mutate GitHub, or lacks enforceable isolation
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

#### Scenario: Worktree lifecycle request is not eligible
- **WHEN** the selected worktree strategy has a missing, expired, mismatched,
  caller-selected, or otherwise invalid lifecycle request
- **THEN** the system does not construct a view or invoke the reviewer and
  returns a request-bound unavailable result

### Requirement: Review results use one validated durable contract
The system SHALL require an immutable schema-versioned review result containing
reviewer type and identity, platform adapter, unique execution and record IDs,
isolation attestation, canonical base and head IDs, manifest digest, timestamps,
permitted-command references, artifact and evidence references, structured
findings, implementer dispositions when applicable, and a final `passed`,
`failed`, or `unavailable` status. It MUST reject mismatched configured
identity or attestation, wrong or stale inputs, malformed results, duplicate
record IDs, mutable result provenance, or findings lacking repository-relative
evidence. Unavailable outer-lifecycle and reviewer-process results MUST retain
only stable stage, operation, code, category, subject, optional safe exit code,
and safe human message; they MUST distinguish construction, verification,
cleanup, and reviewer-process outcomes and MUST NOT retain raw stderr, stdout,
full temporary paths, raw review or package content, command arguments,
environment values, credentials, or secrets.
Every review control-plane boundary—including package construction, archive or
worktree views, adapter preflight and execution, result artifacts, launcher
host, parent transport, and recovery acceptance—MUST use the same versioned
diagnostic envelope. A wrapper that receives a valid child diagnostic MUST
preserve it unchanged unless the wrapper itself fails; the durable record MUST
bind that diagnostic to the same unavailable review result and sealed package.

#### Scenario: Codex and Claude results are equivalent
- **WHEN** configured Codex and Claude adapters review the same sealed package
- **THEN** both results validate through the same canonical schema and finding
  semantics without platform-specific authorization logic

#### Scenario: Result provenance is invalid
- **WHEN** a result has a duplicate ID, wrong manifest or commit, missing
  attestation, stale evidence, or mutable origin
- **THEN** validation fails closed and the result cannot authorize delivery

#### Scenario: Outer view setup or cleanup is unavailable
- **WHEN** the authorized outer lifecycle cannot create, verify, or remove the
  requested detached view
- **THEN** the system records its distinct safe request-bound unavailable
  diagnostic and does not treat setup output as a reviewer pass or findings
  result

#### Scenario: Strict reviewer subprocess is unavailable
- **WHEN** a strict Codex or Claude reviewer subprocess exits without a valid
  result after the review view is available
- **THEN** the system records an allowlisted safe reviewer-process diagnostic
  with its stable category, subject, optional exit code, and retry guidance
  without persisting subprocess output or environment details

#### Scenario: Codex reviews an intentional non-Git archive
- **WHEN** strict Codex reviews the sealed archive view, which intentionally
  has no `.git` metadata
- **THEN** its fixed invocation bypasses only the repository-presence preflight
  while retaining the sealed read-only permission profile; a trusted-directory
  refusal is reported with its own safe diagnostic rather than as a sandbox
  failure

#### Scenario: A wrapper receives a child diagnostic
- **WHEN** a review control-plane child returns a valid unavailable diagnostic
- **THEN** its caller forwards the same diagnostic without reducing it to a
  generic wrapper code, detail string, or raw process output

### Requirement: Review behavior is portable and recoverable
The system SHALL keep package, validation, finding, and safety policy in one
assistant-neutral source while product configuration supplies adapter identity,
isolation attestation, repository view strategy, allowed review commands, and
required artifact paths. Configuration MUST NOT contain credentials, absolute
machine paths, product-specific account or Project identifiers, or standing
permission grants. Failed execution MUST preserve the implementation branch and
evidence and identify the missing adapter, attestation, repository view, or
result condition needed for a safe retry. A worktree-lifecycle adapter MUST use
fixed validated inputs and arguments; it MUST NOT accept arbitrary shell text,
Git arguments, branch creation, caller-chosen destinations, network access,
credential forwarding, or content mutation. Archive construction remains an
explicit strategy choice until equivalent Git-aware validation is proven.

#### Scenario: Second repository uses different configuration
- **WHEN** the protocol is evaluated in another workspace with different
  configured repository and artifact paths
- **THEN** canonical behavior and result validation remain unchanged

#### Scenario: Reviewer execution is unavailable
- **WHEN** reviewer execution fails or required isolation evidence is absent
- **THEN** the system preserves current state, records a paused transition, and
  reports a safe retry path without repeating a materially identical failure
  beyond the active recovery limit

#### Scenario: Outer lifecycle fails after authorization
- **WHEN** a bounded outer lifecycle operation encounters an invalid commit,
  Git absence, lock contention, disk exhaustion, verification mismatch, or
  cleanup failure after request validation
- **THEN** it reports the applicable safe stable diagnostic without expanding
  privileges, emitting a manual owner command, or changing the inner reviewer
  boundary
