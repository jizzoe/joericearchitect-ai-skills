## ADDED Requirements

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
