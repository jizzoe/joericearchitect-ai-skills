## Purpose

Defines how the reusable SDD executable runtime is built, installed, resolved,
and verified with globally distributed Claude Code and Codex skill packages.

## Requirements

### Requirement: A complete shared runtime is built from reviewed source
The repository SHALL provide a deterministic runtime-distribution builder that
stages the declared shared SDD helper roots, their local dependency closure,
and the declared non-executable asset roots those helpers read from one
reviewed source revision. Staging SHALL preserve repository-relative layout so
that helper paths resolved from module location remain valid. The staged
runtime SHALL contain a manifest with a schema version, contract version,
source revision identity, entrypoint inventory with per-entrypoint invocation
shape, and content digest. Before promoting a staged runtime, the builder SHALL
smoke-invoke every declared entrypoint against the staging directory. The
builder SHALL fail without producing an installable runtime when a declared
helper or asset is missing, a local import resolves outside the declared
closure, a staged file does not match its manifest digest, a smoke invocation
fails, or an unsafe path is encountered.

#### Scenario: A reviewed source builds a runtime
- **WHEN** a maintainer builds the distribution from a reviewed local checkout
  or pinned remote revision with a complete declared helper closure
- **THEN** the builder emits one digest-bound runtime artifact and manifest
  without embedding product-specific repositories, credentials, or approval
  state

#### Scenario: The runtime closure is incomplete
- **WHEN** a declared entrypoint or its local dependency is absent, escapes the
  declared roots, or differs from the staged manifest
- **THEN** the builder fails with the affected entrypoint or path and does not
  mark a runtime artifact installable

#### Scenario: A declared asset is unreachable from the staged layout
- **WHEN** a declared entrypoint reads a packaged data file that was not staged
  or that no longer resolves from the staged layout
- **THEN** the staged smoke invocation fails and the builder reports the
  entrypoint and unresolved asset instead of promoting the artifact

### Requirement: Every declared helper is dispatchable through one contract
Each shared helper referenced by a canonical skill SHALL be reachable through
the runtime launcher without requiring a caller to import a module path. A
helper that exports functions rather than providing a command-line entrypoint
SHALL gain an executable entrypoint declared in the manifest, either a payload
wrapper that reads a JSON request and writes a JSON result or an enumerated
subcommand set. A safety-sensitive controller terminalization operation MUST
or v2 delivery initialization operation MUST be an explicitly declared
subcommand and MUST accept only a structured request. The initialization
subcommand MUST return machine-readable matching v2-run and controller-record
identities before any lifecycle action is eligible. The launcher SHALL NOT
expose any command that resolves or
returns an importable module path.

#### Scenario: A former library-only helper is invoked
- **WHEN** an installed canonical skill needs a helper that previously exported
  functions with no command-line entrypoint
- **THEN** it invokes the declared entrypoint through the launcher with an
  explicit payload and receives a machine-readable result

#### Scenario: Terminalization is requested through the installed runtime
- **WHEN** an authorized caller requests controller terminalization for an exact
  run
- **THEN** it invokes the manifest-declared controller subcommand with a
  structured request rather than importing or directly executing a workspace
  module

#### Scenario: V2 delivery is initialized through the installed runtime
- **WHEN** an authorized canonical lifecycle skill begins a new v2 delivery
- **THEN** it invokes the manifest-declared initialization subcommand and
  receives matching recoverable v2-run and controller-record identities before
  lifecycle selection

#### Scenario: A caller requests a module path
- **WHEN** a caller asks the launcher to resolve, print, or return a filesystem
  path to a runtime module for import
- **THEN** the launcher rejects the request rather than exposing an arbitrary
  executable path

### Requirement: The runtime dispatcher is explicit and fail closed
The installed runtime SHALL expose one stable launcher that accepts only a
manifest-declared helper name, a declared subcommand verb where the helper
declares one, and an explicit target repository. Before dispatch, it SHALL
validate the active manifest, runtime content digest, contract version,
requested helper and verb, and target repository. It SHALL report a stable
classified unavailable result without dispatching when the runtime is missing,
incompatible, tampered, the helper or verb is not declared, or the target is
invalid. The launcher SHALL NOT use a source-checkout-relative helper path or
accept an arbitrary script path from skill or repository content.

#### Scenario: A globally installed skill dispatches a helper
- **WHEN** an installed canonical skill requests a declared SDD helper for an
  explicit valid target repository and the active runtime validates
- **THEN** the launcher executes the matching helper against that target rather
  than requiring `scripts/` to exist in the target workspace

#### Scenario: Runtime state is unavailable or invalid
- **WHEN** the runtime launcher cannot validate its active manifest, content,
  helper name, verb, or target repository
- **THEN** it returns a classified recovery result and does not execute another
  helper, change host permissions, or fall back to arbitrary workspace scripts

#### Scenario: Node or target contract is unavailable
- **WHEN** the launcher cannot find a compatible Node 20-or-newer runtime,
  receives no target repository, or receives a relative or invalid target path
- **THEN** it returns a classified unavailable result without installing Node,
  inferring a target from its own working directory, or dispatching a helper

### Requirement: The launcher validates target shape and never authorization
The launcher SHALL validate only mechanical properties of the target
repository: that the path is absolute, canonical, existing, a Git work tree
root, and free of symlink escape. It SHALL pass the validated target to the
helper unchanged. The launcher SHALL NOT decide whether an operation is
authorized for that target, and SHALL NOT duplicate, cache, or reimplement
helper-level authorization policy.

#### Scenario: A structurally valid but unauthorized operation is requested
- **WHEN** a caller supplies a structurally valid absolute target for an
  operation the helper's own authorization checks would refuse
- **THEN** the launcher dispatches the helper and the helper's existing
  authorization check produces the refusal, rather than the launcher approving
  or refusing the operation itself

#### Scenario: A target path is structurally invalid
- **WHEN** the supplied target is relative, non-canonical, absent, not a Git
  work tree root, or escapes through a symlink
- **THEN** the launcher returns a classified unavailable result and does not
  dispatch

### Requirement: Skill and runtime compatibility is versioned and detectable
The runtime manifest SHALL declare an integer contract version, and every
runtime-dependent canonical skill SHALL declare the contract version it
requires. A contract-version mismatch SHALL be a fail-closed classified pause.
A source-revision difference within one satisfied contract version SHALL be
reported without failing. The runtime SHALL provide a diagnostic command that
emits one machine-readable record of installed skill revision, runtime
revision, contract compatibility, Node version, and activation state for each
selected agent.

#### Scenario: Skills are updated without the runtime
- **WHEN** a user updates installed skills alone and the resulting skills
  require a contract version the active runtime does not provide
- **THEN** dispatch fails closed with the required and active contract versions
  and the documented paired-update recovery path

#### Scenario: Revisions differ within one contract version
- **WHEN** installed skills and the active runtime were built from different
  source revisions but the declared contract version is satisfied
- **THEN** the diagnostic reports the revision difference and dispatch proceeds

#### Scenario: Two agents hold different skill revisions
- **WHEN** Claude Code and Codex skill installations were made at different
  source revisions that both satisfy the active contract version
- **THEN** one shared runtime serves both agents and the diagnostic reports the
  per-agent revision skew as informational

### Requirement: Development mode is supported and labeled
The runtime SHALL support an operator-set environment override that resolves
the runtime from a working tree instead of installed active metadata, and the
repository SHALL provide a supported command to build and link that tree. Every
launcher result, installer receipt, and recorded evidence artifact SHALL state
whether it was produced in development or installed mode. Repository or skill
content SHALL NOT be able to select the runtime location.

#### Scenario: A contributor exercises working-tree changes
- **WHEN** a contributor links the working tree and invokes a migrated skill
- **THEN** the launcher dispatches the working-tree helper and labels the
  result as development mode

#### Scenario: Development evidence is recorded
- **WHEN** evidence is produced while the development override is active
- **THEN** the recorded evidence states development mode rather than presenting
  the result as installed-runtime evidence

#### Scenario: Repository content attempts runtime selection
- **WHEN** a skill file, target repository file, or launcher argument attempts
  to set the runtime location
- **THEN** the launcher ignores it and resolves only from operator environment
  configuration or installed active metadata

### Requirement: Installation updates skills and runtime as one reviewed pair
The repository SHALL provide Bash and Windows PowerShell entrypoints that
install or update selected Claude Code and Codex user-scope skill packages with
the exact matching shared runtime revision. The entrypoints SHALL delegate
GitHub CLI skill installation to the existing repository install utility rather
than reimplementing its source, agent, pinning, overwrite, or redaction
behavior. They SHALL support a reviewed local source and a pinned remote
source, require explicit overwrite intent before replacing existing user-owned
installations, and preserve GitHub CLI responsibility for skill provenance and
destination behavior. Runtime activation SHALL occur atomically only after the
staged manifest and launcher validate.

#### Scenario: A user installs both supported agents
- **WHEN** a user runs a documented installer with both supported agents and a
  reviewed source revision
- **THEN** it installs the selected `gh skill` packages through the existing
  install utility and the matching shared runtime, records a paired receipt,
  and reports any required new-session or PATH activation step

#### Scenario: An update cannot be completed
- **WHEN** source validation, skill installation, runtime validation, or
  activation fails during an update
- **THEN** the entrypoint reports the failed phase, retains the previously
  active validated runtime, and does not claim a complete update

### Requirement: Runtime versions are ordered and locally recoverable
Installed runtime identity SHALL include contract version, source revision,
content digest, and build timestamp, where a development build is distinguished
from a commit-pinned build. Version ordering SHALL come from recorded
installation history rather than from parsing directory names. The installation
SHALL retain the active runtime and the most recently previously-active
runtime, SHALL NOT prune automatically, and SHALL provide a command that
restores the retained prior runtime without network access or GitHub CLI. The
installer receipt SHALL record the prior skill pin so skill rollback remains
possible from local evidence.

#### Scenario: A user rolls back after a bad update
- **WHEN** a user activates the retained prior runtime with no network access
  and no remaining source checkout
- **THEN** the prior validated runtime becomes active and the receipt supplies
  the prior skill pin needed to restore the matching skill revision

#### Scenario: Retention limits are reached
- **WHEN** a new runtime version is activated while an active and one prior
  version already exist
- **THEN** the installation retains the new active and the immediately prior
  version, records the history entry, and does not automatically delete other
  versions without separately authorized pruning

### Requirement: Installed-runtime completeness is evidenced
The repository SHALL provide disposable-profile fixtures that install the
distributed skills and runtime without using an operator's normal profile. The
fixtures SHALL discover every runtime helper referenced by an installed
canonical skill, validate that the helper resolves through the installed
launcher, and exercise representative Claude Code and Codex installation
paths. Cross-platform behavior that does not require network access or GitHub
authentication SHALL be covered by automated checks on the supported platforms,
or the unautomated platform SHALL be documented as experimental rather than
supported. The fixture SHALL report unsupported host prerequisites or a failed
helper invocation as unavailable or failed evidence rather than installation
success.

#### Scenario: Installed profile is complete
- **WHEN** the supported distribution fixture runs for Claude Code or Codex
- **THEN** every runtime helper referenced by that agent's installed canonical
  skills resolves from the paired runtime and the fixture records the source,
  runtime digest, contract version, mode, agent, and invocation evidence

#### Scenario: An installed skill references an unavailable helper
- **WHEN** a canonical skill names a helper absent from the installed runtime
  or a helper that cannot be dispatched through the launcher
- **THEN** the fixture fails with the skill, helper, and resolution failure
  instead of treating Markdown discovery as complete installation

#### Scenario: A supported platform lacks automated evidence
- **WHEN** the network-free cross-platform checks are not exercised for a
  declared platform
- **THEN** documentation marks that platform experimental rather than claiming
  parity with the evidenced platform
