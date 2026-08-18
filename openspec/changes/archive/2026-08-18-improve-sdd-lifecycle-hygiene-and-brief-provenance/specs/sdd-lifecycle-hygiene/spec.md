## Purpose

Defines safe, portable SDD lifecycle-hygiene behavior for durable design-brief
provenance and read-only reconciliation of delivered local resources.

## ADDED Requirements

### Requirement: Selected design briefs have immutable change-local provenance
The lifecycle-hygiene capability SHALL accept an optional explicit design-brief
path only when it resolves inside the selected workspace to a regular Markdown
file. Before normal proposal artifacts are reported complete, it MUST copy the
selected source atomically to `context/design-brief.md` and write
`context/design-brief-provenance.yaml` containing only the workspace-relative
source path, source SHA-256 digest, copy timestamp, selection mode, and change
identifier. It MUST reject absolute paths, traversal, symlinks escaping the
workspace, malformed source files, conflicting existing provenance, and failed
atomic writes without claiming capture succeeded. The copied brief and its
record MUST remain unchanged through Archive.

#### Scenario: Explicit brief is captured
- **WHEN** a proposal names an in-workspace Markdown design brief and the
  destination has no conflicting provenance
- **THEN** the lifecycle writes the immutable copy and digest-bound metadata
  before it reports proposal setup complete

#### Scenario: Unsafe or failed capture is rejected
- **WHEN** the requested brief path is absolute, escapes the workspace, is not
  a regular Markdown file, or either atomic output cannot be committed
- **THEN** the lifecycle reports a path or write failure and leaves no partial
  provenance pair behind

### Requirement: Brief selection is explicit and optional
Without an explicit source brief, an interactive lifecycle-hygiene run SHALL
discover at most three deterministic candidates under
`ai-planning/design-briefs/` and present a distinct no-selection outcome. It
MUST rank exact change or issue references before shared capability terms and
explicit links, then use normalized modification time and workspace-relative
path as deterministic tie-breakers. It MUST never copy a candidate until the
user explicitly selects it. An autonomous run MUST record no selected brief
unless its durable authorization already includes the explicit path.

#### Scenario: User declines suggested candidates
- **WHEN** candidate discovery returns related briefs and the user selects none
- **THEN** normal proposal planning continues without a copied brief or
  provenance metadata

#### Scenario: Autonomous proposal has no source path
- **WHEN** an autonomous lifecycle authorization omits an explicit brief path
- **THEN** the lifecycle does not infer, copy, or claim a source brief

### Requirement: Reconciliation reports evidence without mutating resources
The lifecycle-hygiene capability SHALL produce an idempotent, read-only report
from the selected repository's origin default branch, local branches,
worktrees, active changes, archive entries, and relevant living specifications.
When GitHub CLI lookup is available it MUST include linked pull-request state;
when that lookup is unavailable it MUST explicitly label the report
`local-only` and identify the missing evidence. It MUST classify each inspected
resource as `delivered-and-safe-to-retire`, `delivered-but-dirty`,
`duplicate-ref-alias`, `genuinely-divergent`, or `ambiguous` using delivery,
archive, specification, and pull-request evidence in addition to ancestry.
The report MUST not delete, reset, rewrite, create, or modify Git, GitHub, or
OpenSpec resources.

#### Scenario: Squash-delivered branch is not treated as unfinished
- **WHEN** a local branch is not an ancestor of the default branch but exact
  merged pull-request and archive/spec evidence show its capability delivered
- **THEN** the report classifies it from that delivery evidence rather than
  reporting it as genuinely divergent based on ancestry alone

#### Scenario: GitHub lookup is unavailable
- **WHEN** GitHub CLI is missing, unauthenticated, or cannot complete the
  requested read-only lookup
- **THEN** the report remains non-mutating, returns the local evidence, and
  labels its classification limitations as a local-only evidence gap

### Requirement: Archive exposes exact cleanup recommendations safely
After Archive evidence is available, the lifecycle-hygiene capability SHALL
include a visible cleanup report for the exact inspected branch or worktree.
It MAY recommend a resource only when current delivery evidence and fresh
cleanliness inspection support it, and MUST preserve existing exact-owned
cleanup authorization requirements for any deletion. It MUST classify dirty,
locked, primary, legacy, unregistered, ambiguous, or evidence-mismatched
resources as non-removable with a recovery explanation.

#### Scenario: Dirty historical worktree is inspected
- **WHEN** reconciliation finds a worktree with staged, unstaged, or untracked
  changes
- **THEN** the report labels it `delivered-but-dirty` or `ambiguous`, leaves it
  intact, and does not recommend removal

#### Scenario: Clean delivered resource is reported
- **WHEN** current archive and delivery evidence plus fresh inspection prove a
  non-primary exact resource clean and delivered
- **THEN** the report may recommend its exact retirement while stating that a
  separate authorized cleanup action is required

### Requirement: Canonical workflow is portable across assistants
The repository SHALL provide one canonical assistant-neutral
`sdd-lifecycle-hygiene` skill and thin Claude and Codex adapters that point to
it. Reusable behavior MUST obtain repository, default branch, GitHub lookup,
and paths from arguments or repository configuration rather than embedded
product-specific constants.

#### Scenario: Adapter inventory is inspected
- **WHEN** Claude or Codex discovers the lifecycle-hygiene skill
- **THEN** its adapter points only to the canonical base skill and does not
  duplicate implementation policy
