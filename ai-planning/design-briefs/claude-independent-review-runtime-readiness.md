# Claude Independent-Review Runtime Readiness

Date: 2026-08-18
Status: Design brief — live evidence establishes a blocking runtime defect;
ready for OpenSpec Propose.

## Purpose

Harden and prove the Claude side of isolated independent review without
weakening its boundary. Codex and Claude remain peer adapters to one canonical
protocol; this brief is limited to the Claude runtime defects and verification
discovered in the archived cross-tool inventory.

## Live evidence (2026-08-18)

The owner’s normal Claude Code session is healthy: `claude auth status --text`
reports a Claude Pro login and `claude doctor` reports no installation issue on
macOS arm64, Claude Code 2.1.220.

A disposable canary then reproduced the strict adapter's isolated launch:

- The strict invocation started with only `Read`, `Glob`, and `Grep`, no MCP
  servers, temporary settings, and a temporary reviewer home.
- It failed before any tool call with `Not logged in · Please run /login` and
  `apiKeySource: none`.
- Follow-up status-only diagnostics show that authentication fails under both
  the adapter's temporary home/configuration state and its deliberately
  stripped environment—even when the normal home is restored. The exact
  required credential-discovery state is not documented, so the launcher
  cannot safely restore it by guesswork. No canary file was read, no repository
  file changed, no credential was printed, and all disposable directories were
  removed.
- A preliminary compatibility check also found that Claude Code 2.1.220
  rejects `--mcp-config "{}"` because it requires an `mcpServers` object.
  The valid empty form, `--mcp-config '{"mcpServers":{}}'`, initializes with
  zero MCP servers. The current degraded Claude invocation uses the invalid
  form.

The former question of whether the strict sandbox is silently ignored cannot
be answered until strict launch authenticates. The current blocker is terminal
`unavailable`, not a reason to fall back to self-review or claim strict
assurance.

## Required outcomes

1. The strict Claude reviewer SHALL authenticate while retaining isolated,
   nonpersistent configuration and without exposing a credential in logs,
   repository files, command arguments, or a broad inherited environment.
2. The chosen authentication handoff SHALL be explicitly threat-modelled and
   fail closed. Do not simply restore the ordinary user home or inject a
   long-lived token without bounded handling and evidence.
3. A documented, authenticated live canary SHALL prove that the effective
   strict settings block a harmless out-of-scope read. The test must record
   observable tool/permission evidence, not rely solely on reviewer prose.
4. The degraded Claude invocation SHALL use valid 2.1.220 MCP configuration
   or remove the redundant argument when safe mode already proves no MCP
   servers; it must not fail before review for malformed configuration.
5. Confirm whether `Agent` is a current recognized Claude tool. Remove or
   correct that deny-list entry if it is not; preserve explicit deny coverage.
6. Align strict and degraded MCP hardening only with configuration that is
   valid on the supported Claude version.
7. User-facing documentation SHALL describe Claude strict review as
   unavailable pending authenticated live proof until all above evidence passes.

## Constraints

- Never weaken a strict failure into `strict-isolated`, self-review, or an
  unrecorded manual workaround.
- Preserve the sealed detached view, temporary settings, credential scrubbing,
  read/search-only tools, fresh context, and noninteractive result contract.
- Do not place OAuth tokens in tracked or untracked repository files, shell
  history, or durable evidence.
- Run live tests only against disposable canaries and retain safe structured
  diagnostics.

## Proposal shape

One change: `harden-claude-independent-review-runtime-readiness`. It first
chooses and implements a bounded authentication strategy, then adds live
canary guidance/evidence, repairs the invalid degraded MCP invocation, resolves
the deny-list audit item, updates docs, and proves strict results only after
all runtime evidence succeeds.
