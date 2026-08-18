## ADDED Requirements

### Requirement: Autonomous prototype lifecycle is frictionless and evidence-convergent
The SDD lifecycle SHALL advance an exact, unexpired, controller-routed
`autonomous` plus `prototype-rapid` delivery through Plan-to-Apply and
Verified-to-Close without routine human approval prompts when every operation
is already inside the bounded grant. It MUST continue to enforce planning
review, exact issue and Project linkage, task dependencies, focused checks,
critical-flow evidence, requirement mapping, bounded local code and security
review, OpenSpec Verify, strict OpenSpec validation, delivery bindings, Sync,
Archive, lifecycle reconciliation, and exact-owned cleanup. It MUST preserve
owner-checkpointed and `production-rapid` behavior unchanged and MUST keep
milestone or project entry and exit reports visible but non-blocking when an
encompassing autonomous planning grant exists.

#### Scenario: Authorized autonomous prototype passes Plan-to-Apply
- **WHEN** exact controller context, issue linkage, planning artifacts,
  planning review, runtime permission, and current validation all pass
- **THEN** the lifecycle proceeds to Apply without emitting a routine
  Plan-to-Apply approval prompt

#### Scenario: Authorized autonomous prototype passes Verified-to-Close
- **WHEN** Apply, formal Verify, bounded local review, required quality actions,
  final-head evidence, delivery targets, and close-out predicates all pass
- **THEN** the lifecycle proceeds through authorized delivery, Sync, Archive,
  issue and Project convergence, and exact-owned cleanup without a routine
  Verified-to-Close approval prompt

#### Scenario: Required permission is denied
- **WHEN** authorization covers an operation but the active runtime, repository,
  credential, connector, or external service denies it after bounded diagnosis
- **THEN** the lifecycle preserves its first incomplete checkpoint and returns
  an actionable intervention report without weakening the boundary or claiming
  completion

#### Scenario: Another delivery profile runs
- **WHEN** execution is owner-checkpointed or the quality profile is
  `production-rapid`
- **THEN** the lifecycle retains the existing applicable approval and
  independent-review behavior and does not apply the frictionless prototype
  exception

### Requirement: Autonomous prototype close-out uses final-state evidence
The lifecycle SHALL report an autonomous prototype delivery complete only when
every applicable quality result, implementation delivery binding, living-spec
Sync result, Archive result, issue and Project state, cleanup receipt, and
residual-state check is current and bound to the exact final target and head.
It MUST route objective evidence failures through the authorized correction
loop and MUST stop on a material finding, unavailable authority, denied
permission, unsafe action, exhausted correction or run bound, or unrepairable
external dependency.

#### Scenario: Close-out evidence converges
- **WHEN** all required results and lifecycle records are current, passing,
  mutually consistent, and bound to the final target and head
- **THEN** the lifecycle may mark cleanup and the selected delivery complete

#### Scenario: A close-out result is failed or stale
- **WHEN** any required result is failed, missing, stale, mismatched,
  attempted-only, or leaves an unresolved objective finding
- **THEN** the lifecycle corrects it when safely eligible or preserves an
  incomplete checkpoint and MUST NOT report completion

### Requirement: Autonomous prototype intake does not add a routine publication gate
Before planning review, the SDD lifecycle SHALL use the durable reviewed
issue-payload binding from the exact autonomous prototype authorization to run
configured create-or-reuse intake idempotently. It MUST record the returned
issue identity, write valid tracking metadata, preserve issue content outside
the configured managed block, and reconcile the configured Project item. It
MUST NOT ask for a second skill-level approval when the exact binding and host
runtime permission remain current. Host denial, payload drift, missing
credentials, or target mismatch remains a stopping condition and MUST NOT be
hidden by the frictionless profile.

#### Scenario: Planning intake binding is current
- **WHEN** the selected change has a current reviewed issue binding and the
  configured host permits create-or-reuse and Project reconciliation
- **THEN** the lifecycle records exact issue and tracking evidence and proceeds
  to planning review without a routine publication prompt

#### Scenario: Managed issue content already exists
- **WHEN** the exact issue exists with human-authored content and a configured
  managed OpenSpec block
- **THEN** lifecycle reconciliation changes only the managed block as needed
  and preserves all other content

#### Scenario: Runtime permission is absent
- **WHEN** the issue binding is valid but the host denies the external mutation
- **THEN** the lifecycle stops at intake with durable recovery evidence and
  does not claim that skill policy overrides host authority
