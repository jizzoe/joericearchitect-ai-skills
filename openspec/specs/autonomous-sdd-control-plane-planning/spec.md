# autonomous-sdd-control-plane-planning Specification

## Purpose

Defines dependency-safe planning for autonomous SDD bootstrap ownership,
activation, external lifecycle boundaries, Sync coordination, and default
cutover.

## Requirements

### Requirement: Operational activation uses explicit single-owner modes
The control-plane plan SHALL distinguish `contract-only`, `audit/shadow`,
`bootstrap-hybrid`, `qualified-opt-in`, and `default` modes. Each mode MUST name
exactly one controller/runtime generation allowed to mutate a given run and
repository. Publishing a schema, helper, adapter, or contract MUST NOT by
itself change operational routing or grant mutation authority.

#### Scenario: A contract is published before its lifecycle is complete
- **WHEN** a new controller contract or helper is released without the complete activation bundle and qualification evidence
- **THEN** it remains contract-only or audit/shadow and the existing delivery owner retains all real mutation authority

#### Scenario: A run is already admitted under one generation
- **WHEN** routing mode changes while a run has an immutable controller, backend, or claim binding
- **THEN** that run remains owned by its recorded generation or uses an explicit evidence-bound compatibility migration; no second owner is created

### Requirement: Runtime upgrades use a two-version bootstrap rule
Runtime generation N-1 SHALL deliver and archive the change that releases
runtime generation N. Generation N MUST be installed only after that Archive
is merged and MUST NOT be required to initialize, deliver, verify, archive, or
otherwise prove completion of its own releasing change. Post-release adoption
and migration evidence MUST live in a separate receipt, follow-up change, or
handoff rather than an unchecked self-referential release task.

#### Scenario: A change releases a new controller capability
- **WHEN** runtime N lacks a capability that the change itself introduces
- **THEN** the authorized N-1/bootstrap owner completes implementation, Sync, and Archive before N is installed and used by later work

#### Scenario: A release task requires its own installed result
- **WHEN** a proposed change task can complete only after that same change is archived and installed
- **THEN** planning rejects or separates the task before Propose readiness

### Requirement: Real ownership activates only as a minimum vertical bundle
The plan SHALL treat initialization, claim acquisition and fencing, deterministic
advancement, interruption recovery, terminalization, claim release, external
convergence, exact-owned cleanup, and tested rollback as one minimum activation
bundle. Real repository ownership MUST remain disabled until the bundle is
implemented together and its applicable qualification gate passes.

#### Scenario: Only admission and claim acquisition are implemented
- **WHEN** downstream recovery, terminalization, convergence, cleanup, or rollback is absent or unqualified
- **THEN** the new generation cannot become the real mutating owner even if its schemas and claim provider are available

#### Scenario: M2 work is selected after stabilization
- **WHEN** M1 contracts and repair closeout are reconciled and this stabilization plan is accepted
- **THEN** M2-S1 is the next implementation slice, followed by M2-S2 and M2-S3, while operational activation remains gated by the complete vertical bundle

### Requirement: External GitHub mutation uses an exact authenticated-host envelope
M4-S1 planning SHALL require a restricted controller to prepare one
authorization-bound, non-secret request for an exact GitHub operation, an
authenticated host to execute only that request, and a non-secret result
receipt that the controller revalidates before advancing. The preflight MUST
include repository merge and automatic topic-branch deletion policy whenever
remote branch retention is required, and MUST verify or restore only the exact
reviewed remote ref without force.

#### Scenario: Restricted runtime cannot access host credentials
- **WHEN** an authorized GitHub mutation is ready but the restricted runtime has no credential
- **THEN** it emits the exact host-operation request without receiving the credential and advances only after validating the matching receipt

#### Scenario: Repository policy removes a retained branch
- **WHEN** a squash merge automatically deletes a topic branch that the authorization requires retaining
- **THEN** the lifecycle detects the policy/effect, restores only the exact reviewed topic head when authorized, and records branch-retention evidence

### Requirement: Sync preflight evaluates every active overlapping delta
M4-S2 planning SHALL require a repository-wide graph of active delta operations
before Sync mutation or pull-request creation. Complete-replacement `MODIFIED`
requirements that overlap a living requirement or another active delta MUST be
serialized or reconciled under shared authority. Sync and pre-Archive evidence
MUST compare requirement descriptions and scenarios, not only Markdown schema
validity, and repeat Sync MUST be a no-op.

#### Scenario: An older active modified requirement omits a newer scenario
- **WHEN** a proposed Sync would make the living requirement conflict with another active complete replacement
- **THEN** the controller pauses before writing a Sync branch or PR and reports the exact overlap and dependency-valid repair order

#### Scenario: Living Markdown validates but loses accepted prose
- **WHEN** schema validation passes while a requirement description or scenario differs from the accepted delta
- **THEN** exact semantic comparison fails the Sync or Archive gate before the change can be archived

### Requirement: Planning truth converges on mainline at closeout
Every delivered slice or repair SHALL reconcile its mainline roadmap status,
accepted decisions, dependencies, repair lineage, deferred tracker work, and
relevant handoffs/notes before subsequent work selection. Blocker records MUST
link repeated symptoms to one causal record and support `rootCauseId`,
`expectedStop`, `temporaryUntil`, `permanentRepair`, and `escapedGate` fields.
External tracker integration MUST remain disabled until a dedicated accepted
slice defines authority, configuration, authorization, reconciliation, and
evidence.

#### Scenario: Accepted planning exists only on a stale branch
- **WHEN** a closeout audit finds accepted decisions or deferred work not contained in main
- **THEN** it deliberately recovers and reconciles the still-current content without blindly merging stale branch state

#### Scenario: Several pauses share one cause
- **WHEN** multiple chronological interruptions arise from the same activation or external-boundary defect
- **THEN** the register preserves each event but links it to one root cause and one permanent repair instead of treating each symptom as a separate architecture failure
