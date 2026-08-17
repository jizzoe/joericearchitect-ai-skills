## MODIFIED Requirements

### Requirement: Complete delivery intake creates durable controller context
The system SHALL accept autonomous continuation only after resolving an explicit
change or ordered queue, mode, quality profile, authorization profile,
independent-review policy, and expiry. Before it selects work or mutates state,
it MUST persist a portable selected-entry record binding authorization digest,
selected entry, repository, expiry, lifecycle chain, phase, and checkpoint
location, without credentials or standing approval grants. The controller and
its terminal cleanup receipts MUST reside in a repository-scoped local state
location outside every removable lifecycle worktree. Before creating or
selecting a non-primary lifecycle branch or worktree, the controller MUST
durably register its exact repository, lifecycle role, identity, full head,
ownership token, recovery reference, and pending delivery binding. A registered
resource MUST retain its own delivery evidence as the corresponding lifecycle
pull request is merged; the controller MUST NOT substitute one global final
head for distinct resource deliveries.

#### Scenario: Complete target-explicit delivery starts
- **WHEN** a valid autonomous `sdd-delivery` request names one change or queue
- **THEN** the controller reports normalized authorization and persists context before lifecycle selection

#### Scenario: Intake is incomplete or invalid
- **WHEN** a delivery request lacks, conflicts on, or invalidly formats required input
- **THEN** the controller makes no selection or mutation and returns one consolidated clarification

#### Scenario: Lifecycle resource is registered before creation
- **WHEN** the controller is about to create an implementation, Sync, or Archive
  worktree or local branch for its selected entry
- **THEN** it persists an exact pending ownership record before the resource is
  eligible for a later cleanup transition

#### Scenario: Separate lifecycle deliveries are squash merged
- **WHEN** implementation, Sync, and Archive each merge through distinct
  squash pull requests
- **THEN** the controller binds each registered resource to its own exact topic
  head, pull request, and delivered default-branch head without relying on
  ancestry to a later lifecycle merge

#### Scenario: Lifecycle worktree is removed after Archive
- **WHEN** a registered worktree passes the exact post-Archive cleanup gate
- **THEN** its controller and terminal cleanup receipt remain recoverable from
  repository-scoped state outside that worktree
