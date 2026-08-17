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
Each controller record MUST have an immutable generated run identity and a
checkpoint location derived from that identity; persistence MUST reject
replacement by a different recorded run. The controller MUST expose executable
registration, delivery-binding, and receipt-coupled cleanup transitions so
required resource evidence is produced by lifecycle work rather than tests. It
MUST NOT report a controller or ordered queue entry complete unless at least one
resource was registered and every registered resource has a current delivery
binding plus a terminal completed or already-completed cleanup receipt.

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

#### Scenario: Controller checkpoint collides with another run
- **WHEN** persistence targets a checkpoint owned by a different run identity
- **THEN** it rejects the replacement and preserves the existing record

#### Scenario: Executable cleanup transition completes
- **WHEN** registered resources pass exact post-Archive cleanup gates
- **THEN** the controller persists each receipt outside the target worktree and
  returns the updated record

#### Scenario: Cleanup evidence is incomplete
- **WHEN** a caller tries to complete cleanup or advance an ordered queue with
  no registered resource or without a terminal receipt for every resource
- **THEN** the controller pauses or rejects the transition and retains the
  recoverable records
