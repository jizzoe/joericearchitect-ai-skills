## Purpose

Defines the local, single-writer durable execution backend that keeps
authoritative history outside disposable worktrees, rebuilds current state as a
projection, and guards mutation with one coarse repository-wide claim and an
ownership generation fence. It stays contract-only/audit and does not activate
real lifecycle ownership.

## ADDED Requirements

### Requirement: History lives outside disposable worktrees and is authoritative
The backend SHALL persist authoritative append-only history in a stable state home
outside removable worktrees. Current state and repository-visible indexes MUST be
rebuildable projections derived from that history, never the source of truth.

#### Scenario: A worktree is moved or removed
- **WHEN** a linked worktree is moved or removed
- **THEN** the backend still derives the run from its authoritative history and can rebuild the projection

### Requirement: One coarse claim guards overlapping mutation
The backend SHALL enforce one repository-wide single-writer claim. A second
mutating runner for the same repository MUST be denied while a claim is active,
and every write MUST verify the current ownership generation so a stale process
cannot advance state.

#### Scenario: A second runner is denied
- **WHEN** a second mutating run requests the repository while an active claim is held
- **THEN** admission is denied and the existing claim is preserved

#### Scenario: A stale owner cannot write
- **WHEN** a write is attempted under an ownership generation that is no longer current
- **THEN** the write fails closed with a stale-owner reason

### Requirement: Takeover is operator-directed and conclusive
Takeover SHALL require an explicit operator-directed proof that the current owner
is absent, and MUST reject takeover when an in-doubt attempt is unreconciled.
Successful takeover SHALL increment the ownership generation so the previous
owner fails every later write.

#### Scenario: Conclusive takeover increments ownership
- **WHEN** an operator directs takeover with owner-absent proof and no unreconciled attempt
- **THEN** the ownership generation increments and the old owner is rejected on later writes

#### Scenario: Inconclusive takeover is rejected
- **WHEN** takeover lacks operator direction, owner-absent proof, or has an unreconciled attempt
- **THEN** takeover is rejected and the existing claim is preserved

### Requirement: Provider capability rejects weaker lock and durability fallbacks
The backend SHALL require a claim provider that declares generation fencing,
explicit takeover, durable writes, directory-metadata durability, and advisory
locking on POSIX / `LockFileEx` on Windows. A weaker or different provider MUST
be rejected rather than substituted while a claim is held.

#### Scenario: A weaker provider is rejected
- **WHEN** a provider omits a required capability or declares a weaker lock primitive
- **THEN** the provider is rejected and no claim is created

### Requirement: Discovery is by canonical repository identity, not the current directory
The backend SHALL locate runs and state by canonical repository identity and the
selected backend, never the caller's current directory or nearest checkpoint file.

#### Scenario: Discovery ignores the caller's directory
- **WHEN** run state is located by repository identity instead of the current directory
- **THEN** the same canonical run and projection are found regardless of the caller's location

### Requirement: Legacy inventory is read-only and ambiguous state is untouched
The backend SHALL recognize pre-existing state without mutating it. Ambiguous,
active, or unrecognized legacy state MUST remain untouched and fail closed rather
than being guessed or rewritten.

#### Scenario: Ambiguous legacy state is preserved
- **WHEN** legacy state cannot be classified as terminal or active
- **THEN** the backend leaves it unchanged and admission fails closed

### Requirement: Kill/restart preserves or reconstructs valid state
The backend SHALL write records atomically and rebuild state from authoritative
history, so a crash or restart at any storage boundary preserves or reconstructs
valid state without duplication or loss.

#### Scenario: Restart reconstructs valid state
- **WHEN** the process is killed at a storage boundary and restarted
- **THEN** valid state is preserved or reconstructed from authoritative history
