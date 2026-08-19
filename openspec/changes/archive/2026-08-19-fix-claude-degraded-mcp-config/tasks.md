## 1. Claude degraded invocation

- [x] 1.1 Replace the malformed empty MCP configuration with the validated
  empty `mcpServers` object while preserving the existing strict MCP flag,
  tool allowlist, and credential scrubbing.

## 2. Regression evidence

- [x] 2.1 Extend the focused platform-review-adapter tests to assert the
  exact valid empty MCP configuration and zero-MCP degraded invocation shape.
- [x] 2.2 Run the focused adapter test suite and strict OpenSpec validation;
  record the supported Claude Code 2.1.220 compatibility evidence without
  logging credentials or raw reviewer output.
