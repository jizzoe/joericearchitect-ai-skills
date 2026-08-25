## ADDED Requirements

### Requirement: Codex review invocation uses the built-in read-only sandbox
The Codex strict and degraded reviewer invocation SHALL enforce read-only
filesystem and network-off isolation through the built-in `--sandbox read-only`
mode rather than a beta `permissions.<name>.filesystem` profile. The invocation
SHALL NOT pass a `default_permissions` or `permissions.<name>.filesystem` config
that routes Codex's own file reads through an OS sandbox helper that can fail on
the host.

#### Scenario: Codex reviewer starts without a custom-profile sandbox helper
- **WHEN** the Codex adapter constructs its strict or degraded invocation
- **THEN** it includes `--sandbox read-only` and omits the beta
  `default_permissions`/`permissions.<name>.filesystem` config, so Codex reaches
  normal reviewer startup rather than a `sandbox-exec` re-exec failure

#### Scenario: Read-only and network-off remain enforced
- **WHEN** the Codex reviewer runs under `--sandbox read-only`
- **THEN** model-generated commands cannot write outside the read boundary and
  network access remains off by default

### Requirement: Reviewer findings schema uses a portable JSON Schema dialect
The findings schema SHALL declare a JSON Schema dialect that both the Codex
`--output-schema` file reader and the Claude `--json-schema` inline validator
accept. It SHALL NOT declare a `$schema` or `$id` URI that either reviewer CLI
cannot resolve offline.

#### Scenario: Claude accepts the findings schema
- **WHEN** the Claude adapter passes the findings schema to `--json-schema`
- **THEN** Claude Code reaches normal reviewer startup instead of rejecting an
  unresolved draft URI

#### Scenario: Codex still accepts the findings schema
- **WHEN** the Codex adapter passes the findings schema file to `--output-schema`
- **THEN** Codex reads the schema and produces schema-valid structured output

### Requirement: Claude reviewer provisions isolated authentication
The Claude reviewer SHALL provision authentication into its isolated reviewer
environment so it can run without the host's interactive OAuth session, mirroring
Codex's authentication provisioning. It SHALL copy the host's bounded,
ownership-checked Claude authentication artifact into the isolated `HOME` or
inject a supported API-key environment variable, and SHALL NOT require the
host's keychain or an interactive login.

#### Scenario: Isolated Claude reviewer authenticates
- **WHEN** the Claude adapter prepares its reviewer environment
- **THEN** it copies the host's bounded Claude auth artifact into the isolated
  `HOME` or injects a supported API-key environment variable, and Claude Code
  reaches authenticated reviewer startup

#### Scenario: Missing or oversized auth artifact fails closed
- **WHEN** the host Claude auth artifact is absent, oversized, or not a regular
  file
- **THEN** the adapter reports a stable unavailable diagnostic and does not
  claim strict isolation or broaden reviewer permissions
