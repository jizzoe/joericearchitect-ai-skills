## ADDED Requirements

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
