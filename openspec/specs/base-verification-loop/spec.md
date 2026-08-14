# Base Verification Loop Specification

## Purpose

Defines a portable, bounded implementation verification loop that selects
proportional checks, records reproducible evidence, and reports readiness
without replacing lifecycle or independent-review gates.

## Requirements

### Requirement: Verification starts from explicit behavior and authority
The `base-verification-loop` capability SHALL require intended observable
behavior and acceptance evidence, a failure or reproduction case or identified
risk, changed paths, named test or validation commands, a delivery profile of
`prototype-rapid` or `production-rapid`, execution mode, and the applicable
local implementation authorization. It MUST identify the smallest reproduction
or critical path before implementation, MUST restrict edits and checks to the
approved scope, and MUST NOT silently widen scope or infer mutation authority.

#### Scenario: Authorized bounded loop begins
- **WHEN** the caller supplies complete behavior, risk, path, command, profile,
  mode, and authorization inputs
- **THEN** the capability records the critical path and selects focused checks
  before making only the authorized local implementation changes

#### Scenario: Mutation authority or behavior is incomplete
- **WHEN** intended behavior, changed-path scope, or required local
  implementation authority is absent or ambiguous
- **THEN** the capability pauses before editing and reports the missing input or
  authorization boundary

### Requirement: The loop progresses through evidence-gated stages
The capability SHALL select focused deterministic checks and proportional
broader checks, perform only approved implementation work, run focused checks
before profile checks, conduct code and security review, classify every
finding, apply only separately authorized behavior-preserving
`objective-fix` corrections within the active correction budget, rerun affected
evidence, and report remaining risk. It MUST NOT skip or relabel a failed
required check as passed.

#### Scenario: Focused check fails objectively
- **WHEN** a focused check identifies a behavior-preserving objective defect
  and the active authorization permits that correction
- **THEN** the capability applies the bounded correction, reruns affected
  evidence, and records the attempt and outcome

#### Scenario: Failure needs a material decision
- **WHEN** a failed check or review finding requires changed behavior,
  architecture, compatibility, security, licensing, governance, data ownership,
  or broader scope
- **THEN** the capability pauses without applying the change or claiming the
  loop is ready

### Requirement: Delivery profiles select proportional evidence
For `prototype-rapid`, the capability SHALL require focused unit or integration
checks and one critical browser or mobile-web path when UI behavior exists. For
`production-rapid`, it SHALL additionally require appropriate regression
coverage, browser or device matrix evidence when applicable, repeatability,
operational checks, and stronger release evidence. Both profiles MUST retain
shared guardrails, core data-integrity checks, and critical-flow verification;
profile selection MUST NOT weaken authorization or delivery policy.

#### Scenario: Prototype has no UI behavior
- **WHEN** a `prototype-rapid` change has no user-interface behavior
- **THEN** the capability may mark browser evidence not applicable while still
  requiring focused deterministic checks and critical-flow evidence

#### Scenario: Production evidence is incomplete
- **WHEN** a `production-rapid` change lacks an applicable regression,
  repeatability, operational, browser, device, or release-evidence gate
- **THEN** the capability reports the exact gap and does not report production
  readiness

### Requirement: Initial web UI evidence is deterministic
For web-first UI work, the capability SHALL use Chromium at desktop
`1440x900` and mobile `390x844` as the initial viewport contract. A
layout-changing change MUST produce a current screenshot at each applicable
viewport and a critical-path interaction assertion. New or materially changed
UI MUST run automated axe-core accessibility checks through the browser test
integration and MUST retain manual keyboard or semantic review when the change
requires it. Native-mobile testing MUST be reported as outside the first
release rather than silently inferred.

#### Scenario: Layout-changing web UI is verified
- **WHEN** a change alters web layout or responsive interaction
- **THEN** evidence includes current screenshots at both applicable viewports
  and an assertion that exercises the critical interaction path

#### Scenario: New UI accessibility is evaluated
- **WHEN** UI is new or materially changed
- **THEN** evidence includes automated accessibility results and any applicable
  manual keyboard or semantic review gap

### Requirement: Missing verification tools fail visibly
When UI evidence is required, the capability SHALL treat Playwright and
Chromium as prerequisites and SHALL additionally require axe-core for new or
materially changed UI. In interactive mode it MUST report a missing prerequisite
and request installation or an approved environment; in autonomous mode it MUST
pause. A missing tool MUST NOT justify skipping a required check, and a
`production-rapid` UI change MUST remain not ready until all required browser
and accessibility evidence exists.

#### Scenario: Autonomous UI prerequisite is unavailable
- **WHEN** an autonomous UI verification run lacks a required browser or
  accessibility prerequisite
- **THEN** the capability pauses with the missing prerequisite and safe resume
  condition and does not claim readiness

#### Scenario: Interactive prerequisite is unavailable
- **WHEN** an interactive run lacks a required browser or accessibility tool
- **THEN** the capability requests the normal installation or environment
  authorization path without changing global configuration itself

### Requirement: Objective corrections and rereview are bounded
The capability SHALL use the review finding severity and disposition semantics
defined by `base-code-review`, MUST preserve every finding, and MUST permit at
most three materially different behavior-preserving correction attempts for one
failure signature, or a narrower configured budget. Each correction MUST rerun
affected checks and local review; a new implementation head MUST invalidate
stale evidence that was tied to the prior head.

#### Scenario: Objective correction succeeds
- **WHEN** an authorized objective correction resolves a finding within budget
- **THEN** the capability records the attempt and rerun evidence and uses only
  the current result when assessing readiness

#### Scenario: Correction budget is exhausted
- **WHEN** the configured number of materially different corrections for one
  failure signature does not resolve the failure
- **THEN** the capability returns a blocked result and preserves the unresolved
  finding and recovery evidence

### Requirement: Production readiness retains current strict review gates
A `production-rapid` readiness result SHALL require CI evidence tied to the
exact reviewed commit and the current configured strict independent-review
channel after Apply and after each behavior-preserving objective fix. The
capability MUST NOT substitute local code review, implementer self-review, an
ordinary pull-request review, or a self-invented weaker path for strict isolated
independent review. When strict review is unavailable under the current living
protocol, it MUST pause production readiness and defer to the independently
specified review and lifecycle policy; it MAY identify an explicitly selected
`prototype-rapid` run as a separate possible next action but MUST NOT downgrade
the active profile.

#### Scenario: Current production evidence passes
- **WHEN** profile-proportional checks, exact-commit CI evidence, and current
  strict isolated independent-review evidence all pass for the same head
- **THEN** the capability may report readiness for OpenSpec Verify without
  claiming delivery or OpenSpec completion

#### Scenario: Strict independent review is unavailable
- **WHEN** the configured strict reviewer cannot produce current valid evidence
  for the production head
- **THEN** the capability pauses production readiness under the current living
  protocol without inventing a substitute, using self-review, or silently
  downgrading the profile

### Requirement: Verification results are structured and lifecycle-limited
The capability SHALL emit `skill-result-v1` with `skill` set to
`base-verification-loop` and stable evidence identifiers for each command,
test, screenshot, accessibility check, and review. Its details MUST include
selected checks, results, reviewed changed paths, unresolved gaps, recovery
steps, correction attempts, current evidence bindings when applicable, and
whether another implementation cycle is needed or the work is ready for
OpenSpec Verify. It MUST NOT claim that OpenSpec Verify, CI delivery, merge, or
Archive is complete.
Readiness MUST require the unique reviewed-path set to cover every changed path.
The top-level shared result status MUST agree with readiness: paused and blocked
use their same-named statuses, needs-implementation uses completed, and ready
uses completed or no-op.

#### Scenario: Verification evidence is complete
- **WHEN** every required check for the selected profile has current passing or
  explicitly not-applicable evidence
- **THEN** the structured result reports readiness for OpenSpec Verify and cites
  the complete evidence set, every not-applicable result states a non-empty
  scope reason, and no check derived as applicable by the profile and UI scope
  is marked not applicable

#### Scenario: Required check is failed or stale
- **WHEN** any required result is failed, missing, stale, or tied to different
  changed paths or a different head
- **THEN** the result identifies the gap and reports another implementation
  cycle, pause, or blocked recovery action rather than readiness

### Requirement: Canonical verification behavior remains portable
The capability SHALL keep verification policy in one assistant-neutral
canonical skill, link the shared guardrails, consume `skill-result-v1`, and
take product commands, paths, browser configuration extensions, and adapter
identities through invocation or validated product configuration. Claude and
Codex wrappers MUST remain thin and preserve equivalent evidence, pause,
profile, and recovery behavior.

#### Scenario: Second product supplies different commands
- **WHEN** another workspace supplies different test, validation, and configured
  path values
- **THEN** the canonical loop applies the same profile and evidence rules
  without product constants or canonical edits

#### Scenario: Platform wrappers are compared
- **WHEN** Claude and Codex exposure is validated
- **THEN** both route to the canonical capability and produce equivalent
  structured evidence for the same synthetic scenario
