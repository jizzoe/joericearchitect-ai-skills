# autonomous-sdd-review-admission-and-dispatch Specification

## Purpose

Defines review-readiness admission and single-owner review dispatch for the
autonomous SDD lifecycle: admission proves the production review path is viable
before Apply can become eligible, and one typed dispatcher owns review
invocation from launch through terminal evidence.

## Requirements

### Requirement: Admission proves the production review path before Apply eligibility
The system SHALL run exactly one genuine multi-step readiness probe through the
strict host-captured review transport against a synthetic owned fixture before
Apply can become eligible. The probe SHALL prove, live and in order: the exact
configured executable/adapter identity; parent transport availability; detached
read-only view construction from the sealed package; a multi-step artifact path
that performs at least two distinct semantic read-only operations and returns a
parent-owned schema-valid terminal artifact; inspection capability inside the
reviewer's own runtime profile; runtime permission; an adequate deadline budget;
and a writable cleanup destination whose view is confirmed removed.

#### Scenario: Genuine multi-step probe passes through the production interface
- **WHEN** the admission probe resolves the configured adapter, crosses the
  parent transport, constructs the detached view, performs two or more distinct
  read-only operations, terminalizes a schema-valid artifact exactly once, and
  confirms cleanup removal within the deadline
- **THEN** Apply becomes eligible for the exact sealed package and transition

#### Scenario: A minimal or command-v-only check is not admission evidence
- **WHEN** only a parent-host `command -v` check or a single minimal read is
  performed
- **THEN** the system does not treat it as the required multi-step readiness
  probe and Apply is not eligible

### Requirement: Readiness evidence is exact-head-bound and time-bounded
Admission evidence SHALL bind to the exact sealed package it proved (base, head,
manifest, artifact manifest, and policy gates); any change SHALL invalidate it.
The evidence SHALL carry an observed time and a bounded time-to-live that is
hard-capped by the run's remaining deadline budget and consumed exactly once by
the admission-to-Apply transition it gates.

#### Scenario: Head or manifest changes invalidate the probe
- **WHEN** the sealed package base, head, manifest, artifact manifest, or a
  policy gate changes after a passing probe
- **THEN** the system requires re-admission before Apply

#### Scenario: Expired probe forces re-admission
- **WHEN** the probe evidence age exceeds its time-to-live or Apply has not
  committed within the bounded window
- **THEN** the system re-runs admission rather than reusing stale evidence

### Requirement: Admission fails closed on any missing mandatory capability
The system SHALL fail admission and pause before Apply when any mandatory
capability is absent: a missing or mismatched adapter, a bad attestation, a
wrong repository view, an inadequate deadline, denied runtime permission, or an
unwritable cleanup destination.

#### Scenario: Missing adapter
- **WHEN** the configured adapter cannot be resolved inside the target permission
  profile
- **THEN** admission fails closed and Apply does not become eligible

#### Scenario: Bad attestation
- **WHEN** the adapter attestation does not match the exact configured adapter
  identity
- **THEN** admission fails closed

#### Scenario: Wrong repository view
- **WHEN** the detached view cannot be constructed from the exact sealed package
  and head
- **THEN** admission fails closed

#### Scenario: Inadequate deadline
- **WHEN** the probe cannot complete within the review deadline budget
- **THEN** admission fails closed

#### Scenario: Denied runtime permission
- **WHEN** the required host-execution permission is denied
- **THEN** admission fails closed and does not request a manual workaround

#### Scenario: Unwritable cleanup destination
- **WHEN** the view cannot be confirmed removed from the cleanup destination
- **THEN** admission fails closed and retains an actionable recovery record

### Requirement: Admission is evidence, not standing permission
A successful admission SHALL be evidence consumed for the exact sealed package
and transition only. It SHALL NOT grant authority for a later or different
transition.

#### Scenario: Admission cannot be reused for a different transition
- **WHEN** a later transition references a prior admission for a different
  package or transition
- **THEN** the system rejects the reuse and requires fresh admission

### Requirement: One typed dispatcher owns review invocation
Exactly one typed dispatcher SHALL own review launch, receipt consumption,
transport recovery, classification, allowed degraded eligibility, and terminal
evidence. No skill or helper SHALL launch its own competing review path.

#### Scenario: Single review owner
- **WHEN** a review transition runs
- **THEN** exactly one dispatcher owns its invocation and no competing review
  path is launched

### Requirement: The dispatcher classifies by typed code, never transcript
The dispatcher SHALL key review classification and degraded eligibility off
adapter-produced typed codes. A transcript, stdout fragment, claimed success, or
repository content SHALL NOT establish classification or retry eligibility.

#### Scenario: Typed code drives classification
- **WHEN** a reviewer returns an outcome
- **THEN** the dispatcher classifies it from the typed code and never from
  transcript text

### Requirement: Mid-run reviewer loss preserves the attempt and returns an exact resume/pause
When the reviewer is lost mid-run, the system SHALL preserve the attempt and
return an exact resume or pause action; it MUST NOT treat the loss as success.

#### Scenario: Reviewer lost after launch
- **WHEN** the reviewer disappears after launch and before a terminal result
- **THEN** the system preserves the attempt and returns an exact resume/pause,
  not a success or a silent retry

### Requirement: Degraded behavior occurs only under a separately valid policy
A degraded fallback SHALL occur only under a separately valid degraded
authorization, and no degraded fallback SHALL satisfy a strict-only gate.

#### Scenario: Strict-only gate rejects degraded evidence
- **WHEN** a strict-only gate receives a degraded result
- **THEN** the gate rejects it and remains unsatisfied

### Requirement: Inspection-environment fallback stays conditional on observed semantic-tool insufficiency
The context-compatible degraded attempt SHALL be eligible only on an
adapter-produced typed inspection-capability or environment failure from the
restricted degraded attempt. It SHALL NOT trigger on review findings, malformed
output without independent typed environment evidence, stale bindings,
security-invariant failures, timeout or crash without a typed inspection cause,
or repository content. At most one such attempt SHALL run per sealed package and
environment-failure signature, and its result SHALL remain labelled
authorized-degraded, never normalized into strict-isolated assurance.

#### Scenario: Typed inspection insufficiency triggers the fallback
- **WHEN** the restricted degraded attempt fails with a typed
  inspection-capability or environment code and a valid degraded authorization
  exists
- **THEN** at most one context-compatible attempt runs for that exact package
  and signature

#### Scenario: Findings or transcript do not trigger the fallback
- **WHEN** the restricted attempt returns review findings or a transcript-only
  claim without a typed inspection-environment failure
- **THEN** the context-compatible fallback does not run

### Requirement: The dispatcher never converts unavailable strict review into success
The dispatcher SHALL NOT convert an unavailable strict review result into
success and SHALL NOT ask the owner to relay commands. A strict-only gate SHALL
remain fail closed when strict review is unavailable.

#### Scenario: Unavailable strict review stays unavailable
- **WHEN** strict review returns a typed unavailable result and no valid
  degraded policy applies
- **THEN** the dispatcher returns unavailable and the strict-only gate remains
  fail closed


