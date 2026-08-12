## Purpose

Defines the portable linkage and checkpoint evidence required to authorize SDD
delivery records that are deterministically derived from a bounded work queue.

## ADDED Requirements

### Requirement: Derived delivery targets are deterministic and constrained
The system SHALL permit a bounded authorization to declare an ordered named
queue and a derived-target rule. A derived target MUST identify its selected
queue entry, repository, record kind, exact identifier, base branch where
applicable, and current head commit where applicable. The system MUST reject a
derived target unless every field matches the active queue entry and the named
repository, and it MUST retain exact-target behavior when no derived-target
rule exists.

#### Scenario: Derived pull request target matches the selected entry
- **WHEN** an active authorization selects one named queue entry and records a
  pull request derived for that entry in its named repository and base branch
- **THEN** the system recognizes only that recorded pull request as eligible
  for the entry's delivery transition

#### Scenario: Unrelated record resembles a derived target
- **WHEN** a requested issue, branch, pull request, Sync record, Archive
  target, or cleanup branch is not recorded for the selected queue entry
- **THEN** the system pauses before mutation with an unauthorized-target result

### Requirement: Derived targets retain all existing delivery gates
The system SHALL authorize a derived delivery transition only after fixed
profile membership, explicit mutation permission, expiration, runtime
permission, adapter capability, current evidence, recovery behavior, and the
transition-specific target type all pass. Derived-target matching MUST NOT
authorize credentials, external sends, deployments, releases, cloud actions,
or unrelated lifecycle actions.

#### Scenario: Derived high-impact action has current evidence
- **WHEN** a selected entry's recorded pull request, Archive target, or merged
  topic branch matches the requested high-impact transition and all required
  lifecycle evidence is current
- **THEN** the system returns an authorized result without widening permission
  to another record

#### Scenario: Derived high-impact action has stale evidence
- **WHEN** a high-impact request matches a derived target but its evidence or
  recorded head commit is stale
- **THEN** the system pauses before the action and identifies the stale gate

### Requirement: Program checkpoints are durable and resumable
The system SHALL represent each selected queue entry with an ordered durable
checkpoint containing its derived records, current evidence references, head
commit when applicable, and lifecycle step status. On resume it MUST identify
the first incomplete or stale step from checkpoint data and MUST classify
conflicting durable records as requiring human review.

#### Scenario: Resume finds an incomplete delivery step
- **WHEN** a checkpoint records completed current steps followed by an
  incomplete transition
- **THEN** the system reports that transition as the next step without
  recreating completed records

#### Scenario: Resume finds conflicting durable state
- **WHEN** a checkpoint contains a durable-state conflict for a selected entry
- **THEN** the system returns a human-decision result and does not select a
  later queue entry
