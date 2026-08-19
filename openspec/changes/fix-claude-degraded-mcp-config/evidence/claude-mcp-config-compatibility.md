# Claude MCP Configuration Compatibility Evidence

Date: 2026-08-19

- Supported local Claude Code version: `2.1.220`.
- The degraded-review invocation now passes the explicit zero-server JSON
  object `{"mcpServers":{}}` together with `--strict-mcp-config`.
- The focused adapter contract test asserts that exact argument pair, the
  read/search-only tool boundary, and credential scrubbing without starting an
  authenticated reviewer or retaining reviewer output.
- Authentication remains a separate fail-closed runtime condition. This
  evidence does not claim Claude strict-review availability or alter any Claude
  configuration, credential, or assurance boundary.
