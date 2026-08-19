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

For a parent-launched reviewer, the system MUST accept a `passed` or `failed`
review only from the final bytes of the exclusively owned result artifact named
by the configured transport. Transcript text, process stdout, tool output, or
an intermediate structured message MUST NOT substitute for that artifact. On
an unavailable result, the durable record MUST identify the failed transport
stage with a stable code and retain only non-sensitive diagnostics sufficient to
distinguish result-artifact inspection, parse, findings-payload validation,
normalized-result validation, binding validation, and cleanup outcomes. It
MUST NOT retain raw reviewer output, credentials, or sealed package content.

#### Scenario: Codex and Claude results are equivalent
- **WHEN** configured Codex and Claude adapters review the same sealed package
- **THEN** both results validate through the same canonical schema and finding
  semantics without platform-specific authorization logic

#### Scenario: Parent transport captures a valid final passed artifact
- **WHEN** a parent-launched reviewer writes a schema-valid final `passed`
  findings payload to its exclusively owned result artifact and all immutable
  package, reviewer, authorization, and cleanup bindings validate
- **THEN** the system seals and accepts the normalized review result for the
  exact transition

#### Scenario: Transcript JSON differs from the final artifact
- **WHEN** a reviewer emits JSON in a transcript or intermediate stream but
  the owned final result artifact is absent, malformed, or different
- **THEN** the system records an unavailable transport result and does not
  treat the transcript message as review evidence

#### Scenario: Result provenance is invalid
- **WHEN** a result has a duplicate ID, wrong manifest or commit, missing
  attestation, stale evidence, mutable origin, invalid final artifact, or a
  failed strict-precursor, authorization, or cleanup binding
- **THEN** validation fails closed with the stable relevant transport or
  provenance code and the result cannot authorize delivery

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

#### Scenario: Claude is not authenticated
- **WHEN** strict Claude reports that it is not logged in and asks to run its
  login flow
- **THEN** the system records Claude authentication unavailability rather than
  a generic execution or sandbox failure

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
result condition needed for a safe retry. A worktree-lifecycle adapter MUST use
fixed validated inputs and arguments; it MUST NOT accept arbitrary shell text,
Git arguments, branch creation, caller-chosen destinations, network access,
credential forwarding, or content mutation. Archive construction remains an
explicit strategy choice until equivalent Git-aware validation is proven.

The Codex parent transport MUST provide only a minimal deterministic
platform-owned command path required by its restricted read-only inspection
tools. It MUST retain credential scrubbing, network denial, fixed invocation,
read-only filesystem restrictions, and denied mutation capabilities; an
inspection-tool failure MUST produce unavailable evidence rather than restore
ambient environment, write authority, credentials, network, or a less
restricted fallback.

#### Scenario: Second repository uses different configuration
- **WHEN** the protocol is evaluated in another workspace with different
  configured repository and artifact paths
- **THEN** canonical behavior and result validation remain unchanged

#### Scenario: Restricted reviewer has required inspection tools
- **WHEN** the configured Codex parent transport starts a restricted reviewer
  in a supported platform environment
- **THEN** the reviewer can use only the deterministic read-only inspection
  command path without inheriting credentials or mutation-capable environment
  values

#### Scenario: Reviewer execution is unavailable
- **WHEN** reviewer execution fails, a required inspection tool is unavailable,
  or required isolation evidence is absent
- **THEN** the system preserves current state, records a paused transition with
  the relevant stable unavailable code, and reports a safe retry path without
  repeating a materially identical failure beyond the active recovery limit

#### Scenario: Outer lifecycle fails after authorization
- **WHEN** a bounded outer lifecycle operation encounters an invalid commit,
  Git absence, lock contention, disk exhaustion, verification mismatch, or
  cleanup failure after request validation
- **THEN** it reports the applicable safe stable diagnostic without expanding
  privileges, emitting a manual owner command, or changing the inner reviewer
  boundary

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

### Requirement: Strict parent transport separates managed preflight from elevated launch
The system SHALL resolve and authenticate the fixed Codex reviewer executable,
including its managed-sandbox mutation-denial proof, before constructing any
elevated host request. The elevated phase SHALL execute only the previously
sealed fixed invocation and SHALL NOT resolve, select, or newly trust a
reviewer executable. A preflight attempted from an elevated boundary SHALL
fail closed with a stable boundary-specific diagnostic and SHALL NOT be
reported as an operating-system, profile, or executable-identity failure.

#### Scenario: Managed preflight seals a trusted executable
- **WHEN** the configured Codex executable satisfies fixed-location,
  managed-sandbox mutation-denial, and platform-trust checks
- **THEN** the system records that identity in the sealed strict request before
  requesting the elevated reviewer launch

#### Scenario: Preflight is attempted from an elevated boundary
- **WHEN** the executable preflight cannot establish its managed-sandbox
  mutation-denial proof because it was invoked elevated
- **THEN** the system returns the stable preflight-boundary diagnostic, creates
  no reviewer view or launch request, and does not use degraded review

#### Scenario: Elevated phase receives an unsealed executable choice
- **WHEN** an elevated strict-launch path is given a caller-selected path or
  lacks a valid preflight-sealed executable identity
- **THEN** the system rejects the launch before reviewer invocation and records
  strict unavailability without exposing a command or fallback

### Requirement: Strict parent transport delivers an owned final artifact reliably
For every completed strict Codex invocation, the parent transport SHALL verify
that the configured exclusively owned final-result artifact is created at its
sealed path before cleanup, or SHALL record a stable result-artifact delivery
diagnostic that distinguishes missing output from other transport failures. A
schema-valid empty-findings `passed` payload SHALL be delivered and accepted
through the same owned-artifact path as a findings-bearing `failed` payload.
Transcript text, stdout, tool output, JSONL, and intermediate structured
messages MUST NOT substitute for the final artifact.

#### Scenario: Clean strict review produces a final artifact
- **WHEN** a strict Codex reviewer completes with no findings for a sealed
  package
- **THEN** the configured owned result artifact contains a schema-valid
  `passed` payload that the parent seals as `strict-isolated`

#### Scenario: Findings-bearing strict review produces a final artifact
- **WHEN** a strict Codex reviewer completes with one or more findings for a
  sealed package
- **THEN** the configured owned result artifact contains a schema-valid
  `failed` payload and the parent preserves the findings through the canonical
  result contract

#### Scenario: Final artifact is absent
- **WHEN** the reviewer process completes but its configured owned result
  artifact is absent
- **THEN** the system records the stable missing-artifact diagnostic, removes
  only the owned view, and pauses strict-only delivery without accepting any
  transcript content

#### Scenario: Parent transport is used by another assistant
- **WHEN** a configured non-Codex adapter uses the shared review-result
  contract
- **THEN** its owned-artifact validation and fail-closed provenance rules
  remain unchanged and it does not inherit Codex-specific executable checks

### Requirement: Claude degraded review invocation is CLI-valid
When an exact degraded-review authorization selects the Claude adapter, the
system SHALL construct a no-MCP Claude invocation that the supported Claude
Code version accepts before reviewer authentication or review execution.

#### Scenario: Empty MCP configuration is accepted
- **WHEN** the Claude degraded adapter constructs an invocation with no MCP
  servers
- **THEN** its MCP configuration has the CLI-valid `mcpServers` object shape
  and the CLI reaches normal reviewer startup rather than rejecting malformed
  MCP configuration

#### Scenario: Claude remains unavailable after valid startup configuration
- **WHEN** the CLI-valid Claude degraded invocation cannot authenticate or
  establish another required reviewer boundary
- **THEN** the system reports the relevant safe unavailable result and does not
  claim strict isolation or broaden reviewer permissions
