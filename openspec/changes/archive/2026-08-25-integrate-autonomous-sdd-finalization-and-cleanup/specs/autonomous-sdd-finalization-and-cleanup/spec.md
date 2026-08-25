# autonomous-sdd-finalization-and-cleanup Specification

## Purpose

Codifies terminal convergence predicates, claim-release ordering, and exact
resource-eligibility classification so closeout and cleanup cannot falsely
complete, release a claim too early, or damage dirty, unrelated, primary, or
ambiguously owned resources.

## ADDED Requirements

### Requirement: Terminal convergence requires every predicate
A run SHALL be terminal only when implementation, Sync, and Archive delivery are
present with exact delivered heads, the issue is closed, the Project is Done,
cleanup is completed, and the terminal record is complete with a final head and
a completed cleanup disposition.

#### Scenario: Missing predicate blocks terminal
- **WHEN** any of implementation, Sync, Archive, issue-close, Project-Done,
  cleanup, or terminal completion is absent
- **THEN** the predicate reports the run as not terminal and names the missing
  items

#### Scenario: All predicates converge
- **WHEN** every delivery, issue/Project, cleanup, and terminal predicate holds
- **THEN** the predicate reports the run as terminal

### Requirement: Claim release follows cleanup then terminal
Claim release SHALL occur only after cleanup converges, the terminal status is
complete, and the issue and Project have converged. A merged PR or an archived
directory alone SHALL NOT authorize release.

#### Scenario: Release before cleanup is blocked
- **WHEN** the cleanup disposition is not completed
- **THEN** claim release is blocked and the missing predicates are named

#### Scenario: Converged order authorizes release
- **WHEN** cleanup, terminal status, issue close, and Project Done all hold
- **THEN** claim release is authorized

### Requirement: Eligibility requires exact ownership and clean delivered state
A resource SHALL be cleanup-eligible only when it is exactly owned, non-primary,
non-locked, clean, non-divergent, and delivered at the exact recorded head with
current delivery evidence.

#### Scenario: Exact clean delivered resource is eligible
- **WHEN** a resource matches its ownership record and delivery evidence at the
  exact head
- **THEN** it is classified eligible

#### Scenario: Dirty resource is ineligible
- **WHEN** a resource is dirty
- **THEN** it is classified ineligible and retained

### Requirement: Ineligible resources are retained with a typed reason
Dirty, unrelated, primary, locked, divergent, legacy, remote, and
ownership-mismatched resources SHALL be retained with a typed recovery reason.
The system SHALL NOT infer ownership or broad-clean.

#### Scenario: Legacy resource is not inferred
- **WHEN** a resource has no contemporaneous ownership record
- **THEN** it is classified legacy/ineligible and retained without inferred
  ownership

#### Scenario: Primary or locked resource is retained
- **WHEN** a resource is primary or locked
- **THEN** it is classified ineligible and retained

### Requirement: Partial cleanup cannot release or complete
A cleanup run with any blocked outcome SHALL NOT release a claim or report
completion.

#### Scenario: Blocked outcome blocks completion
- **WHEN** any cleanup outcome is blocked
- **THEN** the run is partial and claim release is not authorized

#### Scenario: All outcomes converge
- **WHEN** every cleanup outcome is completed or already-completed
- **THEN** cleanup may report complete
