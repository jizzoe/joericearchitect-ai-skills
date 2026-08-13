## Purpose

Defines the explicit, time-bounded reduced-assurance review evidence that an
owner may authorize after strict isolated independent review is unavailable.

## ADDED Requirements

### Requirement: Degraded review requires a precise affirmative authorization
The system SHALL accept degraded independent review only when an active bounded
authorization contains an affirmative `degradedIndependentReview` record for
one selected change and one named delivery transition. The record MUST name the
fallback boundary `fresh-separated-reviewer-only`, an expiration no later than
the enclosing goal, a non-empty risk-acceptance reason, and the initial
base/head/package binding. It MUST cover a derived head only when that head is
an in-scope, behavior-preserving objective correction inside the active
per-signature correction budget and before expiration. Absence, broad scope,
malformation, expiration, wrong change, wrong transition, stale SHA, stale
manifest, material change, or exhausted budget MUST pause the transition.

#### Scenario: Exact authorization permits evaluation
- **WHEN** a selected transition has current Apply evidence, an exact active
  authorization, and a strict-review unavailable record for its sealed package
- **THEN** the runner may evaluate a degraded result only for that exact
  transition and package without granting standing fallback permission

#### Scenario: Authorization is not exact and current
- **WHEN** the authorization is absent, expired, malformed, broad, or binds a
  different change, transition, head, or manifest
- **THEN** the runner pauses before fallback invocation and records the failed
  authorization boundary

### Requirement: Degraded evidence is distinct and capability-bounded
The system SHALL label every accepted fallback result `authorized-degraded` and
MUST NOT represent it as strict isolation, read-only enforcement, or equivalent
assurance. Its immutable result and transition record MUST include the strict
adapter unavailable result, authorization reference and risk reason, a
capability ledger that separately lists `enforced`, `unavailable`, and
`instruction-constrained` controls, reviewer identity, fresh-context assertion,
canonical base/head, manifest, findings, dispositions, transition, timestamps,
and expiration. The ledger MUST state that GitHub mutation, deployment, release,
external send, credentials, and delegated mutation are unavailable to the
reviewer.

#### Scenario: Degraded result is durably visible
- **WHEN** a fallback reviewer returns a result for a valid authorized package
- **THEN** the checkpoint and delivery evidence retain its assurance level,
  strict unavailable precursor, authorization, capability ledger, and exact
  bindings without converting them to strict evidence

#### Scenario: Result misstates assurance or capability
- **WHEN** a fallback result claims strict isolation, omits a required ledger
  entry, or grants a prohibited mutation-capable path
- **THEN** validation rejects it and pauses the transition

### Requirement: Fallback reviewer remains independently constrained
The system SHALL invoke an authorized degraded reviewer only after strict
unavailability, in a fresh separate noninteractive session against the sealed
package and detached committed view. The reviewer MUST receive neither the
implementation-session history nor an intended conclusion. The adapter MUST
use the strongest available practical restrictions, disable configured GitHub
and deployment tools, restrict inspection to deterministic allowlisted commands,
and accurately report any control that is not runtime-enforced. A same-session
subagent, the implementer, ordinary PR review, mutable reviewer, or unavailable
fresh/sealed/detached boundary MUST pause the transition.

#### Scenario: Strict-first fallback is available
- **WHEN** strict review has produced a durable unavailable result and the
  precise authorization remains active
- **THEN** a fresh separate fallback may inspect only the sealed detached view
  and return a degraded result with its proven and unproven restrictions

#### Scenario: Fallback independence cannot be established
- **WHEN** the fallback shares the implementer context, lacks a sealed package
  or detached view, or has mutation-capable authority
- **THEN** the adapter returns unavailable and the lifecycle pauses

### Requirement: Nested-reviewer recovery preserves the review boundary
When a managed outer sandbox prevents detached-view creation or nested reviewer
startup, the system SHALL record a stable unavailable code and pause unless the
active run authorization, configured deterministic launcher capability, and
runtime permission explicitly permit a review launcher. The launcher MUST create
the owned exact-head detached view outside the outer sandbox and start the
inner reviewer with a fresh ephemeral read-only sandbox and sealed-package-only
input. The in-sandbox controller MUST only prepare and accept a digest-bound
structured request; a separately configured fixed host MUST perform view and
reviewer operations, and response acceptance MUST require trusted-runtime
outside-sandbox execution evidence bound to that host execution. A host's own
claim MUST NOT establish this boundary. Neither component may self-escalate,
execute untrusted shell text, receive the
implementation session history, or grant the inner reviewer GitHub, credential,
deployment, release, external-send, or delegated-mutation authority.

#### Scenario: Launcher permission is unavailable
- **WHEN** a strict or degraded attempt fails because the outer sandbox denies
  review-view setup or nested reviewer initialization
- **THEN** the system records the launcher-unavailable code and pauses without
  trying a package-only or unsandboxed substitute

#### Scenario: Configured launcher is explicitly permitted
- **WHEN** the exact review transition has an active launcher authorization and
  runtime permission
- **THEN** the controller prepares the bound request, the trusted runtime invokes
  the fixed host outside the failed sandbox, and the host creates the owned
  detached exact-head view and invokes the inner reviewer with its separate
  read-only boundary and sealed package

### Requirement: Degraded review preserves finding and recovery gates
The system SHALL apply the existing blocker, high, material-decision, finding
disposition, correction-budget, current-evidence, and rereview gates to
authorized-degraded results. Every new head MUST repeat the strict-first
decision; prior strict unavailability and degraded approval MUST NOT become
general permission. Recovery MUST re-derive authorization, strict record,
package, result, checkpoint, and transition state from durable evidence.

#### Scenario: Objective correction creates a derived package
- **WHEN** an evidence-backed behavior-preserving objective correction creates
  a new head within the recorded envelope
- **THEN** affected checks run and strict review is retried before an active
  derived authorization can permit a fresh degraded review

#### Scenario: Material finding or expired acceptance appears
- **WHEN** a result has a blocker, high, material finding, expired acceptance,
  or unavailable degraded reviewer
- **THEN** the runner pauses and preserves the branch and durable evidence
