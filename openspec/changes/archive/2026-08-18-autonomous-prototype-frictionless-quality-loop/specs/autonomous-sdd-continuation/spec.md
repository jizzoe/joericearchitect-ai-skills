## ADDED Requirements

### Requirement: Controller context persists reviewed issue-intake binding and evidence
The run-specific autonomous SDD controller SHALL persist one exact reviewed
issue-intake binding for its selected entry before issue publication. The
binding MUST include the canonical payload digest, configured repository,
title, managed labels, managed block, operation, expiry, ownership and recovery
reference, and MUST contain no credential. After create-or-reuse, the
controller MUST bind the returned issue number, URL, state, labels, and current
evidence to the same payload digest. Resume MUST reread that durable record and
reconcile the first incomplete intake action without inferring a replacement
payload or re-requesting a skill-level approval when the exact binding and
runtime permission remain current.

#### Scenario: Reviewed intake is registered before publication
- **WHEN** planning produces the exact issue payload for an autonomous
  prototype selected entry
- **THEN** the controller persists the reviewed pending binding before any
  issue mutation occurs

#### Scenario: Issue evidence is bound after create-or-reuse
- **WHEN** configured intake creates or finds the exact bound issue
- **THEN** the controller persists the issue identity and current evidence
  against the same selected entry and payload digest

#### Scenario: Interrupted intake resumes
- **WHEN** a run resumes with a valid unexpired pending or delivered issue
  binding
- **THEN** the controller reconciles the exact issue action and proceeds from
  its first incomplete evidenced state without generating a different payload

#### Scenario: Intake record conflicts on resume
- **WHEN** the current payload, selected entry, repository, title, digest,
  issue identity, or expiry conflicts with the durable intake record
- **THEN** the controller pauses before external mutation and preserves the
  original binding and recovery evidence
