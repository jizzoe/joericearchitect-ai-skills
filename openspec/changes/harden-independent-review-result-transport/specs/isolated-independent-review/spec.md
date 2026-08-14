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
evidence.

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

### Requirement: Review behavior is portable and recoverable
The system SHALL keep package, validation, finding, and safety policy in one
assistant-neutral source while product configuration supplies adapter identity,
isolation attestation, repository view strategy, allowed review commands, and
required artifact paths. Configuration MUST NOT contain credentials, absolute
machine paths, product-specific account or Project identifiers, or standing
permission grants. Failed execution MUST preserve the implementation branch and
evidence and identify the missing adapter, attestation, repository view, or
result condition needed for a safe retry.

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
