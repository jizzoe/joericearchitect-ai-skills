## ADDED Requirements

### Requirement: Autonomous issue intake validates a durable reviewed payload binding
GitHub issue authoring SHALL accept an exact durable intake binding for an
authorized autonomous SDD run. The binding MUST include the selected entry,
configured repository, title, managed labels, managed OpenSpec block,
canonical body digest, operation, expiry, and idempotent recovery rule. Before
create-or-find, the helper MUST canonicalize the current payload, compare its
digest and every exact target field with the binding, and require an explicit
current runtime-permission input. It MUST return structured safe diagnostics
without invoking GitHub when the binding is missing, expired, mismatched, or
runtime-denied.

#### Scenario: Exact autonomous intake binding passes
- **WHEN** the current issue payload, configured target, selected entry,
  operation, and expiry match the durable binding and runtime permission is
  current
- **THEN** the helper invokes duplicate-safe create-or-find without requesting
  another skill-level approval and returns structured issue evidence

#### Scenario: Current payload differs from the binding
- **WHEN** any body content, title, label, managed block, repository, selected
  entry, operation, digest, or expiry differs from the durable binding
- **THEN** the helper returns a structured mismatch and performs no GitHub
  mutation

#### Scenario: Host permission is denied
- **WHEN** the durable binding matches but the explicit current runtime input
  denies issue publication
- **THEN** the helper returns a runtime-denied result and does not attempt a
  different command or claim the skill can override host policy

### Requirement: Bound issue creation preserves idempotent intake behavior
Bound autonomous issue intake SHALL reuse the existing exact-title search,
structured `gh` argument boundary, configured labels, and managed-block
preservation behavior. It MUST record the created or reused issue number, URL,
title, state, labels, payload digest, and selected-entry linkage as current
evidence suitable for tracking and lifecycle reconciliation.

#### Scenario: Exact issue already exists
- **WHEN** a bound intake request finds the exact configured repository and
  title already present
- **THEN** the helper returns the existing issue evidence, creates no
  duplicate, and preserves human-authored body content outside the managed
  block

#### Scenario: Bound issue is newly created
- **WHEN** no exact issue exists and the binding plus runtime permission pass
- **THEN** the helper creates the issue through structured arguments and
  returns evidence bound to the payload digest and selected entry
