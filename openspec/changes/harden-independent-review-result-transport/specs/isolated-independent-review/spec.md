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
