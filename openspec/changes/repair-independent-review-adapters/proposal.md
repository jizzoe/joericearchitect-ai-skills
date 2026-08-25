# Repair Independent Review Adapters

## Why

The M4-S4 single-change reliability qualification surfaced three defects that
make both strict reviewers fail closed in production. Each is a machinery defect
in the review adapters (`scripts/sdd/platform-review-adapters.mjs` +
`schemas/independent-review-findings-v1.schema.json`), not a review-logic defect:

1. **Codex `sandbox-exec` re-exec failure (finding #4).** The codex invocation
   uses the beta `permissions` profile
   (`--config default_permissions="sealed-review"` +
   `--config permissions.sealed-review={filesystem={":minimal"="read",...}}`).
   That custom filesystem profile routes codex's own reads (e.g. `AGENTS.md`)
   through the macOS `sandbox-exec` helper, which fails with
   `execvp() ... Operation not permitted` (exit 71). Codex's built-in
   `--sandbox read-only` works and, per the Codex docs, network access is off by
   default in local sandbox modes, so read-only + network-off is already
   enforced without the beta profile.

2. **Claude `--json-schema` rejects the findings schema (finding #5).** The
   schema declares `"$schema": "https://json-schema.org/draft/2020-12/schema"`,
   which Claude Code's `--json-schema` validator cannot resolve offline
   (`no schema with key or ref "…draft/2020-12/schema"`). Draft-07 is accepted.

3. **Claude reviewer has no authentication provisioning (finding #7).**
   `buildClaudeReviewInvocation` runs Claude with an isolated `HOME` plus
   `--setting-sources ""`, so the host's `~/.claude.json` OAuth is invisible and
   no API key is injected — the reviewer reports `Not logged in` even when the
   host user is logged in. Codex provisions auth by copying `~/.codex/auth.json`
   into the isolated `CODEX_HOME`; Claude has no equivalent step.

## What Changes

- **Codex**: replace the beta `permissions.sealed-review` profile with the
  built-in `--sandbox read-only` in the strict and degraded invocations.
- **Schema**: change `schemas/independent-review-findings-v1.schema.json` to a
  portable dialect (draft-07) accepted by both Codex `--output-schema` and
  Claude `--json-schema`.
- **Claude**: provision isolated authentication (copy the host's bounded Claude
  auth artifact into the isolated `HOME`, or inject a supported API-key
  environment variable), mirroring codex's `prepareCodexReviewerEnvironment`.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `isolated-independent-review`: codex sandbox mode, portable findings-schema
  dialect, and Claude reviewer authentication provisioning.

## Impact

- `scripts/sdd/platform-review-adapters.mjs` (codex + Claude invocation
  construction and environment preparation).
- `schemas/independent-review-findings-v1.schema.json` (dialect).
- Focused adapter tests in `scripts/sdd/test/`.

## Research basis

- OpenAI Codex docs: local CLI/IDE sandbox modes are OS-enforced; the default
  `workspace-write` sandbox keeps network off unless `network_access = true`;
  `read-only` grants no edits; the `permissions.<name>` profiles are a beta
  feature. Empirically, `--sandbox read-only` completed a real strict review on
  this host while the beta profile failed at `sandbox-exec`.
- Anthropic Claude Code docs: `ANTHROPIC_API_KEY` skips the login prompt;
  `claude setup-token` produces a long-lived `CLAUDE_CODE_OAUTH_TOKEN` for CI;
  `apiKeyHelper` runs a command for the key; bare/headless runs need an API key
  or helper, not the host OAuth session. Empirically, draft-07 `$schema` is
  accepted by `--json-schema` while draft 2020-12 is rejected.
