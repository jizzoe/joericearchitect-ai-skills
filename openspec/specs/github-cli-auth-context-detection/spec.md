# github-cli-auth-context-detection Specification

## Purpose

Defines a portable, non-secret diagnostic for determining whether GitHub CLI
authentication is usable in the execution context of an authorized operation.

## Requirements

### Requirement: Authentication context preflight is bounded and non-secret
The system SHALL perform a deterministic read-only GitHub identity or
repository probe before a GitHub CLI lifecycle operation when authentication
usability has not been established for that operation context. The persisted
diagnostic MUST contain only the command kind, normalized result class,
context type, timestamp, and returned account identity when available; it
MUST NOT retain raw CLI output, token text, environment values, keychain or
secret-store errors, or credential scopes.

#### Scenario: Current context authenticates
- **WHEN** the bounded read-only probe succeeds in the current execution
  context
- **THEN** the system records `authenticated` evidence for that context and
  proceeds only to the separately authorized operation

#### Scenario: Probe cannot run
- **WHEN** GitHub CLI is unavailable, the probe has an unrecognized failure,
  or normalized safe evidence is insufficient
- **THEN** the system records `auth-state-unknown` and pauses without
  attempting credential reads, reauthentication, or a GitHub write

### Requirement: Restricted-runtime credential visibility is classified by contrast
The system SHALL classify
`credential-unavailable-in-restricted-runtime` only when the same read-only
probe has an authentication-shaped failure in the restricted context and
succeeds through the active host-permission boundary before the operation
expires. If the identical host-context probe also has an authentication-shaped
failure, the system SHALL classify `credential-invalid-or-expired`; if host
permission is denied before the retry runs, it SHALL classify
`host-permission-denied`.

#### Scenario: Host keychain is not visible to the restricted runtime
- **WHEN** a restricted probe has an authentication-shaped failure and the
  identical permitted host probe succeeds for the same account or repository
- **THEN** the system records the restricted-runtime credential-unavailability
  class and provides a recovery reference without treating host success as
  write authorization

#### Scenario: Credential is unusable in both contexts
- **WHEN** the restricted and identical host probes both have normalized
  authentication-shaped failures
- **THEN** the system records `credential-invalid-or-expired` and remains
  fail-closed without token rotation or credential bridging

#### Scenario: Host retry is not permitted
- **WHEN** the restricted probe has an authentication-shaped failure and the
  runtime denies the host-permission boundary
- **THEN** the system records `host-permission-denied` and does not retry by a
  different host path

### Requirement: Host retry remains exactly operation-bound
The system SHALL request a host retry only for the same normalized read-only
probe and bind its recovery evidence to the originally authorized operation,
repository, optional payload digest, and expiration. Successful host
preflight SHALL NOT authorize a different repository, issue, Project, branch,
payload, credential source, or GitHub write.

#### Scenario: Bound lifecycle operation resumes after a contrast
- **WHEN** restricted-runtime credential unavailability is proven and the
  original operation remains exact, authorized, and unexpired
- **THEN** the system requests the existing runtime permission for that
  operation and retains the preflight evidence as recovery context

#### Scenario: Retry binding no longer matches
- **WHEN** the operation target, payload digest, repository, or expiration
  differs from the preflight binding
- **THEN** the system rejects the retry and records a safe mismatch result
  without invoking GitHub

### Requirement: Credential source and platform handling remain portable
The diagnostic SHALL normalize supported environment-token, macOS keychain,
Linux secret-store, and no-secret-store outcomes from probe behavior without
performing platform-specific credential reads. Claude and Codex integrations
MUST invoke the same canonical diagnostic contract through thin platform
exposure.

#### Scenario: Environment-token or Linux secret-store probe succeeds
- **WHEN** the current context can authenticate through a supported
  non-keychain credential source
- **THEN** the system records `authenticated` without assuming a keychain or
  requesting host permission

#### Scenario: Cross-assistant exposure is inspected
- **WHEN** Claude and Codex guidance for GitHub-backed SDD work is reviewed
- **THEN** both route to the same canonical diagnostic behavior without
  duplicate platform-specific credential logic

### Requirement: Exact host contrast is consumable by the matching lifecycle helper
An installed GitHub lifecycle helper SHALL accept a fixed host execution-context
selector only when the supplied authentication-context evidence is current,
exactly bound to the selected operation, repository, payload digest, and
expiry, and proves restricted-runtime credential unavailability through a
matching successful host probe. It MUST reject missing, restricted, stale,
mismatched, or unsupported context without attempting a GitHub write.

#### Scenario: Exact host-bound issue intake proceeds
- **WHEN** an issue-intake helper receives `host` context and current evidence bound to its exact issue operation with a successful matching host probe
- **THEN** it may evaluate the separately authorized issue-intake request through the existing host permission boundary

#### Scenario: Host selector does not broaden an issue action
- **WHEN** the host selector is paired with evidence for a different repository, payload digest, operation, expiry, or context classification
- **THEN** the helper rejects the request before searching for or creating an issue
