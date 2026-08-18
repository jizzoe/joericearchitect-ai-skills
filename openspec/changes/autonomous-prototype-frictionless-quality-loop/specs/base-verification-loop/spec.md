## MODIFIED Requirements

### Requirement: Delivery profiles select proportional evidence
For `prototype-rapid`, the capability SHALL require focused unit or integration
checks, critical-flow evidence, requirement mapping, bounded local code and
security review, and one critical browser or mobile-web path when UI behavior
exists. For `production-rapid`, it SHALL additionally require appropriate
regression coverage, browser or device matrix evidence when applicable,
repeatability, operational checks, stronger release evidence, and the current
independent-review contract. Both profiles MUST retain shared guardrails, core
data-integrity checks, OpenSpec Verify, strict OpenSpec validation, and
critical-flow verification; profile selection MUST NOT weaken authorization or
delivery policy. In autonomous prototype mode, the capability MUST distinguish
blocking human approvals from required quality actions and completion-evidence
predicates and MUST NOT represent frictionless execution as absent quality.

#### Scenario: Autonomous prototype has no UI behavior
- **WHEN** an autonomous `prototype-rapid` change has no user-interface
  behavior
- **THEN** the capability marks browser evidence not applicable while still
  requiring focused deterministic checks, critical-flow evidence, requirement
  mapping, local review, Verify, and strict validation

#### Scenario: Prototype has no UI behavior
- **WHEN** a `prototype-rapid` change has no user-interface behavior
- **THEN** the capability may mark browser evidence not applicable while still
  requiring focused deterministic checks and critical-flow evidence applicable
  to its execution mode

#### Scenario: Autonomous prototype evidence is incomplete
- **WHEN** any applicable required quality action lacks a current passing result
  bound to the final target and head
- **THEN** the capability returns correction work or a structured stop and does
  not report readiness

#### Scenario: Production evidence is incomplete
- **WHEN** a `production-rapid` change lacks an applicable regression,
  repeatability, operational, browser, device, release-evidence, or independent
  review gate
- **THEN** the capability reports the exact gap and does not report production
  readiness

### Requirement: Objective corrections and rereview are bounded
The capability SHALL use the review finding severity and disposition semantics
defined by `base-code-review`, MUST preserve every finding, and MUST permit at
most three materially different behavior-preserving correction attempts for one
canonical failure signature, or a narrower configured budget. It MAY process
more than three total corrections when they belong to distinct canonical
signatures and the enclosing authorization remains active. Each correction
MUST record a supported diagnosis and bounded change, rerun affected checks,
and request fresh applicable review; a relevant implementation change MUST
invalidate stale evidence tied to the prior state or head. Repetition without
new diagnostic evidence MUST count as stagnation under the existing signature
instead of resetting the budget.

#### Scenario: Objective correction succeeds
- **WHEN** an authorized objective test or local-review correction resolves a
  finding within its canonical per-signature budget
- **THEN** the capability records the attempt, reruns affected evidence and
  review, and uses only current results when assessing readiness without a
  routine human pause

#### Scenario: Distinct failures are corrected
- **WHEN** separate canonical signatures require more than three aggregate
  corrections within the overall run bound
- **THEN** the capability retains separate correction histories and continues
  until evidence converges or another stop condition applies

#### Scenario: Correction budget is exhausted
- **WHEN** three materially different corrections for one canonical failure
  signature do not resolve the failure
- **THEN** the capability refuses a fourth attempt and returns a durable blocked
  intervention result preserving the unresolved finding and recovery evidence

## ADDED Requirements

### Requirement: Autonomous prototype quality runs continuously to convergence
The capability SHALL run the autonomous `prototype-rapid` sequence as focused
checks, critical-flow checks, requirements mapping, bounded `local-review`,
OpenSpec Verify, strict OpenSpec validation, and lifecycle reconciliation. An
objective failure MUST become eligible correction work rather than a routine
approval gate. A material finding, unavailable required authority, denied
permission, unsafe or destructive action, exhausted signature or run bound, or
unrepairable external-service failure MUST stop with preserved state and an
actionable structured intervention report.

#### Scenario: Local review finds an objective defect
- **WHEN** the bounded local-review worker returns an `objective-fix` finding
  with a safe correction inside authorization and budget
- **THEN** the implementer diagnoses, corrects, reruns affected checks, and
  requests fresh local review without a routine human confirmation

#### Scenario: A material decision is required
- **WHEN** a finding would change observable behavior, architecture, security,
  privacy, licensing, governance, data ownership, scope, or authority
- **THEN** the capability stops with the exact decision and evidence required
  to resume and does not apply a guessed correction

#### Scenario: Quality actions pass but final binding is stale
- **WHEN** required actions passed for an earlier package, workspace state, or
  head but the final target differs
- **THEN** the capability invalidates affected evidence and does not report
  readiness until current evidence converges on the final target
