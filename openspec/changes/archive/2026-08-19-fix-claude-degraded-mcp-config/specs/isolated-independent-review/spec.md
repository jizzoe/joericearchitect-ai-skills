## ADDED Requirements

### Requirement: Claude degraded review invocation is CLI-valid
When an exact degraded-review authorization selects the Claude adapter, the
system SHALL construct a no-MCP Claude invocation that the supported Claude
Code version accepts before reviewer authentication or review execution.

#### Scenario: Empty MCP configuration is accepted
- **WHEN** the Claude degraded adapter constructs an invocation with no MCP
  servers
- **THEN** its MCP configuration has the CLI-valid `mcpServers` object shape
  and the CLI reaches normal reviewer startup rather than rejecting malformed
  MCP configuration

#### Scenario: Claude remains unavailable after valid startup configuration
- **WHEN** the CLI-valid Claude degraded invocation cannot authenticate or
  establish another required reviewer boundary
- **THEN** the system reports the relevant safe unavailable result and does not
  claim strict isolation or broaden reviewer permissions
