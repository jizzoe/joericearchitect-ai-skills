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

For a parent-launched transport configured for an owned result artifact, the
system MUST accept a `passed` or `failed` review only from the final bytes of
that exclusively owned artifact after the configured host transport has
published and inspected it. A Codex reviewer emits structured terminal input;
the fixed host capture adapter validates that input and creates the artifact.
Other configured adapters retain their validated host-owned artifact path and
do not inherit Codex event parsing. Transcript text, raw process stdout, tool
output, or an intermediate structured message MUST NOT itself substitute for
the artifact. On an unavailable result, the durable record MUST identify the
failed transport stage with a stable code and retain only non-sensitive
diagnostics sufficient to distinguish event capture, result-artifact
publication and inspection, parse, findings-payload validation,
normalized-result validation, binding validation, and cleanup outcomes. It
MUST NOT retain raw reviewer output, credentials, or sealed package content.

#### Scenario: Codex and Claude results are equivalent
- **WHEN** configured Codex and Claude adapters review the same sealed package
- **THEN** both results validate through the same canonical schema and finding
  semantics without platform-specific authorization logic

#### Scenario: Parent transport captures a valid final passed artifact
- **WHEN** a parent-launched reviewer emits a schema-valid final `passed`
  findings payload, the configured host transport publishes it to the
  exclusively owned result artifact, and all immutable package, reviewer,
  authorization, and cleanup bindings validate
- **THEN** the system seals and accepts the normalized review result for the
  exact transition

#### Scenario: Transcript JSON differs from the final artifact
- **WHEN** a reviewer emits JSON in a transcript or intermediate stream but
  the owned final result artifact is absent, malformed, or different from the
  configured transport's validated terminal payload
- **THEN** the system records an unavailable transport result and does not
  treat the transcript or intermediate message as review evidence

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
  terminal payload or configured host-owned result after the review view is
  available
- **THEN** the system records an allowlisted safe reviewer-process or transport
  diagnostic with its stable category, subject, optional exit code, and retry
  guidance without persisting subprocess output or environment details

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
The system SHALL resolve and authenticate both the fixed Codex reviewer
executable and the fixed installed-runtime terminal-event capture adapter,
including their managed-sandbox mutation-denial proofs, before constructing
any elevated host request. The elevated phase SHALL execute only the
previously sealed fixed capture invocation, which may launch only the sealed
Codex executable with its fixed arguments, and SHALL NOT resolve, select, or
newly trust an executable, adapter, path, event contract, digest, or argument.
The capture invocation SHALL receive the expected request digest through a
separately sealed parent field and SHALL authenticate the bounded request bytes
against it before parsing or consuming any operational request field. A digest
stored only inside the request SHALL NOT authenticate that request. A
preflight attempted from an elevated boundary SHALL fail closed with a stable
boundary-specific diagnostic and SHALL NOT be reported as an operating-system,
profile, executable-identity, or review finding failure.

#### Scenario: Managed preflight seals a trusted executable
- **WHEN** the configured Codex executable and installed-runtime capture
  adapter satisfy fixed-location, content-identity, managed-sandbox
  mutation-denial, and platform-trust checks
- **THEN** the system records both identities and the terminal-event contract
  revision in the sealed strict request before requesting elevated launch

#### Scenario: Preflight is attempted from an elevated boundary
- **WHEN** either identity preflight cannot establish its managed-sandbox
  mutation-denial proof because it was invoked elevated
- **THEN** the system returns the stable preflight-boundary diagnostic, creates
  no reviewer view or launch request, and does not use degraded review

#### Scenario: Elevated phase receives an unsealed executable choice
- **WHEN** an elevated strict-launch path is given a caller-selected executable,
  adapter, event contract, path, or argument, or lacks either valid
  preflight-sealed identity
- **THEN** the system rejects the launch before reviewer invocation and records
  strict unavailability without exposing a command or fallback

#### Scenario: Capture adapter attempts an unsealed child launch
- **WHEN** the fixed capture adapter would launch a child executable or argument
  vector that differs from the sealed Codex invocation
- **THEN** the adapter rejects execution before the child starts and returns a
  safe transport diagnostic without broadening parent authority

#### Scenario: Sealed request is replaced before elevated launch
- **WHEN** request bytes at the sealed path do not match the independently
  supplied expected request digest
- **THEN** the capture adapter rejects the request before parsing any
  executable, argument, path, event-contract, or expiry field and starts no
  child process

### Requirement: Strict parent transport delivers an owned final artifact reliably
For every completed strict Codex invocation, the fixed host transport SHALL
consume a bounded structured event stream and derive exactly one authoritative
final response: the last completed agent-message item in the single completed
turn, observed before the terminal turn event and end of stream. The host SHALL
validate that response against the existing findings schema and publish the
configured exclusively owned final-result artifact with an atomic
same-filesystem no-clobber operation at its sealed path before downstream
inspection and cleanup. Ordinary replacement rename SHALL NOT satisfy this
contract. If the event sequence, payload,
write, or final artifact is invalid, the system SHALL record a stable
metadata-only delivery diagnostic that distinguishes the failure stage. A
schema-valid empty-findings `passed` payload SHALL use the same host-created
artifact path as a findings-bearing `failed` payload. Raw JSONL, transcript
text, arbitrary stdout or stderr, intermediate agent messages, reasoning, tool
events or output, and repository-written files MUST NOT themselves constitute
review evidence or substitute for the validated host-owned final artifact.

#### Scenario: Clean strict review produces a final artifact
- **WHEN** a strict Codex reviewer performs one or more read-only tool calls,
  emits a schema-valid final `passed` agent message, and then emits one valid
  completed-turn terminal event followed by end of stream
- **THEN** the host atomically writes that final message to the sealed owned
  result artifact and the parent may seal it as `strict-isolated` after all
  existing package, identity, result, and cleanup checks pass

#### Scenario: Intermediate schema-valid message is not selected
- **WHEN** the reviewer emits one or more completed agent messages before tool
  use and later emits a different final completed agent message before the
  completed-turn terminal event
- **THEN** the host selects only the last completed agent message for schema
  validation and never accepts an earlier message as the final result

#### Scenario: Findings-bearing strict review produces a final artifact
- **WHEN** a strict Codex reviewer completes with a schema-valid final `failed`
  agent message containing one or more findings for a sealed package
- **THEN** the host-created owned result artifact contains that payload and the
  parent preserves the findings through the canonical result contract

#### Scenario: Terminal event sequence is absent or ambiguous
- **WHEN** the bounded stream has no completed turn, more than one terminal
  turn, no completed agent message before the terminal turn, an event after the
  terminal turn, malformed JSONL, a failed or incomplete turn, or an
  unsupported event-contract revision
- **THEN** the system creates no accepted findings artifact, records the
  corresponding stable terminal-event diagnostic, removes only owned
  resources, and keeps delivery paused

#### Scenario: Final artifact is absent
- **WHEN** the reviewer process completes but the capture adapter produces no
  valid sealed receipt or owned final artifact
- **THEN** the system records the stable missing-receipt or missing-artifact
  diagnostic, removes only owned resources, and pauses delivery without
  accepting transcript, shell-tool, or event-stream content as findings

#### Scenario: Final payload or atomic write is invalid
- **WHEN** the selected final message violates the findings schema, exceeds a
  configured bound, the sealed destination already exists or is unsafe, the
  atomic write cannot be completed, or final artifact inspection differs from
  the selected payload
- **THEN** the system rejects the result with the stage-specific safe
  diagnostic and does not retain raw event, payload, path, package, command, or
  credential content

#### Scenario: Destination appears during publication
- **WHEN** another actor creates a file or symlink at the sealed destination
  after temporary-file creation but before the no-clobber commit point
- **THEN** publication fails without replacing or modifying that destination,
  the host records a safe write-unsafe diagnostic, and no result is accepted

#### Scenario: Event stream exceeds a bound
- **WHEN** event bytes, event count, line size, candidate-message size, or
  execution time exceeds the fixed transport limits
- **THEN** the system stops capture, records bounded unavailable evidence, and
  does not retry as an objective correction or silently raise the limit

#### Scenario: One transport-only retry is eligible
- **WHEN** a supported event contract ends without a final completed agent
  message or completed-turn event, the first attempt cleaned up successfully,
  the sealed package and authorization remain current, and the independent
  transport retry budget is unused
- **THEN** the system may run at most one fresh reviewer attempt, preserves the
  first unavailable record, and does not charge the retry to an objective-fix
  correction budget

#### Scenario: Unsafe transport failure is not retried
- **WHEN** an event sequence is malformed, ambiguous, schema-invalid,
  over-bound, identity-mismatched, write-unsafe, or cleanup-incomplete
- **THEN** the system records terminal unavailability and does not retry the
  reviewer under the transport-only budget

#### Scenario: Parent transport is used by another assistant
- **WHEN** a configured non-Codex adapter uses the shared review-result contract
- **THEN** its owned-artifact validation and fail-closed provenance rules remain
  unchanged and it does not inherit Codex-specific event parsing, executable
  checks, or capture-adapter behavior

#### Scenario: Installed CLI event contract changes
- **WHEN** capability preflight or a live acceptance probe cannot demonstrate
  the configured Codex terminal-event contract revision
- **THEN** the adapter reports typed unavailability and requires a supported
  adapter or runtime update rather than parsing an unknown stream

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

### Requirement: Strict review terminalizes exactly once
The system SHALL terminalize every strict review deterministically and exactly
once across success, failure, timeout, and crash. A reviewer process that exits
before emitting a valid terminal payload and one for which the host has already
published a valid owned result artifact SHALL each yield one deterministic
terminal record for the exact sealed package and transition. The system MUST
NOT emit duplicate or conflicting terminal records, and a late process event
MUST NOT supersede a terminal record.

#### Scenario: Exit before result creation
- **WHEN** the reviewer process exits before the host can validate a terminal
  payload and publish its owned result artifact
- **THEN** the system records one deterministic terminal unavailable record and
  no conflicting result

#### Scenario: Exit after result creation
- **WHEN** the reviewer process exits after the host has published and validated
  its owned result artifact
- **THEN** the system records exactly one terminal record and never a second
  duplicate

#### Scenario: Timeout or crash still terminalizes once
- **WHEN** the reviewer transport times out or the process crashes
- **THEN** the system records exactly one deterministic terminal record for
  that sealed package and transition

### Requirement: Wrong-package review results are rejected
The system SHALL reject a review result whose sealed package digest, base, or
head binding does not match the exact sealed package for the transition. A
result produced for a different package or head SHALL NOT satisfy the review
gate and MUST NOT be accepted as evidence.

#### Scenario: Result for a different package is rejected
- **WHEN** a result binds a package digest or base/head other than the exact sealed package
- **THEN** the system rejects the result and does not treat it as review evidence

### Requirement: Temporary review resources clean exactly or retain an actionable recovery record
The system SHALL remove every owned temporary review resource exactly once on
completion. When removal cannot be confirmed, the system SHALL retain an
actionable recovery record that identifies the owned resource and the required
cleanup without retaining review content, credentials, or secrets.

#### Scenario: Successful cleanup removes the owned view exactly once
- **WHEN** a review completes and its owned view is removed successfully
- **THEN** no owned temporary resource remains and no duplicate removal is attempted

#### Scenario: Cleanup failure retains an actionable recovery record
- **WHEN** owned temporary resource removal cannot be confirmed
- **THEN** the system retains an actionable recovery record identifying the resource and cleanup action, without review content or secrets

### Requirement: Codex review invocation uses the built-in read-only sandbox
The Codex strict and degraded reviewer invocation SHALL enforce read-only
filesystem and network-off isolation through the built-in `--sandbox read-only`
mode rather than a beta `permissions.<name>.filesystem` profile. The invocation
SHALL NOT pass a `default_permissions` or `permissions.<name>.filesystem` config
that routes Codex's own file reads through an OS sandbox helper that can fail on
the host.

#### Scenario: Codex reviewer starts without a custom-profile sandbox helper
- **WHEN** the Codex adapter constructs its strict or degraded invocation
- **THEN** it includes `--sandbox read-only` and omits the beta
  `default_permissions`/`permissions.<name>.filesystem` config, so Codex reaches
  normal reviewer startup rather than a `sandbox-exec` re-exec failure

#### Scenario: Read-only and network-off remain enforced
- **WHEN** the Codex reviewer runs under `--sandbox read-only`
- **THEN** model-generated commands cannot write outside the read boundary and
  network access remains off by default

### Requirement: Reviewer findings schema uses a portable JSON Schema dialect
The findings schema SHALL declare a JSON Schema dialect that both the Codex
`--output-schema` file reader and the Claude `--json-schema` inline validator
accept. It SHALL NOT declare a `$schema` or `$id` URI that either reviewer CLI
cannot resolve offline.

#### Scenario: Claude accepts the findings schema
- **WHEN** the Claude adapter passes the findings schema to `--json-schema`
- **THEN** Claude Code reaches normal reviewer startup instead of rejecting an
  unresolved draft URI

#### Scenario: Codex still accepts the findings schema
- **WHEN** the Codex adapter passes the findings schema file to `--output-schema`
- **THEN** Codex reads the schema and produces schema-valid structured output

### Requirement: Claude reviewer provisions isolated authentication
The Claude reviewer SHALL provision authentication into its isolated reviewer
environment so it can run without the host's interactive OAuth session, mirroring
Codex's authentication provisioning. It SHALL copy the host's bounded,
ownership-checked Claude authentication artifact into the isolated `HOME` or
inject a supported API-key environment variable, and SHALL NOT require the
host's keychain or an interactive login.

#### Scenario: Isolated Claude reviewer authenticates
- **WHEN** the Claude adapter prepares its reviewer environment
- **THEN** it copies the host's bounded Claude auth artifact into the isolated
  `HOME` or injects a supported API-key environment variable, and Claude Code
  reaches authenticated reviewer startup

#### Scenario: Missing or oversized auth artifact fails closed
- **WHEN** the host Claude auth artifact is absent, oversized, or not a regular
  file
- **THEN** the adapter reports a stable unavailable diagnostic and does not
  claim strict isolation or broaden reviewer permissions

### Requirement: Review package exposure is byte-bounded and digest-indexed
The system SHALL preserve the canonical `independent-review-package-v1` and its
manifest digest while exposing it to a detached reviewer only through an
exclusively created, read-only, versioned capsule. The capsule index SHALL bind
the exact base, head, manifest, representation revision, total canonical byte
count, and every ordered content chunk by safe relative path, semantic section,
UTF-8 byte count, and SHA-256. Every index, chunk, count, and total SHALL have a
fixed byte-aware bound. Before reviewer launch, the host SHALL reconstruct and
validate the complete canonical package and SHALL reject any absent, extra,
duplicate, reordered, oversized, symlinked, non-regular, or digest-mismatched
entry. Line counts or JavaScript character counts MUST NOT substitute for byte
bounds.

#### Scenario: Large package is exposed in bounded chunks
- **WHEN** a valid sealed package fits within the total capsule bound but its
  canonical representation or diff exceeds one content-chunk bound
- **THEN** the host writes an ordered digest-indexed capsule in which no index
  or content file exceeds its byte limit and exact reconstruction preserves the
  original package and manifest digest

#### Scenario: Multibyte content reaches a chunk boundary
- **WHEN** UTF-8 content contains a multibyte code point near the fixed chunk
  boundary
- **THEN** the chunker measures encoded bytes, does not split the code point,
  and still reconstructs the exact original bytes

#### Scenario: Capsule content is incomplete or changed
- **WHEN** a required chunk is absent, extra, duplicated, reordered, unsafe,
  oversized, or does not match its indexed byte count or digest
- **THEN** the system records typed package-exposure unavailability and starts
  no reviewer

#### Scenario: One-line package cannot defeat an inspection bound
- **WHEN** canonical package content contains a minified or otherwise very long
  line
- **THEN** exposure remains capped by UTF-8 bytes across bounded content chunks
  and no line-oriented read can return an unbounded package file

### Requirement: Durable adapter selection controls review dispatch
The system SHALL consume the immutable delivery configuration snapshot's
allowlisted `reviewAdapter` when constructing strict or authorized-degraded
review work. The selected identifier SHALL bind launcher definition, installed
runtime helper, reviewer identity class, prepared recovery, runtime receipt,
and accepted result. A direct launcher object or later product-configuration
read SHALL NOT override the durable selection. A separately owner-authorized
bootstrap review SHALL provide an equivalent exact binding to base, head,
manifest, expiry, installed-runtime digest, launcher, reviewer, and owned
worktree lifecycle.

#### Scenario: Durable Claude selection is dispatched
- **WHEN** a current work-unit snapshot selects
  `claude-detached-restricted-v1` and its allowlisted launcher is available
- **THEN** strict and any authorized-degraded construction use the bound Claude
  definition and accept only a matching Claude runtime receipt and result

#### Scenario: Prepared launcher conflicts with durable selection
- **WHEN** a request, recovery record, runtime receipt, or result names an
  adapter different from the durable selected identifier
- **THEN** the system rejects it with a stable adapter-binding diagnostic and
  does not invoke or accept the conflicting reviewer

#### Scenario: Repair uses an N-1 bootstrap reviewer
- **WHEN** this capture repair requires independent review before its candidate
  Codex transport can be trusted
- **THEN** an explicit bootstrap binding may invoke only the named N-1 Claude
  runtime for the exact package and SHALL reject accepted evidence produced by
  the candidate Codex capture path

### Requirement: Plain-shell Codex degraded review is honest and fail-closed

The system SHALL support launching a fresh, isolated, read-only Codex reviewer
directly through a plain-shell `codex exec` subprocess when strict-isolated
review is durably unavailable and an authorized degraded review is permitted.
The subprocess result SHALL be sealed as `authorized-degraded` — never
`strict-isolated` — and its capability ledger MUST report authenticated
parent-launch evidence and host-pinned reviewer executable identity as
unavailable while the detached read-only view, sealed package, and credential
scrubbing remain enforced. If the subprocess exits nonzero or produces no valid
structured findings payload, the system MUST fail closed with a stable
unavailable diagnostic and never report a pass.

#### Scenario: Plain-shell degraded Codex review succeeds

- **WHEN** strict-isolated Codex review is durably unavailable, degraded
  authorization is current, and the configured Codex executable passes its
  preflight probe with the required read-only subprocess arguments
- **THEN** the system launches `codex exec` in the detached read-only view with
  a scrubbed environment, validates the returned findings payload, and seals an
  `authorized-degraded` result bound to the exact package

#### Scenario: Plain-shell degraded Codex review produces no valid result

- **WHEN** the Codex subprocess exits nonzero or returns no valid structured
  findings payload
- **THEN** the system returns a stable unavailable diagnostic and does not
  report a pass or claim isolation

#### Scenario: Subprocess result cannot claim strict isolation

- **WHEN** a plain-shell Codex subprocess produces a validated findings payload
- **THEN** the sealed result reports `authorized-degraded` assurance with
  authenticated parent-launch evidence and host-pinned executable identity
  listed as unavailable in its capability ledger

### Requirement: Reviewer-provider registry is config-driven and validated

The system SHALL resolve independent-reviewer providers from a validated,
config-driven registry that maps a provider name to a known adapter, executable,
assurance level, and transport. The registry MUST reject unknown adapters,
duplicate names, invalid assurance or transport values, and undeclared registry
or provider fields. Resolution MUST return only the declared provider fields and
MUST NOT change existing selection behavior when the registry is absent.

#### Scenario: Registry validates and resolves a provider

- **WHEN** a registry lists a provider with a known adapter, executable,
  assurance level, and transport
- **THEN** the provider resolves by name deterministically

#### Scenario: Invalid registry entries are rejected

- **WHEN** a registry contains an unknown adapter, a duplicate name, an invalid
  assurance or transport value, or an undeclared field
- **THEN** validation fails closed with a deterministic reason
