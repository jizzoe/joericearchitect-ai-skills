# Live Adapter Acceptance — 2026-08-13

The authorized acceptance package was built from immutable committed objects:

- base: `90f571533be06ab6c1d626647851a2147dce6d16`
- head: `91d9a0119325e2cf44e0645bd8b61d3ca3456bed`
- manifest: `6d62ade60028f221dd7349300f56c084404512596806d9917694ba97c7ab3549`

Both adapters received only this sealed package through a disposable detached
worktree. The worktree was removed after each run; neither invocation modified
the repository, Git/GitHub state, credentials, or an external system.

## Codex

`codex exec` started a fresh ephemeral session with `--sandbox read-only`,
`--ignore-user-config`, and `--ignore-rules`. The OS sandbox denied the
temporary cache writes needed by the macOS Git shim while the reviewer was
deriving the exact diff. No structured review result was emitted. The exact
fail-closed result is [codex-read-only-runtime-unavailable.json](codex-read-only-runtime-unavailable.json).

## Claude

`claude --print` started with a temporary settings file that enabled sandboxing,
set `failIfUnavailable`, disabled unsandboxed fallback, removed mutation tools,
and excluded inherited settings. It emitted no structured result. Because the
noninteractive CLI can ignore an invalid settings file silently, absence of a
result cannot prove the sandbox was active; the adapter therefore records an
unavailable outcome instead of accepting a reviewer self-attestation. The
exact fail-closed result is [claude-temporary-sandbox-runtime-unavailable.json](claude-temporary-sandbox-runtime-unavailable.json).
