# skill-install-utility Specification

## Purpose

Provides a safe, repeatable command for invoking GitHub CLI global skill
installation from either a local checkout or a remote GitHub source.

## Requirements

### Requirement: Explicit local and remote global installation
The utility SHALL invoke `gh skill install` at user scope when the caller
supplies exactly one source mode (`local` or `remote`), an agent, and either an
explicit skill path or an all-skills selector. Local mode SHALL pass the source
directory through `--from-local`; remote mode SHALL pass the owner/repository
source directly to `gh`.

#### Scenario: A developer installs a local skill globally
- **WHEN** a caller supplies a local checkout, explicit skill path, and Codex
  agent
- **THEN** the utility invokes `gh skill install` with `--from-local`,
  `--agent codex`, and `--scope user` without requiring a commit or push

#### Scenario: A maintainer installs reviewed remote skills globally
- **WHEN** a caller supplies a remote owner/repository, all-skills selector,
  and an agent
- **THEN** the utility invokes `gh skill install` with that remote source and
  user scope

#### Scenario: Source or selection is ambiguous
- **WHEN** a caller omits a source, supplies both sources, or omits a skill
  path and the all-skills selector
- **THEN** the utility exits nonzero with a correction message and does not
  invoke `gh`

### Requirement: Destructive and version choices are explicit
The utility SHALL pass overwrite behavior only when the caller supplies an
explicit force option. It SHALL accept a pin only for remote sources and SHALL
report that an unpinned remote installation resolves through GitHub CLI's
normal mutable-version behavior.

#### Scenario: A developer refreshes a local global copy
- **WHEN** a caller supplies the explicit force option with a local source
- **THEN** the utility passes `--force` only for the selected skill or
  explicitly selected all-skills operation

#### Scenario: A caller pins a remote release
- **WHEN** a caller supplies a remote source and a tag or commit pin
- **THEN** the utility passes that pin to `gh` and reports it in the result

#### Scenario: A caller pins a local source
- **WHEN** a caller supplies a pin with local mode
- **THEN** the utility exits nonzero and does not invoke `gh`

### Requirement: Dry runs and failures remain observable and safe
The utility SHALL provide a dry-run mode that prints the exact redacted command
arguments and performs no installation. It SHALL execute `gh` without shell
interpolation, preserve its nonzero exit status, and avoid logging credentials
or mutating assistant configuration outside `gh`'s selected user-scope skill
destination.

#### Scenario: A caller previews an installation
- **WHEN** a caller supplies dry-run mode
- **THEN** the utility reports the planned `gh skill install` invocation and
  does not start `gh`

#### Scenario: GitHub CLI installation fails
- **WHEN** `gh skill install` exits nonzero
- **THEN** the utility exits with the same failure status and gives no false
  success result
