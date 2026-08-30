## ADDED Requirements

### Requirement: Installed controller exposes pending-checkpoint retirement recovery
The installed autonomous SDD controller SHALL expose one assistant-neutral
transition that evaluates and retires an exact expired never-admitted pending
checkpoint under current owner authority. The transition MUST derive repository
state from the explicit target repository and configured local state root,
publish only the immutable retirement receipt after all absence checks pass,
and return a typed idempotent result. It MUST NOT select work, advance a phase,
delete or rewrite a checkpoint, create a claim, or fall back to workspace code
when the installed transition is unavailable.

#### Scenario: Claude and Codex request the same retirement
- **WHEN** Claude or Codex invokes the declared installed transition with the
  same valid exact retirement request
- **THEN** both use the same canonical validation and receipt-publication path,
  and only the first invocation publishes evidence

#### Scenario: Retirement transition cannot prove absence
- **WHEN** configured state is unreadable, ambiguous, or contains any matching
  active or archived v2 identity
- **THEN** the transition pauses without lifecycle selection or mutation and
  reports the exact recovery classification

#### Scenario: Installed transition is unavailable
- **WHEN** the active installed runtime does not declare the retirement
  transition or fails its integrity contract
- **THEN** the caller pauses and MUST NOT invoke a workspace-relative substitute
