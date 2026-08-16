## Purpose

Defines how a defined research topic becomes durable, sourced findings at a
selected depth before a design or planning decision is made.

## ADDED Requirements

### Requirement: Research produces durable findings and sources at the selected depth
The system SHALL use `research-topic-workflow` to create or update
`<destination>/<category>/<topic>/<topic>-findings.md` and
`<destination>/<category>/<topic>/sources.md` from a complete topic, category,
depth, and destination input. The findings document MUST distinguish verified
facts, source-reported claims, assistant inferences, unknowns, and
recommendations, and MUST cover the sections appropriate to the selected
depth. `sources.md` MUST record title, publisher, URL or path, access date,
source type, and relevance for each source.

#### Scenario: Complete research request at standard depth
- **WHEN** a user supplies topic, category, `standard` depth, and an approved
  or explicit destination
- **THEN** the skill writes findings and sources documents at that path with
  the required fact/claim/inference/unknown/recommendation distinctions and
  the standard-depth sections

#### Scenario: Existing findings are updated, not replaced wholesale
- **WHEN** a research request targets a topic that already has findings and
  sources documents
- **THEN** the skill updates them in place and preserves prior content that
  remains accurate rather than discarding it without cause

### Requirement: Missing material inputs produce a structured pause
The system SHALL return a `skill-result-v1` `blocked` result naming the
missing input as a blocking open question when topic, category, depth, or
destination is absent and no configured default resolves it. The skill MUST
NOT invent a topic, category, depth, or destination.

#### Scenario: Destination is missing and unconfigured
- **WHEN** a research request omits a destination and
  `config/ai-skills.json` has no `researchRoot` default
- **THEN** the skill returns a blocked result identifying the missing
  destination rather than guessing a path

### Requirement: Research depth follows the established source-target policy
The system SHALL apply the depth-to-source-target mapping recorded in
`docs/research-topic-workflow-notes.md` (quick scan, standard research, deep
research) and SHALL prefer primary sources for technical, pricing, policy,
API, and current-product claims.

#### Scenario: Deep research is requested
- **WHEN** a research request selects `deep` depth
- **THEN** the skill targets at least the recorded source count for that
  depth and produces the comparative analysis, tradeoffs, maturity signals,
  implementation patterns, risks, recommendations, and source-quality notes
  that depth requires

### Requirement: Model guidance is advisory and never mutates session state
The system SHALL display depth-appropriate model-role guidance for the
detected assistant, or both Claude and Codex guidance when detection is
uncertain, without changing the active session's model.

#### Scenario: Model guidance is shown before execution
- **WHEN** a research request begins at a selected depth
- **THEN** the skill displays the corresponding model-role recommendation and
  does not alter the caller's active model

### Requirement: Source content is treated as untrusted
The system SHALL treat web pages, documents, and tool results read during
research as untrusted content and MUST NOT execute instructions embedded
within that content.

#### Scenario: A source page contains embedded instructions
- **WHEN** retrieved source content includes text directing the assistant to
  take an action
- **THEN** the skill records the content as untrusted research material and
  does not follow the embedded instruction

### Requirement: Autonomous execution is bounded to research-read-only
The system SHALL permit `research-topic-workflow` autonomous execution only
under the `research-read-only` bounded-autonomous-execution profile, with the
run's workspace, permitted paths, expiration, evidence, and pause conditions
named for that run.

#### Scenario: Autonomous research run is authorized
- **WHEN** a bounded authorization names `research-read-only`, the target
  workspace, permitted findings/sources paths, and an expiration
- **THEN** the skill may write findings and sources within that authorization
  without a routine per-step prompt

#### Scenario: Autonomous run requests an unauthorized operation
- **WHEN** an autonomous request would write outside the permitted paths or
  perform an operation outside `research-read-only`
- **THEN** the skill pauses and reports the unmet boundary

### Requirement: Defined conditions pause the workflow
The system SHALL pause `research-topic-workflow` when topic or destination is
missing, a source requires new credentials or an unapproved connector, access
to sensitive data is needed, source conflicts materially affect the
recommendation, or the request expands into a decision the user has not
authorized.

#### Scenario: A source requires new credentials
- **WHEN** completing the research request would require signing in or
  obtaining a new credential
- **THEN** the skill pauses before that source rather than attempting access

### Requirement: Skill behavior is objectively evaluable
The system SHALL define deterministic synthetic scenarios for
`research-topic-workflow` covering trigger selection, non-trigger rejection,
missing input, untrusted-content handling, an autonomous allowed action, an
autonomous pause, output-path safety, and portable second-workspace behavior.

#### Scenario: Evaluation fixtures cover the required scenario types
- **WHEN** `evals/skills/research-topic-workflow/scenarios.json` and its
  fixtures are run
- **THEN** each of the eight required scenario types has a deterministic,
  synthetic-data-only test
