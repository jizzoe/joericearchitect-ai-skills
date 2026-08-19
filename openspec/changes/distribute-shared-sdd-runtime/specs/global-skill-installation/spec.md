## MODIFIED Requirements

### Requirement: Global installation guidance supports both agents
The repository SHALL document a tested global installation workflow that uses
GitHub CLI `gh skill` for canonical Claude Code and Codex skill packages and a
matching shared SDD runtime distribution for executable helpers. The guide
SHALL identify prerequisites, trust review and preview, verified bootstrap of
the installer itself, reviewed local or pinned remote source selection,
explicit overwrite behavior, runtime and skill version pairing, listing or
verification, required PATH/new-session activation, paired updates, drift
detection, rollback, troubleshooting, and the installed source's ownership
boundary. The guide SHALL NOT present a skills-only update command as a
supported way to update a paired installation. The documented prerequisites
SHALL include Node 20 or newer and explain that the installer fails closed
rather than installing or configuring Node.

#### Scenario: A user installs for one supported agent
- **WHEN** a user follows the documented Claude Code-only or Codex-only
  installation steps with the stated prerequisites
- **THEN** the instructions supply a previewable user-scope `gh skill` command
  or supported paired installer, install the matching runtime, and provide an
  agent-specific verification path

#### Scenario: A user needs both supported agents
- **WHEN** a user follows the documented dual-agent flow
- **THEN** the instructions distinguish each agent selection while preserving
  one reviewed source revision, one matching runtime digest, and one
  verification path per agent

#### Scenario: Installation cannot proceed safely
- **WHEN** a prerequisite is missing, a destination conflicts with user-authored
  content, the runtime cannot validate or activate, or agent discovery fails
  after the documented reload step
- **THEN** the guide directs the user to inspect, resolve, or report the
  condition without silently overwriting files, changing global approval or
  credential configuration, or claiming an operational installation

#### Scenario: A user obtains the installer
- **WHEN** a user without a source checkout needs the paired installer
- **THEN** the guide directs them to download the pinned release artifact and
  verify its attestation before execution, and does not instruct them to pipe a
  remote script directly into a shell

#### Scenario: An installed pair drifts
- **WHEN** installed skills and the active runtime no longer satisfy the
  declared contract version
- **THEN** the guide directs the user to the diagnostic command and the paired
  update or rollback path rather than a skills-only update

#### Scenario: Node or PATH activation is unavailable
- **WHEN** Node is missing or incompatible, or the selected launcher location
  is not active in a new session
- **THEN** the guide provides the chosen preflight or activation recovery path
  without silently modifying shell startup files or claiming the runtime is
  operational

### Requirement: Installation behavior is evidenced in isolation
The repository SHALL retain reproducible evidence from disposable isolated
fixtures for the documented paired skill-and-runtime installation flow on the
declared supported Claude Code and Codex versions. The evidence SHALL record
the GitHub CLI and agent versions, reviewed source, runtime digest, selected
scope, resulting destinations, launcher resolution, discovery result, and one
successful declared-helper invocation per agent; it SHALL report unavailable
prerequisites or unsupported behavior as a failed or blocked result rather
than success.

#### Scenario: Cross-agent fixture succeeds
- **WHEN** a clean fixture runs the supported paired flow for Claude Code and
  Codex
- **THEN** it confirms the installed canonical skills are discovered and every
  helper they reference resolves through the matching installed runtime without
  using a user's actual global home

#### Scenario: Fixture evidence is incomplete
- **WHEN** a fixture cannot establish skill installation, runtime activation,
  helper invocation, discovery, or agent invocation
- **THEN** it records the exact unavailable prerequisite or failure and the
  release does not claim support for that agent/version pair

### Requirement: Custom installer work remains evidence-gated
The repository SHALL retain GitHub CLI `gh skill` as the authority for skill
source selection, pinning, provenance, conflict behavior, and skill-directory
installation. A repository-owned distribution utility SHALL add only the
shared runtime package, pairing receipt, runtime validation, and recovery
behavior required by evidenced executable-dependency gaps; it SHALL NOT replace
or duplicate GitHub CLI's skill-installation responsibilities.

#### Scenario: A paired distribution is installed
- **WHEN** a documented installer installs canonical skills and a shared
  runtime from one reviewed source revision
- **THEN** it delegates skill installation to `gh skill` and records the
  matching runtime identity separately

#### Scenario: An unrelated installer feature is proposed
- **WHEN** a proposed installer change would duplicate GitHub CLI source,
  pinning, provenance, update, or conflict behavior unrelated to the shared
  executable runtime gap
- **THEN** the design rejects that scope or requires separate evidence and
  authorization before implementation

#### Scenario: The supported installer flow passes
- **WHEN** isolated fixtures establish that `gh skill` installs and activates
  the canonical skill packages correctly
- **THEN** release documentation retains `gh skill` as the supported skill
  installer and the distribution utility does not replace it

#### Scenario: The supported installer has a demonstrated gap
- **WHEN** a repeatable installed-profile fixture shows that a canonical skill
  needs an executable dependency which `gh skill` does not distribute
- **THEN** the evidence supports the narrowly scoped shared-runtime companion
  specified by this change, rather than a duplicate skill installer
