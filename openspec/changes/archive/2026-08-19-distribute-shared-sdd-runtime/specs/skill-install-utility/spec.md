## ADDED Requirements

### Requirement: Installation results are machine readable for paired callers
The utility SHALL emit a machine-readable result describing the selected source
mode, source identity, agent, skill selection, pin, overwrite intent, dry-run
state, invoked command with credentials redacted, and outcome. Paired
distribution entrypoints SHALL consume that result rather than reimplementing
GitHub CLI argument construction, source-mode validation, or redaction. The
utility SHALL remain the single repository owner of `gh skill install`
invocation.

#### Scenario: A paired installer delegates skill installation
- **WHEN** a Bash or PowerShell distribution entrypoint installs canonical
  skills as part of a paired skill-and-runtime installation
- **THEN** it invokes this utility and consumes its machine-readable result
  instead of constructing GitHub CLI arguments itself

#### Scenario: A caller parses a failed installation
- **WHEN** the utility fails validation or the underlying GitHub CLI invocation
  fails
- **THEN** the machine-readable result states the failed phase and redacted
  command so the calling entrypoint can report a recovery code without scraping
  human-readable output
