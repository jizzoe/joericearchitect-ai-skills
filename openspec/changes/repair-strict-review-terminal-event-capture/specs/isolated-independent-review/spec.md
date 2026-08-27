## MODIFIED Requirements

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

## ADDED Requirements

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
