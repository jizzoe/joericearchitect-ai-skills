## Context

See `proposal.md` for motivation. The Claude degraded adapter currently passes
`--strict-mcp-config --mcp-config "{}"`; Claude Code 2.1.220 rejects that
payload before ordinary startup. A disposable compatibility run established
that `{"mcpServers":{}}` starts with zero MCP servers and then reaches the
separate known authentication gate.

## Goals / Non-Goals

**Goals:**

- Make the degraded adapter's explicit MCP lockdown valid on the supported CLI.
- Prevent regression with a focused invocation-contract test.

**Non-Goals:**

- Repair strict Claude authentication, change assurance levels, enable MCP,
  relax safe mode, or forward credentials.

## Decisions

- Use `{"mcpServers":{}}` as the explicit empty MCP configuration. It is the
  smallest valid replacement and retains `--strict-mcp-config` audit clarity.
- Preserve all current tool restrictions and credential scrubbing. The change
  only permits the CLI to reach its normal, still fail-closed startup path.
- Assert the exact JSON string in unit tests; no authenticated live call is
  required for this deterministic argument contract.

## Risks / Trade-offs

- A future CLI schema change could invalidate the payload → retain the focused
  invocation assertion and record the tested Claude version in evidence.
- Valid configuration may expose the existing authentication unavailability →
  preserve that terminal unavailable result; it belongs to the separate
  runtime-readiness change.

## Reuse Plan

The canonical adapter remains in `scripts/sdd/platform-review-adapters.mjs`.
Claude and Codex skill exposure remains thin and unchanged; no repository,
credential, or product-specific value is introduced.
