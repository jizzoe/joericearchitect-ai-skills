## MODIFIED Requirements

### Requirement: Every declared helper is dispatchable through one contract
Each shared helper referenced by a canonical skill SHALL be reachable through
the runtime launcher without requiring a caller to import a module path. A
helper that exports functions rather than providing a command-line entrypoint
SHALL gain an executable entrypoint declared in the manifest, either a payload
wrapper that reads a JSON request and writes a JSON result or an enumerated
subcommand set. A safety-sensitive controller terminalization or v2 delivery
initialization operation MUST be an explicitly declared subcommand and MUST
accept only a structured request. The initialization subcommand MUST return
machine-readable matching v2-run and controller-record identities before any
lifecycle action is eligible. The launcher SHALL NOT expose any command that
resolves or returns an importable module path.

#### Scenario: A former library-only helper is invoked
- **WHEN** an installed canonical skill needs a helper that previously exported
  functions with no command-line entrypoint
- **THEN** it invokes the declared entrypoint through the launcher with an
  explicit payload and receives a machine-readable result

#### Scenario: Terminalization is requested through the installed runtime
- **WHEN** an authorized caller requests controller terminalization for an
  exact run
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
