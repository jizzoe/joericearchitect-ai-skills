## Why

Claude Code 2.1.220 rejects the degraded reviewer launcher's
`--mcp-config "{}"` argument before a reviewer can start. A documented,
strict degraded-review request therefore fails for malformed CLI configuration
rather than producing its intended bounded result or a meaningful runtime
unavailable diagnostic.

## What Changes

- Replace the malformed empty MCP configuration with the CLI-valid empty
  `mcpServers` configuration in the Claude degraded-review invocation.
- Add a focused regression test for the exact argument shape and a
  version-compatible invocation preflight.
- Preserve the existing strict-first, read/search-only, nonpersistent,
  credential-scrubbed degraded-review boundary; this does not make the current
  Claude strict reviewer available.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `isolated-independent-review`: Claude's authorized degraded reviewer must
  form a CLI-valid no-MCP invocation before its normal runtime checks.

## Impact

- `scripts/sdd/platform-review-adapters.mjs` and its focused tests.
- The Claude degraded independent-review path only; no user credentials,
  global Claude configuration, canonical skill policy, or Codex behavior.
