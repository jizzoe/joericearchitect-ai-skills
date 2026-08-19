## Why

GitHub CLI can report an authentication-shaped failure from a restricted
runtime even when the same host keychain session remains valid. Treating every
such failure as an invalid token causes avoidable SDD pauses, while bypassing
the runtime permission boundary would weaken credential isolation.

This change makes the execution context visible through a deterministic,
non-secret preflight so an already-authorized lifecycle operation can receive
truthful recovery guidance without inferring host permission or credential
validity.

Primary issue: https://github.com/jizzoe/joericearchitect-ai-skills/issues/146

## What Changes

- Add a reusable GitHub CLI authentication-context diagnostic that performs a
  bounded read-only identity or repository probe, normalizes safe evidence,
  and never reads or persists credential material.
- Classify `authenticated`, `credential-unavailable-in-restricted-runtime`,
  `credential-invalid-or-expired`, `host-permission-denied`, and
  `auth-state-unknown`, including unavailable-CLI and non-keychain hosts.
- Bind a host-permission retry to the identical read-only probe and then to the
  already-authorized lifecycle operation, repository, optional payload digest,
  and expiry; a successful preflight is not write authorization.
- Integrate the diagnostic before GitHub-backed autonomous SDD lifecycle
  operations, retaining fail-closed behavior and durable non-secret recovery
  evidence.
- Add deterministic fixtures and regression tests for restricted/host outcome
  combinations, redaction, retry binding, and false-pause prevention.

## Capabilities

### New Capabilities

- `github-cli-auth-context-detection`: Safely diagnose whether GitHub CLI
  authentication is usable in the current execution context and bind any
  permitted host retry to the same authorized operation.

### Modified Capabilities

- `autonomous-sdd-continuation`: Require GitHub lifecycle transitions to use
  the context-aware diagnostic and retain its recovery evidence without
  broadening runtime permission or credential authority.

## Impact

- Affected assets: reusable `scripts/sdd` and runtime adapter code, canonical
  autonomous-SDD guidance, generated thin Claude/Codex exposure where needed,
  test fixtures, and OpenSpec lifecycle specifications.
- Compatibility: Existing GitHub CLI credential sources, including environment
  tokens and non-macOS secret stores, retain ordinary behavior. Callers gain
  normalized diagnostics rather than a credential-format or command-interface
  change.
- Security: No token, environment value, keychain error, raw CLI output, or
  credential scope is stored, displayed, relayed, or modified. Host access is
  still mediated by the active runtime permission boundary.

## Non-Goals

Reauthentication, token generation or rotation, credential bridging, automatic
host escalation, scope changes, and treating successful host authentication as
authorization for unrelated writes are excluded.

## Reuse Plan

The classifier and retry-binding contract will be assistant-neutral reusable
code. Product repository, issue, Project, branch, payload, and expiry values
remain supplied by the caller's configuration and durable authorization. Claude
and Codex wrappers remain thin pointers to the same canonical SDD assets.
